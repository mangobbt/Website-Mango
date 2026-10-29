/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { JournalEntry, SortOption } from '../../types';
import { BookOpen, Film, ArrowUpDown } from 'lucide-react';
import { FractionalRating } from '../common/FractionalRating';

interface LibraryViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  entries,
  onSelectEntry,
}) => {
  const [mediaFilter, setMediaFilter] = useState<'all' | 'book' | 'movie'>('all');
  const [minRatingFilter, setMinRatingFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('highest_rated');

  const libraryEntries = entries.filter((e) => e.section === 'library');

  const filteredEntries = useMemo(() => {
    return libraryEntries
      .filter((e) => {
        // Media Type filter (All, Book, Movie)
        if (mediaFilter !== 'all') {
          const isMovie = e.metadata?.mediaType === 'movie' || e.subType === 'movie';
          if (mediaFilter === 'movie' && !isMovie) return false;
          if (mediaFilter === 'book' && isMovie) return false;
        }

        // Rating filter
        if (minRatingFilter !== 'all') {
          const r = e.rating || 0;
          if (minRatingFilter === 5.0) {
            if (r < 5.0) return false;
          } else {
            if (r < minRatingFilter) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest_rated') {
          const rA = a.rating || 0;
          const rB = b.rating || 0;
          if (rB !== rA) return rB - rA;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'lowest_rated') {
          const rA = a.rating || 0;
          const rB = b.rating || 0;
          if (rA !== rB) return rA - rB;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'date_newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'date_oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return 0;
      });
  }, [libraryEntries, mediaFilter, minRatingFilter, sortBy]);

  const bookCount = libraryEntries.filter(
    (e) => e.metadata?.mediaType === 'book' || e.subType === 'book'
  ).length;

  const movieCount = libraryEntries.filter(
    (e) => e.metadata?.mediaType === 'movie' || e.subType === 'movie'
  ).length;

  return (
    <div className="space-y-8">
      {/* Editorial Section Header with Warm Terracotta Palette */}
      <div className="border-b border-[#EEDFD5] pb-6 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9A3412] mb-2">
              <span className="text-base select-none">📖</span>
              <span>Cultural Log & Curated Shelves</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-medium text-[#1C1917] tracking-tight">
              Books & Cinema Logs
            </h1>
          </div>
          <p className="text-sm text-[#78716C] max-w-md leading-relaxed">
            Stories, films, and sentences that linger long after the final page or credits roll. Evaluated with 0.25-precision book and clapperboard ratings.
          </p>
        </div>

        {/* Filter & Sort Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
          {/* Media Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setMediaFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                mediaFilter === 'all'
                  ? 'bg-[#9A3412] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917] bg-[#FAF4F0] border border-[#EEDFD5]'
              }`}
            >
              All Shelf ({libraryEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setMediaFilter('book')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                mediaFilter === 'book'
                  ? 'bg-[#9A3412] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917] bg-[#FAF4F0] border border-[#EEDFD5]'
              }`}
            >
              <span className="select-none text-xs">📖</span>
              <span>Books ({bookCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaFilter('movie')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                mediaFilter === 'movie'
                  ? 'bg-[#1C1917] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917] bg-[#FAF4F0] border border-[#EEDFD5]'
              }`}
            >
              <span className="select-none text-xs">🎬</span>
              <span>Cinema ({movieCount})</span>
            </button>
          </div>

          {/* Secondary Controls: Rating Filter & Sort Reorder */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Rating Filter Tabs */}
            <div className="flex items-center gap-1 text-xs text-[#78716C]">
              <span className="text-[11px] font-medium mr-1 text-[#57534E] flex items-center gap-1 shrink-0">
                <span>Rating:</span>
              </span>
              <div className="flex items-center gap-1 bg-[#FAF4F0] p-0.5 rounded-lg border border-[#EEDFD5]">
                {[
                  { label: 'All', value: 'all' },
                  { label: '5.0', value: 5.0 },
                  { label: '4.5+', value: 4.5 },
                  { label: '4.0+', value: 4.0 },
                ].map((pill) => {
                  const isActive = minRatingFilter === pill.value;
                  return (
                    <button
                      key={pill.label}
                      type="button"
                      onClick={() => setMinRatingFilter(pill.value as number | 'all')}
                      className={`px-2 py-1 text-[11px] rounded-md transition-all font-mono cursor-pointer ${
                        isActive
                          ? 'bg-[#9A3412] text-white shadow-2xs font-semibold'
                          : 'text-[#57534E] hover:text-[#1C1917]'
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort Reorder Control */}
            <div className="flex items-center gap-1 text-xs text-[#78716C]">
              <span className="text-[11px] font-medium mr-1 text-[#57534E] flex items-center gap-1 shrink-0">
                <ArrowUpDown className="w-3 h-3 text-[#9A3412]" />
                <span>Sort:</span>
              </span>
              <div className="flex items-center gap-0.5 bg-[#FAF4F0] p-0.5 rounded-lg border border-[#EEDFD5]">
                <button
                  type="button"
                  onClick={() => setSortBy('highest_rated')}
                  className={`px-2 py-1 text-[11px] rounded-md transition-all cursor-pointer ${
                    sortBy === 'highest_rated'
                      ? 'bg-[#9A3412] text-white shadow-2xs font-medium'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                  title="Highest Rating First"
                >
                  Highest Rated
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('date_newest')}
                  className={`px-2 py-1 text-[11px] rounded-md transition-all cursor-pointer ${
                    sortBy === 'date_newest'
                      ? 'bg-[#9A3412] text-white shadow-2xs font-medium'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                  title="Newest Entry First"
                >
                  Newest
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('date_oldest')}
                  className={`px-2 py-1 text-[11px] rounded-md transition-all cursor-pointer ${
                    sortBy === 'date_oldest'
                      ? 'bg-[#9A3412] text-white shadow-2xs font-medium'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                  title="Oldest Entry First"
                >
                  Oldest
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Books & Movies */}
      {filteredEntries.length === 0 ? (
        <div className="py-16 text-center text-[#78716C] bg-[#FAF4F0] rounded-2xl border border-dashed border-[#EEDFD5] space-y-3">
          <BookOpen className="w-8 h-8 mx-auto opacity-40 text-[#9A3412]" />
          <p className="text-sm font-medium text-[#57534E]">
            No book or cinema reviews found matching this filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setMediaFilter('all');
              setMinRatingFilter('all');
            }}
            className="px-3.5 py-1.5 text-xs bg-[#9A3412] text-white rounded-lg hover:bg-[#7C2D12] transition-colors cursor-pointer"
          >
            Reset Shelf Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map((entry) => {
            const isMovie = entry.metadata?.mediaType === 'movie' || entry.subType === 'movie';
            const ratingValue = entry.rating || 5;

            return (
              <article
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className="group relative flex flex-col justify-between bg-white/95 hover:bg-white rounded-2xl overflow-hidden border border-[#EEDFD5] hover:border-[#9A3412]/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                {/* Cover Photo */}
                {entry.coverPhoto && (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-[#FAF4F0] relative">
                    <img
                      src={entry.coverPhoto}
                      alt={entry.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/65 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <span>{isMovie ? '🎬 Film' : '📖 Book'}</span>
                    </div>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header Line */}
                    <div className="flex items-center justify-between gap-2 text-xs text-[#78716C] mb-3">
                      <div className="flex items-center gap-1.5 font-medium">
                        {isMovie ? (
                          <Film className="w-3.5 h-3.5 text-[#1C1917]" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5 text-[#9A3412]" />
                        )}
                        <span className="uppercase tracking-wider text-[10px] font-sans">
                          {isMovie ? 'Film Reflection' : 'Book Review'}
                        </span>
                        {entry.metadata?.year && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{entry.metadata.year}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Title & Creator */}
                    <h3 className="text-xl font-serif font-medium text-[#1C1917] group-hover:text-[#9A3412] transition-colors leading-snug">
                      {entry.title}
                    </h3>
                    {entry.metadata?.creator && (
                      <p className="text-xs text-[#57534E] font-medium mt-1">
                        {isMovie ? 'Directed by ' : 'By '}
                        <span className="text-[#1C1917] font-semibold">{entry.metadata.creator}</span>
                      </p>
                    )}

                    {/* Summary */}
                    <p className="mt-3 text-sm text-[#44403C] line-clamp-3 leading-relaxed">
                      {entry.summary}
                    </p>

                    {/* Favorite Quote Box & Quotes Badge */}
                    {entry.metadata?.favoriteQuote && (
                      <div className="mt-4 p-3 bg-[#FAF4F0] rounded-xl border-l-2 border-[#9A3412] text-xs text-[#44403C] font-serif italic leading-relaxed space-y-1">
                        <div className="flex items-center justify-between gap-1 text-[10px] font-sans not-italic font-bold text-[#9A3412] uppercase tracking-wider">
                          <span>⭐ Memorable Quote</span>
                          {entry.metadata?.quotes && entry.metadata.quotes.length > 0 && (
                            <span className="font-mono text-[#78716C] bg-white px-1.5 py-0.5 rounded border border-[#EEDFD5]">
                              +{entry.metadata.quotes.length} more
                            </span>
                          )}
                        </div>
                        <p>"{entry.metadata.favoriteQuote}"</p>
                      </div>
                    )}
                  </div>

                  {/* Card Base with Rating and Date */}
                  <div className="mt-6 pt-4 border-t border-[#F5ECE5] space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <FractionalRating
                        type={isMovie ? 'clapper' : 'book'}
                        rating={entry.rating || 5}
                        size={16}
                        showNumeric
                      />
                      <span className="text-xs text-[#78716C] font-mono">
                        {entry.metadata?.exactDate || entry.date}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#78716C] flex-wrap">
                      {entry.tags.map((tag, idx) => (
                        <React.Fragment key={tag}>
                          <span>{tag}</span>
                          {idx < entry.tags.length - 1 && <span aria-hidden="true">·</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
