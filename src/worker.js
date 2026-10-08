// Cloudflare Worker entry for Workers Builds / `wrangler deploy`.
// Static files are served by the assets binding; only /api/* runs this code.
// The handlers are shared with functions/api/ so the site also works on Cloudflare Pages.
import { onRequest as contact } from '../functions/api/contact.js';
import { onRequestGet as config } from '../functions/api/config.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') return contact({ request, env });
    if (pathname === '/api/config') {
      return request.method === 'GET' ? config({ env }) : new Response('Method not allowed', { status: 405 });
    }
    return env.ASSETS.fetch(request);
  },
};
