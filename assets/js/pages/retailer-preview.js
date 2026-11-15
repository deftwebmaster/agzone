/** Demo-only outbound page: explains where a configured retailer link would go. */
import { getCatalog } from '../modules/data.js';
import { productUrl } from '../modules/cards.js';
import { esc, url } from '../modules/site.js';

export default async function initRetailerPreview() {
  const nameEl = document.getElementById('preview-product');
  const back = document.getElementById('preview-back');
  const slug = new URLSearchParams(location.search).get('product');
  if (!slug) return;
  try {
    const catalog = await getCatalog();
    const p = catalog.productBySlug.get(slug);
    if (!p) return;
    nameEl.innerHTML = `You selected <strong>${esc(p.name)}</strong> by ${esc(p.brand)}.`;
    back.href = productUrl(p);
    back.textContent = `Back to ${p.name}`;
  } catch {
    back.href = url('products/');
  }
}
