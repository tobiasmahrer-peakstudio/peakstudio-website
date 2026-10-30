(() => {
  const root = document.documentElement;
  const head = document.querySelector('.site-head');
  const hero = head.hasAttribute('data-hero') ? document.querySelector('.reel--hero') : null;

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
  if (hero && root.classList.contains('has-hero')) {
    const v = hero.querySelector('video');
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
})();
