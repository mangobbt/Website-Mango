/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { JournalEntry } from '../../types';
import { Music, Heart, ArrowRight } from 'lucide-react';
import { getSpotifyEmbedUrl } from '../../utils/spotify';

interface DigestViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const DigestView: React.FC<DigestViewProps> = ({
  entries,
  onSelectEntry,
  onToggleFavorite,
}) => {
  const digestEntries = entries.filter((e) => e.section === 'digest');
  const latestDigest = digestEntries[0];
  const pastDigests = digestEntries.slice(1);

  const latestSpotifyEmbed = latestDigest ? getSpotifyEmbedUrl(latestDigest.metadata?.spotifyUrl) : null;

  return (
    <div className="space-y-12">
      {/* Editorial Section Header with Forest Sage Palette */}
      <div className="border-b border-[#D9E5DC] pb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] mb-2">
              <span className="text-base select-none">🦦</span>
              <span>Commonplace Book & Field Essays</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-medium text-[#1C1917] tracking-tight">
              Digests & Thoughts
            </h1>
          </div>
          <p className="text-sm text-[#78716C] max-w-lg leading-relaxed">
            Personal reflections, essays, monthly rituals, soundtrack on repeat, and quiet seasonal observations written by me.
          </p>
        </div>
      </div>

      {/* Featured Latest Digest Issue */}
      {latestDigest && (
        <section
          aria-label="Latest Issue"
          onClick={() => onSelectEntry(latestDigest)}
          className="relative bg-[#F4F7F4]/90 hover:bg-[#FAFBF9] rounded-3xl p-8 sm:p-12 border border-[#DCE6DE] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group"
        >
          {latestDigest.coverPhoto && (
            <div className="aspect-[21/9] w-full overflow-hidden rounded-2xl mb-8 bg-[#E3EBE4]">
              <img
                src={latestDigest.coverPhoto}
                alt={latestDigest.title}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#78716C] pb-6 border-b border-[#DDE7DF]">
            <div className="flex items-center gap-2">
              <span className="font-serif italic text-sm text-[#2D5A43] font-semibold">Featured Issue 🦦</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-xs">{latestDigest.date}</span>
            </div>
            <button
              type="button"
              onClick={(e) => onToggleFavorite(latestDigest.id, e)}
              className="p-1 text-[#A8A29E] hover:text-[#DC2626] transition-colors cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 ${
                  latestDigest.isFavorite ? 'fill-[#DC2626] text-[#DC2626]' : ''
                }`}
              />
            </button>
          </div>

          <div className="mt-8 space-y-5">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-medium text-[#1C1917] group-hover:text-[#2D5A43] transition-colors tracking-tight">
              {latestDigest.title}
            </h2>
            {latestDigest.subtitle && (
              <p className="text-base sm:text-lg font-serif italic text-[#57534E]">
                {latestDigest.subtitle}
              </p>
            )}

            {/* Drop Cap Paragraph (Expanded width for comfortable reading) */}
            <p className="text-base sm:text-lg text-[#38332E] leading-relaxed max-w-4xl pt-2">
              <span className="text-5xl font-serif float-left mr-3.5 leading-none text-[#2D5A43] font-semibold">
                {latestDigest.content.charAt(0)}
              </span>
              {latestDigest.content.slice(1)}
            </p>
          </div>

          {/* Personal Notes & Reflections (Human-authored, Forest Sage accent) */}
          {latestDigest.metadata?.personalNotes && latestDigest.metadata.personalNotes.length > 0 && (
            <div className="mt-8 p-6 sm:p-8 bg-[#EEF4EF] rounded-2xl border border-[#D2E0D4] max-w-4xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] mb-4">
                <span>Monthly Field Notes</span>
              </div>
              <ul className="space-y-2.5">
                {latestDigest.metadata.personalNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#2B3F33]">
                    <span className="font-serif italic text-[#2D5A43] font-bold select-none">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Embedded Compact Spotify Player */}
          {latestSpotifyEmbed ? (
            <div
              className="mt-6 p-4 rounded-2xl bg-[#121212] border border-[#282828] text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-xs text-[#B3B3B3] mb-2 font-mono">
                <span className="flex items-center gap-1.5 text-white font-medium">
                  <Music className="w-3.5 h-3.5 text-[#1DB954]" />
                  <span>Soundtrack on Repeat</span>
                </span>
                <span>Spotify</span>
              </div>
              <iframe
                src={latestSpotifyEmbed}
                width="100%"
                height="80"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-xl shadow-xs"
              />
            </div>
          ) : latestDigest.metadata?.monthlyTrack ? (
            <div className="mt-6 flex items-center justify-between gap-4 p-4 rounded-xl bg-[#EEF4EF] border border-[#D2E0D4] text-xs text-[#2B3F33]">
              <div className="flex items-center gap-2.5">
                <Music className="w-4 h-4 text-[#2D5A43]" />
                <span>
                  <strong className="font-medium text-[#1C1917]">Track on Repeat:</strong>{' '}
                  {latestDigest.metadata.monthlyTrack}
                </span>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* Archive of Previous Issues */}
      {pastDigests.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#D9E5DC] pb-3">
            <h3 className="text-xl font-serif font-medium text-[#1C1917]">
              Previous Archives & Thoughts
            </h3>
            <span className="text-xs text-[#78716C] font-mono">
              {pastDigests.length} Past Issues
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pastDigests.map((digest) => (
              <article
                key={digest.id}
                onClick={() => onSelectEntry(digest)}
                className="group relative flex flex-col justify-between bg-[#F7F9F7] hover:bg-white rounded-2xl p-6 border border-[#DCE6DE] hover:border-[#2D5A43]/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#78716C] mb-3">
                    <span className="font-mono text-[#2D5A43] font-medium">{digest.date}</span>
                    <button
                      type="button"
                      onClick={(e) => onToggleFavorite(digest.id, e)}
                      title={digest.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      className="p-1 text-[#A8A29E] hover:text-[#DC2626] transition-colors cursor-pointer"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          digest.isFavorite ? 'fill-[#DC2626] text-[#DC2626]' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <h4 className="text-xl font-serif font-medium text-[#1C1917] group-hover:text-[#2D5A43] transition-colors leading-snug">
                    {digest.title}
                  </h4>
                  {digest.subtitle && (
                    <p className="text-xs text-[#57534E] font-medium mt-1">
                      {digest.subtitle}
                    </p>
                  )}

                  <p className="mt-3 text-sm text-[#44403C] line-clamp-3 leading-relaxed">
                    {digest.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E3EBE4] flex items-center justify-between text-xs">
                  {digest.metadata?.monthlyTrack ? (
                    <span className="truncate text-[#57534E] max-w-[220px]">
                      ♫ {digest.metadata.monthlyTrack}
                    </span>
                  ) : (
                    <span className="text-[#78716C]">Notes</span>
                  )}
                  <span className="text-[#2D5A43] font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Read</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
