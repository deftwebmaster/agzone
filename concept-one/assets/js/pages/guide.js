/**
 * Article pages. Enhances static article HTML:
 *  - [data-product-inline="slug"]  → inline product recommendation card
 *  - [data-related-products="a,b"] → product card grid
 *  - [data-related-guides="a,b"]   → guide card grid
 *  - table of contents scroll-spy
 * Each placeholder contains a plain link fallback, so articles still work
 * without JavaScript.
 */
import { getCatalog, getGuides } from '../modules/data.js';
import { productInline, productCard, guideCard } from '../modules/cards.js';

export default async function initGuide() {
  initToc();
  let catalog, guides;
  try {
    [catalog, guides] = await Promise.all([getCatalog(), getGuides()]);
  } catch {
    return; // static fallbacks remain
  }

  document.querySelectorAll('[data-product-inline]').forEach((el) => {
    const p = catalog.productBySlug.get(el.dataset.productInline);
    if (p) el.outerHTML = productInline(p);
  });

  document.querySelectorAll('[data-related-products]').forEach((el) => {
    const items = el.dataset.relatedProducts.split(',').map((s) => catalog.productBySlug.get(s.trim())).filter(Boolean);
    if (items.length) el.innerHTML = items.map((p) => productCard(p, catalog)).join('');
  });

  document.querySelectorAll('[data-related-guides]').forEach((el) => {
    const items = el.dataset.relatedGuides.split(',').map((s) => guides.guideBySlug.get(s.trim())).filter(Boolean);
    if (items.length) el.innerHTML = items.map((g) => guideCard(g, guides)).join('');
  });
}

function initToc() {
  const toc = document.querySelector('[data-toc]');
  if (!toc || !('IntersectionObserver' in window)) return;
  const links = [...toc.querySelectorAll('a[href^="#"]')];
  const targets = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) links.forEach((a) => a.classList.toggle('is-active', a.hash === `#${e.target.id}`));
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  targets.forEach((t) => io.observe(t));
}
