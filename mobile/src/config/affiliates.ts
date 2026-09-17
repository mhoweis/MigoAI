/**
 * Affiliate partner configuration for Migo
 *
 * Platinumlist affiliate program:
 *   ref  = nmu2yjg
 *   link = destination URL (URL-encoded)
 *
 * Usage:
 *   getPlatinumlistUrl()                   → homepage (generic banner)
 *   getPlatinumlistUrl(event.externalUrl)  → deep-link to specific event
 */

export const PLATINUMLIST_REF = 'nmu2yjg';
export const PLATINUMLIST_BASE = 'https://platinumlist.net';
const PLATINUMLIST_AFF_BASE = `https://platinumlist.net/aff/?ref=${PLATINUMLIST_REF}&link=`;

/**
 * Returns a Platinumlist affiliate URL that redirects to `targetUrl`
 * (or the Platinumlist homepage when no target is provided).
 */
export function getPlatinumlistUrl(targetUrl?: string | null): string {
  const destination = targetUrl?.trim() || PLATINUMLIST_BASE;
  return `${PLATINUMLIST_AFF_BASE}${encodeURIComponent(destination)}`;
}

/**
 * Returns true if the given URL belongs to platinumlist.net.
 */
export function isPlatinumlistUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.includes('platinumlist.net');
}
