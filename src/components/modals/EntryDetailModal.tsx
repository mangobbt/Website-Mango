/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { JournalEntry } from '../../types';
import {
  X,
  Edit3,
  Trash2,
  MapPin,
  Heart,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChefHat,
  Clock,
  Users,
  Check,
  Music,
  Compass,
} from 'lucide-react';
import { MangoIcon } from '../icons/MangoIcon';
import { FractionalRating } from '../common/FractionalRating';
import { getGoogleMapsUrl } from '../../utils/mapLinks';
import { getSpotifyEmbedUrl } from '../../utils/spotify';

interface EntryDetailModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  isOwnerMode?: boolean;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  isOwnerMode = false,
}) => {
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    setPhotoIdx(0);
  }, [entry]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!entry) return null;

  const isTravel = entry.section === 'travel';
  const isDigest = entry.section === 'digest';
  const isSeal = entry.metadata?.isMangoSeal;
  const isRecipe = entry.metadata?.isHomeCooked || entry.subType === 'recipe';
  const googleMapsUrl = getGoogleMapsUrl(entry);
  const allPhotos =
    entry.photos && entry.photos.length > 0
      ? entry.photos
      : entry.coverPhoto
      ? [entry.coverPhoto]
      : [];

  const travelSpots = entry.metadata?.travelSpots || [];
  const spotifyEmbedUrl = getSpotifyEmbedUrl(entry.metadata?.spotifyUrl);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${entry.title}"?`)) {
      onDelete(entry.id);
      onClose();
    }
  };

  // Render content with inline markdown image support: ![alt](url)
  const renderRichContent = (rawText: string) => {
    const parts = rawText.split(/(!\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      const match = part.match(/!\[(.*?)\]\((.*?)\)/);
      if (match) {
        const altText = match[1] || 'Embedded photo';
        const src = match[2];
        return (
          <figure
            key={index}
            className="my-6 rounded-2xl overflow-hidden border border-[#E7E2D8] bg-[#EAE6DE]"
          >
            <img
              src={src}
              alt={altText}
              className="w-full max-h-[500px] object-cover"
              referrerPolicy="no-referrer"
            />
            {altText && altText !== 'Embedded photo' && altText !== 'Image' && (
              <figcaption className="p-2.5 text-center text-xs font-serif italic text-[#78716C] bg-white/60">
                {altText}
              </figcaption>
            )}
          </figure>
        );
      }
      return (
        <span key={index} className="whitespace-pre-line">
          {part}
        </span>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Dynamic width: max-w-5xl for Travel & Digest/Essay layouts, max-w-3xl for compact dispatches */}
      <div
        className={`relative w-full ${
          isTravel || isDigest ? 'max-w-5xl' : 'max-w-3xl'
        } max-h-[92vh] flex flex-col bg-[#FBF9F5] rounded-3xl border border-[#E7E2D8] shadow-2xl overflow-hidden transition-all duration-300`}
      >
        {/* Top Header Utility Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E2D8] bg-[#F6F3EC] shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#78716C] font-mono">
            <span className="uppercase tracking-widest text-[#2D5A43] font-sans font-semibold">
              {isRecipe
                ? '🍳 HOME COOKING'
                : isTravel
                ? '🏔️ TRAVEL DISPATCH'
                : isDigest
                ? '🦦 DIGEST & ESSAY'
                : entry.section.toUpperCase()}
            </span>
            <span aria-hidden="true">·</span>
            <span>{entry.date}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => onToggleFavorite(entry.id, e)}
              title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className="p-1.5 text-[#A8A29E] hover:text-[#DC2626] hover:bg-[#EAE4D7] rounded-lg transition-colors cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 ${
                  entry.isFavorite ? 'fill-[#DC2626] text-[#DC2626]' : ''
                }`}
              />
            </button>

            {/* Edit and Delete buttons: ONLY visible in Owner Mode */}
            {isOwnerMode && (
              <>
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  title="Edit Entry (Owner Mode)"
                  className="p-1.5 text-[#57534E] hover:text-[#1C1917] hover:bg-[#EAE4D7] rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  title="Delete Entry (Owner Mode)"
                  className="p-1.5 text-[#A8A29E] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE4D7] rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {/* ==================== TRAVEL TWO-SIDED SPLIT LAYOUT ==================== */}
          {isTravel ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LARGER SIDE (lg:col-span-7): Full Essay, Photo Gallery, Story */}
              <div className="lg:col-span-7 space-y-6">
                {/* Photo Gallery Viewer if available */}
                {allPhotos.length > 0 && (
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center shadow-xs">
                    <img
                      src={allPhotos[photoIdx]}
                      alt={entry.title}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />

                    {allPhotos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setPhotoIdx((prev) => (prev === 0 ? allPhotos.length - 1 : prev - 1))
                          }
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPhotoIdx((prev) => (prev === allPhotos.length - 1 ? 0 : prev + 1))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                          {allPhotos.map((_, i) => (
                            <span
                              key={i}
                              className={`w-2 h-2 rounded-full transition-all ${
                                i === photoIdx ? 'bg-white scale-125' : 'bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Title & Metadata */}
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#2B4C6F] font-medium mb-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{entry.location}</span>
                    {entry.metadata?.travelSeason && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#78716C]">{entry.metadata.travelSeason}</span>
                      </>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[#1C1917] tracking-tight leading-tight">
                    {entry.title}
                  </h1>
                  {entry.subtitle && (
                    <p className="text-sm font-serif italic text-[#57534E] mt-1.5">
                      {entry.subtitle}
                    </p>
                  )}
                </div>

                {/* Best Memory Snippet */}
                {entry.metadata?.bestMemory && (
                  <div className="p-4 bg-[#F2F6FA] rounded-2xl border border-[#DDE7F0] text-xs sm:text-sm text-[#2B4C6F] italic leading-relaxed">
                    <span className="font-semibold not-italic block text-[10px] uppercase tracking-wider text-[#2B4C6F]/70 mb-1">
                      Key Field Memory
                    </span>
                    "{entry.metadata.bestMemory}"
                  </div>
                )}

                {/* Full Essay Narrative (1,000+ words capable) */}
                <div className="prose prose-stone max-w-none text-sm sm:text-base text-[#38332E] leading-relaxed border-t border-[#F0EBE1] pt-5">
                  {renderRichContent(entry.content)}
                </div>

                {/* Tags Footer */}
                <div className="pt-4 border-t border-[#E7E2D8] flex items-center justify-between text-xs text-[#78716C]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {entry.tags.map((tag, idx) => (
                      <React.Fragment key={tag}>
                        <span>{tag}</span>
                        {idx < entry.tags.length - 1 && <span aria-hidden="true">·</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <span className="font-mono">Created {new Date(entry.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* SMALLER SIDE (lg:col-span-5): Visited Spots, Mountain Ratings, Google Maps Links */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#FAF7F2] p-5 rounded-3xl border border-[#EDE6DC] space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#E7DFD2] pb-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2B4C6F] uppercase tracking-wider">
                        <span className="text-base">🏔️</span>
                        <span>Places Visited & Liked</span>
                      </div>
                      <p className="text-[11px] text-[#78716C] mt-0.5">
                        Mountain ratings & Google Maps links
                      </p>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 bg-white rounded-md border border-[#E7DFD2] text-[#57534E]">
                      {travelSpots.length} {travelSpots.length === 1 ? 'Spot' : 'Spots'}
                    </span>
                  </div>

                  {/* Spot Cards */}
                  {travelSpots.length > 0 ? (
                    <div className="space-y-3.5">
                      {travelSpots.map((spot, idx) => {
                        const spotMapsUrl =
                          spot.googleMapsUrl ||
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${spot.name} ${entry.location || ''}`
                          )}`;

                        return (
                          <div
                            key={idx}
                            className="bg-white rounded-2xl p-4 border border-[#E7E2D8] shadow-2xs hover:border-[#2B4C6F]/40 transition-colors"
                          >
                            {/* Spot Image if provided */}
                            {spot.photoUrl && (
                              <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-[#EAE6DE]">
                                <img
                                  src={spot.photoUrl}
                                  alt={spot.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}

                            {/* Spot Name & Neighborhood */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-serif font-medium text-sm text-[#1C1917]">
                                  {spot.name}
                                </h4>
                                {spot.neighborhood && (
                                  <p className="text-[11px] text-[#78716C]">
                                    {spot.neighborhood}
                                  </p>
                                )}
                              </div>

                              {/* Mountain Rating */}
                              <div className="shrink-0">
                                <FractionalRating
                                  type="mountain"
                                  rating={spot.mountainRating}
                                  size={15}
                                  showNumeric
                                />
                              </div>
                            </div>

                            {/* Notes from Danny */}
                            {spot.notes && (
                              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                                {spot.notes}
                              </p>
                            )}

                            {/* Google Maps Anchor */}
                            <div className="mt-3 pt-2.5 border-t border-[#F5F2EB] flex items-center justify-end">
                              <a
                                href={spotMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEF4F7] hover:bg-[#DEE9F0] text-[#2B4C6F] rounded-lg text-xs font-medium transition-colors cursor-pointer"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                <span>Open in Google Maps</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-[#78716C] bg-white rounded-2xl border border-dashed border-[#DDD7CD]">
                      <Compass className="w-6 h-6 mx-auto mb-2 text-[#A8A29E]" />
                      <p className="font-medium text-[#57534E]">No spots cataloged yet</p>
                      <p className="text-[11px] mt-1">
                        {isOwnerMode
                          ? 'Click Edit above to add places visited with mountain ratings & photos.'
                          : 'Specific recommendation spots will appear here.'}
                      </p>
                    </div>
                  )}

                  {/* Primary City Link */}
                  <div className="pt-2">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 p-3 bg-[#2B4C6F] hover:bg-[#203954] text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Explore {entry.location || entry.title} on Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ==================== STANDARD DISPATCH / FOOD / ESSAY LAYOUT ==================== */
            <div className="space-y-6">
              {/* Photo Gallery Viewer if available */}
              {allPhotos.length > 0 && (
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center">
                  <img
                    src={allPhotos[photoIdx]}
                    alt={entry.title}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />

                  {allPhotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setPhotoIdx((prev) => (prev === 0 ? allPhotos.length - 1 : prev - 1))
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPhotoIdx((prev) => (prev === allPhotos.length - 1 ? 0 : prev + 1))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                        {allPhotos.map((_, i) => (
                          <span
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all ${
                              i === photoIdx ? 'bg-white scale-125' : 'bg-white/40'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Main Title Lockup */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  {entry.location && (
                    <div className="flex items-center gap-1.5 text-xs text-[#2B4C6F] font-medium">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{entry.location}</span>
                    </div>
                  )}

                  {/* Direct Google Maps Link (only for dining/locations) */}
                  {!isRecipe && entry.location && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEF4F7] hover:bg-[#DEE9F0] text-[#2B4C6F] rounded-lg text-xs font-medium transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>View on Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[#1C1917] tracking-tight leading-tight">
                  {entry.title}
                </h1>
                {entry.subtitle && (
                  <p className="text-sm font-serif italic text-[#57534E] mt-1.5">
                    {entry.subtitle}
                  </p>
                )}

                {/* Mango Seal Callout */}
                {isSeal && (
                  <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-[#FFF8EB] border border-[#FDE68A] text-[#B45309] text-xs font-medium">
                    <MangoIcon size={16} />
                    <span>Awarded Personal Mango Seal of Approval</span>
                  </div>
                )}
              </div>

              {/* HOME COOKED RECIPE SPREAD (Split Ingredients & Cooking Steps) */}
              {isRecipe && (
                <div className="space-y-6 pt-2">
                  {/* Recipe Meta Ribbon */}
                  <div className="flex flex-wrap items-center gap-4 p-4 bg-[#F5EFE6] rounded-2xl border border-[#E7DFD2] text-xs text-[#57534E]">
                    {entry.metadata?.prepTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#B45309]" />
                        <span>
                          Prep: <strong className="text-[#1C1917]">{entry.metadata.prepTime}</strong>
                        </span>
                      </div>
                    )}
                    {entry.metadata?.cookTime && (
                      <div className="flex items-center gap-1.5">
                        <ChefHat className="w-3.5 h-3.5 text-[#B45309]" />
                        <span>
                          Cook: <strong className="text-[#1C1917]">{entry.metadata.cookTime}</strong>
                        </span>
                      </div>
                    )}
                    {entry.metadata?.recipeYield && (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#B45309]" />
                        <span>
                          Yield:{' '}
                          <strong className="text-[#1C1917]">{entry.metadata.recipeYield}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Split Ingredients & Cooking Process Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Left Column: Ingredients Checklist (2 cols) */}
                    {entry.metadata?.ingredients && entry.metadata.ingredients.length > 0 && (
                      <div className="md:col-span-2 p-5 bg-[#FAF7F2] rounded-2xl border border-[#EDE6DC] space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#B45309]">
                          Ingredients
                        </h3>
                        <ul className="space-y-2 text-xs text-[#3E3832]">
                          {entry.metadata.ingredients.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-[#2D5A43] shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Right Column: Step-by-Step Cooking Method (3 cols) */}
                    {entry.metadata?.cookingSteps && entry.metadata.cookingSteps.length > 0 && (
                      <div className="md:col-span-3 p-5 bg-[#FAF7F2] rounded-2xl border border-[#EDE6DC] space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#2D5A43]">
                          Cooking Process & Method
                        </h3>
                        <ol className="space-y-3.5 text-xs text-[#3E3832] leading-relaxed">
                          {entry.metadata.cookingSteps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <span className="font-serif italic font-bold text-[#2D5A43] select-none shrink-0">
                                {String(idx + 1).padStart(2, '0')}.
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Restaurant Specific Callouts */}
              {entry.section === 'food' && !isRecipe && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FAF7F2] rounded-2xl border border-[#EDE6DC] text-xs">
                  {entry.metadata?.mustTryDish && (
                    <div>
                      <span className="text-[#78716C] uppercase tracking-wider block text-[10px]">
                        Signature Order
                      </span>
                      <span className="font-medium text-[#1C1917] text-sm mt-0.5 block">
                        {entry.metadata.mustTryDish}
                      </span>
                    </div>
                  )}
                  {entry.metadata?.mangoRating && (
                    <div>
                      <span className="text-[#78716C] uppercase tracking-wider block text-[10px]">
                        Mango Rating
                      </span>
                      <div className="mt-1">
                        <FractionalRating
                          type="mango"
                          rating={entry.metadata.mangoRating}
                          size={18}
                          showNumeric
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Library Specific Book / Movie Callouts */}
              {entry.section === 'library' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FAF4F0] rounded-2xl border border-[#EEDFD5] text-xs">
                  <div>
                    <span className="text-[#9A3412] uppercase tracking-wider block text-[10px] font-semibold">
                      {entry.metadata?.mediaType === 'movie' ? 'Film Credits' : 'Book Details'}
                    </span>
                    <span className="font-medium text-[#1C1917] text-sm mt-0.5 block">
                      {entry.metadata?.creator
                        ? `${entry.metadata.creator} (${entry.metadata.year || '2026'})`
                        : entry.title}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9A3412] uppercase tracking-wider block text-[10px] font-semibold">
                      {entry.metadata?.mediaType === 'movie' ? 'Cinema Rating' : 'Book Rating'}
                    </span>
                    <div className="mt-1">
                      <FractionalRating
                        type={entry.metadata?.mediaType === 'movie' ? 'clapper' : 'book'}
                        rating={entry.rating || 5}
                        size={18}
                        showNumeric
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Digest Spotify Embed & Personal Notes */}
              {isDigest && (
                <div className="space-y-4">
                  {spotifyEmbedUrl && (
                    <div className="p-4 rounded-2xl bg-[#121212] border border-[#282828] text-white">
                      <div className="flex items-center justify-between text-xs text-[#B3B3B3] mb-2 font-mono">
                        <span className="flex items-center gap-1.5 text-white font-medium">
                          <Music className="w-3.5 h-3.5 text-[#1DB954]" />
                          <span>Soundtrack on Repeat</span>
                        </span>
                        <span>Spotify</span>
                      </div>
                      <iframe
                        src={spotifyEmbedUrl}
                        width="100%"
                        height="80"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="rounded-xl"
                      />
                    </div>
                  )}

                  {entry.metadata?.personalNotes && entry.metadata.personalNotes.length > 0 && (
                    <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#EDE6DC]">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#2D5A43] mb-3">
                        Monthly Notes & Field Reflections
                      </h3>
                      <ul className="space-y-2">
                        {entry.metadata.personalNotes.map((note, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#44403C]">
                            <span className="font-serif italic text-[#78716C] select-none">
                              {String(idx + 1).padStart(2, '0')}.
                            </span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Full Narrative Essay Text (supports inline markdown images) */}
              <div className="prose prose-stone max-w-none text-sm sm:text-base text-[#38332E] leading-relaxed border-t border-[#F0EBE1] pt-6">
                {renderRichContent(entry.content)}
              </div>

              {/* Tags Footer */}
              <div className="pt-4 border-t border-[#E7E2D8] flex items-center justify-between text-xs text-[#78716C]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {entry.tags.map((tag, idx) => (
                    <React.Fragment key={tag}>
                      <span>{tag}</span>
                      {idx < entry.tags.length - 1 && <span aria-hidden="true">·</span>}
                    </React.Fragment>
                  ))}
                </div>
                <span className="font-mono">Created {new Date(entry.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
