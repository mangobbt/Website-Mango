/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts a standard Spotify URL or URI into an embeddable URL.
 * e.g. "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=..." -> "https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT"
 */
export function getSpotifyEmbedUrl(urlOrUri?: string): string | null {
  if (!urlOrUri) return null;
  const trimmed = urlOrUri.trim();
  if (!trimmed) return null;

  // Already an embed URL
  if (trimmed.includes('open.spotify.com/embed/')) {
    return trimmed;
  }

  // Handle standard URL like https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
  const trackMatch = trimmed.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (trackMatch && trackMatch[1]) {
    return `https://open.spotify.com/embed/track/${trackMatch[1]}?utm_source=generator&theme=0`;
  }

  // Handle album or playlist if provided
  const albumMatch = trimmed.match(/open\.spotify\.com\/album\/([a-zA-Z0-9]+)/);
  if (albumMatch && albumMatch[1]) {
    return `https://open.spotify.com/embed/album/${albumMatch[1]}?utm_source=generator&theme=0`;
  }

  const playlistMatch = trimmed.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (playlistMatch && playlistMatch[1]) {
    return `https://open.spotify.com/embed/playlist/${playlistMatch[1]}?utm_source=generator&theme=0`;
  }

  // Handle spotify:track:4cOdK2wGLETKBW3PvgPWqT URI
  if (trimmed.startsWith('spotify:track:')) {
    const id = trimmed.replace('spotify:track:', '');
    return `https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0`;
  }

  return null;
}
