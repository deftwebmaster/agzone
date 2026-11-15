/**
 * Header search with live suggestions (ARIA 1.2 combobox + listbox).
 * Searches the local product catalog and guide index — no backend needed.
 * Submitting the form (Enter with nothing highlighted) opens the catalog
 * filtered by the query: /products/?q=…
 */
import { getCatalog, getGuides, scoreProduct, scoreGuide } from './data.js';
import { esc, url, debounce, photoThumb } from './site.js';
import { productUrl, guideUrl } from './cards.js';

export function initSearch() {
  const form = document.querySelector('[data-search]');
  if (!form) return;
  const input = form.querySelector('[role="combobox"]');
  const list = document.getElementById(input.getAttribute('aria-controls'));
  const status = form.querySelector('[data-search-status]');
  let options = [];
  let active = -1;

  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  };
  const open = () => {
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };
  const highlight = (i) => {
    options.forEach((o, n) => o.setAttribute('aria-selected', String(n === i)));
    active = i;
    if (i >= 0) {
      input.setAttribute('aria-activedescendant', options[i].id);
      options[i].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  };

  const render = async () => {
    const q = input.value.trim();
    if (q.length < 2) { close(); status.textContent = ''; return; }
    let catalog, guides;
    try {
      [catalog, guides] = await Promise.all([getCatalog(), getGuides()]);
    } catch {
      close();
      return;
    }
    if (input.value.trim() !== q) return; // a newer query is in flight

    const products = catalog.products
      .map((p) => [p, scoreProduct(p, q, catalog)])
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([p]) => p);
    const guideHits = guides.guides.filter((g) => scoreGuide(g, q)).slice(0, 2);

    let html = '';
    let n = 0;
    if (products.length) {
      html += '<li class="search-suggest__group" role="presentation">Products</li>';
      html += products.map((p) => `<li class="search-suggest__item" role="option" id="sg-${n++}" aria-selected="false"><a href="${productUrl(p)}" tabindex="-1"><img src="${url(p.image.src)}" alt="" width="44" height="44"><span><strong>${esc(p.name)}</strong><span>${esc(p.brand)} · ${esc(p.categoryData?.shortName)}</span></span></a></li>`).join('');
    }
    if (guideHits.length) {
      html += '<li class="search-suggest__group" role="presentation">Guides</li>';
      html += guideHits.map((g) => `<li class="search-suggest__item" role="option" id="sg-${n++}" aria-selected="false"><a href="${guideUrl(g)}" tabindex="-1"><img class="is-photo" src="${photoThumb(g.photo)}" alt="" width="44" height="44"><span><strong>${esc(g.title)}</strong><span>${esc(g.type)} · ${g.readingMinutes} min read</span></span></a></li>`).join('');
    }
    if (!products.length && !guideHits.length) {
      html += `<li class="search-suggest__empty" role="presentation">No matches for “${esc(q)}”. Try “filter”, “shrimp” or “tweezers”.</li>`;
    }
    html += `<li class="search-suggest__all" role="option" id="sg-${n++}" aria-selected="false"><a href="${url('products/')}?q=${encodeURIComponent(q)}" tabindex="-1">See all product results for “${esc(q)}” →</a></li>`;

    list.innerHTML = html;
    options = [...list.querySelectorAll('[role="option"]')];
    active = -1;
    open();
    const count = products.length + guideHits.length;
    status.textContent = count ? `${count} suggestion${count === 1 ? '' : 's'} available. Use up and down arrows to review.` : 'No suggestions.';
  };

  const debounced = debounce(render, 120);
  input.addEventListener('input', debounced);
  input.addEventListener('focus', () => { getCatalog().catch(() => {}); if (input.value.trim().length >= 2) render(); });

  input.addEventListener('keydown', (e) => {
    const isOpen = !list.hidden && options.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) { render(); return; }
      highlight(active < options.length - 1 ? active + 1 : 0);
    } else if (e.key === 'ArrowUp') {
      if (!isOpen) return;
      e.preventDefault();
      highlight(active > 0 ? active - 1 : options.length - 1);
    } else if (e.key === 'Enter') {
      if (isOpen && active >= 0) {
        e.preventDefault();
        window.location.href = options[active].querySelector('a').href;
      }
    } else if (e.key === 'Escape') {
      if (!list.hidden) { e.preventDefault(); e.stopPropagation(); close(); }
      else if (input.value) { input.value = ''; }
    }
  });

  list.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in input while clicking
  document.addEventListener('click', (e) => { if (!form.contains(e.target)) close(); });

  form.addEventListener('submit', (e) => {
    if (!input.value.trim()) { e.preventDefault(); input.focus(); }
  });
}
