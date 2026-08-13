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
    // the hero only starts counting once it is actually on screen, so the first
    // slide gets its full time and the progress bar starts from zero in view
    document.dispatchEvent(new CustomEvent('exm:herolive'));
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

  /* ---------- HAND-DRAWN UNDERLINES ---------- */
  // Built in JS rather than hard-coded so each one gets its own wobble: a ruler-
  // straight rule under display caps reads as a text-decoration, not as a mark
  // someone made. Drawn on scroll via ScrollTrigger below.
  function buildUnderlines() {
    document.querySelectorAll('.mk-ul').forEach((el, i) => {
      if (el.querySelector('svg')) return;
      const seed = i * 37 + 11;
      const rnd = n => ((Math.sin(seed * (n + 1)) + 1) / 2);        // deterministic
      const W = 100, H = 12;
      const y0 = 6 + (rnd(1) - 0.5) * 2.4;
      const pts = [
        `M 0 ${(y0 + 1.6).toFixed(2)}`,
        `C ${18 + rnd(2) * 6} ${(y0 - 3 - rnd(3) * 1.6).toFixed(2)},` +
        ` ${38 + rnd(4) * 8} ${(y0 + 3.4 + rnd(5) * 1.4).toFixed(2)},` +
        ` ${58 + rnd(6) * 5} ${(y0 - 0.6).toFixed(2)}`,
        `S ${84 + rnd(7) * 6} ${(y0 + 3.2 + rnd(8)).toFixed(2)}, ${W} ${(y0 - 1.4).toFixed(2)}`
      ].join(' ');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pts);
      svg.appendChild(path);
      el.appendChild(svg);
      const len = path.getTotalLength() || 120;
      path.style.setProperty('--len', len);
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = reduced ? 0 : len;
    });
  }
  buildUnderlines();

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
  const HOLD = 4000;          // one rhythm for auto and manual — predictable
  let cur = 0, timerId = null, live = false;

  // decode the next image ahead of time so the crossfade never waits on network
  function preload(i) {
    const img = slides[(i + slides.length) % slides.length].querySelector('img');
    if (img && !img.complete) { img.loading = 'eager'; img.fetchPriority = 'low'; }
  }

  function restart(el) {                       // replay a CSS animation from 0
    if (!el || reduced) return;
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  }

  function goTo(i) {
    const next = (i + slides.length) % slides.length;
    if (next !== cur) {
      const outgoing = slides[cur];
      outgoing.classList.remove('is-active');
      outgoing.classList.add('is-leaving');
      setTimeout(() => outgoing.classList.remove('is-leaving'), FADE);
      cur = next;
      slides[cur].classList.add('is-active');
      restart(slides[cur].querySelector('img'));   // full ken-burns per slide
      dots.forEach((d, k) => {
        d.classList.toggle('is-active', k === cur);
        d.setAttribute('aria-selected', k === cur ? 'true' : 'false');
      });
    }
    restart(fills[cur]);                           // progress bar back to zero
    preload(cur + 1);
    schedule(HOLD);                                // always leaves a live timer
  }

  /* The carousel never pauses. Hover-to-pause is wrong for a full-bleed hero: the
     cursor is over it the whole time a visitor is reading, so the thing sat frozen
     and only moved when the mouse left the window. One timer, one schedule().
     Not gated on document.hidden either — some contexts report hidden while
     perfectly visible, and browsers already throttle background timers. */
  function clearTimer() { if (timerId) { clearTimeout(timerId); timerId = null; } }
  function schedule(ms) {
    clearTimer();
    if (live) timerId = setTimeout(tick, ms);
  }
  function tick() { timerId = null; goTo(cur + 1); }

  fills.forEach((f, k) => f.addEventListener('animationend', e => {
    if (e.animationName === 'dotFill' && k === cur && live) goTo(cur + 1);
  }));

  dots.forEach((d, k) => d.addEventListener('click', () => goTo(k)));
  // returning to the tab gives the current slide a fresh full hold instead of
  // firing instantly on the time that passed while away
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && live) { restart(fills[cur]); schedule(HOLD); }
  });
  // Belt and braces: if any combination of clicks, tab switches or a dropped
  // animation event ever leaves it without a timer, this puts one back.
  setInterval(() => { if (live && !timerId) schedule(HOLD); }, 1200);

  // arrow keys while a dot has focus — the standard tablist interaction
  document.querySelector('.hero-dots').addEventListener('keydown', e => {
    let n = null;
    if (e.key === 'ArrowRight') n = cur + 1;
    if (e.key === 'ArrowLeft') n = cur - 1;
    if (n === null) return;
    e.preventDefault();
    goTo(n);
    dots[(n + dots.length) % dots.length].focus();
  });
  let sx = null;
  hero.addEventListener('pointerdown', e => { sx = e.clientX; }, { passive: true });
  hero.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 45) goTo(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });

  preload(1);
  hero.style.setProperty('--hold', HOLD + 'ms');

  // Go live only once the intro clears, so the first slide is seen from its start
  // and the bar visibly fills from zero — that is the cue that it is progressing.
  function goLive() {
    if (live) return;
    live = true;
    hero.classList.add('is-live');
    restart(fills[cur]);
    restart(slides[cur].querySelector('img'));
    schedule(HOLD);
  }
  document.addEventListener('exm:herolive', goLive, { once: true });
  setTimeout(goLive, 3600);   // fallback: never depend on that one event

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

    // underlines draw themselves as the line arrives, just after its words light up
    document.querySelectorAll('.mk-ul path').forEach(path => {
      gsap.to(path, {
        strokeDashoffset: 0, duration: .85, ease: 'power2.inOut',
        scrollTrigger: { trigger: path.closest('.mani-h') || path, start: 'top 70%', once: true }
      });
    });
    // italics and tags settle in with a small skew/rise — enough to register as
    // deliberate emphasis without turning into a separate animation
    document.querySelectorAll('.mk-it, .mk-gr').forEach(el => {
      gsap.from(el, {
        yPercent: 22, opacity: 0, rotate: el.classList.contains('mk-gr') ? -3.5 : 0,
        duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: el.closest('.mani-h') || el, start: 'top 78%', once: true }
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
