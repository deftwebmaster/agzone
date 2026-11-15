/**
 * Reusable HTML templates for product and guide cards.
 * Every product card links to /products/<slug>/.
 */
import { esc, url, photoSrc, photoSrcset } from './site.js';
import { icons } from './icons.js';

export const productUrl = (p) => url(`products/${p.slug}/`);
export const guideUrl = (g) => url(`guides/${g.slug}/`);
export const categoryUrl = (id) => url(`categories/${id}/`);

export function productCard(p, catalog, { headingLevel = 3, eager = false } = {}) {
  const h = `h${headingLevel}`;
  const setups = (p.setups || []).slice(0, 2).map((id) => catalog.setupById.get(id)?.name.replace(/\s*\(.*\)/, '')).filter(Boolean);
  return `<li>
  <article class="product-card">
    <div class="product-card__media">
      <span class="product-card__tag pill pill--light">${esc(p.categoryData?.shortName || '')}</span>
      <img src="${url(p.image.src)}" alt="${esc(p.image.alt)}" width="800" height="600" ${eager ? '' : 'loading="lazy"'} decoding="async">
    </div>
    <div class="product-card__body">
      <p class="product-card__brand">${esc(p.brand)}</p>
      <${h} class="product-card__title"><a href="${productUrl(p)}">${esc(p.name)}</a></${h}>
      <p class="product-card__desc">${esc(p.summary)}</p>
      <div class="product-card__foot">
        <span class="product-card__cta" aria-hidden="true">View details ${icons.arrow}</span>
        ${setups.length ? `<span class="product-card__setups">${esc(setups.join(' · '))}</span>` : ''}
      </div>
    </div>
  </article>
</li>`;
}

export function skeletonCards(n = 4) {
  return Array.from({ length: n }, () => '<li aria-hidden="true"><div class="skeleton skeleton-card"></div></li>').join('');
}

export function guideCard(g, guides, { headingLevel = 3 } = {}) {
  const h = `h${headingLevel}`;
  const topic = guides.topicById.get(g.topic)?.name || '';
  return `<li>
  <article class="guide-card">
    <div class="guide-card__media"><img src="${photoSrc(g.photo, 800)}" srcset="${photoSrcset(g.photo)}" sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" alt="${esc(g.photoAlt)}" width="800" height="500" loading="lazy" decoding="async"></div>
    <div class="guide-card__body">
      <div class="guide-card__meta"><span class="pill">${esc(topic)}</span><span>${esc(g.type)}</span><span>${g.readingMinutes} min read</span></div>
      <${h} class="guide-card__title"><a href="${guideUrl(g)}">${esc(g.title)}</a></${h}>
      <p class="guide-card__desc">${esc(g.description)}</p>
      <span class="link-arrow" aria-hidden="true">Read guide</span>
    </div>
  </article>
</li>`;
}

export function productInline(p) {
  return `<div class="product-inline">
  <div class="product-inline__media"><img src="${url(p.image.src)}" alt="" width="800" height="600" loading="lazy" decoding="async"></div>
  <div>
    <span class="product-inline__brand">${esc(p.brand)} · ${esc(p.categoryData?.shortName || '')}</span>
    <span class="product-inline__title"><a href="${productUrl(p)}">${esc(p.name)}</a></span>
    <span class="product-inline__desc">${esc(p.summary)}</span>
  </div>
  <span class="product-inline__cta" aria-hidden="true">View details →</span>
</div>`;
}
