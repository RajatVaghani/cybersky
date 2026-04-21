/**
 * Plausible analytics helpers.
 *
 * The Plausible script and init() are loaded from index.html; a stub queues
 * calls before the script is ready, so these helpers are always safe to call.
 *
 * Docs: https://plausible.io/docs/custom-event-goals
 */

function getPlausible() {
  if (typeof window === 'undefined') return null
  return window.plausible || null
}

/**
 * Track a custom Plausible event.
 *
 * @param {string} name - Event name (matches a goal name in the Plausible UI)
 * @param {object} [props] - Custom properties to attach to the event
 */
export function trackEvent(name, props) {
  const plausible = getPlausible()
  if (!plausible || !name) return
  try {
    plausible(name, props ? { props } : undefined)
  } catch (err) {
    if (import.meta.env && import.meta.env.DEV) {
      console.warn('[analytics] trackEvent failed', err)
    }
  }
}

/**
 * Track an outbound/product link click.
 * Plausible's outboundLinks extension already auto-tracks these as
 * "Outbound Link: Click" with the URL; this adds a richer custom event
 * that includes the product name and platform for dashboard segmentation.
 */
export function trackProductClick({ product, platform, href }) {
  trackEvent('Product Click', {
    product,
    platform,
    href,
  })
}

export function trackContactClick(channel) {
  trackEvent('Contact Click', { channel })
}

export function trackNavClick(target) {
  trackEvent('Nav Click', { target })
}
