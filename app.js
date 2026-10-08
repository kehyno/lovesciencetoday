/* Love Science Today: site behaviour. No dependencies. */
(() => {
  'use strict';

  const RSS_URL = 'https://anchor.fm/s/10b672468/podcast/rss';
  const DROP = { day: 5, hour: 6, minute: 0 }; // Friday 06:00 GMT/UTC
  const PAGE = 9;

  const PLATFORMS = [
    { name: 'Spotify', short: 'SP', color: '#1DB954', url: 'https://open.spotify.com/show/12EsYsM88j7oHkNBtGOu9C?si=58caf10b1a8b446e' },
    { name: 'Apple Podcasts', short: 'AP', color: '#FA243C', url: 'https://podcasts.apple.com/au/podcast/love-science-today/id1850332844' },
    { name: 'Amazon Music', short: 'AM', color: '#00A8E1', url: 'https://music.amazon.co.uk/podcasts/21e9842b-cd75-4316-9236-add63172d5fe/love-science-today' },
    { name: 'YouTube', short: 'YT', color: '#FF0000', url: 'https://www.youtube.com/show/VLPLjSPzidxuZJ5pdgpQfMbTQtJhd4QCz7YP?season=AllEpisodes&sbp=CgtBbGxFcGlzb2RlcxoAKgtiWnllX19NY3lzNEAB' },
    { name: 'Goodpods', short: 'GP', color: '#FF6B35', url: 'https://goodpods.com/podcasts/love-science-today-713286' },
    { name: 'Podlinkr', short: 'PL', color: '#E8643D', url: 'https://podlinkr.com/en/love-science-today' },
    { name: 'Castbox', short: 'CB', color: '#FF5A00', url: 'https://castbox.fm/vh/6877362' },
    { name: 'Replaio', short: 'RP', color: '#7C3AED', url: 'https://replaio.com/podcasts/love-science-today-CVIDKh' },
    { name: 'PodcastAddict', short: 'PA', color: '#FF8C00', url: 'https://podcastaddict.com/podcast/love-science-today/7291960' },
    { name: 'Podcast Republic', short: 'PR', color: '#0A1220', url: 'https://podcastrepublic.net/podcast/1850332844' },
  ];
  const WORDS = ['ATTACHMENT', 'BIOLOGY', 'CONFLICT', 'INTIMACY', 'BOUNDARIES', 'DESIRE', 'TRUST', 'VULNERABILITY', 'NEUROSCIENCE', 'LOVE SCIENCE'];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const fmtTime = s => {
    if (!isFinite(s)) return '0:00';
    s = Math.max(0, Math.floor(s));
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return h ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`;
  };
  const fmtDate = d => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d || ''; } };
  const tagFor = title => {
    if (title.includes(':')) return title.split(':')[0].slice(0, 18).toUpperCase();
    const m = title.match(/^(Attachment|Biology|Conflict|Intimacy|Boundaries|Desire|Trust|Psychology)/i);
    return m ? m[1].toUpperCase() : 'LOVE SCIENCE';
  };

  $('#yr').textContent = new Date().getFullYear();

  /* ---------------- static renders ---------------- */
  $('#pills').innerHTML = PLATFORMS.map(p => `<li><a class="pill" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" data-magnetic><b style="background:${p.color}">${p.short[0]}</b>${esc(p.name.toUpperCase())}</a></li>`).join('');
  $('#plat').innerHTML = PLATFORMS.map((p, i) => `<a class="pc reveal" style="--rd:${(i % 5) * 60}ms" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer"><span class="pc__bar" style="background:${p.color}"></span><span class="pc__badge" style="background:${p.color}">${p.short}</span><span class="pc__n">${esc(p.name)}</span><span class="pc__s">Open &bull; Free</span><span class="pc__go">LISTEN NOW <i class="ph ph-arrow-right" aria-hidden="true"></i></span></a>`).join('');
  $('#androidBtns').innerHTML = PLATFORMS.slice(7).map(p => `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a>`).join('');
  const run = WORDS.map(w => `<span>${w} &bull;</span>`).join('');
  $('#marquee').innerHTML = run + run;

  /* ---------------- nav ---------------- */
  const burger = $('#burger'), nav = $('#topNav');
  const setMenu = open => { nav.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); $('i', burger).className = open ? 'ph ph-x' : 'ph ph-list'; };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

  /* ---------------- reveal on scroll ---------------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -5% 0px' });
  const observeReveals = () => $$('.reveal:not(.in)').forEach(el => io.observe(el));
  observeReveals();

  /* ---------------- magnetic + tilt ---------------- */
  if (fine && !reduced) {
    $$('[data-magnetic]').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .15}px,${(e.clientY - r.top - r.height / 2) * .25}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
    const orb = $('#orb'); let raf = 0, tx = 0, ty = 0;
    addEventListener('pointermove', e => {
      tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; orb.style.setProperty('--px', tx.toFixed(3)); orb.style.setProperty('--py', ty.toFixed(3)); });
    }, { passive: true });
  }

  /* ---------------- toast, copy, calendar ---------------- */
  const toastEl = $('#toast'); let toastT = 0;
  const toast = msg => { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 4200); };
  async function copy(text, label) {
    try { await navigator.clipboard.writeText(text); }
    catch { const t = Object.assign(document.createElement('textarea'), { value: text }); document.body.append(t); t.select(); try { document.execCommand('copy'); } catch { /* ignore */ } t.remove(); }
    toast(label || 'Copied to clipboard');
  }
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => copy(b.dataset.copy, `Copied ${b.dataset.copy}`)));
  $('#rssCopy').addEventListener('click', () => copy(RSS_URL, 'RSS feed copied. Paste it into any podcast app.'));

  const nextDrop = (from = new Date()) => {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), DROP.hour, DROP.minute, 0));
    let add = (DROP.day - d.getUTCDay() + 7) % 7;
    if (add === 0 && d <= from) add = 7;
    d.setUTCDate(d.getUTCDate() + add);
    return d;
  };
  $('#icsBtn').addEventListener('click', () => {
    const d = nextDrop(), f = x => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Love Science Today//EN', 'BEGIN:VEVENT', `UID:lst-weekly@lovesciencetoday.com`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(d)}`, 'DURATION:PT45M', 'RRULE:FREQ=WEEKLY;BYDAY=FR', 'SUMMARY:New Love Science Today episode', 'DESCRIPTION:Fresh episode every Friday. https://open.spotify.com/show/12EsYsM88j7oHkNBtGOu9C', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: 'love-science-today.ics' });
    document.body.append(a); a.click(); a.remove(); toast('Added. Every Friday, 06:00 AM GMT.');
  });


  /* ---------------- lines from the show: a fresh twelve every Friday ---------------- */
  let refreshLines = () => {};
  (() => {
    // Hand-picked lines. New material comes from the episode descriptions in the feed (see sentencesFrom).
    const CURATED = [
      { line: 'Betrayal begins long before the first touch.', ep: 'Emotional Infidelity' },
      { line: 'Resentment rarely arrives suddenly. It accumulates.', ep: 'The Resentment Trap' },
      { line: 'Relationships rarely die from one wound.', ep: 'Relationship Autopsy' },
      { line: 'Love cannot survive constant suspicion.', ep: 'The Trust Paradox' },
      { line: 'A crumb can feel like a feast when you are starving.', ep: 'Breadcrumbing' },
      { line: 'Comparison turns a good relationship into a rehearsal for a better one.', ep: 'The Comparison Trap' },
      { line: 'High standards protect love. Ego protects fear.', ep: 'Standards vs Ego' },
      { line: 'Your last breakup was data. Read it before you repeat it.', ep: 'Relationship Autopsy' },
      { line: 'We sabotage most what we want most.', ep: 'The Trust Paradox' },
      { line: 'The heart can leave long before the body does.', ep: 'Emotional Infidelity' },
    ];
    const PER_WEEK = 12;
    const SKIP = /^(learn|join|listen|tune|in this|this episode|we |kehinde|click|subscribe|follow|get |discover|explore|today|welcome|dive|find out|stay|how |why |what |when |where |who )/i;
    // A real sentence has a verb; this drops noun-phrase fragments such as "Attachment, nervous system regulation, and readiness."
    const HAS_VERB = /\b(is|are|isn't|aren't|was|were|can|cannot|can't|will|won't|does|doesn't|do|don't|did|has|have|had|feel|feels|start|starts|started|begin|begins|began|leave|leaves|kill|kills|turn|turns|become|becomes|need|needs|want|wants|protect|protects|shape|shapes|distort|distorts)\b/i;
    const swap = $('#qSwap'), btn = $('#qNext');
    let i = 0, spin = 0, set = [], sig = '';

    // Sentences from episode descriptions that read well on their own.
    const sentencesFrom = eps => {
      const out = [];
      eps.forEach(e => {
        const ep = (e.title || '').split(':')[0].trim();
        (e.desc || '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).forEach(s => {
          s = s.trim();
          if (s.length < 28 || s.length > 110 || !/[.!?]$/.test(s)) return;
          if (SKIP.test(s) || !HAS_VERB.test(s) || (s.match(/,/g) || []).length > 1 || /https?:|@|\d{3,}|\.\.\./.test(s)) return;
          out.push({ line: s, ep });
        });
      });
      return out;
    };
    // Seeded shuffle: same order for everyone, so every visitor sees the same twelve in a given week.
    const shuffle = (arr, seed) => {
      const a = arr.slice(); let t = seed >>> 0;
      const rnd = () => { t += 0x6D2B79F5; let x = Math.imul(t ^ (t >>> 15), 1 | t); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
      for (let k = a.length - 1; k > 0; k--) { const r = Math.floor(rnd() * (k + 1)); [a[k], a[r]] = [a[r], a[k]]; }
      return a;
    };
    // Week number counted from Friday 06:00 GMT drops.
    const weekIndex = () => Math.floor((nextDrop().getTime() - 7 * 864e5) / (7 * 864e5));
    const pick = eps => {
      const seen = new Set();
      const pool = CURATED.concat(sentencesFrom(eps)).filter(x => { const k = x.line.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
        .sort((a, b) => a.line.localeCompare(b.line));
      if (pool.length <= PER_WEEK) return pool;
      const order = shuffle(pool, 0x4C53), start = (weekIndex() * PER_WEEK) % order.length;
      return Array.from({ length: PER_WEEK }, (_, k) => order[(start + k) % order.length]);
    };
    const show = () => {
      const l = set[i];
      $('#qText').textContent = `\u201C${l.line}\u201D`;
      $('#qFrom').textContent = `From the episode ${l.ep}`;
      $('#qCount').textContent = `${pad(i + 1)} / ${pad(set.length)}`;
      if (!reduced) { swap.style.animation = 'none'; void swap.offsetWidth; swap.style.animation = ''; }
    };
    refreshLines = eps => {
      const next = pick(eps || []), s = next.map(x => x.line).join('|');
      if (s === sig) return;
      sig = s; set = next; i = 0; show();
    };
    btn.addEventListener('click', () => { i = (i + 1) % set.length; spin += 180; btn.style.setProperty('--spin', spin + 'deg'); show(); });
    refreshLines([]);
  })();

  /* ---------------- contact form ---------------- */
  (() => {
    const form = $('#cform'); if (!form) return;
    const okBox = $('#cfOk'), err = $('#cfErr'), send = $('#cfSend'), cap = $('#cfCaptcha'), comments = $('#cfComments');
    const local = ['localhost', '127.0.0.1'].includes(location.hostname);
    // Site key: the localhost test key, else data-sitekey in the HTML, else TURNSTILE_SITEKEY from /api/config.
    let key = local ? '1x00000000000000000000AA' : (cap.dataset.sitekey || '');   // Cloudflare's always-pass test key, localhost only
    const isSet = k => !!k && !k.startsWith('YOUR_');
    let widget = null, token = '';
    const say = t => { err.textContent = t; err.hidden = !t; };
    const fieldErr = (id, t) => { const input = $('#' + id), p = $('#' + id + 'Err'); input.setAttribute('aria-invalid', t ? 'true' : 'false'); p.textContent = t || ''; p.hidden = !t; };

    comments.addEventListener('input', () => { $('#cfCount').textContent = `${comments.value.length} / 2000`; });

    const off = () => { send.disabled = true; say('The captcha is not set up yet, so this form is switched off. Email us at lovesciencetoday@gmail.com or mail@lovesciencetoday.com instead.'); };
    const start = () => {
      send.disabled = false; say('');
      const render = () => {
        if (!window.turnstile || widget !== null) return;
        widget = window.turnstile.render(cap, { sitekey: key, theme: 'light',
          callback: t => { token = t; },
          'expired-callback': () => { token = ''; },
          'error-callback': () => { token = ''; say('The captcha could not load. Check your connection and try again.'); } });
      };
      const s = Object.assign(document.createElement('script'), { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', async: true, defer: true });
      document.head.append(s);
      const t = setInterval(() => { render(); if (widget !== null) clearInterval(t); }, 250); setTimeout(() => clearInterval(t), 20000);
    };
    // Resolve the key, then load Turnstile only when the form is about to be seen.
    const resolveKey = async () => {
      if (isSet(key)) return key;
      try { const r = await fetch('/api/config', { cache: 'no-store' }); const j = await r.json(); return isSet(j.sitekey) ? j.sitekey : ''; } catch { return ''; }
    };
    send.disabled = true;
    new IntersectionObserver(async (es, o) => {
      if (!es[0].isIntersecting) return; o.disconnect();
      key = await resolveKey();
      isSet(key) ? start() : off();
    }, { rootMargin: '400px' }).observe(form);
    const resetCaptcha = () => { token = ''; if (window.turnstile && widget !== null) window.turnstile.reset(widget); };

    form.addEventListener('submit', async e => {
      e.preventDefault(); say('');
      const v = { name: $('#cfName').value.trim(), email: $('#cfEmail').value.trim(), comments: comments.value.trim(), website: $('#cfWeb').value };
      const bad = {};
      if (v.name.length < 2) bad.cfName = 'Please enter your name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) bad.cfEmail = 'Please enter a valid email address.';
      if (v.comments.length < 10) bad.cfComments = 'Please write at least a sentence.';
      ['cfName', 'cfEmail', 'cfComments'].forEach(id => fieldErr(id, bad[id]));
      const first = Object.keys(bad)[0];
      if (first) { $('#' + first).focus(); return; }
      if (!token) { say('Please complete the captcha before sending.'); return; }

      send.disabled = true; send.textContent = 'SENDING...';
      try {
        const r = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...v, token }) });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.ok) { form.hidden = true; okBox.hidden = false; okBox.querySelector('h3').focus?.(); form.reset(); $('#cfCount').textContent = '0 / 2000'; }
        else if (r.status === 422 && j.fields) { Object.entries({ cfName: j.fields.name, cfEmail: j.fields.email, cfComments: j.fields.comments }).forEach(([id, t]) => fieldErr(id, t)); }
        else if (r.status === 403) say('The captcha check failed. Please tick the box again and resend.');
        else say('We could not send your message right now. Please email lovesciencetoday@gmail.com instead.');
      } catch { say('We could not reach the server. Check your connection, or email lovesciencetoday@gmail.com instead.'); }
      send.disabled = false; send.textContent = 'SEND MESSAGE'; resetCaptcha();
    });
    $('#cfAgain').addEventListener('click', () => { okBox.hidden = true; form.hidden = false; $('#cfName').focus(); });
  })();

  /* ---------------- newsletter nudge ---------------- */
  (() => {
    const nudge = $('#nudge'); let shown = false;
    try { if (sessionStorage.getItem('lst-nudge') === '1') return; } catch { /* storage blocked */ }
    const show = () => { if (shown) return; shown = true; nudge.hidden = false; };
    const hide = () => { nudge.hidden = true; try { sessionStorage.setItem('lst-nudge', '1'); } catch { /* ignore */ } };
    $('#nudgeX').addEventListener('click', hide); $('#nudgeGo').addEventListener('click', hide);
    // appears once the visitor is ~a third of the way down, or after 30s
    const mark = Object.assign(document.createElement('div'), { ariaHidden: 'true' });
    mark.style.cssText = 'position:absolute;left:0;width:1px;height:1px;pointer-events:none';
    document.body.append(mark);
    const place = () => { mark.style.top = Math.round(document.documentElement.scrollHeight * .35) + 'px'; };
    place(); addEventListener('resize', place);
    new IntersectionObserver(([e]) => { if (e.isIntersecting) show(); }).observe(mark);
    setTimeout(show, 30000);
    // hide it once the real signup is on screen
    new IntersectionObserver(([e]) => { if (e.isIntersecting && shown) nudge.hidden = true; else if (!e.isIntersecting && shown && !sessionStorage.getItem('lst-nudge')) nudge.hidden = false; }).observe($('#subscribe'));
  })();

  /* ---------------- state ---------------- */
  let episodes = [];
  let usingCache = true;
  let shown = PAGE, query = '';
  const grid = $('#grid'), more = $('#more'), qEl = $('#q'), qClear = $('#qClear'), emptyEl = $('#empty'), countEl = $('#resultCount');

  /* ---------------- episode grid ---------------- */
  const filtered = () => {
    const q = query.trim().toLowerCase();
    return q ? episodes.filter(e => `${e.title} ${e.desc} ${e.tag}`.toLowerCase().includes(q)) : episodes;
  };
  function renderGrid() {
    const all = filtered();
    grid.innerHTML = all.slice(0, shown).map(ep => `
      <article class="ep" data-id="${esc(ep.id)}">
        <div class="ep__meta"><span class="ep__no">EP #${ep.num}</span><span class="ep__date">${esc(fmtDate(ep.date))}</span><span class="ep__tag">${esc(ep.tag)}</span></div>
        <h3 class="ep__t">${esc(ep.title)}</h3>
        <p class="ep__d">${esc(ep.desc.slice(0, 150))}...</p>
        ${ep.audio ? `<audio class="ep__audio" controls preload="none" src="${esc(ep.audio)}"></audio>` : `<div class="ep__audio">Audio updating Friday 06:00 AM GMT</div>`}
        <div class="ep__btns">
          ${ep.audio ? `<button class="btn btn--ink" type="button" data-listen="${esc(ep.id)}">LISTEN</button>` : ''}
          ${[['SPOTIFY', 0], ['APPLE', 1], ['AMAZON', 2], ['YOUTUBE', 3]].map(([n, k]) => `<a class="btn btn--line" href="${esc(PLATFORMS[k].url)}" target="_blank" rel="noopener" aria-label="Listen on ${esc(PLATFORMS[k].name)}">${n}</a>`).join('\n          ')}
        </div>
      </article>`).join('');
    emptyEl.hidden = all.length > 0;
    more.hidden = all.length <= shown;
    qClear.hidden = !query;
    countEl.textContent = query ? `${all.length} of ${episodes.length} episodes` : '';
    // while only the saved highlights are loaded, keep the headline count at the show total
    const total = usingCache ? Math.max(58, episodes.length) : (episodes.length || 58);
    $('#epsCount').textContent = total;
    $('#badgeCount').textContent = `${total} EPISODES`;
  }
  const setQuery = v => { query = v; qEl.value = v; shown = PAGE; renderGrid(); };
  qEl.addEventListener('input', () => { query = qEl.value; shown = PAGE; renderGrid(); });
  qClear.addEventListener('click', () => { setQuery(''); qEl.focus(); });
  more.addEventListener('click', () => { shown += PAGE; renderGrid(); });
  $('#chips').addEventListener('click', e => {
    const b = e.target.closest('button[data-k]'); if (!b) return;
    setQuery(b.dataset.k); $('#episodes').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    toast(`Showing episodes about ${b.textContent.toLowerCase()}`);
  });

  /* ---------------- hero player ---------------- */
  const audio = $('#audio'), heroEl = $('#hero-player'), heroPlay = $('#heroPlay'), scrub = $('#scrub');
  let current = null;
  function setHero(ep) {
    current = ep;
    $('#heroTitle').textContent = ep.title;
    $('#heroSub').textContent = `Love Science Today • Kehinde Ojo • Ep #${ep.num}`;
    scrub.disabled = !ep.audio;
    audio.src = ep.audio || '';
    scrub.value = 0; scrub.style.setProperty('--v', '0%'); $('#tCur').textContent = '0:00'; $('#tDur').textContent = ep.dur || '0:00';
    paintPlay();
  }
  function paintPlay() {
    const playing = !audio.paused && current && current.audio;
    heroEl.classList.toggle('is-playing', !!playing);
    heroPlay.innerHTML = `<i class="ph-fill ph-${playing ? 'pause' : 'play'}"></i>`;
    heroPlay.setAttribute('aria-label', playing ? 'Pause' : 'Play latest episode');
  }
  heroPlay.addEventListener('click', () => {
    if (!current) return;
    if (!current.audio) { toast('Audio updates Friday 06:00 AM GMT. Opening Spotify.'); window.open(PLATFORMS[0].url, '_blank', 'noopener'); return; }
    audio.paused ? audio.play().catch(() => toast('Tap play again to start the episode.')) : audio.pause();
  });
  audio.addEventListener('play', paintPlay); audio.addEventListener('pause', paintPlay); audio.addEventListener('ended', paintPlay);
  audio.addEventListener('loadedmetadata', () => { $('#tDur').textContent = fmtTime(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    const f = audio.duration ? audio.currentTime / audio.duration : 0;
    scrub.value = f * 1000; scrub.style.setProperty('--v', f * 100 + '%'); $('#tCur').textContent = fmtTime(audio.currentTime);
  });
  audio.addEventListener('error', () => { if (current && current.audio) toast('That audio could not load. Try Spotify instead.'); });
  scrub.addEventListener('input', () => { if (isFinite(audio.duration)) audio.currentTime = (scrub.value / 1000) * audio.duration; });
  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-listen]'); if (!b) return;
    const ep = episodes.find(x => x.id === b.dataset.listen); if (!ep) return;
    setHero(ep);
    $('#top').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    setTimeout(() => audio.play().catch(() => {}), 350);
    $$('.ep').forEach(c => c.classList.toggle('is-now', c.dataset.id === ep.id));
  });

  /* ---------------- feed ingestion ---------------- */
  const stamp = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  function status(ok) {
    const t = `Last checked: ${stamp()} • Auto-updates Fridays 06:00 AM GMT`;
    $('#heroNote').innerHTML = esc(t) + (ok ? '' : ' <b>• Live feed reconnecting...</b>');
    $('#liveText').textContent = ok ? t : `${t} • showing saved episodes`;
    $('#epsWarn').hidden = ok;
  }
  const textOf = (el, sel) => { const n = el.querySelector(sel); return n ? n.textContent.trim() : ''; };
  function parseRSS(xml) {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('bad xml');
    const items = [...doc.querySelectorAll('item')];
    if (!items.length) throw new Error('no items');
    const out = items.map((it, i) => {
      const enc = it.querySelector('enclosure');
      const d = document.createElement('div'); d.innerHTML = textOf(it, 'description') || '';
      const rawDur = (it.getElementsByTagName('itunes:duration')[0] || {}).textContent || '';
      const title = textOf(it, 'title');
      return { id: textOf(it, 'guid') || (enc && enc.getAttribute('url')) || `ep-${i}`, title, desc: (d.textContent || '').replace(/\s+/g, ' ').trim(),
        date: textOf(it, 'pubDate') ? new Date(textOf(it, 'pubDate')).toISOString() : '', audio: enc ? enc.getAttribute('url') : '',
        dur: /^\d+$/.test(rawDur.trim()) ? fmtTime(+rawDur) : rawDur.trim().replace(/^0:(\d+:\d+)$/, '$1'), tag: tagFor(title), link: textOf(it, 'link') };
    });
    return finalize(out);
  }
  function finalize(list) {
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    list.forEach((e, i) => { e.num = list.length - i; });
    return list;
  }
  async function viaRss2json() {
    const r = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`, { cache: 'no-store' });
    const j = await r.json();
    if (j.status !== 'ok' || !j.items || !j.items.length) throw new Error('rss2json failed');
    return finalize(j.items.map((it, i) => ({ id: it.guid || `ep-${i}`, title: it.title || '', desc: (it.description || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
      date: new Date(it.pubDate.replace(' ', 'T') + 'Z').toISOString(), audio: (it.enclosure && it.enclosure.link) || '', dur: '', tag: tagFor(it.title || ''), link: it.link || '' })));
  }
  const withTimeout = (p, ms = 9000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  const getXml = async u => { const r = await fetch(u, { cache: 'no-store' }); if (!r.ok) throw new Error(r.status); return parseRSS(await r.text()); };
  const fetchFeed = async () => {
    const tries = [() => getXml(RSS_URL), () => getXml(`https://api.allorigins.win/raw?url=${encodeURIComponent(RSS_URL)}`), () => getXml(`https://corsproxy.io/?${encodeURIComponent(RSS_URL)}`), viaRss2json];
    let err;
    for (const t of tries) { try { return await withTimeout(t()); } catch (e) { err = e; } }
    throw err;
  };
  async function fetchSnapshot() {
    const j = await (await fetch('episodes.json', { cache: 'no-cache' })).json();
    if (!j.episodes || !j.episodes.length) throw new Error('empty snapshot');
    return j.episodes.map(e => ({ ...e, tag: e.tag || tagFor(e.title) }));
  }
  function apply(list, announce) {
    const prev = episodes[0] && episodes[0].id;
    episodes = list;
    renderGrid(); observeReveals(); refreshLines(list);
    if (!current || (current.id !== list[0].id && !audio.currentTime)) setHero(list[0]);
    if (announce && prev && prev !== list[0].id) toast(`New episode: ${list[0].title}`);
  }
  async function refresh(announce = true) {
    try { const l = await fetchFeed(); usingCache = false; apply(l, announce); status(true); return true; }
    catch { usingCache = true; renderGrid(); status(false); return false; }
  }

  (async () => {
    grid.innerHTML = Array.from({ length: 6 }, () => '<div class="skel"><i style="width:40%"></i><i style="height:1.6rem;margin-top:1.2rem"></i><i style="height:4rem"></i></div>').join('');
    try { apply(await fetchSnapshot(), false); } catch { /* no snapshot yet */ }
    status(false);
    const ok = await refresh(false);
    if (!episodes.length) {
      grid.innerHTML = ''; emptyEl.hidden = false; emptyEl.textContent = 'Episodes are loading from Spotify. Press play there in the meantime.';
      $('#heroTitle').textContent = 'Listen on Spotify'; current = { title: 'Listen on Spotify', num: 58, audio: '' };
    } else if (!ok) { $('#epsWarn').hidden = false; }

    // Friday 06:00 GMT: re-check at the drop, then every 3 minutes for up to an hour until a new top episode appears.
    const arm = () => {
      setTimeout(async () => {
        const top = episodes[0] && episodes[0].id;
        for (let n = 0; n < 20; n++) {
          await refresh(true);
          if (!top || (episodes[0] && episodes[0].id !== top)) break;
          await new Promise(r => setTimeout(r, 180000));
        }
        arm();
      }, Math.min(Math.max(1000, nextDrop() - Date.now() + 5000), 2147483000));
    };
    arm();
    let last = Date.now();
    document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - last > 30 * 60 * 1000) { last = Date.now(); refresh(true); } });
  })();

  // Klaviyo form fallback if the onsite script is blocked or slow
  setTimeout(() => { const f = $('.klaviyo-form-YkzHQU'); if (f && !f.children.length) $('#subFallback').hidden = false; }, 8000);
})();
