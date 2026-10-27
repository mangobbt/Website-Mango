/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JournalEntry } from '../types';

/**
 * Returns a direct Google Maps URL for an entry.
 * Prioritizes custom googleMapsUrl, then coordinates, then location/title search query.
 */
export function getGoogleMapsUrl(entry: JournalEntry): string {
  if (entry.metadata?.googleMapsUrl && entry.metadata.googleMapsUrl.trim().length > 0) {
    return entry.metadata.googleMapsUrl.trim();
  }

  if (entry.coordinates && typeof entry.coordinates.lat === 'number' && typeof entry.coordinates.lng === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${entry.coordinates.lat},${entry.coordinates.lng}`;
  }

  const queryParts = [entry.title, entry.location, entry.metadata?.neighborhood]
    .filter(Boolean)
    .join(' ');

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts || entry.title)}`;
}
