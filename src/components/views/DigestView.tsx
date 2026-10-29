/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { JournalEntry } from '../../types';
import { Music, ArrowRight, BookOpen, Sparkles, Compass, ChefHat, Camera, Layers } from 'lucide-react';
import { getSpotifyEmbedUrl } from '../../utils/spotify';

interface DigestViewProps {
  entries: JournalEntry[];
  allEntries?: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
}

export const DigestView: React.FC<DigestViewProps> = ({
  entries,
  allEntries = [],
  onSelectEntry,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'monthly_digest' | 'reflection'>('all');

  const digestEntries = useMemo(() => entries.filter((e) => e.section === 'digest'), [entries]);
  const latestDigest = digestEntries[0];
  const pastDigests = digestEntries.slice(1);

  // Filtered archives
  const filteredPastDigests = useMemo(() => {
    if (typeFilter === 'all') return pastDigests;
    return pastDigests.filter((e) => {
      if (typeFilter === 'monthly_digest') {
        return e.subType === 'monthly_digest';
      }
      return e.subType === 'reflection' || e.subType !== 'monthly_digest';
    });
  }, [pastDigests, typeFilter]);

  const latestSpotifyEmbed = latestDigest ? getSpotifyEmbedUrl(latestDigest.metadata?.spotifyUrl) : null;

  // Helper to resolve linked items in travel, food, and photos
  const getLinkedEntries = (entry: JournalEntry): JournalEntry[] => {
    const ids = entry.metadata?.linkedItemIds || [];
    if (ids.length === 0 || allEntries.length === 0) return [];
    return ids
      .map((id) => allEntries.find((e) => e.id === id))
      .filter((e): e is JournalEntry => !!e);
  };

  const getSectionBadge = (section: string, isHomeCooked?: boolean) => {
    if (isHomeCooked) return { label: 'Recipe', icon: '🍳', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (section === 'travel') return { label: 'Travel', icon: '🏔️', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
    if (section === 'food') return { label: 'Food', icon: '🥭', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    if (section === 'photos') return { label: 'Photo', icon: '📷', bg: 'bg-stone-100 text-stone-800 border-stone-200' };
    return { label: 'Journal', icon: '✍️', bg: 'bg-stone-50 text-stone-700 border-stone-200' };
  };

  const latestLinkedEntries = latestDigest ? getLinkedEntries(latestDigest) : [];

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
              <span className="font-serif italic text-sm text-[#2D5A43] font-semibold">
                {latestDigest.subType === 'monthly_digest' ? 'Featured Monthly Digest 🦦' : 'Featured Essay & Thought ✍️'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-xs">{latestDigest.date}</span>
            </div>
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

          {/* Linked Items in Travel, Food & Photos for this Monthly Digest */}
          {latestLinkedEntries.length > 0 && (
            <div
              className="mt-8 pt-6 border-t border-[#DDE7DF]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2D5A43]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Curated Highlights · Travel, Food & Photos</span>
                </div>
                <span className="text-[11px] text-[#78716C] font-mono">
                  {latestLinkedEntries.length} Items Linked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {latestLinkedEntries.map((item) => {
                  const badge = getSectionBadge(item.section, item.metadata?.isHomeCooked);
                  const thumb = item.coverPhoto || (item.photos && item.photos[0]);

                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEntry(item);
                      }}
                      className="group/item flex items-center gap-3.5 p-3 rounded-2xl bg-white hover:bg-[#EEF4EF] border border-[#DCE6DE] hover:border-[#2D5A43]/50 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs"
                    >
                      {thumb ? (
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#E3EBE4]">
                          <img
                            src={thumb}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-[#E3EBE4] text-xl">
                          {badge.icon}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}
                          >
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        </div>
                        <h4 className="text-xs font-serif font-semibold text-[#1C1917] truncate group-hover/item:text-[#2D5A43] transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-[#78716C] truncate mt-0.5">
                          {item.location || item.subtitle || item.summary}
                        </p>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover/item:text-[#2D5A43] group-hover/item:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

      {/* Archive of Previous Issues & Thoughts with Filter Selection */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9E5DC] pb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-serif font-medium text-[#1C1917]">
              Previous Archives & Thoughts
            </h3>
            <p className="text-xs text-[#78716C] mt-0.5">
              Explore past monthly issues alongside long-form blog posts and essays
            </p>
          </div>

          {/* Selection Filter: Blog Posts/Essays vs Monthly Digests */}
          <div className="flex items-center gap-1.5 p-1 bg-[#EEF4EF] rounded-xl border border-[#D2E0D4]">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-[#2D5A43] text-white shadow-xs'
                  : 'text-[#4A5D50] hover:text-[#1C1917]'
              }`}
            >
              All Archives ({pastDigests.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('monthly_digest')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'monthly_digest'
                  ? 'bg-[#2D5A43] text-white shadow-xs'
                  : 'text-[#4A5D50] hover:text-[#1C1917]'
              }`}
            >
              Monthly Digests ({pastDigests.filter((e) => e.subType === 'monthly_digest').length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('reflection')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'reflection'
                  ? 'bg-[#2D5A43] text-white shadow-xs'
                  : 'text-[#4A5D50] hover:text-[#1C1917]'
              }`}
            >
              Blog Posts & Essays ({pastDigests.filter((e) => e.subType !== 'monthly_digest').length})
            </button>
          </div>
        </div>

        {filteredPastDigests.length === 0 ? (
          <div className="p-12 text-center bg-[#F7F9F7] rounded-3xl border border-dashed border-[#DCE6DE]">
            <p className="text-sm font-serif text-[#57534E]">No entries found for this category.</p>
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className="mt-3 px-3.5 py-1.5 text-xs font-medium text-[#2D5A43] bg-white rounded-lg border border-[#DCE6DE] hover:bg-[#EEF4EF] transition-colors cursor-pointer"
            >
              Show all archives
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPastDigests.map((digest) => {
              const isMonthly = digest.subType === 'monthly_digest';
              const linkedItems = getLinkedEntries(digest);

              return (
                <article
                  key={digest.id}
                  onClick={() => onSelectEntry(digest)}
                  className="group relative flex flex-col justify-between bg-[#F7F9F7] hover:bg-white rounded-2xl p-6 border border-[#DCE6DE] hover:border-[#2D5A43]/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-[#78716C] mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            isMonthly
                              ? 'bg-emerald-50 text-[#2D5A43] border-[#CBE0D1]'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}
                        >
                          {isMonthly ? '🦦 Monthly Digest' : '✍️ Blog Post / Essay'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-xs">{digest.date}</span>
                      </div>
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

                    {/* Small display of linked highlights for this digest */}
                    {linkedItems.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#EAEFEA]">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#2D5A43] mb-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Linked This Month:</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {linkedItems.map((item) => {
                            const badge = getSectionBadge(item.section, item.metadata?.isHomeCooked);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectEntry(item);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-[#EEF4EF] border border-[#DCE6DE] text-[11px] text-[#2B3F33] font-medium transition-colors cursor-pointer shadow-2xs"
                                title={`Open ${item.title}`}
                              >
                                <span>{badge.icon}</span>
                                <span className="truncate max-w-[130px]">{item.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E3EBE4] flex items-center justify-between text-xs">
                    {digest.metadata?.monthlyTrack ? (
                      <span className="truncate text-[#57534E] max-w-[220px]">
                        ♫ {digest.metadata.monthlyTrack}
                      </span>
                    ) : (
                      <span className="text-[#78716C]">{isMonthly ? 'Field Notes' : 'Essay'}</span>
                    )}
                    <span className="text-[#2D5A43] font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>Read</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
