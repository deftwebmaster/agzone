/**
 * Product detail page. The page shell (/products/<slug>/index.html) holds the
 * static <head> metadata; everything in <main> is rendered from
 * data/products.json so product content is maintained in one place.
 *
 * Renders: breadcrumbs, gallery, summary, retailer box, overview/features,
 * specifications, suitable setups, pros & limitations, related guides and
 * related products. Injects Product + BreadcrumbList JSON-LD (no prices,
 * ratings or availability are ever emitted).
 */
import { getCatalog, getGuides } from '../modules/data.js';
import { productCard, guideCard, categoryUrl, productUrl } from '../modules/cards.js';
import { esc, url, absoluteUrl, photoSrc, photoSrcset } from '../modules/site.js';
import { icons } from '../modules/icons.js';
import { track, analyticsConfig } from '../modules/analytics.js';
import { SITE_CONFIG } from '../config.js';

export default async function initProduct() {
  const main = document.querySelector('[data-product-slug]');
  const slug = main?.dataset.productSlug;
  let catalog, guides;
  try {
    [catalog, guides] = await Promise.all([getCatalog(), getGuides()]);
  } catch (err) {
    main.innerHTML = `<div class="container section"><div class="empty-state"><h1>Product unavailable</h1><p>We couldn't load this product right now. Please refresh, or <a href="${url('products/')}">browse the catalog</a>.</p></div></div>`;
    return;
  }
  const p = catalog.productBySlug.get(slug);
  if (!p) {
    main.innerHTML = `<div class="container section"><div class="empty-state"><h1>Product not found</h1><p>This product may have been renamed or removed. <a href="${url('products/')}">Browse all products</a>.</p></div></div>`;
    return;
  }

  const cat = p.categoryData;
  const images = buildImages(p);
  const relatedGuides = (p.relatedGuides || []).map((s) => guides.guideBySlug.get(s)).filter(Boolean);
  const related = relatedProducts(p, catalog);
  const quick = Object.entries(p.specs || {}).slice(0, 3);

  main.innerHTML = `
  <div class="container">
    <nav class="breadcrumbs" aria-label="Breadcrumb" style="margin-top:1.5rem">
      <ol>
        <li><a href="${url('')}">Home</a></li>
        <li><a href="${url('products/')}">Products</a></li>
        <li><a href="${categoryUrl(cat.id)}">${esc(cat.name)}</a></li>
        <li><span aria-current="page">${esc(p.name)}</span></li>
      </ol>
    </nav>

    <div class="product-hero">
      ${galleryHTML(images)}
      <div class="product-info">
        <p class="product-info__brand">${esc(p.brand)}</p>
        <h1>${esc(p.name)}</h1>
        <p class="product-info__summary">${esc(p.summary)}</p>
        <div class="product-info__pills">
          <a class="pill" href="${categoryUrl(cat.id)}">${esc(cat.name)}</a>
          ${(p.setups || []).map((s) => `<span class="pill pill--light">${esc(catalog.setupById.get(s)?.name)}</span>`).join('')}
        </div>
        ${quick.length ? `<dl class="quick-specs">${quick.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
        ${buyBox(p, catalog)}
        ${p.demo ? `<div class="notice notice--demo mt-2" role="note">${icons.info}<p><strong>Demonstration listing.</strong> The brand, specifications and retailer details on this page are placeholder content for the AquaGearZone prototype and do not describe a real product.</p></div>` : ''}
      </div>
    </div>
  </div>

  <nav class="subnav" aria-label="Product sections">
    <div class="container"><ul>
      <li><a href="#overview">Overview</a></li>
      <li><a href="#specifications">Specifications</a></li>
      <li><a href="#setups">Suitable setups</a></li>
      <li><a href="#pros-limitations">Pros &amp; limitations</a></li>
      ${relatedGuides.length ? '<li><a href="#guides">Buying guides</a></li>' : ''}
      ${related.length ? '<li><a href="#related">Related products</a></li>' : ''}
    </ul></div>
  </nav>

  <div class="container">
    <section class="detail-section detail-grid" id="overview" aria-labelledby="overview-title">
      <div class="prose-sm">
        <h2 id="overview-title">Overview</h2>
        <p>${esc(p.description)}</p>
        <p class="basis-note">AquaGearZone does not sell this product. Information is compiled from manufacturer documentation and specifications; it is not the result of hands-on testing.</p>
      </div>
      <div>
        <h3>Key features</h3>
        <ul class="product-feature-list">${(p.features || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      </div>
    </section>

    <section class="detail-section detail-grid" id="specifications" aria-labelledby="specs-title">
      <div>
        <h2 id="specs-title">Specifications</h2>
        <p class="prose-sm" style="color:var(--ink-2)">Dimensions and capacities are approximate. Always confirm critical measurements — such as intake diameter or glass thickness — on the retailer's listing before buying.</p>
      </div>
      <div class="spec-table"><table>
        <caption class="sr-only">Specifications for ${esc(p.name)}</caption>
        <tbody>
          <tr><th scope="row">Brand</th><td>${esc(p.brand)}</td></tr>
          ${Object.entries(p.specs || {}).map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}
          <tr><th scope="row">Category</th><td><a href="${categoryUrl(cat.id)}">${esc(cat.name)}</a></td></tr>
        </tbody>
      </table></div>
    </section>

    <section class="detail-section detail-grid" id="setups" aria-labelledby="setups-title">
      <div>
        <h2 id="setups-title">Suitable setups</h2>
        <p style="color:var(--ink-2)">Where this equipment fits best, based on its size and documented features.</p>
        ${tankNote(p)}
      </div>
      <ul class="use-list">${(p.suitableFor || []).map((s) => `<li>${icons.check}<span>${esc(s)}</span></li>`).join('')}</ul>
    </section>

    <section class="detail-section" id="pros-limitations" aria-labelledby="pl-title">
      <h2 id="pl-title">Pros &amp; limitations</h2>
      <div class="proscons">
        <div class="pros"><h3>${icons.plus} Pros</h3><ul>${(p.pros || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="cons"><h3>${icons.minus} Limitations</h3><ul>${(p.limitations || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>
      <p class="basis-note">Pros and limitations are drawn from the product's documented features and specifications, not from independent testing.</p>
    </section>

    ${relatedGuides.length ? `<section class="detail-section" id="guides" aria-labelledby="guides-title">
      <div class="section-head"><div><p class="eyebrow">Learn more</p><h2 id="guides-title">Relevant buying guides</h2></div><a class="link-arrow" href="${url('guides/')}">All guides</a></div>
      <ul class="guide-grid">${relatedGuides.map((g) => guideCard(g, guides)).join('')}</ul>
    </section>` : ''}

    ${related.length ? `<section class="detail-section" id="related" aria-labelledby="related-title">
      <div class="section-head"><div><p class="eyebrow">Keep exploring</p><h2 id="related-title">Related products</h2></div><a class="link-arrow" href="${categoryUrl(cat.id)}">More ${esc(cat.shortName.toLowerCase())} gear</a></div>
      <ul class="product-grid">${related.map((r) => productCard(r, catalog)).join('')}</ul>
    </section>` : ''}
  </div>`;

  initGallery(main.querySelector('[data-gallery]'), images);
  initSubnav(main.querySelector('.subnav'));
  injectStructuredData(p, cat, images);

  if (analyticsConfig.trackProductViews) {
    track('view_item', { items: [{ item_id: p.id, item_name: p.name, item_brand: p.brand, item_category: cat.name }] });
  }
}

/* ---------- builders ---------- */
function buildImages(p) {
  const main = { src: url(p.image.src), alt: p.image.alt, caption: 'Product illustration — representative artwork, not a photograph of the product.', kind: 'illustration' };
  const extra = (p.gallery || []).map((g) => g.photo
    ? { src: photoSrc(g.photo, 1200), srcset: photoSrcset(g.photo), thumb: url(`assets/images/photos/${g.photo}-thumb.webp`), alt: g.alt, caption: g.caption, kind: 'photo' }
    : { src: url(g.src), alt: g.alt, caption: g.caption, kind: 'illustration' });
  return [main, ...extra];
}

function galleryHTML(images) {
  const first = images[0];
  const multi = images.length > 1;
  return `<div class="gallery" data-gallery>
    <figure class="gallery__stage" aria-roledescription="image gallery">
      <span class="gallery__label pill pill--light" data-gallery-label>${first.kind === 'photo' ? 'Context photo' : 'Illustration'}</span>
      <img data-gallery-main src="${first.src}" alt="${esc(first.alt)}" width="800" height="600" fetchpriority="high" decoding="async">
      ${multi ? `<button class="gallery__nav gallery__nav--prev" type="button" data-gallery-prev aria-label="Previous image">${icons.arrowLeft}</button>
      <button class="gallery__nav gallery__nav--next" type="button" data-gallery-next aria-label="Next image">${icons.arrow}</button>` : ''}
    </figure>
    <p class="gallery__caption" data-gallery-caption aria-live="polite">${esc(first.caption)}</p>
    ${multi ? `<ul class="gallery__thumbs" aria-label="Choose an image">
      ${images.map((im, i) => `<li><button class="gallery__thumb" type="button" data-index="${i}" aria-label="Image ${i + 1} of ${images.length}: ${esc(im.caption || im.alt)}" ${i === 0 ? 'aria-current="true"' : ''}><img class="${im.kind === 'photo' ? 'is-photo' : ''}" src="${im.thumb || im.src}" alt="" width="86" height="64" loading="lazy" decoding="async"></button></li>`).join('')}
    </ul>` : ''}
  </div>`;
}

function buyBox(p, catalog) {
  const offers = p.offers?.length ? p.offers : [{ retailer: 'demo', url: null, affiliate: false }];
  const anyAffiliate = offers.some((o) => o.url && o.affiliate);
  const anyDemo = offers.some((o) => !o.url);
  const rows = offers.map((o) => {
    const r = catalog.retailerById.get(o.retailer) || { name: o.retailer };
    const common = `data-track="outbound" data-product-id="${esc(p.id)}" data-product-name="${esc(p.name)}" data-retailer="${esc(r.name)}"`;
    const link = o.url
      ? `<a class="btn btn--primary btn--block" href="${esc(o.url)}" target="_blank" rel="${o.affiliate ? 'sponsored ' : ''}noopener noreferrer" ${common}>View at ${esc(r.name)} ${icons.external}<span class="sr-only"> (opens in a new tab)</span></a>`
      : `<a class="btn btn--primary btn--block" href="${url('retailer-preview/')}?product=${encodeURIComponent(p.slug)}" rel="nofollow" ${common} data-demo="true">View at Retailer ${icons.arrow}</a>`;
    return `<div class="offer">
      <div class="offer__retailer"><span>Retailer: <strong>${esc(o.url ? r.name : 'Not yet linked (demo)')}</strong></span><span>Price shown at retailer</span></div>
      ${link}
    </div>`;
  }).join('');

  return `<section class="buy-box" id="where-to-buy" aria-labelledby="buy-title">
    <div class="buy-box__head"><h2 id="buy-title">Where to buy</h2>${anyDemo ? '<span class="pill pill--demo">Demo link</span>' : ''}</div>
    ${rows}
    <p class="buy-box__note"><strong>AquaGearZone doesn't sell products or take orders.</strong> Purchases, current pricing, shipping and returns are handled entirely on the retailer's website.</p>
    ${anyAffiliate ? `<p class="buy-box__note">Affiliate disclosure: we may earn a commission if you buy through this link, at no extra cost to you. <a href="${url('affiliate-disclosure/')}">How this works</a>.</p>` : ''}
    ${anyDemo ? '<p class="buy-box__note">Prototype: no retailer has been connected to this listing. The button opens a preview page instead of a store.</p>' : ''}
  </section>`;
}

function tankNote(p) {
  const t = p.tankSize || {};
  let size = '';
  if (t.minGallons && t.maxGallons) size = t.minGallons === t.maxGallons ? `${t.minGallons} US gallons` : `About ${t.minGallons}–${t.maxGallons} US gallons`;
  else if (t.maxGallons) size = `Up to ${t.maxGallons} US gallons`;
  if (!size && !t.note) return '';
  return `<div class="tank-note">${icons.tank}<div>${size ? `<strong>Suggested tank size: ${esc(size)}</strong>` : ''}${t.note ? `<span>${esc(t.note)}</span>` : ''}</div></div>`;
}

function relatedProducts(p, catalog) {
  const sameCat = catalog.products.filter((x) => x.slug !== p.slug && x.category === p.category);
  const shared = catalog.products
    .filter((x) => x.slug !== p.slug && x.category !== p.category)
    .map((x) => ({ x, n: (x.setups || []).filter((s) => p.setups?.includes(s)).length + (x.featured ? 0.5 : 0) }))
    .sort((a, b) => b.n - a.n)
    .map(({ x }) => x);
  return [...sameCat, ...shared].slice(0, 4);
}

/* ---------- interactions ---------- */
function initGallery(root, images) {
  if (!root || images.length < 2) return;
  const main = root.querySelector('[data-gallery-main]');
  const caption = root.querySelector('[data-gallery-caption]');
  const label = root.querySelector('[data-gallery-label]');
  const thumbs = [...root.querySelectorAll('.gallery__thumb')];
  let index = 0;

  const show = (i, focusThumb = false) => {
    index = (i + images.length) % images.length;
    const im = images[index];
    main.classList.add('is-fading');
    const swap = () => {
      main.classList.toggle('is-photo', im.kind === 'photo');
      if (im.srcset) { main.srcset = im.srcset; main.sizes = '(min-width: 900px) 55vw, 100vw'; } else { main.removeAttribute('srcset'); main.removeAttribute('sizes'); }
      main.src = im.src;
      main.alt = im.alt;
      caption.textContent = im.caption || '';
      label.textContent = im.kind === 'photo' ? 'Context photo' : 'Illustration';
      main.classList.remove('is-fading');
    };
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? swap() : setTimeout(swap, 150);
    thumbs.forEach((t, n) => (n === index ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current')));
    if (focusThumb) thumbs[index].focus();
  };

  thumbs.forEach((t) => t.addEventListener('click', () => show(Number(t.dataset.index))));
  root.querySelector('[data-gallery-prev]').addEventListener('click', () => show(index - 1));
  root.querySelector('[data-gallery-next]').addEventListener('click', () => show(index + 1));
  root.querySelector('.gallery__thumbs').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1, true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1, true); }
  });

  // Touch swipe on the main image
  let startX = null;
  const stage = root.querySelector('.gallery__stage');
  stage.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') startX = e.clientX; });
  stage.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
}

function initSubnav(nav) {
  if (!nav || !('IntersectionObserver' in window)) return;
  const links = [...nav.querySelectorAll('a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
      const active = nav.querySelector('.is-active');
      active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  sections.forEach((s) => io.observe(s));
}

function injectStructuredData(p, cat, images) {
  const origin = SITE_CONFIG.siteUrl;
  const pageUrl = absoluteUrl(`products/${p.slug}/`, origin);
  const imageUrls = [absoluteUrl(p.image.src, origin)];
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${pageUrl}#product`,
        name: p.name,
        description: p.description,
        sku: p.id,
        category: cat.name,
        url: pageUrl,
        image: imageUrls,
        brand: { '@type': 'Brand', name: p.brand },
        additionalProperty: Object.entries(p.specs || {}).map(([name, value]) => ({ '@type': 'PropertyValue', name, value }))
        // Intentionally no offers, price, availability, review or aggregateRating:
        // add offers only when real, maintained retailer pricing exists.
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('', origin) },
          { '@type': 'ListItem', position: 2, name: 'Products', item: absoluteUrl('products/', origin) },
          { '@type': 'ListItem', position: 3, name: cat.name, item: absoluteUrl(`categories/${cat.id}/`, origin) },
          { '@type': 'ListItem', position: 4, name: p.name, item: pageUrl }
        ]
      }
    ]
  };
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
}

export { productUrl };
