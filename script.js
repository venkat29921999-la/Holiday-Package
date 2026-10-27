/* ==========================================================
   Stackly Holidays - interactions & animations
   Libraries: GSAP + ScrollTrigger, AOS (all loaded in index.html)
   Everything degrades gracefully if a CDN script fails to load.
   ========================================================== */
(() => {
  'use strict';
  if (document.querySelector('.ab-page, .sv-page, .bl-page, .ct-page')) return; // About + Services + Blog + Contact pages use their own blocks below

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const hasGSAP = typeof gsap !== 'undefined';
  const hasST = hasGSAP && typeof ScrollTrigger !== 'undefined';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const animate = hasGSAP && !reduce;

  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- AOS (scroll reveal) ---------- */
  if (typeof AOS === 'undefined' || reduce) {
    $$('[data-aos]').forEach(el => el.removeAttribute('data-aos'));
  } else {
    AOS.init({ duration: 900, easing: 'ease-out-cubic', once: true, offset: 70 });
  }

  /* ---------- Helpers ---------- */
  function splitWords(el) {
    const walk = node => {
      Array.from(node.childNodes).forEach(ch => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.textContent = part;
            w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) { walk(ch); }
      });
    };
    walk(el);
    return $$('.w > span', el);
  }

  /* ---------- Elements ---------- */
  const header = $('#header');
  const nav = $('#mainNav');
  const burger = $('#hamburger');
  const progress = $('#scrollProgress');
  const toTop = $('#toTop');
  const body = document.body;

  /* ==========================================================
     Preloader  ->  hero intro
     ========================================================== */
  const heroSpans = animate ? splitWords($('#heroTitle')) : [];
  if (animate) gsap.set(heroSpans, { yPercent: 110 });

  function heroIntro() {
    if (!animate) return;
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.hero-bg img', { scale: 1.3, duration: 2.6, ease: 'power3.out' }, 0)
      .from('.logo, .nav-list li, .header-actions', { y: -30, opacity: 0, duration: .9, stagger: .1, clearProps: 'all' }, .2)
      .to(heroSpans, { yPercent: 0, duration: 1.15, stagger: .07 }, .3)
      .from('[data-hero="fade"]', { y: 30, opacity: 0, duration: 1, stagger: .14 }, .55)
      .from('.h-card', { y: 90, opacity: 0, scale: .85, rotation: i => [-7, 6, -5, 7][i] || 0, duration: 1.3, stagger: .13, ease: 'back.out(1.4)' }, .5)
      .from('.spin-badge', { scale: 0, rotation: -180, duration: 1.1, ease: 'back.out(1.7)' }, 1.1)
      .from('.booking-bar', { y: 60, opacity: 0, duration: 1 }, 1)
      .from('.scroll-hint', { opacity: 0, duration: .8 }, 1.6);
  }

  function runPreloader(done) {
    const pre = $('#preloader');
    if (!pre) return done();
    if (!animate) { pre.remove(); return done(); }

    const cnt = $('#preCount'), bar = $('#preBar');
    const o = { v: 0 };
    let loaded = document.readyState === 'complete';
    let finished = false;
    window.addEventListener('load', () => { loaded = true; });
    body.classList.add('lock');

    const finish = () => {
      if (finished) return; finished = true;
      gsap.timeline({ onComplete: () => { pre.remove(); body.classList.remove('lock'); } })
        .to('.pre-center', { opacity: 0, y: -24, duration: .5, ease: 'power2.in' })
        .to('.pre-top', { yPercent: -100, duration: 1.05, ease: 'power4.inOut' }, '>-.05')
        .to('.pre-bottom', { yPercent: 100, duration: 1.05, ease: 'power4.inOut' }, '<')
        .call(done, null, '<+.35');
    };

    gsap.to(o, {
      v: 100, duration: 1.8, ease: 'power2.inOut',
      onUpdate() { cnt.textContent = Math.round(o.v); bar.style.transform = 'scaleX(' + (o.v / 100) + ')'; },
      onComplete() { loaded ? finish() : window.addEventListener('load', finish, { once: true }); }
    });
    setTimeout(finish, 6500); // safety net
  }

  /* ==========================================================
     Header, menu, progress, active link
     ========================================================== */
  let lastY = window.scrollY, ticking = false;
  const heroEl = $('#home');

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', y > 40);
    const menuOpen = nav.classList.contains('open');
    if (y > lastY && y > 480 && !menuOpen) header.classList.add('hide');
    else if (y < lastY - 4 || y < 480) header.classList.remove('hide');
    lastY = y;
    progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    toTop.classList.toggle('show', y > 900);
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  function setMenu(open) {
    nav.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    body.classList.toggle('lock', open);
    if (open && animate) {
      gsap.fromTo('.nav-list li, .nav-extra', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .09, delay: .3, ease: 'power3.out', clearProps: 'transform,opacity' });
    }
  }
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  window.addEventListener('resize', () => { if (window.innerWidth >= 992 && nav.classList.contains('open')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false); });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', () => { if (nav.classList.contains('open')) setMenu(false); }));

  // active link on scroll
  const navMap = {
    home: ['home', 'strip'], about: ['about', 'destinations'], services: ['services', 'packages', 'process'],
    blog: ['testimonials', 'gallery', 'blog'], contact: ['contact']
  };
  const linkFor = {};
  $$('.nav-link').forEach(l => { linkFor[l.getAttribute('href').slice(1)] = l; });
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      const key = Object.keys(navMap).find(k => navMap[k].includes(id));
      if (!key) return;
      Object.values(linkFor).forEach(l => l.classList.remove('active'));
      linkFor[key] && linkFor[key].classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.values(navMap).flat().forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });

  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ==========================================================
     Custom cursor + magnetic buttons (fine pointers only)
     ========================================================== */
  if (animate && finePointer) {
    const cur = $('#cursor'), txt = $('#cursorText');
    gsap.set(cur, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(cur, 'x', { duration: .28, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: .28, ease: 'power3' });
    window.addEventListener('mousemove', e => { cur.classList.add('show'); xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.remove('show'));
    document.addEventListener('mouseover', e => {
      const v = e.target.closest('[data-cursor]');
      if (v) { txt.textContent = v.dataset.cursor; cur.classList.add('big'); cur.classList.remove('link'); return; }
      cur.classList.remove('big'); txt.textContent = '';
      cur.classList.toggle('link', !!e.target.closest('a, button, input, select, textarea, label, .chip'));
    });

    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)' }));
    });
  }

  /* ==========================================================
     Hero: mouse parallax, flight path
     ========================================================== */
  const stage = $('#heroStage');
  if (animate && stage) {
    if (finePointer && heroEl) {
      const layers = $$('.h-card, .spin-badge', stage);
      heroEl.addEventListener('mousemove', e => {
        const r = heroEl.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - .5;
        const ny = (e.clientY - r.top) / r.height - .5;
        layers.forEach(l => {
          const d = parseFloat(l.dataset.depth) || 20;
          gsap.to(l, { x: -nx * d, y: -ny * d, rotationY: nx * 9, rotationX: -ny * 9, transformPerspective: 900, duration: .9, ease: 'power3.out', overwrite: 'auto' });
        });
        gsap.to('.hero-bg img', { x: nx * -22, y: ny * -14, duration: 1.4, ease: 'power2.out', overwrite: 'auto' });
      });
      heroEl.addEventListener('mouseleave', () => {
        gsap.to(layers, { x: 0, y: 0, rotationX: 0, rotationY: 0, duration: 1.2, ease: 'elastic.out(1, .5)', overwrite: 'auto' });
        gsap.to('.hero-bg img', { x: 0, y: 0, duration: 1.4, ease: 'power2.out', overwrite: 'auto' });
      });
    }

    // plane flying along the dotted path
    const path = $('#flightPath'), plane = $('#plane');
    if (path && plane) {
      const len = path.getTotalLength();
      const o = { p: 0 };
      gsap.to(o, {
        p: 1, duration: 9, ease: 'none', repeat: -1,
        onUpdate() {
          const k = stage.offsetWidth / 400;
          const a = path.getPointAtLength(o.p * len);
          const b = path.getPointAtLength(Math.min(len, o.p * len + 2));
          const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
          plane.style.opacity = o.p < .04 || o.p > .96 ? 0 : 1;
          plane.style.transform = 'translate(' + (a.x * k) + 'px,' + (a.y * k) + 'px) rotate(' + ang + 'deg)';
        }
      });
    }
  }

  /* ==========================================================
     ScrollTrigger animations
     ========================================================== */
  function initScrollAnimations() {
    if (!animate || !hasST) return;

    // hero background parallax on scroll
    gsap.to('.hero-bg', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } });

    // split headings
    $$('[data-split]').forEach(el => {
      const spans = splitWords(el);
      gsap.set(spans, { yPercent: 110 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(spans, { yPercent: 0, duration: 1.1, stagger: .06, ease: 'power4.out' })
      });
    });

    // counters
    $$('[data-count]').forEach(el => {
      const end = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || '0', 10);
      const o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: () => gsap.to(o, {
          v: end, duration: 2.2, ease: 'power2.out',
          onUpdate: () => { el.textContent = dec ? o.v.toFixed(dec) : Math.round(o.v).toLocaleString('en-IN'); }
        })
      });
    });

    // image mask reveals + inner parallax
    $$('.reveal-img').forEach(el => {
      const img = $('img', el);
      gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power4.inOut',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
      gsap.fromTo(img, { scale: 1.35 }, {
        scale: 1, duration: 1.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // years badge pop
    gsap.from('.years-badge', { scale: 0, rotation: -120, duration: 1.2, ease: 'back.out(1.7)', scrollTrigger: { trigger: '.years-badge', start: 'top 92%', once: true } });

    // destinations: pinned horizontal scroll on desktop, native swipe below 992px
    const mm = gsap.matchMedia();
    mm.add('(min-width: 992px)', () => {
      const track = $('#destTrack'), pin = $('#destPin'), wrap = $('.dest-track-wrap'), bar = $('#destBar');
      if (!track || !pin) return;
      const dist = () => Math.max(0, track.scrollWidth + parseFloat(getComputedStyle(wrap).paddingLeft) - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8,
          anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: self => { bar.style.transform = 'scaleX(' + self.progress + ')'; }
        }
      });
      $$('.d-card').forEach(card => {
        gsap.fromTo($('img', card), { xPercent: -6 }, {
          xPercent: 6, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
        });
      });
    });
    mm.add('(max-width: 991px)', () => {
      gsap.from('.d-card', { x: 80, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '#destTrack', start: 'top 85%', once: true } });
    });

    // package cards entrance
    const pkgs = $$('.pkg');
    gsap.set(pkgs, { opacity: 0, y: 70 });
    ScrollTrigger.batch(pkgs, {
      start: 'top 90%', once: true,
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: .12, ease: 'power3.out' })
    });

    // timeline
    if ($('#tlFill')) {
      gsap.to('#tlFill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#timeline', start: 'top 70%', end: 'bottom 65%', scrub: true } });
      $$('.step').forEach(s => {
        gsap.from(s, { x: 40, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 88%', once: true } });
        ScrollTrigger.create({ trigger: s, start: 'top 66%', onEnter: () => s.classList.add('on'), onLeaveBack: () => s.classList.remove('on') });
      });
    }

    // gallery reveal
    const gis = $$('.gi');
    gsap.set(gis, { clipPath: 'inset(100% 0% 0% 0%)' });
    ScrollTrigger.batch(gis, {
      start: 'top 92%', once: true,
      onEnter: batch => gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power4.inOut', stagger: .1 })
    });

    // blog / contact subtle parallax on images
    $$('.post-img img').forEach(img => {
      gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // footer marquee speeds up with scroll velocity
    const fm = $('.foot-marquee-track');
    if (fm) {
      ScrollTrigger.create({
        trigger: '.footer', start: 'top bottom', end: 'bottom bottom',
        onUpdate: self => { fm.style.animationDuration = Math.max(10, 30 - Math.abs(self.getVelocity()) / 120) + 's'; }
      });
    }
  }

  /* ==========================================================
     Services: spotlight follows the pointer
     ========================================================== */
  $$('.svc').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ==========================================================
     Packages: filter, tilt, wishlist
     ========================================================== */
  const chips = $$('.chip');
  const cards = $$('.pkg');
  function applyFilter(cat) {
    const show = [], hide = [];
    cards.forEach(c => (cat === 'all' || c.dataset.cat.split(' ').includes(cat) ? show : hide).push(c));
    if (!animate) {
      hide.forEach(c => { c.style.display = 'none'; });
      show.forEach(c => { c.style.display = ''; });
      return;
    }
    gsap.killTweensOf(cards);
    gsap.to(hide, { opacity: 0, scale: .92, duration: .3, onComplete: () => hide.forEach(c => { c.style.display = 'none'; }) });
    gsap.delayedCall(.32, () => {
      show.forEach(c => { c.style.display = ''; });
      gsap.fromTo(show, { opacity: 0, y: 40, scale: .94 }, { opacity: 1, y: 0, scale: 1, duration: .75, stagger: .09, ease: 'power3.out' });
      if (hasST) ScrollTrigger.refresh();
    });
  }
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    applyFilter(chip.dataset.filter);
  }));

  if (animate && finePointer) {
    cards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        gsap.to(card, { rotationX: -py * 7, rotationY: px * 7, transformPerspective: 900, duration: .5, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => gsap.to(card, { rotationX: 0, rotationY: 0, duration: .8, ease: 'power3.out' }));
    });
  }

  $$('.wish').forEach(btn => btn.addEventListener('click', () => {
    const on = btn.classList.toggle('on');
    btn.setAttribute('aria-pressed', on);
    const i = $('i', btn);
    i.classList.toggle('fa-solid', on);
    i.classList.toggle('fa-regular', !on);
    if (animate) gsap.fromTo(btn, { scale: .6 }, { scale: 1, duration: .6, ease: 'elastic.out(1, .4)' });
  }));

  /* ==========================================================
     Testimonials slider
     ========================================================== */
  (function testimonials() {
    const slider = $('#testiSlider');
    if (!slider) return;
    const slides = $$('.t-slide', slider);
    const avs = $$('#tAvatars button');
    const bar = $('#tProgress');
    const DUR = 6.5;
    let idx = 0, timer = null, interval = null;

    function show(n, dir) {
      const len = slides.length;
      n = (n + len) % len;
      if (n === idx) return;
      const cur = slides[idx], nxt = slides[n];
      idx = n;
      avs.forEach((a, i) => a.classList.toggle('active', i === n));
      if (animate) {
        gsap.to(cur, { opacity: 0, y: -24 * dir, duration: .5, ease: 'power2.in', onComplete: () => { cur.classList.remove('active'); gsap.set(cur, { clearProps: 'all' }); } });
        nxt.classList.add('active');
        gsap.fromTo(nxt, { opacity: 0, y: 36 * dir }, { opacity: 1, y: 0, duration: .9, delay: .3, ease: 'power3.out' });
        const words = $$('p', nxt);
        gsap.fromTo(words, { filter: 'blur(6px)' }, { filter: 'blur(0px)', duration: .9, delay: .3, clearProps: 'filter' });
      } else {
        cur.classList.remove('active'); nxt.classList.add('active');
      }
      restart();
    }
    function restart() {
      if (animate) {
        if (timer) timer.kill();
        timer = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: DUR, ease: 'none', onComplete: () => show(idx + 1, 1) });
        if (hasST) ScrollTrigger.create({ trigger: slider, start: 'top bottom', end: 'bottom top', onToggle: s => (s.isActive ? timer.play() : timer.pause()) });
      } else {
        clearInterval(interval);
        interval = setInterval(() => show(idx + 1, 1), DUR * 1000);
      }
    }
    $('#tNext').addEventListener('click', () => show(idx + 1, 1));
    $('#tPrev').addEventListener('click', () => show(idx - 1, -1));
    avs.forEach((a, i) => a.addEventListener('click', () => show(i, i > idx ? 1 : -1)));
    slider.addEventListener('mouseenter', () => { if (timer) timer.pause(); });
    slider.addEventListener('mouseleave', () => { if (timer) timer.play(); });
    let sx = 0;
    slider.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    });
    restart();
  })();

  /* ==========================================================
     Gallery lightbox
     ========================================================== */
  (function lightbox() {
    const lb = $('#lightbox'), img = $('#lbImg'), cap = $('#lbCap');
    const items = $$('.gi');
    let i = 0, lastFocus = null;
    function render() {
      const fig = items[i], im = $('img', fig);
      img.src = im.currentSrc || im.src; img.alt = im.alt;
      cap.textContent = $('figcaption', fig).textContent;
      if (animate) gsap.fromTo(img, { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .6, ease: 'power3.out' });
    }
    function open(n) {
      i = n; lastFocus = document.activeElement;
      lb.hidden = false; body.classList.add('lock'); render();
      if (animate) gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: .4 });
      $('.lb-close', lb).focus();
    }
    function close() {
      const end = () => { lb.hidden = true; body.classList.remove('lock'); if (lastFocus) lastFocus.focus(); };
      animate ? gsap.to(lb, { opacity: 0, duration: .3, onComplete: end }) : end();
    }
    const step = d => { i = (i + d + items.length) % items.length; render(); };
    items.forEach((el, n) => {
      el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button');
      el.addEventListener('click', () => open(n));
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(n); } });
    });
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', () => step(-1));
    $('.lb-next', lb).addEventListener('click', () => step(1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
    let sx = 0;
    lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); });
  })();

  /* ==========================================================
     Login / sign-up modal
     ========================================================== */
  (function loginModal() {
    const modal = $('#loginModal'), openBtn = $('#loginBtn');
    const form = $('#authForm'), msg = $('#authMsg');
    const formWrap = $('.modal-form', modal), title = $('#loginTitle'), btnText = $('#authBtnText');
    let lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      if (nav.classList.contains('open')) setMenu(false);
      modal.hidden = false; body.classList.add('lock');
      if (animate) {
        gsap.fromTo('.modal-backdrop', { opacity: 0 }, { opacity: 1, duration: .4 });
        gsap.fromTo('.modal-box', { y: 70, opacity: 0, scale: .95 }, { y: 0, opacity: 1, scale: 1, duration: .8, ease: 'power4.out' });
        gsap.from('.modal-form .tabs, .modal-form h3, .modal-form .f-group:not(.reg-only), .modal-form .auth-row, .modal-form .btn, .modal-form .or, .modal-form .social-login',
          { y: 24, opacity: 0, duration: .7, stagger: .05, delay: .25, ease: 'power3.out', clearProps: 'all' });
      }
      setTimeout(() => $('#aEmail').focus(), 350);
    }
    function close() {
      const end = () => { modal.hidden = true; body.classList.remove('lock'); msg.textContent = ''; if (lastFocus) lastFocus.focus(); };
      if (animate) {
        gsap.to('.modal-box', { y: 40, opacity: 0, scale: .97, duration: .4, ease: 'power2.in' });
        gsap.to('.modal-backdrop', { opacity: 0, duration: .4, onComplete: end });
      } else end();
    }
    openBtn.addEventListener('click', open);
    $$('[data-close]', modal).forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', e => {
      if (modal.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const f = $$('a[href], button, input, select, textarea', modal).filter(el => !el.disabled && el.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    $$('.tab', modal).forEach(tab => tab.addEventListener('click', () => {
      $$('.tab', modal).forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const reg = tab.dataset.tab === 'register';
      formWrap.classList.toggle('is-register', reg);
      title.textContent = reg ? 'Create your account' : 'Welcome back';
      btnText.textContent = reg ? 'Sign up' : 'Login';
      msg.textContent = '';
      if (animate) gsap.fromTo('.modal-form h3', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .5 });
    }));

    $('#eyeBtn').addEventListener('click', e => {
      const p = $('#aPass'), show = p.type === 'password';
      p.type = show ? 'text' : 'password';
      $('i', e.currentTarget).className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
      e.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = $('#aEmail').value.trim(), pass = $('#aPass').value;
      const reg = formWrap.classList.contains('is-register');
      msg.style.color = 'var(--ocean)';
      if (reg && !$('#aName').value.trim()) { msg.textContent = 'Please enter your full name.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Please enter a valid email address.'; return; }
      if (pass.length < 6) { msg.textContent = 'Password must be at least 6 characters.'; return; }
      msg.textContent = reg ? 'Account created! Welcome aboard.' : 'Logged in successfully. Welcome back!';
      // Demo only: connect this form to your own authentication API.
      setTimeout(close, 1400);
    });
  })();

  /* ==========================================================
     Forms (contact, newsletter, booking bar)
     ========================================================== */
  (function forms() {
    const cf = $('#contactForm'), fm = $('#formMsg');
    if (cf) {
      cf.addEventListener('submit', e => {
        e.preventDefault();
        let ok = true;
        $$('.f-group', cf).forEach(g => {
          const f = $('input, select, textarea', g);
          let valid = !f.required || !!f.value.trim();
          if (f.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim());
          g.classList.toggle('invalid', !valid);
          if (!valid) ok = false;
        });
        if (!ok) { fm.textContent = 'Please fill in the highlighted fields.'; return; }
        const btn = $('button[type="submit"]', cf);
        btn.disabled = true; fm.textContent = 'Sending...';
        setTimeout(() => {
          fm.textContent = 'Thank you! Our travel designers will reply within 24 hours.';
          cf.reset(); btn.disabled = false;
          if (animate) gsap.fromTo(fm, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .6 });
        }, 900);
      });
      $$('input, select, textarea', cf).forEach(f => f.addEventListener('input', () => f.closest('.f-group').classList.remove('invalid')));
    }

    const nf = $('#newsForm'), nm = $('#newsMsg');
    if (nf) nf.addEventListener('submit', e => {
      e.preventDefault();
      nm.textContent = 'You are subscribed. Happy travels!';
      nf.reset();
    });

    const bb = $('#bookingBar');
    if (bb) bb.addEventListener('submit', e => {
      e.preventDefault();
      const t = $('#packages');
      if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  })();

  /* ==========================================================
     Boot
     ========================================================== */
  initScrollAnimations();
  runPreloader(heroIntro);

  window.addEventListener('load', () => {
    if (typeof AOS !== 'undefined') AOS.refresh();
    if (hasST) ScrollTrigger.refresh();
  });
})();


