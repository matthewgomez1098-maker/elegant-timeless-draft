/* Elegant & Timeless — site behaviour. No dependencies. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, body = d.body;
  root.classList.add('js');
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var json = function (id) { var n = d.getElementById(id); try { return n ? JSON.parse(n.textContent) : null; } catch (e) { return null; } };
  var INV = json('inv-data') || {}, S = json('i18n') || {};
  var lang = root.lang || 'en';

  /* ---------- header: sits under the draft bar, turns solid on scroll */
  var hd = $('#hd'), bar = $('.draftbar');
  function onScroll() {
    var y = window.scrollY || 0, bh = bar ? bar.offsetHeight : 0;
    root.style.setProperty('--barh', Math.max(0, bh - y) + 'px');
    if (hd) hd.classList.toggle('solid', y > 40 || !$('.hero, .phero'));
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onScroll);
  if (bar && 'ResizeObserver' in window) new ResizeObserver(onScroll).observe(bar);   // the bar re-wraps when fonts load

  /* ---------- land on #anchors reliably (reveal animations shift layout) */
  window.addEventListener('load', function () {
    var h = location.hash && d.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (h) setTimeout(function () { h.scrollIntoView({ block: 'start' }); }, 60);
  });

  /* ---------- hero entrance once the hero image is ready */
  var heroImg = $('.hero-media img');
  function ready() { body.classList.add('ready'); }
  if (heroImg && !heroImg.complete) { heroImg.addEventListener('load', ready); setTimeout(ready, 1800); } else { requestAnimationFrame(ready); }

  /* ---------- hero video: play the clips one after another, forever */
  (function () {
    var box = $('[data-hero-vids]');
    if (!box) return;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saver = navigator.connection && navigator.connection.saveData;
    if (still || saver) return;                       // the photo stays
    var vids = $$('video', box), cur = -1;
    function load(v) { if (!v.getAttribute('src')) { v.src = v.getAttribute('data-src'); v.load(); } }
    function show(i) {
      var v = vids[i];
      load(v);
      var go = function () {
        v.currentTime = 0;
        var pr = v.play();
        if (pr && pr.catch) pr.catch(function () {});
        vids.forEach(function (o) { o.classList.toggle('on', o === v); });
        cur = i;
        load(vids[(i + 1) % vids.length]);            // warm up the next clip
      };
      if (v.readyState >= 3) go(); else v.addEventListener('canplay', go, { once: true });
    }
    vids.forEach(function (v, i) { v.addEventListener('ended', function () { if (i === cur) show((i + 1) % vids.length); }); });
    show(0);
  })();

  /* ---------- mobile menu */
  var burger = $('.burger'), mnav = $('#mnav');
  function menu(open) {
    if (!mnav) return;
    burger.setAttribute('aria-expanded', open);
    body.classList.toggle('menu-open', open);
    if (open) { mnav.hidden = false; requestAnimationFrame(function () { mnav.classList.add('open'); }); }
    else { mnav.classList.remove('open'); setTimeout(function () { mnav.hidden = true; }, 350); }
  }
  if (burger) burger.addEventListener('click', function () { menu(burger.getAttribute('aria-expanded') !== 'true'); });
  if (mnav) mnav.addEventListener('click', function (e) { if (e.target.closest('a')) menu(false); });

  /* ---------- reveal on scroll */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.rv').forEach(function (el, i) {
      var sib = el.parentElement ? $$(':scope > .rv', el.parentElement).indexOf(el) : 0;
      el.style.transitionDelay = Math.min(sib, 6) * 80 + 'ms';
      io.observe(el);
    });
  } else { $$('.rv').forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- quote list (localStorage) */
  var KEY = 'et-quote-v1';
  var Q = {};
  try { Q = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { Q = {}; }
  Object.keys(Q).forEach(function (k) { if (!INV[k]) delete Q[k]; });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(Q)); } catch (e) {} render(); }
  function money(v) {
    return '$' + v.toLocaleString(lang === 'es' ? 'es-US' : 'en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function count() { return Object.keys(Q).reduce(function (a, k) { return a + Q[k]; }, 0); }

  function render() {
    var n = Object.keys(Q).length;
    body.classList.toggle('has-q', n > 0);
    $$('[data-qcount]').forEach(function (el) { el.textContent = n; });
    var list = $('[data-qlist]'), total = 0;
    if (list) {
      if (!n) list.innerHTML = '<p class="none">' + S.q_empty + '</p>';
      else list.innerHTML = Object.keys(Q).map(function (k) {
        var it = INV[k], q = Q[k];
        if (it.p != null) total += it.p * q;
        return '<div class="qi" data-k="' + k + '"><img src="' + it.i + '" alt="" loading="lazy" width="64" height="80">' +
          '<div><h4>' + esc(it.n) + '</h4><small>' + (it.p != null ? money(it.p) + ' ' + esc(it.u) : esc(S.inv_quote_only)) + '</small></div>' +
          '<div class="qty"><button type="button" data-qs="-1" aria-label="-">−</button><input type="number" min="1" value="' + q + '" aria-label="qty"><button type="button" data-qs="1" aria-label="+">+</button></div>' +
          '<button type="button" class="rm" data-rm>' + S.q_remove + '</button></div>';
      }).join('');
      var tEl = $('[data-qtotal]'); if (tEl) tEl.textContent = money(total);
    }
    var fl = $('[data-flist]');
    if (fl) {
      fl.innerHTML = n ? '<ul>' + Object.keys(Q).map(function (k) {
        return '<li><span>' + esc(INV[k].n) + '</span><span>× ' + Q[k] + '</span></li>';
      }).join('') + '</ul>' : '<p>' + S.c_list_empty + '</p>';
    }
    $$('[data-add]').forEach(function (b) {
      var on = !!Q[b.getAttribute('data-add')];
      b.classList.toggle('done', on);
      var s = b.querySelector('span'); if (s) s.textContent = on ? S.inv_added : S.inv_add;
    });
  }

  var drawer = $('#quote'), lastFocus = null;
  function openQ(open) {
    if (!drawer) return;
    if (open) lastFocus = d.activeElement;
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', !open);
    body.classList.toggle('drawer-open', open);
    if (open) setTimeout(function () { $('.drawer-panel', drawer).focus(); }, 60);
    else if (lastFocus) lastFocus.focus();
  }
  d.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('[data-open-quote]')) { e.preventDefault(); menu(false); openQ(true); return; }
    if (t.closest('[data-close-quote]')) { openQ(false); return; }
    if (t.closest('[data-qclear]')) { Q = {}; save(); return; }
    var qi = t.closest('.qi');
    if (qi) {
      var k = qi.getAttribute('data-k');
      if (t.closest('[data-rm]')) { delete Q[k]; save(); return; }
      var st = t.closest('[data-qs]');
      if (st) { Q[k] = Math.max(1, (Q[k] || 1) + +st.getAttribute('data-qs')); save(); return; }
    }
    // inventory stepper
    var step = t.closest('[data-step]');
    if (step) {
      var inp = step.parentNode.querySelector('input');
      inp.value = Math.max(1, (+inp.value || 1) + +step.getAttribute('data-step'));
      return;
    }
    var add = t.closest('[data-add]');
    if (add) {
      var key = add.getAttribute('data-add'), card = add.closest('.item, .pd');
      var v = Math.max(1, +(card && card.querySelector('.qty input') || {}).value || 1);
      Q[key] = v; save();
      var qb = $('.qbtn'); if (qb && qb.animate) qb.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' });
    }
  });
  d.addEventListener('change', function (e) {
    var qi = e.target.closest('.qi');
    if (qi && e.target.matches('input')) { Q[qi.getAttribute('data-k')] = Math.max(1, Math.round(+e.target.value) || 1); save(); }
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { openQ(false); menu(false); lbClose(); }
    if (lb && !lb.hidden) { if (e.key === 'ArrowRight') lbGo(1); if (e.key === 'ArrowLeft') lbGo(-1); }
  });
  render();

  /* ---------- inventory filters + search */
  var chips = $$('.tbar .chip'), sInput = $('[data-search-input]');
  function filter() {
    var on = $('.tbar .chip.on'), cat = on ? on.getAttribute('data-cat') : 'all';
    var q = (sInput ? sInput.value : '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    var any = false;
    $$('.igroup').forEach(function (g) {
      var vis = 0;
      $$('.item', g).forEach(function (it) {
        var hay = it.getAttribute('data-search').normalize('NFD').replace(/[̀-ͯ]/g, '');
        var ok = (cat === 'all' || it.getAttribute('data-cat') === cat) && (!q || q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; }));
        it.hidden = !ok; if (ok) vis++;
      });
      g.hidden = !vis; if (vis) any = true;
    });
    var em = $('[data-empty]'); if (em) em.hidden = any;
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.classList.toggle('on', x === c); });
      filter();
      var inv = $('.inv'); if (inv && window.scrollY > inv.offsetTop) window.scrollTo({ top: inv.offsetTop - 140, behavior: 'smooth' });
    });
  });
  if (sInput) sInput.addEventListener('input', filter);
  // arriving with #seating etc. selects that chip
  if (chips.length && location.hash) {
    var hc = $('.tbar .chip[data-cat="' + location.hash.slice(1) + '"]');
    if (hc) { chips.forEach(function (x) { x.classList.toggle('on', x === hc); }); filter(); }
  }

  /* ---------- gallery filter + lightbox */
  var gchips = $$('[data-gcat].chip');
  function gfilter(cat) {
    gchips.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-gcat') === cat); });
    $$('.gi').forEach(function (g) { g.classList.toggle('hide', cat !== 'all' && g.getAttribute('data-gcat') !== cat); });
  }
  gchips.forEach(function (c) { c.addEventListener('click', function () { gfilter(c.getAttribute('data-gcat')); }); });
  if (gchips.length && location.hash) { var gh = location.hash.slice(1); if ($('.chip[data-gcat="' + gh + '"]')) gfilter(gh); }

  var lb = $('#lb'), GAL = json('lb-data') || [], LB = GAL, li = 0, lbSet = false;
  function lbShow(i) {
    li = (i + LB.length) % LB.length;
    var im = $('img', lb); im.src = LB[li].src; im.alt = LB[li].cap;
    $('figcaption', lb).textContent = LB[li].cap;
  }
  function lbGo(s) { if (lbSet) { lbShow(li + s); return; } var vis = $$('.gi:not(.hide) [data-lb]').map(function (b) { return +b.getAttribute('data-lb'); });
    var p = vis.indexOf(li); lbShow(vis[(p + s + vis.length) % vis.length]); }
  function lbClose() { if (lb && !lb.hidden) { lb.hidden = true; body.classList.remove('drawer-open'); } }
  if (lb) {
    $$('[data-lb]').forEach(function (b) { b.addEventListener('click', function () { LB = GAL; lbSet = false; lbShow(+b.getAttribute('data-lb')); lb.hidden = false; body.classList.add('drawer-open'); $('.lb-x', lb).focus(); }); });
    lb.addEventListener('click', function (e) {
      if (e.target.closest('[data-lb-close]') || e.target === lb) lbClose();
      var st = e.target.closest('[data-lb-step]'); if (st) lbGo(+st.getAttribute('data-lb-step'));
    });
  }

  /* ---------- inventory carousels: 3 photos per item */
  $$('[data-car]').forEach(function (car) {
    var tr = $('.car-t', car), dots = $$('.car-d i', car), cnt = $('.car-c', car), n = dots.length, cur = 0;
    var wrap = car.closest('.pd-gal'), thumbs = wrap ? $$('[data-go]', wrap) : [];
    thumbs.forEach(function (th, k) { th.addEventListener('click', function () { tr.scrollTo({ left: k * tr.clientWidth }); }); });
    tr.addEventListener('scroll', function () {
      var i = Math.round(tr.scrollLeft / tr.clientWidth);
      if (i !== cur) { cur = i; dots.forEach(function (dt, j) { dt.classList.toggle('on', j === i); }); cnt.textContent = (i + 1) + ' / ' + n; thumbs.forEach(function (th, k) { th.classList.toggle('on', k === i); }); }
    }, { passive: true });
    car.addEventListener('click', function (ev) {
      var st = ev.target.closest('[data-car-step]');
      if (st) { var nx = (cur + +st.getAttribute('data-car-step') + n) % n; tr.scrollTo({ left: nx * tr.clientWidth }); return; }
      var z = ev.target.closest('[data-zoom]');
      if (z && lb) {
        try { LB = JSON.parse(car.getAttribute('data-set')); } catch (er) { return; }
        lbSet = true; lbShow(+z.getAttribute('data-zoom')); lb.hidden = false; body.classList.add('drawer-open'); $('.lb-x', lb).focus();
      }
    });
  });

  /* ---------- quote request: total the order, email the owner an English receipt, confirm to the customer */
  var form = $('[data-form]');
  if (form) {
    var usd = function (v) { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var val = function (n) { var f = form.elements[n]; return f && typeof f.value === 'string' ? f.value.trim() : ''; };
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };

    function buildOrder() {
      var now = new Date();
      var id = 'ET-' + String(now.getFullYear()).slice(2) + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + Math.floor(1000 + Math.random() * 9000);
      var lines = Object.keys(Q).map(function (k) {
        var it = INV[k];
        return { en: it.en || it.n, local: it.n, cat: it.c || 'Other', unit: it.ue || it.u, lunit: it.u, price: it.p, qty: Q[k], total: it.p != null ? it.p * Q[k] : null };
      });
      var d = val('date'), dateTxt = d, dateShort = d;
      if (d) { var p = d.split('-'), dd = new Date(+p[0], +p[1] - 1, +p[2]);
        dateTxt = dd.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        dateShort = dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
      var setup = (form.querySelector('input[name=setup]:checked') || {}).value;
      return {
        id: id, when: now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        name: val('name'), email: val('email'), phone: val('phone'), date: dateTxt, dateShort: dateShort, type: val('type'), guests: val('guests'), venue: val('venue'),
        setup: { yes: 'Yes, setup and teardown requested', no: 'No, delivery only', unsure: 'Not sure yet' }[setup] || 'Not answered',
        notes: val('msg'), lines: lines,
        subtotal: lines.reduce(function (a, l) { return a + (l.total || 0); }, 0),
        pieces: lines.reduce(function (a, l) { return a + l.qty; }, 0),
        unpriced: lines.filter(function (l) { return l.total == null; }).length,
        lang: lang === 'es' ? 'Spanish' : 'English'
      };
    }

    /* The owner's receipt: always English, one field per row so it reads as a table in the email. */
    function receipt(o) {
      var f = {}, none = '(not given)';
      // The subject doubles as the text-message alert (a text shows the subject first), so it carries the essentials.
      f._subject = 'New order ' + o.id + ': ' + o.name + ', ' + (o.dateShort || 'no date') + ', ' + o.pieces + ' pieces, est ' + usd(o.subtotal) + (o.phone ? ', ' + o.phone : '');
      f._template = 'table'; f._captcha = 'false';
      var cc = form.getAttribute('data-cc'); if (cc) f._cc = cc;
      f['Order number'] = o.id;
      f['Submitted'] = o.when;
      f.name = o.name; f.email = o.email;
      f['Phone'] = o.phone || none;
      f['Event date'] = o.date || none;
      f['Event type'] = o.type || none;
      f['Guest count'] = o.guests || none;
      f['Venue or city'] = o.venue || none;
      f['Setup and teardown'] = o.setup;
      f['Items requested'] = o.lines.length ? o.lines.length + ' line(s), ' + o.pieces + ' piece(s)' : 'None selected. See the customer notes.';
      o.lines.forEach(function (l, i) {
        f['Item ' + pad(i + 1)] = l.qty + ' x ' + l.en + (l.price != null
          ? ' @ ' + usd(l.price) + ' ' + l.unit + ' = ' + usd(l.total)
          : ' (custom quote: price to be confirmed)');
      });
      f['Estimated subtotal'] = usd(o.subtotal) + (o.unpriced ? ' plus ' + o.unpriced + ' item(s) to be quoted' : '');
      f['Not included'] = 'Delivery, setup and tax';
      var groups = {};
      o.lines.forEach(function (l) { (groups[l.cat] = groups[l.cat] || []).push(l.qty + ' x ' + l.en); });
      Object.keys(groups).forEach(function (g) { f['To prepare: ' + g] = groups[g].join('; '); });
      f['Customer notes'] = o.notes || '(none)';
      f['Site language used'] = o.lang;
      return f;
    }

    function confirmation(o) {
      var rows = o.lines.map(function (l) {
        return '<tr><td>' + l.qty + ' ×</td><td>' + esc(l.local) + '<small>' + (l.price != null ? money(l.price) + ' ' + esc(l.lunit) : esc(S.inv_quote_only)) + '</small></td><td>' +
          (l.total != null ? money(l.total) : '—') + '</td></tr>';
      }).join('');
      var card = d.createElement('div');
      card.className = 'done-card'; card.setAttribute('role', 'status'); card.tabIndex = -1;
      card.innerHTML = '<p class="eyebrow">' + esc(S.o_order) + ' ' + esc(o.id) + '</p><h2 class="h2">' + esc(S.o_title) + '</h2><p>' + esc(S.o_body) + '</p>' +
        (rows ? '<table class="rc"><tbody>' + rows + '</tbody></table><p class="rc-total"><span>' + esc(S.q_est) + '</span><b>' + money(o.subtotal) + '</b></p><p class="fine">' + esc(S.q_fine) + '</p>'
              : '<p class="fine">' + esc(S.o_none) + '</p>') +
        '<div class="btns"><button type="button" class="btn btn-dark" data-print>' + esc(S.o_print) + '</button><a class="btn btn-line" href="' + form.getAttribute('data-inventory') + '">' + esc(S.o_back) + '</a></div>';
      form.parentNode.replaceChild(card, form);
      $('[data-print]', card).addEventListener('click', function () { window.print(); });
      card.scrollIntoView({ block: 'start' }); card.focus({ preventScroll: true });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = $$('[required]', form).filter(function (f) { var ok = f.value.trim() && f.checkValidity(); f.classList.toggle('bad', !ok); return !ok; });
      if (bad.length) { bad[0].focus(); return; }
      var msg = $('[data-form-msg]'), btn = form.querySelector('button[type=submit]'), endpoint = form.getAttribute('data-endpoint');
      if (form.elements._honey && form.elements._honey.value) return;          // bots fill hidden fields
      if (!endpoint) { msg.hidden = false; msg.textContent = S.c_preview; return; }
      var order = buildOrder();
      btn.disabled = true; btn.textContent = S.o_sending; msg.hidden = true;
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(receipt(order)) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (String(res.success) !== 'true') throw new Error(res.message || 'not sent');
          Q = {}; save();
          confirmation(order);
        })
        .catch(function (err) {
          btn.disabled = false; btn.textContent = S.c_send;
          msg.hidden = false; msg.textContent = S.o_fail;
          if (window.console) console.warn('Quote request not sent:', err && err.message);
        });
    });
    form.addEventListener('input', function (e) { if (e.target.classList.contains('bad') && e.target.value.trim()) e.target.classList.remove('bad'); });
    window.__etOrder = { build: buildOrder, receipt: receipt };                  // lets the receipt be inspected while testing
  }
})();
