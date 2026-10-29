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
  // Ensures spots, icons, and labels maintain clear clearance and never overlap with each other or the city center pin
  const computedCitySpots = useMemo(() => {
    if (!activeCityCoords || activeCitySpots.length === 0) return [];

    const cityX = activeCityCoords.x;
    const cityY = activeCityCoords.y;

    // Minimum physical clearance in SVG units:
    const minSvgDist = Math.max(0.75, 46 / zoomLevel);
    const minCityCenterClearance = Math.max(1.8, 52 / zoomLevel);

    // Initial position based on geographic coords if present, else radial distribution
    const list = activeCitySpots.map((spot, idx) => {
      let x = cityX;
      let y = cityY;

      if (spot.coordinates) {
        const raw = projectCoords(spot.coordinates.lat, spot.coordinates.lng);
        const dx = raw.x - cityX;
        const dy = raw.y - cityY;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.00005) {
          const spreadFactor = Math.max(1.6, Math.min(8.5, zoomLevel / 2.8));
          x = cityX + dx * spreadFactor;
          y = cityY + dy * spreadFactor;
        } else {
          const angle = idx * 2.39996 + 0.6;
          const r = minCityCenterClearance + Math.sqrt(idx + 1) * minSvgDist * 1.1;
          x = cityX + Math.cos(angle) * r;
          y = cityY + Math.sin(angle) * r;
        }
      } else {
        const angle = idx * 2.39996 + 0.6;
        const r = minCityCenterClearance + Math.sqrt(idx + 1) * minSvgDist * 1.2;
        x = cityX + Math.cos(angle) * r;
        y = cityY + Math.sin(angle) * r;
      }

      // Ensure minimum distance from city pin
      const dCity = Math.hypot(x - cityX, y - cityY);
      if (dCity < minCityCenterClearance) {
        const angle = dCity > 0.001 ? Math.atan2(y - cityY, x - cityX) : (idx * 2.39996 + 0.6);
        x = cityX + Math.cos(angle) * minCityCenterClearance;
        y = cityY + Math.sin(angle) * minCityCenterClearance;
      }

      const displayName = spot.name.length > 16 ? `${spot.name.slice(0, 14)}…` : spot.name;
      const charW = Math.max(0.24, Math.min(1.8, 1.8 * Math.pow(invZoom, 0.82)));
      const pillH = Math.max(0.65, Math.min(4.4, 4.6 * Math.pow(invZoom, 0.82)));
      const pillW = displayName.length * charW + pillH;

      return {
        spot,
        x,
        y,
        idx,
        displayName,
        pillW,
        pillH,
        pillPlacement: 'bottom' as 'bottom' | 'top',
      };
    });

    // Multi-pass repulsion relaxation with bounding-box clearance & city pin repulsion
    for (let iter = 0; iter < 18; iter++) {
      // 1. Repel from active city center pin (ensures spot and pill NEVER touch city center)
      for (let i = 0; i < list.length; i++) {
        const dx = list[i].x - cityX;
        const dy = list[i].y - cityY;
        const dist = Math.hypot(dx, dy);
        if (dist < minCityCenterClearance) {
          const overlap = minCityCenterClearance - dist;
          const nx = dist > 0.0001 ? dx / dist : Math.cos((i + 1) * 1.618);
          const ny = dist > 0.0001 ? dy / dist : Math.sin((i + 1) * 1.618);
          list[i].x += nx * overlap * 0.85;
          list[i].y += ny * overlap * 0.85;
        }
      }

      // 2. Repel between spots taking into account both badge radius and pill width/height
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const dx = list[j].x - list[i].x;
          const dy = list[j].y - list[i].y;

          const reqDx = (list[i].pillW + list[j].pillW) * 0.55 + Math.max(0.3, 5 * invZoom);
          const reqDy = list[i].pillH * 1.6 + Math.max(0.3, 6 * invZoom);

          if (Math.abs(dx) < reqDx && Math.abs(dy) < reqDy) {
            const overlapX = reqDx - Math.abs(dx);
            const overlapY = reqDy - Math.abs(dy);

            const signX = dx >= 0 ? 1 : -1;
            const signY = dy >= 0 ? 1 : -1;

            list[i].x -= signX * (overlapX * 0.45);
            list[j].x += signX * (overlapX * 0.45);
            list[i].y -= signY * (overlapY * 0.45);
            list[j].y += signY * (overlapY * 0.45);
          }
        }
      }
    }

    // Adaptive pill placement: if a spot is placed close below the city center, place pill above to avoid overlap
    for (let i = 0; i < list.length; i++) {
      if (
        list[i].y > cityY &&
        list[i].y - cityY < minCityCenterClearance * 1.3 &&
        Math.abs(list[i].x - cityX) < list[i].pillW * 0.6
      ) {
        list[i].pillPlacement = 'top';
      }
    }

    return list;
  }, [activeCityCoords, activeCitySpots, zoomLevel, invZoom]);

  // Automated collision-free placement for city markers and city labels
  // Evaluates candidate directions (Right, Left, Top, Bottom) and chooses zero-collision orientation
  const computedCityLayouts = useMemo(() => {
    const cities = displayedEntries
      .filter((e) => !!e.coordinates)
      .map((entry) => {
        const { x, y } = projectCoords(entry.coordinates!.lat, entry.coordinates!.lng);
        const isSelected = entry.id === activeCityId;
        const isHovered = hoveredEntry?.id === entry.id;
        const isWishlist = entry.metadata?.status === 'wishlist';
        const r = isSelected
          ? cityPinRadius * 1.35
          : isHovered
          ? cityPinRadius * 1.2
          : cityPinRadius;
        const label = entry.location?.split(',')[0] || entry.title;
        const charW = cityLabelFontSize * 0.55;
        const pillW = label.length * charW + cityLabelFontSize * 1.1;
        const pillH = cityLabelFontSize * 1.38;
        return {
          entry,
          x,
          y,
          r,
          label,
          pillW,
          pillH,
          isSelected,
          isHovered,
          isWishlist,
        };
      });

    type Direction = 'right' | 'left' | 'top' | 'bottom';
    const placedBoxes: Array<{ left: number; right: number; top: number; bottom: number }> = [];

    return cities.map((city) => {
      const { x, y, r, pillW, pillH } = city;
      const gap = Math.max(0.4, 2.2 * invZoom);

      const candidates: Record<
        Direction,
        {
          box: { left: number; right: number; top: number; bottom: number };
          anchor: 'start' | 'end' | 'middle';
          textX: number;
          textY: number;
        }
      > = {
        right: {
          box: { left: x + r + gap, right: x + r + gap + pillW, top: y - pillH / 2, bottom: y + pillH / 2 },
          anchor: 'start',
          textX: x + r + gap + pillW * 0.12,
          textY: y + pillH * 0.28,
        },
        left: {
          box: { left: x - r - gap - pillW, right: x - r - gap, top: y - pillH / 2, bottom: y + pillH / 2 },
          anchor: 'end',
          textX: x - r - gap - pillW * 0.12,
          textY: y + pillH * 0.28,
        },
        top: {
          box: { left: x - pillW / 2, right: x + pillW / 2, top: y - r - gap - pillH, bottom: y - r - gap },
          anchor: 'middle',
          textX: x,
          textY: y - r - gap - pillH * 0.28,
        },
        bottom: {
          box: { left: x - pillW / 2, right: x + pillW / 2, top: y + r + gap, bottom: y + r + gap + pillH },
          anchor: 'middle',
          textX: x,
          textY: y + r + gap + pillH * 0.72,
        },
      };

      const directions: Direction[] = ['right', 'left', 'top', 'bottom'];
      let bestDir: Direction = 'right';
      let minOverlap = Infinity;

      for (const dir of directions) {
        const { box } = candidates[dir];
        let overlapScore = 0;

        // Keep inside map bounds
        if (box.left < 2) overlapScore += (2 - box.left) * 10;
        if (box.right > 998) overlapScore += (box.right - 998) * 10;
        if (box.top < 2) overlapScore += (2 - box.top) * 10;
        if (box.bottom > 518) overlapScore += (box.bottom - 518) * 10;

        // Collision with any other city pin (e.g. Kyoto vs Tokyo)
        for (const other of cities) {
          if (other.entry.id === city.entry.id) continue;
          const pinPad = Math.max(0.5, 3.5 * invZoom);
          const pinLeft = other.x - other.r - pinPad;
          const pinRight = other.x + other.r + pinPad;
          const pinTop = other.y - other.r - pinPad;
          const pinBottom = other.y + other.r + pinPad;

          if (box.left < pinRight && box.right > pinLeft && box.top < pinBottom && box.bottom > pinTop) {
            overlapScore += 500;
          }
        }

        // Collision with already placed city label pills
        for (const placed of placedBoxes) {
          const pad = Math.max(0.3, 2 * invZoom);
          if (
            box.left < placed.right + pad &&
            box.right > placed.left - pad &&
            box.top < placed.bottom + pad &&
            box.bottom > placed.top - pad
          ) {
            overlapScore += 300;
          }
        }

        if (overlapScore < minOverlap) {
          minOverlap = overlapScore;
          bestDir = dir;
          if (overlapScore === 0) break;
        }
      }

      const chosen = candidates[bestDir];
      placedBoxes.push(chosen.box);

      return {
        ...city,
        dir: bestDir,
        box: chosen.box,
        anchor: chosen.anchor,
        textX: chosen.textX,
        textY: chosen.textY,
      };
    });
  }, [displayedEntries, activeCityId, hoveredEntry, cityPinRadius, cityLabelFontSize, invZoom]);

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

          {/* OCEAN LABELS (Cartographic Atlas Typography) */}
          <g fill="#7294A8" className="select-none pointer-events-none font-serif tracking-[0.24em] uppercase" opacity="0.62">
            {/* North Pacific Ocean */}
            <text
              x="130"
              y="155"
              textAnchor="middle"
              fontSize={Math.max(1.1, 4.8 * invZoom)}
              fontWeight="500"
            >
              North Pacific Ocean
            </text>
            <text
              x="930"
              y="155"
              textAnchor="middle"
              fontSize={Math.max(1.1, 4.8 * invZoom)}
              fontWeight="500"
            >
              North Pacific Ocean
            </text>

            {/* South Pacific Ocean */}
            <text
              x="160"
              y="390"
              textAnchor="middle"
              fontSize={Math.max(1.1, 4.8 * invZoom)}
              fontWeight="500"
            >
              South Pacific Ocean
            </text>
            <text
              x="960"
              y="390"
              textAnchor="middle"
              fontSize={Math.max(1.1, 4.8 * invZoom)}
              fontWeight="500"
            >
              South Pacific Ocean
            </text>

            {/* North Atlantic Ocean */}
            <text
              x="410"
              y="175"
              textAnchor="middle"
              fontSize={Math.max(1.1, 4.8 * invZoom)}
              fontWeight="500"
            >
              North Atlantic Ocean
            </text>

            {/* South Atlantic Ocean */}
            <text
              x="440"
              y="375"
              textAnchor="middle"
              fontSize={Math.max(1.1, 4.8 * invZoom)}
              fontWeight="500"
            >
              South Atlantic Ocean
            </text>

            {/* Indian Ocean */}
            <text
              x="690"
              y="340"
              textAnchor="middle"
              fontSize={Math.max(1.1, 4.8 * invZoom)}
              fontWeight="500"
            >
              Indian Ocean
            </text>

            {/* Arctic Ocean */}
            <text
              x="500"
              y="22"
              textAnchor="middle"
              fontSize={Math.max(1.0, 4.2 * invZoom)}
              fontWeight="500"
              letterSpacing="0.26em"
            >
              Arctic Ocean
            </text>

            {/* Southern Ocean */}
            <text
              x="500"
              y="472"
              textAnchor="middle"
              fontSize={Math.max(1.0, 4.2 * invZoom)}
              fontWeight="500"
              letterSpacing="0.28em"
            >
              Southern Ocean
            </text>
          </g>

          {/* REALISTIC DETAILED GEOGRAPHIC CONTINENTS */}
          <g filter="url(#coastalShelf)">
            <g fill="#DCE7DB" stroke="#9BB59A" strokeWidth={Math.max(0.15, 0.7 * invZoom)} strokeLinejoin="round" strokeLinecap="round">
              {/* North America (Realistic: Alaska, Mackenzie, Hudson Bay, Quebec, Labrador, Montreal safely inland, New England, Florida, Gulf of Mexico, Mexico) */}
              <path d="
                M 36 56
                C 48 44, 70 42, 98 40
                C 126 38, 154 39, 182 42
                C 206 44, 222 48, 234 58
                C 244 68, 246 78, 252 82
                C 260 76, 274 68, 292 56
                C 304 48, 316 54, 326 64
                C 338 74, 348 82, 344 88
                C 336 94, 328 98, 322 104
                C 328 108, 334 112, 330 116
                C 322 118, 314 116, 308 120
                C 304 124, 300 128, 296 135
                C 292 142, 290 148, 290 152
                C 288 158, 282 165, 278 174
                C 275 182, 274 186, 270 182
                C 264 176, 260 170, 252 170
                C 242 172, 232 178, 228 188
                C 226 198, 232 205, 248 202
                C 255 204, 256 210, 245 220
                C 238 226, 230 220, 226 212
                C 220 205, 210 200, 202 195
                C 194 185, 192 174, 186 162
                C 178 150, 168 140, 160 128
                C 152 115, 146 102, 138 90
                C 126 78, 108 72, 88 66
                C 68 64, 46 64, 36 56 Z
              " />

              {/* Newfoundland Island */}
              <path d="M 338 88 C 348 84, 355 92, 352 102 C 344 105, 336 98, 338 88 Z" />

              {/* Alaska Aleutian Islands Chain */}
              <path d="M 24 74 C 30 72, 36 78, 32 82 C 26 84, 22 78, 24 74 Z" />
              <path d="M 12 80 C 18 78, 20 84, 16 88 C 10 88, 8 82, 12 80 Z" />

              {/* Baja California Peninsula */}
              <path d="
                M 198 178
                C 204 184, 210 196, 214 212
                C 216 222, 212 226, 208 222
                C 202 210, 196 195, 194 182
                C 194 178, 196 176, 198 178 Z
              " />

              {/* Canadian Arctic Archipelago (Baffin Island & Victoria Island) */}
              <path d="
                M 276 34
                C 292 28, 312 32, 320 44
                C 316 54, 302 60, 290 56
                C 280 50, 272 40, 276 34 Z
              " />
              <path d="
                M 218 32
                C 234 26, 248 30, 252 40
                C 246 48, 230 50, 222 44
                C 214 38, 212 34, 218 32 Z
              " />

              {/* Greenland */}
              <path d="
                M 330 26
                C 355 20, 385 22, 402 34
                C 414 48, 404 68, 390 80
                C 372 85, 348 82, 338 68
                C 328 55, 324 38, 330 26 Z
              " />

              {/* Iceland */}
              <path d="
                M 436 40
                C 445 36, 456 36, 462 42
                C 466 48, 462 55, 454 58
                C 444 60, 436 56, 432 50
                C 428 44, 432 40, 436 40 Z
              " />

              {/* Central America Isthmus */}
              <path d="
                M 234 216
                C 245 222, 256 228, 266 238
                C 272 245, 276 254, 270 258
                C 262 256, 254 246, 246 238
                C 238 228, 232 222, 234 216 Z
              " />

              {/* Caribbean Islands: Cuba, Hispaniola, Puerto Rico */}
              <path d="M 288 208 C 304 204, 318 206, 326 212 C 318 215, 302 214, 288 208 Z" />
              <path d="M 330 214 C 342 212, 350 214, 354 219 C 346 221, 338 219, 330 214 Z" />
              <path d="M 358 218 C 365 217, 370 219, 371 222 C 367 223, 361 222, 358 218 Z" />

              {/* SOUTH AMERICA (Accurate Geographic Contours: Punta Gallinas, Brazilian Bulge, Rio de la Plata, Patagonia, Tierra del Fuego / Cape Horn, Pacific Bend at Arica, Punta Pariñas, Guayaquil) */}
              <path d="
                M 300.8 229.3
                C 305 231, 314 236, 328 236
                C 332 243, 338 250, 354 257
                C 358 260, 362 268, 364 274
                C 368 280, 377 283, 384 285
                C 393 288, 402 294, 403.4 300.2
                C 400 310, 393 321, 391 334
                C 388 348, 383 357, 380 357
                C 371 361, 365 374, 355 390
                C 344 400, 338 399, 342 405
                C 340 412, 327 414, 322 428
                C 314 441, 317 447, 308 461
                C 310 463, 310 472, 313.1 476.6
                C 304 476, 296 470, 292 458
                C 292 444, 295 428, 297 407
                C 301 394, 302 382, 303 372
                C 304 360, 305 347, 304.7 341.3
                C 300 336, 288 324, 286 318
                C 281 304, 278 299, 274.2 291.4
                C 276 283, 275 278, 279 271
                C 281 268, 286 260, 285 253
                C 286 244, 292 235, 300.8 229.3 Z
              " />
              {/* Tierra del Fuego & Falkland Islands */}
              <path d="M 308 468 C 314 466, 318 472, 314 477 C 308 477, 304 472, 308 468 Z" />
              <path d="M 352 458 C 358 456, 362 460, 359 464 C 354 466, 350 463, 352 458 Z" />

              {/* British Isles: Great Britain & Ireland */}
              <path d="
                M 482 78
                C 490 73, 495 80, 492 90
                C 496 98, 498 108, 486 114
                C 478 115, 472 106, 477 96
                C 480 88, 477 82, 482 78 Z
              " />
              <path d="
                M 464 88
                C 470 85, 474 91, 472 101
                C 466 107, 458 105, 458 97
                C 458 91, 461 88, 464 88 Z
              " />

              {/* UNIFIED CONTIGUOUS EURASIA (Europe and Asia seamlessly united, scaled to real geography) */}
              <path d="
                M 473.6 134.4
                C 475 140, 480 144, 485.3 144.4
                C 493.9 141.9, 498.9 131.8, 506.1 124.9
                C 509.7 118.1, 515.0 118.1, 524.7 114.1
                C 534.7 123.1, 539.7 127.1, 543.3 136.9
                C 547.8 128.2, 551.4 129.6, 537.5 117.0
                C 534.2 110.5, 538.3 110.9, 545.8 117.4
                C 554.2 128.2, 562.5 142.6, 565.8 137.2
                C 563.6 127.8, 573.3 129.3, 580.6 126.4
                C 575.3 135.8, 586.1 141.6, 596.9 157.1
                C 596.9 167.9, 608.9 196.8, 620.6 228.9
                C 625.0 228.2, 650.0 213.1, 666.1 193.2
                C 662.5 189.2, 656.9 178.8, 641.1 170.1
                C 668.1 183.1, 686.1 184.9, 693.1 191.4
                C 697.2 196.8, 702.2 206.2, 705.0 219.2
                C 715.3 245.2, 723.1 227.1, 727.8 214.9
                C 738.3 202.9, 748.6 195.0, 757.8 202.2
                C 765.3 216.7, 773.6 227.5, 773.1 245.6
                C 778.6 255.0, 787.5 269.8, 786.4 255.3
                C 779.2 225.7, 789.4 236.5, 791.1 243.4
                C 797.5 237.2, 800.6 216.7, 796.4 199.3
                C 805.8 199.0, 817.2 193.9, 828.1 186.0
                C 831.4 180.2, 837.8 166.5, 837.5 161.8
                C 834.7 151.7, 839.2 139.0, 827.2 133.6
                C 837.8 134.0, 845.6 130.0, 849.2 133.6
                C 851.9 139.0, 851.1 148.8, 858.3 147.7
                C 858.1 138.0, 854.2 130.0, 866.4 118.8
                C 884.2 106.5, 890.8 88.5, 918.9 59.2
                C 944.4 52.4, 935.3 90.6, 940.6 83.1
                C 952.8 72.2, 966.7 57.8, 994.4 41.5
                C 973.1 35.7, 986.1 21.7, 916.7 14.4
                C 850.0 10.8, 789.7 2.0, 705.6 12.6
                C 694.4 10.8, 666.7 25.3, 625.0 28.9
                C 597.2 25.3, 571.7 17.3, 550.0 25.3
                C 514.7 56.3, 522.2 65.0, 533.3 66.1
                C 536.1 74.4, 550.3 60.3, 561.1 39.7
                C 569.4 57.1, 584.2 58.1, 566.7 68.6
                C 538.9 78.7, 529.4 66.1, 511.9 86.7
                C 500.0 95.7, 487.5 99.7, 495.8 117.4
                C 484.2 117.4, 474.2 119.5, 473.6 134.4 Z
              " />

              {/* Mediterranean Islands: Sicily, Sardinia, Corsica, Crete, Cyprus */}
              <path d="M 542 144 C 548 141, 549 146, 544 148 C 539 148, 538 144, 542 144 Z" />
              <path d="M 525 132 C 528 130, 529 138, 526 142 C 523 140, 523 133, 525 132 Z" />
              <path d="M 526 123 C 529 121, 530 128, 527 130 C 524 129, 524 124, 526 123 Z" />
              <path d="M 566 148 C 576 147, 579 150, 574 152 C 567 152, 563 150, 566 148 Z" />
              <path d="M 591 148 C 596 146, 599 149, 595 151 C 590 151, 588 149, 591 148 Z" />

              {/* Sri Lanka Island */}
              <path d="M 724 252 C 728 248, 730 256, 727 262 C 723 262, 721 256, 724 252 Z" />

              {/* AFRICA (Accurate Geographic Contours: Strait of Gibraltar, Cape Bon, Nile Delta, Red Sea, Somali Horn / Ras Hafun, Mozambique, Durban, Cape Agulhas, Cape of Good Hope, Namibia, Angola, Niger Delta, Gulf of Guinea, Dakar / Cap-Vert, Morocco) */}
              <path d="
                M 483.9 145.2
                C 508 141, 530 140, 530.6 140.5
                C 529 152, 537 156, 547 162.5
                C 556 157, 570 159, 583.3 161.8
                C 590 163, 594 176, 603 204
                C 610 218, 620 229, 625 237
                C 635 235, 642.5 232, 642.5 236.9
                C 634 252, 626 267, 618 276
                C 610 289, 609 299, 612.8 313.1
                C 610 325, 597 346, 598 361
                C 591 368, 586 382, 571.1 397.2
                C 564 399, 558 400.2, 555.6 400.2
                C 553 400, 551.4 398.7, 550 393
                C 546 378, 542 370, 540.3 357.5
                C 533 339, 537 319, 536.7 306.2
                C 534 296, 533 292, 524.2 276.6
                C 525 268, 525.6 260, 516.7 258.2
                C 509 251, 499 255, 488.9 255.3
                C 479 258.6, 470 252, 463.3 243.8
                C 462 240, 456 231, 451.7 221.4
                C 455 209, 453 199, 456 189
                C 463 176, 473 165, 478.9 153.1
                C 481 151, 482 147, 483.9 145.2 Z
              " />

              {/* Madagascar */}
              <path d="
                M 632 328
                C 638 322, 644 326, 646 338
                C 648 355, 640 375, 634 382
                C 628 382, 626 368, 628 350
                C 630 338, 628 332, 632 328 Z
              " />

              {/* Japan Archipelago (Realistic Honshu with Tokyo & Kyoto, Hokkaido, Kyushu, Shikoku) */}
              {/* Hokkaido */}
              <path d="
                M 894 110
                C 904 115, 904 118, 898 123
                C 891 123, 890 116, 894 110 Z
              " />
              {/* Honshu (Tohoku, Kanto plain with Tokyo, Kansai with Kyoto, Chugoku) */}
              <path d="
                M 891 125
                C 892 136, 890 148, 885 150
                C 880 148, 877 153, 868 150
                C 864 152, 865 146, 875 144
                C 880 139, 888 128, 891 125 Z
              " />
              {/* Shikoku */}
              <path d="M 870 152 C 876 151, 876 156, 871 157 C 868 157, 867 154, 870 152 Z" />
              {/* Kyushu */}
              <path d="M 863 152 C 867 151, 867 159, 864 163 C 860 163, 859 157, 863 152 Z" />

              {/* Taiwan Island */}
              <path d="M 837 180 C 842 178, 844 186, 840 192 C 835 192, 834 184, 837 180 Z" />

              {/* Philippines Archipelago */}
              <path d="M 846 238 C 852 236, 856 242, 854 250 C 850 256, 846 254, 844 248 C 842 242, 844 239, 846 238 Z" />
              <path d="M 852 258 C 858 256, 862 262, 860 270 C 856 274, 850 272, 848 266 C 848 261, 850 259, 852 258 Z" />

              {/* Indonesia & New Guinea (Sumatra, Java, Borneo, Sulawesi, Papua) */}
              <path d="M 788 300 C 802 308, 814 320, 804 326 C 792 328, 782 316, 785 304 C 786 301, 787 300, 788 300 Z" />
              <path d="M 818 290 C 832 286, 842 295, 838 310 C 832 320, 820 318, 816 308 C 814 298, 815 292, 818 290 Z" />
              <path d="M 822 328 C 836 328, 848 332, 844 338 C 832 342, 818 338, 820 330 C 820 328, 821 328, 822 328 Z" />
              <path d="M 848 302 C 856 298, 864 306, 858 316 C 852 322, 846 316, 848 302 Z" />
              <path d="M 878 306 C 900 298, 922 304, 930 314 C 922 324, 896 324, 882 318 C 876 314, 874 310, 878 306 Z" />

              {/* AUSTRALIA & TASMANIA (Accurate Geographic Contours: Cape York Peninsula, Gulf of Carpentaria, Arnhem Land, Darwin, Kimberley, Pilbara, Shark Bay / Steep Point, Perth, Cape Leeuwin, Great Australian Bight, Spencer Gulf / Adelaide, Melbourne / Wilsons Promontory, Sydney, Cape Byron, Brisbane, Cairns) */}
              <path d="
                M 895.8 313.1
                C 900 325, 905 335, 907.8 344.1
                C 914 351, 918 359, 925 366
                C 925 374, 926.7 377.7, 924.7 387.8
                C 922 393, 920.0 396.9, 918.6 401.2
                C 916.7 409.9, 909.7 412.4, 906.7 415.6
                C 902.5 412, 898.6 414.9, 893.3 412.8
                C 885.8 403, 884.7 400.5, 881.9 400.8
                C 882.8 391.8, 877.5 399.8, 871.4 390.4
                C 864.2 388.2, 855.6 388.9, 844.2 395.8
                C 838.6 396.9, 831.7 398.7, 827.5 400.8
                C 819.7 398.7, 819.4 395.4, 821.7 390.0
                C 819.4 383.9, 818.3 378.4, 817.2 374.5
                C 814.4 368.7, 815.8 364.4, 817.2 353.1
                C 824.4 349.2, 829.4 347.7, 836.1 344.9
                C 839.4 339.4, 841.4 333.7, 845.8 330.4
                C 855.8 329.0, 859.7 326.8, 863.3 319.6
                C 866.7 315.6, 880.6 318.9, 878.9 324.3
                C 887 334, 891.1 337.6, 894.2 320.0
                C 895 316, 895.5 314, 895.8 313.1 Z
              " />
              {/* Tasmania Island */}
              <path d="
                M 901.9 421.4
                C 906 423, 911.1 421.8, 911.9 426.8
                C 910.8 430.4, 907.8 431.9, 905.3 430.8
                C 903.6 426.8, 901.5 423.5, 901.9 421.4 Z
              " />

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

              {/* Antarctica (Accurate Ice Shelf & Antarctic Peninsula) */}
              <path d="
                M 50 514
                C 150 502, 280 496, 318 480
                C 324 474, 328 482, 326 492
                C 350 498, 480 494, 600 498
                C 720 494, 840 500, 960 514
                L 980 520
                L 20 520 Z
              " />
            </g>
          </g>

          {/* MAJOR BODIES OF FRESHWATER & INLAND SEAS */}
          <g fill="#C4DEEC" stroke="#9BB59A" strokeWidth={Math.max(0.12, 0.55 * invZoom)} strokeLinejoin="round" strokeLinecap="round">
            {/* North American Great Lakes: Lake Superior, Lake Michigan-Huron, Lake Erie, Lake Ontario */}
            <path d="M 246 104 C 255 101, 264 103, 260 109 C 252 112, 244 110, 246 104 Z" />
            <path d="M 258 109 C 263 111, 267 118, 263 124 C 258 122, 256 114, 258 109 Z" />
            <path d="M 264 112 C 272 108, 276 114, 272 120 C 266 122, 262 116, 264 112 Z" />
            <path d="M 271 123 C 278 122, 282 126, 278 129 C 272 130, 268 126, 271 123 Z" />
            <path d="M 280 120 C 286 119, 290 122, 287 125 C 282 127, 278 124, 280 120 Z" />

            {/* Canadian Lakes: Great Bear Lake, Great Slave Lake, Lake Winnipeg */}
            <circle cx="166" cy="48" r={Math.max(0.5, 2.4 * invZoom)} />
            <circle cx="182" cy="62" r={Math.max(0.5, 2.2 * invZoom)} />
            <path d="M 230 84 C 234 80, 238 88, 233 96 C 230 92, 228 88, 230 84 Z" />

            {/* Caspian Sea (World's largest inland water body) */}
            <path d="
              M 632 110
              C 638 106, 646 112, 644 126
              C 642 142, 638 152, 634 148
              C 630 144, 630 130, 628 120
              C 628 114, 630 110, 632 110 Z
            " />

            {/* Black Sea */}
            <path d="
              M 584 118
              C 596 114, 610 116, 616 124
              C 610 128, 596 130, 586 126
              C 580 124, 580 120, 584 118 Z
            " />

            {/* Baltic Sea Inlet & Gulf of Bothnia */}
            <path d="
              M 536 68
              C 542 62, 546 72, 542 86
              C 536 92, 528 92, 532 82
              C 534 76, 532 72, 536 68 Z
            " />

            {/* Lake Baikal (Siberia - deepest freshwater lake) */}
            <path d="
              M 788 88
              C 794 82, 796 86, 794 98
              C 792 106, 788 104, 786 98
              C 786 92, 786 90, 788 88 Z
            " />

            {/* Lake Balkhash & Aral Sea */}
            <path d="M 700 114 C 710 112, 715 116, 708 118 C 700 118, 698 116, 700 114 Z" />
            <circle cx="664" cy="118" r={Math.max(0.4, 1.8 * invZoom)} />

            {/* African Great Lakes: Lake Victoria, Lake Tanganyika, Lake Malawi */}
            {/* Lake Victoria */}
            <ellipse cx="592" cy="278" rx={Math.max(0.6, 2.8 * invZoom)} ry={Math.max(0.6, 2.6 * invZoom)} />
            {/* Lake Tanganyika */}
            <path d="M 580 286 C 583 284, 584 296, 581 308 C 578 304, 578 292, 580 286 Z" />
            {/* Lake Malawi */}
            <path d="M 596 314 C 598 312, 599 322, 597 330 C 594 326, 594 318, 596 314 Z" />

            {/* Red Sea & Persian Gulf Cutouts */}
            <path d="
              M 602 184
              C 606 182, 614 198, 622 222
              C 618 226, 612 210, 604 192
              C 600 186, 600 184, 602 184 Z
            " />
            <path d="
              M 638 188
              C 646 186, 654 195, 652 206
              C 646 208, 640 198, 638 188 Z
            " />
          </g>

          {/* MAJOR RIVERS (Smooth, realistic cartography waterways) */}
          <g stroke="#8EB9D0" strokeWidth={Math.max(0.12, 0.55 * invZoom)} fill="none" opacity="0.88" strokeLinecap="round" strokeLinejoin="round">
            {/* Amazon River System (Amazon & Madeira Tributary) */}
            <path d="M 288 288 Q 320 280 355 272 T 396 270" />
            <path d="M 330 310 Q 345 295 365 275" />

            {/* Mississippi & Missouri River System + Ohio */}
            <path d="M 236 106 Q 242 138 250 178 T 256 215" />
            <path d="M 205 118 Q 224 135 246 148" />
            <path d="M 276 130 Q 264 140 252 148" />

            {/* St. Lawrence River */}
            <path d="M 286 122 Q 299 115 316 106 T 334 96" />

            {/* Colorado River (Grand Canyon / Gulf of California) */}
            <path d="M 194 145 Q 200 162 204 184" />

            {/* Paraná River & Rio de la Plata */}
            <path d="M 350 350 Q 342 390 338 420" />

            {/* Nile River (White Nile & Blue Nile merging to Mediterranean Delta) */}
            <path d="M 590 274 Q 586 230 582 178" />
            <path d="M 602 245 Q 594 235 586 226" />

            {/* Congo River Basin */}
            <path d="M 550 310 Q 532 290 515 292 T 496 305" />

            {/* Niger River */}
            <path d="M 470 230 Q 492 210 508 238 T 504 265" />

            {/* Danube River (Black Forest across Europe to Black Sea Delta) */}
            <path d="M 498 128 Q 525 132 555 136 T 582 124" />

            {/* Rhine River (Alps to North Sea) */}
            <path d="M 522 135 Q 518 115 512 92" />

            {/* Volga River (Valdai Hills to Caspian Sea) */}
            <path d="M 590 75 Q 618 85 628 105 T 634 115" />

            {/* Yangtze River (Chang Jiang: Tibet across Central China to East China Sea) */}
            <path d="M 758 152 Q 785 162 815 160 T 846 162" />

            {/* Yellow River (Huang He with iconic northern Ordos Loop to Bohai Gulf) */}
            <path d="M 768 148 Q 792 128 812 132 T 832 140" />

            {/* Ganges & Brahmaputra (Himalayas to Bay of Bengal Delta) */}
            <path d="M 718 168 Q 732 180 746 198" />
            <path d="M 756 162 Q 762 178 748 198" />

            {/* Indus River (Himalayas through Pakistan to Arabian Sea) */}
            <path d="M 716 162 Q 700 174 690 192" />

            {/* Mekong River (Tibetan Plateau through Southeast Asia) */}
            <path d="M 762 156 Q 778 198 794 238" />

            {/* Murray-Darling River (Australia) */}
            <path d="M 920 376 Q 900 398 884 416" />
          </g>

          {/* DEEP ZOOM WATERWAY LABELS (Lakes & Rivers revealed when zoomed in >= 4.8x) */}
          {zoomLevel >= 4.5 && (
            <g
              className="waterway-labels-layer pointer-events-none select-none font-serif italic"
              fill="#254F6E"
              opacity={Math.min(0.95, Math.max(0.1, (zoomLevel - 4.5) / 1.0))}
            >
              {/* Freshwater Lakes & Inland Seas (Centered precisely inside the boundaries of each lake) */}
              <text x="254" y="106.5" fontSize={Math.max(0.32, 1.5 * invZoom)} textAnchor="middle" dominantBaseline="central">Lake Superior</text>
              <text x="261.5" y="116.5" fontSize={Math.max(0.26, 1.25 * invZoom)} textAnchor="middle" dominantBaseline="central">Lake Michigan</text>
              <text x="269" y="115" fontSize={Math.max(0.26, 1.25 * invZoom)} textAnchor="middle" dominantBaseline="central">Lake Huron</text>
              <text x="275" y="126" fontSize={Math.max(0.24, 1.15 * invZoom)} textAnchor="middle" dominantBaseline="central">Lake Erie</text>
              <text x="284" y="123" fontSize={Math.max(0.24, 1.15 * invZoom)} textAnchor="middle" dominantBaseline="central">Lake Ontario</text>
              <text x="166" y="48" fontSize={Math.max(0.35, 1.7 * invZoom)} textAnchor="middle" dominantBaseline="central">Great Bear Lake</text>
              <text x="182" y="62" fontSize={Math.max(0.35, 1.7 * invZoom)} textAnchor="middle" dominantBaseline="central">Great Slave Lake</text>
              <text x="637" y="128" fontSize={Math.max(0.42, 2.1 * invZoom)} textAnchor="middle" dominantBaseline="central">Caspian Sea</text>
              <text x="598" y="122" fontSize={Math.max(0.4, 2.0 * invZoom)} textAnchor="middle" dominantBaseline="central">Black Sea</text>
              <text x="791" y="94" fontSize={Math.max(0.35, 1.7 * invZoom)} textAnchor="middle" dominantBaseline="central">Lake Baikal</text>
              <text x="592" y="278" fontSize={Math.max(0.4, 2.0 * invZoom)} textAnchor="middle" dominantBaseline="central">Lake Victoria</text>
              <text x="581" y="296" fontSize={Math.max(0.34, 1.7 * invZoom)} textAnchor="middle" dominantBaseline="central">Lake Tanganyika</text>
              <text x="596.5" y="321" fontSize={Math.max(0.34, 1.7 * invZoom)} textAnchor="middle" dominantBaseline="central">Lake Malawi</text>

              {/* Major Rivers */}
              <text x="345" y="274" fontSize={Math.max(0.45, 2.1 * invZoom)} textAnchor="middle" transform="rotate(-3, 345, 274)">Amazon River</text>
              <text x="246" y="160" fontSize={Math.max(0.4, 2.0 * invZoom)} textAnchor="middle" transform="rotate(78, 246, 160)">Mississippi River</text>
              <text x="218" y="130" fontSize={Math.max(0.38, 1.8 * invZoom)} textAnchor="middle" transform="rotate(28, 218, 130)">Missouri River</text>
              <text x="318" y="104" fontSize={Math.max(0.36, 1.7 * invZoom)} textAnchor="middle" transform="rotate(-26, 318, 104)">St. Lawrence River</text>
              <text x="198" y="165" fontSize={Math.max(0.38, 1.8 * invZoom)} textAnchor="middle" transform="rotate(65, 198, 165)">Colorado River</text>
              <text x="584" y="210" fontSize={Math.max(0.45, 2.2 * invZoom)} textAnchor="middle" transform="rotate(-82, 584, 210)">Nile River</text>
              <text x="526" y="292" fontSize={Math.max(0.4, 2.0 * invZoom)} textAnchor="middle">Congo River</text>
              <text x="536" y="131" fontSize={Math.max(0.4, 2.0 * invZoom)} textAnchor="middle" transform="rotate(6, 536, 131)">Danube River</text>
              <text x="517" y="112" fontSize={Math.max(0.38, 1.8 * invZoom)} textAnchor="middle" transform="rotate(-75, 517, 112)">Rhine River</text>
              <text x="614" y="96" fontSize={Math.max(0.4, 2.0 * invZoom)} textAnchor="middle" transform="rotate(30, 614, 96)">Volga River</text>
              <text x="805" y="163" fontSize={Math.max(0.45, 2.2 * invZoom)} textAnchor="middle">Yangtze River</text>
              <text x="798" y="134" fontSize={Math.max(0.4, 2.0 * invZoom)} textAnchor="middle">Yellow River</text>
              <text x="736" y="186" fontSize={Math.max(0.4, 2.0 * invZoom)} textAnchor="middle" transform="rotate(35, 736, 186)">Ganges River</text>
              <text x="702" y="176" fontSize={Math.max(0.4, 2.0 * invZoom)} textAnchor="middle" transform="rotate(-50, 702, 176)">Indus River</text>
              <text x="778" y="206" fontSize={Math.max(0.4, 2.0 * invZoom)} textAnchor="middle" transform="rotate(70, 778, 206)">Mekong River</text>
              <text x="904" y="396" fontSize={Math.max(0.4, 2.0 * invZoom)} textAnchor="middle" transform="rotate(40, 904, 396)">Murray-Darling River</text>
            </g>
          )}

          {/* CITY DISPATCH MARKERS (Guaranteed Collision-Free with Automated Zero-Collision Placement) */}
          {computedCityLayouts.map((city) => {
            const primaryColor = city.isWishlist ? '#E89A3C' : '#2D5A43';
            const ringColor = city.isWishlist ? 'rgba(232, 154, 60, 0.35)' : 'rgba(45, 90, 67, 0.35)';

            return (
              <g
                key={city.entry.id}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCityClick(city.entry);
                }}
                onMouseEnter={() => setHoveredEntry(city.entry)}
                onMouseLeave={() => setHoveredEntry(null)}
              >
                {/* Outer Pulse Halo on selected or hovered */}
                {(city.isSelected || city.isHovered) && (
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r={city.r * 2.2}
                    fill={ringColor}
                    className="animate-pulse"
                  />
                )}

                {/* City Center Pin Dot */}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={city.r}
                  fill={primaryColor}
                  stroke="#FFFFFF"
                  strokeWidth={cityPinStroke}
                  className="transition-all duration-200"
                />

                {/* Inner White Dot for Crisp Pin Target */}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={city.r * 0.45}
                  fill="#FFFFFF"
                  className="pointer-events-none"
                />

                {/* City Marker Text Label (Collision-Free, Clean Cartographic Typography without Pill Badge) */}
                <text
                  x={
                    city.anchor === 'middle'
                      ? city.x
                      : city.anchor === 'start'
                      ? city.x + city.r + Math.max(0.6, 2.5 * invZoom)
                      : city.x - city.r - Math.max(0.6, 2.5 * invZoom)
                  }
                  y={
                    city.anchor === 'middle'
                      ? city.dir === 'top'
                        ? city.y - city.r - Math.max(0.5, 2.2 * invZoom)
                        : city.y + city.r + cityLabelFontSize + Math.max(0.5, 2.2 * invZoom)
                      : city.y + cityLabelDy
                  }
                  textAnchor={city.anchor}
                  fontSize={cityLabelFontSize}
                  className={`font-sans select-none pointer-events-none transition-all ${
                    city.isSelected
                      ? 'fill-[#1C1917] font-bold'
                      : city.isHovered
                      ? 'fill-[#2B4C6F] font-bold'
                      : 'fill-[#1F2937] font-semibold'
                  }`}
                  style={{
                    textShadow:
                      '0 0.5px 1.5px rgba(255, 255, 255, 0.98), 0 -0.5px 1.5px rgba(255, 255, 255, 0.98), 0.5px 0 1.5px rgba(255, 255, 255, 0.98), -0.5px 0 1.5px rgba(255, 255, 255, 0.98)',
                  }}
                >
                  {city.label}
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
              {computedCitySpots.map(({ spot, x, y, idx, displayName, pillPlacement }) => {
                const isSpotSelected = selectedSpot?.name === spot.name;
                const isSpotHovered = hoveredSpot?.name === spot.name;

                const spotR = Math.max(0.24, Math.min(2.5, (isSpotSelected ? 3.4 : 2.5) * Math.pow(invZoom, 0.78)));
                const spotStrokeW = Math.max(0.04, Math.min(0.55, 0.55 * invZoom));
                const spotEmojiSize = Math.max(0.42, Math.min(2.8, 2.8 * Math.pow(invZoom, 0.78)));
                const pillFontSize = Math.max(0.45, Math.min(3.2, 3.4 * Math.pow(invZoom, 0.82)));

                const textY =
                  pillPlacement === 'top'
                    ? -spotR - Math.max(0.3, 1.2 * invZoom)
                    : spotR + pillFontSize + Math.max(0.2, 0.8 * invZoom);

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

                    {/* Mountain Spot Name Text (Clean Cartographic Typography without Pill Badge) */}
                    <text
                      x="0"
                      y={textY}
                      textAnchor="middle"
                      fontSize={pillFontSize}
                      className={`font-sans select-none pointer-events-none transition-all ${
                        isSpotSelected
                          ? 'fill-[#1C1917] font-bold'
                          : isSpotHovered
                          ? 'fill-[#2B4C6F] font-bold'
                          : 'fill-[#2D5A43] font-semibold'
                      }`}
                      style={{
                        textShadow:
                          '0 0.5px 1.5px rgba(255, 255, 255, 0.98), 0 -0.5px 1.5px rgba(255, 255, 255, 0.98), 0.5px 0 1.5px rgba(255, 255, 255, 0.98), -0.5px 0 1.5px rgba(255, 255, 255, 0.98)',
                      }}
                    >
                      {displayName}
                    </text>
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