/* ==========================================================================
   ABOUT PAGE scripts (runs only on about.html)
   ========================================================================== */
(() => {
  'use strict';
  if (!document.querySelector('.ab-page')) return; // runs only on about.html

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const hasGSAP = typeof gsap !== 'undefined';
  const hasST = hasGSAP && typeof ScrollTrigger !== 'undefined';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const animate = hasGSAP && !reduce;
  const body = document.body;
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- AOS ---------- */
  if (typeof AOS === 'undefined' || reduce) $$('[data-aos]').forEach(el => el.removeAttribute('data-aos'));
  else AOS.init({ duration: 900, easing: 'ease-out-cubic', once: true, offset: 70 });

  /* ---------- Elements ---------- */
  const header = $('#header'), nav = $('#mainNav'), burger = $('#hamburger');
  const progress = $('#scrollProgress'), toTop = $('#toTop');

  /* ==========================================================
     Shared UI: header, menu, progress, to-top
     ========================================================== */
  let lastY = window.scrollY, ticking = false;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', y > 40);
    const menuOpen = nav.classList.contains('open');
    if (y > lastY && y > 480 && !menuOpen) header.classList.add('hide');
    else if (y < lastY - 4 || y < 480) header.classList.remove('hide');
    lastY = y;
    progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    toTop.classList.toggle('show', y > 900);
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  function setMenu(open) {
    nav.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    body.classList.toggle('lock', open);
    if (open && animate) gsap.fromTo('.nav-list li, .nav-extra', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .09, delay: .3, ease: 'power3.out', clearProps: 'transform,opacity' });
  }
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  window.addEventListener('resize', () => { if (window.innerWidth >= 992 && nav.classList.contains('open')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false); });
  $$('.nav-link').forEach(a => a.addEventListener('click', () => { if (nav.classList.contains('open')) setMenu(false); }));
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* Custom cursor + magnetic buttons */
  if (animate && finePointer) {
    const cur = $('#cursor'), txt = $('#cursorText');
    gsap.set(cur, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(cur, 'x', { duration: .28, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: .28, ease: 'power3' });
    window.addEventListener('mousemove', e => { cur.classList.add('show'); xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.remove('show'));
    document.addEventListener('mouseover', e => {
      const v = e.target.closest('[data-cursor]');
      if (v) { txt.textContent = v.dataset.cursor; cur.classList.add('big'); cur.classList.remove('link'); return; }
      cur.classList.remove('big'); txt.textContent = '';
      cur.classList.toggle('link', !!e.target.closest('a, button, input, select, textarea, label, .ab-slice, .ab-slide-knob'));
    });
    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)' }));
    });
  }

  /* Login modal + newsletter */
  (function loginModal() {
    const modal = $('#loginModal'), openBtn = $('#loginBtn');
    if (!modal || !openBtn) return;
    const form = $('#authForm'), msg = $('#authMsg');
    const formWrap = $('.modal-form', modal), title = $('#loginTitle'), btnText = $('#authBtnText');
    let lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      if (nav.classList.contains('open')) setMenu(false);
      modal.hidden = false; body.classList.add('lock');
      if (animate) {
        gsap.fromTo('.modal-backdrop', { opacity: 0 }, { opacity: 1, duration: .4 });
        gsap.fromTo('.modal-box', { y: 70, opacity: 0, scale: .95 }, { y: 0, opacity: 1, scale: 1, duration: .8, ease: 'power4.out' });
      }
      setTimeout(() => $('#aEmail').focus(), 350);
    }
    function close() {
      const end = () => { modal.hidden = true; body.classList.remove('lock'); msg.textContent = ''; if (lastFocus) lastFocus.focus(); };
      if (animate) {
        gsap.to('.modal-box', { y: 40, opacity: 0, scale: .97, duration: .4, ease: 'power2.in' });
        gsap.to('.modal-backdrop', { opacity: 0, duration: .4, onComplete: end });
      } else end();
    }
    openBtn.addEventListener('click', open);
    $$('[data-close]', modal).forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (!modal.hidden && e.key === 'Escape') close(); });
    $$('.tab', modal).forEach(tab => tab.addEventListener('click', () => {
      $$('.tab', modal).forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const reg = tab.dataset.tab === 'register';
      formWrap.classList.toggle('is-register', reg);
      title.textContent = reg ? 'Create your account' : 'Welcome back';
      btnText.textContent = reg ? 'Sign up' : 'Login';
      msg.textContent = '';
    }));
    $('#eyeBtn').addEventListener('click', e => {
      const p = $('#aPass'), show = p.type === 'password';
      p.type = show ? 'text' : 'password';
      $('i', e.currentTarget).className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const reg = formWrap.classList.contains('is-register');
      msg.style.color = 'var(--ocean)';
      if (reg && !$('#aName').value.trim()) { msg.textContent = 'Please enter your full name.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#aEmail').value.trim())) { msg.textContent = 'Please enter a valid email address.'; return; }
      if ($('#aPass').value.length < 6) { msg.textContent = 'Password must be at least 6 characters.'; return; }
      msg.textContent = reg ? 'Account created! Welcome aboard.' : 'Logged in successfully. Welcome back!';
      setTimeout(close, 1400);
    });
  })();
  const nf = $('#newsForm'), nm = $('#newsMsg');
  if (nf) nf.addEventListener('submit', e => { e.preventDefault(); nm.textContent = 'You are subscribed. Happy travels!'; nf.reset(); });

  /* ==========================================================
     Helpers
     ========================================================== */
  // Splits text into words > characters, keeping inline tags (<em>) intact. Returns the character spans.
  function splitChars(el) {
    const walk = node => {
      Array.from(node.childNodes).forEach(ch => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'ab-wd';
            Array.from(part).forEach(c => { const s = document.createElement('span'); s.className = 'ab-ch'; s.textContent = c; w.appendChild(s); });
            frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) walk(ch);
      });
    };
    walk(el);
    return $$('.ab-ch', el);
  }
  // Wraps every word in .rw (used for the "illuminating" paragraph)
  function splitRead(el) {
    const walk = node => {
      Array.from(node.childNodes).forEach(ch => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span'); s.className = 'rw'; s.textContent = part; frag.appendChild(s);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) walk(ch);
      });
    };
    walk(el);
    return $$('.rw', el);
  }
  function drawPath(path) {
    const len = path.getTotalLength();
    path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    return len;
  }

  /* Pre-hide the hero title characters so there is no flash before the preloader opens */
  const titleEl = $('#abTitle');
  const titleChars = animate && titleEl ? splitChars(titleEl) : [];
  if (animate) {
    gsap.set(titleChars, { yPercent: 120, rotationX: -90, opacity: 0 });
    gsap.set('.ab-slice', { yPercent: 40, opacity: 0, scaleY: .7 });
    gsap.set('.ab-crumb', { opacity: 0, x: -20 });
  }

  /* ==========================================================
     Preloader -> hero intro
     ========================================================== */
  function runPreloader(done) {
    const pre = $('#preloader');
    if (!pre) return done();
    if (!animate) { pre.remove(); return done(); }
    const cnt = $('#preCount'), bar = $('#preBar'), o = { v: 0 };
    let loaded = document.readyState === 'complete', finished = false;
    window.addEventListener('load', () => { loaded = true; });
    body.classList.add('lock');
    const finish = () => {
      if (finished) return; finished = true;
      gsap.timeline({ onComplete: () => { pre.remove(); body.classList.remove('lock'); } })
        .to('.pre-center', { opacity: 0, y: -24, duration: .5, ease: 'power2.in' })
        .to('.pre-top', { yPercent: -100, duration: 1.05, ease: 'power4.inOut' }, '>-.05')
        .to('.pre-bottom', { yPercent: 100, duration: 1.05, ease: 'power4.inOut' }, '<')
        .call(done, null, '<+.35');
    };
    gsap.to(o, {
      v: 100, duration: 1.6, ease: 'power2.inOut',
      onUpdate() { cnt.textContent = Math.round(o.v); bar.style.transform = 'scaleX(' + (o.v / 100) + ')'; },
      onComplete() { loaded ? finish() : window.addEventListener('load', finish, { once: true }); }
    });
    setTimeout(finish, 6000);
  }

  /* ==========================================================
     1. HERO - 3D character flip, arch windows, compass needle
     ========================================================== */
  function heroIntro() {
    if (!animate) return;
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('.ab-crumb', { opacity: 1, x: 0, duration: .8 })
      .to(titleChars, { yPercent: 0, rotationX: 0, opacity: 1, duration: 1.1, stagger: { each: .028, from: 'start' } }, '-=.5')
      .to('.ab-slice', { yPercent: 0, opacity: 1, scaleY: 1, duration: 1.4, stagger: .12, ease: 'expo.out' }, '-=.7');
  }

  (function heroSlices() {
    const wrap = $('#abSlices'); if (!wrap) return;
    const slices = $$('.ab-slice', wrap);
    let idx = 0, auto = null, userTouched = false;
    const show = i => { idx = i; slices.forEach((s, n) => s.classList.toggle('on', n === i)); };
    const cycle = () => { auto = setInterval(() => { if (!userTouched && !document.hidden) show((idx + 1) % slices.length); }, 3600); };
    slices.forEach((s, i) => {
      s.addEventListener('click', () => { userTouched = true; show(i); });
      s.addEventListener('focus', () => { userTouched = true; show(i); });
      s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); userTouched = true; show(i); } });
      if (finePointer) s.addEventListener('mouseenter', () => { userTouched = true; show(i); });
    });
    if (!reduce) cycle();
  })();

  (function compass() {
    const needle = $('#abNeedle'); if (!needle || !animate) return;
    const rot = gsap.quickTo(needle, 'rotation', { duration: 1.6, ease: 'power3' });
    if (finePointer) window.addEventListener('mousemove', e => {
      const r = needle.getBoundingClientRect();
      const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
      rot(a + 45);
    }, { passive: true });
    if (hasST) gsap.to(needle, { scale: 1.25, ease: 'none', scrollTrigger: { trigger: '.ab-hero', start: 'top top', end: 'bottom top', scrub: true } });
  })();

  /* ==========================================================
     2. STORY - polaroids are dealt from a pile, words light up
     ========================================================== */
  function storyAnim() {
    const stage = $('#abStage'), pols = $$('.ab-pol');
    const squig = $('#abSquig'), sig = $('#abSig');
    const rws = splitRead($('#abRead'));
    if (!animate || !hasST) { return; }

    gsap.from(pols, {
      x: (i, el) => { const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect(); return (s.left + s.width / 2) - (r.left + r.width / 2); },
      y: (i, el) => { const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect(); return (s.top + s.height / 2) - (r.top + r.height / 2) + 30 * i; },
      rotation: (i) => (i % 2 ? 4 : -4) * (i + 1) * .6, scale: .55, opacity: 0, ease: 'power3.out', stagger: .22,
      scrollTrigger: { trigger: stage, start: 'top 88%', end: 'center 52%', scrub: 1, invalidateOnRefresh: true }
    });
    // gentle drift while you scroll past
    pols.forEach((p, i) => gsap.to(p, { yPercent: (i % 2 ? -7 : 7), ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: true } }));

    gsap.fromTo(rws, { opacity: .16 }, { opacity: 1, ease: 'none', stagger: .12,
      scrollTrigger: { trigger: '#abRead', start: 'top 82%', end: 'bottom 48%', scrub: .6 } });
    gsap.fromTo('.ab-mark', { backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%', ease: 'none',
      scrollTrigger: { trigger: '#abRead', start: 'top 55%', end: 'bottom 45%', scrub: true } });

    if (squig) { drawPath(squig); gsap.to(squig, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', scrollTrigger: { trigger: squig, start: 'top 90%', once: true } }); }
    if (sig) { drawPath(sig); gsap.to(sig, { strokeDashoffset: 0, duration: 2.2, ease: 'power1.inOut', scrollTrigger: { trigger: sig, start: 'top 92%', once: true } }); }
    gsap.from('.ab-sign img', { scale: 0, rotation: -120, duration: 1, ease: 'back.out(2)', scrollTrigger: { trigger: '.ab-sign', start: 'top 92%', once: true } });
  }

  /* ==========================================================
     3. NUMBERS - passport stamps slam down, odometers roll
     ========================================================== */
  function buildOdometer(el) {
    const val = el.dataset.val, suf = el.dataset.suf || '';
    el.textContent = '';
    const strips = [];
    Array.from(val).forEach(ch => {
      const cell = document.createElement('span'); cell.className = 'oc';
      const strip = document.createElement('span'); strip.className = 'os';
      for (let d = 0; d <= 9; d++) { const s = document.createElement('span'); s.textContent = d; strip.appendChild(s); }
      cell.appendChild(strip); el.appendChild(cell);
      strips.push({ strip, digit: +ch });
    });
    if (suf) { const x = document.createElement('span'); x.className = 'ox'; x.textContent = suf; el.appendChild(x); }
    return strips;
  }
  function statsAnim() {
    const stamps = $$('.ab-stamp');
    const odos = stamps.map(s => buildOdometer($('.ab-od', s)));
    stamps.forEach(s => { const p = $('.prg', s); const len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len; p.dataset.len = len; });
    if (!animate || !hasST) {
      odos.forEach(list => list.forEach(o => { o.strip.style.transform = 'translateY(' + (-o.digit * 10) + '%)'; }));
      stamps.forEach(s => { const p = $('.prg', s); p.style.strokeDashoffset = p.dataset.len * (1 - s.dataset.pct / 100); });
      return;
    }
    gsap.fromTo('.ab-stats-bg', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.ab-stats', start: 'top bottom', end: 'bottom top', scrub: true } });
    stamps.forEach((s, i) => {
      const ring = $('.prg', s), rip = $('.ab-ripple', s);
      const tl = gsap.timeline({ scrollTrigger: { trigger: s, start: 'top 86%', once: true }, delay: i * .12 });
      tl.from(s, { scale: 2.2, rotation: i % 2 ? 24 : -24, opacity: 0, duration: .75, ease: 'power4.in' })
        .fromTo(rip, { scale: 1, opacity: .9 }, { scale: 1.5, opacity: 0, duration: 1.1, ease: 'power2.out' }, '>-.02')
        .to(s, { keyframes: [{ y: 8, duration: .08 }, { y: -4, duration: .1 }, { y: 0, duration: .12 }] }, '<')
        .to(ring, { strokeDashoffset: ring.dataset.len * (1 - s.dataset.pct / 100), duration: 1.8, ease: 'power3.inOut' }, '<+.1');
      odos[i].forEach((o, n) => tl.to(o.strip, { y: () => '-' + (o.digit * 10) + '%', duration: 1.5 + n * .35, ease: 'power3.inOut' }, '<' + (n ? '' : '+.0')));
      // tilt toward the pointer
      if (finePointer) {
        s.addEventListener('mousemove', e => {
          const r = s.getBoundingClientRect();
          gsap.to(s, { rotationY: ((e.clientX - r.left) / r.width - .5) * 22, rotationX: -((e.clientY - r.top) / r.height - .5) * 22, transformPerspective: 700, duration: .5, ease: 'power2.out' });
        });
        s.addEventListener('mouseleave', () => gsap.to(s, { rotationX: 0, rotationY: 0, duration: 1, ease: 'elastic.out(1,.4)' }));
      }
    });
  }

  /* ==========================================================
     4. VALUES - cards stack, sink and dim under the next one
     ========================================================== */
  function valuesAnim() {
    if (!animate || !hasST) return;
    const cards = $$('.ab-card');
    cards.forEach((card, i) => {
      const img = $('.ab-card-media img', card);
      gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from($$('.ab-card-body > *', card), { y: 34, opacity: 0, duration: .9, stagger: .09, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 70%', once: true } });
      gsap.from($('.num', card), { xPercent: -60, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 70%', once: true } });
      const next = cards[i + 1];
      if (next) gsap.to(card, { scale: .93, filter: 'brightness(.62)', ease: 'none',
        scrollTrigger: { trigger: next, start: 'top 82%', end: 'top 14%', scrub: true } });
    });
  }

  /* ==========================================================
     5. JOURNEY - plane flies the line, iris opens each photo
     ========================================================== */
  function journeyAnim() {
    const road = $('#abRoad'), fill = $('#abFill'), plane = $('#abPlane');
    const items = $$('.ab-ms');
    if (!animate || !hasST) { items.forEach(m => m.classList.add('on')); return; }
    gsap.set(fill, { scaleY: 0 });
    ScrollTrigger.create({
      trigger: road, start: 'top 55%', end: 'bottom 55%', scrub: .4,
      onUpdate: self => {
        gsap.set(fill, { scaleY: self.progress });
        plane.style.top = (self.progress * 100) + '%';
      }
    });
    items.forEach((m, i) => {
      const iris = $('.iris', m), img = $('.iris img', m), yr = $('.ab-ms-year', m), orb = $('.orb', m);
      const left = i % 2 === 0;
      ScrollTrigger.create({ trigger: m, start: 'top 55%', end: 'bottom 55%', onToggle: self => m.classList.toggle('on', self.isActive || self.progress === 1) });
      gsap.fromTo(iris, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(72% at 50% 50%)', ease: 'none', scrollTrigger: { trigger: m, start: 'top 88%', end: 'top 42%', scrub: .6 } });
      gsap.fromTo(img, { scale: 1.7 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: m, start: 'top 88%', end: 'bottom 40%', scrub: .6 } });
      gsap.from(orb, { scale: .6, opacity: 0, duration: 1, ease: 'back.out(2)', scrollTrigger: { trigger: m, start: 'top 70%', once: true } });
      gsap.from($$('.ab-ms-text h3, .ab-ms-text p', m), { x: window.innerWidth > 767 ? (left ? -50 : 50) : 30, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: m, start: 'top 68%', once: true } });
      // year "scrubs" from ten years earlier up to the real year
      const end = +yr.dataset.year, o = { y: end - 24 };
      yr.textContent = o.y;
      ScrollTrigger.create({ trigger: m, start: 'top 68%', once: true, onEnter: () => gsap.to(o, { y: end, duration: 1.6, ease: 'power3.out', onUpdate: () => { yr.textContent = Math.round(o.y); } }) });
    });
  }

  /* ==========================================================
     6. TEAM - 3D rise, colour flashlight that follows the pointer
     ========================================================== */
  function teamAnim() {
    const members = $$('.ab-member');
    // pointer-driven flashlight (works with CSS clip-path circle(var(--r) at var(--mx) var(--my)))
    $$('.ab-arch').forEach(arch => {
      arch.addEventListener('pointermove', e => {
        const r = arch.getBoundingClientRect();
        arch.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        arch.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      arch.addEventListener('pointerleave', () => { arch.style.setProperty('--mx', '50%'); arch.style.setProperty('--my', '50%'); });
    });
    if (!animate || !hasST) return;
    gsap.from(members, { y: 120, rotationX: 55, opacity: 0, transformOrigin: '50% 100%', duration: 1.3, stagger: .15, ease: 'expo.out',
      scrollTrigger: { trigger: '#abTeam', start: 'top 82%', once: true } });
    members.forEach((m, i) => gsap.to(m, { y: i % 2 ? -26 : 14, ease: 'none', scrollTrigger: { trigger: '#abTeam', start: 'top bottom', end: 'bottom top', scrub: true } }));
    if (finePointer) members.forEach(m => {
      m.addEventListener('mousemove', e => {
        const r = m.getBoundingClientRect();
        gsap.to(m, { rotationY: ((e.clientX - r.left) / r.width - .5) * 14, rotationX: -((e.clientY - r.top) / r.height - .5) * 10, transformPerspective: 900, duration: .6, ease: 'power2.out' });
      });
      m.addEventListener('mouseleave', () => gsap.to(m, { rotationX: 0, rotationY: 0, duration: 1.1, ease: 'elastic.out(1,.4)' }));
    });
  }

  /* ==========================================================
     7. CTA - boarding pass drops in, slide to take off
     ========================================================== */
  function ctaAnim() {
    const pass = $('#abPass'), stub = $('.ab-pass-stub'), slide = $('#abSlide'), knob = $('#abKnob'), fill = $('.ab-slide-fill');
    const text = $('.ab-slide-text');
    if (animate && hasST) {
      gsap.fromTo('.ab-cta-bg img', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.ab-cta', start: 'top bottom', end: 'bottom bottom', scrub: true } });
      gsap.from(pass, { y: 140, rotationX: 40, opacity: 0, transformPerspective: 1000, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: pass, start: 'top 88%', once: true } });
      gsap.from(slide, { scaleX: .3, opacity: 0, duration: 1, ease: 'elastic.out(1,.6)', scrollTrigger: { trigger: slide, start: 'top 94%', once: true } });
    }
    let drag = false, startX = 0, x = 0, done = false;
    const max = () => slide.clientWidth - knob.offsetWidth - 8;
    const set = v => {
      x = Math.max(0, Math.min(max(), v));
      knob.style.transform = 'translateX(' + x + 'px)';
      fill.style.width = (x + knob.offsetWidth + 4) + 'px';
      text.style.opacity = 1 - x / (max() || 1) * 1.4;
      knob.setAttribute('aria-valuenow', Math.round(x / (max() || 1) * 100));
    };
    const finish = () => {
      if (done) return; done = true; slide.classList.add('done');
      set(max());
      text.textContent = 'Boarding...'; text.style.opacity = 1;
      slide.classList.add('done'); text.style.color = 'var(--ocean)';
      if (animate) {
        gsap.timeline()
          .to(stub, { rotation: 9, x: 36, y: 18, duration: .5, ease: 'back.out(2)' })
          .to(stub, { x: 220, y: -90, rotation: 28, opacity: 0, duration: .8, ease: 'power2.in' })
          .to(knob, { x: '+=0', scale: 1.15, duration: .2, yoyo: true, repeat: 1 }, 0)
          .to(knob.firstElementChild, { x: 90, y: -50, rotation: 0, opacity: 0, duration: .8, ease: 'power3.in' }, .4);
        gsap.fromTo('.ab-cta-alt', { opacity: 0 }, { opacity: 1, duration: .5, delay: .6 });
      }
      setTimeout(() => { window.location.href = 'index.html#contact'; }, animate ? 1700 : 400);
    };
    const reset = () => {
      if (animate) { const o = { v: x }; gsap.to(o, { v: 0, duration: .8, ease: 'elastic.out(1,.55)', onUpdate: () => set(o.v) }); } else set(0);
      text.style.opacity = 1;
    };
    knob.addEventListener('pointerdown', e => { if (done) return; drag = true; startX = e.clientX - x; knob.setPointerCapture(e.pointerId); if (hasGSAP) gsap.killTweensOf(knob); });
    knob.addEventListener('pointermove', e => { if (drag) set(e.clientX - startX); });
    const up = () => { if (!drag) return; drag = false; x >= max() * .88 ? finish() : reset(); };
    knob.addEventListener('pointerup', up); knob.addEventListener('pointercancel', up);
    knob.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); if (e.key === 'ArrowRight') set(x + max() * .25); else set(max()); if (x >= max() * .88) finish(); }
    });
    window.addEventListener('resize', () => { if (!done) set(0); });
    set(0);
    if (hasST) ScrollTrigger.create({ trigger: slide, start: 'top 98%', end: 'bottom 0%', onToggle: s => toTop.classList.toggle('ab-hide', s.isActive) });
  }

  /* ==========================================================
     Boot
     ========================================================== */
  storyAnim();
  statsAnim();
  valuesAnim();
  journeyAnim();
  teamAnim();
  ctaAnim();
  runPreloader(heroIntro);

  window.addEventListener('load', () => {
    if (typeof AOS !== 'undefined') AOS.refresh();
    if (hasST) ScrollTrigger.refresh();
  });
})();

/* ==========================================================================
   SERVICES PAGE scripts (runs only on services.html)
   ========================================================================== */
(() => {
  'use strict';
  if (!document.querySelector('.sv-page')) return; // runs only on services.html

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const hasGSAP = typeof gsap !== 'undefined';
  const hasST = hasGSAP && typeof ScrollTrigger !== 'undefined';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const animate = hasGSAP && !reduce;
  const body = document.body;
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- AOS ---------- */
  if (typeof AOS === 'undefined' || reduce) $$('[data-aos]').forEach(el => el.removeAttribute('data-aos'));
  else AOS.init({ duration: 900, easing: 'ease-out-cubic', once: true, offset: 70 });

  /* ---------- Elements ---------- */
  const header = $('#header'), nav = $('#mainNav'), burger = $('#hamburger');
  const progress = $('#scrollProgress'), toTop = $('#toTop');

  /* ==========================================================
     Shared UI: header, menu, progress, to-top
     ========================================================== */
  let lastY = window.scrollY, ticking = false;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', y > 40);
    const menuOpen = nav.classList.contains('open');
    if (y > lastY && y > 480 && !menuOpen) header.classList.add('hide');
    else if (y < lastY - 4 || y < 480) header.classList.remove('hide');
    lastY = y;
    progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    toTop.classList.toggle('show', y > 900);
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  function setMenu(open) {
    nav.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    body.classList.toggle('lock', open);
    if (open && animate) gsap.fromTo('.nav-list li, .nav-extra', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .09, delay: .3, ease: 'power3.out', clearProps: 'transform,opacity' });
  }
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  window.addEventListener('resize', () => { if (window.innerWidth >= 992 && nav.classList.contains('open')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false); });
  $$('.nav-link').forEach(a => a.addEventListener('click', () => { if (nav.classList.contains('open')) setMenu(false); }));
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* Custom cursor + magnetic buttons */
  if (animate && finePointer) {
    const cur = $('#cursor'), txt = $('#cursorText');
    gsap.set(cur, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(cur, 'x', { duration: .28, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: .28, ease: 'power3' });
    window.addEventListener('mousemove', e => { cur.classList.add('show'); xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.remove('show'));
    document.addEventListener('mouseover', e => {
      const v = e.target.closest('[data-cursor]');
      if (v) { txt.textContent = v.dataset.cursor; cur.classList.add('big'); cur.classList.remove('link'); return; }
      cur.classList.remove('big'); txt.textContent = '';
      cur.classList.toggle('link', !!e.target.closest('a, button, input, select, textarea, label, .ab-slice, .ab-slide-knob'));
    });
    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)' }));
    });
  }

  /* Login modal + newsletter */
  (function loginModal() {
    const modal = $('#loginModal'), openBtn = $('#loginBtn');
    if (!modal || !openBtn) return;
    const form = $('#authForm'), msg = $('#authMsg');
    const formWrap = $('.modal-form', modal), title = $('#loginTitle'), btnText = $('#authBtnText');
    let lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      if (nav.classList.contains('open')) setMenu(false);
      modal.hidden = false; body.classList.add('lock');
      if (animate) {
        gsap.fromTo('.modal-backdrop', { opacity: 0 }, { opacity: 1, duration: .4 });
        gsap.fromTo('.modal-box', { y: 70, opacity: 0, scale: .95 }, { y: 0, opacity: 1, scale: 1, duration: .8, ease: 'power4.out' });
      }
      setTimeout(() => $('#aEmail').focus(), 350);
    }
    function close() {
      const end = () => { modal.hidden = true; body.classList.remove('lock'); msg.textContent = ''; if (lastFocus) lastFocus.focus(); };
      if (animate) {
        gsap.to('.modal-box', { y: 40, opacity: 0, scale: .97, duration: .4, ease: 'power2.in' });
        gsap.to('.modal-backdrop', { opacity: 0, duration: .4, onComplete: end });
      } else end();
    }
    openBtn.addEventListener('click', open);
    $$('[data-close]', modal).forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (!modal.hidden && e.key === 'Escape') close(); });
    $$('.tab', modal).forEach(tab => tab.addEventListener('click', () => {
      $$('.tab', modal).forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const reg = tab.dataset.tab === 'register';
      formWrap.classList.toggle('is-register', reg);
      title.textContent = reg ? 'Create your account' : 'Welcome back';
      btnText.textContent = reg ? 'Sign up' : 'Login';
      msg.textContent = '';
    }));
    $('#eyeBtn').addEventListener('click', e => {
      const p = $('#aPass'), show = p.type === 'password';
      p.type = show ? 'text' : 'password';
      $('i', e.currentTarget).className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const reg = formWrap.classList.contains('is-register');
      msg.style.color = 'var(--ocean)';
      if (reg && !$('#aName').value.trim()) { msg.textContent = 'Please enter your full name.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#aEmail').value.trim())) { msg.textContent = 'Please enter a valid email address.'; return; }
      if ($('#aPass').value.length < 6) { msg.textContent = 'Password must be at least 6 characters.'; return; }
      msg.textContent = reg ? 'Account created! Welcome aboard.' : 'Logged in successfully. Welcome back!';
      setTimeout(close, 1400);
    });
  })();
  const nf = $('#newsForm'), nm = $('#newsMsg');
  if (nf) nf.addEventListener('submit', e => { e.preventDefault(); nm.textContent = 'You are subscribed. Happy travels!'; nf.reset(); });

  /* ==========================================================
     Preloader -> hero intro
     ========================================================== */
  function runPreloader(done) {
    const pre = $('#preloader');
    if (!pre) return done();
    if (!animate) { pre.remove(); return done(); }
    const cnt = $('#preCount'), bar = $('#preBar'), o = { v: 0 };
    let loaded = document.readyState === 'complete', finished = false;
    window.addEventListener('load', () => { loaded = true; });
    body.classList.add('lock');
    const finish = () => {
      if (finished) return; finished = true;
      gsap.timeline({ onComplete: () => { pre.remove(); body.classList.remove('lock'); } })
        .to('.pre-center', { opacity: 0, y: -24, duration: .5, ease: 'power2.in' })
        .to('.pre-top', { yPercent: -100, duration: 1.05, ease: 'power4.inOut' }, '>-.05')
        .to('.pre-bottom', { yPercent: 100, duration: 1.05, ease: 'power4.inOut' }, '<')
        .call(done, null, '<+.35');
    };
    gsap.to(o, {
      v: 100, duration: 1.6, ease: 'power2.inOut',
      onUpdate() { cnt.textContent = Math.round(o.v); bar.style.transform = 'scaleX(' + (o.v / 100) + ')'; },
      onComplete() { loaded ? finish() : window.addEventListener('load', finish, { once: true }); }
    });
    setTimeout(finish, 6000);
  }


  document.documentElement.classList.add('sv-js');

  /* ==========================================================
     1. HERO - intro (word reel + orbit are pure CSS)
     ========================================================== */
  if (animate) { gsap.set('.sv-in', { opacity: 0, y: 44 }); gsap.set('.sv-orbit', { opacity: 0, scale: .6, rotation: -40 }); }
  function heroIntro() {
    if (!animate) return;
    gsap.to('.sv-in', { opacity: 1, y: 0, duration: 1.1, stagger: .12, ease: 'power4.out' });
    gsap.to('.sv-orbit', { opacity: 1, scale: 1, rotation: 0, duration: 1.7, ease: 'expo.out', delay: .2 });
  }

  /* ==========================================================
     2. INDEX - photo follows the cursor; tap-to-open on touch
     ========================================================== */
  (function index() {
    const rows = $$('.sv-row'), fl = $('#svFloat'); if (!rows.length) return;
    if (finePointer && fl) {
      const imgs = rows.map(r => { const i = document.createElement('img'); i.src = r.dataset.img; i.alt = ''; i.width = 480; i.height = 600; fl.appendChild(i); return i; });
      let x = 0, y = 0, tx = 0, ty = 0, rot = 0, raf = 0;
      const f = reduce ? 1 : .14;
      const tick = () => {
        const dx = tx - x; x += dx * f; y += (ty - y) * f; rot += (dx * .05 - rot) * .2;
        fl.style.transform = 'translate(' + (x + 30) + 'px,' + (y - fl.offsetHeight / 2) + 'px) rotate(' + (reduce ? 0 : Math.max(-14, Math.min(14, rot))) + 'deg)';
        raf = requestAnimationFrame(tick);
      };
      window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
      const show = i => { imgs.forEach((m, n) => m.classList.toggle('on', n === i)); if (!fl.classList.contains('show')) { x = tx; y = ty; fl.classList.add('show'); raf = requestAnimationFrame(tick); } };
      rows.forEach((r, i) => { r.addEventListener('mouseenter', () => show(i)); r.addEventListener('focus', () => show(i)); });
      $('#svList').addEventListener('mouseleave', () => { fl.classList.remove('show'); cancelAnimationFrame(raf); });
    }
    const toggle = r => { const o = !r.classList.contains('open'); rows.forEach(n => n.classList.remove('open')); r.classList.toggle('open', o); };
    rows.forEach(r => {
      r.addEventListener('click', () => { if (!finePointer) toggle(r); });
      r.addEventListener('keydown', e => { if (!finePointer && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(r); } });
    });
  })();

  /* ==========================================================
     3. PLANS - tags swing in from the rope
     ========================================================== */
  (function tags() {
    const t = $$('.sv-tag'); if (!t.length) return;
    if (!('IntersectionObserver' in window)) { t.forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .3 });
    t.forEach(el => io.observe(el));
  })();

  /* ==========================================================
     4. COMPARE - drag between DIY chaos and Stackly
     ========================================================== */
  (function compare() {
    const c = $('#svCmp'); if (!c) return;
    const r = $('input', c), wrap = c.closest('.sv-vs');
    const set = v => { c.style.setProperty('--p', v + '%'); wrap.dataset.side = v >= 50 ? 'diy' : 'us'; r.value = v; };
    r.addEventListener('input', () => set(+r.value));
    set(50); wrap.dataset.side = 'us';
    if (!animate || !hasST) return;
    const o = { v: 50 };
    gsap.timeline({ scrollTrigger: { trigger: c, start: 'top 75%', once: true } })
      .to(o, { v: 92, duration: 1.1, ease: 'power2.inOut', onUpdate: () => set(o.v) })
      .to(o, { v: 12, duration: 1.4, ease: 'power2.inOut', onUpdate: () => set(o.v) })
      .to(o, { v: 40, duration: .9, ease: 'power2.out', onUpdate: () => set(o.v) });
  })();

  /* ==========================================================
     5. PACK - services fly into the suitcase
     ========================================================== */
  (function pack() {
    const chips = $$('.sv-chip'); if (!chips.length) return;
    const box = $('#svItems'), cs = $('#svCase'), tot = $('#svTotal'), meter = $('#svMeter'), cnt = $('#svCnt'), empty = $('#svEmpty');
    let sum = 0, shown = 0;
    const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
    const tween = to => {
      const from = shown, t0 = performance.now(), d = reduce ? 0 : 650;
      (function f(t) { const k = d ? Math.min(1, (t - t0) / d) : 1; shown = from + (to - from) * (1 - Math.pow(1 - k, 3)); tot.textContent = fmt(shown); if (k < 1) requestAnimationFrame(f); })(t0);
    };
    const land = it => { it.style.visibility = ''; it.classList.add('in'); cs.classList.remove('pop'); void cs.offsetWidth; cs.classList.add('pop'); };
    function fly(ch, it) {
      if (reduce) return land(it);
      const ci = $('.ci', ch), a = ci.getBoundingClientRect(), b = it.getBoundingClientRect();
      const g = document.createElement('span'); g.className = 'sv-fly'; g.innerHTML = ci.innerHTML;
      Object.assign(g.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
      document.body.appendChild(g);
      const dx = b.left - a.left, dy = b.top - a.top;
      g.animate([
        { transform: 'translate(0,0) scale(1)' },
        { transform: 'translate(' + dx * .5 + 'px,' + (dy * .5 - 90) + 'px) scale(1.3) rotate(180deg)', offset: .5 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + b.width / a.width + ') rotate(360deg)' }
      ], { duration: 780, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => { g.remove(); land(it); };
    }
    chips.forEach(ch => ch.addEventListener('click', () => {
      const on = !ch.classList.contains('on'), k = ch.dataset.k;
      ch.classList.toggle('on', on); ch.setAttribute('aria-pressed', on);
      if (on) {
        sum += +ch.dataset.p;
        const it = document.createElement('span'); it.dataset.k = k; it.style.visibility = 'hidden';
        it.innerHTML = '<i class="' + $('.ci i', ch).className + '"></i>'; box.appendChild(it); fly(ch, it);
      } else {
        sum -= +ch.dataset.p; const it = $('[data-k="' + k + '"]', box); if (it) it.remove();
      }
      const n = chips.filter(c => c.classList.contains('on')).length;
      meter.style.width = (n / chips.length * 100) + '%'; cnt.textContent = n + ' of ' + chips.length + ' packed';
      empty.hidden = n > 0; tween(sum);
    }));
  })();

  /* ==========================================================
     6. FLOW - window-blind photo transition
     ========================================================== */
  (function flow() {
    const steps = $$('.sv-step'), ly = $$('.sv-ly'); if (!steps.length || !('IntersectionObserver' in window)) return;
    let z = 1, cur = 0;
    const go = i => {
      if (i === cur) return; cur = i; z++;
      ly[i].style.zIndex = z; ly[i].classList.add('on');
      steps.forEach((s, n) => s.classList.toggle('on', n === i));
      $('#svNo').textContent = '0' + (i + 1);
      setTimeout(() => ly.forEach((l, n) => { if (n !== cur) l.classList.remove('on'); }), 1100);
    };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) go(steps.indexOf(e.target)); }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
  })();

  /* ==========================================================
     7. FAQ typing + rising balloon
     ========================================================== */
  (function faq() {
    const items = $$('.sv-qa'); if (!items.length) return;
    const type = (it, txt) => {
      const p = $('.sv-a p', it); clearInterval(it._t);
      if (reduce) { p.textContent = txt; return; }
      p.textContent = ''; p.classList.add('typing'); let i = 0;
      it._t = setInterval(() => { i += 2; p.textContent = txt.slice(0, i); if (i >= txt.length) { clearInterval(it._t); p.classList.remove('typing'); } }, 18);
    };
    items.forEach(it => { it._txt = $('.sv-a p', it).textContent.trim(); });
    $$('.sv-q').forEach(q => q.addEventListener('click', () => {
      const it = q.parentNode, open = !it.classList.contains('open');
      items.forEach(o => { o.classList.remove('open'); $('.sv-q', o).setAttribute('aria-expanded', 'false'); });
      it.classList.toggle('open', open); q.setAttribute('aria-expanded', open);
      if (open) type(it, it._txt);
    }));
    if (animate && hasST) {
      gsap.fromTo('#svBalloon', { y: 150 }, { y: -110, ease: 'none', scrollTrigger: { trigger: '.sv-sky', start: 'top bottom', end: 'bottom top', scrub: .6 } });
      gsap.to('.sv-sky-bg img', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.sv-sky', start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  })();

  /* Boot */
  runPreloader(heroIntro);
  window.addEventListener('load', () => {
    if (typeof AOS !== 'undefined') AOS.refresh();
    if (hasST) ScrollTrigger.refresh();
  });
})();

/* ==========================================================================
   BLOG PAGE scripts (runs only on blog.html)
   ========================================================================== */
(() => {
  'use strict';
  if (!document.querySelector('.bl-page')) return; // runs only on blog.html

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const hasGSAP = typeof gsap !== 'undefined';
  const hasST = hasGSAP && typeof ScrollTrigger !== 'undefined';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const animate = hasGSAP && !reduce;
  const body = document.body;
  if (hasST) gsap.registerPlugin(ScrollTrigger);

/* ---------- AOS ---------- */
  if (typeof AOS === 'undefined' || reduce) $$('[data-aos]').forEach(el => el.removeAttribute('data-aos'));
  else AOS.init({ duration: 900, easing: 'ease-out-cubic', once: true, offset: 70 });

  /* ---------- Elements ---------- */
  const header = $('#header'), nav = $('#mainNav'), burger = $('#hamburger');
  const progress = $('#scrollProgress'), toTop = $('#toTop');

  /* ==========================================================
     Shared UI: header, menu, progress, to-top
     ========================================================== */
  let lastY = window.scrollY, ticking = false;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', y > 40);
    const menuOpen = nav.classList.contains('open');
    if (y > lastY && y > 480 && !menuOpen) header.classList.add('hide');
    else if (y < lastY - 4 || y < 480) header.classList.remove('hide');
    lastY = y;
    progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    toTop.classList.toggle('show', y > 900);
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  function setMenu(open) {
    nav.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    body.classList.toggle('lock', open);
    if (open && animate) gsap.fromTo('.nav-list li, .nav-extra', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .09, delay: .3, ease: 'power3.out', clearProps: 'transform,opacity' });
  }
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  window.addEventListener('resize', () => { if (window.innerWidth >= 992 && nav.classList.contains('open')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false); });
  $$('.nav-link').forEach(a => a.addEventListener('click', () => { if (nav.classList.contains('open')) setMenu(false); }));
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* Custom cursor + magnetic buttons */
  if (animate && finePointer) {
    const cur = $('#cursor'), txt = $('#cursorText');
    gsap.set(cur, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(cur, 'x', { duration: .28, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: .28, ease: 'power3' });
    window.addEventListener('mousemove', e => { cur.classList.add('show'); xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.remove('show'));
    document.addEventListener('mouseover', e => {
      const v = e.target.closest('[data-cursor]');
      if (v) { txt.textContent = v.dataset.cursor; cur.classList.add('big'); cur.classList.remove('link'); return; }
      cur.classList.remove('big'); txt.textContent = '';
      cur.classList.toggle('link', !!e.target.closest('a, button, input, select, textarea, label, .ab-slice, .ab-slide-knob'));
    });
    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)' }));
    });
  }

  /* Login modal + newsletter */
  (function loginModal() {
    const modal = $('#loginModal'), openBtn = $('#loginBtn');
    if (!modal || !openBtn) return;
    const form = $('#authForm'), msg = $('#authMsg');
    const formWrap = $('.modal-form', modal), title = $('#loginTitle'), btnText = $('#authBtnText');
    let lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      if (nav.classList.contains('open')) setMenu(false);
      modal.hidden = false; body.classList.add('lock');
      if (animate) {
        gsap.fromTo('.modal-backdrop', { opacity: 0 }, { opacity: 1, duration: .4 });
        gsap.fromTo('.modal-box', { y: 70, opacity: 0, scale: .95 }, { y: 0, opacity: 1, scale: 1, duration: .8, ease: 'power4.out' });
      }
      setTimeout(() => $('#aEmail').focus(), 350);
    }
    function close() {
      const end = () => { modal.hidden = true; body.classList.remove('lock'); msg.textContent = ''; if (lastFocus) lastFocus.focus(); };
      if (animate) {
        gsap.to('.modal-box', { y: 40, opacity: 0, scale: .97, duration: .4, ease: 'power2.in' });
        gsap.to('.modal-backdrop', { opacity: 0, duration: .4, onComplete: end });
      } else end();
    }
    openBtn.addEventListener('click', open);
    $$('[data-close]', modal).forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (!modal.hidden && e.key === 'Escape') close(); });
    $$('.tab', modal).forEach(tab => tab.addEventListener('click', () => {
      $$('.tab', modal).forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const reg = tab.dataset.tab === 'register';
      formWrap.classList.toggle('is-register', reg);
      title.textContent = reg ? 'Create your account' : 'Welcome back';
      btnText.textContent = reg ? 'Sign up' : 'Login';
      msg.textContent = '';
    }));
    $('#eyeBtn').addEventListener('click', e => {
      const p = $('#aPass'), show = p.type === 'password';
      p.type = show ? 'text' : 'password';
      $('i', e.currentTarget).className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const reg = formWrap.classList.contains('is-register');
      msg.style.color = 'var(--ocean)';
      if (reg && !$('#aName').value.trim()) { msg.textContent = 'Please enter your full name.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#aEmail').value.trim())) { msg.textContent = 'Please enter a valid email address.'; return; }
      if ($('#aPass').value.length < 6) { msg.textContent = 'Password must be at least 6 characters.'; return; }
      msg.textContent = reg ? 'Account created! Welcome aboard.' : 'Logged in successfully. Welcome back!';
      setTimeout(close, 1400);
    });
  })();
  const nf = $('#newsForm'), nm = $('#newsMsg');
  if (nf) nf.addEventListener('submit', e => { e.preventDefault(); nm.textContent = 'You are subscribed. Happy travels!'; nf.reset(); });

  /* ==========================================================
     Preloader -> hero intro
     ========================================================== */
  function runPreloader(done) {
    const pre = $('#preloader');
    if (!pre) return done();
    if (!animate) { pre.remove(); return done(); }
    const cnt = $('#preCount'), bar = $('#preBar'), o = { v: 0 };
    let loaded = document.readyState === 'complete', finished = false;
    window.addEventListener('load', () => { loaded = true; });
    body.classList.add('lock');
    const finish = () => {
      if (finished) return; finished = true;
      gsap.timeline({ onComplete: () => { pre.remove(); body.classList.remove('lock'); } })
        .to('.pre-center', { opacity: 0, y: -24, duration: .5, ease: 'power2.in' })
        .to('.pre-top', { yPercent: -100, duration: 1.05, ease: 'power4.inOut' }, '>-.05')
        .to('.pre-bottom', { yPercent: 100, duration: 1.05, ease: 'power4.inOut' }, '<')
        .call(done, null, '<+.35');
    };
    gsap.to(o, {
      v: 100, duration: 1.6, ease: 'power2.inOut',
      onUpdate() { cnt.textContent = Math.round(o.v); bar.style.transform = 'scaleX(' + (o.v / 100) + ')'; },
      onComplete() { loaded ? finish() : window.addEventListener('load', finish, { once: true }); }
    });
    setTimeout(finish, 6000);
  }


    document.documentElement.classList.add('bl-js');

  /* ==========================================================
     1. HERO - blur-in title, photo-filled word, typewriter
        search placeholder, postcards that fan out
     ========================================================== */
  const fan = $('#blFan');
  if (animate) {
    gsap.set('.bl-in', { opacity: 0, y: 36 });
    gsap.set('.bl-title .bl-w', { opacity: 0, filter: 'blur(14px)', letterSpacing: '.38em' });
    gsap.set('.bl-hero .ab-crumb', { opacity: 0, x: -20 });
  }
  function heroIntro() {
    if (!animate) { if (fan) fan.classList.add('on', 'done'); return; }
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('.bl-hero .ab-crumb', { opacity: 1, x: 0, duration: .8 })
      .to('.bl-title .bl-w', { opacity: 1, filter: 'blur(0px)', letterSpacing: '-.01em', duration: 1.5, stagger: .22, clearProps: 'filter' }, '-=.4')
      .to('.bl-in', { opacity: 1, y: 0, duration: 1, stagger: .12 }, '-=1.1')
      .call(() => { if (fan) fan.classList.add('on'); }, null, '-=1.2');
    setTimeout(() => { if (fan) fan.classList.add('done'); }, 3600);
  }
  if (fan) {
    $$('.bl-pc', fan).forEach(c => {
      const bring = () => { $$('.bl-pc', fan).forEach(o => o.classList.toggle('top', o === c && !c.classList.contains('top'))); };
      c.addEventListener('click', bring);
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bring(); } });
    });
  }

  (function typer() {
    const input = $('#blQ'); if (!input) return;
    const words = ['hidden lakes', '48 hours in Paris', 'packing for islands', 'Kyoto in spring', 'safari etiquette', 'night-sky trips'];
    if (reduce) { input.placeholder = 'Search stories, guides and tips'; return; }
    let w = 0, c = 0, del = false;
    (function tick() {
      if (document.activeElement === input || input.value) { setTimeout(tick, 600); return; }
      const word = words[w];
      c += del ? -1 : 1;
      input.placeholder = 'Search \u201C' + word.slice(0, c) + '\u201D';
      let d = del ? 32 : 70;
      if (!del && c === word.length) { del = true; d = 1500; }
      else if (del && c === 0) { del = false; w = (w + 1) % words.length; d = 380; }
      setTimeout(tick, d);
    })();
  })();

  /* ==========================================================
     2. FEATURED - magnifying glass that follows the pointer
     ========================================================== */
  (function loupe() {
    const lens = $('#blLens'), lp = $('#blLoupe'); if (!lens || !lp) return;
    const img = $('img', lens), Z = 2.1;
    let ready = false;
    const place = e => {
      const r = lens.getBoundingClientRect();
      const x = Math.max(0, Math.min(r.width, e.clientX - r.left));
      const y = Math.max(0, Math.min(r.height, e.clientY - r.top));
      const s = lp.offsetWidth;
      lp.style.transform = 'translate(' + (x - s / 2) + 'px,' + (y - s / 2) + 'px)';
      lp.style.backgroundSize = (r.width * Z) + 'px ' + (r.height * Z) + 'px';
      lp.style.backgroundPosition = (-(x * Z - s / 2)) + 'px ' + (-(y * Z - s / 2)) + 'px';
    };
    lens.addEventListener('pointerenter', e => {
      if (!ready) { lp.style.backgroundImage = 'url("' + (img.currentSrc || img.src) + '")'; ready = true; }
      lens.classList.add('zoom'); place(e);
    });
    lens.addEventListener('pointermove', e => { if (lens.classList.contains('zoom')) place(e); });
    ['pointerleave', 'pointercancel'].forEach(t => lens.addEventListener(t, () => lens.classList.remove('zoom')));
  })();

  /* ==========================================================
     3. LATEST - sliding pill + cards glide (FLIP) when filtering
     ========================================================== */
  const latest = (function () {
    const grid = $('#blGrid'); if (!grid) return null;
    const posts = $$('.bl-post', grid), tabs = $$('.bl-tab'), pill = $('#blPill');
    const empty = $('#blEmpty'), count = $('#blCount'), form = $('#blSearch'), input = $('#blQ');
    let cat = 'all', query = '', timer = 0;

    const movePill = () => {
      const t = $('.bl-tab.active'); if (!t || !pill) return;
      pill.style.width = t.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + t.offsetLeft + 'px)';
    };
    const matches = p => (cat === 'all' || p.dataset.cat === cat) && (!query || (p.dataset.title + ' ' + p.dataset.cat).toLowerCase().includes(query));

    function apply() {
      clearTimeout(timer);
      posts.forEach(p => p.getAnimations().forEach(a => a.cancel()));
      const old = new Map();
      posts.forEach(p => { if (!p.hidden) old.set(p, p.getBoundingClientRect()); });
      const leaving = posts.filter(p => !p.hidden && !matches(p));

      const run = () => {
        posts.forEach(p => { p.hidden = !matches(p); });
        let n = 0;
        posts.forEach(p => {
          if (p.hidden) return;
          n++;
          if (reduce || !p.animate) return;
          const r = p.getBoundingClientRect(), o = old.get(p);
          if (o) {
            const dx = o.left - r.left, dy = o.top - r.top;
            if (dx || dy) p.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 750, easing: 'cubic-bezier(.65,0,.2,1)' });
          } else {
            p.animate([{ opacity: 0, transform: 'translateY(34px) scale(.88)' }, { opacity: 1, transform: 'none' }], { duration: 750, delay: 80, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
          }
        });
        empty.hidden = n > 0;
        count.textContent = n + (n === 1 ? ' story' : ' stories');
        if (hasST) ScrollTrigger.refresh();
      };

      if (!reduce && leaving.length && leaving[0].animate) {
        leaving.forEach(p => p.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.82) rotate(-3deg)' }], { duration: 260, easing: 'ease-in', fill: 'forwards' }));
        timer = setTimeout(() => { leaving.forEach(p => p.getAnimations().forEach(a => a.cancel())); run(); }, 270);
      } else run();
    }

    function setCat(c) {
      cat = c;
      tabs.forEach(t => { const on = t.dataset.cat === c; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
      movePill();
      const a = $('.bl-tab.active'); if (a && a.scrollIntoView) a.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      apply();
    }
    tabs.forEach(t => t.addEventListener('click', () => setCat(t.dataset.cat)));

    function search(q, scroll) {
      query = (q || '').trim().toLowerCase();
      if (input) input.value = q || '';
      cat = 'all';
      tabs.forEach(t => { const on = t.dataset.cat === 'all'; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
      movePill(); apply();
      if (scroll) { const s = $('#latest'); if (s) s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
    }
    if (form) form.addEventListener('submit', e => { e.preventDefault(); search(input.value, true); });
    if (input) input.addEventListener('input', () => { if (!input.value && query) search('', false); });
    $$('.bl-tag').forEach(b => b.addEventListener('click', () => search(b.dataset.q, true)));
    const rs = $('#blReset'); if (rs) rs.addEventListener('click', () => search('', false));

    movePill();
    window.addEventListener('resize', movePill);
    window.addEventListener('load', movePill);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);
    return { movePill };
  })();

  /* ==========================================================
     4. GUIDES - 3D cover-flow driven by scroll position
     ========================================================== */
  (function flow() {
    const tr = $('#blTrack'); if (!tr) return;
    const cards = $$('.bl-gc', tr), nameEl = $('#blGcName'), textEl = $('#blGcText'), dots = $('#blDots');
    const prev = $('#blPrev'), next = $('#blNext');
    let act = -1, raf = 0, down = false, moved = false, sx = 0, sl = 0;

    cards.forEach((c, i) => {
      const d = document.createElement('button'); d.type = 'button'; d.setAttribute('aria-label', 'Show ' + c.dataset.name);
      d.addEventListener('click', () => go(i)); dots.appendChild(d);
    });
    const dotEls = $$('button', dots);
    const centerOf = i => cards[i].offsetLeft + cards[i].offsetWidth / 2 - tr.clientWidth / 2;
    function go(i) { i = Math.max(0, Math.min(cards.length - 1, i)); tr.scrollTo({ left: centerOf(i), behavior: reduce ? 'auto' : 'smooth' }); }

    function caption(i) {
      const c = cards[i];
      [nameEl, textEl].forEach(el => { el.classList.remove('in'); void el.offsetWidth; });
      nameEl.textContent = c.dataset.name; textEl.textContent = c.dataset.text;
      nameEl.classList.add('in'); textEl.classList.add('in');
      prev.disabled = i === 0; next.disabled = i === cards.length - 1;
    }
    function update() {
      raf = 0;
      const mid = tr.scrollLeft + tr.clientWidth / 2;
      let best = 0, bd = 1e9;
      cards.forEach((c, i) => {
        const d = (c.offsetLeft + c.offsetWidth / 2 - mid) / (c.offsetWidth + 20), ad = Math.abs(d);
        const ry = -Math.sign(d) * Math.min(ad, 1.4) * 38, sc = 1 - Math.min(ad, 1.4) * .1, tz = -Math.min(ad, 2) * 120;
        c.style.transform = 'translateZ(' + tz.toFixed(1) + 'px) rotateY(' + ry.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
        c.style.opacity = (1 - Math.min(ad, 2) * .3).toFixed(2);
        c.style.zIndex = 100 - Math.round(ad * 10);
        if (ad < bd) { bd = ad; best = i; }
      });
      if (best !== act) {
        act = best;
        cards.forEach((c, i) => c.classList.toggle('on', i === best));
        dotEls.forEach((d, i) => d.classList.toggle('on', i === best));
        caption(best);
      }
    }
    tr.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    prev.addEventListener('click', () => go(act - 1));
    next.addEventListener('click', () => go(act + 1));
    tr.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(act + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(act - 1); }
    });
    cards.forEach((c, i) => c.addEventListener('click', e => {
      if (moved) { e.preventDefault(); return; }
      if (i !== act) { e.preventDefault(); go(i); }
    }));

    // mouse drag-to-scroll (touch uses native swipe)
    tr.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = tr.scrollLeft; });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; tr.classList.add('drag'); }
      tr.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false; tr.classList.remove('drag');
      if (moved) go(act);
      setTimeout(() => { moved = false; }, 0);
    });

    update();
    window.addEventListener('load', () => { tr.scrollLeft = centerOf(Math.min(2, cards.length - 1)); update(); });
    requestAnimationFrame(() => { tr.scrollLeft = centerOf(Math.min(2, cards.length - 1)); update(); });
  })();

  /* ==========================================================
     5. HACKS - drag a card away to keep or skip it
     ========================================================== */
  (function deck() {
    const box = $('#blDeck'); if (!box) return;
    const cards = $$('.bl-tip', box), n = cards.length;
    const endEl = $('#blDeckEnd'), cnt = $('#blDeckCount'), keptEl = $('#blKept');
    const btnSkip = $('#blSkip'), btnKeep = $('#blKeep'), btnReset = $('#blReshuffle');
    let idx = 0, kept = 0, drag = null, busy = false;

    function layout() {
      cards.forEach((c, i) => {
        const p = i - idx; if (p < 0) return;
        const k = Math.min(p, 3);
        c.style.zIndex = n - p;
        c.style.opacity = p > 3 ? 0 : 1;
        c.style.pointerEvents = p === 0 ? 'auto' : 'none';
        c.style.transform = 'translateY(' + (k * 16) + 'px) scale(' + (1 - k * .05) + ') rotate(' + (p === 0 ? 0 : (p % 2 ? 1.6 : -1.6)) + 'deg)';
        c.setAttribute('aria-hidden', p === 0 ? 'false' : 'true');
      });
      cnt.textContent = Math.min(idx + 1, n) + ' / ' + n;
      keptEl.textContent = kept;
      endEl.hidden = idx < n;
      btnSkip.disabled = btnKeep.disabled = idx >= n;
    }
    function fling(dir) {
      if (busy || idx >= n) return;
      busy = true;
      const c = cards[idx];
      c.classList.remove('drag');
      c.style.setProperty(dir > 0 ? '--ko' : '--so', 1);
      c.style.transition = 'transform .65s cubic-bezier(.3,.7,.3,1), opacity .5s .12s';
      c.style.transform = 'translate(' + (dir * window.innerWidth * .9) + 'px,-60px) rotate(' + (dir * 32) + 'deg)';
      c.style.opacity = 0; c.style.pointerEvents = 'none';
      if (dir > 0) kept++;
      idx++; layout();
      setTimeout(() => { busy = false; }, 380);
    }

    box.addEventListener('pointerdown', e => {
      if (busy || idx >= n) return;
      const c = cards[idx]; if (!c.contains(e.target)) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, c, dx: 0 };
      c.classList.add('drag'); c.style.transition = 'none';
      try { c.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    });
    box.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.dx = dx;
      drag.c.style.transform = 'translate(' + dx + 'px,' + (dy * .25) + 'px) rotate(' + (dx / 16) + 'deg)';
      const k = Math.min(1, Math.abs(dx) / 110);
      drag.c.style.setProperty('--ko', dx > 0 ? k : 0);
      drag.c.style.setProperty('--so', dx < 0 ? k : 0);
    });
    const end = e => {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      const c = drag.c, dx = drag.dx; drag = null;
      c.classList.remove('drag');
      if (Math.abs(dx) > 100) fling(dx > 0 ? 1 : -1);
      else { c.style.transition = ''; c.style.setProperty('--ko', 0); c.style.setProperty('--so', 0); layout(); }
    };
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    box.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); fling(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); fling(-1); }
    });
    btnSkip.addEventListener('click', () => fling(-1));
    btnKeep.addEventListener('click', () => fling(1));
    btnReset.addEventListener('click', () => {
      idx = 0; kept = 0;
      cards.forEach(c => { c.style.transition = 'none'; c.style.opacity = 0; c.style.transform = 'translateY(50px) scale(.9)'; c.style.setProperty('--ko', 0); c.style.setProperty('--so', 0); });
      void box.offsetWidth;
      cards.forEach(c => { c.style.transition = ''; });
      layout();
    });

    layout();
    // entrance: cards rise from below when the deck scrolls into view
    if (!('IntersectionObserver' in window) || reduce) { box.classList.add('in', 'live'); }
    else {
      const io = new IntersectionObserver(es => es.forEach(en => {
        if (!en.isIntersecting) return;
        box.classList.add('in'); io.disconnect();
        setTimeout(() => box.classList.add('live'), 1500);
      }), { threshold: .3 });
      io.observe(box);
    }
  })();

  /* ==========================================================
     6. TRENDING - bars race, rows swap places, title scrambles
     ========================================================== */
  (function race() {
    const list = $('#blRace'); if (!list) return;
    const rows = $$('.bl-row', list), pers = $$('.bl-per'), title = $('#blPerTitle');
    const label = { week: 'this week', month: 'this month', all: 'of all time' };
    const order = ['week', 'month', 'all'];
    const shown = new Map(rows.map(r => [r, 0]));
    let cur = 'week', started = false, touched = false, loop = null;

    function scramble(el, text) {
      if (reduce) { el.textContent = text; return; }
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      let f = 0; clearInterval(el._s);
      el._s = setInterval(() => {
        f++;
        const keep = Math.floor(f / 1.3);
        el.textContent = text.split('').map((ch, i) => (ch === ' ' ? ' ' : (i < keep ? ch : chars[Math.floor(Math.random() * 26)]))).join('');
        if (keep >= text.length) { clearInterval(el._s); el.textContent = text; }
      }, 34);
    }
    function tween(r, to) {
      const el = $('.bl-views b', r), from = shown.get(r), t0 = performance.now(), d = reduce ? 0 : 1100;
      const tk = (r._tk = (r._tk || 0) + 1);
      (function f(t) {
        if (r._tk !== tk) return;
        const k = d ? Math.min(1, (t - t0) / d) : 1, e = 1 - Math.pow(1 - k, 3), v = from + (to - from) * e;
        el.textContent = Math.round(v).toLocaleString('en-IN'); shown.set(r, v);
        if (k < 1) requestAnimationFrame(f);
      })(t0);
    }
    function render(p, withTitle) {
      cur = p;
      const sorted = rows.slice().sort((a, b) => +b.dataset[p] - +a.dataset[p]);
      const max = +sorted[0].dataset[p];
      sorted.forEach((r, i) => {
        r.style.setProperty('--i', i);
        r.dataset.rank = i + 1;
        $('.rk', r).textContent = i + 1;
        r.style.setProperty('--w', (+r.dataset[p] / max).toFixed(3));
        tween(r, +r.dataset[p]);
      });
      pers.forEach(b => { const on = b.dataset.p === p; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
      if (withTitle) scramble(title, 'Most read ' + label[p]);
    }
    pers.forEach(b => b.addEventListener('click', () => { touched = true; clearInterval(loop); render(b.dataset.p, true); }));

    function start() {
      if (started) return; started = true;
      render('week', true);
      if (!reduce) loop = setInterval(() => { if (!touched && !document.hidden) render(order[(order.indexOf(cur) + 1) % order.length], true); }, 6500);
    }
    if (!('IntersectionObserver' in window)) start();
    else {
      const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { start(); io.disconnect(); } }), { threshold: .3 });
      io.observe(list);
    }
  })();

  /* ==========================================================
     7. SUBSCRIBE - letter flies into the bottle, bottle sails off
     ========================================================== */
  (function bottle() {
    const form = $('#blBottleForm'); if (!form) return;
    const stage = $('#blStage'), sail = $('#blSail'), paper = $('#blPaper'), neck = $('#blNeck');
    const msg = $('#blBottleMsg'), input = $('#blEmail'), btn = $('button[type="submit"]', form), starBox = $('#blStars');
    let busy = false;

    if (starBox) for (let i = 0; i < 46; i++) {
      const s = document.createElement('span'); s.className = 'bl-star';
      s.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (Math.random() * 72).toFixed(1) + '%;animation-delay:' + (Math.random() * 3).toFixed(2) + 's;scale:' + (.6 + Math.random() * 1.3).toFixed(2);
      starBox.appendChild(s);
    }

    const valid = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    function launch() {
      stage.classList.add('in', 'corked');
      msg.textContent = 'Cork on. Your bottle is setting sail...';
      setTimeout(() => sail.classList.add('go'), 800);
      setTimeout(() => { msg.textContent = 'Bottle launched! Look out for our next postcard in your inbox.'; form.reset(); }, 2400);
      setTimeout(() => {
        sail.classList.add('reset'); sail.classList.remove('go'); stage.classList.remove('in', 'corked');
        void sail.offsetWidth; sail.classList.remove('reset');
        busy = false; btn.disabled = false;
      }, 6600);
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (busy) return;
      if (!valid(input.value.trim())) {
        form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
        msg.textContent = 'Please add a valid email so the bottle knows where to land.';
        input.focus(); return;
      }
      busy = true; btn.disabled = true; msg.textContent = 'Rolling up your message...';
      if (reduce || !paper.animate) { launch(); return; }
      const pr = paper.getBoundingClientRect(), nr = neck.getBoundingClientRect();
      const dx = (nr.left + nr.width / 2) - (pr.left + pr.width / 2), dy = (nr.top + nr.height / 2) - (pr.top + pr.height / 2);
      const a = paper.animate([
        { transform: 'translate(0,0) rotate(-24deg) scale(1)', opacity: 1 },
        { transform: 'translate(' + (dx * .45) + 'px,' + (dy * .45 - 70) + 'px) rotate(16deg) scale(.9)', opacity: 1, offset: .55 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(0deg) scale(.4)', opacity: .9 }
      ], { duration: 1100, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
      a.onfinish = () => { a.cancel(); launch(); };
    });
  })();

  /* ==========================================================
     Scroll-triggered entrances (GSAP)
     ========================================================== */
  function blogScroll() {
    if (!animate || !hasST) return;
    // featured: diagonal wipe + settling zoom + staggered copy
    gsap.fromTo('#blLens', { clipPath: 'polygon(0 0, 0 0, -50% 100%, -50% 100%)' },
      { clipPath: 'polygon(0 0, 150% 0, 150% 100%, -50% 100%)', duration: 1.6, ease: 'power4.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: '#blLens', start: 'top 86%', once: true } });
    gsap.from('#blLens img', { scale: 1.4, duration: 2.2, ease: 'power3.out', scrollTrigger: { trigger: '#blLens', start: 'top 86%', once: true } });
    gsap.from('.bl-fi', { y: 42, opacity: 0, filter: 'blur(8px)', duration: 1, stagger: .1, ease: 'power3.out', clearProps: 'filter,transform,opacity', scrollTrigger: { trigger: '.bl-feat-copy', start: 'top 80%', once: true } });

    // story cards tip forward into place
    const ps = $$('.bl-post');
    gsap.set(ps, { opacity: 0, y: 70, rotationX: -14, transformPerspective: 900 });
    ScrollTrigger.batch(ps, {
      start: 'top 92%', once: true,
      onEnter: b => gsap.to(b, { opacity: 1, y: 0, rotationX: 0, duration: 1, stagger: .1, ease: 'power3.out', clearProps: 'transform,opacity' })
    });

    // cover-flow rises from below the heading
    gsap.from('.bl-flow', { y: 90, opacity: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: '.bl-flow', start: 'top 90%', once: true } });

    // race rows slide in from the left
    gsap.from('.bl-row', { x: -80, opacity: 0, duration: .9, stagger: .09, ease: 'power3.out', clearProps: 'opacity', scrollTrigger: { trigger: '#blRace', start: 'top 85%', once: true } });

    // bottle stage floats up
    gsap.from('#blStage', { y: 80, opacity: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: '#blStage', start: 'top 92%', once: true } });
  }

  /* ==========================================================
     Boot
     ========================================================== */
  blogScroll();
  runPreloader(heroIntro);
  window.addEventListener('load', () => {
    if (typeof AOS !== 'undefined') AOS.refresh();
    if (hasST) ScrollTrigger.refresh();
    if (latest) latest.movePill();
  });
})();


