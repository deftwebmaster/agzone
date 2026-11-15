/**
 * Shared helpers: site root resolution, URL building and HTML escaping.
 * The site root is derived from this file's location, so the site works at a
 * domain root or inside a sub-folder without configuration.
 */
const ROOT = new URL('../../../', import.meta.url);

/** Root-relative path for an internal resource, e.g. url('products/') -> '/products/'. */
export function url(path = '') {
  const u = new URL(path, ROOT);
  return u.pathname + u.search + u.hash;
}

/** Absolute URL (used for structured data). */
export function absoluteUrl(path = '', origin) {
  if (origin) {
    const rootPath = ROOT.pathname;
    return origin.replace(/\/$/, '') + new URL(path, ROOT).pathname.replace(rootPath, '/');
  }
  return new URL(path, ROOT).href;
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** Responsive srcset for a locally stored photo (all photos ship 480/800/1200 widths). */
export function photoSrcset(name, widths = [480, 800, 1200]) {
  return widths.map((w) => `${url(`assets/images/photos/${name}-${w}.webp`)} ${w}w`).join(', ');
}
export const photoSrc = (name, w = 800) => url(`assets/images/photos/${name}-${w}.webp`);
export const photoThumb = (name) => url(`assets/images/photos/${name}-thumb.webp`);

export function debounce(fn, wait = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
