/**
 * Guides archive: featured guide + filterable card grid rendered from
 * data/guides.json. Adding a guide = add a metadata entry there and create
 * /guides/<slug>/index.html from the article template.
 */
import { getGuides } from '../modules/data.js';
import { guideCard, guideUrl } from '../modules/cards.js';
import { esc, photoSrc, photoSrcset } from '../modules/site.js';

export default async function initGuides() {
  const featuredEl = document.getElementById('guide-featured');
  const grid = document.getElementById('guide-grid');
  const filters = document.getElementById('guide-topics');
  const status = document.getElementById('guide-status');
  let data;
  try {
    data = await getGuides();
  } catch {
    status.textContent = 'Guides could not be loaded. Please refresh the page.';
    return;
  }
  const guides = [...data.guides].sort((a, b) => b.published.localeCompare(a.published));
  const featured = guides.find((g) => g.featured) || guides[0];

  featuredEl.innerHTML = `<article class="guide-feature">
    <div class="guide-feature__media"><img src="${photoSrc(featured.photo, 1200)}" srcset="${photoSrcset(featured.photo, [480, 800, 1200, 1800])}" sizes="(min-width: 820px) 55vw, 100vw" alt="${esc(featured.photoAlt)}" width="1200" height="800" decoding="async"></div>
    <div class="guide-feature__body">
      <div class="guide-card__meta"><span class="pill pill--navy">Featured</span><span>${esc(data.topicById.get(featured.topic)?.name)}</span><span>${featured.readingMinutes} min read</span></div>
      <h2><a href="${guideUrl(featured)}">${esc(featured.title)}</a></h2>
      <p>${esc(featured.description)}</p>
      <span class="link-arrow" aria-hidden="true">Read the guide</span>
    </div>
  </article>`;

  const params = new URLSearchParams(location.search);
  let topic = data.topicById.has(params.get('topic')) ? params.get('topic') : 'all';

  const topicCount = (id) => guides.filter((g) => g.topic === id).length;
  filters.innerHTML = [{ id: 'all', name: 'All guides', n: guides.length }, ...data.topics.map((t) => ({ ...t, n: topicCount(t.id) }))]
    .map((t) => `<li><button type="button" class="chip" data-topic="${t.id}" aria-pressed="${t.id === topic}">${esc(t.name)} <span aria-hidden="true">· ${t.n}</span></button></li>`).join('');

  const render = () => {
    const list = guides.filter((g) => topic === 'all' || g.topic === topic);
    grid.innerHTML = list.map((g) => guideCard(g, data)).join('');
    status.textContent = `${list.length} guide${list.length === 1 ? '' : 's'}${topic === 'all' ? '' : ` in ${data.topicById.get(topic).name}`}`;
    filters.querySelectorAll('[data-topic]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.topic === topic)));
    const qs = topic === 'all' ? location.pathname : `?topic=${topic}`;
    history.replaceState(null, '', qs);
  };
  filters.addEventListener('click', (e) => {
    const b = e.target.closest('[data-topic]');
    if (!b) return;
    topic = b.dataset.topic;
    render();
  });
  render();
}