/* ==========================================================================
   CONTACT PAGE scripts (runs only on contact.html)
   ========================================================================== */
(() => {
  'use strict';
  if (!document.querySelector('.ct-page')) return; // runs only on contact.html

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const hasGSAP = typeof gsap !== 'undefined';
  const hasST = hasGSAP && typeof ScrollTrigger !== 'undefined';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const animate = hasGSAP && !reduce;
  const body = document.body;
  if (hasST) gsap.registerPlugin(ScrollTrigger);

/* ---------- AOS ---------- */
  if (typeof AOS === 'undefined' || reduce) $$('[data-aos]').forEach(el => el.removeAttribute('data-aos'));
  else AOS.init({ duration: 900, easing: 'ease-out-cubic', once: true, offset: 70 });

  /* ---------- Elements ---------- */
  const header = $('#header'), nav = $('#mainNav'), burger = $('#hamburger');
  const progress = $('#scrollProgress'), toTop = $('#toTop');

  /* ==========================================================
     Shared UI: header, menu, progress, to-top
     ========================================================== */
  let lastY = window.scrollY, ticking = false;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', y > 40);
    const menuOpen = nav.classList.contains('open');
    if (y > lastY && y > 480 && !menuOpen) header.classList.add('hide');
    else if (y < lastY - 4 || y < 480) header.classList.remove('hide');
    lastY = y;
    progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    toTop.classList.toggle('show', y > 900);
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  function setMenu(open) {
    nav.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    body.classList.toggle('lock', open);
    if (open && animate) gsap.fromTo('.nav-list li, .nav-extra', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .09, delay: .3, ease: 'power3.out', clearProps: 'transform,opacity' });
  }
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  window.addEventListener('resize', () => { if (window.innerWidth >= 992 && nav.classList.contains('open')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false); });
  $$('.nav-link').forEach(a => a.addEventListener('click', () => { if (nav.classList.contains('open')) setMenu(false); }));
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* Custom cursor + magnetic buttons */
  if (animate && finePointer) {
    const cur = $('#cursor'), txt = $('#cursorText');
    gsap.set(cur, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(cur, 'x', { duration: .28, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: .28, ease: 'power3' });
    window.addEventListener('mousemove', e => { cur.classList.add('show'); xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.remove('show'));
    document.addEventListener('mouseover', e => {
      const v = e.target.closest('[data-cursor]');
      if (v) { txt.textContent = v.dataset.cursor; cur.classList.add('big'); cur.classList.remove('link'); return; }
      cur.classList.remove('big'); txt.textContent = '';
      cur.classList.toggle('link', !!e.target.closest('a, button, input, select, textarea, label, .ab-slice, .ab-slide-knob'));
    });
    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)' }));
    });
  }

  /* Login modal + newsletter */
  (function loginModal() {
    const modal = $('#loginModal'), openBtn = $('#loginBtn');
    if (!modal || !openBtn) return;
    const form = $('#authForm'), msg = $('#authMsg');
    const formWrap = $('.modal-form', modal), title = $('#loginTitle'), btnText = $('#authBtnText');
    let lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      if (nav.classList.contains('open')) setMenu(false);
      modal.hidden = false; body.classList.add('lock');
      if (animate) {
        gsap.fromTo('.modal-backdrop', { opacity: 0 }, { opacity: 1, duration: .4 });
        gsap.fromTo('.modal-box', { y: 70, opacity: 0, scale: .95 }, { y: 0, opacity: 1, scale: 1, duration: .8, ease: 'power4.out' });
      }
      setTimeout(() => $('#aEmail').focus(), 350);
    }
    function close() {
      const end = () => { modal.hidden = true; body.classList.remove('lock'); msg.textContent = ''; if (lastFocus) lastFocus.focus(); };
      if (animate) {
        gsap.to('.modal-box', { y: 40, opacity: 0, scale: .97, duration: .4, ease: 'power2.in' });
        gsap.to('.modal-backdrop', { opacity: 0, duration: .4, onComplete: end });
      } else end();
    }
    openBtn.addEventListener('click', open);
    $$('[data-close]', modal).forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (!modal.hidden && e.key === 'Escape') close(); });
    $$('.tab', modal).forEach(tab => tab.addEventListener('click', () => {
      $$('.tab', modal).forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const reg = tab.dataset.tab === 'register';
      formWrap.classList.toggle('is-register', reg);
      title.textContent = reg ? 'Create your account' : 'Welcome back';
      btnText.textContent = reg ? 'Sign up' : 'Login';
      msg.textContent = '';
    }));
    $('#eyeBtn').addEventListener('click', e => {
      const p = $('#aPass'), show = p.type === 'password';
      p.type = show ? 'text' : 'password';
      $('i', e.currentTarget).className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const reg = formWrap.classList.contains('is-register');
      msg.style.color = 'var(--ocean)';
      if (reg && !$('#aName').value.trim()) { msg.textContent = 'Please enter your full name.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#aEmail').value.trim())) { msg.textContent = 'Please enter a valid email address.'; return; }
      if ($('#aPass').value.length < 6) { msg.textContent = 'Password must be at least 6 characters.'; return; }
      msg.textContent = reg ? 'Account created! Welcome aboard.' : 'Logged in successfully. Welcome back!';
      setTimeout(close, 1400);
    });
  })();
  const nf = $('#newsForm'), nm = $('#newsMsg');
  if (nf) nf.addEventListener('submit', e => { e.preventDefault(); nm.textContent = 'You are subscribed. Happy travels!'; nf.reset(); });

  /* ==========================================================
     Preloader -> hero intro
     ========================================================== */
  function runPreloader(done) {
    const pre = $('#preloader');
    if (!pre) return done();
    if (!animate) { pre.remove(); return done(); }
    const cnt = $('#preCount'), bar = $('#preBar'), o = { v: 0 };
    let loaded = document.readyState === 'complete', finished = false;
    window.addEventListener('load', () => { loaded = true; });
    body.classList.add('lock');
    const finish = () => {
      if (finished) return; finished = true;
      gsap.timeline({ onComplete: () => { pre.remove(); body.classList.remove('lock'); } })
        .to('.pre-center', { opacity: 0, y: -24, duration: .5, ease: 'power2.in' })
        .to('.pre-top', { yPercent: -100, duration: 1.05, ease: 'power4.inOut' }, '>-.05')
        .to('.pre-bottom', { yPercent: 100, duration: 1.05, ease: 'power4.inOut' }, '<')
        .call(done, null, '<+.35');
    };
    gsap.to(o, {
      v: 100, duration: 1.6, ease: 'power2.inOut',
      onUpdate() { cnt.textContent = Math.round(o.v); bar.style.transform = 'scaleX(' + (o.v / 100) + ')'; },
      onComplete() { loaded ? finish() : window.addEventListener('load', finish, { once: true }); }
    });
    setTimeout(finish, 6000);
  }


    document.documentElement.classList.add('ct-js');

  /* ---------- helpers used by several sections ---------- */
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const pad2 = n => String(n).padStart(2, '0');
  // current day / time at the Mumbai office (works for visitors in any time zone)
  function officeNow() {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      const g = t => parts.find(p => p.type === t).value;
      let h = +g('hour'); if (h === 24) h = 0;
      return { day: DAYS.indexOf(g('weekday')), h, m: +g('minute') };
    } catch (_) {
      const d = new Date(); return { day: (d.getDay() + 6) % 7, h: d.getHours(), m: d.getMinutes() };
    }
  }
  const officeOpen = t => t.day !== 6 && t.h >= 9 && t.h < 19;
  const whenVisible = (el, fn, threshold) => {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { io.disconnect(); fn(); } }), { threshold: threshold || .3 });
    io.observe(el);
  };

  /* links that go to 404.html remember where the visitor came from */
  $$('[data-return]').forEach(a => a.addEventListener('click', () => {
    try { sessionStorage.setItem('stackly:return', a.dataset.return); } catch (_) { /* ignore */ }
  }));

  /* ==========================================================
     1. HERO - letters drop and bounce, split-flap board says hello
     ========================================================== */
  const titleEl = $('#ctTitle');
  if (animate && titleEl) {
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          Array.from(n.textContent).forEach(ch => {
            if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span'); s.className = 'ct-ch-c'; s.setAttribute('aria-hidden', 'true'); s.textContent = ch; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(titleEl);
    gsap.set('.ct-ch-c', { opacity: 0, y: -140, rotation: () => gsap.utils.random(-40, 40) });
    gsap.set('.ct-in', { opacity: 0, y: 30 });
    gsap.set('.ct-hero .ab-crumb', { opacity: 0, y: -16 });
  }

  const board = (function () {
    const wrap = $('#ctFlaps'), langEl = $('#ctLang'); if (!wrap) return null;
    const N = 7, CH = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const words = [['HELLO', 'English'], ['NAMASTE', 'Hindi'], ['BONJOUR', 'French'], ['MERHABA', 'Turkish'], ['ALOHA', 'Hawaiian'], ['SALAAM', 'Arabic'], ['CIAO', 'Italian'], ['HOLA', 'Spanish']];
    let wi = -1, timer = null;

    const tiles = Array.from({ length: N }, () => {
      const el = document.createElement('span'); el.className = 'sf';
      el.innerHTML = '<span class="sf-a"><b></b></span><span class="sf-b"><b></b></span><span class="sf-fa"><b></b></span><span class="sf-fb"><b></b></span>';
      wrap.appendChild(el);
      const t = { el, cur: ' ', a: $('.sf-a b', el), b: $('.sf-b b', el), fa: $('.sf-fa b', el), fb: $('.sf-fb b', el) };
      t.a.textContent = t.b.textContent = ' ';
      return t;
    });
    const settle = (t, ch) => { t.a.textContent = ch; t.b.textContent = ch; t.cur = ch; t.el.classList.toggle('lit', ch !== ' '); };
    function flipOnce(t, next, done) {
      t.fa.textContent = t.cur; t.fb.textContent = next; t.a.textContent = next; t.b.textContent = t.cur;
      t.el.classList.remove('go'); void t.el.offsetWidth; t.el.classList.add('go');
      setTimeout(() => { t.el.classList.remove('go'); settle(t, next); if (done) done(); }, 190);
    }
    function flipTo(t, target, delay) {
      if (t.cur === target) return;
      const L = CH.length, ti = CH.indexOf(target), ci = CH.indexOf(t.cur);
      const n = Math.min(((ti - ci) + L) % L || L, 9);
      const seq = []; for (let j = n - 1; j >= 0; j--) seq.push(CH[(ti - j + L) % L]);
      const step = i => { if (i < seq.length) flipOnce(t, seq[i], () => step(i + 1)); };
      setTimeout(() => step(0), delay);
    }
    function show(i) {
      wi = i % words.length;
      const [w, lang] = words[wi];
      const left = Math.floor((N - w.length) / 2);
      const chars = Array.from({ length: N }, (_, k) => (k >= left && k < left + w.length ? w[k - left] : ' '));
      tiles.forEach((t, k) => { if (reduce) settle(t, chars[k]); else flipTo(t, chars[k], k * 90); });
      if (langEl) langEl.textContent = lang;
    }
    function start() { show(0); timer = setInterval(() => { if (!document.hidden) show(wi + 1); }, 4600); }
    return { start };
  })();

  function heroIntro() {
    if (!animate) { if (board) board.start(); return; }
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to('.ct-hero .ab-crumb', { opacity: 1, y: 0, duration: .7 })
      .to('.ct-ch-c', { opacity: 1, y: 0, rotation: 0, duration: 1.5, ease: 'bounce.out', stagger: .05 }, '-=.3')
      .to('.ct-in', { opacity: 1, y: 0, duration: .9, stagger: .14 }, '-=.9')
      .call(() => { if (board) board.start(); }, null, '-=.6');
  }

  /* ==========================================================
     2. CHANNELS - liquid fill from the entry point, copy, live status
     ========================================================== */
  (function channels() {
    const cards = $$('.ct-ch');
    cards.forEach(c => {
      const setPos = e => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--x', (e.clientX - r.left) + 'px');
        c.style.setProperty('--y', (e.clientY - r.top) + 'px');
      };
      c.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') setPos(e); });
      c.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') setPos(e); });
      c.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse' || e.target.closest('a,button')) return;
        setPos(e);
        cards.forEach(o => { if (o !== c) o.classList.remove('on'); });
        c.classList.toggle('on');
      });
    });

    $$('.ct-copy').forEach(b => b.addEventListener('click', async () => {
      const txt = b.dataset.copy;
      try { await navigator.clipboard.writeText(txt); } catch (_) {
        const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (__) { /* ignore */ } ta.remove();
      }
      const s = $('span', b), ic = $('i', b);
      s.textContent = 'Copied'; ic.className = 'fa-solid fa-check'; b.classList.add('ok');
      setTimeout(() => { s.textContent = 'Copy'; ic.className = 'fa-regular fa-copy'; b.classList.remove('ok'); }, 1800);
    }));

    const st = $('#ctStatus'), txt = $('#ctStatusTxt'), dot = st && $('.ct-dot', st);
    function status() {
      if (!st) return;
      const t = officeNow(), open = officeOpen(t);
      dot.classList.toggle('off', !open);
      if (open) txt.textContent = 'We are online now. Replies in a few hours.';
      else if (t.day === 6 || (t.day === 5 && t.h >= 19)) txt.textContent = 'Closed today. Back Monday at 9:00 AM.';
      else txt.textContent = 'Offline right now. We reply from 9:00 AM.';
    }
    status(); setInterval(status, 60000);
  })();

  /* ==========================================================
     3. ENQUIRY - live boarding pass, people icons, budget tooltip,
        shaking validation, redirect on a valid submit
     ========================================================== */
  (function enquiry() {
    const FORM_TARGET = '404.html';           // where a valid submit goes
    const f = $('#ctForm'); if (!f) return;
    const send = $('#ctSend'), msg = $('#ctFormMsg');
    const tkTo = $('#ctTkTo'), tkName = $('#ctTkName'), tkDate = $('#ctTkDate'), tkPax = $('#ctTkPax'), tkBud = $('#ctTkBud');
    const tkA = $('#ctTkA'), tkB = $('#ctTkB'), tkBox = $('.ct-ticket-img'), bars = $('#ctBars');
    const dateEl = $('#ctDate'), paxNum = $('#ctPaxNum'), people = $('#ctPeople'), minus = $('#ctMinus'), plus = $('#ctPlus');
    const bud = $('#ctBudget'), tip = $('#ctBudTip'), range = $('.ct-range', f);
    const nameEl = $('#ctName'), emailEl = $('#ctEmail'), phoneEl = $('#ctPhone'), msgEl = $('#ctMsg');
    let pax = 2, swapTimer = 0;

    const money = n => '\u20B9' + Number(n).toLocaleString('en-IN');
    const put = (el, text) => {
      if (el.textContent === text) return;
      el.textContent = text; el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
    };
    for (let i = 0; i < 34; i++) bars.appendChild(document.createElement('i'));
    const barEls = $$('i', bars);
    const shuffleBars = () => barEls.forEach(b => { b.style.height = (28 + Math.random() * 72) + '%'; });

    /* destination */
    $$('input[name="dest"]', f).forEach(r => r.addEventListener('change', () => {
      put(tkTo, r.value);
      const url = r.dataset.img.replace(/&amp;/g, '&');
      clearTimeout(swapTimer);
      tkB.onload = () => {
        tkBox.classList.add('swap');
        swapTimer = setTimeout(() => { tkA.src = tkB.src; tkBox.classList.remove('swap'); }, 1000);
      };
      tkB.src = url;
      clearError(f.querySelector('fieldset'));
      shuffleBars();
    }));

    /* date */
    const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    dateEl.min = today.toISOString().slice(0, 10);
    dateEl.addEventListener('input', () => {
      put(tkDate, dateEl.value ? new Date(dateEl.value + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Flexible');
      shuffleBars();
    });

    /* travellers */
    function renderPeople(n) {
      const cur = $$('i:not(.out)', people);
      while (cur.length < n) { const i = document.createElement('i'); i.className = 'fa-solid fa-person'; people.appendChild(i); cur.push(i); }
      while (cur.length > n) { const i = cur.pop(); i.classList.add('out'); setTimeout(() => i.remove(), 260); }
    }
    function setPax(n) {
      pax = Math.max(1, Math.min(12, n));
      paxNum.textContent = pax; put(tkPax, String(pax));
      minus.disabled = pax <= 1; plus.disabled = pax >= 12;
      renderPeople(pax); shuffleBars();
    }
    minus.addEventListener('click', () => setPax(pax - 1));
    plus.addEventListener('click', () => setPax(pax + 1));

    /* budget */
    function setBudget() {
      const v = +bud.value, pct = (v - bud.min) / (bud.max - bud.min) * 100;
      range.style.setProperty('--pct', pct.toFixed(2) + '%');
      const t = money(v) + (v >= +bud.max ? '+' : '');
      tip.textContent = t; put(tkBud, t);
    }
    bud.addEventListener('input', () => { setBudget(); shuffleBars(); });

    /* name on the pass */
    nameEl.addEventListener('input', () => {
      const v = nameEl.value.trim();
      put(tkName, v ? v.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Your name');
    });

    /* validation */
    const groupOf = key => f.querySelector('[data-field="' + key + '"]');
    function clearError(node) { if (node) node.classList.remove('bad', 'shake'); }
    function flag(node, text) {
      node.classList.add('bad');
      const e = $('.ct-err', node); if (e && text) e.textContent = text;
      node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake');
    }
    ['name', 'email', 'phone', 'msg'].forEach(k => {
      const g = groupOf(k); $('input,textarea', g).addEventListener('input', () => clearError(g));
    });
    function validate() {
      const bad = [];
      const destFs = $('.ct-fs', f);
      if (!f.querySelector('input[name="dest"]:checked')) { $('.ct-err', destFs).textContent = 'Please pick a destination to dream about.'; bad.push([destFs]); }
      const name = nameEl.value.trim();
      if (name.length < 2) bad.push([groupOf('name'), 'Please tell us your name.']);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) bad.push([groupOf('email'), emailEl.value.trim() ? 'That email does not look right.' : 'Please enter your email.']);
      const ph = phoneEl.value.trim();
      if (ph && !/^\+?[\d\s()-]{8,18}$/.test(ph)) bad.push([groupOf('phone'), 'Use digits only, for example +91 98765 43210.']);
      if (msgEl.value.trim().length < 10) bad.push([groupOf('msg'), 'Please share a few words about your trip (10+ characters).']);
      return bad;
    }
    f.addEventListener('submit', e => {
      e.preventDefault();
      $$('.bad', f).forEach(n => n.classList.remove('bad', 'shake'));
      const bad = validate();
      if (bad.length) {
        bad.forEach(([node, text], i) => setTimeout(() => flag(node, text), i * 90));
        msg.textContent = 'Please fix the highlighted fields.';
        const first = bad[0][0], focusEl = $('input,textarea', first);
        first.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        if (focusEl && first !== $('.ct-fs', f)) setTimeout(() => focusEl.focus({ preventScroll: true }), 350);
        return;
      }
      msg.textContent = 'Packing your enquiry...';
      send.classList.add('sending'); send.disabled = true;
      try { sessionStorage.setItem('stackly:return', 'contact.html#enquiry'); } catch (_) { /* ignore */ }
      setTimeout(() => { window.location.href = FORM_TARGET; }, reduce ? 200 : 1100);
    });

    /* every visit (and every back-navigation) starts with an empty form */
    function fresh() {
      f.reset(); pax = 2;
      $$('.bad', f).forEach(n => n.classList.remove('bad', 'shake'));
      send.classList.remove('sending'); send.disabled = false; msg.textContent = '';
      put(tkTo, 'Anywhere'); put(tkName, 'Your name'); put(tkDate, 'Flexible');
      setPax(2); setBudget(); shuffleBars();
    }
    fresh();
    window.addEventListener('pageshow', e => { if (e.persisted) fresh(); });
  })();

  /* ==========================================================
     4. VISIT - 24-hour dial sweeps to "now", pin drops and bounces
     ========================================================== */
  (function visit() {
    const svg = $('.ct-dial-svg'); if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg', gT = $('#ctTicks');
    for (let i = 0; i < 24; i++) {
      const big = i % 6 === 0, ln = document.createElementNS(NS, 'line');
      ln.setAttribute('x1', 150); ln.setAttribute('x2', 150);
      ln.setAttribute('y1', 150 - 128 + 2); ln.setAttribute('y2', 150 - 128 + (big ? 16 : 9));
      ln.setAttribute('transform', 'rotate(' + (i * 15) + ' 150 150)');
      if (big) ln.setAttribute('class', 'big');
      gT.appendChild(ln);
    }
    const arc = $('#ctArc'), hand = $('#ctHand'), openEl = $('#ctOpen'), nowEl = $('#ctNow'), days = $$('#ctDays li');
    const C = 2 * Math.PI * 102, len = C * 10 / 24;
    function tick() {
      const t = officeNow(), frac = (t.h + t.m / 60) / 24, o = officeOpen(t);
      hand.style.transform = 'rotate(' + (frac * 360).toFixed(1) + 'deg)';
      nowEl.textContent = pad2(t.h % 12 || 12) + ':' + pad2(t.m) + (t.h < 12 ? ' AM' : ' PM');
      openEl.textContent = o ? 'Open' : 'Closed'; openEl.classList.toggle('closed', !o);
      days.forEach(li => li.classList.toggle('today', +li.dataset.d === t.day));
    }
    whenVisible($('#ctDialBox'), () => {
      arc.style.strokeDasharray = len.toFixed(1) + ' ' + (C - len).toFixed(1);
      tick(); setInterval(tick, 30000);
    }, .35);
    whenVisible($('#ctMap'), () => $('#ctMap').classList.add('drop'), .35);
  })();

  /* ==========================================================
     5. NEXT - a chat that types itself, steps light up with it
     ========================================================== */
  (function chat() {
    const box = $('#ctChat'); if (!box) return;
    const steps = $$('#ctSteps li'), replay = $('#ctReplay');
    const script = [
      { w: 'me', s: 0, t: 'Hi! Planning a honeymoon in the Maldives, 6 nights, around \u20B91.5L each. Any ideas?' },
      { w: 'them', s: 1, t: 'Congratulations! I am Aisha. I have three water-villa options in mind. When would you like to travel?' },
      { w: 'me', s: 1, t: 'Mid March works for us.' },
      { w: 'them', s: 2, t: 'Perfect. Your draft plan with flights, villa and a sunset cruise lands in your inbox within 24 hours.' },
      { w: 'me', s: 2, t: 'Amazing, thank you!' },
      { w: 'them', s: 3, t: 'Anytime. We stay with you until you are back home.' }
    ];
    let timers = [], run = 0;
    const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
    const lit = n => steps.forEach((s, i) => s.classList.toggle('on', i <= n));
    const markRead = () => $$('.tk:not(.read)', box).forEach(t => t.classList.add('read'));
    function bubble(w, text) {
      const m = document.createElement('div'); m.className = 'ct-msg ' + w; m.textContent = text;
      if (w === 'me') { const tk = document.createElement('span'); tk.className = 'tk'; tk.innerHTML = '<i class="fa-solid fa-check-double"></i>'; m.appendChild(tk); }
      box.appendChild(m); box.scrollTop = box.scrollHeight; return m;
    }
    function play() {
      timers.forEach(clearTimeout); timers = []; run++;
      box.innerHTML = ''; lit(-1);
      if (reduce) { script.forEach(m => bubble(m.w, m.t)); markRead(); lit(3); return; }
      const my = run;
      (function next(i) {
        if (my !== run || i >= script.length) return;
        const m = script[i];
        if (m.w === 'me') {
          later(() => { if (my !== run) return; bubble('me', m.t); lit(m.s); next(i + 1); }, i ? 1100 : 500);
        } else {
          later(() => {
            if (my !== run) return;
            const ty = document.createElement('div'); ty.className = 'ct-msg them ct-typing'; ty.innerHTML = '<i></i><i></i><i></i>';
            box.appendChild(ty); box.scrollTop = box.scrollHeight;
            later(() => { if (my !== run) return; ty.remove(); markRead(); bubble('them', m.t); lit(m.s); next(i + 1); }, 1500);
          }, 700);
        }
      })(0);
    }
    replay.addEventListener('click', play);
    whenVisible($('.ct-phone'), play, .45);
  })();

  /* ==========================================================
     6. QUICK ANSWERS - scratch-off foil (canvas)
     ========================================================== */
  (function scratch() {
    const cards = $$('.ct-sc'); if (!cards.length) return;
    const headFont = (getComputedStyle(document.documentElement).getPropertyValue('--font-head') || '').trim() || 'Georgia, serif';

    cards.forEach(card => {
      const cv = $('.ct-foil', card), ctx = cv.getContext('2d', { willReadFrequently: true }), btn = $('.ct-reveal', card);
      let w = 0, h = 0, done = false, drawing = false, last = null, moves = 0;

      function wrapText(text, cx, y, maxW, lh) {
        const words = text.split(' '), lines = []; let line = '';
        words.forEach(wd => { const t = line ? line + ' ' + wd : wd; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t; });
        lines.push(line);
        const y0 = y - ((lines.length - 1) * lh) / 2;
        lines.forEach((l, i) => ctx.fillText(l, cx, y0 + i * lh));
      }
      function paint() {
        if (done) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = card.clientWidth; h = card.clientHeight;
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over';
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#dde3e8'); g.addColorStop(.35, '#a7b0b8'); g.addColorStop(.62, '#eef1f3'); g.addColorStop(1, '#98a3ac');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 280; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * .4).toFixed(2) + ')'; ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2.4, 1 + Math.random() * 2.4); }
        for (let i = 0; i < 40; i++) { ctx.strokeStyle = 'rgba(60,72,84,.07)'; ctx.beginPath(); const y = Math.random() * h; ctx.moveTo(0, y); ctx.lineTo(w, y + (Math.random() * 20 - 10)); ctx.stroke(); }
        const fs = Math.max(15, Math.min(24, w / 10));
        ctx.fillStyle = '#26333f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 ' + fs + 'px ' + headFont;
        wrapText(cv.dataset.q, w / 2, h * .42, w - 34, fs * 1.22);
        ctx.font = '600 ' + Math.max(9, fs * .46) + 'px sans-serif'; ctx.fillStyle = 'rgba(38,51,63,.7)';
        ctx.fillText('SCRATCH HERE', w / 2, h - 20);
      }
      function reveal() { if (done) return; done = true; card.classList.add('done'); }
      function check() {
        if (done) return;
        const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let clear = 0, tot = 0;
        for (let i = 3; i < d.length; i += 52) { tot++; if (d[i] < 24) clear++; }
        if (clear / tot > .42) reveal();
      }
      const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (w / r.width), y: (e.clientY - r.top) * (h / r.height) }; };
      function scratchTo(p) {
        ctx.globalCompositeOperation = 'destination-out'; ctx.strokeStyle = '#000'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(30, w * .13);
        const a = last || p; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(p.x + .01, p.y); ctx.stroke(); last = p;
      }
      cv.addEventListener('pointerdown', e => { if (done) return; drawing = true; last = null; try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } scratchTo(pos(e)); });
      cv.addEventListener('pointermove', e => { if (!drawing || done) return; scratchTo(pos(e)); if (++moves % 6 === 0) check(); });
      ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { drawing = false; last = null; check(); }));
      btn.addEventListener('click', reveal);

      let rw = 0;
      const repaint = () => { if (!done && card.clientWidth !== rw) { rw = card.clientWidth; paint(); } };
      paint(); rw = card.clientWidth;
      let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(repaint, 200); });
      window.addEventListener('load', repaint);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!done) paint(); });
    });
  })();

  /* ==========================================================
     7. SUNRISE CTA - scroll position drives --p (night -> day)
     ========================================================== */
  (function dawn() {
    const s = $('#begin'); if (!s) return;
    const box = $('#ctDStars');
    for (let i = 0; i < 44; i++) {
      const st = document.createElement('span');
      st.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (Math.random() * 100).toFixed(1) + '%;animation-delay:' + (Math.random() * 3).toFixed(2) + 's;scale:' + (.6 + Math.random() * 1.2).toFixed(2);
      box.appendChild(st);
    }
    if (reduce) { s.style.setProperty('--p', 1); return; }
    let raf = 0;
    function upd() {
      raf = 0;
      const r = s.getBoundingClientRect(), vh = window.innerHeight;
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * .9)));
      s.style.setProperty('--p', p.toFixed(3));
    }
    const req = () => { if (!raf) raf = requestAnimationFrame(upd); };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    upd();
  })();

  /* ==========================================================
     Boot
     ========================================================== */
  runPreloader(heroIntro);
  window.addEventListener('load', () => {
    if (typeof AOS !== 'undefined') AOS.refresh();
    if (hasST) ScrollTrigger.refresh();
  });
})();

