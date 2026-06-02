/* ══════════════════════════════════════════════
   MAIN.JS — Navigation, Routing, Mobile Toggle, Scroll effects
   ══════════════════════════════════════════════ */

// ── Routing & Navigation ────────────────────────
function showSection(sectionId) {
  const targetSection = document.getElementById(sectionId);
  if (!targetSection) return;

  // Deactivate all sections
  document.querySelectorAll('.section').forEach(sec => {
    sec.classList.remove('active');
  });

  // Activate target section
  targetSection.classList.add('active');

  // Update nav link active state
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-section') === sectionId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Close mobile nav menu if open
  const navLinks = document.querySelector('.nav-links');
  const navToggle = document.getElementById('navToggle');
  if (navLinks && navLinks.classList.contains('open')) {
    navLinks.classList.remove('open');
    if (navToggle) navToggle.classList.remove('active');
  }

  // Scroll to top of the page when changing sections
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// Global navigate function used by onclick attributes
window.navigateTo = function(sectionId) {
  window.location.hash = sectionId;
};

// Listen to hash change for SPA routing
window.addEventListener('hashchange', () => {
  const sectionId = window.location.hash.substring(1) || 'home';
  showSection(sectionId);
});

// ── Mobile Menu Toggle ────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    navToggle.classList.toggle('active');
  });
}

// ── Navbar Scroll Effect ─────────────────────
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ── Initial Page Load ────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const initialSection = window.location.hash.substring(1) || 'home';
  showSection(initialSection);
});
