/**
 * Prime-EPOS — Global JavaScript
 * /assets/js/main.js
 */
(function () {
  'use strict';

  /* Local fallback for blocked or missing external images */
  const fallbackImage = window.location.pathname.includes('/solutions/') || window.location.pathname.includes('/industries/')
    ? '../assets/images/site/epos-hero.png'
    : 'assets/images/site/epos-hero.png';

  document.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      if (img.dataset.fallbackApplied === 'true') return;
      img.dataset.fallbackApplied = 'true';
      img.src = fallbackImage;
      img.classList.add('img-fallback');
    });

    if (img.complete && img.naturalWidth === 0) {
      img.dataset.fallbackApplied = 'true';
      img.src = fallbackImage;
      img.classList.add('img-fallback');
    }
  });

  /* ── SCROLL REVEAL ── */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.07 });
    revealEls.forEach((el) => ro.observe(el));
  }

  /* ── NAV SCROLL ── */
  const nav = document.querySelector('.site-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  /* ── DROPDOWN MENUS (JS-powered, bulletproof) ── */
  const dropdowns = document.querySelectorAll('.has-dropdown');
  let activeDropdown = null;
  let closeTimer = null;

  function openDropdown(li) {
    if (activeDropdown && activeDropdown !== li) closeDropdown(activeDropdown, true);
    clearTimeout(closeTimer);
    li.querySelector('.nav-dropdown').classList.add('open');
    activeDropdown = li;
  }

  function closeDropdown(li, immediate) {
    if (!li) return;
    if (immediate) {
      li.querySelector('.nav-dropdown').classList.remove('open');
      if (activeDropdown === li) activeDropdown = null;
    } else {
      closeTimer = setTimeout(() => {
        li.querySelector('.nav-dropdown').classList.remove('open');
        if (activeDropdown === li) activeDropdown = null;
      }, 150);
    }
  }

  dropdowns.forEach((li) => {
    li.addEventListener('mouseenter', () => openDropdown(li));
    li.addEventListener('mouseleave', () => closeDropdown(li, false));

    // Keep open while mouse is inside dropdown
    const dd = li.querySelector('.nav-dropdown');
    if (dd) {
      dd.addEventListener('mouseenter', () => clearTimeout(closeTimer));
      dd.addEventListener('mouseleave', () => closeDropdown(li, false));
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.has-dropdown')) {
      if (activeDropdown) closeDropdown(activeDropdown, true);
    }
  });

  /* ── MOBILE NAV TOGGLE ── */
  const toggle = document.querySelector('.nav-mobile-toggle');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('nav-mobile-open');
      const isOpen = nav.classList.contains('nav-mobile-open');
      const spans = toggle.querySelectorAll('span');
      spans[0].style.transform = isOpen ? 'translateY(7px) rotate(45deg)' : '';
      spans[1].style.opacity  = isOpen ? '0' : '';
      spans[2].style.transform = isOpen ? 'translateY(-7px) rotate(-45deg)' : '';
    });
    nav.querySelectorAll('.nav-links a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('nav-mobile-open');
        toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }

  /* ── SMOOTH ANCHOR SCROLL ── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = nav ? nav.offsetHeight : 72;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - 16, behavior: 'smooth' });
    });
  });

})();