/* ---------- Live image fallback: if a remote photo fails, show a theme gradient instead of a broken icon ---------- */
document.addEventListener('error', (e) => {
  const el = e.target;
  if (el && el.tagName === 'IMG' && !el.dataset.failed && /unsplash/.test(el.src)) {
    el.dataset.failed = '1';
    el.removeAttribute('srcset');
    el.style.background = 'linear-gradient(135deg,#0b1f2e,#ff6b3d)';
    el.style.objectFit = 'cover';
    el.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  }
}, true);

/* ==========================================================================
   NAV ACTIVE-LINK FIX (added) - highlights the link of the page you are on
   (Home on index.html) and stops the scroll observer from clearing it.
   ========================================================================== */
(() => {
  'use strict';
  const links = Array.from(document.querySelectorAll('.nav-list .nav-link'));
  if (!links.length) return;

  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const current = links.find(a => {
    const h = (a.getAttribute('href') || '').split('#')[0].split('?')[0].toLowerCase();
    return h === file || (file === '' && h === 'index.html');
  });
  if (!current) return;

  const apply = () => {
    links.forEach(a => {
      const on = a === current;
      if (a.classList.contains('active') !== on) a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  };
  apply();

  // the old scroll observer removes .active from every link - put it back
  const mo = new MutationObserver(apply);
  links.forEach(a => mo.observe(a, { attributes: true, attributeFilter: ['class'] }));
})();


/* ==========================================================================
   RETURN-TO-SPOT (added) - remembers the exact scroll position before a visitor
   is sent to 404.html, and puts them back on the same page, at the same spot,
   when they press "Go to previous page" on the 404 page. Works on every page.
   ========================================================================== */
(() => {
  'use strict';
  if (/(^|\/)404(\.html)?$/i.test(location.pathname)) return;   // not on the 404 page itself

  const POS_KEY = 'stackly:pos';          // where the visitor was when they left
  const RESTORE_KEY = 'stackly:restore';  // set by 404.js when "previous page" is pressed
  const here = () => (location.pathname.split('/').pop() || 'index.html') + location.search;
  const scrollNow = () => Math.round(window.scrollY || document.documentElement.scrollTop || 0);

  const save = () => {
    try { sessionStorage.setItem(POS_KEY, JSON.stringify({ url: here(), y: scrollNow(), t: Date.now() })); } catch (_) { /* ignore */ }
  };

  // clicking any link that leads to 404.html (e.g. "Get directions") - save the spot first
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    try {
      if (/\/404(\.html)?$/i.test(new URL(a.getAttribute('href'), location.href).pathname)) save();
    } catch (_) { /* ignore */ }
  }, true);

  // forms / scripts that redirect to 404.html (e.g. contact form) - also covered when the page is left
  window.addEventListener('pagehide', save);

  // ---------- coming back from the 404 page: scroll to the saved spot ----------
  let r = null;
  try { r = JSON.parse(sessionStorage.getItem(RESTORE_KEY) || 'null'); } catch (_) { r = null; }
  if (!r || r.url !== here() || typeof r.y !== 'number' || Date.now() - r.t > 60000) return;
  try { sessionStorage.removeItem(RESTORE_KEY); } catch (_) { /* ignore */ }
  try { history.scrollRestoration = 'manual'; } catch (_) { /* ignore */ }

  let touched = false;   // stop helping as soon as the visitor scrolls on their own
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => window.addEventListener(ev, () => { touched = true; }, { passive: true, once: true }));

  const go = () => {
    if (touched) return;
    if (Math.abs(scrollNow() - r.y) > 2) window.scrollTo({ top: r.y, left: 0, behavior: 'instant' });
  };
  // retry while images, the preloader and the animations settle and the page reaches its full height
  [0, 150, 400, 900, 1600, 2600, 4000].forEach(ms => setTimeout(go, ms));
  window.addEventListener('load', () => setTimeout(go, 50));
})();

