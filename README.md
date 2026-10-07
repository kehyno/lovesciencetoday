# Love Science Today

Single-page website for the **Love Science Today** podcast, hosted by Kehinde Ojo. New episode every Friday 06:00 AM GMT.

Static site, no build step, no dependencies. Open `index.html` or serve the folder with any static host (GitHub Pages, Netlify, Cloudflare Pages).

```
index.html          page markup (Klaviyo scripts + form container live here)
styles.css          design tokens and styles
app.js              feed ingestion, players, countdown, explorer, motion
episodes.json       snapshot of the RSS feed (refreshed by the GitHub Action)
scripts/fetch-feed.mjs   builds episodes.json from the RSS feed
.github/workflows/update-episodes.yml   runs Fridays 06:00 GMT (+ retries) and on demand
assets/             logo, self-hosted fonts (Newsreader, Geist) and Phosphor icons
```

## How new episodes appear

1. On load the page reads `episodes.json` (instant, same-origin), then fetches the live RSS feed
   (`https://anchor.fm/s/10b672468/podcast/rss`) directly, falling back to public CORS proxies.
2. If the tab is open on Friday 06:00 GMT it re-checks the feed, retries every 3 minutes for up to an hour, and shows a toast when a new episode lands.
3. The GitHub Action commits a fresh `episodes.json` every Friday 06:00 GMT so the snapshot stays current even if a browser cannot reach the feed. Trigger it once from the Actions tab (Update episodes, Run workflow) after deploying to fill the snapshot.

If both the snapshot and live feed are unavailable, the hero shows the Spotify embedded player instead.

## Email signup

The form is Klaviyo (`<div class="klaviyo-form-XvXEqL">`) with the two Klaviyo scripts in `<head>`. Style and fields are managed in Klaviyo.
