/* ═══════════════════════════════════════════════════════════════
   TACOS RÁPIDOS Y SABROSOS — Interacción y movimiento
   Lenis (scroll suave, opcional) + animaciones propias sin dependencias
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  /* ── Utilidades ─────────────────────────────────────────────── */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const PHONE = '524794615672';

  let lenis = null;
  let pageReady = false;
  const sig = { dirty: true }; // fuerza un repintado de los efectos ligados al scroll

  const safe = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } },
  };

  /* ── Partículas de brasa (canvas) ───────────────────────────── */
  function createEmbers(canvas, opt = {}) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const cfg = Object.assign({ density: 1 / 9000, max: 90, min: 26, interactive: false }, opt);
    const pointer = { x: -999, y: -999 };
    let w = 0, h = 0, dpr = 1, list = [], raf = 0, running = false, last = 0;
    let inView = true;

    const spawn = (p, initial) => {
      p.x = Math.random() * w;
      p.y = initial ? Math.random() * h : h + 8 + Math.random() * 50;
      p.r = 0.6 + Math.random() * 2.1;
      p.vy = 16 + Math.random() * 46;
      p.vx = (Math.random() - 0.5) * 14;
      p.ph = Math.random() * 6.28;
      p.sp = 0.6 + Math.random() * 1.8;
      p.hue = 22 + Math.random() * 40;
      p.a = 0.35 + Math.random() * 0.65;
      return p;
    };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = clamp(Math.round(w * h * cfg.density), cfg.min, cfg.max);
      list = Array.from({ length: n }, () => spawn({}, true));
    }

    function draw(t, dt) {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of list) {
        p.y -= p.vy * dt;
        p.x += (p.vx + Math.sin(t * p.sp + p.ph) * 12) * dt;
        if (cfg.interactive) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
          if (d2 < 16900 && d2 > 1) {
            const d = Math.sqrt(d2), f = (1 - d / 130) * 90 * dt;
            p.x += (dx / d) * f; p.y += (dy / d) * f;
          }
        }
        if (p.y < -10 || p.x < -20 || p.x > w + 20) spawn(p, false);
        const life = clamp(p.y / h, 0, 1);
        const a = p.a * (0.55 + 0.45 * Math.sin(t * p.sp * 2 + p.ph)) * (0.2 + 0.8 * life);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 58%, ${a * 0.14})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.4, 0, 6.2832); ctx.fill();
        ctx.fillStyle = `hsla(${p.hue + 6}, 100%, 66%, ${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
    }

    function loop(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(now / 1000, dt);
      raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running) return;
      if (reduce) { resize(); draw(0, 0); return; }
      running = true; last = performance.now(); raf = requestAnimationFrame(loop);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }
    function sync() { (inView && !document.hidden) ? start() : stop(); }

    resize();
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }).observe(canvas);
    document.addEventListener('visibilitychange', sync);
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    if (cfg.interactive && fine) {
      window.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
      }, { passive: true });
    }
    return { start, stop, sync, resize };
  }

  const loaderEmbers = createEmbers($('#loaderEmbers'), { density: 1 / 7000, max: 80 });
  loaderEmbers && loaderEmbers.start();
  const heroEmbers = createEmbers($('#heroEmbers'), { density: 1 / 8500, max: 110, interactive: true });

  /* ── Scroll suave (Lenis, opcional) ─────────────────────────── */
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.stop();
  }

  /* ── Loader ─────────────────────────────────────────────────── */
  (function loader() {
    const el = $('#loader');
    if (!el) { finishLoading(); return; }
    const bar = $('#loaderBar'), pct = $('#loaderPct'), status = $('#loaderStatus');
    const msgs = ['Encendiendo el comal', 'Amasando las tortillas', 'Calentando el consomé', 'Picando cebolla y cilantro', 'Listo, pásale'];
    const minMs = reduce ? 500 : 2700;
    const t0 = performance.now();
    let loaded = false, shownMsg = -1, finished = false;

    const onLoad = new Promise((res) => (document.readyState === 'complete' ? res() : window.addEventListener('load', res, { once: true })));
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.all([onLoad, fonts]).then(() => { loaded = true; });
    setTimeout(() => { loaded = true; }, 7000);

    function tick(now) {
      const t = clamp((now - t0) / minMs, 0, 1);
      const eased = 1 - Math.pow(1 - t, 1.4);
      const p = loaded ? eased : Math.min(eased, 0.9);
      bar.style.transform = `scaleX(${p})`;
      pct.textContent = Math.round(p * 100);
      const mi = Math.min(msgs.length - 1, Math.floor(p * msgs.length));
      if (mi !== shownMsg) { shownMsg = mi; status.textContent = msgs[mi]; }
      if (p >= 1 && !finished) { finished = true; setTimeout(finishLoading, 280); return; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  function finishLoading() {
    if (pageReady) return;
    pageReady = true;
    const el = $('#loader');
    html.classList.remove('is-loading');
    html.classList.add('is-ready');
    if (el) {
      el.classList.add('is-leaving');
      setTimeout(() => { el.classList.add('is-done'); loaderEmbers && loaderEmbers.stop(); }, 1700);
    }
    lenis && lenis.start();
    heroEmbers && heroEmbers.start();
    setTimeout(showWaTip, 4200);
  }

  /* ── Navegación ─────────────────────────────────────────────── */
  const nav = $('#nav');
  const burger = $('#burger');
  const overlay = $('#menuOverlay');

  function setMenu(open) {
    if (!overlay || !burger) return;
    overlay.classList.toggle('is-open', open);
    overlay.inert = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (open) { lenis && lenis.stop(); html.style.overflow = 'hidden'; }
    else { lenis && lenis.start(); html.style.overflow = ''; }
  }
  burger && burger.addEventListener('click', () => setMenu(!overlay.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay && overlay.classList.contains('is-open')) { setMenu(false); burger.focus(); } });
  matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* Navegación por anclas */
  function goTo(target, instant) {
    if (!target) return;
    const offset = target.id === 'inicio' ? 0 : -(nav ? nav.offsetHeight : 64) + 1;
    if (lenis) lenis.scrollTo(target, { offset, duration: instant ? 0 : 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-filter-link')) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (overlay && overlay.classList.contains('is-open')) setMenu(false);
    goTo(target);
    history.pushState(null, '', '#' + id);
  });

  /* Sección activa en el menú */
  (function currentSection() {
    const links = $$('.nav__links a');
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.removeAttribute('aria-current'));
        const a = map.get(en.target.id);
        a && a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); s && io.observe(s); });
    const hero = $('#inicio');
    hero && new IntersectionObserver(([e]) => { if (e.isIntersecting) links.forEach((l) => l.removeAttribute('aria-current')); }, { threshold: 0.5 }).observe(hero);
  })();

  /* ── Estado: abierto / cerrado (hora de México) ─────────────── */
  const DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const fmtMx = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const slotsFor = (day) => (day === 0 || day === 6 ? [[480, 840], [1140, 1380]] : [[480, 840]]);
  const clock = (m) => {
    const h = Math.floor(m / 60), mm = m % 60;
    return `${h % 12 || 12}:${String(mm).padStart(2, '0')} ${h >= 12 ? 'p. m.' : 'a. m.'}`;
  };

  function mxNow() {
    const parts = fmtMx.formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    return { day: DAYS[get('weekday')], mins: (+get('hour') % 24) * 60 + +get('minute') };
  }

  function computeStatus() {
    const { day, mins } = mxNow();
    const slots = slotsFor(day);
    const cur = slots.find(([a, b]) => mins >= a && mins < b);
    if (cur) {
      const left = cur[1] - mins;
      return { day, state: 'open', label: 'Abierto ahora', detail: left <= 60 ? `Cerramos en ${left} min` : `Cerramos a las ${clock(cur[1])}` };
    }
    const next = slots.find(([a]) => a > mins);
    if (next) {
      const diff = next[0] - mins;
      return diff <= 60
        ? { day, state: 'soon', label: 'Abrimos pronto', detail: `Abrimos en ${diff} min` }
        : { day, state: 'closed', label: 'Cerrado', detail: `Abrimos hoy a las ${clock(next[0])}` };
    }
    return { day, state: 'closed', label: 'Cerrado', detail: `Abrimos mañana a las ${clock(slotsFor((day + 1) % 7)[0][0])}` };
  }

  function renderStatus() {
    const s = computeStatus();
    $$('[data-status]').forEach((el) => {
      if (el.dataset.state !== s.state) el.dataset.state = s.state;
      $$('[data-status-label]', el).forEach((n) => { if (n.textContent !== s.label) n.textContent = s.label; });
      $$('[data-status-detail]', el).forEach((n) => { if (n.textContent !== s.detail) n.textContent = s.detail; });
    });
    $$('.hours tr[data-day]').forEach((tr) => {
      const today = +tr.dataset.day === s.day;
      tr.classList.toggle('is-today', today);
      const th = $('th', tr);
      const tag = $('.today', th);
      if (today && !tag) th.insertAdjacentHTML('beforeend', '<span class="today">Hoy</span>');
      if (!today && tag) tag.remove();
    });
  }
  renderStatus();
  setInterval(renderStatus, 30000);

  /* ── Toast ──────────────────────────────────────────────────── */
  const toastEl = $('#toast');
  let toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
  }

  /* ── Burbuja de WhatsApp ────────────────────────────────────── */
  function showWaTip() {
    const tip = $('#waTip');
    if (!tip || safe.get('waTip')) return;
    safe.set('waTip', '1');
    tip.classList.add('is-on');
    setTimeout(() => tip.classList.remove('is-on'), 6000);
  }

  /* ── Hero: parallax de puntero, palabra y botones magnéticos ── */
  const hero = $('#inicio');
  const heroVisual = $('#heroVisual');
  const state = { mx: 0, my: 0, tx: 0, ty: 0, heroVisible: true };

  if (hero && fine && !reduce) {
    hero.addEventListener('pointermove', (e) => {
      state.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      state.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { state.tx = 0; state.ty = 0; });
  }
  hero && new IntersectionObserver(([e]) => { state.heroVisible = e.isIntersecting; wordSync(); }).observe(hero);

  const wordEl = $('#heroWord');
  const WORDS = ['BIRRIA', 'ARRACHERA', 'RIB EYE', 'PASTOR', 'CHORIZO', 'BISTEC'];
  let wordIdx = 0, wordTimer = 0, scrambling = false;

  function scramble(el, to) {
    const glyphs = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ#%&*';
    const from = el.textContent;
    const len = Math.max(from.length, to.length);
    let step = 0;
    scrambling = true;
    const id = setInterval(() => {
      let out = '';
      for (let i = 0; i < len; i++) {
        const settle = 5 + i * 1.7;
        if (step >= settle) out += to[i] || '';
        else out += to[i] === ' ' ? ' ' : glyphs[(Math.random() * glyphs.length) | 0];
      }
      el.textContent = out;
      if (++step > 5 + len * 1.7 + 1) { clearInterval(id); el.textContent = to; scrambling = false; }
    }, 42);
  }
  function wordNext() {
    if (!wordEl || scrambling) return;
    wordIdx = (wordIdx + 1) % WORDS.length;
    scramble(wordEl, WORDS[wordIdx]);
  }
  function wordSync() {
    clearInterval(wordTimer);
    if (reduce || !wordEl || !state.heroVisible || document.hidden) return;
    wordTimer = setInterval(wordNext, 2600);
  }
  document.addEventListener('visibilitychange', wordSync);
  wordSync();

  if (fine && !reduce) {
    $$('[data-magnetic]').forEach((el) => {
      const s = parseFloat(el.dataset.magnetic) || 0.3;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.translate = `${(e.clientX - (r.left + r.width / 2)) * s}px ${(e.clientY - (r.top + r.height / 2)) * s}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = '0 0'; });
    });
  }

  /* Luz que sigue al cursor */
  const glow = $('#glow');
  const glowPos = { x: 0, y: 0, tx: 0, ty: 0 };
  if (glow && fine && !reduce) {
    window.addEventListener('pointermove', (e) => {
      glowPos.tx = e.clientX; glowPos.ty = e.clientY;
      glow.classList.add('is-on');
    }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('is-on'));
  }

  /* ── Reveals al hacer scroll ────────────────────────────────── */
  (function reveals() {
    function splitWords(el) {
      let i = 0;
      const walk = (node) => {
        Array.from(node.childNodes).forEach((ch) => {
          if (ch.nodeType === 3) {
            const frag = document.createDocumentFragment();
            ch.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              const w = document.createElement('span');
              w.className = 'w';
              const inner = document.createElement('span');
              inner.className = 'w__in';
              inner.style.setProperty('--wi', i++);
              inner.textContent = part;
              w.appendChild(inner);
              frag.appendChild(w);
            });
            ch.replaceWith(frag);
          } else if (ch.nodeType === 1) walk(ch);
        });
      };
      walk(el);
      el.classList.add('is-split');
    }

    const splits = $$('[data-split]');
    const items = $$('[data-reveal]');
    const groups = $$('[data-stagger]');

    if (!('IntersectionObserver' in window) || reduce) {
      splits.forEach((el) => el.classList.add('in'));
      items.forEach((el) => el.classList.add('in'));
      groups.forEach((el) => el.classList.add('in'));
      return;
    }

    splits.forEach(splitWords);
    items.forEach((el) => { if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay + 'ms'); });
    groups.forEach((g) => Array.from(g.children).forEach((c, i) => c.style.setProperty('--i', i)));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    [...splits, ...items, ...groups].forEach((el) => io.observe(el));
  })();

  /* ── Marquee (bandas) ───────────────────────────────────────── */
  const marquee = (() => {
    const rows = $$('[data-marquee]').map((row) => {
      const set = $('.band__set', row);
      return { row, set, dir: Math.sign(+row.dataset.marquee) || 1, x: 0, w: 0, speed: row.classList.contains('band__row--red') ? 64 : 46 };
    });
    let visible = false, vel = 0, lastY = 0;

    function build() {
      rows.forEach((r) => {
        $$('.band__set[data-clone]', r.row).forEach((n) => n.remove());
        r.w = r.set.getBoundingClientRect().width;
        if (!r.w) return;
        const copies = Math.ceil((window.innerWidth * 1.7) / r.w) + 1;
        for (let i = 0; i < copies; i++) {
          const c = r.set.cloneNode(true);
          c.setAttribute('data-clone', '');
          r.row.appendChild(c);
        }
        r.x = r.dir > 0 ? -r.w : 0;
      });
    }
    build();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
    const band = $('.band');
    band && new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(band);

    return {
      tick(dt, y) {
        if (reduce || !visible) { lastY = y; return; }
        vel = lerp(vel, Math.abs(y - lastY), 0.12);
        lastY = y;
        rows.forEach((r) => {
          if (!r.w) return;
          r.x += r.dir * (r.speed * dt + vel * 0.55);
          if (r.dir < 0 && r.x <= -r.w) r.x += r.w;
          if (r.dir > 0 && r.x >= 0) r.x -= r.w;
          r.row.style.transform = `translate3d(${r.x.toFixed(2)}px,0,0)`;
        });
      },
    };
  })();

  /* ── Manifiesto: texto que se enciende con el scroll ────────── */
  const scrub = (() => {
    const root = $('[data-scrub]');
    if (!root || reduce) return { tick() {} };
    const units = [];
    (function walk(node) {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span');
            s.className = 'sw';
            s.textContent = part;
            frag.appendChild(s);
            units.push(s);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1) {
          if (ch.classList.contains('pill')) { ch.classList.add('sw'); units.push(ch); } else walk(ch);
        }
      });
    })(root);

    let visible = false, lastP = -1;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; sig.dirty = true; }, { rootMargin: '10% 0px' }).observe(root);
    const n = units.length;
    const paint = (p) => units.forEach((u, i) => { u.style.opacity = (0.16 + 0.84 * clamp(p * (n + 6) - i, 0, 1)).toFixed(3); });
    paint(0);

    return {
      tick() {
        if (!visible) return;
        const r = root.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.42), 0, 1);
        if (Math.abs(p - lastP) < 0.002) return;
        lastP = p;
        paint(p);
      },
    };
  })();

  /* ── Parallax de imágenes ───────────────────────────────────── */
  const parallax = (() => {
    if (reduce) return { tick() {} };
    const items = $$('[data-parallax]').map((img) => ({ img, parent: img.parentElement, speed: parseFloat(img.dataset.parallax) || 0.05, visible: false }));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { const it = items.find((i) => i.parent === en.target); if (it) it.visible = en.isIntersecting; });
      sig.dirty = true;
    }, { rootMargin: '15% 0px' });
    items.forEach((i) => io.observe(i.parent));
    return {
      tick() {
        const vh = window.innerHeight;
        items.forEach((it) => {
          if (!it.visible) return;
          const r = it.parent.getBoundingClientRect();
          const lim = r.height * 0.09;
          const y = clamp((r.top + r.height / 2 - vh / 2) * it.speed, -lim, lim);
          it.img.style.translate = `0 ${y.toFixed(1)}px`;
        });
      },
    };
  })();

  /* ── Bucle principal ────────────────────────────────────────── */
  const scrollBar = $('#scrollBar');
  let lastT = performance.now(), lastScroll = -1;

  function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    lenis && lenis.raf(now);

    const y = lenis ? lenis.scroll : window.scrollY;
    if (y !== lastScroll || sig.dirty) {
      lastScroll = y;
      sig.dirty = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollBar) scrollBar.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
      nav && nav.classList.toggle('is-stuck', y > 24);
      if (heroVisual && state.heroVisible && !reduce) heroVisual.style.setProperty('--sy', (y * 0.1).toFixed(1));
      scrub.tick();
      parallax.tick();
    }
    marquee.tick(dt, y);

    if (heroVisual && state.heroVisible && fine && !reduce) {
      state.mx = lerp(state.mx, state.tx, 0.07);
      state.my = lerp(state.my, state.ty, 0.07);
      heroVisual.style.setProperty('--mx', state.mx.toFixed(3));
      heroVisual.style.setProperty('--my', state.my.toFixed(3));
    }
    if (glow && glow.classList.contains('is-on')) {
      glowPos.x = lerp(glowPos.x, glowPos.tx, 0.12);
      glowPos.y = lerp(glowPos.y, glowPos.ty, 0.12);
      glow.style.transform = `translate3d(${glowPos.x.toFixed(1)}px,${glowPos.y.toFixed(1)}px,0)`;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ── Menú: filtros, agregar al pedido, carnes ───────────────── */
  const MEATS = ['Bistec', 'Arrachera', 'Rib eye', 'Birria', 'Chorizo', 'Pastor'];
  const filterBtns = $$('.filter');

  function closePicks(except) {
    $$('.dish__pick').forEach((p) => {
      if (p === except) return;
      p.hidden = true;
      const b = $('[data-pick]', p.closest('.dish'));
      b && b.setAttribute('aria-expanded', 'false');
    });
  }

  function setFilter(name, animate = true) {
    closePicks();
    let k = 0;
    $$('.dish').forEach((d) => {
      const show = name === 'todo' || d.dataset.tags.split(' ').includes(name);
      d.hidden = !show;
      d.classList.remove('is-enter');
      if (show && animate && !reduce) {
        void d.offsetWidth;
        d.style.setProperty('--k', k++);
        d.classList.add('is-enter');
      }
    });
    $$('.menu-group').forEach((g) => { g.hidden = !$('.dish:not([hidden])', g); });
    filterBtns.forEach((b) => {
      const on = b.dataset.filter === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }
  filterBtns.forEach((b) => b.addEventListener('click', () => setFilter(b.dataset.filter)));
  $$('[data-filter-link]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    setFilter(a.dataset.filterLink);
    goTo($('#menu'));
  }));

  /* Pedido (carrito) */
  const cart = new Map();
  const cartList = $('#cartList'), cartEmpty = $('#cartEmpty'), cartClear = $('#cartClear');
  const tray = $('#tray'), trayCount = $('#trayCount'), trayText = $('#trayText');
  let orderInView = false, lastAdded = null;

  const total = () => Array.from(cart.values()).reduce((a, b) => a + b, 0);

  function renderCart() {
    cartList.innerHTML = '';
    cart.forEach((qty, name) => {
      const li = document.createElement('li');
      li.className = 'cart__item' + (name === lastAdded ? ' is-new' : '');
      li.innerHTML =
        '<span class="cart__name"></span>' +
        '<div class="qty" role="group">' +
        '<button class="qty__btn" type="button" data-q="-1"><svg class="ic" aria-hidden="true"><use href="#i-minus"/></svg></button>' +
        '<span class="qty__n"></span>' +
        '<button class="qty__btn" type="button" data-q="1"><svg class="ic" aria-hidden="true"><use href="#i-plus"/></svg></button>' +
        '</div>';
      li.dataset.name = name;
      $('.cart__name', li).textContent = name;
      $('.qty__n', li).textContent = qty;
      $('.qty', li).setAttribute('aria-label', 'Cantidad de ' + name);
      $('[data-q="-1"]', li).setAttribute('aria-label', 'Quitar uno de ' + name);
      $('[data-q="1"]', li).setAttribute('aria-label', 'Agregar uno de ' + name);
      cartList.appendChild(li);
    });
    lastAdded = null;
    cartEmpty.hidden = cart.size > 0;
    cartClear.hidden = cart.size === 0;
    updateTray();
  }

  function updateTray() {
    const n = total();
    trayCount.textContent = n;
    trayText.textContent = (n === 1 ? 'antojo' : 'antojos') + ' en tu pedido';
    tray.hidden = n === 0 || orderInView;
  }

  function addItem(name) {
    cart.set(name, (cart.get(name) || 0) + 1);
    lastAdded = name;
    renderCart();
    trayCount.classList.remove('is-bump');
    void trayCount.offsetWidth;
    trayCount.classList.add('is-bump');
    toast(name + ' agregado');
  }

  cartList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-q]');
    if (!btn) return;
    const name = btn.closest('.cart__item').dataset.name;
    const next = (cart.get(name) || 0) + +btn.dataset.q;
    if (next <= 0) cart.delete(name); else cart.set(name, next);
    renderCart();
  });
  cartClear.addEventListener('click', () => { cart.clear(); renderCart(); toast('Pedido vacío'); });

  $('#menuList').addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) { addItem(addBtn.dataset.add); return; }

    const pickBtn = e.target.closest('[data-pick]');
    if (pickBtn) {
      const panel = $('.dish__pick', pickBtn.closest('.dish'));
      const open = panel.hidden;
      closePicks(open ? panel : null);
      if (open && !panel.children.length) {
        const label = document.createElement('p');
        label.className = 'dish__pick-label';
        label.textContent = 'Elige la carne';
        const list = document.createElement('div');
        list.className = 'dish__pick-list';
        MEATS.forEach((m) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'meat';
          b.textContent = m;
          b.dataset.meat = m.toLowerCase();
          b.setAttribute('aria-label', pickBtn.dataset.pick.replace('{m}', m.toLowerCase()) + ', agregar al pedido');
          list.appendChild(b);
        });
        panel.append(label, list);
      }
      panel.hidden = !open;
      pickBtn.setAttribute('aria-expanded', String(open));
      return;
    }

    const meat = e.target.closest('.meat');
    if (meat) {
      const dish = meat.closest('.dish');
      const btn = $('[data-pick]', dish);
      addItem(btn.dataset.pick.replace('{m}', meat.dataset.meat));
      closePicks();
    }
  });

  tray.addEventListener('click', () => goTo($('#pedido')));
  const orderSec = $('#pedido');
  orderSec && new IntersectionObserver(([e]) => { orderInView = e.isIntersecting; updateTray(); }, { threshold: 0.2 }).observe(orderSec);
  renderCart();

  /* Formulario → WhatsApp */
  const form = $('#orderForm');
  const fName = $('#f-name'), fNotes = $('#f-notes');

  function setError(input, msg) {
    const field = input.closest('.field');
    const err = $('.field__error', field);
    field.classList.toggle('is-invalid', !!msg);
    err.textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }
  [fName, fNotes].forEach((i) => i.addEventListener('input', () => setError(i, '')));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = fName.value.trim();
    const notes = fNotes.value.trim();
    const mode = (form.elements.modo.value || 'Para comer aquí');
    let bad = null;
    setError(fName, ''); setError(fNotes, '');
    if (name.length < 2) { setError(fName, 'Escribe tu nombre para armar tu pedido.'); bad = fName; }
    if (!cart.size && notes.length < 2) { setError(fNotes, 'Agrega algo del menú o cuéntanos qué se te antoja.'); bad = bad || fNotes; }
    if (bad) { bad.focus(); return; }

    const lines = [`Hola, soy ${name}. Quiero hacer un pedido:`, ''];
    if (cart.size) cart.forEach((q, n) => lines.push(`• ${q} × ${n}`));
    else lines.push('• Aún no elijo, te cuento abajo');
    lines.push('', `Modo: ${mode}`);
    if (notes) lines.push(`Notas: ${notes}`);
    lines.push('', '¡Gracias!');

    const a = document.createElement('a');
    a.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(lines.join('\n'))}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('Abriendo WhatsApp…');
  });

  /* ── Especialidades (acordeón + imagen) ─────────────────────── */
  (function specs() {
    const items = $$('#specList .spec');
    const imgs = $$('.spec-frame img');
    items.forEach((li, idx) => {
      $('.spec__btn', li).addEventListener('click', () => {
        items.forEach((o, j) => {
          const on = j === idx;
          o.classList.toggle('is-active', on);
          $('.spec__btn', o).setAttribute('aria-expanded', String(on));
          $('.spec__more', o).inert = !on;
          imgs[j] && imgs[j].classList.toggle('is-active', on);
        });
      });
    });
  })();

  /* ── Proceso (pasos sincronizados con imagen) ───────────────── */
  (function story() {
    const steps = $$('#storySteps .step');
    const imgs = $$('.story__frame img');
    if (!steps.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const idx = steps.indexOf(en.target);
        steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
        imgs.forEach((im, i) => im.classList.toggle('is-active', i === idx));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
  })();

  /* ── Galería: arrastre, flechas y lightbox ──────────────────── */
  (function gallery() {
    const reel = $('#reel');
    const items = $$('.reel__item');
    if (!reel) return;

    $('#reelPrev').addEventListener('click', () => reel.scrollBy({ left: -reel.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' }));
    $('#reelNext').addEventListener('click', () => reel.scrollBy({ left: reel.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' }));

    let down = false, moved = false, sx = 0, sl = 0;
    reel.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = reel.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 6) { moved = true; reel.classList.add('is-dragging'); }
      if (moved) reel.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', () => { down = false; reel.classList.remove('is-dragging'); });
    reel.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

    const dlg = $('#lightbox'), img = $('#lbImg'), cap = $('#lbCap');
    let cur = 0;
    function show(i) {
      cur = (i + items.length) % items.length;
      const src = $('img', items[cur]);
      img.src = src.currentSrc || src.src;
      img.alt = src.alt;
      cap.textContent = items[cur].dataset.cap || src.alt;
    }
    items.forEach((it, i) => it.addEventListener('click', () => {
      show(i);
      dlg.showModal();
      lenis && lenis.stop();
    }));
    dlg.addEventListener('close', () => { lenis && lenis.start(); });
    $('#lbClose').addEventListener('click', () => dlg.close());
    $('#lbPrev').addEventListener('click', () => show(cur - 1));
    $('#lbNext').addEventListener('click', () => show(cur + 1));
    dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.classList.contains('lightbox__fig')) dlg.close(); });
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
  })();
})();