/* ==========================================================================
   DESTINATIONS - turn off the pinned horizontal scroll (added)
   The destinations are now a normal grid (see style.css), so the old
   scroll-pinning + sideways movement must not run any more.
   ========================================================================== */
(() => {
  'use strict';
  const pin = document.getElementById('destPin');
  if (!pin || typeof ScrollTrigger === 'undefined') return;
  const track = document.getElementById('destTrack');

  const disable = () => {
    let changed = false;
    ScrollTrigger.getAll().forEach(st => {
      const onSlider = st.pin === pin || st.trigger === pin || (st.vars && st.vars.containerAnimation);
      if (!onSlider) return;
      try { if (st.animation) st.animation.kill(); st.kill(true); changed = true; } catch (_) { /* ignore */ }
    });
    if (typeof gsap !== 'undefined') {
      if (track) gsap.set(track, { clearProps: 'transform' });
      gsap.set(pin.querySelectorAll('.d-img img'), { clearProps: 'transform' });
    }
    if (changed) ScrollTrigger.refresh();
  };

  disable();

  // the old code builds the pin again when the window is resized across a breakpoint - remove it again
  let t = 0;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(disable, 350); });
  window.addEventListener('load', () => setTimeout(disable, 300));
})();


/* ==========================================================
   CONTACT FORM UPDATE  -  add-on only
   Load AFTER script.js:   <script src="form-update.js"></script>
   Your existing index.html / script.js / style.css are not edited.

   What it does
   1. ALL fields are mandatory (name, email, phone, destination, message).
   2. If anything is empty/invalid -> highlights those fields and shows
      "Please fill in the highlighted fields." (no redirect).
   3. If everything is filled -> clears the form and opens 404.html.
   4. When the user comes BACK from 404.html, they land on the same page
      with every field empty.
   ========================================================== */
