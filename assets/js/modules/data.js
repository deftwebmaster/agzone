/**
 * Data access for products and guides. Each JSON file is fetched once per page
 * and cached. Lookups (by slug, by category) are pre-computed on load.
 */
import { url } from './site.js';

let catalogPromise;
let guidesPromise;

async function getJSON(path) {
  const res = await fetch(url(path), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
  return res.json();
}

export function getCatalog() {
  catalogPromise ??= getJSON('data/products.json').then((data) => {
    const categoryById = new Map(data.categories.map((c, i) => [c.id, { ...c, order: i }]));
    const setupById = new Map(data.setups.map((s) => [s.id, s]));
    const retailerById = new Map(data.retailers.map((r) => [r.id, r]));
    const products = data.products.map((p) => ({ ...p, categoryData: categoryById.get(p.category) }));
    const productBySlug = new Map(products.map((p) => [p.slug, p]));
    return { ...data, products, categoryById, setupById, retailerById, productBySlug };
  });
  return catalogPromise;
}

export function getGuides() {
  guidesPromise ??= getJSON('data/guides.json').then((data) => {
    const topicById = new Map(data.topics.map((t) => [t.id, t]));
    const guideBySlug = new Map(data.guides.map((g) => [g.slug, g]));
    return { ...data, topicById, guideBySlug };
  });
  return guidesPromise;
}

/* ---------- Search ---------- */
const normalise = (s) => String(s ?? '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** Builds (and memoises) a lowercase search index string per product. */
const indexCache = new WeakMap();
function productIndex(p, catalog) {
  if (!indexCache.has(p)) {
    const setups = (p.setups || []).map((id) => catalog.setupById.get(id)?.name);
    indexCache.set(p, {
      name: normalise(p.name),
      brand: normalise(p.brand),
      tags: normalise((p.tags || []).join(' ')),
      rest: normalise([p.categoryData?.name, p.summary, p.description, ...setups, ...(p.features || [])].join(' '))
    });
  }
  return indexCache.get(p);
}

/** Returns a relevance score (0 = no match). Every term must match somewhere. */
export function scoreProduct(p, query, catalog) {
  const terms = normalise(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;
  const idx = productIndex(p, catalog);
  let score = 0;
  for (const term of terms) {
    const stem = term.length > 4 ? term.replace(/(es|s)$/, '') : term;
    let s = 0;
    if (idx.name.includes(stem)) s += idx.name.startsWith(stem) ? 6 : 4;
    if (idx.brand.includes(stem)) s += 3;
    if (idx.tags.includes(stem)) s += 3;
    if (idx.rest.includes(stem)) s += 1;
    if (!s) return 0;
    score += s;
  }
  return score;
}

export function scoreGuide(g, query) {
  const terms = normalise(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return 0;
  const hay = normalise(`${g.title} ${g.description}`);
  return terms.every((t) => hay.includes(t.length > 4 ? t.replace(/(es|s)$/, '') : t)) ? 1 : 0;
}
