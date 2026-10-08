// Snapshots the podcast RSS feed into episodes.json so the site has same-origin data
// (no CORS dependency, instant first paint). Run by .github/workflows/update-episodes.yml.
import { writeFile } from 'node:fs/promises';

const RSS = 'https://anchor.fm/s/10b672468/podcast/rss';
const res = await fetch(RSS, { headers: { 'user-agent': 'LoveScienceToday-site/1.0' } });
if (!res.ok) throw new Error(`Feed responded ${res.status}`);
const xml = await res.text();

const pick = (s, tag) => {
  const m = s.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1].replace(/^<!\[CDATA\[|\]\]>$/g, '').trim() : '';
};
const attr = (s, tag, a) => {
  const m = s.match(new RegExp(`<${tag}\\s[^>]*${a}="([^"]*)"`, 'i'));
  return m ? m[1].replace(/&amp;/g, '&') : '';
};
const strip = h => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const fmtDur = d => {
  if (/^\d+$/.test(d)) { const s = +d, h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`; }
  return d.replace(/^0:(\d+:\d+)$/, '$1');
};

const tagFor = t => {
  if (t.includes(':')) return t.split(':')[0].slice(0, 18).toUpperCase();
  const m = t.match(/^(Attachment|Biology|Conflict|Intimacy|Boundaries|Desire|Trust|Psychology)/i);
  return m ? m[1].toUpperCase() : 'LOVE SCIENCE';
};

const channelHead = xml.split(/<item[\s>]/i)[0];
const chanImg = attr(channelHead, 'itunes:image', 'href') || pick(pick(channelHead, 'image'), 'url');
const items = [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map(m => m[0]);
if (!items.length) throw new Error('No <item> elements found');

let episodes = items.map((it, i) => {
  const date = pick(it, 'pubDate');
  return {
    id: pick(it, 'guid') || attr(it, 'enclosure', 'url') || `ep-${i}`,
    title: strip(pick(it, 'title')),
    desc: strip(pick(it, 'description') || pick(it, 'content:encoded')).slice(0, 400),
    date: date ? new Date(date).toISOString() : '',
    audio: attr(it, 'enclosure', 'url'),
    dur: fmtDur(pick(it, 'itunes:duration')),
    img: attr(it, 'itunes:image', 'href') || chanImg,
    link: pick(it, 'link'),
    num: +pick(it, 'itunes:episode') || 0,
  };
}).sort((a, b) => new Date(b.date) - new Date(a.date));
episodes.forEach((e, i) => { e.num = episodes.length - i; e.tag = tagFor(e.title); });

await writeFile(new URL('../episodes.json', import.meta.url), JSON.stringify({ updated: new Date().toISOString(), cached: false, episodes }, null, 1) + '\n');
console.log(`Wrote ${episodes.length} episodes. Latest: ${episodes[0].title}`);
