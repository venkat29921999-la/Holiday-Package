/* ==========================================================================
   Stackly Holidays - auth + dashboards
   Pages: login.html · signup.html · admin-dashboard.html · user-dashboard.html
   Demo data lives in localStorage (no server). No alert()/confirm()/prompt() anywhere:
   feedback uses inline messages, toasts and an in-page modal.
   Demo accounts:  admin@stackly.com / Admin@123   ·   user@stackly.com / User@123
   ========================================================================== */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const body = document.body;
  const page = body.dataset.page;

  /* ---------- storage (falls back to memory if localStorage is blocked) ---------- */
  const mem = {};
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return k in mem ? mem[k] : d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { mem[k] = v; } },
    del(k) { try { localStorage.removeItem(k); } catch (_) { delete mem[k]; } }
  };
  const K = { users: 'stk_users', sess: 'stk_session', mail: e => 'stk_mail:' + e, trip: e => 'stk_trip:' + e };
  const DASH = { admin: 'admin-dashboard.html', user: 'user-dashboard.html' };

  async function sha(s) {
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
    }
    let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return 'x' + (h >>> 0).toString(16);
  }
  async function users() {
    let u = store.get(K.users, null);
    if (u && u.length) return u;
    const day = 864e5, now = Date.now(), demo = await sha('Demo@1234');
    u = [
      { name: 'Aarav Admin', email: 'admin@stackly.com', role: 'admin', pass: await sha('Admin@123'), joined: now - day * 120 },
      { name: 'Meera Traveller', email: 'user@stackly.com', role: 'user', pass: await sha('User@123'), joined: now - day * 40 },
      { name: 'Rahul Sharma', email: 'rahul@example.com', role: 'user', pass: demo, joined: now - day * 22 },
      { name: 'Sneha Pillai', email: 'sneha@example.com', role: 'user', pass: demo, joined: now - day * 9 },
      { name: 'Vikram Nair', email: 'vikram@example.com', role: 'user', pass: demo, joined: now - day * 3 }
    ];
    store.set(K.users, u); return u;
  }
  const session = () => store.get(K.sess, null);
  const go = url => { body.classList.add('leaving'); setTimeout(() => { location.href = url; }, 350); };
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const ini = n => (n || '?').trim().charAt(0).toUpperCase();

  /* ---------- toasts ---------- */
  function toast(text, opt = {}) {
    let box = $('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast ' + (opt.type || '');
    const i = document.createElement('i'); i.className = opt.icon || 'fa-solid fa-circle-check'; t.appendChild(i);
    const s = document.createElement('span'); s.textContent = text; t.appendChild(s);
    const kill = () => { t.classList.add('out'); setTimeout(() => t.remove(), 400); };
    if (opt.action) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-primary btn-sm'; b.style.marginLeft = 'auto'; b.textContent = opt.action.label; b.addEventListener('click', () => { opt.action.fn(); kill(); }); t.appendChild(b); }
    box.appendChild(t); setTimeout(kill, opt.ms || 4200);
  }

  /* ==========================================================================
     AUTH (login + signup)
     ========================================================================== */
  function authCommon() {
    const burger = $('#aBurger'), menu = $('#aMenu');
    if (burger) {
      const set = o => { menu.classList.toggle('open', o); burger.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); };
      burger.addEventListener('click', e => { e.stopPropagation(); set(!menu.classList.contains('open')); });
      document.addEventListener('click', e => { if (!menu.contains(e.target)) set(false); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    }
    $$('.eye').forEach(b => b.addEventListener('click', () => {
      const inp = $('input', b.parentNode), show = inp.type === 'password';
      inp.type = show ? 'text' : 'password'; $('i', b).className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'; b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    }));
    const sw = $('.role-switch');
    if (sw) $$('input', sw).forEach(r => r.addEventListener('change', () => { sw.dataset.role = r.value; }));
    $$('.fld input').forEach(i => i.addEventListener('input', () => { const f = i.closest('.fld'); f.classList.remove('bad'); }));
  }
  function msg(type, text) {
    const box = $('#aMsg'); if (!box) return;
    box.textContent = '';
    if (!text) return;
    const d = document.createElement('div'); d.className = 'a-msg ' + type; d.setAttribute('role', type === 'err' ? 'alert' : 'status');
    const i = document.createElement('i'); i.className = type === 'err' ? 'fa-solid fa-circle-exclamation' : type === 'ok' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-info';
    const s = document.createElement('span'); s.textContent = text; d.append(i, s); box.appendChild(d);
  }
  function bad(id, text) { const f = $('#' + id).closest('.fld'); const box = $('#aMsg'); if (box && !box.firstChild) msg('err', text); return f; } // show the error in the top message bar (no red field border / text under the field)
  function good(id) { const f = $('#' + id).closest('.fld'); f.classList.remove('bad'); }
  function busy(btn, on) { btn.classList.toggle('loading', on); btn.disabled = on; }
  const roleOf = () => { const r = $('input[name="role"]:checked'); return r ? r.value : 'user'; };

  function initLogin() {
    // login.html always opens as the login page (no auto-redirect to the dashboard)
    authCommon(); users();
    const qs = new URLSearchParams(location.search);
    if (qs.get('registered')) msg('ok', 'Account created. Please log in with your new details.');
    if (qs.get('out')) msg('info', 'You have been logged out safely.');
    const form = $('#loginForm'), btn = $('#loginBtn');
    $$('.demo button').forEach(b => b.addEventListener('click', () => {
      $('#lEmail').value = b.dataset.e; $('#lPass').value = b.dataset.p;
      const r = $('input[name="role"][value="' + b.dataset.r + '"]'); r.checked = true; $('.role-switch').dataset.role = b.dataset.r;
      $$('.fld').forEach(f => f.classList.remove('bad')); msg('', '');
    }));
    form.addEventListener('submit', async e => {
      e.preventDefault(); msg('', '');
      const email = $('#lEmail').value.trim().toLowerCase(), role = roleOf();
      busy(btn, true);
      const list = await users(), found = list.find(x => x.email === email);
      await new Promise(r => setTimeout(r, 650));
      // whatever is typed, log in and open the dashboard for the selected role (User / Admin)
      const mail = email || (role + '@stackly.com');
      const name = found ? found.name : mail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      store.set(K.sess, { email: mail, name: name, role: role, at: Date.now() });
      busy(btn, false); btn.classList.add('done'); $('.lbl', btn).textContent = 'Welcome back'; $('.lbl', btn).parentNode.querySelector('.spin').style.display = 'none';
      setTimeout(() => go(DASH[role]), 700);
    });
  }

  function strength(p) { let s = 0; if (p.length >= 8) s++; if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return p ? Math.max(1, s) : 0; }
  function initSignup() {
    const s = session(); if (s && DASH[s.role]) { location.replace(DASH[s.role]); return; }
    authCommon(); users();
    const form = $('#signForm'), btn = $('#signBtn'), meter = $('#meter'), mt = $('#meterT');
    const words = ['', 'Too weak', 'Getting there', 'Good', 'Strong'];
    $('#sPass').addEventListener('input', e => { const v = strength(e.target.value); meter.dataset.s = v; mt.textContent = e.target.value ? words[v] : ''; });
    form.addEventListener('submit', async e => {
      e.preventDefault(); msg('', '');
      const name = $('#sName').value.trim(), email = $('#sEmail').value.trim().toLowerCase(), pass = $('#sPass').value, conf = $('#sConf').value, role = roleOf();
      const empty = [['sName', name], ['sEmail', email], ['sPass', pass], ['sConf', conf]].find(x => !x[1]); // no validation messages, just focus the empty field
      if (empty) { $('#' + empty[0]).focus(); return; }
      busy(btn, true);
      const list = await users();
      await new Promise(r => setTimeout(r, 650));
      if (list.some(x => x.email === email)) { busy(btn, false); go('login.html'); return; } // email already registered: no message, just take them to the login page
      list.push({ name, email, role, pass: await sha(pass), joined: Date.now() }); store.set(K.users, list);
      busy(btn, false);
      const ov = document.createElement('div'); ov.className = 'a-done'; ov.setAttribute('role', 'status');
      ov.innerHTML = '<div><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="48"/><path d="M38 62l15 15 30-34"/></svg><h2>Account created</h2><p>Taking you to the login page…</p></div>';
      body.appendChild(ov);
      setTimeout(() => go('login.html?registered=1'), 1900);
    });
  }

  /* ==========================================================================
     DASHBOARDS (shared)
     ========================================================================== */
  function initDash() {
    const sess = session(), role = body.dataset.role;
    if (!sess) { location.replace('login.html'); return; }
    if (sess.role !== role) { location.replace(DASH[sess.role] || 'login.html'); return; }
    const titles = { overview: ['Welcome back', role === 'admin' ? 'Admin overview' : 'Your holiday hub'], mail: ['Inbox', 'Mailbox'], users: ['Manage', 'Travellers'], trips: ['Journeys', 'My trips'] };

    /* header / sidebar */
    $('#meName').textContent = sess.name; $('#meMail').textContent = sess.email; $('#meAv').textContent = ini(sess.name);
    $$('[data-name]').forEach(el => { el.textContent = sess.name.split(' ')[0]; });
    $('#logout').addEventListener('click', () => { store.del(K.sess); go('login.html?out=1'); });
    const setMenu = o => { body.classList.toggle('menu-open', o); $('#dBurger').classList.toggle('open', o); $('#dBurger').setAttribute('aria-expanded', o); body.classList.toggle('lock', o && innerWidth <= 1024); };
    $('#dBurger').addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
    $('#dScrim').addEventListener('click', () => setMenu(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); closeModal(); } });
    window.addEventListener('resize', () => { if (innerWidth > 1024) setMenu(false); });
    $$('.d-nav button').forEach((b, i) => b.style.setProperty('--i', i));

    function show(v, push) {
      if (!$('.d-view[data-view="' + v + '"]')) v = 'overview';
      $$('.d-view').forEach(s => s.classList.toggle('on', s.dataset.view === v));
      $$('.d-nav button').forEach(b => { const on = b.dataset.view === v; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
      $('#dSub').textContent = titles[v][0]; $('#dH').textContent = titles[v][1];
      if (push !== false) history.replaceState(null, '', '#' + v);
      setMenu(false); window.scrollTo({ top: 0 });
      if (v === 'overview') animateOverview();
    }
    $$('button[data-view]').forEach(b => b.addEventListener('click', () => show(b.dataset.view)));
    $('#dBell').addEventListener('click', () => { show('mail'); mail.setFolder('inbox'); });

    /* ---------- time ---------- */
    const ago = t => { const s = (Date.now() - t) / 1000; if (s < 60) return 'now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; if (s < 604800) return Math.floor(s / 86400) + 'd ago'; return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); };
    const fullDate = t => new Date(t).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    /* ---------- mailbox ---------- */
    const H = 36e5, key = K.mail(sess.email);
    const seed = () => {
      const n = Date.now();
      const a = role === 'admin' ? [
        ['Booking Desk', 'bookings@stacklyholidays.com', 'New enquiry: Maldives honeymoon for 2', 'Hi team,\nPriya and Rohan want a 6-night Maldives honeymoon in March with an overwater villa.\nBudget is flexible. Can someone send a quote by tomorrow?', 1],
        ['Finance', 'finance@stacklyholidays.com', 'October payouts are ready for approval', 'The supplier payout sheet for October is attached to the shared drive.\nPlease approve before Friday so partners are paid on time.', 3],
        ['Priya Menon', 'priya@example.com', 'Can I change my Kyoto travel dates?', 'Hello,\nI booked the Kyoto package for 12 November but need to move it one week later.\nPlease let me know if that is possible.', 7],
        ['Support', 'support@stacklyholidays.com', 'Weekly digest: 18 tickets closed, 3 open', 'Great week. Average first reply time dropped to 14 minutes.\nThree tickets are waiting on supplier confirmation.', 26],
        ['Partner Desk', 'partners@maldivesresorts.com', 'Updated rates for the winter season', 'Please find our refreshed winter rate card. New villas open in December.', 50],
        ['Marketing', 'marketing@stacklyholidays.com', 'Blog traffic is up 32% this month', 'The sunrise feature story drove most of the growth.\nLet us plan two more stories in the same style.', 74]
      ] : [
        ['Stackly Concierge', 'concierge@stacklyholidays.com', 'Your Santorini itinerary is ready', 'Hi,\nYour day-by-day Santorini itinerary is ready to review.\nWe have kept sunrise free for the caldera walk you asked about.', 1],
        ['Billing', 'billing@stacklyholidays.com', 'Payment received for Kyoto in the rain', 'Thank you. We received your second instalment.\nYour balance is due 30 days before departure.', 5],
        ['Visa Desk', 'visa@stacklyholidays.com', 'Documents needed for your Japan visa', 'Please upload a passport scan and a recent photograph.\nWe will handle the rest and keep you updated.', 20],
        ['Stackly Offers', 'offers@stacklyholidays.com', 'Members only: 15% off island getaways', 'Book any island package before the end of the month and save 15%.', 48],
        ['Maya Iyer', 'maya@stacklyholidays.com', 'Packing list for your desert camp', 'A few tips from our editor: layers for cold nights, a good headlamp and plenty of water.', 72]
      ];
      return a.map((m, i) => ({ id: 's' + i, from: m[0], fromEmail: m[1], subject: m[2], body: m[3], t: n - m[4] * H, folder: 'inbox', read: i > 2, star: i === 1 }));
    };
    let mails = store.get(key, null) || seed(); const save = () => store.set(key, mails);
    save();
    const mail = (() => {
      let folder = 'inbox', q = '', sel = null, fresh = null, undo = null;
      const items = $('#mItems'), pane = $('#mPane'), ph = $('#mPh'), rd = $('#mRead');
      const inFolder = m => folder === 'starred' ? m.star : m.folder === folder;
      const unread = () => mails.filter(m => m.folder === 'inbox' && !m.read).length;
      function counts() {
        const u = unread();
        $$('#mFold .f').forEach(b => { const f = b.dataset.f; const n = f === 'inbox' ? u : f === 'starred' ? mails.filter(m => m.star).length : mails.filter(m => m.folder === f).length; const c = $('.n', b); c.textContent = n || ''; });
        $$('.mcnt').forEach(c => { c.textContent = u || ''; });
        const b = $('#dBell b'); const prev = b.textContent; b.textContent = u || ''; if (prev !== String(u || '') && u) { b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); }
        const su = $('#stUnread'); if (su) su.textContent = u;
      }
      function row(m, i) {
        const li = document.createElement('div'); li.className = 'mi' + (m.read || m.folder !== 'inbox' ? '' : ' unread') + (m.id === sel ? ' sel' : '') + (m.id === fresh ? ' fresh' : '');
        li.style.setProperty('--i', Math.min(i, 12)); li.tabIndex = 0; li.setAttribute('role', 'button');
        const av = document.createElement('span'); av.className = 'av'; av.textContent = ini(m.from);
        const mid = document.createElement('div'); const b = document.createElement('b'); b.textContent = m.folder === 'sent' ? 'To: ' + (m.to || '') : m.from;
        const sj = document.createElement('span'); sj.className = 'sj'; sj.textContent = m.subject; const pv = document.createElement('span'); pv.className = 'pv'; pv.textContent = m.body.replace(/\n/g, ' ');
        mid.append(b, sj, pv);
        const meta = document.createElement('div'); meta.className = 'meta'; const tm = document.createElement('span'); tm.textContent = ago(m.t);
        const st = document.createElement('button'); st.type = 'button'; st.className = 'st' + (m.star ? ' on' : ''); st.setAttribute('aria-label', m.star ? 'Remove star' : 'Star'); st.innerHTML = '<i class="' + (m.star ? 'fa-solid' : 'fa-regular') + ' fa-star"></i>';
        st.addEventListener('click', e => { e.stopPropagation(); m.star = !m.star; save(); render(); if (sel === m.id) read(m); });
        meta.append(tm, st); li.append(av, mid, meta);
        const open = () => openMail(m.id); li.addEventListener('click', open); li.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
        return li;
      }
      function render() {
        counts();
        const list = mails.filter(inFolder).filter(m => !q || (m.subject + ' ' + m.from + ' ' + m.body + ' ' + (m.to || '')).toLowerCase().includes(q)).sort((a, b) => b.t - a.t);
        items.textContent = '';
        if (!list.length) { const e = document.createElement('div'); e.className = 'empty'; e.innerHTML = '<i class="fa-regular fa-envelope-open"></i>'; const p = document.createElement('p'); p.textContent = q ? 'No emails match your search.' : 'Nothing here yet.'; e.appendChild(p); items.appendChild(e); }
        list.forEach((m, i) => items.appendChild(row(m, i)));
        fresh = null; miniRender();
      }
      function read(m) {
        ph.hidden = true; rd.hidden = false; rd.textContent = '';
        rd.style.animation = 'none'; void rd.offsetWidth; rd.style.animation = '';
        const bar = document.createElement('div'); bar.className = 'm-bar';
        const mk = (cls, icon, label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ic ' + cls; b.setAttribute('aria-label', label); b.title = label; b.innerHTML = '<i class="' + icon + '"></i>'; b.addEventListener('click', fn); return b; };
        bar.append(mk('bk', 'fa-solid fa-arrow-left', 'Back to list', () => pane.classList.remove('open')), mk('', 'fa-solid fa-reply', 'Reply', () => openCompose({ to: m.folder === 'sent' ? m.to : m.fromEmail, subject: 'Re: ' + m.subject.replace(/^Re: /, '') })));
        const sp = document.createElement('span'); sp.className = 'sp'; bar.appendChild(sp);
        bar.append(mk(m.star ? 'on' : '', (m.star ? 'fa-solid' : 'fa-regular') + ' fa-star', 'Star', () => { m.star = !m.star; save(); render(); read(m); }),
          mk('', 'fa-regular fa-envelope', 'Mark as unread', () => { m.read = false; sel = null; save(); render(); ph.hidden = false; rd.hidden = true; pane.classList.remove('open'); toast('Marked as unread', { icon: 'fa-regular fa-envelope' }); }),
          mk('', 'fa-solid fa-box-archive', m.folder === 'archive' ? 'Move to inbox' : 'Archive', () => { m.folder = m.folder === 'archive' ? 'inbox' : 'archive'; save(); closeRead(); render(); toast(m.folder === 'archive' ? 'Archived' : 'Moved to inbox', { icon: 'fa-solid fa-box-archive' }); }),
          mk('rm', 'fa-regular fa-trash-can', 'Delete', () => remove(m)));
        const bd = document.createElement('div'); bd.className = 'm-body';
        const h = document.createElement('h2'); h.textContent = m.subject;
        const fr = document.createElement('div'); fr.className = 'm-from'; const av = document.createElement('span'); av.className = 'av'; av.textContent = ini(m.from);
        const who = document.createElement('div'); const nb = document.createElement('b'); nb.textContent = m.folder === 'sent' ? 'To: ' + m.to : m.from; const sm = document.createElement('small'); sm.textContent = (m.folder === 'sent' ? 'Sent by you' : m.fromEmail) + ' · ' + fullDate(m.t); who.append(nb, sm); fr.append(av, who);
        bd.append(h, fr); m.body.split('\n').forEach((t, i) => { const p = document.createElement('p'); p.style.setProperty('--i', i); p.textContent = t; bd.appendChild(p); });
        const rp = document.createElement('div'); rp.className = 'm-reply'; const rb = document.createElement('button'); rb.type = 'button'; rb.className = 'btn btn-dark btn-sm'; rb.innerHTML = '<i class="fa-solid fa-reply"></i><span>Quick reply</span>'; rb.addEventListener('click', () => openCompose({ to: m.folder === 'sent' ? m.to : m.fromEmail, subject: 'Re: ' + m.subject.replace(/^Re: /, '') })); rp.appendChild(rb);
        rd.append(bar, bd, rp);
      }
      function closeRead() { sel = null; ph.hidden = false; rd.hidden = true; pane.classList.remove('open'); }
      function openMail(id) {
        const m = mails.find(x => x.id === id); if (!m) return;
        sel = id; if (!m.read) { m.read = true; save(); }
        render(); read(m); pane.classList.add('open');
      }
      function remove(m) {
        const idx = mails.indexOf(m); mails.splice(idx, 1); save(); closeRead(); render();
        toast('Email deleted', { icon: 'fa-regular fa-trash-can', action: { label: 'Undo', fn: () => { mails.splice(idx, 0, m); save(); render(); } } });
      }
      function miniRender() {
        const box = $('#miniMail'); if (!box) return; box.textContent = '';
        const list = mails.filter(m => m.folder === 'inbox').sort((a, b) => b.t - a.t).slice(0, 4);
        if (!list.length) { box.innerHTML = '<li class="empty" style="display:block"><i class="fa-regular fa-envelope-open"></i>Inbox is clear</li>'; return; }
        list.forEach((m, i) => {
          const li = document.createElement('li'); li.style.setProperty('--i', i); li.tabIndex = 0;
          const av = document.createElement('span'); av.className = 'av'; av.textContent = ini(m.from);
          const d = document.createElement('div'); const b = document.createElement('b'); b.textContent = m.from + (m.read ? '' : ' •'); const sp = document.createElement('span'); sp.textContent = m.subject; d.append(b, sp);
          const t = document.createElement('time'); t.textContent = ago(m.t); li.append(av, d, t);
          const go2 = () => { show('mail'); setFolder('inbox'); openMail(m.id); }; li.addEventListener('click', go2); li.addEventListener('keydown', e => { if (e.key === 'Enter') go2(); });
          box.appendChild(li);
        });
      }
      function setFolder(f) { folder = f; closeRead(); $$('#mFold .f').forEach(b => b.classList.toggle('on', b.dataset.f === f)); render(); }
      $$('#mFold .f').forEach(b => b.addEventListener('click', () => setFolder(b.dataset.f)));
      $('#mSearch').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); render(); });
      function push(m) { mails.unshift(m); fresh = m.id; save(); render(); const b = $('#dBell b'); b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); }
      return { render, setFolder, push, add: m => { mails.unshift(m); save(); render(); } };
    })();
    mail.render();
    setInterval(() => $$('#mItems .mi .meta span:first-child').length && mail.render(), 60000);

    /* compose modal (in-page, no alert) */
    const cmp = $('#cmp');
    function closeModal() { cmp.hidden = true; body.classList.remove('lock'); }
    function openCompose(p = {}) {
      $('#cTo').value = p.to || ''; $('#cSub').value = p.subject || ''; $('#cBody').value = '';
      $$('.fld', cmp).forEach(f => f.classList.remove('bad')); $('#cErr').textContent = '';
      cmp.hidden = false; body.classList.add('lock'); setTimeout(() => $(p.to ? '#cBody' : '#cTo').focus(), 80);
    }
    $('#compose').addEventListener('click', () => openCompose());
    $$('[data-act="compose"]').forEach(b => b.addEventListener('click', () => openCompose()));
    $$('[data-close]', cmp).forEach(b => b.addEventListener('click', closeModal));
    cmp.addEventListener('click', e => { if (e.target === cmp) closeModal(); });
    $('#cForm').addEventListener('submit', e => {
      e.preventDefault();
      const to = $('#cTo').value.trim(), sub = $('#cSub').value.trim(), bd = $('#cBody').value.trim(), er = $('#cErr');
      $$('.fld', cmp).forEach(f => f.classList.remove('bad'));
      if (!emailOk(to)) { $('#cTo').closest('.fld').classList.add('bad'); er.textContent = 'Enter a valid recipient email.'; return; }
      if (!sub) { $('#cSub').closest('.fld').classList.add('bad'); er.textContent = 'Add a subject.'; return; }
      if (!bd) { er.textContent = 'Write a short message first.'; return; }
      mail.add({ id: 'c' + Date.now(), from: sess.name, fromEmail: sess.email, to, subject: sub, body: bd, t: Date.now(), folder: 'sent', read: true, star: false });
      $('#cTo').value = ''; $('#cSub').value = ''; $('#cBody').value = ''; er.textContent = '';
      closeModal(); rememberPage(); location.href = '404.html';
    });
    /* remember this dashboard page + open section so the 404 page can send the visitor back to it */
    function rememberPage() { try { const on = $('.d-view.on'), v = on ? (on.dataset.view || on.dataset.x || 'overview') : 'overview'; sessionStorage.setItem('stackly:return', (location.pathname.split('/').pop() || 'index.html') + '#' + v); sessionStorage.removeItem('stackly:pos'); } catch (e) {} }
    document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href="404.html"]'); if (a) rememberPage(); }, true);
    const live = role === 'admin'
      ? [['Rahul Sharma', 'rahul@example.com', 'Group booking for 8 people to Santorini', 'We are 8 friends planning a trip in May. Could you share a group quote?'], ['Booking Desk', 'bookings@stacklyholidays.com', 'Payment confirmed: Alps hut-to-hut package', 'A payment of ₹86,000 was confirmed for the Alps package.']]
      : [['Stackly Offers', 'offers@stacklyholidays.com', 'Flash fare: Maldives from ₹58,999', 'A limited window on island packages is open for 48 hours.'], ['Stackly Concierge', 'concierge@stacklyholidays.com', 'Your cab transfer is confirmed', 'Your airport pickup has been scheduled. The driver details arrive 24 hours before.']];
    let liveN = 0; const liveT = setInterval(() => { if (document.hidden) return; const m = live[liveN % live.length]; mail.push({ id: 'l' + Date.now(), from: m[0], fromEmail: m[1], subject: m[2], body: m[3], t: Date.now(), folder: 'inbox', read: false, star: false }); if (++liveN >= 4) clearInterval(liveT); }, 38000);

    /* ---------- overview animations ---------- */
    function countUp(el) {
      const to = +el.dataset.count, pre = el.dataset.pre || '', suf = el.dataset.suf || '', t0 = performance.now(), dur = 1300;
      const f = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = pre + Math.round(to * e).toLocaleString('en-IN') + suf; if (p < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    }
    function animateOverview() {
      $$('[data-count]').forEach(countUp);
      $$('.pbar i').forEach(i => { i.style.width = '0'; requestAnimationFrame(() => requestAnimationFrame(() => { i.style.width = i.dataset.w + '%'; })); });
      const c = $('#chart'); if (c) { c.textContent = ''; buildChart(); }
    }
    function buildChart() {
      const c = $('#chart'), l = $('#chartL'), vals = [42, 55, 48, 70, 82, 76, 94, 88, 65, 72, 90, 110], mo = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'], max = Math.max(...vals);
      l.textContent = '';
      vals.forEach((v, i) => { const b = document.createElement('div'); b.className = 'bar'; b.style.setProperty('--h', Math.round(v / max * 100) + '%'); b.style.setProperty('--k', i); b.dataset.v = v + ' bookings'; c.appendChild(b); const s = document.createElement('span'); s.textContent = mo[i]; l.appendChild(s); });
    }
    const feed = $('#feed');
    if (feed) {
      const acts = role === 'admin'
        ? [['New booking: Kyoto in the rain', '2 minutes ago'], ['Meera Traveller logged in', '14 minutes ago'], ['Payout approved for Maldives Resorts', '1 hour ago'], ['Blog post published: Sunrise guide', '3 hours ago'], ['Vikram Nair created an account', 'Yesterday']]
        : [['Itinerary updated for Santorini', 'Just now'], ['Payment received: ₹42,000', '2 days ago'], ['Visa documents requested', '3 days ago'], ['Added Lofoten to your wishlist', 'Last week']];
      acts.forEach((a, i) => { const li = document.createElement('li'); li.style.setProperty('--i', i); const d = document.createElement('span'); d.className = 'dot'; const x = document.createElement('div'); x.textContent = a[0]; const s = document.createElement('small'); s.textContent = a[1]; x.appendChild(s); li.append(d, x); feed.appendChild(li); });
    }

    /* ---------- user: countdown ---------- */
    const cd = $('#cd');
    if (cd) {
      let target = store.get(K.trip(sess.email), null); if (!target) { target = Date.now() + 47 * 864e5 + 5 * H; store.set(K.trip(sess.email), target); }
      const tick = () => { let s = Math.max(0, Math.floor((target - Date.now()) / 1000)); const v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60]; $$('b', cd).forEach((b, i) => { b.textContent = String(v[i]).padStart(2, '0'); }); };
      tick(); setInterval(tick, 1000);
    }

    /* ---------- admin: users table ---------- */
    const tbl = $('#userTbl');
    async function renderUsers() {
      if (!tbl) return; const list = (await users()).slice().sort((a, b) => b.joined - a.joined);
      tbl.textContent = '';
      const th = document.createElement('div'); th.className = 'tr th'; ['Name', 'Email', 'Role', 'Joined', ''].forEach(t => { const s = document.createElement('span'); s.textContent = t; th.appendChild(s); }); tbl.appendChild(th);
      list.forEach((u, i) => {
        const r = document.createElement('div'); r.className = 'tr'; r.style.setProperty('--i', i);
        const nm = document.createElement('div'); nm.className = 'nm'; const av = document.createElement('span'); av.className = 'av'; av.textContent = ini(u.name); const n = document.createElement('span'); n.textContent = u.name; nm.append(av, n);
        const em = document.createElement('span'); em.className = 'em'; em.textContent = u.email;
        const rl = document.createElement('span'); rl.className = 'rl'; const p = document.createElement('span'); p.className = 'pill ' + u.role; p.textContent = u.role === 'admin' ? 'Admin' : 'User'; rl.appendChild(p);
        const jd = document.createElement('span'); jd.className = 'jd'; jd.textContent = new Date(u.joined).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
        const del = document.createElement('button'); del.type = 'button'; del.className = 'del'; del.textContent = 'Remove'; if (u.email === sess.email) { del.disabled = true; del.title = 'You cannot remove yourself'; }
        let t; del.addEventListener('click', async () => {
          if (!del.classList.contains('sure')) { del.classList.add('sure'); del.textContent = 'Sure?'; t = setTimeout(() => { del.classList.remove('sure'); del.textContent = 'Remove'; }, 2800); return; }
          clearTimeout(t); store.set(K.users, (await users()).filter(x => x.email !== u.email)); store.del(K.mail(u.email)); toast(u.name + ' was removed', { icon: 'fa-regular fa-trash-can' }); renderUsers();
        });
        r.append(nm, em, rl, jd, del); tbl.appendChild(r);
      });
      const su = $('#stUsers'); if (su) { su.dataset.count = list.length; su.textContent = list.length; }
    }
    renderUsers();

    show((location.hash || '#overview').slice(1), false);
    { const hx = (location.hash || '').slice(1), xb = hx && $('.d-nav button[data-x="' + hx + '"]'); if (xb) { const go = () => setTimeout(() => xb.click(), 0); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go(); } }
  }

  /* ---------- boot ---------- */
  if (page === 'login') initLogin();
  else if (page === 'signup') initSignup();
  else if (page === 'dash') initDash();
})();

