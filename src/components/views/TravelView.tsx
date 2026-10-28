/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { JournalEntry } from '../../types';
import { InteractiveMap } from '../map/InteractiveMap';
import { FractionalRating } from '../common/FractionalRating';
import { MapPin, Sparkles, Check, ExternalLink } from 'lucide-react';
import { getGoogleMapsUrl } from '../../utils/mapLinks';

interface TravelViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
}

export const TravelView: React.FC<TravelViewProps> = ({
  entries,
  onSelectEntry,
}) => {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'visited' | 'wishlist'>('all');

  const travelEntries = entries.filter((e) => e.section === 'travel');

  const getTravelRating = (e: JournalEntry): number => {
    if (e.metadata?.travelSpots && e.metadata.travelSpots.length > 0) {
      const avg =
        e.metadata.travelSpots.reduce((acc, s) => acc + s.mountainRating, 0) /
        e.metadata.travelSpots.length;
      return Math.max(avg, e.rating || 0);
    }
    return e.rating || 0;
  };

  const filteredEntries = useMemo(() => {
    return travelEntries.filter((e) => {
      if (statusFilter === 'visited' && e.metadata?.status !== 'visited') return false;
      if (statusFilter === 'wishlist' && e.metadata?.status !== 'wishlist') return false;
      return true;
    });
  }, [travelEntries, statusFilter]);

  const handleMapSelect = (entry: JournalEntry) => {
    setSelectedPinId(entry.id);
  };

  const visitedCount = travelEntries.filter((e) => e.metadata?.status === 'visited').length;
  const wishlistCount = travelEntries.filter((e) => e.metadata?.status === 'wishlist').length;

  return (
    <div className="space-y-8">
      {/* Section Editorial Header */}
      <div className="border-b border-[#E7E2D8] pb-5 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2B4C6F] mb-1.5">
              <span className="text-base select-none">🏔️</span>
              <span>Cartography & Field Notes</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-medium text-[#1C1917] tracking-tight">
              Travel Itineraries & Horizons
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#78716C] max-w-md leading-relaxed">
            Explorations across cities, quiet backstreets, coastal paths, and horizons waiting ahead. Explore the map above and glide through the visited spots and itineraries below.
          </p>
        </div>

        {/* Filter Controls Row (Sort removed per user request) */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#2B4C6F] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917] bg-white/70 border border-[#E7E2D8]'
              }`}
            >
              All Destinations ({travelEntries.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('visited')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'visited'
                  ? 'bg-[#2D5A43] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917] bg-white/70 border border-[#E7E2D8]'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Visited ({visitedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('wishlist')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'wishlist'
                  ? 'bg-[#D97706] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917] bg-white/70 border border-[#E7E2D8]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Wishlist ({wishlistCount})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-xs text-[#78716C] font-mono">
            <span>{filteredEntries.length} destinations displayed</span>
          </div>
        </div>
      </div>

      {/* TOP SECTION: Full-Width Interactive Map */}
      <section aria-label="Interactive Travel Map" className="w-full">
        <div className="rounded-3xl overflow-hidden border border-[#CBDDE8] shadow-sm bg-[#EEF4F7]">
          <InteractiveMap
            entries={travelEntries}
            selectedEntryId={selectedPinId}
            onSelectEntry={handleMapSelect}
            onOpenDetail={onSelectEntry}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-[#78716C] px-2 pt-2 font-mono">
          <span>Click any city to zoom in & reveal mountain spots 🏔️ · Zoom (+ / -) or drag to pan</span>
          <span>Equirectangular World Projection</span>
        </div>
      </section>

      {/* BOTTOM SECTION: Places Visited & Travel Spots (Grid display of all cards) */}
      <section aria-label="Places Visited & Travel Spots" className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-1 border-b border-[#E7E2D8]/80">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#2B4C6F]" />
              <h2 className="text-lg font-serif font-medium text-[#1C1917]">
                Places Visited & Travel Spots
              </h2>
            </div>
            <p className="text-xs text-[#78716C] mt-0.5">
              Browse all curated city guides, local spots, and mountain ratings
            </p>
          </div>
          <span className="text-xs font-mono text-[#78716C]">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'place' : 'places'}
          </span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center text-[#78716C] bg-white/40 rounded-2xl border border-dashed border-[#DCD5C9]">
            <p className="text-sm">No destinations matching this filter.</p>
          </div>
        ) : (
          /* Grid showing all cards directly */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map((entry) => {
              const isVisited = entry.metadata?.status === 'visited';
              const isSelected = selectedPinId === entry.id;
              const googleMapsUrl = getGoogleMapsUrl(entry);
              const ratingValue = getTravelRating(entry);
              const spots = entry.metadata?.travelSpots || [];

              return (
                <article
                  id={`travel-card-${entry.id}`}
                  key={entry.id}
                  onClick={() => {
                    setSelectedPinId(entry.id);
                    onSelectEntry(entry);
                  }}
                  className={`group relative flex flex-col bg-white/95 hover:bg-white rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-lg ${
                    isSelected
                      ? 'border-[#2B4C6F] ring-2 ring-[#2B4C6F]/25 shadow-md bg-[#FBFDFF]'
                      : 'border-[#E7E2D8] hover:border-[#2B4C6F]/50'
                  }`}
                >
                  {/* Cover Photo */}
                  {entry.coverPhoto && (
                    <div className="aspect-[16/10] w-full overflow-hidden bg-[#EAE6DE] relative">
                      <img
                        src={entry.coverPhoto}
                        alt={entry.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-black/65 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1">
                        {isVisited ? '● Visited Dispatch' : '✦ Wishlist Horizon'}
                      </div>
                      {ratingValue > 0 && (
                        <div className="absolute top-2.5 right-2.5 bg-black/65 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 font-mono">
                          <FractionalRating rating={ratingValue} type="mountain" max={1} size={11} showNumeric={false} />
                          <span>{ratingValue.toFixed(ratingValue % 1 === 0 ? 0 : 2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Status Tag */}
                      <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                        <span
                          className={`flex items-center gap-1 font-medium text-[11px] ${
                            isVisited ? 'text-[#2D5A43]' : 'text-[#D97706]'
                          }`}
                        >
                          {isVisited ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                          <span>{isVisited ? 'Documented Place' : 'Future Journey'}</span>
                        </span>
                        <span className="font-mono text-[11px] text-[#78716C]">{entry.date}</span>
                      </div>

                      {/* Title & Subtitle */}
                      <h3 className="text-lg font-serif font-medium text-[#1C1917] group-hover:text-[#2B4C6F] transition-colors leading-snug">
                        {entry.title}
                      </h3>
                      {entry.subtitle && (
                        <p className="text-xs text-[#57534E] font-medium mt-0.5">
                          {entry.subtitle}
                        </p>
                      )}

                      {/* Location & Travel Season */}
                      <div className="flex items-center gap-1.5 text-xs text-[#78716C] mt-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-[#2B4C6F]" />
                        <span className="font-medium text-[#44403C]">{entry.location}</span>
                        {entry.metadata?.travelSeason && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{entry.metadata.travelSeason}</span>
                          </>
                        )}
                      </div>

                      {/* Summary */}
                      <p className="mt-2 text-xs sm:text-sm text-[#44403C] line-clamp-2 leading-relaxed">
                        {entry.summary}
                      </p>

                      {/* Curated Spots Highlight (Visited and liked) */}
                      {spots.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-[#F3EFE6] space-y-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#78716C] block">
                            Key Spots ({spots.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {spots.slice(0, 3).map((spot, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F4F1EA] text-[11px] text-[#44403C] border border-[#E7E2D8]"
                              >
                                <span className="text-[9px]">🏔️</span>
                                <span className="font-medium truncate max-w-[130px]">{spot.name}</span>
                              </span>
                            ))}
                            {spots.length > 3 && (
                              <span className="px-1.5 py-0.5 text-[10px] text-[#78716C] self-center">
                                +{spots.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Travel Spots count & Google Maps link */}
                    <div className="pt-2.5 border-t border-[#F3EFE6] flex items-center justify-between text-xs">
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[#2B4C6F] hover:underline font-medium"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Google Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <span className="text-[#2B4C6F] font-medium group-hover:underline">
                        Read Itinerary →
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