(function () {
  'use strict';

  var form = document.getElementById('contactForm');
  if (!form) return;

  var msg = document.getElementById('formMsg');
  var TARGET = '404.html';

  /* phone is optional in the original HTML - make it mandatory here */
  var phone = document.getElementById('cPhone');
  if (phone) phone.required = true;

  function isValid(field) {
    var v = (field.value || '').trim();
    if (!v) return false;
    if (field.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (field.type === 'tel') {
      var digits = v.replace(/\D/g, '');
      return /^[+()\-.\s\d]+$/.test(v) && digits.length >= 7 && digits.length <= 15;
    }
    return true;
  }

  function clearForm() {
    form.reset();
    Array.prototype.forEach.call(form.querySelectorAll('.f-group'), function (g) {
      g.classList.remove('invalid');
    });
    if (msg) msg.textContent = '';
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = false;
  }

  /* Runs in the capture phase on document, so it fires BEFORE the
     original handler in script.js and replaces it for this form. */
  document.addEventListener('submit', function (e) {
    if (e.target !== form) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    var ok = true;
    Array.prototype.forEach.call(form.querySelectorAll('.f-group'), function (g) {
      var f = g.querySelector('input, select, textarea');
      if (!f) return;
      var valid = isValid(f);
      g.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });

    if (!ok) {
      if (msg) msg.textContent = 'Please fill in the highlighted fields.';
      var firstBad = form.querySelector('.f-group.invalid input, .f-group.invalid select, .f-group.invalid textarea');
      if (firstBad) firstBad.focus();
      return;
    }

    /* all fields valid */
    if (msg) msg.textContent = 'Sending...';
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    setTimeout(function () {
      clearForm();                 // empty everything before leaving the page
      window.location.href = TARGET;
    }, 400);
  }, true);

  /* Coming back from 404.html (back button / bfcache / form restore):
     always show the same page with empty fields. */
  window.addEventListener('pageshow', clearForm);
})();


/* ==========================================================
   FOOTER NEWSLETTER UPDATE  -  add-on only
   Load AFTER script.js (and after form-update.js):
     <script src="newsletter-update.js"></script>
   Your existing index.html / script.js / style.css are not edited.

   1. Email is mandatory and must be a valid address.
   2. Empty / invalid -> shows a message, stays on the page.
   3. Valid -> clears the field and opens 404.html.
   4. Coming BACK from 404.html -> same page, email field empty.
   ========================================================== */
(function () {
  'use strict';

  var form = document.getElementById('newsForm');
  if (!form) return;

  var input = form.querySelector('input[type="email"]');
  var msg = document.getElementById('newsMsg');
  var TARGET = '404.html';

  /* use our own message instead of the browser's pop-up bubble */
  form.noValidate = true;

  function clearForm() {
    form.reset();
    if (input) input.removeAttribute('aria-invalid');
    if (msg) msg.textContent = '';
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = false;
  }

  /* capture phase on document: runs before the handlers in script.js */
  document.addEventListener('submit', function (e) {
    if (e.target !== form) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    var v = input ? input.value.trim() : '';
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    if (!ok) {
      if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
      if (msg) msg.textContent = v ? 'Please enter a valid email address.' : 'Please enter your email address.';
      return;
    }

    if (msg) msg.textContent = 'Subscribing...';
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    setTimeout(function () {
      clearForm();                 // empty the field before leaving
      window.location.href = TARGET;
    }, 400);
  }, true);

  if (input) input.addEventListener('input', function () {
    input.removeAttribute('aria-invalid');
    if (msg) msg.textContent = '';
  });

  /* back from 404.html (back button / bfcache / browser form restore) */
  window.addEventListener('pageshow', clearForm);
})();


/* ==========================================================
   "WHAT WE DO" INDEX ROWS  -  add-on only
   Load AFTER script.js:  <script src="index-update.js"></script>
   Desktop (mouse): clicking anywhere on a row opens 404.html.
   Phone / tablet (touch): tapping a row still opens/closes it
   (your existing behaviour); the arrow button opens 404.html.
   ========================================================== */
(function () {
  'use strict';
  var rows = document.querySelectorAll('#svList .sv-row');
  if (!rows.length) return;
  var TARGET = '404.html';
  var mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!mouse) return;                       // touch: arrow link handles it

  Array.prototype.forEach.call(rows, function (row) {
    row.style.cursor = 'pointer';
    row.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;    // arrow link navigates by itself
      window.location.href = TARGET;
    });
    row.addEventListener('keydown', function (e) {
      if (e.target !== row) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = TARGET;
      }
    });
  });
})();


