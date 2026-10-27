/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { JournalEntry, SortOption } from '../../types';
import { MangoIcon } from '../icons/MangoIcon';
import { FractionalRating } from '../common/FractionalRating';
import { Heart, MapPin, Utensils, ChefHat, Clock, ArrowUpDown } from 'lucide-react';
import { getGoogleMapsUrl } from '../../utils/mapLinks';

interface FoodViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const FoodView: React.FC<FoodViewProps> = ({
  entries,
  onSelectEntry,
  onToggleFavorite,
}) => {
  const [subFilter, setSubFilter] = useState<'all' | 'seal' | 'restaurant' | 'cooked'>('all');
  const [minRatingFilter, setMinRatingFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('highest_rated');

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        // Category / Type filter
        if (subFilter === 'seal' && !entry.metadata?.isMangoSeal) return false;
        if (subFilter === 'cooked' && !(entry.metadata?.isHomeCooked || entry.subType === 'recipe')) return false;
        if (subFilter === 'restaurant' && (entry.metadata?.isHomeCooked || entry.subType === 'recipe')) return false;

        // Rating filter
        if (minRatingFilter !== 'all') {
          const rating = entry.metadata?.mangoRating || entry.rating || 0;
          if (minRatingFilter === 5.0) {
            if (rating < 5.0) return false;
          } else {
            if (rating < minRatingFilter) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest_rated') {
          const rA = a.metadata?.mangoRating || a.rating || 0;
          const rB = b.metadata?.mangoRating || b.rating || 0;
          if (rB !== rA) return rB - rA;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'lowest_rated') {
          const rA = a.metadata?.mangoRating || a.rating || 0;
          const rB = b.metadata?.mangoRating || b.rating || 0;
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
  }, [entries, subFilter, minRatingFilter, sortBy]);

  const cookedCount = entries.filter((e) => e.metadata?.isHomeCooked || e.subType === 'recipe').length;

  return (
    <div className="space-y-8">
      {/* Section Editorial Header */}
      <div className="border-b border-[#E7E2D8] pb-6 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B45309] mb-2">
              <MangoIcon size={16} />
              <span>Culinary Table, Recipes & Taste Notes</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-medium text-[#1C1917] tracking-tight">
              Food, Restaurants & Home Cooking
            </h1>
          </div>
          <p className="text-sm text-[#78716C] max-w-md leading-relaxed">
            Neighborhood dining discoveries and home-cooked recipes from my kitchen, marked with the personal Mango Seal of Approval and 0.25 precision ratings.
          </p>
        </div>

        {/* Filter & Sort Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
          {/* Sub-Category Filter Controls */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSubFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                subFilter === 'all'
                  ? 'bg-[#2D5A43] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917] bg-white/70 border border-[#E7E2D8]'
              }`}
            >
              All Culinary ({entries.length})
            </button>
            <button
              type="button"
              onClick={() => setSubFilter('cooked')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                subFilter === 'cooked'
                  ? 'bg-[#B45309] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917] bg-white/70 border border-[#E7E2D8]'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Cooked by Me ({cookedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubFilter('seal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                subFilter === 'seal'
                  ? 'bg-[#E89A3C] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917] bg-white/70 border border-[#E7E2D8]'
              }`}
            >
              <MangoIcon size={14} />
              <span>Mango Seal</span>
            </button>
            <button
              type="button"
              onClick={() => setSubFilter('restaurant')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                subFilter === 'restaurant'
                  ? 'bg-[#2B4C6F] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917] bg-white/70 border border-[#E7E2D8]'
              }`}
            >
              Restaurants & Cafes
            </button>
          </div>

          {/* Secondary Controls: Rating Filter & Sort Reorder */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Rating Threshold Filter Bar */}
            <div className="flex items-center gap-1 text-xs text-[#78716C]">
              <span className="text-[11px] font-medium mr-1 text-[#57534E] flex items-center gap-1 shrink-0">
                <MangoIcon size={12} />
                <span>Rating:</span>
              </span>
              <div className="flex items-center gap-1 bg-[#F5EFE6] p-0.5 rounded-lg border border-[#E5DDD0]">
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
                          ? 'bg-[#1C1917] text-white shadow-2xs font-semibold'
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
                <ArrowUpDown className="w-3 h-3 text-[#2D5A43]" />
                <span>Sort:</span>
              </span>
              <div className="flex items-center gap-0.5 bg-[#F5EFE6] p-0.5 rounded-lg border border-[#E5DDD0]">
                <button
                  type="button"
                  onClick={() => setSortBy('highest_rated')}
                  className={`px-2 py-1 text-[11px] rounded-md transition-all cursor-pointer ${
                    sortBy === 'highest_rated'
                      ? 'bg-[#2D5A43] text-white shadow-2xs font-medium'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                  title="Highest Mango Rating"
                >
                  Highest Rated
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('date_newest')}
                  className={`px-2 py-1 text-[11px] rounded-md transition-all cursor-pointer ${
                    sortBy === 'date_newest'
                      ? 'bg-[#2D5A43] text-white shadow-2xs font-medium'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                  title="Newest Review or Recipe First"
                >
                  Newest
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('date_oldest')}
                  className={`px-2 py-1 text-[11px] rounded-md transition-all cursor-pointer ${
                    sortBy === 'date_oldest'
                      ? 'bg-[#2D5A43] text-white shadow-2xs font-medium'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                  title="Oldest Review or Recipe First"
                >
                  Oldest
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Food Entries */}
      {filteredEntries.length === 0 ? (
        <div className="py-16 text-center text-[#78716C] bg-white/40 rounded-2xl border border-dashed border-[#DCD5C9] space-y-3">
          <Utensils className="w-8 h-8 mx-auto opacity-40 text-[#B45309]" />
          <p className="text-sm font-medium text-[#57534E]">
            No culinary discoveries found matching this filter combination.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubFilter('all');
              setMinRatingFilter('all');
            }}
            className="px-3.5 py-1.5 text-xs bg-[#2D5A43] text-white rounded-lg hover:bg-[#234633] transition-colors cursor-pointer"
          >
            Reset Food Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map((entry) => {
            const isSeal = entry.metadata?.isMangoSeal;
            const isCooked = entry.metadata?.isHomeCooked || entry.subType === 'recipe';
            const effectiveRating = entry.metadata?.mangoRating || entry.rating || 5;

            return (
              <article
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className={`group relative flex flex-col justify-between bg-white/95 hover:bg-white rounded-2xl overflow-hidden border shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer ${
                  isCooked
                    ? 'border-[#EADCC8] hover:border-[#B45309]'
                    : 'border-[#E7E2D8] hover:border-[#B45309]/50'
                }`}
              >
                {/* Photo Thumbnail if present */}
                {entry.coverPhoto && (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-[#EAE6DE] relative">
                    <img
                      src={entry.coverPhoto}
                      alt={entry.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    {isCooked ? (
                      <div className="absolute top-2.5 left-2.5 bg-[#B45309] text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <ChefHat className="w-3 h-3" />
                        <span>Home Recipe</span>
                      </div>
                    ) : isSeal ? (
                      <div className="absolute top-2.5 right-2.5 bg-[#FFF8EB] border border-[#FDE68A] text-[#B45309] text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <MangoIcon size={12} />
                        <span>Mango Seal</span>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Top Metadata Line */}
                    <div className="flex items-center justify-between gap-2 text-xs text-[#78716C] mb-3">
                      <div className="flex items-center gap-1.5 truncate">
                        {isCooked ? (
                          <div className="flex items-center gap-1 text-[#B45309] font-medium">
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>Danny's Kitchen</span>
                          </div>
                        ) : (
                          entry.location && (
                            <>
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-[#2D5A43]" />
                              <span className="truncate">{entry.location}</span>
                            </>
                          )
                        )}
                        {entry.metadata?.priceRange && !isCooked && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{entry.metadata.priceRange}</span>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => onToggleFavorite(entry.id, e)}
                        title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        className="p-1 text-[#A8A29E] hover:text-[#DC2626] transition-colors cursor-pointer shrink-0"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            entry.isFavorite ? 'fill-[#DC2626] text-[#DC2626]' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="text-xl font-serif font-medium text-[#1C1917] group-hover:text-[#B45309] transition-colors leading-snug">
                      {entry.title}
                    </h3>
                    {entry.subtitle && (
                      <p className="text-xs text-[#57534E] font-medium mt-1">
                        {entry.subtitle}
                      </p>
                    )}

                    {/* Summary Text */}
                    <p className="mt-3 text-sm text-[#44403C] line-clamp-3 leading-relaxed">
                      {entry.summary}
                    </p>

                    {/* Recipe Ingredients Preview */}
                    {isCooked && entry.metadata?.ingredients && entry.metadata.ingredients.length > 0 && (
                      <div className="mt-4 p-3 bg-[#FAF7F2] rounded-xl border border-[#EDE6DC] text-xs">
                        <span className="text-[10px] uppercase tracking-wider text-[#B45309] font-semibold block mb-1">
                          Key Ingredients:
                        </span>
                        <p className="text-[#57534E] line-clamp-2">
                          {entry.metadata.ingredients.slice(0, 4).join(' · ')}
                          {entry.metadata.ingredients.length > 4 && '...'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#F3EFE6] space-y-3">
                    {/* Must-Try Dish Spotlight */}
                    {!isCooked && entry.metadata?.mustTryDish && (
                      <div className="text-xs text-[#57534E]">
                        <span className="text-[#78716C] uppercase tracking-wider text-[10px] block">
                          Must-Try Order:
                        </span>
                        <span className="font-medium text-[#1C1917]">
                          {entry.metadata.mustTryDish}
                        </span>
                      </div>
                    )}

                    {/* Fractional Mango Rating or Cook Time */}
                    <div className="flex items-center justify-between gap-2 pt-1 text-xs text-[#78716C]">
                      {isCooked ? (
                        <div className="flex items-center gap-1.5 text-[#B45309] font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {entry.metadata?.prepTime || '15m'} + {entry.metadata?.cookTime || '30m'}
                          </span>
                        </div>
                      ) : (
                        <FractionalRating
                          type="mango"
                          rating={effectiveRating}
                          size={16}
                          showNumeric
                        />
                      )}
                      <span className="font-mono">{entry.date}</span>
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
