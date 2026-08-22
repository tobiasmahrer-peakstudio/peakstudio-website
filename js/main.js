// peak studio — main.js

// enable smooth scrolling only after the initial page load/anchor jump has
// settled, so cross-page links to #kontakt land instantly instead of
// animating through the whole page
window.addEventListener('load', () => {
  document.documentElement.classList.add('smooth-scroll');
});

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
        // deferred so the browser can start following the link before
        // the menu hides itself (visibility:hidden mid-click can abort
        // navigation on iOS Safari)
        setTimeout(() => {
          mobileNav.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }, 0);
      });
    });
  }

  // hero word rotator — fully fade out before fading in the next word
  const rotator = document.querySelector('.rotator');
  if (rotator) {
    const words = rotator.querySelectorAll('.rotator__word');
    if (words.length > 1) {
      const FADE_OUT_MS = 400; // matches .rotator__word transition duration
      const HOLD_MS = 1500;
      let current = 0;
      const cycle = () => {
        const next = (current + 1) % words.length;
        words[current].classList.remove('is-active');
        setTimeout(() => {
          words[next].classList.add('is-active');
          current = next;
          setTimeout(cycle, HOLD_MS);
        }, FADE_OUT_MS);
      };
      setTimeout(cycle, HOLD_MS);
    }
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

  // masonry / film-frame / reel-tile video play buttons
  document.querySelectorAll('[data-play-video]').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.masonry__video, .film-frame, .reel-tile');
      if (!wrap) return;
      // once playing, this wrap has native <video controls> — further
      // clicks inside it (e.g. the browser's own pause button) bubble
      // up to this same listener, and calling play() unconditionally
      // here was immediately overriding that pause, making the video
      // impossible to stop. Bail out once it's already playing and let
      // the native controls take it from here.
      if (wrap.classList.contains('is-playing')) return;
      const video = wrap.querySelector('video');
      if (!video) return;

      // only one reel/video plays at a time — starting this one pauses
      // any other that's currently playing
      document.querySelectorAll('[data-play-video].is-playing').forEach(other => {
        if (other === wrap) return;
        const otherVideo = other.querySelector('video');
        if (otherVideo) {
          otherVideo.pause();
          otherVideo.muted = true;
          otherVideo.removeAttribute('controls');
        }
        other.classList.remove('is-playing');
      });

      wrap.classList.add('is-playing');
      video.muted = false;
      video.play();
      video.setAttribute('controls', '');
    });
  });

  // contact form submission (Formspree)
  const contactForm = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  if (contactForm && formNote) {
    const serviceParam = new URLSearchParams(window.location.search).get('service');
    if (serviceParam) {
      const messageField = document.getElementById('message');
      if (messageField && !messageField.value) {
        messageField.value = `Ich interessiere mich für: ${serviceParam}\n\n`;
      }
    }

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      formNote.textContent = 'Wird gesendet …';
      formNote.classList.remove('is-error', 'is-success');
      try {
        const res = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          formNote.textContent = 'Danke! Deine Nachricht wurde gesendet — wir melden uns bald.';
          formNote.classList.add('is-success');
          contactForm.reset();
        } else {
          throw new Error('Formspree request failed');
        }
      } catch (err) {
        formNote.textContent = 'Ups, das hat nicht geklappt. Schreib uns direkt an tobiasmahrer@outlook.com.';
        formNote.classList.add('is-error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // projekte filter
  const projFilter = document.getElementById('projFilter');
  const projList = document.getElementById('projList');
  if (projFilter && projList) {
    const items = projList.querySelectorAll('.proj-item');
    projFilter.addEventListener('click', (e) => {
      const btn = e.target.closest('.proj-filter__btn');
      if (!btn) return;
      const filter = btn.dataset.filter;
      projFilter.querySelectorAll('.proj-filter__btn').forEach(b => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      items.forEach(item => {
        item.style.display = (filter === 'all' || item.dataset.cat === filter) ? '' : 'none';
      });
    });
  }

  // leistungen accordion — other panels collapsing above/below the clicked
  // one shift the page by a different amount every time (depending on which
  // panel was open and how tall each panel is), which reads as random
  // jumping. Once the collapse animation settles, scroll the clicked title
  // to the same fixed spot below the header every time, so it feels uniform
  // regardless of what was open before.
  const leistItems = document.querySelectorAll('.leist-item');
  if (leistItems.length) {
    const header = document.getElementById('header');
    const COLLAPSE_MS = 460; // matches .leist-item__panel grid-template-rows transition (.45s)

    leistItems.forEach(item => {
      const trigger = item.querySelector('.leist-item__trigger');
      trigger.addEventListener('click', () => {
        const wasOpen = item.classList.contains('is-open');
        leistItems.forEach(other => {
          other.classList.remove('is-open');
          other.querySelector('.leist-item__trigger').setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
          setTimeout(() => {
            const headerH = header ? header.offsetHeight : 0;
            const y = trigger.getBoundingClientRect().top + window.scrollY - headerH - 16;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }, COLLAPSE_MS);
        }
      });
    });
  }

  // header visibility on scroll (mobile widths only, see css): shows only
  // near the very top of the page, hides once scrolled past it — and,
  // deliberately, does NOT come back on scroll-up mid-page. An earlier
  // version re-revealed the header any time you scrolled up, floating it
  // back in over whatever content was currently on screen; on iOS Safari
  // that reveal is exactly what triggered the header visibly detaching /
  // flashing near the notch. Only ever showing it right at the top avoids
  // that interaction entirely — you get the header back by scrolling to
  // the top, not by any upward flick anywhere on the page.
  // rAF-throttled and clamped against iOS rubber-band overscroll so it
  // can't get stuck mid-transition.
  const header = document.getElementById('header');
  if (header) {
    const HIDE_AFTER = 80; // px scrolled before hiding is allowed
    let ticking = false;

    const update = () => {
      ticking = false;
      if (mobileNav && mobileNav.classList.contains('is-open')) return;

      const y = Math.max(window.scrollY, 0);
      header.classList.toggle('is-hidden', y > HIDE_AFTER);
    };

    update();
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
  }
});