/* ==========================================================
   BLOG HERO SEARCH  -  add-on only
   Load AFTER script.js:  <script src="blog-search-update.js"></script>
   Your existing blog.html / script.js / style.css are not edited.

   1. Search box is mandatory - empty (or spaces only) shows a
      message + highlights the box, and nothing happens.
   2. Filled -> clears the box and opens 404.html.
   3. Coming BACK from 404.html -> same page, search box empty.
   (The popular-tag buttons - Lakes, Packing, Paris, Japan - keep
    working exactly as before.)
   ========================================================== */
(function () {
  'use strict';

  var form = document.getElementById('blSearch');
  var input = document.getElementById('blQ');
  if (!form || !input) return;

  var TARGET = '404.html';

  /* small error message under the search bar (created here, no HTML edit) */
  var msg = document.createElement('p');
  msg.id = 'blSearchMsg';
  msg.setAttribute('role', 'status');
  msg.setAttribute('aria-live', 'polite');
  msg.style.cssText = 'margin:.6rem 0 0 1.2rem;font-size:.9rem;color:var(--sun,#ff6b3d);min-height:1.2em';
  form.insertAdjacentElement('afterend', msg);

  function setInvalid(on, text) {
    msg.textContent = on ? text : '';
    if (on) {
      input.setAttribute('aria-invalid', 'true');
      form.style.borderColor = 'var(--sun,#ff6b3d)';
      form.style.boxShadow = '0 0 0 5px rgba(255,107,61,.2)';
    } else {
      input.removeAttribute('aria-invalid');
      form.style.borderColor = '';
      form.style.boxShadow = '';
    }
  }

  function clearAll() {
    input.value = '';
    setInvalid(false);
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = false;
  }

  /* capture phase on document: runs before the submit handler in script.js */
  document.addEventListener('submit', function (e) {
    if (e.target !== form) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    if (!input.value.trim()) {
      setInvalid(true, 'Please type something to search.');
      input.focus();
      return;
    }

    setInvalid(false);
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    setTimeout(function () {
      clearAll();                       // empty the box before leaving
      window.location.href = TARGET;
    }, 300);
  }, true);

  /* remove the error as soon as the user starts typing */
  input.addEventListener('input', function () {
    if (input.value.trim()) setInvalid(false);
  });

  /* back from 404.html (back button / bfcache / browser form restore) */
  window.addEventListener('pageshow', clearAll);
})();

