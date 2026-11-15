/** Home page: renders featured products from data/products.json (featured: true). */
import { getCatalog } from '../modules/data.js';
import { productCard } from '../modules/cards.js';

export default async function initHome() {
  const grid = document.getElementById('featured-products');
  if (!grid) return;
  try {
    const catalog = await getCatalog();
    const featured = catalog.products.filter((p) => p.featured).slice(0, 8);
    grid.innerHTML = featured.map((p) => productCard(p, catalog)).join('');
    grid.setAttribute('aria-busy', 'false');
  } catch (err) {
    grid.innerHTML = '<li class="notice">Featured products could not be loaded. <a href="products/">Browse the full catalog</a>.</li>';
    console.error(err);
  }
}
