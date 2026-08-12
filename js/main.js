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

  // NT Umami Trial: no acute vowels → overlay accent mark
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
  const slides = [...document.querySelectorAll('.hero-slide')];
  const dots = [...document.querySelectorAll('.hero-dots .dot')];
  let cur = 0, timer = null;
  function goTo(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === cur));
    dots.forEach((d, k) => {
      d.classList.toggle('is-active', k === cur);
      if (k === cur) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
  }
  function play() { if (!reduced && !timer) timer = setInterval(() => goTo(cur + 1), 5600); }
  function stop() { clearInterval(timer); timer = null; }
  dots.forEach((d, k) => d.addEventListener('click', () => { stop(); goTo(k); play(); }));
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : play());
  const hero = document.querySelector('.hero');
  let sx = null;
  hero.addEventListener('pointerdown', e => { sx = e.clientX; }, { passive: true });
  hero.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 45) { stop(); goTo(cur + (dx < 0 ? 1 : -1)); play(); }
  }, { passive: true });
  play();

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
