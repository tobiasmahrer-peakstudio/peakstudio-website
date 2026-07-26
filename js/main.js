// ===== header scroll state =====
const header = document.getElementById('header');
const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== mobile nav =====
const burger = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');

burger.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('is-open');
  burger.classList.toggle('is-active', isOpen);
  burger.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('is-open');
    burger.classList.remove('is-active');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// ===== scroll reveal =====
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('is-visible'), i % 4 * 90);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// ===== video players (film-frame + phone-mock reels) =====
document.querySelectorAll('[data-play-video]').forEach(button => {
  const frame = button.closest('.film-frame, .phone-mock');
  const video = frame ? frame.querySelector('video') : null;
  if (!video) return;

  button.addEventListener('click', () => {
    frame.classList.add('is-playing');
    video.controls = true;
    video.play();
  });

  video.addEventListener('pause', () => {
    if (video.currentTime === 0 || video.ended) {
      frame.classList.remove('is-playing');
      video.controls = false;
    }
  });
});

// ===== contact form (mailto fallback — no backend) =====
const form = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    const subject = encodeURIComponent(`Projektanfrage von ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:tobiasmahrer@outlook.com?subject=${subject}&body=${body}`;

    formNote.textContent = 'Dein E-Mail-Programm öffnet sich gleich — vielen Dank für deine Nachricht!';
    form.reset();
  });
}
