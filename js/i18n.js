/* EXMACHINA — traducción ES/EN
   Se carga ANTES de main.js y a propósito: main.js reescribe el DOM al arrancar
   (parte los titulares en palabras para la iluminación, sustituye las vocales
   acentuadas que NT Dapper no dibuja, e inyecta los SVG de los trazos a mano).
   Si se tradujera después habría que deshacer y rehacer todo eso. Traduciendo
   antes, main.js sólo ve el idioma ya elegido y no se entera de que existe.

   Por lo mismo, cambiar de idioma recarga la página en vez de intercambiar texto
   en caliente: la preferencia queda guardada, se conserva el scroll y se salta la
   intro, así que se siente como un cambio inmediato — pero pasa por el mismo
   camino que una visita normal, que es el único que garantiza que los acentos,
   el reparto en palabras y los trazos queden bien. */
(function () {
  'use strict';

  const EN = {
    // ---- documento
    'doc.title': 'ExMachina Latino America — Consultancy in technological creativity and artificial intelligence',
    'doc.desc': 'We are ExMachina Latino America: branding, web experiences and software with AI agents. Human experience combined with artificial intelligence.',
    // ---- navegación
    'nav.manifiesto': 'Manifesto', 'nav.trabajo': 'Work', 'nav.contacto': 'Contact',
    'nav.servicios': 'Services', 'nav.equipo': 'Team', 'nav.menu': 'Menu',
    'nav.aria': 'Main navigation', 'nav.inicio': 'ExMachina Latino America — home',
    // ---- hero
    'hero.1': 'Represents<br>an emotional<br>shift',
    'hero.2': 'Reimagines<br>visions that<br>transcend',
    'hero.3': 'Rethinks<br>Technology<br>Strategy',
    'hero.4': 'Designs<br>New<br>Horizons',
    'hero.aria': 'Carousel images',
    // ---- intro
    'intro.eyebrow': 'REAL DESIGN, TOP SPEED',
    'intro.h': 'Branding, web experiences and bespoke software for the digital era, since 2013',
    'intro.p': 'We design it ourselves \u2014 artificial intelligence only makes us faster and takes us further. 100% bespoke (and customisable) solutions, zero templates, built for businesses across Latin America.',
    // ---- servicios
    'serv.tag': 'The opportunity',
    'serv.h1': 'Your brand backed by',
    'serv.h2': 'a highly specialised team.',
    'serv.sub': 'The only 3 services your business needs to stay relevant in a world this changeable:',
    'serv.1.t': 'Branding.',
    'serv.1.d': 'Visual identity systems that scale with you. From a new face to owning a category: elemental, functional and timeless work.',
    'serv.2.t': 'Web Experiences',
    'serv.2.d': 'Intuitive interfaces that turn first impressions into results. From a landing page to an online store, matched to where you are growing.',
    'serv.3.t': 'Software with AI agents',
    'serv.3.d': 'We understand your operation and automate it: dashboards, online quoting, messaging managers. You show us your industry, we do the rest.',
    // ---- clientes
    'cli.statement': 'Since 2013 our work has spanned multiple industries, creating synergy with different businesses, people and organisations',
    'cli.aria': 'Clients',
    // ---- somos
    'somos.we': 'WE ARE',
    'somos.sub1': 'CONSULTANCY IN TECHNOLOGICAL CREATIVITY',
    'somos.sub2': 'AND ARTIFICIAL INTELLIGENCE',
    'somos.sub3': 'FOUNDED IN MEXICO',
    'somos.mono': 'WE ARE A TEAM THAT HAS WORKED ACTIVELY IN THE NATIONAL AND INTERNATIONAL CREATIVE INDUSTRIES SINCE 2013',
    // ---- manifiesto
    // Los titulares llevan el trazo dibujado ADENTRO, así que su valor es marcado
    // completo: el garabato se dibuja alrededor de ese hijo y sin él no tendría
    // nada que encerrar. En 'Latin' el adjetivo se va al frente en inglés — el
    // hijo cambia de posición, no sólo de texto, y por eso no basta traducir hojas.
    'mani.1.h': 'HUMAN EXPERIENCE COMBINED WITH <span class="mk-circle">ARTIFICIAL INTELLIGENCE</span>',
    'mani.1.p': 'the best of both worlds. Today\u2019s narrative is about AI thinking for humans; at ExMachina we use AI so humans can become the best version of themselves, their ideas and their businesses',
    'mani.2.h': '<em class="mk-gr">Latin</em> TECHNOLOGY OF GLOBAL REACH',
    'mani.2.p': 'we believe good technology should look and feel good, and we believe it should be within reach of every business in Latin America.',
    'mani.3.h': 'WE ARE MULTIDISCIPLINARY AND <span class="mk-ul">HIGHLY CURIOUS MINDS</span>',
    'mani.3.p': 'designers, masters in international relations, consultants in business and innovation, digital marketers. Our team studies and tries to understand the social dynamics of our world through constant cultural analysis and satisfied curiosity',
    'mani.4.h': 'TOP SPEED WITHOUT COMPROMISING QUALITY OR COMMITMENT TO <span class="mk-crown">EXCELLENCE</span>',
    'mani.4.p': 'thanks to our experience and our way of working with the latest models in artificial intelligence, we have the ability to materialise several visions at once, efficiently and always keeping international quality',
    'mani.5.h': 'DESIGN AND TECHNOLOGY, A NEW <em class="mk-gr">Unity</em>',
    'mani.5.p': 'there is no industry where the power of good design combined with artificial intelligence and strategic analysis does not generate disruptive, scalable, automated and highly monetisable change.',
    'mani.6.h': 'WE WORK FROM ANY <span class="mk-hl">PART OF THE WORLD</span>',
    'mani.6.p': 'we are travelling souls who feed on sharing and living new experiences. That does not stop us from collaborating actively in multiple time zones, and when we coincide in the same place, we invite each other to a meal or a coffee',
    // ---- trabajo
    'work.tag': 'Selected work',
    'work.h1': 'Rebranding', 'work.h2': 'that makes you fall in love',
    'work.who': 'Wedding Films Punta Cana',
    'work.role': 'Wedding Planner Senior & Co-founder',
    'work.next': 'More work coming soon',
    // ---- equipo
    'team.tag': 'The team',
    'team.h': 'PEOPLE',
    'team.kyra': 'Operations & Management',
    'team.ceci': 'Consultant in design, innovation and business',
    'team.alan': 'Design and Development',
    'team.clawd': 'Artificial intelligence model',
    // ---- pie
    'foot.talk': 'Shall we talk?',
    'foot.mail': 'Write to us',
    'foot.phone': 'Call us',
    'foot.rights': 'All rights reserved',
    // ---- interfaz
    'ui.tema': 'Dark mode',
    'ui.temaClaro': 'Light mode',
    'ui.pending': 'Coming soon'
  };

  const raiz = document.documentElement;
  const lang = raiz.lang === 'en' ? 'en' : 'es';

  if (lang === 'en') {
    // texto plano
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = EN[el.getAttribute('data-i18n')];
      if (v != null) el.textContent = v;
    });
    // los que llevan marcado adentro (un span de color, un trazo dibujado): se
    // traduce el hueco de texto y el hijo se conserva, porque el trazo se dibuja
    // alrededor de ESE hijo y perderlo dejaría al garabato sin nada que encerrar
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const v = EN[el.getAttribute('data-i18n-html')];
      if (v != null) el.innerHTML = v;
    });
    // atributos: alt, aria-label, title…
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.getAttribute('data-i18n-attr').split(',').forEach(par => {
        const i = par.indexOf(':');
        const attr = par.slice(0, i), clave = par.slice(i + 1);
        const v = EN[clave];
        if (v != null) el.setAttribute(attr, v);
      });
    });
    if (EN['doc.title']) document.title = EN['doc.title'];
    const md = document.querySelector('meta[name="description"]');
    if (md && EN['doc.desc']) md.setAttribute('content', EN['doc.desc']);
  }

  // el botón guarda y recarga; el <head> ya sabe aplicar la preferencia
  document.querySelectorAll('[data-lang]').forEach(b => {
    const suyo = b.getAttribute('data-lang');
    b.classList.toggle('is-on', suyo === lang);
    b.setAttribute('aria-pressed', suyo === lang ? 'true' : 'false');
    b.addEventListener('click', () => {
      if (suyo === lang) return;
      try {
        localStorage.setItem('exm-idioma', suyo);
        sessionStorage.setItem('exm-scroll', String(window.scrollY));
        sessionStorage.setItem('exm-sin-intro', '1');   // no repetir el loader
      } catch (e) {}
      location.reload();
    });
  });

  window.__EXM_I18N = EN;
})();
