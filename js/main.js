/* EXMACHINA LATINO AMERICA — main.js */
(function () {
  'use strict';
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- LOADER ---------- */
  const loader = document.getElementById('loader');
  let loaderDone = false;
  function closeLoader() {
    if (loaderDone) return; loaderDone = true;
    loader.classList.add('is-done');
    setTimeout(() => loader.remove(), 900);
  }
  Promise.race([
    Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise(r => (document.readyState === 'complete') ? r() : window.addEventListener('load', r, { once: true }))]),
    new Promise(r => setTimeout(r, 2100))
  ]).then(() => setTimeout(closeLoader, reduced ? 100 : 450));
  setTimeout(closeLoader, 3200); // hard cap: never a frozen intro

  /* ---------- TYPOGRAPHY FIXES ---------- */
  // NT Dapper Trial: í draws without accent → dotless ı + combining acute
  function dapperFix(root) {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!/[íÍ]/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        if (n.parentElement.closest('.mono, .jabin, .u-font, .eyebrow, .foot-label, .member-bio, script, style')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = []; let n;
    while ((n = tw.nextNode())) nodes.push(n);
    nodes.forEach(node => {
      node.nodeValue = node.nodeValue.replace(/í/g, 'ı́').replace(/Í/g, 'Í');
    });
  }

  // NT Dapper Trial: no acute capitals → overlay the accent mark
  const ACC = { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U' };
  function accentify(el) {
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        return /[ÁÉÍÓÚ]/.test(n.nodeValue) && !n.parentElement.closest('.jabin')
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = []; let n;
    while ((n = tw.nextNode())) nodes.push(n);
    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      // split on whitespace first: an accented word is wrapped whole in .nb so the
      // inline-block accent spans can't become line-break opportunities mid-word
      node.nodeValue.split(/(\s+)/).forEach(token => {
        if (!token) return;
        if (!/[ÁÉÍÓÚ]/.test(token)) { frag.appendChild(document.createTextNode(token)); return; }
        const wrap = document.createElement('span');
        wrap.className = 'nb';
        token.split(/([ÁÉÍÓÚ])/).forEach(part => {
          if (ACC[part]) {
            const s = document.createElement('span');
            s.className = 'dx';
            s.innerHTML = ACC[part] + '<i aria-hidden="true">´</i>';
            wrap.appendChild(s);
          } else if (part) wrap.appendChild(document.createTextNode(part));
        });
        frag.appendChild(wrap);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  // split into word spans, preserving element tokens (e.g. <em class="jabin">)
  function splitWords(el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const kids = [...el.childNodes];
    el.textContent = '';
    const holder = document.createElement('span');
    holder.setAttribute('aria-hidden', 'true');
    kids.forEach(node => {
      if (node.nodeType === 1) {
        node.classList.add('w');
        holder.appendChild(node);
        holder.appendChild(document.createTextNode(' '));
      } else {
        node.nodeValue.split(/\s+/).filter(Boolean).forEach(word => {
          const s = document.createElement('span');
          s.className = 'w'; s.textContent = word;
          holder.appendChild(s);
          holder.appendChild(document.createTextNode(' '));
        });
      }
    });
    el.appendChild(holder);
    return [...el.querySelectorAll('.w')];
  }

  dapperFix(document.body);
  const ilumSets = [];
  document.querySelectorAll('[data-ilum]').forEach(el => { ilumSets.push({ el, words: splitWords(el) }); });
  document.querySelectorAll('.u-font').forEach(accentify);

  /* ---------- MARQUEE ---------- */
  const LOGOS = [
    ['logo_fender', 'Fender'], ['logo_ax', 'Armani Exchange'],
    ['logo_cacao', 'Cacao Nativa'], ['logo_un', 'United Nations']
  ];
  const track = document.getElementById('mqtrack');
  if (track) {
    let html = '';
    for (let rep = 0; rep < 2; rep++) {         // duplicated track for seamless -50% loop
      for (let i = 0; i < 20; i++) {            // 20 logos per pass
        const [img, name] = LOGOS[i % LOGOS.length];
        html += `<div class="mq-item"${rep ? ' aria-hidden="true"' : ''}><img src="img/${img}.webp" alt="${rep ? '' : name}" loading="lazy" width="300" height="135"></div>`;
      }
    }
    track.innerHTML = html;
    requestAnimationFrame(() => {
      const half = track.scrollWidth / 2;
      track.style.setProperty('--mq-dur', Math.max(18, Math.round(half / 105)) + 's'); // ~105 px/s
    });
  }

  /* ---------- HERO CAROUSEL ---------- */
  const hero = document.querySelector('.hero');
  const slides = [...document.querySelectorAll('.hero-slide')];
  const dots = [...document.querySelectorAll('.hero-dots .dot')];
  const fills = dots.map(d => d.querySelector('.dot-fill'));
  const FADE = 950;           // must match the CSS crossfade
  const HOLD = 4000, HOLD_MANUAL = 5200;
  let cur = 0, holdMs = HOLD, timerId = null, startedAt = 0, remaining = HOLD, isPaused = false;

  // decode the next image ahead of time so the crossfade never waits on network
  function preload(i) {
    const img = slides[(i + slides.length) % slides.length].querySelector('img');
    if (img && !img.complete) { img.loading = 'eager'; img.fetchPriority = 'low'; }
  }

  function goTo(i, userInitiated) {
    const next = (i + slides.length) % slides.length;
    if (next === cur) return;
    const outgoing = slides[cur];
    outgoing.classList.remove('is-active');
    outgoing.classList.add('is-leaving');
    setTimeout(() => outgoing.classList.remove('is-leaving'), FADE);
    cur = next;
    const s = slides[cur];
    s.classList.add('is-active');
    // restart the ken-burns so every slide gets the full drift, not a partial one
    const img = s.querySelector('img');
    if (img && !reduced) { img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; }
    dots.forEach((d, k) => {
      d.classList.toggle('is-active', k === cur);
      d.setAttribute('aria-selected', k === cur ? 'true' : 'false');
    });
    // a manual pick holds a little longer so the choice is actually seen
    holdMs = userInitiated ? HOLD_MANUAL : HOLD;
    hero.style.setProperty('--hold', holdMs + 'ms');
    const f = fills[cur];
    if (f && !reduced) { f.style.animation = 'none'; void f.offsetWidth; f.style.animation = ''; }
    preload(cur + 1);
    arm(holdMs);
  }

  /* The bar is the visible clock, but a timer is the authority: on mobile the
     animationend can be throttled or dropped and the carousel would just stop.
     Whichever fires first advances; arm() cancels the other. */
  // Reduced-motion still advances: what that setting asks us to drop is vestibular
  // movement (parallax, zoom, drift), not a plain opacity dissolve. Killing the
  // autoplay outright would leave those users staring at a single frozen frame.
  function arm(ms) {
    clearTimeout(timerId);
    remaining = ms;
    startedAt = Date.now();
    timerId = setTimeout(() => goTo(cur + 1), ms);
  }
  function pauseClock() {
    if (isPaused) return;
    isPaused = true;
    clearTimeout(timerId);
    remaining = Math.max(400, remaining - (Date.now() - startedAt));
  }
  function resumeClock() {
    if (!isPaused) return;
    isPaused = false;
    startedAt = Date.now();
    timerId = setTimeout(() => goTo(cur + 1), remaining);
  }

  fills.forEach((f, k) => f.addEventListener('animationend', e => {
    if (e.animationName === 'dotFill' && k === cur && !isPaused) goTo(cur + 1);
  }));

  dots.forEach((d, k) => d.addEventListener('click', () => goTo(k, true)));
  // Hovering means the user is looking — don't yank the image away mid-read.
  // Mouse-only: on touch, pointerenter fires on tap and pointerleave often never
  // arrives, which would freeze the carousel for good.
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    hero.addEventListener('mouseenter', () => { hero.classList.add('is-paused'); pauseClock(); });
    hero.addEventListener('mouseleave', () => { hero.classList.remove('is-paused'); resumeClock(); });
  }
  // a backgrounded tab throttles timers; restart cleanly instead of jumping slides
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseClock();
    else { resumeClock(); if (!isPaused && !timerId) arm(holdMs); }
  });

  // arrow keys while a dot has focus — the standard tablist interaction
  document.querySelector('.hero-dots').addEventListener('keydown', e => {
    let n = null;
    if (e.key === 'ArrowRight') n = cur + 1;
    if (e.key === 'ArrowLeft') n = cur - 1;
    if (n === null) return;
    e.preventDefault();
    goTo(n, true);
    dots[(n + dots.length) % dots.length].focus();
  });
  let sx = null;
  hero.addEventListener('pointerdown', e => { sx = e.clientX; }, { passive: true });
  hero.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 45) goTo(cur + (dx < 0 ? 1 : -1), true);
  }, { passive: true });

  preload(1);
  hero.style.setProperty('--hold', HOLD + 'ms');
  arm(HOLD);

  /* ---------- HERO PARALLAX (mouse + scroll) ---------- */
  // The chrome lettering is baked into each photo, so the whole frame drifts —
  // enough to feel alive, small enough that it never reads as a moving image.
  if (!reduced) {
    let tx = 0, ty = 0, cx = 0, cy = 0, praf = null;
    // the photo drifts a little, the lettering noticeably more: same cursor, two
    // depths. Opposed signs make the gap read stronger without moving either far.
    const BG_X = 12, BG_Y = 8, LT_X = -26, LT_Y = -17;  // kept inside the 5% overscan
    function ease() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      hero.style.setProperty('--px', (cx * BG_X).toFixed(2) + 'px');
      hero.style.setProperty('--py', (cy * BG_Y).toFixed(2) + 'px');
      hero.style.setProperty('--lx', (cx * LT_X).toFixed(2) + 'px');
      hero.style.setProperty('--ly', (cy * LT_Y).toFixed(2) + 'px');
      praf = (Math.abs(tx - cx) > 0.0015 || Math.abs(ty - cy) > 0.0015)
        ? requestAnimationFrame(ease) : null;
    }
    function aim(e) {
      const r = hero.getBoundingClientRect();
      if (!r.width) return;
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!praf) ease();   // step now, then let rAF carry the easing
    }
    if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      hero.addEventListener('pointermove', aim, { passive: true });
      hero.addEventListener('pointerleave', () => { tx = ty = 0; if (!praf) ease(); });
    }
  }

  /* ---------- SERVICE CARDS (touch toggle) ---------- */
  const touchUI = window.matchMedia('(hover: none)').matches;
  document.querySelectorAll('.serv').forEach(card => {
    card.addEventListener('click', () => {
      if (!touchUI) return;
      const open = card.classList.contains('is-open');
      document.querySelectorAll('.serv.is-open').forEach(c => c.classList.remove('is-open'));
      if (!open) card.classList.add('is-open');
    });
  });

  /* ---------- SCROLLSPY ---------- */
  const spyMap = { manifiesto: 'manifiesto', trabajo: 'trabajo', contacto: 'contacto' };
  const links = [...document.querySelectorAll('.pill-link')];
  const spyIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      links.forEach(l => l.classList.toggle('is-active', l.dataset.spy === id));
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  Object.values(spyMap).forEach(id => { const el = document.getElementById(id); if (el) spyIO.observe(el); });

  /* ---------- PENDING SOCIAL LINKS ---------- */
  document.querySelectorAll('[data-pending]').forEach(a => {
    a.setAttribute('aria-disabled', 'true');
    a.title = 'Muy pronto';
    a.style.opacity = '.6';
    a.addEventListener('click', e => e.preventDefault());
  });

  /* ---------- MOTION (GSAP + Lenis) ---------- */
  function initMotion() {
    if (!window.gsap || !window.ScrollTrigger) { doc.classList.add('anim-ready'); return; }
    gsap.registerPlugin(ScrollTrigger);

    // Lenis smooth scroll (fine pointers, no reduced motion)
    let lenis = null;
    if (!reduced && window.Lenis && window.matchMedia('(pointer: fine)').matches) {
      doc.classList.add('lenis');
      lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1.05 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    // anchor nav
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.4 });
        else t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
        history.pushState(null, '', id);
      });
    });

    if (reduced) { doc.classList.add('anim-ready'); window.__animOK = true; ScrollTrigger.refresh(); return; }

    // reveals
    document.querySelectorAll('[data-reveal]').forEach(el => {
      gsap.fromTo(el, { y: 36, opacity: 0 }, {
        y: 0, opacity: 1, duration: .95, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
    document.querySelectorAll('[data-reveal-group]').forEach(group => {
      gsap.fromTo(group.children, { y: 44, opacity: 0 }, {
        y: 0, opacity: 1, duration: .9, ease: 'power3.out', stagger: .12,
        scrollTrigger: { trigger: group, start: 'top 86%', once: true }
      });
    });
    document.querySelectorAll('[data-clip]').forEach(el => {
      gsap.fromTo(el,
        { clipPath: 'inset(14% 6% 14% 6% round 18px)', scale: 1.05 },
        {
          clipPath: 'inset(0% 0% 0% 0% round 18px)', scale: 1, duration: 1.25, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true }
        });
    });

    // creai-style word illumination (scrub — works with touch scroll)
    ilumSets.forEach(({ el, words }) => {
      gsap.fromTo(words, { opacity: 0.13 }, {
        opacity: 1, ease: 'none', stagger: 0.045,
        scrollTrigger: { trigger: el, start: 'top 84%', end: 'top 32%', scrub: 0.6 }
      });
    });

    // manifesto ghost numbers parallax
    document.querySelectorAll('.mani-item').forEach(item => {
      const g = item.querySelector('.mani-ghost');
      if (!g) return;
      gsap.fromTo(g, { yPercent: -70 }, {
        yPercent: -30, ease: 'none',
        scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // hero content settles after loader
    gsap.from('.hero-slides', { scale: 1.06, duration: 1.6, ease: 'power2.out', delay: 2.35 });

    // scroll parallax — this is what keeps the hero alive on touch, where the
    // pointer drift never happens
    gsap.to('.hero-slides', {
      yPercent: 13, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.4 }
    });
    // lettering climbs faster than the photo — the depth cue that works on touch,
    // where there is no cursor to drive the drift
    gsap.to('.hero-letter', {
      yPercent: -22, scale: 1.06, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.25 }
    });
    gsap.to('.hero-dots', {
      opacity: 0, y: 20, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '38% top', scrub: 0.3 }
    });

    // late-loading fonts and images shift layout after triggers are measured
    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      if (!img.complete) img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
    });

    window.__animOK = true;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMotion);
  else initMotion();

  // safety: never leave content hidden
  setTimeout(() => { if (!window.__animOK) doc.classList.add('anim-ready'); }, 3000);
})();