/* ==========================================================
   "FORGOT PASSWORD?"  ->  404.html   (add-on only)
   Load AFTER auth.js on login.html:
       <script src="auth.js"></script>
       <script src="login-forgot.js"></script>
   (Optional) also load it after script.js on the other pages so the
   "Forgot password?" link inside the old pop-up goes to 404.html too.
   Your existing login.html / auth.js / auth.css are not edited.

   - login.html has no forgot-password link yet, so this adds one
     under the password box, right-aligned, in your colours.
   - Any link/button with class "forgot" (the pop-up version) is sent
     to 404.html as well.
   ========================================================== */
(function () {
  'use strict';
  var TARGET = '404.html';

  /* 1. add the link on login.html (under the password field) */
  var form = document.getElementById('loginForm');
  if (form && !form.querySelector('.a-forgot')) {
    var pass = document.getElementById('lPass');
    var fld = pass && pass.closest ? pass.closest('.fld') : null;

    var st = document.createElement('style');
    st.textContent =
      '.a-forgot-row{display:flex;justify-content:flex-end;margin:-4px 2px 2px}' +
      '.a-forgot{font-size:.9rem;font-weight:500;color:var(--sun,#ff6b3d);' +
      'text-decoration:underline;text-underline-offset:3px;transition:opacity .3s}' +
      '.a-forgot:hover{opacity:.75}';
    document.head.appendChild(st);

    var row = document.createElement('div');
    row.className = 'a-forgot-row';
    var a = document.createElement('a');
    a.className = 'a-forgot';
    a.href = TARGET;
    a.textContent = 'Forgot password?';
    row.appendChild(a);

    if (fld && fld.parentNode) fld.parentNode.insertBefore(row, fld.nextSibling);
    else form.appendChild(row);
  }

  /* 2. every "forgot" link (added one or the pop-up one) opens 404.html */
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('.a-forgot, .forgot');
    if (!el) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    window.location.href = TARGET;
  }, true);
})();

