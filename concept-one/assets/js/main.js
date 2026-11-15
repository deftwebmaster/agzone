/**
 * AquaGearZone — entry point.
 * Loads shared behaviour on every page, then the page-specific module named by
 * <body data-page="…">. Page modules live in ./pages/ and export a default init().
 */
import { initHeader } from './modules/header.js';
import { initSearch } from './modules/search.js';
import { initAnalytics } from './modules/analytics.js';

const pages = {
  home: () => import('./pages/home.js'),
  catalog: () => import('./pages/catalog.js'),
  category: () => import('./pages/category.js'),
  product: () => import('./pages/product.js'),
  guides: () => import('./pages/guides.js'),
  guide: () => import('./pages/guide.js'),
  'retailer-preview': () => import('./pages/retailer-preview.js')
};

initHeader();
initSearch();
initAnalytics();

const page = document.body.dataset.page;
if (pages[page]) {
  pages[page]()
    .then((m) => m.default())
    .catch((err) => console.error(`[AGZ] Failed to initialise "${page}" page`, err));
}

// Gentle reveal-on-scroll for elements marked .reveal (disabled for reduced motion via CSS).
const reveals = document.querySelectorAll('.reveal');
if (reveals.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-visible'));
}
