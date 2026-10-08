// GET /api/config: hands the public Turnstile site key to the contact form.
// The site key is public by design. Set it in Cloudflare Pages > Settings > Variables as TURNSTILE_SITEKEY.
export const onRequestGet = ({ env }) =>
  new Response(JSON.stringify({ sitekey: env.TURNSTILE_SITEKEY || '' }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
