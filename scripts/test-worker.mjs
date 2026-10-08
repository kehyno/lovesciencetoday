// Offline test of src/worker.js routing. Run: node scripts/test-worker.mjs
import assert from 'node:assert/strict';
import worker from '../src/worker.js';

const env = { TURNSTILE_SITEKEY: '0xPUBLIC', ASSETS: { fetch: async req => new Response('asset:' + new URL(req.url).pathname) } };
const call = (path, init) => worker.fetch(new Request('https://x.test' + path, init), env);

let r = await call('/api/config'); assert.equal(r.status, 200); assert.deepEqual(await r.json(), { sitekey: '0xPUBLIC' });
r = await call('/api/config', { method: 'POST' }); assert.equal(r.status, 405);
r = await call('/api/contact'); assert.equal(r.status, 405);                                   // GET is not allowed
r = await call('/api/contact', { method: 'POST', body: 'not json' }); assert.equal(r.status, 500); // no secrets in this test env => not_configured
r = await call('/'); assert.equal(await r.text(), 'asset:/');                                  // everything else goes to static assets
r = await call('/episodes.json'); assert.equal(await r.text(), 'asset:/episodes.json');
console.log('worker routing: all checks passed');
