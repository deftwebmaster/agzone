/**
 * Header behaviour: category mega-menu (disclosure pattern), mobile navigation
 * drawer and mobile search toggle. All controls are real <button>s with
 * aria-expanded kept in sync; Escape closes whatever is open.
 */
const desktopQuery = window.matchMedia('(min-width: 1024px)');
const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

export function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  initMenus(header);
  initMobileNav(header);
  initSearchToggle(header);
}

function initMenus(header) {
  header.querySelectorAll('[data-menu]').forEach((item) => {
    const button = item.querySelector('[data-menu-toggle]');
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    let hoverTimer;

    const set = (open) => {
      button.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
    };
    const isOpen = () => button.getAttribute('aria-expanded') === 'true';

    button.addEventListener('click', () => set(!isOpen()));

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) {
        set(false);
        button.focus();
      }
    });

    // Close when focus leaves the menu item (desktop only; mobile keeps it open inside the drawer).
    item.addEventListener('focusout', (e) => {
      if (desktopQuery.matches && !item.contains(e.relatedTarget)) set(false);
    });

    document.addEventListener('click', (e) => {
      if (desktopQuery.matches && isOpen() && !item.contains(e.target)) set(false);
    });

    // Hover intent on pointer devices with a desktop layout.
    item.addEventListener('mouseenter', () => {
      if (!desktopQuery.matches || !hoverQuery.matches) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => set(true), 80);
    });
    item.addEventListener('mouseleave', () => {
      if (!desktopQuery.matches || !hoverQuery.matches) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => set(false), 180);
    });
  });
}

function initMobileNav(header) {
  const toggle = header.querySelector('[data-nav-toggle]');
  const nav = document.getElementById(toggle?.getAttribute('aria-controls'));
  if (!toggle || !nav) return;

  const set = (open) => {
    if (open) nav.style.setProperty('--nav-top', `${header.getBoundingClientRect().bottom}px`);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.querySelector('[data-icon-open]').hidden = open;
    toggle.querySelector('[data-icon-close]').hidden = !open;
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (open) closeSearch(header);
  };

  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      set(false);
      toggle.focus();
    }
  });
  desktopQuery.addEventListener('change', (e) => { if (e.matches) set(false); });
  // Close the drawer after following an in-page link.
  nav.addEventListener('click', (e) => { if (e.target.closest('a') && !desktopQuery.matches) set(false); });
}

function closeSearch(header) {
  const btn = header.querySelector('[data-search-toggle]');
  const form = header.querySelector('[data-search]');
  if (!btn || !form) return;
  btn.setAttribute('aria-expanded', 'false');
  form.classList.remove('is-open');
}

function initSearchToggle(header) {
  const btn = header.querySelector('[data-search-toggle]');
  const form = header.querySelector('[data-search]');
  if (!btn || !form) return;
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    form.classList.toggle('is-open', open);
    if (open) {
      const navToggle = header.querySelector('[data-nav-toggle]');
      if (navToggle?.getAttribute('aria-expanded') === 'true') navToggle.click();
      form.querySelector('input')?.focus();
    }
  });
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && form.classList.contains('is-open') && !desktopQuery.matches) {
      const list = form.querySelector('[role="listbox"]');
      if (list && !list.hidden) return; // let search handle closing suggestions first
      closeSearch(header);
      btn.focus();
    }
  });
}