/* ==========================================================
   BLOG POPULAR TAGS (Lakes / Packing / Paris / Japan)  -  add-on
   Load AFTER script.js:  <script src="blog-tags-update.js"></script>
   Clicking any tag now opens 404.html instead of filtering.
   Your existing blog.html / script.js / style.css are not edited.
   ========================================================== */
(function () {
  'use strict';
  var TARGET = '404.html';

  /* capture phase on document: runs before the tag handlers in script.js */
  document.addEventListener('click', function (e) {
    var tag = e.target.closest && e.target.closest('.bl-tags .bl-tag');
    if (!tag) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    window.location.href = TARGET;
  }, true);
})();

/* ==========================================================
   BLOG PAGE SMOOTHNESS  -  add-on only
   Load AFTER script.js:  <script src="blog-smooth.js"></script>
   Your existing blog.html / script.js / style.css are not edited.

   1. Pauses the endless CSS animations (stars, waves, bobbing bottle,
      moving title fill ...) in every section that is NOT on screen, so
      the browser only animates what you can see.
   2. Lets images decode off the main thread (decoding="async") so
      scrolling does not hitch when a picture appears.
   ========================================================== */
(function () {
  'use strict';
  if (!document.querySelector('.bl-page')) return;     // blog page only

  /* 2. async image decoding */
  Array.prototype.forEach.call(document.images, function (img) {
    if (!img.hasAttribute('decoding')) img.decoding = 'async';
  });

  /* 1. pause off-screen animations */
  if (!('IntersectionObserver' in window)) return;
  var sections = document.querySelectorAll('.bl-page header, .bl-page main > section, .bl-page section, .bl-page footer');
  var seen = new Set();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      en.target.classList.toggle('bl-paused', !en.isIntersecting);
    });
  }, { rootMargin: '150px 0px' });

  Array.prototype.forEach.call(sections, function (s) {
    if (seen.has(s)) return;
    seen.add(s);
    io.observe(s);
  });

  /* also stop everything while the tab is hidden */
  document.addEventListener('visibilitychange', function () {
    document.documentElement.classList.toggle('bl-paused', document.hidden);
  });
})();

/* ==========================================================
   BLOG "SEND THE BOTTLE" FORM  -  add-on only
   Load AFTER script.js:  <script src="blog-bottle-update.js"></script>
   Your existing blog.html / script.js / style.css are not edited.

   - Your original code still does the validation, the shake, and the
     letter-into-bottle animation (empty / bad email behaves as before).
   - NEW: once a valid email is sent and the bottle animation has played,
     the email box is cleared and the browser opens 404.html.
   - NEW: coming BACK from 404.html shows the same page with an empty
     email box and the bottle reset to its start.
   ========================================================== */
(function () {
  'use strict';

  var form  = document.getElementById('blBottleForm');
  if (!form) return;

  var input = document.getElementById('blEmail');
  var msg   = document.getElementById('blBottleMsg');
  var stage = document.getElementById('blStage');
  var sail  = document.getElementById('blSail');
  var paper = document.getElementById('blPaper');
  var btn   = form.querySelector('button[type="submit"]');

  var TARGET = '404.html';
  var DELAY  = 3600;          // lets the bottle animation play first (ms)
  var timer  = 0;
  var valid  = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };

  /* bubble phase = runs AFTER the original handler in script.js */
  form.addEventListener('submit', function () {
    if (timer) return;
    var ok = valid(input.value.trim());
    if (!ok || !btn || !btn.disabled) return;   // original rejected it (invalid) -> do nothing

    timer = setTimeout(function () {
      clean();                                   // empty everything before leaving
      window.location.href = TARGET;
    }, DELAY);
  });

  /* put the form + bottle back to the starting state */
  function clean() {
    clearTimeout(timer); timer = 0;
    if (input) input.value = '';
    form.reset();
    form.classList.remove('shake');
    if (msg) msg.textContent = '';
    if (btn) btn.disabled = false;
    if (stage) stage.classList.remove('in', 'corked');
    if (sail) { sail.classList.remove('go', 'reset'); }
    if (paper && paper.getAnimations) {
      paper.getAnimations().forEach(function (a) {
        /* cancel only the letter-flight animation made by script.js,
           never your CSS animations / transitions */
        var css = (window.CSSAnimation && a instanceof CSSAnimation) ||
                  (window.CSSTransition && a instanceof CSSTransition);
        if (!css) a.cancel();
      });
    }
  }

  /* leaving the page / coming back (back button, bfcache, form restore) */
  window.addEventListener('pagehide', clean);
  window.addEventListener('pageshow', clean);
})();

/* ==========================================================
   CONTACT PAGE ENQUIRY FORM  -  add-on only
   Load AFTER script.js:  <script src="contact-update.js"></script>
   Your existing contact.html / script.js / style.css are not edited.

   What your script.js ALREADY does (kept as it is):
     - validates name, email, message and destination
     - on a valid submit shows "Packing your enquiry..." and opens 404.html
     - every visit / back-navigation starts with an empty form

   What this add-on ADDS:
     - Phone is now MANDATORY (it was optional) and the label is updated
     - Travel date is now MANDATORY too (set REQUIRE_DATE = false below
       if you want "Flexible" dates to stay allowed)
     - All missing / wrong fields are highlighted together, using your
       own error styling, before anything is sent
   ========================================================== */
(function () {
  'use strict';

  var REQUIRE_DATE = true;

  var f = document.getElementById('ctForm');
  if (!f) return;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var nameEl  = document.getElementById('ctName');
  var emailEl = document.getElementById('ctEmail');
  var phoneEl = document.getElementById('ctPhone');
  var msgEl   = document.getElementById('ctMsg');
  var dateEl  = document.getElementById('ctDate');
  var msg     = document.getElementById('ctFormMsg');
  var destFs  = $('.ct-fs', f);

  /* phone is no longer optional */
  var phoneLabel = $('label[for="ctPhone"]', f);
  if (phoneLabel) phoneLabel.textContent = 'Phone number';
  if (phoneEl) phoneEl.required = true;

  var group = function (key) { return f.querySelector('[data-field="' + key + '"]'); };

  /* the date group has no error line in the HTML - add one (no HTML edit) */
  var dateGrp = group('date');
  if (dateGrp && !$('.ct-err', dateGrp)) {
    var p = document.createElement('p');
    p.className = 'ct-err'; p.setAttribute('role', 'alert');
    dateGrp.appendChild(p);
  }

  function flag(node, text) {
    node.classList.add('bad');
    var e = $('.ct-err', node);
    if (e && text) e.textContent = text;
    node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake');
  }
  function clear(node) { if (node) node.classList.remove('bad', 'shake'); }

  if (dateEl) {
    var clearDate = function () { clear(dateGrp); };
    dateEl.addEventListener('input', clearDate);
    dateEl.addEventListener('change', clearDate);
  }

  /* capture phase on document: runs BEFORE the submit handler in script.js.
     If something is missing we stop here; if all is fine we step aside and
     your original code runs (animation + redirect to 404.html). */
  document.addEventListener('submit', function (e) {
    if (e.target !== f) return;

    var bad = [];

    if (!f.querySelector('input[name="dest"]:checked')) {
      var de = $('.ct-err', destFs);
      if (de) de.textContent = 'Please pick a destination to dream about.';
      bad.push([destFs]);
    }
    if (REQUIRE_DATE && dateEl && !dateEl.value) {
      bad.push([dateGrp, 'Please choose your preferred travel date.']);
    }
    if (nameEl.value.trim().length < 2) {
      bad.push([group('name'), 'Please tell us your name.']);
    }
    var em = emailEl.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      bad.push([group('email'), em ? 'That email does not look right.' : 'Please enter your email.']);
    }
    var ph = phoneEl.value.trim();
    if (!ph) {
      bad.push([group('phone'), 'Please enter your phone number.']);
    } else if (!/^\+?[\d\s()-]{8,18}$/.test(ph)) {
      bad.push([group('phone'), 'Use digits only, for example +91 98765 43210.']);
    }
    if (msgEl.value.trim().length < 10) {
      bad.push([group('msg'), 'Please share a few words about your trip (10+ characters).']);
    }

    if (!bad.length) return;               // all good -> original handler continues

    e.preventDefault();
    e.stopImmediatePropagation();

    Array.prototype.forEach.call(f.querySelectorAll('.bad'), function (n) { clear(n); });
    bad.forEach(function (b, i) { setTimeout(function () { flag(b[0], b[1]); }, i * 90); });
    if (msg) msg.textContent = 'Please fill in all the highlighted fields.';

    var first = bad[0][0];
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    first.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    var focusEl = $('input,textarea', first);
    if (focusEl && first !== destFs) setTimeout(function () { focusEl.focus({ preventScroll: true }); }, 350);
  }, true);
})();

/* ==========================================================
   CONTACT PAGE - CLICKABLE DAYS (Mon ... Sun)  -  add-on only
   Load AFTER script.js:  <script src="contact-days-update.js"></script>
   Your existing contact.html / script.js / style.css are not edited.

   Every day chip, Sunday included, can now be clicked / tapped (or
   focused and pressed Enter / Space). The clicked day is highlighted
   and the line below shows that day's opening hours.
   Click the same day again to go back to the normal text.
   ========================================================== */
(function () {
  'use strict';

  var list = document.getElementById('ctDays');
  if (!list) return;
  var hoursEl = document.querySelector('.ct-hours-t');
  var items = Array.prototype.slice.call(list.querySelectorAll('li'));
  if (!items.length) return;

  var NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var original = hoursEl ? hoursEl.innerHTML : '';

  /* styles for the picked chip (injected - no CSS file edit) */
  var st = document.createElement('style');
  st.textContent =
    '#ctDays li{cursor:pointer;user-select:none;-webkit-user-select:none}' +
    '#ctDays li:hover{background:rgba(var(--ocean-rgb),.08)}' +
    '#ctDays li.picked{background:var(--ocean);color:var(--sand);transform:translateY(-4px) scale(1.08);opacity:1}' +
    '#ctDays li.off.picked{text-decoration:line-through}' +
    '#ctDays.has-pick li.today:not(.picked){background:transparent;color:inherit;transform:none}' +
    '#ctDays li:focus-visible{outline:2px solid var(--sun);outline-offset:3px}';
  document.head.appendChild(st);

  function show(i) {
    if (!hoursEl) return;
    var isSun = i === 6;
    hoursEl.textContent = NAMES[i] + ' \u00B7 ' + (isSun ? 'Closed all day' : '9:00 AM - 7:00 PM');
  }

  function pick(li) {
    var was = li.classList.contains('picked');
    items.forEach(function (n) { n.classList.remove('picked'); n.setAttribute('aria-pressed', 'false'); });
    if (was) {                                   // second click = back to normal
      list.classList.remove('has-pick');
      if (hoursEl) hoursEl.innerHTML = original;
      return;
    }
    li.classList.add('picked');
    li.setAttribute('aria-pressed', 'true');
    list.classList.add('has-pick');
    show(+li.dataset.d);
  }

  items.forEach(function (li) {
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-pressed', 'false');
    li.addEventListener('click', function () { pick(li); });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(li); }
    });
  });
})();

/* ==========================================================================
   LINKS TO 404.html OPEN IN THE SAME TAB (add-on only)
   The WhatsApp links on contact.html have target="_blank", so they open a
   new tab. This removes it so they open in the same tab like every other
   link, and the "return to the same spot" logic above can work for them.
   Nothing above this block is edited.
   ========================================================================== */
(function () {
  'use strict';
  var fix = function (root) {
    (root || document).querySelectorAll('a[target="_blank"]').forEach(function (a) {
      if (/(^|\/)404(\.html)?([?#].*)?$/i.test(a.getAttribute('href') || '')) {
        a.removeAttribute('target');
        a.removeAttribute('rel');
      }
    });
  };
  fix();
  /* safety net: if a link is added or changed later, fix it just before it is opened */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[target="_blank"]');
    if (a) fix(a.parentNode);
  }, true);
})();