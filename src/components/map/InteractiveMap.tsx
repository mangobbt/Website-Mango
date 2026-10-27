/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { JournalEntry } from '../../types';
import { Compass, ZoomIn, ZoomOut, RotateCcw, Check, Sparkles, MapPin, ExternalLink } from 'lucide-react';
import { getGoogleMapsUrl } from '../../utils/mapLinks';

interface InteractiveMapProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
}

// Convert Lat/Lng to normalized SVG coordinates (viewBox 0 0 1000 520, Equirectangular projection)
function projectCoords(lat: number, lng: number): { x: number; y: number } {
  // Longitude: -180 to 180 maps to 0 to 1000
  const x = ((lng + 180) / 360) * 1000;
  // Latitude: 75 to -70 maps to 0 to 520 with generous vertical spread
  const clampedLat = Math.max(-68, Math.min(76, lat));
  const y = ((76 - clampedLat) / 144) * 520;
  return { x, y };
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
}) => {
  const [filter, setFilter] = useState<'all' | 'visited' | 'wishlist'>('all');
  const [hoveredEntry, setHoveredEntry] = useState<JournalEntry | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter travel entries with coordinates
  const travelEntries = useMemo(() => {
    return entries.filter((e) => e.section === 'travel' && e.coordinates);
  }, [entries]);

  const displayedEntries = useMemo(() => {
    if (filter === 'all') return travelEntries;
    return travelEntries.filter((e) => e.metadata?.status === filter);
  }, [travelEntries, filter]);

  const visitedCount = useMemo(
    () => travelEntries.filter((e) => e.metadata?.status === 'visited').length,
    [travelEntries]
  );
  const wishlistCount = useMemo(
    () => travelEntries.filter((e) => e.metadata?.status === 'wishlist').length,
    [travelEntries]
  );

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(2.5, Math.max(0.85, prev + delta)));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Label position helper to avoid clustering between neighboring cities (like Tokyo and Kyoto)
  const getCityLabelProps = (cityTitle: string, lat: number, lng: number) => {
    const isKyoto = cityTitle.toLowerCase().includes('kyoto');
    const isTokyo = cityTitle.toLowerCase().includes('tokyo');
    const isTaipei = cityTitle.toLowerCase().includes('taipei');

    if (isKyoto) {
      // Place Kyoto label to the bottom-left of the pin
      return {
        dx: -10,
        dy: 14,
        textAnchor: 'end' as const,
      };
    }
    if (isTokyo) {
      // Place Tokyo label to the top-right of the pin
      return {
        dx: 11,
        dy: -6,
        textAnchor: 'start' as const,
      };
    }
    if (isTaipei) {
      // Place Taipei label slightly below
      return {
        dx: 10,
        dy: 12,
        textAnchor: 'start' as const,
      };
    }
    return {
      dx: 10,
      dy: 4,
      textAnchor: 'start' as const,
    };
  };

  return (
    <div className="relative w-full rounded-3xl bg-[#EEF4F7] border border-[#CBDDE8] overflow-hidden shadow-xs">
      {/* Map Header Utility Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#FBF9F5]/95 border-b border-[#CBDDE8] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#2B4C6F]/10 text-[#2B4C6F]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-[#1C1917] font-sans">
              My Travel Cartography
            </h3>
            <div className="flex items-center gap-2 text-xs text-[#2B4C6F]/80">
              <span>{visitedCount} Dispatches Documented</span>
              <span aria-hidden="true">·</span>
              <span>{wishlistCount} Horizons Ahead</span>
            </div>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[#EDE8DF]/60 rounded-xl border border-[#DCD5C9]">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'all'
                ? 'bg-[#2B4C6F] text-white shadow-xs'
                : 'text-[#5A6872] hover:text-[#1C1917]'
            }`}
          >
            All Cities ({travelEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('visited')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'visited'
                ? 'bg-[#2D5A43] text-white shadow-xs'
                : 'text-[#5A6872] hover:text-[#1C1917]'
            }`}
          >
            <Check className="w-3 h-3" />
            <span>Visited ({visitedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('wishlist')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'wishlist'
                ? 'bg-[#E89A3C] text-white shadow-xs'
                : 'text-[#5A6872] hover:text-[#1C1917]'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Wishlist ({wishlistCount})</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleZoom(0.25)}
            title="Zoom In"
            className="p-1.5 text-[#2B4C6F] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#D5E1E9] cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-0.25)}
            title="Zoom Out"
            className="p-1.5 text-[#2B4C6F] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#D5E1E9] cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Reset Map View"
            className="p-1.5 text-[#2B4C6F] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#D5E1E9] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Stylized SVG Canvas (Bigger on screen, calibrated geographical shorelines) */}
      <div className="relative w-full h-[480px] sm:h-[520px] lg:h-[560px] overflow-hidden select-none bg-[#E5EEF3]">
        <svg
          viewBox="0 0 1000 520"
          className="w-full h-full transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: '50% 50%',
          }}
        >
          {/* Subtle Water Texture & Depth Waves */}
          <defs>
            <pattern id="seaGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 0 20 Q 10 17 20 20 T 40 20" fill="none" stroke="#D3E3EC" strokeWidth="0.4" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="1000" height="520" fill="url(#seaGrid)" />

          {/* Graticule Lat / Long Grid */}
          <g stroke="#C9DCE8" strokeWidth="0.6" strokeDasharray="4 4">
            <line x1="0" y1="130" x2="1000" y2="130" />
            <line x1="0" y1="260" x2="1000" y2="260" />
            <line x1="0" y1="390" x2="1000" y2="390" />
            <line x1="200" y1="0" x2="200" y2="520" />
            <line x1="400" y1="0" x2="400" y2="520" />
            <line x1="600" y1="0" x2="600" y2="520" />
            <line x1="800" y1="0" x2="800" y2="520" />
          </g>

          {/* Equator & Meridian Guides with quiet typography */}
          <line x1="0" y1="260" x2="1000" y2="260" stroke="#BDD4E2" strokeWidth="0.9" />
          <text x="12" y="256" className="text-[8px] font-mono fill-[#7F9EB2] select-none pointer-events-none">EQUATOR 0°</text>
          <text x="12" y="126" className="text-[8px] font-mono fill-[#7F9EB2] select-none pointer-events-none">TROPIC OF CANCER 23.5° N</text>
          <text x="12" y="386" className="text-[8px] font-mono fill-[#7F9EB2] select-none pointer-events-none">TROPIC OF CAPRICORN 23.5° S</text>

          {/* Realistic Continental Landmasses with Coastal Outlines */}
          <g fill="#D8E2D8" stroke="#B8C8B8" strokeWidth="1" strokeLinejoin="round">
            {/* North America (Alaska, Canada, USA, Mexico) */}
            <path d="M 60 75 
              L 100 50 L 150 45 L 200 55 L 250 50 L 290 65 L 330 70 L 340 100 L 315 95 L 305 110 L 320 120 
              L 295 135 L 285 160 L 260 175 L 245 195 L 235 210 L 225 200 L 210 185 L 190 180 L 180 155 
              L 160 125 L 130 115 L 85 100 Z" />

            {/* Greenland */}
            <path d="M 320 35 L 365 30 L 390 55 L 375 80 L 340 75 L 325 55 Z" />

            {/* Iceland (Reykjavik) */}
            <path d="M 430 36 L 452 34 L 455 46 L 438 49 L 432 42 Z" fill="#D8E2D8" stroke="#A8BCA8" strokeWidth="1.2" />

            {/* Central America Isthmus */}
            <path d="M 235 210 L 255 220 L 270 240 L 275 255 L 265 260 L 250 245 L 235 220 Z" />

            {/* South America */}
            <path d="M 270 255 L 305 250 L 340 265 L 370 295 L 380 325 L 360 365 L 340 410 L 320 460 L 305 470 L 300 445 L 310 395 L 295 345 L 275 295 L 265 265 Z" />

            {/* British Isles */}
            <path d="M 465 95 L 480 90 L 485 110 L 470 120 L 460 105 Z" />

            {/* Scandinavia */}
            <path d="M 510 40 L 535 35 L 555 55 L 545 85 L 525 95 L 515 75 Z" />

            {/* Europe (Iberia, France, Central Europe, Mediterranean) - Lisbon & Paris */}
            <path d="M 465 120 L 490 115 L 520 110 L 560 105 L 575 130 L 555 145 L 525 150 L 505 150 L 495 140 L 470 140 L 465 130 Z" />

            {/* Italy Peninsula */}
            <path d="M 525 140 L 535 160 L 545 165 L 540 150 Z" />

            {/* Africa */}
            <path d="M 470 160 L 520 160 L 585 185 L 610 235 L 600 295 L 575 355 L 545 395 L 525 390 L 500 335 L 470 245 L 455 195 Z" />

            {/* Madagascar */}
            <path d="M 610 330 L 625 340 L 615 380 L 600 370 Z" />

            {/* Eurasia / Asia mainland */}
            <path d="M 560 105 L 650 70 L 750 65 L 830 80 L 890 100 L 900 140 L 870 160 L 830 190 L 795 215 L 750 255 L 710 270 L 670 240 L 635 210 L 585 185 L 575 130 Z" />

            {/* Indian Subcontinent */}
            <path d="M 690 190 L 725 200 L 735 250 L 710 270 L 685 235 Z" />

            {/* Southeast Asia (Indochina & Malay Peninsula) */}
            <path d="M 770 200 L 805 210 L 815 245 L 795 275 L 780 255 L 765 215 Z" />

            {/* Taiwan Island - Taipei */}
            <path d="M 834 168 L 844 170 L 842 182 L 833 179 Z" fill="#D8E2D8" stroke="#A8BCA8" strokeWidth="1.2" />

            {/* Japan Archipelago - Expanded detail so Tokyo & Kyoto breathe */}
            {/* Hokkaido */}
            <path d="M 885 110 L 905 107 L 910 120 L 890 123 Z" fill="#D8E2D8" stroke="#A8BCA8" strokeWidth="1.2" />
            {/* Honshu Arc */}
            <path d="M 868 144 L 876 134 L 896 128 L 903 138 L 888 145 L 872 147 Z" fill="#D8E2D8" stroke="#A8BCA8" strokeWidth="1.2" />
            {/* Kyushu & Shikoku */}
            <path d="M 858 147 L 868 145 L 866 155 L 856 153 Z" fill="#D8E2D8" stroke="#A8BCA8" strokeWidth="1.2" />

            {/* Indonesia & Philippines */}
            <path d="M 800 285 L 835 290 L 860 300 L 840 315 L 795 305 Z" />
            <path d="M 835 220 L 848 225 L 845 250 L 830 240 Z" />

            {/* Australia */}
            <path d="M 780 335 L 845 325 L 880 350 L 885 395 L 860 430 L 800 430 L 765 390 L 765 355 Z" />

            {/* New Zealand */}
            <path d="M 905 415 L 920 420 L 910 450 L 895 445 Z" />
          </g>

          {/* City Markers with Declustered Label Typography */}
          {displayedEntries.map((entry) => {
            if (!entry.coordinates) return null;
            const { x, y } = projectCoords(entry.coordinates.lat, entry.coordinates.lng);
            const isSelected = selectedEntryId === entry.id;
            const isHovered = hoveredEntry?.id === entry.id;
            const isVisited = entry.metadata?.status === 'visited';
            const cityLabel = entry.location?.split(',')[0] || entry.title;
            const labelProps = getCityLabelProps(cityLabel, entry.coordinates.lat, entry.coordinates.lng);

            return (
              <g
                key={entry.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer group"
                onClick={() => onSelectEntry(entry)}
                onMouseEnter={() => setHoveredEntry(entry)}
                onMouseLeave={() => setHoveredEntry(null)}
              >
                {/* Dynamic Radar Ping */}
                {(isSelected || isHovered) && (
                  <circle
                    r="16"
                    fill={isVisited ? '#2D5A43' : '#E89A3C'}
                    opacity="0.3"
                    className="animate-ping"
                  />
                )}

                {/* Outer Pin Shadow Ring */}
                <circle
                  r={isSelected ? '9' : isHovered ? '8' : '6'}
                  fill={isSelected ? (isVisited ? '#2D5A43' : '#E89A3C') : '#FFFFFF'}
                  stroke={isVisited ? '#2D5A43' : '#E89A3C'}
                  strokeWidth="2.2"
                  className="transition-all duration-200"
                />

                {/* Inner Core Dot */}
                <circle
                  r={isSelected ? '4' : '2.5'}
                  fill={isSelected ? '#FFFFFF' : isVisited ? '#2B4C6F' : '#E89A3C'}
                  className="transition-all duration-200"
                />

                {/* City Label with Anti-Cluster Offsets & Clean White Halo */}
                <text
                  x={labelProps.dx}
                  y={labelProps.dy}
                  textAnchor={labelProps.textAnchor}
                  className={`text-[11px] font-sans font-medium select-none pointer-events-none transition-all ${
                    isSelected
                      ? 'fill-[#1C1917] font-bold text-[12px]'
                      : isHovered
                      ? 'fill-[#2B4C6F] font-bold text-[11.5px]'
                      : 'fill-[#1F2937]'
                  }`}
                  style={{
                    textShadow:
                      '0 1px 3px rgba(255, 255, 255, 0.98), 0 -1px 3px rgba(255, 255, 255, 0.98), 1px 0 3px rgba(255, 255, 255, 0.98), -1px 0 3px rgba(255, 255, 255, 0.98)',
                  }}
                >
                  {cityLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hovered Floating Tooltip Card */}
        {hoveredEntry && hoveredEntry.coordinates && (
          <div className="absolute top-4 right-4 z-20 max-w-xs p-4 bg-white/95 rounded-2xl border border-[#CBDDE8] shadow-xl backdrop-blur-md pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  hoveredEntry.metadata?.status === 'visited'
                    ? 'text-[#2D5A43]'
                    : 'text-[#E89A3C]'
                }`}
              >
                {hoveredEntry.metadata?.status === 'visited' ? '● Visited Dispatch' : '✦ Future Horizon'}
              </span>
              <span className="text-[11px] text-[#718096] font-mono">
                {hoveredEntry.date}
              </span>
            </div>
            <h4 className="text-sm font-serif font-medium text-[#1C1917]">
              {hoveredEntry.title}
            </h4>
            <p className="mt-1 text-xs text-[#52606D] line-clamp-2 leading-relaxed">
              {hoveredEntry.summary}
            </p>
            {hoveredEntry.metadata?.bestMemory && (
              <div className="mt-2 pt-2 border-t border-[#F0F4F7] text-[11px] text-[#2B4C6F] italic">
                "{hoveredEntry.metadata.bestMemory}"
              </div>
            )}
          </div>
        )}

        {/* Bottom Map Legend */}
        <div className="absolute bottom-3 left-4 z-10 flex items-center gap-4 px-3.5 py-2 bg-white/95 rounded-xl border border-[#CBDDE8] text-[11px] text-[#52606D] shadow-2xs backdrop-blur-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2D5A43] border border-white" />
            <span className="font-medium text-[#1C1917]">Visited Cities</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E89A3C] border border-white" />
            <span className="font-medium text-[#1C1917]">On Danny's Horizon</span>
          </div>
        </div>
      </div>
    </div>
  );
};
