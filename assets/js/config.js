/**
 * AquaGearZone site configuration.
 *
 * Edit this file to connect analytics once accounts exist. Nothing here is a
 * real credential: leave values empty until the business has created them.
 */
export const SITE_CONFIG = {
  // Canonical production origin (no trailing slash). Also used in <link rel="canonical"> tags.
  siteUrl: 'https://aquagearzone.com',

  analytics: {
    // Google Analytics 4 measurement ID, e.g. "G-XXXXXXXXXX".
    // EMPTY = analytics disabled. No scripts load and no events are recorded.
    ga4MeasurementId: '',

    // When true, events are only sent after consent has been granted
    // (window.AGZConsent.grant()). Connect this to a consent banner / CMP
    // before enabling analytics for visitors in regions that require it.
    requireConsent: true,

    // Record clicks on retailer ("View at Retailer") buttons as `affiliate_click` events.
    trackOutboundClicks: true,

    // Record product detail views as GA4 `view_item` events.
    trackProductViews: true,

    // Log would-be events to the browser console while developing (no data is sent).
    debug: false
  }
};
