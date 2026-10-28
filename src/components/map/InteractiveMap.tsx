/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { JournalEntry, TravelSpot } from '../../types';
import {
  Map as MapIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Sparkles,
  MapPin,
  ExternalLink,
  X,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { FractionalRating } from '../common/FractionalRating';

interface InteractiveMapProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onOpenDetail?: (entry: JournalEntry) => void;
}

// Convert Lat/Lng to normalized SVG coordinates (viewBox 0 0 1000 520, Equirectangular projection)
export function projectCoords(lat: number, lng: number): { x: number; y: number } {
  // Longitude: -180 to 180 maps to 0 to 1000
  const x = ((lng + 180) / 360) * 1000;
  // Latitude: 76 to -68 maps to 0 to 520 with generous vertical spread
  const clampedLat = Math.max(-68, Math.min(76, lat));
  const y = ((76 - clampedLat) / 144) * 520;
  return { x, y };
}

// Scaled coordinate projection and dynamic spot separation is computed inside InteractiveMap
// using computedCitySpots with collision avoidance and screen-space clearance guarantees.

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onOpenDetail,
}) => {
  const [filter, setFilter] = useState<'all' | 'visited' | 'wishlist'>('all');
  const [hoveredEntry, setHoveredEntry] = useState<JournalEntry | null>(null);
  const [hoveredSpot, setHoveredSpot] = useState<TravelSpot | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<TravelSpot | null>(null);

  // Deep zoom & Pan state: zoomLevel from 1 (world) up to 30 (ultra close-up city street scale)
  const MAX_ZOOM = 30;
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [center, setCenter] = useState<{ x: number; y: number }>({ x: 500, y: 260 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startCenterX: number; startCenterY: number } | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Active city selection for mountain spots and in-map city card
  const [activeCityId, setActiveCityId] = useState<string | null>(selectedEntryId);
  const [isCityPanelDismissed, setIsCityPanelDismissed] = useState(false);

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

  // Active city entry
  const activeCityEntry = useMemo(() => {
    return travelEntries.find((e) => e.id === activeCityId) || null;
  }, [travelEntries, activeCityId]);

  // When parent passes a selectedEntryId, zoom in closely and open in-map card
  useEffect(() => {
    if (selectedEntryId && selectedEntryId !== activeCityId) {
      const entry = travelEntries.find((e) => e.id === selectedEntryId);
      if (entry && entry.coordinates) {
        setActiveCityId(selectedEntryId);
        setIsCityPanelDismissed(false);
        const { x, y } = projectCoords(entry.coordinates.lat, entry.coordinates.lng);
        setCenter({ x, y });
        setZoomLevel(16);
        setSelectedSpot(null);
      }
    }
  }, [selectedEntryId, travelEntries, activeCityId]);

  // Zoom helpers with bounds [1, 30]
  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.min(MAX_ZOOM, Math.max(1, +(prev + delta).toFixed(2)));
      if (next === 1) {
        setCenter({ x: 500, y: 260 });
      }
      return next;
    });
  };

  const handleReset = () => {
    setZoomLevel(1);
    setCenter({ x: 500, y: 260 });
    setActiveCityId(null);
    setSelectedSpot(null);
    setIsCityPanelDismissed(false);
  };

  // Zoom into a specific city and pull up entry inside the map (NO page scrolling!)
  const handleCityClick = (entry: JournalEntry) => {
    if (!entry.coordinates) return;
    setActiveCityId(entry.id);
    setIsCityPanelDismissed(false);
    setSelectedSpot(null);
    const { x, y } = projectCoords(entry.coordinates.lat, entry.coordinates.lng);
    setCenter({ x, y });
    setZoomLevel(16);
    onSelectEntry(entry);
  };

  // Mouse drag panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        startCenterX: center.x,
        startCenterY: center.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !svgContainerRef.current) return;
    const rect = svgContainerRef.current.getBoundingClientRect();
    const svgWidth = 1000 / zoomLevel;
    const svgHeight = 520 / zoomLevel;

    const dx = (e.clientX - dragStartRef.current.mouseX) * (svgWidth / rect.width);
    const dy = (e.clientY - dragStartRef.current.mouseY) * (svgHeight / rect.height);

    setCenter({
      x: Math.max(svgWidth / 2, Math.min(1000 - svgWidth / 2, dragStartRef.current.startCenterX - dx)),
      y: Math.max(svgHeight / 2, Math.min(520 - svgHeight / 2, dragStartRef.current.startCenterY - dy)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Native non-passive wheel zoom (strictly prevents outer page from scrolling)
  useEffect(() => {
    const el = svgContainerRef.current;
    if (!el) return;

    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.22 : 0.82;

      setZoomLevel((prevZoom) => {
        const nextZoom = Math.min(MAX_ZOOM, Math.max(1, +(prevZoom * zoomFactor).toFixed(2)));
        if (nextZoom === 1) {
          setCenter({ x: 500, y: 260 });
          return 1;
        }

        const rx = Math.max(0, Math.min(1, mouseX / rect.width));
        const ry = Math.max(0, Math.min(1, mouseY / rect.height));

        setCenter((prevCenter) => {
          const currentW = 1000 / prevZoom;
          const currentH = 520 / prevZoom;
          const minX = Math.max(0, Math.min(1000 - currentW, prevCenter.x - currentW / 2));
          const minY = Math.max(0, Math.min(520 - currentH, prevCenter.y - currentH / 2));

          const svgX = minX + rx * currentW;
          const svgY = minY + ry * currentH;

          const nextW = 1000 / nextZoom;
          const nextH = 520 / nextZoom;

          const nextMinX = svgX - rx * nextW;
          const nextMinY = svgY - ry * nextH;

          return {
            x: Math.max(nextW / 2, Math.min(1000 - nextW / 2, nextMinX + nextW / 2)),
            y: Math.max(nextH / 2, Math.min(520 - nextH / 2, nextMinY + nextH / 2)),
          };
        });

        return nextZoom;
      });
    };

    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onNativeWheel);
    };
  }, []);

  // Dynamic ViewBox calculation
  const currentViewBox = useMemo(() => {
    const w = 1000 / zoomLevel;
    const h = 520 / zoomLevel;
    const minX = Math.max(0, Math.min(1000 - w, center.x - w / 2));
    const minY = Math.max(0, Math.min(520 - h, center.y - h / 2));
    return `${minX} ${minY} ${w} ${h}`;
  }, [zoomLevel, center]);

  // Scaled units to proportionally shrink markers, pins & text at high zoom (up to 30x)
  const invZoom = useMemo(() => 1 / zoomLevel, [zoomLevel]);

  // Dynamic sizing based on zoom level:
  // As zoom increases from 1x to 30x, screen dimensions stay balanced without giant icons
  const cityPinRadius = useMemo(() => Math.max(0.35, Math.min(5.2, 5.0 * Math.pow(invZoom, 0.72))), [invZoom]);
  const cityPinStroke = useMemo(() => Math.max(0.06, Math.min(1.2, 1.2 * invZoom)), [invZoom]);
  const cityLabelFontSize = useMemo(() => Math.max(0.7, Math.min(8.5, 9.0 * Math.pow(invZoom, 0.7))), [invZoom]);
  const cityLabelDx = useMemo(() => Math.max(0.55, Math.min(6.5, 6.2 * invZoom)), [invZoom]);
  const cityLabelDy = useMemo(() => Math.max(0.25, Math.min(3.0, 3.0 * invZoom)), [invZoom]);

  // City center in SVG coords
  const activeCityCoords = useMemo(() => {
    if (!activeCityEntry?.coordinates) return null;
    return projectCoords(activeCityEntry.coordinates.lat, activeCityEntry.coordinates.lng);
  }, [activeCityEntry]);

  // Travel spots in currently active city
  const activeCitySpots = useMemo(() => {
    return activeCityEntry?.metadata?.travelSpots || [];
  }, [activeCityEntry]);

  // Dynamic visual separation & collision avoidance for mapped spots:
  // Ensures spots and icons maintain clear degree of separation as you zoom in (scalable up to 50+ locations)
  const computedCitySpots = useMemo(() => {
    if (!activeCityCoords || activeCitySpots.length === 0) return [];

    const cityX = activeCityCoords.x;
    const cityY = activeCityCoords.y;

    // Minimum physical clearance in SVG units:
    // Screen distance is at least 32-36 pixels on screen (scaled by zoomLevel)
    const minSvgDist = Math.max(0.45, 34 / zoomLevel);

    // Initial position based on geographic coords if present, else golden spiral
    const list = activeCitySpots.map((spot, idx) => {
      let x = cityX;
      let y = cityY;

      if (spot.coordinates) {
        const raw = projectCoords(spot.coordinates.lat, spot.coordinates.lng);
        const dx = raw.x - cityX;
        const dy = raw.y - cityY;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.00005) {
          // As zoomLevel increases, geographic neighborhood separation expands
          const spreadFactor = Math.max(1.2, Math.min(8, zoomLevel / 3.2));
          x = cityX + dx * spreadFactor;
          y = cityY + dy * spreadFactor;
        } else {
          const angle = idx * 2.39996;
          const r = Math.sqrt(idx + 1) * minSvgDist * 1.05;
          x = cityX + Math.cos(angle) * r;
          y = cityY + Math.sin(angle) * r;
        }
      } else {
        const angle = idx * 2.39996;
        const r = Math.sqrt(idx + 1) * minSvgDist * 1.12;
        x = cityX + Math.cos(angle) * r;
        y = cityY + Math.sin(angle) * r;
      }

      return { spot, x, y, idx };
    });

    // Multi-pass repulsion relaxation (guarantees clear differentiation even with 50 locations)
    for (let iter = 0; iter < 12; iter++) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const dx = list[j].x - list[i].x;
          const dy = list[j].y - list[i].y;
          const dist = Math.hypot(dx, dy);

          if (dist < minSvgDist) {
            const overlap = minSvgDist - dist;
            let nx = 1;
            let ny = 0;
            if (dist > 0.0001) {
              nx = dx / dist;
              ny = dy / dist;
            } else {
              const theta = (i + j + 1) * 1.618;
              nx = Math.cos(theta);
              ny = Math.sin(theta);
            }
            list[i].x -= nx * (overlap * 0.55);
            list[i].y -= ny * (overlap * 0.55);
            list[j].x += nx * (overlap * 0.55);
            list[j].y += ny * (overlap * 0.55);
          }
        }
      }
    }

    return list;
  }, [activeCityCoords, activeCitySpots, zoomLevel]);

  // Cartographic dynamic scale bar in kilometers
  const scaleInfo = useMemo(() => {
    const targetKm = 3600 / zoomLevel;
    let km = 2000;
    if (targetKm < 40) km = 25;
    else if (targetKm < 80) km = 50;
    else if (targetKm < 150) km = 100;
    else if (targetKm < 300) km = 200;
    else if (targetKm < 700) km = 500;
    else if (targetKm < 1500) km = 1000;
    else km = 2000;

    // 1 SVG unit = 40 km -> scale bar width in SVG units:
    const svgWidth = km / 40;
    return { km, label: `${km.toLocaleString()} km`, svgWidth };
  }, [zoomLevel]);

  return (
    <div
      className="relative w-full rounded-3xl bg-[#DCEBF2] border border-[#CBDDE8] overflow-hidden shadow-xs select-none"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Map Header Utility Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#FBF9F5]/95 border-b border-[#CBDDE8] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#2B4C6F]/10 text-[#2B4C6F]">
            <MapIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-[#1C1917] font-sans">
              Travel Cartography
            </h3>
            <div className="flex items-center gap-2 text-xs text-[#2B4C6F]/80">
              <span>{visitedCount} Dispatches Documented</span>
              <span aria-hidden="true">·</span>
              <span>{wishlistCount} Horizons Ahead</span>
              {zoomLevel > 1.2 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[11px] bg-[#2B4C6F]/10 px-1.5 py-0.5 rounded text-[#2B4C6F] font-semibold">
                    {zoomLevel.toFixed(1)}x Zoom (Up to 30x)
                  </span>
                </>
              )}
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

        {/* Zoom Controls & Slider (Up to 30x) */}
        <div
          className="flex items-center gap-2"
          onWheel={(e) => e.stopPropagation()}
        >
          {zoomLevel > 1.2 && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#2B4C6F] bg-white hover:bg-[#EEF4F7] rounded-lg transition-colors border border-[#CBDDE8] shadow-2xs cursor-pointer mr-1"
              title="Reset to World View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>World View</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/80 rounded-xl border border-[#CBDDE8] shadow-2xs">
            <button
              type="button"
              onClick={() => handleZoom(-2.5)}
              title="Zoom Out (-)"
              disabled={zoomLevel <= 1}
              className="p-1 text-[#2B4C6F] hover:bg-[#EEF4F7] disabled:opacity-40 rounded-md transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-1">
              <input
                type="range"
                min="1"
                max={MAX_ZOOM}
                step="0.5"
                value={zoomLevel}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setZoomLevel(val);
                  if (val === 1) {
                    setCenter({ x: 500, y: 260 });
                  }
                }}
                className="w-20 sm:w-28 h-1.5 bg-[#CBDDE8] rounded-lg appearance-none cursor-pointer accent-[#2B4C6F]"
                title={`Map Zoom Level: ${zoomLevel.toFixed(1)}x / 30x`}
              />
              <span className="text-[11px] font-mono font-medium text-[#2B4C6F] w-9 text-right">
                {zoomLevel.toFixed(1)}x
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleZoom(2.5)}
              title="Zoom In (+)"
              disabled={zoomLevel >= MAX_ZOOM}
              className="p-1 text-[#2B4C6F] hover:bg-[#EEF4F7] disabled:opacity-40 rounded-md transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Map SVG Canvas with Smooth ViewBox Zoom & Drag Panning */}
      <div
        ref={svgContainerRef}
        className={`relative w-full h-[540px] sm:h-[600px] lg:h-[680px] overflow-hidden bg-[#DCEBF2] select-none ${
          zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
        style={{
          overscrollBehavior: 'contain',
          touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox={currentViewBox}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Coastal Shelf Glow Filter */}
            <filter id="coastalShelf" x="-10%" y="-10%" width="120%" height="120%">
              <feMorphology operator="dilate" radius="1.2" in="SourceAlpha" result="dilated" />
              <feGaussianBlur in="dilated" stdDeviation="1.0" result="blurred" />
              <feFlood floodColor="#CCE3EE" floodOpacity="0.85" result="flood" />
              <feComposite in="flood" in2="blurred" operator="in" result="shelf" />
              <feMerge>
                <feMergeNode in="shelf" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Realistic Ocean Bathymetry Gradient */}
            <radialGradient id="oceanShading" cx="50%" cy="48%" r="65%">
              <stop offset="0%" stopColor="#DFEFF7" />
              <stop offset="60%" stopColor="#D4E7F2" />
              <stop offset="100%" stopColor="#C4DEEC" />
            </radialGradient>
          </defs>

          {/* Oceanic Bathymetry Background */}
          <rect width="1000" height="520" fill="url(#oceanShading)" />

          {/* Graticule Latitude / Longitude Grid */}
          <g stroke="#BCD7E5" strokeWidth={Math.max(0.08, 0.35 * invZoom)} strokeDasharray={`${Math.max(0.4, 2.5 * invZoom)} ${Math.max(0.4, 2.5 * invZoom)}`}>
            {/* Arctic Circle 66.5°N */}
            <line x1="0" y1="34" x2="1000" y2="34" />
            {/* 45°N Mid Latitude */}
            <line x1="0" y1="112" x2="1000" y2="112" />
            {/* Tropic of Cancer 23.5°N */}
            <line x1="0" y1="189" x2="1000" y2="189" />
            {/* Tropic of Capricorn 23.5°S */}
            <line x1="0" y1="331" x2="1000" y2="331" />
            {/* 45°S Mid Latitude */}
            <line x1="0" y1="408" x2="1000" y2="408" />
            {/* Antarctic Circle 66.5°S */}
            <line x1="0" y1="486" x2="1000" y2="486" />

            {/* Longitude Meridians */}
            <line x1="125" y1="0" x2="125" y2="520" />
            <line x1="250" y1="0" x2="250" y2="520" />
            <line x1="375" y1="0" x2="375" y2="520" />
            <line x1="625" y1="0" x2="625" y2="520" />
            <line x1="750" y1="0" x2="750" y2="520" />
            <line x1="875" y1="0" x2="875" y2="520" />
          </g>

          {/* Prime Meridian (0°) & Equator Main Solid Reference Guides */}
          <line x1="500" y1="0" x2="500" y2="520" stroke="#ADCDE0" strokeWidth={Math.max(0.12, 0.6 * invZoom)} />
          <line x1="0" y1="260" x2="1000" y2="260" stroke="#ADCDE0" strokeWidth={Math.max(0.12, 0.6 * invZoom)} />

          {/* Cartographic Graticule Text Annotations */}
          <g fill="#7A9EB5" fontSize={Math.max(0.4, 2.8 * invZoom)} className="font-mono select-none pointer-events-none">
            <text x="8" y="258">EQUATOR · 0°</text>
            <text x="8" y="187">TROPIC OF CANCER · 23.5°N</text>
            <text x="8" y="329">TROPIC OF CAPRICORN · 23.5°S</text>
            <text x="502" y={Math.max(3, 10 * invZoom)} textAnchor="start">PRIME MERIDIAN · 0°</text>
          </g>

          {/* REALISTIC DETAILED GEOGRAPHIC CONTINENTS */}
          <g filter="url(#coastalShelf)">
            <g fill="#DCE7DB" stroke="#9BB59A" strokeWidth={Math.max(0.15, 0.7 * invZoom)} strokeLinejoin="round" strokeLinecap="round">
              {/* North America (Detailed coastlines: Alaska, Hudson Bay, Gulf of Mexico, Florida) */}
              <path d="
                M 40 55
                C 50 48, 65 44, 85 45
                C 105 45, 120 38, 140 40
                C 160 42, 175 48, 190 52
                C 200 48, 215 50, 225 54
                C 240 46, 255 42, 270 48
                C 280 55, 290 68, 280 78
                C 268 88, 260 98, 274 104
                C 288 102, 302 92, 316 85
                C 330 80, 342 90, 336 102
                C 328 112, 316 116, 306 120
                C 318 128, 326 136, 312 144
                C 300 148, 290 158, 282 172
                C 284 186, 288 198, 282 206
                C 275 212, 264 214, 252 216
                C 242 220, 234 214, 226 204
                C 214 196, 202 190, 190 178
                C 182 164, 172 154, 162 142
                C 150 130, 136 118, 122 110
                C 106 104, 88 100, 72 98
                C 54 95, 42 80, 40 55 Z
              " />

              {/* Greenland */}
              <path d="
                M 324 32
                C 345 26, 375 25, 395 36
                C 406 50, 396 70, 382 82
                C 364 86, 342 84, 332 70
                C 322 58, 318 42, 324 32 Z
              " />

              {/* Iceland */}
              <path d="
                M 434 38
                C 442 34, 452 34, 458 40
                C 464 46, 460 54, 452 58
                C 442 60, 434 56, 428 50
                C 424 44, 428 40, 434 38 Z
              " />

              {/* Central America Isthmus */}
              <path d="
                M 234 218
                C 244 224, 256 230, 268 242
                C 274 250, 278 260, 268 264
                C 258 262, 250 252, 242 242
                C 234 232, 230 224, 234 218 Z
              " />

              {/* Caribbean Islands */}
              <path d="M 294 212 C 310 208, 324 212, 330 218 C 322 222, 306 220, 294 212 Z" />
              <path d="M 336 220 C 346 218, 355 220, 360 226 C 352 228, 342 226, 336 220 Z" />

              {/* South America (Amazon Basin, Andes profile, Cape Horn) */}
              <path d="
                M 268 262
                C 285 254, 315 250, 342 262
                C 366 272, 390 290, 396 316
                C 398 338, 386 366, 374 392
                C 360 418, 344 446, 330 472
                C 322 482, 314 478, 312 466
                C 306 446, 312 418, 310 395
                C 308 370, 296 342, 286 318
                C 276 294, 266 278, 268 262 Z
              " />

              {/* British Isles (Great Britain & Ireland) */}
              <path d="
                M 472 92
                C 480 86, 490 88, 494 98
                C 496 110, 486 120, 480 126
                C 472 128, 466 120, 468 108
                C 470 98, 468 94, 472 92 Z
              " />
              <path d="
                M 458 102
                C 464 98, 470 102, 468 112
                C 464 118, 456 118, 454 110
                C 454 104, 456 102, 458 102 Z
              " />

              {/* Scandinavia (Norway, Sweden, Finland) */}
              <path d="
                M 510 38
                C 526 32, 548 36, 560 48
                C 568 62, 556 82, 544 98
                C 532 102, 522 92, 518 78
                C 514 62, 506 48, 510 38 Z
              " />

              {/* Continental Europe & Iberian Peninsula (Portugal & Spain) */}
              <path d="
                M 454 132
                C 464 122, 485 116, 515 112
                C 550 110, 572 116, 582 132
                C 568 145, 555 152, 538 150
                C 526 156, 512 162, 495 160
                C 476 160, 458 156, 452 144
                C 450 138, 452 134, 454 132 Z
              " />

              {/* Italy Boot & Sicily */}
              <path d="
                M 526 142
                C 532 148, 538 158, 544 168
                C 542 174, 534 172, 530 162
                C 526 154, 524 146, 526 142 Z
              " />
              <circle cx="530" cy="176" r={Math.max(0.6, 2.8 * invZoom)} />

              {/* Africa */}
              <path d="
                M 468 162
                C 505 158, 548 165, 582 182
                C 610 205, 624 235, 616 270
                C 610 305, 592 342, 574 374
                C 555 402, 538 412, 526 405
                C 514 398, 508 375, 498 340
                C 490 310, 482 280, 474 250
                C 468 225, 455 200, 456 182
                C 458 168, 462 164, 468 162 Z
              " />

              {/* Madagascar */}
              <path d="
                M 632 328
                C 638 322, 644 326, 646 338
                C 648 355, 640 375, 634 382
                C 628 382, 626 368, 628 350
                C 630 338, 628 332, 632 328 Z
              " />

              {/* Eurasia / Russia / Asia Continental Mass */}
              <path d="
                M 580 112
                C 620 98, 680 85, 750 82
                C 810 80, 870 82, 920 95
                C 955 105, 968 120, 955 135
                C 940 148, 915 152, 895 162
                C 878 172, 868 190, 852 205
                C 840 215, 825 210, 810 205
                C 798 195, 785 190, 770 185
                C 745 178, 720 182, 695 186
                C 670 190, 645 182, 625 174
                C 605 164, 592 140, 580 112 Z
              " />

              {/* Arabian Peninsula */}
              <path d="
                M 618 185
                C 638 182, 658 186, 668 198
                C 676 210, 672 225, 662 238
                C 648 248, 632 242, 625 228
                C 618 214, 614 198, 618 185 Z
              " />

              {/* Indian Subcontinent */}
              <path d="
                M 700 188
                C 715 188, 732 195, 742 208
                C 750 220, 752 236, 746 252
                C 738 270, 725 285, 715 292
                C 706 285, 698 265, 692 245
                C 686 225, 688 205, 700 188 Z
              " />

              {/* Southeast Asia (Indochina & Malay Peninsula) */}
              <path d="
                M 770 195
                C 788 195, 802 204, 808 218
                C 814 232, 818 248, 816 264
                C 812 278, 805 290, 800 298
                C 796 295, 794 280, 792 265
                C 788 248, 782 232, 772 215
                C 768 205, 768 198, 770 195 Z
              " />

              {/* East Asia: Korean Peninsula */}
              <path d="M 856 160 C 864 162, 868 172, 864 182 C 858 188, 852 184, 850 175 C 848 168, 852 162, 856 160 Z" />

              {/* Japan Main Islands (Honshu, Hokkaido, Kyushu, Shikoku) */}
              <path d="
                M 885 142
                C 892 138, 902 142, 900 152
                C 896 160, 888 162, 882 155
                C 880 148, 882 144, 885 142 Z
              " />
              <path d="
                M 872 158
                C 880 152, 892 155, 898 164
                C 902 172, 896 182, 886 188
                C 876 190, 868 182, 866 172
                C 864 164, 868 160, 872 158 Z
              " />
              <path d="M 860 188 C 865 186, 869 190, 866 196 C 862 198, 858 196, 858 192 C 858 189, 859 188, 860 188 Z" />
              <path d="M 870 186 C 876 185, 878 189, 876 194 C 872 196, 868 194, 868 190 C 868 187, 869 186, 870 186 Z" />

              {/* Taiwan Island */}
              <path d="M 838 214 C 843 210, 848 214, 846 224 C 842 232, 836 232, 834 224 C 832 218, 835 215, 838 214 Z" />

              {/* Philippines Archipelago */}
              <path d="M 846 238 C 852 236, 856 242, 854 250 C 850 256, 846 254, 844 248 C 842 242, 844 239, 846 238 Z" />
              <path d="M 852 258 C 858 256, 862 262, 860 270 C 856 274, 850 272, 848 266 C 848 261, 850 259, 852 258 Z" />

              {/* Indonesia (Sumatra, Java, Borneo, Sulawesi) */}
              <path d="M 788 300 C 802 308, 814 320, 804 326 C 792 328, 782 316, 785 304 C 786 301, 787 300, 788 300 Z" />
              <path d="M 818 290 C 832 286, 842 295, 838 310 C 832 320, 820 318, 816 308 C 814 298, 815 292, 818 290 Z" />
              <path d="M 822 328 C 836 328, 848 332, 844 338 C 832 342, 818 338, 820 330 C 820 328, 821 328, 822 328 Z" />

              {/* Australia & Tasmania */}
              <path d="
                M 850 350
                C 875 338, 915 342, 942 360
                C 962 378, 960 410, 948 435
                C 932 455, 898 462, 870 458
                C 845 450, 832 432, 828 410
                C 824 385, 830 362, 850 350 Z
              " />
              <path d="M 915 470 C 924 466, 930 472, 926 480 C 920 485, 912 482, 912 476 C 912 472, 914 470, 915 470 Z" />

              {/* New Zealand (North & South Islands) */}
              <path d="
                M 978 432
                C 984 426, 990 430, 988 440
                C 985 448, 978 450, 975 444
                C 974 438, 976 434, 978 432 Z
              " />
              <path d="
                M 965 446
                C 972 440, 978 445, 976 456
                C 972 468, 962 475, 958 468
                C 956 458, 960 450, 965 446 Z
              " />
            </g>
          </g>

          {/* MAJOR RIVERS (Realistic cartography accents) */}
          <g stroke="#BCD7E5" strokeWidth={Math.max(0.1, 0.45 * invZoom)} fill="none" opacity="0.8">
            {/* Amazon River */}
            <path d="M 285 290 Q 320 282 360 274 T 385 272" />
            {/* Mississippi River */}
            <path d="M 235 110 Q 242 140 248 180 T 252 216" />
            {/* Nile River */}
            <path d="M 570 280 Q 568 220 562 170" />
            {/* Danube River */}
            <path d="M 495 130 Q 520 135 550 138" />
            {/* Yangtze River */}
            <path d="M 770 178 Q 805 174 845 175" />
          </g>

          {/* CITY DISPATCH MARKERS (Green = Visited, Gold = Wishlist) */}
          {displayedEntries.map((entry) => {
            if (!entry.coordinates) return null;
            const { x, y } = projectCoords(entry.coordinates.lat, entry.coordinates.lng);
            const isSelected = entry.id === activeCityId;
            const isHovered = hoveredEntry?.id === entry.id;
            const isWishlist = entry.metadata?.status === 'wishlist';

            const primaryColor = isWishlist ? '#E89A3C' : '#2D5A43';
            const ringColor = isWishlist ? 'rgba(232, 154, 60, 0.35)' : 'rgba(45, 90, 67, 0.35)';

            const r = isSelected
              ? cityPinRadius * 1.35
              : isHovered
              ? cityPinRadius * 1.2
              : cityPinRadius;

            const cityLabel = entry.location?.split(',')[0] || entry.title;

            return (
              <g
                key={entry.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCityClick(entry);
                }}
                onMouseEnter={() => setHoveredEntry(entry)}
                onMouseLeave={() => setHoveredEntry(null)}
              >
                {/* Outer Pulse Halo on selected or hovered */}
                {(isSelected || isHovered) && (
                  <circle
                    r={r * 2.2}
                    fill={ringColor}
                    className="animate-pulse"
                  />
                )}

                {/* City Center Pin Dot */}
                <circle
                  r={r}
                  fill={primaryColor}
                  stroke="#FFFFFF"
                  strokeWidth={cityPinStroke}
                  className="transition-all duration-200"
                />

                {/* Inner White Dot for Crisp Pin Target */}
                <circle
                  r={r * 0.45}
                  fill="#FFFFFF"
                  className="pointer-events-none"
                />

                {/* Proportional City Label with Clean Halo (Adjusts inversely to zoom up to 30x) */}
                <text
                  x={cityLabelDx}
                  y={cityLabelDy}
                  textAnchor="start"
                  fontSize={cityLabelFontSize}
                  className={`font-sans font-medium select-none pointer-events-none transition-all ${
                    isSelected
                      ? 'fill-[#1C1917] font-bold'
                      : isHovered
                      ? 'fill-[#2B4C6F] font-bold'
                      : 'fill-[#1F2937]'
                  }`}
                  style={{
                    textShadow:
                      '0 0.5px 1.5px rgba(255, 255, 255, 0.98), 0 -0.5px 1.5px rgba(255, 255, 255, 0.98), 0.5px 0 1.5px rgba(255, 255, 255, 0.98), -0.5px 0 1.5px rgba(255, 255, 255, 0.98)',
                  }}
                >
                  {cityLabel}
                </text>
              </g>
            );
          })}

          {/* MOUNTAIN SPOTS LAYER - WITH DYNAMIC DEGREE OF SEPARATION & COLLISION AVOIDANCE */}
          {activeCityEntry && activeCityCoords && zoomLevel > 2.0 && (
            <g className="mountain-spots-layer">
              {/* Connector lines from city center to mountain spots */}
              {computedCitySpots.map(({ spot, x, y, idx }) => (
                <line
                  key={`line-${idx}`}
                  x1={activeCityCoords.x}
                  y1={activeCityCoords.y}
                  x2={x}
                  y2={y}
                  stroke="#2D5A43"
                  strokeWidth={Math.max(0.04, 0.25 * invZoom)}
                  strokeDasharray={`${Math.max(0.15, 0.7 * invZoom)} ${Math.max(0.15, 0.7 * invZoom)}`}
                  opacity="0.45"
                />
              ))}

              {/* Individual Micro-Spot Markers with guaranteed clearance & differentiation */}
              {computedCitySpots.map(({ spot, x, y, idx }) => {
                const isSpotSelected = selectedSpot?.name === spot.name;
                const isSpotHovered = hoveredSpot?.name === spot.name;

                // Ultra-compact radius scaled with power curve so it stays crisp and readable at 30x
                const spotR = Math.max(0.24, Math.min(2.5, (isSpotSelected ? 3.4 : 2.5) * Math.pow(invZoom, 0.78)));
                const spotStrokeW = Math.max(0.04, Math.min(0.55, 0.55 * invZoom));
                const spotEmojiSize = Math.max(0.42, Math.min(2.8, 2.8 * Math.pow(invZoom, 0.78)));

                // Pill label: compact, neat and shown elegantly
                const pillH = Math.max(0.6, Math.min(4.4, 4.6 * Math.pow(invZoom, 0.82)));
                const pillRx = pillH / 2;
                const pillFontSize = Math.max(0.45, Math.min(3.2, 3.4 * Math.pow(invZoom, 0.82)));
                const charW = Math.max(0.24, Math.min(1.8, 1.8 * Math.pow(invZoom, 0.82)));
                const displayName = spot.name.length > 16 ? `${spot.name.slice(0, 14)}…` : spot.name;
                const pillW = displayName.length * charW + pillH;
                const pillY = spotR + Math.max(0.15, 0.6 * invZoom);

                return (
                  <g
                    key={`spot-${idx}`}
                    transform={`translate(${x}, ${y})`}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSpot(spot);
                    }}
                    onMouseEnter={() => setHoveredSpot(spot)}
                    onMouseLeave={() => setHoveredSpot(null)}
                  >
                    {/* Outer pulse when selected or hovered */}
                    {(isSpotSelected || isSpotHovered) && (
                      <circle
                        r={spotR * 1.8}
                        fill="rgba(45, 90, 67, 0.25)"
                        className="animate-pulse"
                      />
                    )}

                    {/* Compact Mountain Marker Background Badge */}
                    <circle
                      r={spotR}
                      fill={isSpotSelected ? '#2D5A43' : isSpotHovered ? '#3D7A5B' : '#FFFFFF'}
                      stroke="#2D5A43"
                      strokeWidth={spotStrokeW}
                      className="transition-all duration-150"
                    />

                    {/* Mountain Emoji Symbol */}
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={spotEmojiSize}
                      className="select-none pointer-events-none"
                      y="-0.08"
                    >
                      🏔️
                    </text>

                    {/* Minimized Compact Name Pill */}
                    <g transform={`translate(0, ${pillY})`}>
                      <rect
                        x={-pillW / 2}
                        y="0"
                        width={pillW}
                        height={pillH}
                        rx={pillRx}
                        fill={isSpotSelected ? '#1C1917' : isSpotHovered ? '#2B4C6F' : '#FFFFFF'}
                        stroke={isSpotSelected ? '#1C1917' : '#CBDDE8'}
                        strokeWidth={Math.max(0.04, 0.22 * invZoom)}
                        className="shadow-2xs"
                      />
                      <text
                        x="0"
                        y={pillH * 0.72}
                        textAnchor="middle"
                        fontSize={pillFontSize}
                        className={`font-sans font-medium select-none pointer-events-none ${
                          isSpotSelected || isSpotHovered ? 'fill-white font-semibold' : 'fill-[#2B4C6F]'
                        }`}
                      >
                        {displayName}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          )}

          {/* Cartographic Dynamic Distance Scale Bar in SVG */}
          <g transform={`translate(${center.x + (500 / zoomLevel) - scaleInfo.svgWidth - (15 / zoomLevel)}, ${center.y + (260 / zoomLevel) - (14 / zoomLevel)})`} className="pointer-events-none select-none">
            {/* Scale Bar Track */}
            <rect
              x={-2 / zoomLevel}
              y={-7 / zoomLevel}
              width={scaleInfo.svgWidth + (4 / zoomLevel)}
              height={12 / zoomLevel}
              rx={2 / zoomLevel}
              fill="rgba(255, 255, 255, 0.85)"
              stroke="#CBDDE8"
              strokeWidth={Math.max(0.04, 0.25 * invZoom)}
            />
            <line
              x1={0}
              y1={0}
              x2={scaleInfo.svgWidth}
              y2={0}
              stroke="#2B4C6F"
              strokeWidth={Math.max(0.06, 0.5 * invZoom)}
            />
            {/* Left and Right Ticks */}
            <line
              x1={0}
              y1={-1.5 / zoomLevel}
              x2={0}
              y2={1.5 / zoomLevel}
              stroke="#2B4C6F"
              strokeWidth={Math.max(0.06, 0.5 * invZoom)}
            />
            <line
              x1={scaleInfo.svgWidth}
              y1={-1.5 / zoomLevel}
              x2={scaleInfo.svgWidth}
              y2={1.5 / zoomLevel}
              stroke="#2B4C6F"
              strokeWidth={Math.max(0.06, 0.5 * invZoom)}
            />
            {/* Scale Text Label */}
            <text
              x={scaleInfo.svgWidth / 2}
              y={-2 / zoomLevel}
              textAnchor="middle"
              fontSize={Math.max(0.45, 3.2 * invZoom)}
              className="fill-[#2B4C6F] font-mono font-medium"
            >
              {scaleInfo.label}
            </text>
          </g>
        </svg>

        {/* IN-MAP CITY DISPATCH PANEL: Compact & Space-Efficient with Auto-Hiding Scrollbar */}
        {activeCityEntry && !isCityPanelDismissed && !selectedSpot && (
          <div
            className="absolute top-3.5 left-3.5 z-30 max-w-[275px] sm:max-w-[310px] w-full bg-white/95 rounded-2xl border border-[#CBDDE8] shadow-xl backdrop-blur-md p-3 sm:p-3.5 animate-in fade-in zoom-in-95 duration-200 scrollbar-auto-hide"
            style={{ overscrollBehavior: 'contain' }}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#2D5A43]">
                  <span>{activeCityEntry.metadata?.status === 'visited' ? '● Visited' : '✦ Wishlist'}</span>
                  {activeCityEntry.metadata?.travelSeason && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#78716C] font-normal">{activeCityEntry.metadata.travelSeason}</span>
                    </>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-serif font-bold text-[#1C1917] leading-tight mt-0.5">
                  {activeCityEntry.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCityPanelDismissed(true)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="Minimize dispatch panel"
                title="Minimize panel"
              >
                <X size={15} />
              </button>
            </div>

            {/* City Cover Image (Compact) */}
            {activeCityEntry.coverPhoto && (
              <div className="mt-2 overflow-hidden rounded-lg h-20 sm:h-22 bg-stone-100 border border-stone-200/80">
                <img
                  src={activeCityEntry.coverPhoto}
                  alt={activeCityEntry.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Field Memory Quote */}
            {activeCityEntry.metadata?.bestMemory ? (
              <p className="mt-2 text-[11px] italic text-[#2B4C6F] bg-[#F2F6FA] p-2 rounded-lg border border-[#DDE7F0] line-clamp-2">
                "{activeCityEntry.metadata.bestMemory}"
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-[#57534E] line-clamp-2 leading-relaxed">
                {activeCityEntry.summary}
              </p>
            )}

            {/* Saved Mountain Spots List in this city (Auto-hiding scrollbar) */}
            {activeCitySpots.length > 0 && (
              <div className="mt-2 pt-1.5 border-t border-[#F0F4F7]">
                <div className="flex items-center justify-between text-[10px] font-medium text-[#78716C] mb-1">
                  <span>Saved Spots ({activeCitySpots.length})</span>
                  <span className="text-[#2D5A43]">Click to view details</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto overscroll-contain pr-0.5 scrollbar-auto-hide">
                  {activeCitySpots.map((spot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSpot(spot)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#FAF8F5] hover:bg-[#EEF4F7] text-[10px] text-[#2B4C6F] font-medium rounded-md border border-[#EDE8E0] transition-colors cursor-pointer shadow-2xs"
                    >
                      <span className="text-[8px]">🏔️</span>
                      <span className="truncate max-w-[110px]">{spot.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Action Button: Read Full Dispatch */}
            <div className="mt-2.5 pt-2 border-t border-[#F0F4F7] flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (onOpenDetail) onOpenDetail(activeCityEntry);
                }}
                className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[#2B4C6F] hover:bg-[#1D3550] text-white text-[11px] font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <BookOpen size={12} />
                <span>Read Dispatch</span>
                <ChevronRight size={12} />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-2 py-1.5 text-[11px] text-[#78716C] hover:text-[#1C1917] hover:bg-stone-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                title="Reset to world view"
              >
                World View
              </button>
            </div>
          </div>
        )}

        {/* Floating Mountain Spot Detail Card: Compact & Sleek */}
        {selectedSpot && (
          <div
            className="absolute top-3.5 right-3.5 z-30 max-w-[275px] sm:max-w-[310px] w-full p-3.5 bg-white/95 rounded-2xl border border-[#CBDDE8] shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 scrollbar-auto-hide"
            style={{ overscrollBehavior: 'contain' }}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1 text-[10px] text-[#2D5A43] font-semibold uppercase tracking-wider">
                  <span>🏔️ Saved Location</span>
                </div>
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#1C1917] mt-0.5 leading-snug">
                  {selectedSpot.name}
                </h4>
                {selectedSpot.neighborhood && (
                  <p className="text-[11px] text-[#78716C] mt-0.5">{selectedSpot.neighborhood}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedSpot(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="Close spot details"
              >
                <X size={15} />
              </button>
            </div>

            {selectedSpot.photoUrl && (
              <div className="mt-2 h-24 rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                <img
                  src={selectedSpot.photoUrl}
                  alt={selectedSpot.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="mt-2.5 flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#57534E]">Danny's Rating:</span>
              <FractionalRating
                type="mountain"
                rating={selectedSpot.mountainRating}
                size={14}
                showNumeric
              />
            </div>

            {selectedSpot.notes && (
              <p className="mt-2 text-[11px] text-[#57534E] italic bg-[#F7F9F7] p-2 rounded-lg border border-[#DCE6DE] leading-relaxed">
                "{selectedSpot.notes}"
              </p>
            )}

            <div className="mt-2.5 pt-2 border-t border-[#F0F4F7] flex items-center justify-between gap-1.5">
              <a
                href={
                  selectedSpot.googleMapsUrl ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${selectedSpot.name} ${activeCityEntry?.location || ''}`
                  )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[#2B4C6F] hover:bg-[#1D3550] text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <MapPin size={12} />
                <span>Google Maps</span>
                <ExternalLink size={11} />
              </a>
              <button
                type="button"
                onClick={() => setSelectedSpot(null)}
                className="px-2 py-1.5 text-[11px] text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
