// Cloudflare Pages Function: POST /api/contact
// Verifies a Turnstile captcha, saves the message to a Cloudflare D1 database (free tier),
// and optionally also emails it to the show's inbox via Resend.
//
// Cloudflare Pages > Settings:
//   Bindings > D1 database       variable name DB  ->  database "lovesciencetoday"   (see schema.sql)
//   Variables and Secrets:
//     TURNSTILE_SECRET   required  Turnstile secret key (encrypt it)
//     RESEND_API_KEY     optional  Resend API key (encrypt it); enables the email copy
//     CONTACT_TO         optional  email recipient, defaults to kehyno@gmail.com
//     CONTACT_FROM       optional  email sender, defaults to "Love Science Today <onboarding@resend.dev>"

const DEFAULT_TO = 'kehyno@gmail.com';
const DEFAULT_FROM = 'Love Science Today <onboarding@resend.dev>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

// Strip control characters and line breaks so user input can never inject email headers.
const oneLine = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export function validate(input) {
  const name = oneLine(input.name, 80);
  const email = oneLine(input.email, 120);
  const comments = String(input.comments ?? '').replace(/\r\n/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, 2000);
  const errors = {};
  if (name.length < 2) errors.name = 'Please enter your name.';
  if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';
  if (comments.length < 10) errors.comments = 'Please write at least a sentence.';
  return { name, email, comments, errors };
}

async function verifyTurnstile(token, secret, ip) {
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const j = await r.json().catch(() => ({}));
  return j.success === true;
}

// Mirrors schema.sql; lets the form work even if the table was never created by hand.
const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  name TEXT NOT NULL, email TEXT NOT NULL, comments TEXT NOT NULL,
  ip TEXT, user_agent TEXT, emailed INTEGER NOT NULL DEFAULT 0)`.replace(/\s+/g, ' ');

async function saveToDb(db, { name, email, comments }, request) {
  await db.prepare(CREATE_TABLE).run();
  await db.prepare('INSERT INTO contact_messages (name, email, comments, ip, user_agent) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(name, email, comments, request.headers.get('CF-Connecting-IP') || '', oneLine(request.headers.get('User-Agent'), 200)).run();
}

async function sendEmail(env, { name, email, comments }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM || DEFAULT_FROM,
      to: [env.CONTACT_TO || DEFAULT_TO],
      reply_to: email,
      subject: `[Love Science Today] Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nComments:\n${comments}\n\n--\nSent from the Love Science Today contact form.`,
    }),
  });
  if (!res.ok) throw new Error('email failed');
}

export async function onRequestPost({ request, env }) {
  // Needs the captcha secret, plus at least one place to put the message.
  if (!env.TURNSTILE_SECRET || !(env.DB || env.RESEND_API_KEY)) return json({ ok: false, error: 'not_configured' }, 500);

  let input;
  try { input = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }

  // Honeypot: real visitors never see or fill this field. Pretend success so bots learn nothing.
  if (input.website) return json({ ok: true });

  const data = validate(input);
  if (Object.keys(data.errors).length) return json({ ok: false, error: 'invalid', fields: data.errors }, 422);

  const human = await verifyTurnstile(input.token, env.TURNSTILE_SECRET, request.headers.get('CF-Connecting-IP'));
  if (!human) return json({ ok: false, error: 'captcha' }, 403);

  // The database copy is the source of truth; the email is a notification on top of it.
  let saved = false, emailed = false;
  if (env.DB) { try { await saveToDb(env.DB, data, request); saved = true; } catch { /* reported below if nothing else worked */ } }
  if (env.RESEND_API_KEY) { try { await sendEmail(env, data); emailed = true; } catch { /* ditto */ } }
  if (!saved && !emailed) return json({ ok: false, error: 'send_failed' }, 502);
  return json({ ok: true });
}

export const onRequest = ({ request, env }) =>
  request.method === 'POST' ? onRequestPost({ request, env }) : json({ ok: false, error: 'method_not_allowed' }, 405);
