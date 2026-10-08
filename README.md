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

The form is Klaviyo (`<div class="klaviyo-form-XvXEqL">`) with the two Klaviyo scripts in `<head>`. Style and fields are managed in Klaviyo.

## Lines from the show (new set every Friday)

`app.js` keeps a pool of hand-picked lines (`CURATED`) and adds sentences taken from the episode descriptions in the feed. Each Friday 06:00 GMT the page switches to the next window of 12, shuffled with a fixed seed so every visitor sees the same twelve in a given week and nothing repeats until the pool is used up. Add your own favourite lines to `CURATED` at any time; the more episodes the feed holds, the bigger the pool.

## Contact form (name, email, comments)

The form posts to `functions/api/contact.js`, a Cloudflare Pages Function. It checks a Turnstile captcha, then emails the message to `kehyno@gmail.com` through Resend. The address never appears in the page. A hidden honeypot field also catches simple bots. It only works when the site is deployed on Cloudflare Pages (connect the repo, no build command, output directory `/`).

One-time setup:

1. **Turnstile**: Cloudflare dashboard > Turnstile > Add site for your domain. Put the **site key** in `index.html` (`data-sitekey` on `#cfCaptcha`, replacing `YOUR_TURNSTILE_SITE_KEY`). Until you do, the form shows a "captcha not set up" message and stays switched off.
2. **Pages variables** (Settings > Variables and Secrets, add as encrypted secrets): `TURNSTILE_SECRET` (the Turnstile **secret key**) and `RESEND_API_KEY`.
3. **Resend**: create a free account at resend.com using `kehyno@gmail.com` and copy an API key. With no domain verified, Resend only delivers to the account's own address, which is exactly what is needed here. To send from your own domain later, verify it in Resend and set `CONTACT_FROM`.
4. Optional: set `CONTACT_TO` to send to a different inbox.

Test the function logic offline with `node scripts/test-contact.mjs`. On localhost the form uses Cloudflare's always-pass test captcha key.
