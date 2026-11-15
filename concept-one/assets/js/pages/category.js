/** Category landing page: renders products for <body data-category="…"> with sorting. */
import { getCatalog } from '../modules/data.js';
import { productCard } from '../modules/cards.js';

export default async function initCategory() {
  const id = document.body.dataset.category;
  const grid = document.getElementById('category-grid');
  const count = document.getElementById('category-count');
  const sort = document.getElementById('category-sort');
  if (!grid) return;

  let catalog;
  try {
    catalog = await getCatalog();
  } catch (err) {
    count.textContent = 'Products could not be loaded. Please refresh the page.';
    grid.innerHTML = '';
    return;
  }
  const items = catalog.products.filter((p) => p.category === id);

  const render = () => {
    const sorted = [...items].sort(sort.value === 'name-asc'
      ? (a, b) => a.name.localeCompare(b.name)
      : sort.value === 'name-desc'
        ? (a, b) => b.name.localeCompare(a.name)
        : (a, b) => (b.featured - a.featured) || a.name.localeCompare(b.name));
    grid.innerHTML = sorted.map((p) => productCard(p, catalog, { headingLevel: 3 })).join('');
    grid.setAttribute('aria-busy', 'false');
  };
  count.innerHTML = `<strong>${items.length}</strong> product${items.length === 1 ? '' : 's'} in this category`;
  sort.addEventListener('change', render);
  render();
}