/* ==========================================================
   DASHBOARD: RETURN TO THE EXACT SPOT (add-on only)
   When a dashboard button/link opens 404.html (e.g. "Message your
   designer", "Contact support") the scroll position is remembered, and
   when the visitor comes back they land on the same page, the same
   section and the same scroll position, right at that button.
   Nothing above this block is edited.
   ========================================================== */
(function () {
  'use strict';
  if (!document.body || document.body.dataset.page !== 'dash') return;
  var KEY = 'stackly:dpos';
  var page = function () { return location.pathname.split('/').pop() || 'index.html'; };
  var view = function () { var on = document.querySelector('.d-view.on'); return on ? (on.dataset.view || on.dataset.x || 'overview') : 'overview'; };
  var yNow = function () { return Math.round(window.scrollY || document.documentElement.scrollTop || 0); };
  var save = function () { try { sessionStorage.setItem(KEY, JSON.stringify({ p: page(), v: view(), y: yNow(), t: Date.now() })); } catch (e) {} };

  /* save the spot when a link to 404.html is clicked */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="404.html"]');
    if (a) save();
  }, true);
  /* also when the dashboard itself redirects to 404.html (e.g. after sending a message) */
  window.addEventListener('pagehide', function () {
    try { var r = sessionStorage.getItem('stackly:return'); if (r && r.split('#')[0] === page()) save(); } catch (e) {}
  });

  /* coming back: scroll to the saved spot */
  var r = null;
  try { r = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { r = null; }
  if (!r || r.p !== page() || typeof r.y !== 'number' || Date.now() - r.t > 10 * 60 * 1000) return;
  var h = (location.hash || '').slice(1);
  if (h && r.v && h !== r.v) return;
  try { sessionStorage.removeItem(KEY); } catch (e) {}
  try { history.scrollRestoration = 'manual'; } catch (e) {}

  var touched = false; /* stop helping as soon as the visitor scrolls */
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { window.addEventListener(ev, function () { touched = true; }, { passive: true, once: true }); });
  var go = function () { if (!touched && Math.abs(yNow() - r.y) > 2) window.scrollTo({ top: r.y, left: 0, behavior: 'instant' }); };
  [0, 100, 300, 600, 1000, 1600, 2600, 4000].forEach(function (ms) { setTimeout(go, ms); });
  window.addEventListener('load', function () { setTimeout(go, 50); });
})();


/* ==========================================================
   DASHBOARD: "Message your designer" -> 404.html (add-on only)
   Opens 404.html instead of the compose box, remembers the page,
   section and scroll position so "Go to previous page" brings the
   visitor back to the same button. Nothing above is edited.
   ========================================================== */
(function () {
  'use strict';
  if (!document.body || document.body.dataset.page !== 'dash') return;
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('a, button');
    if (!el || !/message\s+your\s+designer/i.test(el.textContent || '')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try {
      var pg = location.pathname.split('/').pop() || 'index.html';
      var on = document.querySelector('.d-view.on');
      var v = on ? (on.dataset.view || on.dataset.x || 'overview') : 'overview';
      sessionStorage.setItem('stackly:return', pg + '#' + v);
      sessionStorage.removeItem('stackly:pos');
      sessionStorage.setItem('stackly:dpos', JSON.stringify({ p: pg, v: v, y: Math.round(window.scrollY || document.documentElement.scrollTop || 0), t: Date.now() }));
    } catch (err) {}
    window.location.href = '404.html';
  }, true);
})();