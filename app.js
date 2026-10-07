/* Love Science Today: site behaviour. No dependencies. */
(() => {
  'use strict';

  const RSS_URL = 'https://anchor.fm/s/10b672468/podcast/rss';
  const SPOTIFY_SHOW = '12EsYsM88j7oHkNBtGOu9C';
  const DROP = { day: 5, hour: 6, minute: 0 }; // Friday 06:00 GMT/UTC
  const RAIL_COUNT = 8;
  const PAGE = 12;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const esc = (s = '') => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const fmtTime = s => {
    if (!isFinite(s)) return '0:00';
    s = Math.max(0, Math.floor(s));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`;
  };
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  $('#yr').textContent = new Date().getFullYear();

  /* ---------------- nav ---------------- */
  const nav = $('#nav');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;height:40px;width:1px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle('is-stuck', !e.isIntersecting)).observe(sentinel);

  const toggle = $('#navToggle'), links = $('#navLinks');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    toggle.querySelector('i').className = open ? 'ph ph-x' : 'ph ph-list';
  });
  links.addEventListener('click', e => { if (e.target.closest('a')) { links.classList.remove('open'); toggle.setAttribute('aria-expanded', false); toggle.querySelector('i').className = 'ph ph-list'; } });

  /* ---------------- scroll reveals ---------------- */
  const revealEls = $$('.explore .h2, .topics, .lens, .eps__head, .rail, .archive, .listen .h2, .tile, .host__name, .host__copy, .sub__grid, .foot__top');
  revealEls.forEach((el, i) => { el.classList.add('reveal'); if (el.classList.contains('tile')) el.style.setProperty('--rd', `${(i % 5) * 70}ms`); });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  revealEls.forEach(el => io.observe(el));

  /* ---------------- manifesto word light-up ---------------- */
  (() => {
    const p = $('#manifesto');
    const hot = new Set(['chemistry,', 'history,', 'culture', 'choice.']);
    const words = p.textContent.trim().split(/\s+/);
    p.innerHTML = words.map((w, i) => `<span class="w${hot.has(w) ? ' hot' : ''}" style="--wi:${i}">${esc(w)}</span>`).join(' ');
    if (reduced) return;
    if (CSS.supports('animation-timeline: view()')) { p.classList.add('scrolly'); return; }
    const ws = $$('.w', p);
    const o = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      ws.forEach((w, i) => setTimeout(() => w.classList.add('lit'), i * 45));
      o.disconnect();
    }, { threshold: .3 });
    o.observe(p);
    ws.forEach(w => w.style.opacity = '');
  })();

  /* ---------------- magnetic buttons + tile spotlight ---------------- */
  if (fine && !reduced) {
    $$('[data-magnetic]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .3;
        b.style.transform = `translate(${x}px,${y}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }
  $$('.tile').forEach(t => t.addEventListener('pointermove', e => {
    const r = t.getBoundingClientRect();
    t.style.setProperty('--mx', `${e.clientX - r.left}px`);
    t.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));
  // brand icon fallback if the CDN is unreachable
  $$('.tile__ic').forEach(img => img.tagName === 'IMG' && img.addEventListener('error', () => {
    const s = document.createElement('span');
    s.className = 'tile__ic tile__ic--mono'; s.setAttribute('aria-hidden', 'true');
    s.textContent = (img.closest('.tile').querySelector('.tile__name').textContent || 'L')[0];
    img.replaceWith(s);
  }));

  /* ---------------- hero: heart tilt ---------------- */
  const heart = $('#heart');
  if (fine && !reduced) {
    let raf = 0, tx = 0, ty = 0;
    addEventListener('pointermove', e => {
      tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; heart.style.setProperty('--px', tx.toFixed(3)); heart.style.setProperty('--py', ty.toFixed(3)); });
    }, { passive: true });
  }

  /* ---------------- hero: constellation canvas ---------------- */
  (() => {
    const c = $('#net'), ctx = c.getContext('2d');
    let w = 0, h = 0, dpr = 1, nodes = [], visible = true, raf = 0;
    const mouse = { x: -999, y: -999 };
    const rnd = (a, b) => a + Math.random() * (b - a);

    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, Math.max(30, (w * h) / 16000)));
      nodes = Array.from({ length: n }, () => ({ x: rnd(0, w), y: rnd(0, h), vx: rnd(-.12, .12), vy: rnd(-.12, .12), r: rnd(.8, 2), t: rnd(0, 6.28) }));
      if (reduced) draw(0);
    }
    function draw(dt) {
      ctx.clearRect(0, 0, w, h);
      const L = 130;
      for (const p of nodes) {
        if (!reduced) {
          p.x += p.vx * dt * .06; p.y += p.vy * dt * .06; p.t += dt * .0015;
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 22000) { const f = (1 - d2 / 22000) * .6; p.x += dx * f * .02; p.y += dy * f * .02; }
          if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          if (d < L * L) {
            const k = 1 - Math.sqrt(d) / L;
            ctx.strokeStyle = `rgba(255,180,84,${k * .22})`; ctx.lineWidth = .7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        // link to pointer
        const mx = a.x - mouse.x, my = a.y - mouse.y, md = Math.hypot(mx, my);
        if (md < 170) { ctx.strokeStyle = `rgba(255,214,150,${(1 - md / 170) * .5})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
        const tw = .55 + Math.sin(a.t) * .35;
        ctx.fillStyle = `rgba(255,196,122,${tw})`; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
      }
    }
    let last = 0;
    function loop(t) { raf = 0; if (!visible) return; draw(Math.min(40, t - last || 16)); last = t; raf = requestAnimationFrame(loop); }
    size(); addEventListener('resize', () => { size(); });
    if (!reduced) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }).observe(c);
      addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
      raf = requestAnimationFrame(loop);
    }
  })();

  /* ---------------- countdown + calendar + rss ---------------- */
  const nextDrop = (from = new Date()) => {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), DROP.hour, DROP.minute, 0));
    let add = (DROP.day - d.getUTCDay() + 7) % 7;
    if (add === 0 && d <= from) add = 7;
    d.setUTCDate(d.getUTCDate() + add);
    return d;
  };
  const cD = $('#cD'), cH = $('#cH'), cM = $('#cM'), cS = $('#cS');
  let target = nextDrop();
  function tick() {
    let ms = target - Date.now();
    if (ms <= 0) { target = nextDrop(); ms = target - Date.now(); }
    const s = Math.floor(ms / 1000);
    cD.textContent = pad(Math.floor(s / 86400)); cH.textContent = pad(Math.floor(s % 86400 / 3600));
    cM.textContent = pad(Math.floor(s % 3600 / 60)); cS.textContent = pad(s % 60);
  }
  tick(); setInterval(tick, 1000);

  $('#icsBtn').addEventListener('click', () => {
    const d = nextDrop(), f = x => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Love Science Today//EN', 'BEGIN:VEVENT',
      `UID:lst-weekly-${f(d)}@lovesciencetoday.com`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(d)}`, 'DURATION:PT45M',
      'RRULE:FREQ=WEEKLY;BYDAY=FR', 'SUMMARY:New Love Science Today episode',
      `DESCRIPTION:Fresh episode every Friday. https://open.spotify.com/show/${SPOTIFY_SHOW}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: 'love-science-today.ics' });
    document.body.append(a); a.click(); a.remove(); toast('Added. Every Friday, 06:00 AM GMT.');
  });
  $('#rssBtn').addEventListener('click', async e => {
    const b = e.currentTarget, label = $('span', b);
    try { await navigator.clipboard.writeText(RSS_URL); label.textContent = 'Copied'; toast('RSS feed copied. Paste it into any podcast app.'); }
    catch { window.open(RSS_URL, '_blank', 'noopener'); }
    setTimeout(() => label.textContent = 'Copy RSS feed', 2200);
  });

  // Klaviyo form fallback if the onsite script is blocked or slow
  setTimeout(() => { const f = $('.klaviyo-form-XvXEqL'); if (f && !f.children.length) $('#subFallback').hidden = false; }, 8000);

  /* ---------------- toast ---------------- */
  const toastEl = $('#toast'); let toastT = 0;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 4200); }

  /* ---------------- explorer ---------------- */
  const DISC = {
    psychology: { label: 'Psychology', x: 200, y: 56 },
    biology: { label: 'Biology', x: 336, y: 128 },
    attachment: { label: 'Attachment theory', x: 336, y: 276 },
    family: { label: 'Family studies', x: 200, y: 350 },
    sociology: { label: 'Sociology', x: 64, y: 276 },
    philosophy: { label: 'Philosophy', x: 64, y: 128 },
  };
  const TOPICS = [
    { t: 'Attraction', q: 'Why do people fall for who they fall for?', p: 'Chemistry, familiarity and the stories we tell ourselves about who feels like home.', d: ['biology', 'psychology'], k: 'attract' },
    { t: 'Attachment', q: 'How do early bonds script the way we love?', p: 'Anxious, avoidant or secure: how childhood patterns quietly shape who we reach for and when we pull away.', d: ['attachment', 'family', 'psychology'], k: 'attach' },
    { t: 'Situationships', q: 'Why does undefined feel comfortable but empty?', p: 'Low commitment is easy to start and hard to leave. We look at what ambiguity does to desire and self-worth.', d: ['sociology', 'philosophy', 'psychology'], k: 'situationship' },
    { t: 'Dating in the feed', q: 'How is social media rewriting dating?', p: 'Endless options and curated profiles change what we expect from each other, and from ourselves.', d: ['sociology', 'psychology', 'philosophy'], k: 'social media' },
    { t: 'Heartbreak', q: 'What does loss actually do to us?', p: 'The body registers a breakup like a wound. Here is what the research says about grief, rumination and healing.', d: ['biology', 'psychology', 'attachment'], k: 'heartbreak' },
    { t: 'Boundaries and safety', q: 'What makes love emotionally safe?', p: 'Safety is built through consistency, and boundaries are how it is protected. Neither is a threat to intimacy.', d: ['family', 'psychology', 'philosophy'], k: 'boundar' },
    { t: 'Conflict and intimacy', q: 'How do close couples fight, and repair?', p: 'Conflict is not the problem. Contempt, silence and slow repair are. Learn what stable couples do differently.', d: ['psychology', 'family', 'attachment'], k: 'conflict' },
  ];
  const topicsEl = $('#topics'), svg = $('#lensSvg');
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const keys = Object.keys(DISC), C = { x: 200, y: 200 };
  // static base: ring edges + node layer
  const base = mk('g'), edges = mk('g'), nodesG = mk('g');
  keys.forEach((k, i) => { const a = DISC[k], b = DISC[keys[(i + 1) % keys.length]]; base.append(mk('line', { class: 'edge edge--base', x1: a.x, y1: a.y, x2: b.x, y2: b.y })); });
  keys.forEach(k => base.append(mk('line', { class: 'edge edge--base', x1: DISC[k].x, y1: DISC[k].y, x2: C.x, y2: C.y })));
  const nodeEls = {};
  keys.forEach(k => {
    const d = DISC[k], g = mk('g');
    const circ = mk('circle', { class: 'node', cx: d.x, cy: d.y, r: 7 });
    const lx = d.x < 150 ? d.x - 14 : d.x > 250 ? d.x + 14 : d.x;
    const anchor = d.x < 150 ? 'end' : d.x > 250 ? 'start' : 'middle';
    const ly = d.y < 100 ? d.y - 16 : d.y > 300 ? d.y + 26 : d.y + 4;
    const txt = mk('text', { x: lx, y: ly, 'text-anchor': anchor }); txt.textContent = d.label;
    g.append(circ, txt); nodesG.append(g); nodeEls[k] = { circ, txt };
  });
  svg.append(base, edges, nodesG, mk('circle', { class: 'core-ring', cx: C.x, cy: C.y, r: 10 }), mk('circle', { class: 'core', cx: C.x, cy: C.y, r: 6 }));

  function paintLens(i) {
    const T = TOPICS[i];
    $$('.topic', topicsEl).forEach((b, j) => { b.setAttribute('aria-selected', j === i); b.tabIndex = j === i ? 0 : -1; });
    edges.replaceChildren();
    keys.forEach(k => { const on = T.d.includes(k); nodeEls[k].circ.classList.toggle('on', on); nodeEls[k].txt.classList.toggle('on', on); });
    T.d.forEach((k, n) => {
      const a = DISC[k], len = Math.hypot(a.x - C.x, a.y - C.y);
      edges.append(mk('line', { class: 'edge', x1: a.x, y1: a.y, x2: C.x, y2: C.y, style: `--len:${len};--dl:${n * .12}s` }));
      const b = DISC[T.d[(n + 1) % T.d.length]];
      if (T.d.length > 2 || n === 0) edges.append(mk('line', { class: 'edge', x1: a.x, y1: a.y, x2: b.x, y2: b.y, style: `--len:${Math.hypot(a.x - b.x, a.y - b.y)};--dl:${.3 + n * .12}s` }));
    });
    const txt = $('.lens__text');
    $('#lensQ').textContent = T.q; $('#lensP').textContent = T.p;
    $('#lensChips').innerHTML = T.d.map(k => `<li>${DISC[k].label}</li>`).join('');
    txt.replaceWith(txt.cloneNode(true)); // restart swap animation
    $('#lensGo').onclick = () => searchFor(T.k);
  }
  TOPICS.forEach((T, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button class="topic" role="tab" type="button" aria-selected="false"><span>${esc(T.t)}</span><i class="ph ph-arrow-right" aria-hidden="true"></i></button>`;
    const b = li.firstElementChild;
    b.addEventListener('click', () => paintLens(i));
    b.addEventListener('pointerenter', () => { if (fine) paintLens(i); });
    b.addEventListener('keydown', e => {
      if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return; e.preventDefault();
      const n = (i + (e.key === 'ArrowDown' ? 1 : -1) + TOPICS.length) % TOPICS.length;
      paintLens(n); $$('.topic', topicsEl)[n].focus();
    });
    topicsEl.append(li);
  });
  paintLens(0);

  /* ---------------- episodes: state + render ---------------- */
  let episodes = [];
  let shown = PAGE, query = '';
  const railEl = $('#rail'), listEl = $('#list'), moreBtn = $('#more'), qEl = $('#q'), emptyEl = $('#listEmpty');
  const archive = $('#archive'), archiveToggle = $('#archiveToggle'), archiveLabel = $('#archiveLabel');

  const cover = (ep, cls = 'cover') => `<img class="${cls}" src="${esc(ep.img || 'assets/logo.jpg')}" alt="" loading="lazy" width="76" height="76" onerror="this.onerror=null;this.src='assets/logo.jpg'">`;

  function renderRail() {
    if (!episodes.length) {
      railEl.innerHTML = `<article class="ep" style="flex-basis:min(520px,86vw)"><div class="ep__body"><p class="ep__no">Episodes</p><h3 class="ep__t">Every episode lives on Spotify.</h3><p class="ep__m">The live feed is not reachable right now. Press play on Spotify and it will pick up where we left off.</p><p style="margin:1.1rem 0 0"><a class="btn btn--primary btn--sm" href="https://open.spotify.com/show/${SPOTIFY_SHOW}" target="_blank" rel="noopener">Open on Spotify</a></p></div></article>`;
      return;
    }
    railEl.innerHTML = episodes.slice(0, RAIL_COUNT).map(ep => `
      <article class="ep" data-id="${esc(ep.id)}">
        <div class="ep__art"><img src="${esc(ep.img || 'assets/logo.jpg')}" alt="" loading="lazy" width="340" height="340" onerror="this.onerror=null;this.src='assets/logo.jpg'">
          <button class="ep__play" type="button" data-play="${esc(ep.id)}" aria-label="Play ${esc(ep.title)}"><i class="ph-fill ph-play"></i></button></div>
        <div class="ep__body"><span class="ep__no">Episode ${ep.num}</span><h3 class="ep__t">${esc(ep.title)}</h3>
          <p class="ep__m">${fmtDate(ep.date)}${ep.dur ? ' &nbsp;|&nbsp; ' + esc(ep.dur) : ''}</p></div>
      </article>`).join('');
  }

  function filtered() {
    const q = query.trim().toLowerCase();
    return q ? episodes.filter(e => (e.title + ' ' + e.desc).toLowerCase().includes(q)) : episodes;
  }
  function renderList() {
    const all = filtered();
    listEl.innerHTML = all.slice(0, shown).map(ep => `
      <li class="row" data-id="${esc(ep.id)}">
        <span class="row__n">${ep.num}</span>
        <div><p class="row__t">${esc(ep.title)}</p><p class="row__m">${fmtDate(ep.date)}${ep.dur ? ' &nbsp;|&nbsp; ' + esc(ep.dur) : ''}</p></div>
        <button class="ic" type="button" data-play="${esc(ep.id)}" aria-label="Play ${esc(ep.title)}"><i class="ph-fill ph-play"></i></button>
      </li>`).join('');
    emptyEl.hidden = all.length > 0 || !episodes.length;
    moreBtn.hidden = all.length <= shown;
    archiveLabel.textContent = archive.dataset.open === 'true' ? 'Hide archive' : `Browse all ${episodes.length || 58} episodes`;
  }
  qEl.addEventListener('input', () => { query = qEl.value; shown = PAGE; renderList(); });
  moreBtn.addEventListener('click', () => { shown += PAGE; renderList(); });
  archiveToggle.addEventListener('click', () => setArchive(archive.dataset.open !== 'true'));
  function setArchive(open) { archive.dataset.open = open; archiveToggle.setAttribute('aria-expanded', open); renderList(); }
  function searchFor(k) {
    setArchive(true); qEl.value = k; query = k; shown = PAGE; renderList();
    $('#episodes').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    setTimeout(() => qEl.focus({ preventScroll: true }), 600);
  }
  // rail controls + drag
  const step = () => Math.min(railEl.clientWidth * .8, 700);
  $('#railPrev').addEventListener('click', () => railEl.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('#railNext').addEventListener('click', () => railEl.scrollBy({ left: step(), behavior: 'smooth' }));
  railEl.addEventListener('keydown', e => { if (e.key === 'ArrowRight') railEl.scrollBy({ left: step() / 2, behavior: 'smooth' }); if (e.key === 'ArrowLeft') railEl.scrollBy({ left: -step() / 2, behavior: 'smooth' }); });
  (() => {
    let down = false, sx = 0, sl = 0, moved = 0;
    railEl.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.target.closest('button,a')) return; down = true; moved = 0; sx = e.clientX; sl = railEl.scrollLeft; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; moved = Math.abs(dx); if (moved > 4) railEl.classList.add('is-drag'); railEl.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = false; railEl.classList.remove('is-drag'); });
  })();

  /* ---------------- hero player ---------------- */
  const heroEl = $('#heroPlayer');
  function waveHTML(seed) {
    let s = 0; for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    const rand = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    const N = 46;
    const bars = Array.from({ length: N }, (_, i) => { const env = .45 + .55 * Math.sin((i / N) * Math.PI); return `<i style="--h:${Math.round(14 + rand() * 78 * env)}%;--n:${i}"></i>`; }).join('');
    return `<div class="wave" role="slider" tabindex="0" aria-label="Seek latest episode" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="wave__bars">${bars}</div><div class="wave__bars wave__bars--on">${bars}</div></div>`;
  }
  function renderHero() {
    const ep = episodes[0];
    const top = `<div class="hplayer__top"><span class="hplayer__tag">LATEST DROP</span><span class="hplayer__when">Fridays 06:00 AM GMT</span></div>`;
    if (!ep) {
      heroEl.classList.remove('is-playing');
      heroEl.innerHTML = `${top}<div class="hplayer__fallback"><iframe title="Love Science Today on Spotify" src="https://open.spotify.com/embed/show/${SPOTIFY_SHOW}?utm_source=generator&theme=0" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe></div>`;
      return;
    }
    heroEl.innerHTML = `${top}
      <div class="hplayer__body">${cover(ep)}
        <div><h2 class="hplayer__title">${esc(ep.title)}</h2><p class="hplayer__meta">Episode ${ep.num} &nbsp;|&nbsp; ${fmtDate(ep.date)}${ep.dur ? ' &nbsp;|&nbsp; ' + esc(ep.dur) : ''}</p></div>
      </div>
      <div class="hplayer__row">
        <button class="play" type="button" data-play="${esc(ep.id)}" data-hero aria-label="Play latest episode"><i class="ph-fill ph-play"></i></button>
        ${waveHTML(ep.title)}
        <div class="hplayer__time"><span data-cur>0:00</span><span data-dur>${esc(ep.dur || '')}</span></div>
      </div>`;
    syncUI();
  }
  heroEl.addEventListener('click', e => {
    const w = e.target.closest('.wave'); if (!w) return;
    const r = w.getBoundingClientRect(); seekTo(episodes[0], (e.clientX - r.left) / r.width);
  });
  heroEl.addEventListener('keydown', e => {
    if (!e.target.closest('.wave')) return;
    if (e.key === 'ArrowRight') audio.currentTime += 10; if (e.key === 'ArrowLeft') audio.currentTime -= 10;
  });

  /* ---------------- audio engine ---------------- */
  const audio = $('#audio'), dock = $('#dock'), dockPlay = $('#dockPlay'), dockSeek = $('#dockSeek');
  let current = null;
  const byId = id => episodes.find(e => e.id === id);

  function load(ep) {
    current = ep; audio.src = ep.audio;
    $('#dockCover').src = ep.img || 'assets/logo.jpg'; $('#dockTitle').textContent = ep.title; $('#dockSub').textContent = `Episode ${ep.num} | Love Science Today`;
    dock.hidden = false;
  }
  function play(id) {
    const ep = byId(id); if (!ep) return;
    if (!ep.audio) { window.open(ep.link || `https://open.spotify.com/show/${SPOTIFY_SHOW}`, '_blank', 'noopener'); return; }
    if (current && current.id === ep.id) { audio.paused ? audio.play() : audio.pause(); return; }
    load(ep);
    audio.play().catch(() => toast('Tap play to start the episode.'));
  }
  function seekTo(ep, f) {
    if (!ep || !ep.audio) return;
    if (!current || current.id !== ep.id) { load(ep); audio.addEventListener('loadedmetadata', () => { audio.currentTime = f * audio.duration; audio.play(); }, { once: true }); audio.load(); return; }
    if (isFinite(audio.duration)) audio.currentTime = f * audio.duration;
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-play]'); if (b) play(b.dataset.play); });
  dockPlay.addEventListener('click', () => audio.paused ? audio.play() : audio.pause());
  $('#dockClose').addEventListener('click', () => { audio.pause(); dock.hidden = true; current = null; syncUI(); });
  dockSeek.addEventListener('input', () => { if (isFinite(audio.duration)) audio.currentTime = (dockSeek.value / 1000) * audio.duration; });
  audio.addEventListener('play', syncUI); audio.addEventListener('pause', syncUI); audio.addEventListener('ended', syncUI);
  audio.addEventListener('timeupdate', () => {
    const f = audio.duration ? audio.currentTime / audio.duration : 0;
    dockSeek.value = f * 1000; dockSeek.style.setProperty('--v', f * 100 + '%');
    $('#dockCur').textContent = fmtTime(audio.currentTime); $('#dockDur').textContent = fmtTime(audio.duration);
    if (current && episodes[0] && current.id === episodes[0].id) {
      const on = $('.wave__bars--on', heroEl); if (on) on.style.setProperty('--p', f * 100 + '%');
      const cur = $('[data-cur]', heroEl); if (cur) cur.textContent = fmtTime(audio.currentTime);
    }
  });
  audio.addEventListener('error', () => { if (current) toast('That audio could not load. Opening it on Spotify instead.'); });
  function syncUI() {
    const playing = !audio.paused && current;
    dock.classList.toggle('is-playing', !!playing);
    dockPlay.innerHTML = `<i class="ph-fill ph-${playing ? 'pause' : 'play'}"></i>`; dockPlay.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    $$('[data-play]').forEach(b => {
      const me = current && b.dataset.play === current.id, on = me && playing;
      const i = $('i', b); if (i) i.className = `ph-fill ph-${on ? 'pause' : 'play'}`;
      const host = b.closest('.ep'); if (host) host.classList.toggle('is-now', !!me);
    });
    heroEl.classList.toggle('is-playing', !!(playing && episodes[0] && current.id === episodes[0].id));
  }

  /* ---------------- feed ingestion ---------------- */
  const text = (el, sel) => { const n = el.querySelector(sel); return n ? n.textContent.trim() : ''; };
  function parseRSS(xml) {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('bad xml');
    const items = [...doc.querySelectorAll('item')];
    if (!items.length) throw new Error('no items');
    const chanImg = (doc.querySelector('channel > image > url') || {}).textContent;
    const itunesImg = [...doc.getElementsByTagName('itunes:image')].find(n => n.parentNode.nodeName === 'channel');
    const fallbackImg = (itunesImg && itunesImg.getAttribute('href')) || chanImg || '';
    const out = items.map((it, i) => {
      const enc = it.querySelector('enclosure');
      const ii = it.getElementsByTagName('itunes:image')[0];
      const rawDur = (it.getElementsByTagName('itunes:duration')[0] || {}).textContent || '';
      const numEl = (it.getElementsByTagName('itunes:episode')[0] || {}).textContent;
      const d = document.createElement('div'); d.innerHTML = text(it, 'description') || (it.getElementsByTagName('content:encoded')[0] || {}).textContent || '';
      const desc = (d.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 400);
      let dur = rawDur.trim();
      if (/^\d+$/.test(dur)) dur = fmtTime(+dur);
      else if (/^\d+:\d+:\d+$/.test(dur) && dur.startsWith('0:')) dur = dur.slice(2);
      return {
        id: text(it, 'guid') || (enc && enc.getAttribute('url')) || `ep-${i}`,
        title: text(it, 'title'), desc, date: text(it, 'pubDate') ? new Date(text(it, 'pubDate')).toISOString() : '',
        audio: enc ? enc.getAttribute('url') : '', dur,
        img: (ii && ii.getAttribute('href')) || fallbackImg, link: text(it, 'link'),
        num: numEl ? +numEl : 0,
      };
    });
    out.sort((a, b) => new Date(b.date) - new Date(a.date));
    out.forEach((e, i) => { if (!e.num) e.num = out.length - i; });
    return out;
  }
  const CHAIN = [
    u => u,
    u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  ];
  async function fetchFeed() {
    let lastErr;
    for (const wrap of CHAIN) {
      try {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 9000);
        const r = await fetch(wrap(RSS_URL), { signal: ctl.signal, cache: 'no-store' }); clearTimeout(t);
        if (!r.ok) throw new Error(r.status);
        return parseRSS(await r.text());
      } catch (e) { lastErr = e; }
    }
    throw lastErr;
  }
  async function fetchSnapshot() {
    const r = await fetch('episodes.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('no snapshot');
    const j = await r.json();
    if (!j.episodes || !j.episodes.length) throw new Error('empty snapshot');
    return j.episodes;
  }

  const liveText = $('#liveText');
  const stamp = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  function apply(list, announce) {
    const prev = episodes[0] && episodes[0].id;
    episodes = list;
    $('#badgeCount').textContent = `${episodes.length} EPISODES`;
    renderHero(); renderRail(); renderList(); syncUI();
    if (announce && prev && prev !== episodes[0].id) toast(`New episode: ${episodes[0].title}`);
  }
  async function refresh(announce = true) {
    try {
      const list = await fetchFeed();
      apply(list, announce);
      liveText.textContent = `Last checked: ${stamp()} • Auto-updates Fridays 06:00 AM GMT`;
      return true;
    } catch {
      liveText.textContent = episodes.length
        ? `Showing saved episodes • Auto-updates Fridays 06:00 AM GMT`
        : `Feed offline • Auto-updates Fridays 06:00 AM GMT`;
      return false;
    }
  }
  (async () => {
    railEl.innerHTML = Array.from({ length: 4 }, () => `<article class="ep"><div class="skel" style="aspect-ratio:1"></div><div class="ep__body"><div class="skel skel--line"></div><div class="skel skel--line skel--short"></div></div></article>`).join('');
    try { apply(await fetchSnapshot(), false); liveText.textContent = `Loading latest • Auto-updates Fridays 06:00 AM GMT`; } catch { /* snapshot not available yet */ }
    await refresh(false);
    if (!episodes.length) { renderHero(); renderRail(); renderList(); }

    // Friday 06:00 GMT: check at the drop, then retry every 3 minutes for up to an hour until a new top episode appears.
    const arm = () => {
      const ms = Math.max(1000, nextDrop() - Date.now() + 5000);
      setTimeout(async () => {
        const top = episodes[0] && episodes[0].id;
        for (let n = 0; n < 20; n++) {
          await refresh(true);
          if (!top || (episodes[0] && episodes[0].id !== top)) break;
          await new Promise(r => setTimeout(r, 180000));
        }
        arm();
      }, Math.min(ms, 2147483000));
    };
    arm();
    let lastCheck = Date.now();
    document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastCheck > 30 * 60 * 1000) { lastCheck = Date.now(); refresh(true); } });
  })();
})();
