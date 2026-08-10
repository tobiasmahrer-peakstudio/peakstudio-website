// peak studio — main.js

document.addEventListener('DOMContentLoaded', () => {

  // mobile nav toggle
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobileNav');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // masonry / film-frame video play buttons
  document.querySelectorAll('[data-play-video]').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.masonry__video, .film-frame');
      if (!wrap) return;
      const video = wrap.querySelector('video');
      if (!video) return;
      wrap.classList.add('is-playing');
      video.muted = false;
      video.play();
      video.setAttribute('controls', '');
    });
  });

  // header background state on scroll (kept subtle, css handles blur already)
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // custom cursor — small "view" dot over work tiles / case rows
  const cursorTargets = document.querySelectorAll('[data-cursor]');
  if (cursorTargets.length && matchMedia('(hover:hover)').matches) {
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.innerHTML = '<span></span>';
    document.body.appendChild(dot);
    const label = dot.querySelector('span');

    let x = 0, y = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; });
    const tick = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      dot.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(tick);
    };
    tick();

    cursorTargets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        label.textContent = el.getAttribute('data-cursor') || 'Ansehen';
        dot.classList.add('is-active');
      });
      el.addEventListener('mouseleave', () => dot.classList.remove('is-active'));
    });
  }
});
