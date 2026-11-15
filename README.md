# AquaGearZone.com — prototype (work in progress)

Static HTML/CSS/vanilla JS site. No build step: upload the folder to any web host (domain root or a sub-folder).
Local preview: `python3 -m http.server 8765` in this folder, then open http://127.0.0.1:8765/.

## Structure
- `index.html`, `products/`, `products/<slug>/`, `categories/<id>/`, `guides/`, `about/`, policy pages, `404.html`
- `data/products.json` — single source of truth for products, categories, setups and retailers (DEMO data: fictional brands/products)
- `data/guides.json` — guide metadata; `data/image-credits.json` — photo licences (Wikimedia Commons)
- `assets/css/main.css` — design system; `assets/js/main.js` + `modules/` + `pages/` — ES modules
- `assets/js/config.js` — GA4 ID placeholder (empty = analytics disabled) and consent settings

## Adding a product
Add a record to `data/products.json`, add an illustration/photo, then copy any `products/<slug>/index.html`
shell to a new folder and update its slug, `<title>`, description, canonical and OG tags. Add the URL to `sitemap.xml`.

## Status
See the end-of-session summary: guide article pages, apple-touch-icon/logo PNGs, .htaccess and final QA are still to do.
