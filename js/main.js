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

  // contact form submission (Formspree)
  const contactForm = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  if (contactForm && formNote) {
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

  // leistungen accordion
  const leistItems = document.querySelectorAll('.leist-item');
  if (leistItems.length) {
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
        }
      });
    });
  }

  // header background state on scroll (kept subtle, css handles blur already)
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
});
