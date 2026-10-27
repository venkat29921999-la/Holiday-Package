/* ==========================================================
   Stackly Holidays - 404 page
   - "Back to home"       -> index.html
   - "Go to previous page" -> the page the visitor came from
   ========================================================== */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const RETURN_KEY = 'stackly:return';    // optional: page + section saved by a link/form, e.g. "contact.html#enquiry"
  const POS_KEY = 'stackly:pos';          // saved by script.js: the page + exact scroll position where the visitor clicked
  const RESTORE_KEY = 'stackly:restore';  // tells script.js which spot to scroll back to
  const HOME = 'index.html';

  const prevBtn = $('#goPrev');
  const homeBtn = $('#goHome');

  /* only allow plain relative links (no http:, javascript:, //evil.com) and never loop back to 404 */
  const isSafe = u => typeof u === 'string' && u.length < 300 &&
    !/^[a-z][a-z0-9+.-]*:/i.test(u) && !u.startsWith('//') && !/^\/?404(\.html)?([?#]|$)/i.test(u);

  const baseOf = u => String(u).split('#')[0].split('?')[0];
  const readStored = () => {
    try {
      const v = sessionStorage.getItem(RETURN_KEY);
      if (!isSafe(v)) return null;
      const ref = readReferrer();   // saved page must be the page we really came from, otherwise it is old data
      if (ref && baseOf(v) !== baseOf(pageOf(ref))) return null;
      return v;
    } catch (_) { return null; }
  };

  /* the page we came from, if it is on this same site and is not a 404 */
  const readReferrer = () => {
    try {
      if (!document.referrer) return null;
      const r = new URL(document.referrer);
      if (r.origin !== location.origin || /\/404(\.html)?$/i.test(r.pathname)) return null;
      return r;
    } catch (_) { return null; }
  };
  const pageOf = u => (u.pathname.split('/').pop() || 'index.html') + u.search;

  /* exact spot: page + scroll position saved just before the visitor left */
  const readPos = () => {
    try {
      const p = JSON.parse(sessionStorage.getItem(POS_KEY) || 'null');
      if (!p || !isSafe(p.url) || typeof p.y !== 'number' || Date.now() - p.t > 30 * 60 * 1000) return null;
      const ref = readReferrer();
      if (ref && pageOf(ref) !== p.url) return null;   // saved spot belongs to a different page - ignore it
      return p;
    } catch (_) { return null; }
  };

  const clearSaved = () => {
    try { sessionStorage.removeItem(RETURN_KEY); sessionStorage.removeItem(POS_KEY); } catch (_) { /* ignore */ }
  };

  /* decide where "previous page" goes:
     1) exact page + scroll spot  2) saved page/section  3) referrer page  4) browser history  5) home */
  const target = () => {
    const p = readPos();
    if (p) return { url: p.url, y: p.y };
    const s = readStored();
    if (s) return { url: s, y: null };
    const r = readReferrer();
    if (r) return { url: r.href, y: null };
    return null;
  };

  /* give the button a real href when we know it (works with right-click / open in new tab) */
  const known = target();
  if (known) prevBtn.setAttribute('href', known.url);

  prevBtn.addEventListener('click', e => {
    e.preventDefault();
    const t = target();
    clearSaved();
    if (t) {
      if (t.y !== null) {
        try { sessionStorage.setItem(RESTORE_KEY, JSON.stringify({ url: t.url, y: t.y, t: Date.now() })); } catch (_) { /* ignore */ }
      }
      location.href = t.url;
      return;
    }
    if (window.history.length > 1) { window.history.back(); return; }
    location.href = HOME;
  });

  homeBtn.addEventListener('click', clearSaved);

  /* if the browser restores this page from its back/forward cache, keep things fresh */
  window.addEventListener('pageshow', e => {
    if (!e.persisted) return;
    const t = target();
    if (t) prevBtn.setAttribute('href', t.url);
  });

  /* ---------- gentle parallax on the photo collage (mouse only) ---------- */
  const stage = $('#nfStage');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (stage && fine && !reduce) {
    let raf = 0, nx = 0, ny = 0;
    const apply = () => {
      raf = 0;
      stage.style.setProperty('--mx', nx.toFixed(3));
      stage.style.setProperty('--my', ny.toFixed(3));
    };
    window.addEventListener('mousemove', e => {
      nx = e.clientX / window.innerWidth - .5;
      ny = e.clientY / window.innerHeight - .5;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
  }

  /* if a photo is missing, the gradient behind it shows instead of a broken icon */
  document.querySelectorAll('.nf-card img, .nf-bg img').forEach(img => {
    img.addEventListener('error', () => { img.style.display = 'none'; });
  });
})();