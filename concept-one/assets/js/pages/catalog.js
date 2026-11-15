/**
 * Catalog page: keyword search, category + setup filters, sorting, active
 * filter chips, empty state and a mobile filter drawer. State is mirrored in
 * the URL (?q=&category=&setup=&sort=) so filtered views are shareable and
 * category links such as /products/?category=aquascaping-tools work.
 */
import { getCatalog, scoreProduct } from '../modules/data.js';
import { productCard } from '../modules/cards.js';
import { esc, debounce } from '../modules/site.js';

const SORTS = {
  featured: (a, b) => (b.p.featured - a.p.featured) || (b.score - a.score) || a.p.name.localeCompare(b.p.name),
  relevance: (a, b) => (b.score - a.score) || (b.p.featured - a.p.featured) || a.p.name.localeCompare(b.p.name),
  'name-asc': (a, b) => a.p.name.localeCompare(b.p.name),
  'name-desc': (a, b) => b.p.name.localeCompare(a.p.name),
  category: (a, b) => (a.p.categoryData.order - b.p.categoryData.order) || a.p.name.localeCompare(b.p.name)
};

export default async function initCatalog() {
  const $ = (id) => document.getElementById(id);
  const grid = $('catalog-grid');
  const count = $('catalog-count');
  const empty = $('catalog-empty');
  const chips = $('active-filters');
  const qInput = $('catalog-q');
  const sortSelect = $('catalog-sort');
  const catBox = $('filter-categories');
  const setupBox = $('filter-setups');
  const drawer = $('filters');
  const scrim = document.querySelector('[data-scrim]');
  const openBtn = document.querySelector('[data-filters-open]');
  const filterBadge = document.querySelector('[data-filter-count]');
  const applyBtn = document.querySelector('[data-filters-apply]');

  let catalog;
  try {
    catalog = await getCatalog();
  } catch (err) {
    count.textContent = 'Products could not be loaded. Please refresh the page.';
    grid.innerHTML = '';
    console.error(err);
    return;
  }

  // ---- State from URL ----
  const params = new URLSearchParams(location.search);
  const list = (v) => (v ? v.split(',').filter(Boolean) : []);
  const state = {
    q: params.get('q') || '',
    categories: new Set(list(params.get('category')).filter((id) => catalog.categoryById.has(id))),
    setups: new Set(list(params.get('setup')).filter((id) => catalog.setupById.has(id))),
    sort: SORTS[params.get('sort')] ? params.get('sort') : (params.get('q') ? 'relevance' : 'featured')
  };
  qInput.value = state.q;
  if (state.sort === 'relevance' && !sortSelect.querySelector('[value="relevance"]')) addRelevanceOption();
  sortSelect.value = state.sort;

  // ---- Build filter controls (with counts) ----
  const countBy = (key, id) => catalog.products.filter((p) => (key === 'category' ? p.category === id : p.setups?.includes(id))).length;
  catBox.innerHTML = catalog.categories.map((c) => checkbox('category', c.id, c.name, countBy('category', c.id), state.categories.has(c.id))).join('');
  setupBox.innerHTML = catalog.setups.map((s) => checkbox('setup', s.id, s.name, countBy('setup', s.id), state.setups.has(s.id))).join('');

  function checkbox(name, value, label, n, checked) {
    return `<label class="check"><input type="checkbox" name="${name}" value="${esc(value)}" ${checked ? 'checked' : ''}><span>${esc(label)}</span><span class="count" aria-label="${n} products">${n}</span></label>`;
  }

  function addRelevanceOption() {
    const opt = document.createElement('option');
    opt.value = 'relevance';
    opt.textContent = 'Best match';
    sortSelect.prepend(opt);
  }

  // ---- Render ----
  function render() {
    const results = catalog.products
      .map((p) => ({ p, score: scoreProduct(p, state.q, catalog) }))
      .filter(({ p, score }) => score > 0
        && (!state.categories.size || state.categories.has(p.category))
        && (!state.setups.size || [...state.setups].every((s) => p.setups?.includes(s))))
      .sort(SORTS[state.sort] || SORTS.featured);

    grid.innerHTML = results.map(({ p }) => productCard(p, catalog, { headingLevel: 2 })).join('');
    grid.setAttribute('aria-busy', 'false');
    grid.hidden = results.length === 0;
    empty.hidden = results.length !== 0;

    const total = catalog.products.length;
    count.innerHTML = results.length === total
      ? `Showing all <strong>${total}</strong> products`
      : `Showing <strong>${results.length}</strong> of ${total} products${state.q ? ` for “${esc(state.q)}”` : ''}`;

    // Active filter chips
    const chipHtml = [];
    if (state.q) chipHtml.push(chip('q', '', `“${state.q}”`));
    state.categories.forEach((id) => chipHtml.push(chip('category', id, catalog.categoryById.get(id).name)));
    state.setups.forEach((id) => chipHtml.push(chip('setup', id, catalog.setupById.get(id).name)));
    chips.innerHTML = chipHtml.length ? `${chipHtml.join('')}<button type="button" class="btn-text" data-clear-all>Clear all</button>` : '';

    const activeCount = state.categories.size + state.setups.size;
    filterBadge.textContent = activeCount ? `(${activeCount})` : '';
    applyBtn.textContent = `Show ${results.length} product${results.length === 1 ? '' : 's'}`;

    syncURL();
  }

  function chip(type, value, label) {
    return `<button type="button" class="chip chip--remove" data-remove="${type}" data-value="${esc(value)}" aria-label="Remove filter: ${esc(label)}">${esc(label)}</button>`;
  }

  function syncURL() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.categories.size) p.set('category', [...state.categories].join(','));
    if (state.setups.size) p.set('setup', [...state.setups].join(','));
    if (state.sort !== 'featured' && !(state.sort === 'relevance' && state.q)) p.set('sort', state.sort);
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  function reset() {
    state.q = '';
    qInput.value = '';
    state.categories.clear();
    state.setups.clear();
    document.querySelectorAll('#filters input[type="checkbox"]').forEach((c) => { c.checked = false; });
    if (state.sort === 'relevance') { state.sort = 'featured'; sortSelect.value = 'featured'; }
    render();
  }

  // ---- Events ----
  qInput.addEventListener('input', debounce(() => {
    state.q = qInput.value.trim();
    if (state.q && state.sort === 'featured') {
      if (!sortSelect.querySelector('[value="relevance"]')) addRelevanceOption();
      state.sort = 'relevance';
      sortSelect.value = 'relevance';
    }
    render();
  }, 160));

  sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; render(); });

  drawer.addEventListener('change', (e) => {
    const box = e.target.closest('input[type="checkbox"]');
    if (!box) return;
    const set = box.name === 'category' ? state.categories : state.setups;
    box.checked ? set.add(box.value) : set.delete(box.value);
    render();
  });

  chips.addEventListener('click', (e) => {
    if (e.target.closest('[data-clear-all]')) { reset(); qInput.focus(); return; }
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    const { remove, value } = btn.dataset;
    if (remove === 'q') { state.q = ''; qInput.value = ''; }
    else {
      (remove === 'category' ? state.categories : state.setups).delete(value);
      const box = drawer.querySelector(`input[name="${remove}"][value="${CSS.escape(value)}"]`);
      if (box) box.checked = false;
    }
    render();
    (chips.querySelector('[data-remove]') || qInput).focus();
  });

  document.querySelectorAll('[data-filters-reset]').forEach((b) => b.addEventListener('click', reset));

  // ---- Mobile drawer ----
  const setDrawer = (open) => {
    drawer.classList.toggle('is-open', open);
    scrim.classList.toggle('is-visible', open);
    openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
      drawer.setAttribute('aria-labelledby', 'filters-title');
      drawer.querySelector('[data-filters-close]').focus();
    } else {
      drawer.removeAttribute('role');
      drawer.removeAttribute('aria-modal');
      drawer.removeAttribute('aria-labelledby');
    }
  };
  openBtn.addEventListener('click', () => setDrawer(true));
  document.querySelectorAll('[data-filters-close]').forEach((b) => b.addEventListener('click', () => { setDrawer(false); openBtn.focus(); }));
  scrim.addEventListener('click', () => { setDrawer(false); openBtn.focus(); });
  document.addEventListener('keydown', (e) => {
    if (!drawer.classList.contains('is-open')) return;
    if (e.key === 'Escape') { setDrawer(false); openBtn.focus(); }
    if (e.key === 'Tab') { // simple focus trap
      const f = [...drawer.querySelectorAll('button, input, select, a[href]')].filter((el) => el.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setDrawer(false); });

  render();
}
