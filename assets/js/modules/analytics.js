/**
 * Privacy-first analytics wrapper.
 *
 * Nothing is loaded or recorded unless BOTH:
 *   1. SITE_CONFIG.analytics.ga4MeasurementId is set, and
 *   2. consent has been granted (when requireConsent is true).
 *
 * Consent hook for a future cookie banner / CMP:
 *   window.AGZConsent.grant()   // stores consent, loads GA4
 *   window.AGZConsent.revoke()  // clears consent; reload stops tracking
 *   window.AGZConsent.status()  // 'granted' | 'denied' | 'unset'
 *
 * Pages call track(eventName, params). Outbound retailer clicks are captured
 * automatically from links marked data-track="outbound".
 */
import { SITE_CONFIG } from '../config.js';

const cfg = SITE_CONFIG.analytics || {};
const CONSENT_KEY = 'agz-analytics-consent';
let loaded = false;

function readConsent() {
  try { return localStorage.getItem(CONSENT_KEY) || 'unset'; } catch { return 'unset'; }
}
function writeConsent(value) {
  try { value ? localStorage.setItem(CONSENT_KEY, value) : localStorage.removeItem(CONSENT_KEY); } catch { /* storage unavailable */ }
}

const configured = () => Boolean(cfg.ga4MeasurementId);
const allowed = () => configured() && (!cfg.requireConsent || readConsent() === 'granted');

function loadGA() {
  if (loaded || !allowed()) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', cfg.ga4MeasurementId);
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.ga4MeasurementId)}`;
  document.head.appendChild(s);
}

export function track(event, params = {}) {
  if (cfg.debug) console.info('[AGZ analytics]', allowed() ? 'send' : 'skip (not configured or no consent)', event, params);
  if (!allowed()) return;
  loadGA();
  window.gtag?.('event', event, params);
}

export function initAnalytics() {
  window.AGZConsent = {
    grant() { writeConsent('granted'); loadGA(); },
    revoke() { writeConsent('denied'); },
    status: readConsent
  };
  loadGA();

  if (cfg.trackOutboundClicks) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-track="outbound"]');
      if (!a) return;
      let domain = '';
      try { domain = new URL(a.href).hostname; } catch { /* relative */ }
      track('affiliate_click', {
        product_id: a.dataset.productId || '',
        product_name: a.dataset.productName || '',
        retailer: a.dataset.retailer || '',
        link_url: a.href,
        link_domain: domain,
        demo_link: a.dataset.demo === 'true'
      });
    });
  }
}

export const analyticsConfig = cfg;
