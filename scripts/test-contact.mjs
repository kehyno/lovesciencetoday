// Offline test of the contact function with mocked Turnstile + Resend. Run: node scripts/test-contact.mjs
import assert from 'node:assert/strict';
import { onRequest, validate } from '../functions/api/contact.js';

const rows = [];
const DB = { prepare: () => ({ bind: (...a) => ({ run: async () => { rows.push(a); } }) }) };
const env = { TURNSTILE_SECRET: 's', RESEND_API_KEY: 'r', DB };
let sent = null, turnstileOk = true;
globalThis.fetch = async (url, init) => {
  if (String(url).includes('turnstile')) return new Response(JSON.stringify({ success: turnstileOk }));
  sent = { url: String(url), body: JSON.parse(init.body), auth: init.headers.authorization };
  return new Response('{}', { status: 200 });
};
const post = body => onRequest({ request: new Request('https://x.test/api/contact', { method: 'POST', body: JSON.stringify(body) }), env });
const good = { name: 'Ada Lovelace', email: 'ada@example.com', comments: 'Hello, I would like to book Kehinde.', token: 't' };

let r = await post(good); assert.equal(r.status, 200); assert.equal(sent.body.to[0], 'kehyno@gmail.com'); assert.equal(sent.body.reply_to, 'ada@example.com'); assert.equal(sent.auth, 'Bearer r');
sent = null; turnstileOk = false; r = await post(good); assert.equal(r.status, 403); assert.equal(sent, null);
turnstileOk = true; r = await post({ ...good, website: 'spam.biz' }); assert.equal(r.status, 200); assert.equal(sent, null);        // honeypot: silent, nothing sent
r = await post({ ...good, email: 'nope' }); assert.equal(r.status, 422);
r = await post({ ...good, comments: 'short' }); assert.equal(r.status, 422);
r = await post({ ...good, name: 'Eve\r\nBcc: victim@x.com' }); assert.equal(r.status, 200); assert.ok(!/[\r\n]/.test(sent.body.subject));   // no header injection
r = await onRequest({ request: new Request('https://x.test/api/contact'), env }); assert.equal(r.status, 405);
r = await onRequest({ request: new Request('https://x.test/api/contact', { method: 'POST', body: JSON.stringify(good) }), env: {} }); assert.equal(r.status, 500);
assert.deepEqual(validate({ name: 'Al', email: 'a@b.co', comments: 'long enough text' }).errors, {});
// database stores the message even when email is not configured
sent = null; rows.length = 0; turnstileOk = true;
r = await onRequest({ request: new Request('https://x.test/api/contact', { method: 'POST', body: JSON.stringify(good) }), env: { TURNSTILE_SECRET: 's', DB } });
assert.equal(r.status, 200); assert.equal(rows.length, 1); assert.deepEqual(rows[0].slice(0, 3), ['Ada Lovelace', 'ada@example.com', 'Hello, I would like to book Kehinde.']); assert.equal(sent, null);
// email still works when the database is missing
r = await onRequest({ request: new Request('https://x.test/api/contact', { method: 'POST', body: JSON.stringify(good) }), env: { TURNSTILE_SECRET: 's', RESEND_API_KEY: 'r' } });
assert.equal(r.status, 200); assert.ok(sent);
// database failure with no email -> clear error, not a false success
const badDB = { prepare: () => ({ bind: () => ({ run: async () => { throw new Error('boom'); } }) }) };
r = await onRequest({ request: new Request('https://x.test/api/contact', { method: 'POST', body: JSON.stringify(good) }), env: { TURNSTILE_SECRET: 's', DB: badDB } });
assert.equal(r.status, 502);
console.log('contact function: all checks passed');
