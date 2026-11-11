(() => {
  const root = document.documentElement;
  const head = document.querySelector('.site-head');
  const hero = head.hasAttribute('data-hero') ? document.querySelector('.reel--hero, .intro-screen--grad') : null;

  /* Menu */
  const burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', () => {
      const open = root.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => {
      root.classList.remove('menu-open');
      document.body.style.overflow = '';
    }));
  }

  /* Header: hide on scroll down, show on scroll up (Latviaplan) */
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (!root.classList.contains('menu-open')) {
      head.classList.toggle('is-hidden', y > lastY && y > 120);
    }
    lastY = y;
    if (hero) {
      const over = y < hero.offsetHeight - head.offsetHeight;
      head.classList.toggle('is-clear', over);
      head.classList.toggle('on-dark', over);
    }
  }, { passive: true });

  /* iPhone Safari: at the very top of the page it fills the status bar with the page background colour.
     On the homepage that colour follows the top edge of the playing video (sampled a few times per second),
     so the bar continues the video instead of showing a white or black strip. */
  const heroVideo = hero && hero.querySelector('video');
  if (heroVideo && root.classList.contains('has-hero')) {
    const v = heroVideo;
    const meta = document.querySelector('meta[name="theme-color"]');
    const c = document.createElement('canvas');
    c.width = 8; c.height = 1;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const sample = () => {
      if (scrollY < hero.offsetHeight && v.readyState >= 2 && v.videoWidth) {
        try {
          /* object-fit:cover crops the sides: sample only the visible middle part of the top rows */
          const vis = Math.min(1, (hero.offsetWidth / hero.offsetHeight) / (v.videoWidth / v.videoHeight));
          const sw = v.videoWidth * vis, sx = (v.videoWidth - sw) / 2;
          ctx.drawImage(v, sx, 0, sw, Math.max(2, v.videoHeight * .03), 0, 0, 8, 1);
          const d = ctx.getImageData(0, 0, 8, 1).data;
          let r = 0, g = 0, b = 0;
          for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
          const col = `rgb(${Math.round(r / 8)}, ${Math.round(g / 8)}, ${Math.round(b / 8)})`;
          root.style.setProperty('--top-tint', col);
          if (meta) meta.content = col;
        } catch (e) {}
      }
      setTimeout(sample, 250);
    };
    sample();
  }

  /* Reveal on scroll */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* Hero word rotator: old word slides up and out, new word slides up in from below.
     Parking a word back below the line must happen without transition,
     otherwise it sweeps visibly through the line and two words overlap. */
  const park = el => {
    el.style.transition = 'none';
    el.classList.remove('is-in', 'is-out');
    void el.offsetWidth;
    el.style.transition = '';
  };
  document.querySelectorAll('.rotator').forEach(r => {
    const words = [...r.children];
    let i = 0;
    words.forEach(park);
    words[0].classList.add('is-in');
    setInterval(() => {
      const cur = words[i];
      i = (i + 1) % words.length;
      const next = words[i];
      park(next);
      cur.classList.replace('is-in', 'is-out');
      next.classList.add('is-in');
      setTimeout(() => { if (!cur.classList.contains('is-in')) park(cur); }, 900);
    }, 2200);
  });

  /* Case pages: show a random pick of the other projects */
  document.querySelectorAll('.pgrid--random').forEach(g => {
    const tiles = [...g.children];
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    tiles.forEach(t => g.appendChild(t));
  });

  /* Album strips: swipe / trackpad natively; with a mouse they can also be dragged */
  document.querySelectorAll('.strip__track').forEach(t => {
    let down = false, x0 = 0, s0 = 0, moved = false;
    t.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; x0 = e.clientX; s0 = t.scrollLeft;
      t.style.scrollSnapType = 'none'; t.style.cursor = 'grabbing';
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 3) moved = true;
      t.scrollLeft = s0 - dx;
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      down = false; t.style.scrollSnapType = ''; t.style.cursor = '';
    });
    t.addEventListener('dragstart', e => e.preventDefault());
    t.addEventListener('click', e => { if (moved) e.preventDefault(); }, true);
  });

  /* Lazy autoplay for muted loops: play only when on screen */
  const vio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) { v.play().catch(() => {}); } else { v.pause(); }
    });
  }, { threshold: .25 });
  document.querySelectorAll('video[data-auto]').forEach(v => vio.observe(v));

  /* Sound toggles */
  document.querySelectorAll('[data-sound]').forEach(btn => {
    const v = document.getElementById(btn.dataset.sound) || btn.parentElement.querySelector('video');
    btn.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('video').forEach(o => { if (o !== v) o.muted = true; });
      document.querySelectorAll('[data-sound]').forEach(b => b.classList.remove('is-on'));
      v.muted = !v.muted;
      btn.classList.toggle('is-on', !v.muted);
      if (btn.dataset.labelOn) btn.textContent = v.muted ? btn.dataset.labelOff : btn.dataset.labelOn;
      v.play().catch(() => {});
    });
  });

  /* Click-to-play film */
  document.querySelectorAll('.film:not(.film--album)').forEach(f => {
    f.addEventListener('click', () => {
      if (f.classList.contains('is-playing')) return;
      const v = f.querySelector('video');
      document.querySelectorAll('video').forEach(o => { if (o !== v) o.muted = true; });
      v.controls = true; v.muted = false;
      f.classList.add('is-playing');
      v.play();
    });
  });

  /* Leistungen: the four links work like a dropdown — nothing is open at first,
     a click opens that service below the intro (and closes the others),
     clicking the open one again closes it */
  const jump = document.querySelector('.jump');
  if (jump) {
    const links = [...jump.querySelectorAll('a[href^="#"]')];
    const panels = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const show = id => {
      const target = panels.find(p => p.id === id) || null;
      panels.forEach(p => { p.hidden = p !== target; });
      links.forEach(a => {
        const on = !!target && a.getAttribute('href') === '#' + target.id;
        a.classList.toggle('is-active', on);
        a.setAttribute('aria-expanded', on);
      });
      if (target) target.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      return target;
    };
    const initial = show(location.hash.slice(1));
    if (initial) requestAnimationFrame(() => initial.scrollIntoView());
    links.forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      if (a.classList.contains('is-active')) {
        show(null);
        history.replaceState(null, '', location.pathname + location.search);
        return;
      }
      const target = show(id);
      history.replaceState(null, '', '#' + id);
      target.scrollIntoView({ behavior: 'smooth' });
    }));
    addEventListener('hashchange', () => { const t = show(location.hash.slice(1)); if (t) t.scrollIntoView(); });
  }

  /* Prefill the message from ?service= (e.g. "Shooting anfragen") */
  const svc = new URLSearchParams(location.search).get('service');
  const msg = document.getElementById('f-msg');
  if (svc && msg && !msg.value) msg.value = 'Anfrage: ' + svc + '\n\n';

  /* Touch: first tap greys out the tile and shows the title, second tap opens it */
  if (matchMedia('(hover:none)').matches) {
    const tiles = document.querySelectorAll('a.ptile:not(.ptile--plain)');  /* iMac links open directly */
    tiles.forEach(t => t.addEventListener('click', e => {
      if (t.classList.contains('is-active')) return;
      e.preventDefault();
      tiles.forEach(o => o.classList.remove('is-active'));
      t.classList.add('is-active');
    }));
    /* team tiles: tap toggles name + function */
    const team = document.querySelectorAll('.ptile--team, .ptile--soon');
    team.forEach(t => t.addEventListener('click', () => {
      const on = !t.classList.contains('is-active');
      team.forEach(o => o.classList.remove('is-active'));
      t.classList.toggle('is-active', on);
    }));
    document.addEventListener('click', e => {
      if (!e.target.closest('a.ptile')) tiles.forEach(o => o.classList.remove('is-active'));
      if (!e.target.closest('.ptile--team, .ptile--soon')) team.forEach(o => o.classList.remove('is-active'));
    });
  }

  /* Cursor dot (switched off 2026-10-28; set to true to bring the blue follower dot back) */
  const CURSOR_DOT = false;
  if (CURSOR_DOT && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    document.body.appendChild(dot);
    let x = -100, y = -100, dx = x, dy = y;
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; dot.classList.add('is-on'); });
    document.addEventListener('mouseleave', () => dot.classList.remove('is-on'));
    document.addEventListener('mouseover', e => {
      dot.classList.toggle('is-big', !!e.target.closest('a, button, .film, label, input, textarea, select'));
    });
    (function loop() {
      dx += (x - dx) * .22; dy += (y - dy) * .22;
      dot.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(loop);
    })();
  }
  /* Claim "Einschlag" (CLAIM_FX = 'impact' in tools/build.py): when PEAK lands, ripples run over the hero surface
     like water after a stone; after that, snowflakes keep drifting down and each one leaves small ripples where it
     touches the water. A canvas between gradient and text; each ring is a dark trough followed by a bright crest,
     getting wider and fainter as it travels. Runs only while the hero is on screen.
     (Tried and dropped on 2026-11-11: ice cracks, then ice floes.) */
  const claim = document.querySelector('.reel__claim--impact');
  if (claim && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    const reel = claim.closest('.reel');
    const peakLn = claim.querySelectorAll('.ln')[2];
    const cv = document.createElement('canvas');
    cv.className = 'reel__ice';
    cv.setAttribute('aria-hidden', 'true');
    reel.insertBefore(cv, reel.firstChild);
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, running = false, visible = true, last = 0, nextFlake = 0;
    const ripples = [], flakes = [];

    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = reel.clientWidth; H = reel.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
    };
    /* impact point: the middle of the word PEAK, a bit below its centre */
    const impact = () => {
      const r = document.createRange();
      r.selectNodeContents(peakLn);
      const t = r.getBoundingClientRect(), b = reel.getBoundingClientRect();
      return { x: t.left - b.left + t.width * .5, y: t.top - b.top + t.height * .62 };
    };

    /* a ripple: rings starting at the given delays, travelling at speed (px/ms), gone after dur ms */
    const ripple = (x, y, o) => ripples.push(Object.assign({ x, y, t0: performance.now() }, o));
    const ring = (rp, el, delay, n) => {
      const t = el - delay;
      if (t <= 0) return;
      const r = t * rp.speed * (1 - n * .06);
      const w = rp.w + r * .09;
      const amp = Math.max(0, 1 - t / (rp.dur - delay)) * (1 - n * .15) * Math.min(1, t / 90) * rp.amp;
      if (amp <= 0) return;
      const g = ctx.createRadialGradient(rp.x, rp.y, Math.max(0, r - w * 1.6), rp.x, rp.y, r + w);
      g.addColorStop(0, 'rgba(4,30,70,0)');
      g.addColorStop(.3, `rgba(4,30,70,${.22 * amp})`);      // trough
      g.addColorStop(.55, 'rgba(255,255,255,0)');
      g.addColorStop(.75, `rgba(255,255,255,${.42 * amp})`); // crest catching the light
      g.addColorStop(.9, `rgba(230,250,255,${.12 * amp})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(rp.x, rp.y, r + w, 0, Math.PI * 2); ctx.fill();
    };

    /* snowflakes: soft white dots that sway down and land at a random spot on the water */
    const addFlake = () => {
      const sz = 2 + Math.random() * 3;
      flakes.push({
        x: Math.random() * W, y: -10, size: sz,
        land: H * (.15 + Math.random() * .8),
        vy: .06 + sz * .01 + Math.random() * .03,        // px/ms: bigger flakes fall a bit faster
        sway: 12 + Math.random() * 22, ph: Math.random() * 6.28, fr: .0012 + Math.random() * .0012,
        x0: 0, gone: 0
      });
      flakes[flakes.length - 1].x0 = flakes[flakes.length - 1].x;
    };

    const frame = now => {
      if (!running) return;
      const dt = Math.min(50, now - (last || now)); last = now;
      if (now > nextFlake && flakes.length < 9) { addFlake(); nextFlake = now + 500 + Math.random() * 1100; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i], el = now - rp.t0;
        if (el > rp.dur) { ripples.splice(i, 1); continue; }
        rp.waves.forEach((d, n) => ring(rp, el, d, n));
        if (rp.flash && el < 450) {                          // splash of light at the PEAK hit
          const k = 1 - el / 450, fl = ctx.createRadialGradient(rp.x, rp.y, 0, rp.x, rp.y, 220);
          fl.addColorStop(0, `rgba(255,255,255,${.55 * k})`); fl.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = fl; ctx.beginPath(); ctx.arc(rp.x, rp.y, 220, 0, Math.PI * 2); ctx.fill();
        }
      }
      for (let i = flakes.length - 1; i >= 0; i--) {
        const f = flakes[i];
        let a = 1, sz = f.size;
        if (!f.gone) {
          f.y += f.vy * dt; f.ph += f.fr * dt; f.x = f.x0 + Math.sin(f.ph) * f.sway;
          if (f.y >= f.land) {                               // touches the water: small ripples, flake melts away
            f.gone = now;
            ripple(f.x, f.y, { waves: [0, 180, 380], speed: .08 + f.size * .015, dur: 2600, amp: .8 + f.size * .1, w: 6 });
          }
        } else {
          const k = (now - f.gone) / 260;
          if (k >= 1) { flakes.splice(i, 1); continue; }
          a = 1 - k; sz = f.size * (1 + k * .8);
        }
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, sz * 2.2);
        g.addColorStop(0, `rgba(255,255,255,${.95 * a})`); g.addColorStop(.45, `rgba(255,255,255,${.6 * a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, sz * 2.2, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    };
    const start = () => { if (running || !visible) return; running = true; last = 0; requestAnimationFrame(frame); };

    let hit = false;
    peakLn.addEventListener('animationend', e => {
      if (e.animationName !== 'claim-slam' || hit) return;
      hit = true; size();
      const o = impact();
      const reach = Math.hypot(Math.max(o.x, W - o.x), Math.max(o.y, H - o.y));
      ripple(o.x, o.y, { waves: [0, 170, 360, 600, 880], speed: reach / 2300, dur: 3200, amp: 1, w: 14, flash: true });
      nextFlake = performance.now() + 900;                  // first flakes shortly after the big splash
      start();
    });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && hit) start(); else running = false; }).observe(reel);
    addEventListener('resize', () => { if (hit) size(); });
  }
})();
