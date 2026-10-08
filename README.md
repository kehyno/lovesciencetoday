# Love Science Today

Single-page website for the **Love Science Today** podcast, hosted by Kehinde Ojo. New episode every Friday 06:00 AM GMT.

Static site, no build step, no dependencies. Open `index.html` or serve the folder with any static host (GitHub Pages, Netlify, Cloudflare Pages).

```
index.html          page markup (Klaviyo scripts + form container live here)
styles.css          design tokens and styles
app.js              feed ingestion, players, countdown, explorer, motion
episodes.json       snapshot of the RSS feed (seeded with cached highlights, then refreshed by the GitHub Action)
scripts/fetch-feed.mjs   builds episodes.json from the RSS feed
.github/workflows/update-episodes.yml   runs Fridays 06:00 GMT (+ retries) and on demand
assets/             logo, self-hosted fonts (Instrument Serif, Inter) and Phosphor icons
```

## How new episodes appear

1. On load the page reads `episodes.json` (instant, same-origin), then fetches the live RSS feed
   (`https://anchor.fm/s/10b672468/podcast/rss`) directly, falling back to public CORS proxies.
2. If the tab is open on Friday 06:00 GMT it re-checks the feed, retries every 3 minutes for up to an hour, and shows a toast when a new episode lands.
3. The GitHub Action commits a fresh `episodes.json` every Friday 06:00 GMT so the snapshot stays current even if a browser cannot reach the feed. Trigger it once from the Actions tab (Update episodes, Run workflow) after deploying to fill the snapshot.

If both the snapshot and live feed are unavailable, the hero shows the Spotify embedded player instead.

## Email signup

The form is Klaviyo (`<div class="klaviyo-form-YkzHQU">`) with the two Klaviyo scripts in `<head>`. Style and fields are managed in Klaviyo.

## Lines from the show (new set every Friday)

`app.js` keeps a pool of hand-picked lines (`CURATED`) and adds sentences taken from the episode descriptions in the feed. Each Friday 06:00 GMT the page switches to the next window of 12, shuffled with a fixed seed so every visitor sees the same twelve in a given week and nothing repeats until the pool is used up. Add your own favourite lines to `CURATED` at any time; the more episodes the feed holds, the bigger the pool.

## Deploying on Cloudflare (Workers Builds or Pages)

`wrangler.jsonc` makes the repo deploy as a Cloudflare Worker with static assets (what **Workers Builds** runs: `npx wrangler deploy`). The site is served from the repo root, `.assetsignore` keeps private files (source, scripts, README) off the public site, and `src/worker.js` handles `/api/*`. The same code also works on Cloudflare Pages through `functions/`.

## Contact form (name, email, comments)

The form posts to `/api/contact`. It checks a Turnstile captcha, then **saves the message to a free Cloudflare D1 database** (`lovesciencetoday`, table `contact_messages`, see `schema.sql`) and, if you add a Resend key, also emails it to `kehyno@gmail.com`. A hidden honeypot field catches simple bots.

What is already configured in `wrangler.jsonc`: the D1 binding `DB` and the public Turnstile site key (`TURNSTILE_SITEKEY`). What you add in the Cloudflare dashboard (Settings > Variables and Secrets, as **secrets**):

1. `TURNSTILE_SECRET`: the Turnstile secret key (create the widget at Cloudflare > Turnstile, with this site's hostnames).
2. Optional `RESEND_API_KEY`: key from resend.com (sign up with `kehyno@gmail.com`) to also get each message by email. `CONTACT_TO` and `CONTACT_FROM` override the recipient and sender.

Read submissions: Cloudflare dashboard > Storage & Databases > D1 > lovesciencetoday > Console, then run
`SELECT created_at, name, email, comments FROM contact_messages ORDER BY id DESC LIMIT 20;`

Offline tests: `node scripts/test-contact.mjs` and `node scripts/test-worker.mjs`. On localhost the form uses Cloudflare's always-pass test captcha key.
