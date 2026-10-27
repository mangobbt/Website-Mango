/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { JournalEntry } from '../../types';
import { Camera, MapPin, Heart, ChevronLeft, ChevronRight, X, ExternalLink, ArrowRight } from 'lucide-react';
import { getGoogleMapsUrl } from '../../utils/mapLinks';

interface PhotosViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const PhotosView: React.FC<PhotosViewProps> = ({
  entries,
  onSelectEntry,
  onToggleFavorite,
}) => {
  const photoEntries = entries.filter(
    (e) => e.section === 'photos' || (e.photos && e.photos.length > 0) || e.coverPhoto
  );

  const [activeStory, setActiveStory] = useState<JournalEntry | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);

  const openStory = (entry: JournalEntry) => {
    setActiveStory(entry);
    setActivePhotoIdx(0);
  };

  const closeStory = () => {
    setActiveStory(null);
    setActivePhotoIdx(0);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Section Header with Soft Warm Studio Gray & Slate Blue Accents */}
      <div className="border-b border-[#E4E4E7] pb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1E3A5F] mb-1.5">
              <span className="text-base select-none">📷</span>
              <span>Studio Darkroom & 35mm Visual Stories</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-medium text-[#18181B] tracking-tight">
              Photos & Backstories
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#71717A] max-w-md leading-relaxed">
            Moments captured in natural light across travels and quiet days. Click any photograph to reveal its heartfelt backstory, camera details, and frame slides.
          </p>
        </div>
      </div>

      {/* Main Photo Gallery Grid (Preserved in clean studio gray aesthetic) */}
      {photoEntries.length === 0 ? (
        <div className="py-20 text-center text-[#78716C] bg-white/40 rounded-3xl border border-dashed border-[#DCD5C9]">
          <Camera className="w-8 h-8 mx-auto mb-3 opacity-40 text-[#2D5A43]" />
          <p className="text-sm">No photos in the gallery yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {photoEntries.map((entry, index) => {
            const displayImage = entry.coverPhoto || (entry.photos && entry.photos[0]) || '';
            const photoCount = entry.photos ? entry.photos.length : displayImage ? 1 : 0;

            return (
              <article
                key={entry.id}
                onClick={() => openStory(entry)}
                className={`group relative overflow-hidden rounded-xl bg-[#F4F4F5] border border-[#E4E4E7] cursor-pointer shadow-xs hover:shadow-xl hover:border-[#CBD5E1] transition-all duration-300 ${
                  index % 3 === 0 ? 'sm:col-span-2 sm:aspect-[16/10]' : 'aspect-square sm:aspect-[4/3]'
                }`}
              >
                {/* Photo Image */}
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={entry.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#F4F4F5] text-[#71717A]">
                    <Camera className="w-8 h-8 opacity-40 text-[#1E3A5F]" />
                  </div>
                )}

                {/* Subtle Permanent Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 group-hover:from-black/92 group-hover:via-black/45 transition-colors duration-300" />

                {/* Top Corner Details: Photo Count & Favorite Button */}
                <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between text-white text-xs z-10">
                  <span className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider">
                    📷 {photoCount} {photoCount === 1 ? 'frame' : 'frames'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => onToggleFavorite(entry.id, e)}
                    className="p-1.5 bg-black/40 backdrop-blur-md rounded-md text-white/80 hover:text-[#DC2626] transition-colors"
                    aria-label="Toggle favorite"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        entry.isFavorite ? 'fill-[#DC2626] text-[#DC2626]' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Words Rendered Directly on the Photo */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white z-10 flex flex-col justify-end space-y-1">
                  {/* Location & Date */}
                  <div className="flex items-center gap-2 text-[11px] text-white/80 font-medium">
                    {entry.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#93C5FD]" />
                        <span>{entry.location}</span>
                      </span>
                    )}
                    {entry.location && <span>·</span>}
                    <span className="font-mono text-white/70">{entry.date}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-xl font-serif font-medium text-white leading-tight drop-shadow-sm">
                    {entry.title}
                  </h3>

                  {/* Expanded Hover Details */}
                  <div className="opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-24 transition-all duration-300 overflow-hidden pt-1 space-y-1">
                    {entry.metadata?.cameraDetails && (
                      <p className="text-[10px] text-white/70 font-mono truncate">
                        {entry.metadata.cameraDetails}
                      </p>
                    )}
                    <p className="text-xs text-white/90 line-clamp-1 italic font-serif">
                      "{entry.summary}"
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-[#93C5FD] font-medium pt-1">
                      <span>Read backstory & view slides</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Expanded Backstory & Multi-Photo Modal: Photos on Top, Descriptions on Bottom */}
      {activeStory && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="photo-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={closeStory}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#FBF9F5] rounded-3xl border border-[#E7E2D8] shadow-2xl overflow-hidden"
          >
            {/* Close Button Top Right */}
            <button
              type="button"
              onClick={closeStory}
              aria-label="Close photo view"
              className="absolute top-3.5 right-3.5 z-30 p-2.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition-all cursor-pointer shadow-md"
            >
              <X className="w-5 h-5" />
            </button>

            {/* TOP: Photo Viewer & Slide Carousel */}
            <div className="w-full bg-[#121110] relative flex flex-col justify-center items-center min-h-[260px] sm:min-h-[360px] max-h-[54vh] select-none overflow-hidden">
              {activeStory.photos && activeStory.photos.length > 0 ? (
                <>
                  <img
                    src={activeStory.photos[activePhotoIdx]}
                    alt={`${activeStory.title} photo ${activePhotoIdx + 1}`}
                    className="max-h-[50vh] sm:max-h-[52vh] w-full object-contain p-2"
                    referrerPolicy="no-referrer"
                  />

                  {/* Frame Counter Badge */}
                  <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-mono">
                    <span>Frame {activePhotoIdx + 1} of {activeStory.photos.length}</span>
                  </div>

                  {/* Previous & Next Slide Controls */}
                  {activeStory.photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActivePhotoIdx((prev) =>
                            prev === 0 ? activeStory.photos!.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer shadow-md"
                        title="Previous photo"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActivePhotoIdx((prev) =>
                            prev === activeStory.photos!.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer shadow-md"
                        title="Next photo"
                        aria-label="Next photo"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Bottom Thumbnail Strip */}
                  {activeStory.photos.length > 1 && (
                    <div className="absolute bottom-2.5 left-0 right-0 z-20 flex justify-center items-center gap-2 px-4 py-1.5">
                      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl">
                        {activeStory.photos.map((photoUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActivePhotoIdx(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                            className={`w-9 h-6 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                              idx === activePhotoIdx
                                ? 'border-[#93C5FD] scale-110 shadow-sm'
                                : 'border-white/30 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={photoUrl}
                              alt="thumbnail"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : activeStory.coverPhoto ? (
                <img
                  src={activeStory.coverPhoto}
                  alt={activeStory.title}
                  className="max-h-[50vh] sm:max-h-[52vh] w-full object-contain p-2"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-white/60 text-xs flex flex-col items-center gap-2 py-16">
                  <Camera className="w-8 h-8 opacity-50" />
                  <span>No photo attached</span>
                </div>
              )}
            </div>

            {/* BOTTOM: Narrative Backstory, Metadata & Description */}
            <div className="w-full p-5 sm:p-7 overflow-y-auto max-h-[40vh] sm:max-h-[38vh] space-y-4 bg-[#FBF9F5] border-t border-[#E7E2D8]">
              {/* Header Info: Section Tag, Date & Location */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="uppercase tracking-widest text-[#1E3A5F] font-semibold flex items-center gap-1 text-[11px]">
                    <span>📷</span>
                    <span>Photo Narrative</span>
                  </span>
                  {activeStory.location && (
                    <>
                      <span className="text-[#A8A29E]">·</span>
                      <span className="flex items-center gap-1 text-[#44403C] font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#2B4C6F]" />
                        <span>{activeStory.location}</span>
                      </span>
                    </>
                  )}
                </div>
                <span className="font-mono text-[#71717A] text-[11px]">{activeStory.date}</span>
              </div>

              {/* Title */}
              <h2
                id="photo-modal-title"
                className="text-2xl sm:text-3xl font-serif font-medium text-[#18181B] tracking-tight leading-tight"
              >
                {activeStory.title}
              </h2>

              {/* Backstory Callout */}
              <div className="p-4 bg-[#F4F4F5] rounded-2xl border border-[#E4E4E7]">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#1E3A5F] block mb-1">
                  The Story Behind the Lens
                </span>
                <p className="font-serif italic text-sm text-[#3E3832] leading-relaxed">
                  "{activeStory.metadata?.photoBackstory || activeStory.summary}"
                </p>
              </div>

              {/* Detailed Narrative Content */}
              {activeStory.content && (
                <div className="text-xs sm:text-sm text-[#44403C] leading-relaxed whitespace-pre-line font-serif">
                  {activeStory.content}
                </div>
              )}

              {/* Camera / Film Technical Notes */}
              {activeStory.metadata?.cameraDetails && (
                <div className="p-3 bg-[#EEF4F7]/70 rounded-xl border border-[#D5E2EC] text-xs text-[#2B4C6F]">
                  <span className="font-semibold block text-[10px] uppercase tracking-wider mb-0.5">
                    Technical & Camera Notes
                  </span>
                  <span className="font-mono text-[11px] text-[#44403C]">
                    {activeStory.metadata.cameraDetails}
                  </span>
                </div>
              )}

              {/* Footer Actions: Google Maps & Full Journal Link */}
              <div className="pt-3 border-t border-[#E7E2D8] flex flex-wrap items-center justify-between gap-3 text-xs">
                <a
                  href={getGoogleMapsUrl(activeStory)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EEF4F7] hover:bg-[#DEE9F0] text-[#2B4C6F] rounded-lg transition-colors font-medium cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Google Maps Location</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    closeStory();
                    onSelectEntry(activeStory);
                  }}
                  className="inline-flex items-center gap-1 text-[#2D5A43] hover:underline font-medium cursor-pointer"
                >
                  <span>Full Journal Entry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
