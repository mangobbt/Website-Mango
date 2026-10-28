/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry, SectionType, SubType, TravelSpot } from '../../types';
import {
  X,
  Plus,
  MapPin,
  Check,
  Upload,
  Trash2,
  Camera,
  ChefHat,
  Clock,
  Users,
  Music,
  Compass,
} from 'lucide-react';
import { MangoIcon } from '../icons/MangoIcon';
import { FractionalRating } from '../common/FractionalRating';
import { PHOTO_PRESETS } from '../../data/photoPresets';

const SIMPLIFIED_TAG_PRESETS = [
  'Travel',
  'Food',
  'Home Cooking',
  'Books',
  'Cinema',
  'Photography',
  'Reflections',
  'Favorites',
];

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: JournalEntry) => void;
  onDelete?: (id: string) => void;
  initialEntry?: JournalEntry | null;
  defaultSection?: SectionType;
  allEntries?: JournalEntry[];
}

export const EntryModal: React.FC<EntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialEntry,
  defaultSection = 'food',
  allEntries = [],
}) => {
  const effectiveSection: SectionType = defaultSection === 'home' ? 'digest' : defaultSection;

  const [section, setSection] = useState<SectionType>(effectiveSection);
  const [digestSubtype, setDigestSubtype] = useState<'monthly_digest' | 'reflection'>('monthly_digest');
  const [linkedItemIds, setLinkedItemIds] = useState<string[]>([]);
  const [linkedCategoryFilter, setLinkedCategoryFilter] = useState<'all' | 'travel' | 'food' | 'photos'>('all');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [date, setDate] = useState('October 2026');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState<string>('35.6762');
  const [lng, setLng] = useState<string>('139.6503');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');

  // Photos & Cover Image
  const [coverPhoto, setCoverPhoto] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  // Food / Recipe specifics
  const [isHomeCooked, setIsHomeCooked] = useState(false);
  const [prepTime, setPrepTime] = useState('15 mins');
  const [cookTime, setCookTime] = useState('30 mins');
  const [recipeYield, setRecipeYield] = useState('Serves 2');
  const [ingredientsText, setIngredientsText] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [mustTryDish, setMustTryDish] = useState('');
  const [priceRange, setPriceRange] = useState<'$' | '$$' | '$$$' | '$$$$'>('$$');
  const [isMangoSeal, setIsMangoSeal] = useState(false);

  // Travel specifics
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [travelStatus, setTravelStatus] = useState<'visited' | 'wishlist'>('visited');
  const [travelSeason, setTravelSeason] = useState('Spring');
  const [bestMemory, setBestMemory] = useState('');
  const [travelSpots, setTravelSpots] = useState<TravelSpot[]>([]);

  // New spot entry form
  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotNeighborhood, setNewSpotNeighborhood] = useState('');
  const [newSpotMountainRating, setNewSpotMountainRating] = useState<number>(5);
  const [newSpotPhotoUrl, setNewSpotPhotoUrl] = useState('');
  const [newSpotMapsUrl, setNewSpotMapsUrl] = useState('');
  const [newSpotNotes, setNewSpotNotes] = useState('');
  const [showAddSpotForm, setShowAddSpotForm] = useState(false);

  // Digest specifics
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [personalNotesText, setPersonalNotesText] = useState('');

  // Photos specifics
  const [photoBackstory, setPhotoBackstory] = useState('');
  const [cameraDetails, setCameraDetails] = useState('');

  // Library specifics
  const [creator, setCreator] = useState('');
  const [mediaType, setMediaType] = useState<'book' | 'movie'>('book');
  const [year, setYear] = useState<number>(2026);
  const [favoriteQuote, setFavoriteQuote] = useState('');
  const [quotes, setQuotes] = useState<string[]>([]);
  const [newQuoteInput, setNewQuoteInput] = useState('');

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when initialEntry changes (editing mode)
  useEffect(() => {
    if (initialEntry) {
      setSection(initialEntry.section === 'home' ? 'digest' : initialEntry.section);
      setDigestSubtype(initialEntry.subType === 'reflection' ? 'reflection' : 'monthly_digest');
      setTitle(initialEntry.title);
      setSubtitle(initialEntry.subtitle || '');
      setDate(initialEntry.date);
      setLocation(initialEntry.location || '');
      if (initialEntry.coordinates) {
        setLat(String(initialEntry.coordinates.lat));
        setLng(String(initialEntry.coordinates.lng));
      }
      setTags(initialEntry.tags || []);
      setRating(initialEntry.rating || 5);
      setIsFavorite(initialEntry.isFavorite);
      setSummary(initialEntry.summary);
      setContent(initialEntry.content);
      setCoverPhoto(initialEntry.coverPhoto || '');
      setPhotos(initialEntry.photos || (initialEntry.coverPhoto ? [initialEntry.coverPhoto] : []));

      if (initialEntry.metadata) {
        setIsHomeCooked(!!initialEntry.metadata.isHomeCooked);
        setPrepTime(initialEntry.metadata.prepTime || '15 mins');
        setCookTime(initialEntry.metadata.cookTime || '30 mins');
        setRecipeYield(initialEntry.metadata.recipeYield || 'Serves 2');
        setIngredientsText(initialEntry.metadata.ingredients?.join('\n') || '');
        setStepsText(initialEntry.metadata.cookingSteps?.join('\n') || '');
        setGoogleMapsUrl(initialEntry.metadata.googleMapsUrl || '');
        setPhotoBackstory(initialEntry.metadata.photoBackstory || '');
        setCameraDetails(initialEntry.metadata.cameraDetails || '');
        setMustTryDish(initialEntry.metadata.mustTryDish || '');
        setPriceRange(initialEntry.metadata.priceRange || '$$');
        setIsMangoSeal(!!initialEntry.metadata.isMangoSeal);
        setTravelStatus(initialEntry.metadata.status || 'visited');
        setTravelSeason(initialEntry.metadata.travelSeason || 'Spring');
        setBestMemory(initialEntry.metadata.bestMemory || '');
        setTravelSpots(initialEntry.metadata.travelSpots || []);
        setSpotifyUrl(initialEntry.metadata.spotifyUrl || '');
        setPersonalNotesText(initialEntry.metadata.personalNotes?.join('\n') || '');
        setLinkedItemIds(initialEntry.metadata.linkedItemIds || []);
        setCreator(initialEntry.metadata.creator || '');
        setMediaType(initialEntry.metadata.mediaType || 'book');
        setYear(initialEntry.metadata.year || 2026);
        setFavoriteQuote(initialEntry.metadata.favoriteQuote || '');
        setQuotes(initialEntry.metadata.quotes || []);
      }
    } else {
      // Reset form
      setSection(effectiveSection);
      setDigestSubtype('monthly_digest');
      setLinkedItemIds([]);
      setTitle('');
      setSubtitle('');
      setDate('October 2026');
      setLocation('');
      setLat('35.6762');
      setLng('139.6503');
      setTags(
        effectiveSection === 'food'
          ? ['Food']
          : effectiveSection === 'travel'
          ? ['Travel']
          : effectiveSection === 'photos'
          ? ['Photography']
          : ['Reflections']
      );
      setRating(5);
      setIsFavorite(false);
      setSummary('');
      setContent('');
      setCoverPhoto('');
      setPhotos([]);
      setNewImageUrl('');
      setIsHomeCooked(false);
      setPrepTime('15 mins');
      setCookTime('30 mins');
      setRecipeYield('Serves 2');
      setIngredientsText('');
      setStepsText('');
      setGoogleMapsUrl('');
      setPhotoBackstory('');
      setCameraDetails('');
      setMustTryDish('');
      setPriceRange('$$');
      setIsMangoSeal(false);
      setTravelStatus('visited');
      setTravelSeason('Spring');
      setBestMemory('');
      setTravelSpots([]);
      setSpotifyUrl('');
      setPersonalNotesText('');
      setCreator('');
      setMediaType('book');
      setYear(2026);
      setFavoriteQuote('');
      setQuotes([]);
      setNewQuoteInput('');
    }
  }, [initialEntry, effectiveSection, isOpen]);

  if (!isOpen) return null;

  // Calculate live word count
  const wordCount = content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;

  const handleAddTag = (newTag?: string) => {
    const trimmed = (newTag || tagInput).trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      if (!newTag) setTagInput('');
    }
  };

  const handleToggleTag = (tagToToggle: string) => {
    if (tags.includes(tagToToggle)) {
      setTags(tags.filter((t) => t !== tagToToggle));
    } else {
      setTags([...tags, tagToToggle]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Visited spots manager
  const handleAddTravelSpot = () => {
    if (!newSpotName.trim()) return;
    const spot: TravelSpot = {
      name: newSpotName.trim(),
      neighborhood: newSpotNeighborhood.trim() || undefined,
      mountainRating: newSpotMountainRating,
      photoUrl: newSpotPhotoUrl.trim() || undefined,
      googleMapsUrl:
        newSpotMapsUrl.trim() ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${newSpotName.trim()} ${location}`
        )}`,
      notes: newSpotNotes.trim() || undefined,
    };
    setTravelSpots([...travelSpots, spot]);
    setNewSpotName('');
    setNewSpotNeighborhood('');
    setNewSpotMountainRating(5);
    setNewSpotPhotoUrl('');
    setNewSpotMapsUrl('');
    setNewSpotNotes('');
    setShowAddSpotForm(false);
  };

  const handleRemoveTravelSpot = (indexToRemove: number) => {
    setTravelSpots(travelSpots.filter((_, i) => i !== indexToRemove));
  };

  // Clipboard Image Paste Handler for 1,000+ words essay
  const handleContentPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (base64) {
              const textarea = contentTextareaRef.current;
              const cursorStart = textarea ? textarea.selectionStart : content.length;
              const cursorEnd = textarea ? textarea.selectionEnd : content.length;

              const markdownImage = `\n\n![Embedded Image](${base64})\n\n`;
              const newContent =
                content.substring(0, cursorStart) + markdownImage + content.substring(cursorEnd);

              setContent(newContent);
              setPhotos((prev) => [...prev, base64]);
              if (!coverPhoto) setCoverPhoto(base64);

              setPasteNotice('Image pasted directly into essay!');
              setTimeout(() => setPasteNotice(null), 3000);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  // Add photo via URL
  const handleAddPhotoUrl = () => {
    const trimmed = newImageUrl.trim();
    if (trimmed) {
      setPhotos((prev) => [...prev, trimmed]);
      if (!coverPhoto) setCoverPhoto(trimmed);
      setNewImageUrl('');
    }
  };

  // Add photo via file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setPhotos((prev) => [...prev, result]);
          if (!coverPhoto) setCoverPhoto(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (url: string) => {
    setPhotos((prev) => [...prev, url]);
    if (!coverPhoto) setCoverPhoto(url);
    setShowPresetPicker(false);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (coverPhoto === prev[index]) {
        setCoverPhoto(updated[0] || '');
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let derivedSubType: SubType = 'reflection';
    if (section === 'food') derivedSubType = isHomeCooked ? 'recipe' : 'restaurant';
    if (section === 'travel') derivedSubType = travelStatus === 'visited' ? 'city_visited' : 'city_wishlist';
    if (section === 'library') derivedSubType = mediaType;
    if (section === 'digest') derivedSubType = digestSubtype;
    if (section === 'photos') derivedSubType = 'photo_story';

    // Parse ingredients & steps
    const parsedIngredients = ingredientsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const parsedSteps = stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const parsedPersonalNotes = personalNotesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const effectiveCover = coverPhoto || (photos.length > 0 ? photos[0] : undefined);

    const entryToSave: JournalEntry = {
      id: initialEntry ? initialEntry.id : `entry-${Date.now()}`,
      section,
      subType: derivedSubType,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      date: date.trim(),
      createdAt: initialEntry ? initialEntry.createdAt : new Date().toISOString(),
      location: location.trim() || (isHomeCooked ? 'Danny’s Kitchen' : undefined),
      coordinates:
        section === 'travel' && !isNaN(Number(lat)) && !isNaN(Number(lng))
          ? { lat: Number(lat), lng: Number(lng) }
          : undefined,
      tags: tags.length > 0 ? tags : ['Personal'],
      rating,
      isFavorite,
      summary: summary.trim() || title.trim(),
      content: content.trim() || summary.trim(),
      coverPhoto: effectiveCover,
      photos: photos.length > 0 ? photos : undefined,
      metadata: {
        googleMapsUrl: googleMapsUrl.trim() || undefined,
        photoBackstory: section === 'photos' ? photoBackstory.trim() : undefined,
        cameraDetails: section === 'photos' ? cameraDetails.trim() : undefined,
        isHomeCooked: section === 'food' ? isHomeCooked : undefined,
        prepTime: section === 'food' && isHomeCooked ? prepTime : undefined,
        cookTime: section === 'food' && isHomeCooked ? cookTime : undefined,
        recipeYield: section === 'food' && isHomeCooked ? recipeYield : undefined,
        ingredients: section === 'food' && isHomeCooked ? parsedIngredients : undefined,
        cookingSteps: section === 'food' && isHomeCooked ? parsedSteps : undefined,
        mustTryDish: section === 'food' && !isHomeCooked ? mustTryDish.trim() : undefined,
        priceRange: section === 'food' && !isHomeCooked ? priceRange : undefined,
        mangoRating: section === 'food' ? rating : undefined,
        isMangoSeal: section === 'food' ? isMangoSeal : undefined,
        status: section === 'travel' ? travelStatus : undefined,
        travelSeason: section === 'travel' ? travelSeason.trim() : undefined,
        bestMemory: section === 'travel' ? bestMemory.trim() : undefined,
        travelSpots: section === 'travel' && travelSpots.length > 0 ? travelSpots : undefined,
        spotifyUrl: section === 'digest' ? spotifyUrl.trim() : undefined,
        personalNotes: section === 'digest' && parsedPersonalNotes.length > 0 ? parsedPersonalNotes : undefined,
        linkedItemIds: section === 'digest' && digestSubtype === 'monthly_digest' && linkedItemIds.length > 0 ? linkedItemIds : undefined,
        creator: section === 'library' ? creator.trim() : undefined,
        mediaType: section === 'library' ? mediaType : undefined,
        year: section === 'library' ? year : undefined,
        favoriteQuote: section === 'library' ? favoriteQuote.trim() : undefined,
        quotes: section === 'library' && quotes.length > 0 ? quotes.map((q) => q.trim()).filter(Boolean) : undefined,
      },
    };

    onSave(entryToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Expanded Modal Size: max-w-4xl for comfortable 1,000+ words essay composition */}
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-[#FBF9F5] rounded-3xl border border-[#E7E2D8] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E2D8] bg-[#F6F3EC] shrink-0">
          <div>
            <h2 className="text-xl font-serif font-medium text-[#1C1917]">
              {initialEntry ? 'Edit Journal Entry' : 'Create New Entry'}
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Saved privately to your personal notebook · Supports clipboard image pasting & recipes
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE4D7] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Section Picker Tabs */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#78716C] mb-2">
              Select Journal Notebook
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'digest', label: 'Digests & Thoughts', emoji: '🦦' },
                { id: 'travel', label: 'Travelling', emoji: '🏔️' },
                { id: 'food', label: 'Food & Cooking', emoji: '🥭' },
                { id: 'library', label: 'Books & Movies', emoji: '📖' },
                { id: 'photos', label: 'Photos', emoji: '📷' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id as SectionType)}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    section === item.id
                      ? 'bg-[#2D5A43] text-white shadow-xs'
                      : 'bg-white/80 text-[#57534E] hover:bg-white border border-[#E7E2D8]'
                  }`}
                >
                  <span className="text-sm select-none">{item.emoji}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#1C1917] mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  section === 'food'
                    ? isHomeCooked ? 'e.g. Danny’s Slow-Simmered Ginger Soba' : 'e.g. Ginza Kagari or Taberna da Rua das Flores'
                    : section === 'travel'
                    ? 'e.g. Kyoto: Cedar Scent & River Banks'
                    : section === 'library'
                    ? 'e.g. Days at the Morisaki Bookshop'
                    : section === 'photos'
                    ? 'e.g. Kyoto Rain & Lantern Reflections'
                    : 'e.g. October Reflections: On Unhurried Mornings'
                }
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917] focus:ring-2 focus:ring-[#2D5A43]/30 focus:border-[#2D5A43] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1C1917] mb-1">
                Date / Season
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. October 2026"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917] focus:ring-2 focus:ring-[#2D5A43]/30 focus:border-[#2D5A43] focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-[#1C1917] mb-1">
                Subtitle / Description Hook
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Hand-pulled noodles in golden dashi with charred scallions"
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917] focus:ring-2 focus:ring-[#2D5A43]/30 focus:border-[#2D5A43] focus:outline-hidden"
              />
            </div>
          </div>

          {/* DIGEST SPECIFICS: Type Selection (Digest vs Blog Post/Essay) & Linked Highlights */}
          {section === 'digest' && (
            <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#EDE6DC] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#EDE6DC]">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2D5A43]">
                  <Music className="w-4 h-4 text-[#1DB954]" />
                  <span>Digest & Thought Configuration</span>
                </div>

                {/* Subtype Selection: Monthly Digest vs Blog Post / Essay */}
                <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#D8D0C2]">
                  <button
                    type="button"
                    onClick={() => setDigestSubtype('monthly_digest')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      digestSubtype === 'monthly_digest'
                        ? 'bg-[#2D5A43] text-white shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    🦦 Monthly Digest
                  </button>
                  <button
                    type="button"
                    onClick={() => setDigestSubtype('reflection')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      digestSubtype === 'reflection'
                        ? 'bg-[#2D5A43] text-white shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    ✍️ Blog Post / Essay
                  </button>
                </div>
              </div>

              {/* LINKED HIGHLIGHTS FOR MONTHLY DIGEST */}
              {digestSubtype === 'monthly_digest' && (
                <div className="p-4 bg-white rounded-xl border border-[#DCE6DE] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#2D5A43] uppercase tracking-wider">
                        Link Highlights from Travel, Food & Photos
                      </label>
                      <p className="text-[11px] text-[#78716C] mt-0.5">
                        Selected items will appear as a small showcase in this digest issue
                      </p>
                    </div>

                    {/* Filter category pills */}
                    <div className="flex items-center gap-1 text-[11px]">
                      {(['all', 'travel', 'food', 'photos'] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setLinkedCategoryFilter(cat)}
                          className={`px-2 py-0.5 rounded-md font-medium capitalize transition-colors cursor-pointer ${
                            linkedCategoryFilter === cat
                              ? 'bg-[#2D5A43] text-white'
                              : 'bg-[#F4F7F4] text-[#57534E] hover:text-[#1C1917]'
                          }`}
                        >
                          {cat === 'all'
                            ? 'All'
                            : cat === 'travel'
                            ? '🏔️ Travel'
                            : cat === 'food'
                            ? '🍳 Food'
                            : '📷 Photos'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Linked Items Pills */}
                  {linkedItemIds.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-semibold text-[#78716C] uppercase tracking-wider block">
                        Currently Linked ({linkedItemIds.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {linkedItemIds.map((id) => {
                          const linked = allEntries.find((e) => e.id === id);
                          if (!linked) return null;
                          const icon =
                            linked.section === 'travel'
                              ? '🏔️'
                              : linked.section === 'food'
                              ? '🍳'
                              : '📷';

                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#EEF4EF] border border-[#D2E0D4] text-xs font-medium text-[#2B3F33]"
                            >
                              <span>{icon}</span>
                              <span className="max-w-[140px] truncate">{linked.title}</span>
                              <button
                                type="button"
                                onClick={() => setLinkedItemIds((prev) => prev.filter((i) => i !== id))}
                                className="text-[#78716C] hover:text-[#DC2626] ml-1 cursor-pointer"
                                title="Unlink item"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pickable Entries List */}
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 border-t border-[#F0F4F1] pt-2">
                    {allEntries
                      .filter((e) => {
                        if (e.id === initialEntry?.id) return false;
                        if (linkedCategoryFilter === 'all') {
                          return e.section === 'travel' || e.section === 'food' || e.section === 'photos';
                        }
                        return e.section === linkedCategoryFilter;
                      })
                      .map((item) => {
                        const isLinked = linkedItemIds.includes(item.id);
                        const icon =
                          item.section === 'travel'
                            ? '🏔️'
                            : item.section === 'food'
                            ? '🍳'
                            : '📷';

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (isLinked) {
                                setLinkedItemIds((prev) => prev.filter((i) => i !== item.id));
                              } else {
                                setLinkedItemIds((prev) => [...prev, item.id]);
                              }
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isLinked
                                ? 'bg-[#EEF4EF] border-[#2D5A43] text-[#2D5A43]'
                                : 'bg-[#FAFBF9] border-[#E5ECE6] text-[#3E3832] hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span>{icon}</span>
                              <span className="font-medium truncate">{item.title}</span>
                              <span className="text-[10px] text-[#78716C] font-mono">({item.date})</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ml-2 ${
                                isLinked
                                  ? 'bg-[#2D5A43] text-white'
                                  : 'bg-white border border-[#D8D0C2] text-[#78716C]'
                              }`}
                            >
                              {isLinked ? '✓ Linked' : '+ Link'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#1C1917] mb-1">
                  Spotify Track / Album / Playlist Link (Optional)
                </label>
                <input
                  type="url"
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  placeholder="https://open.spotify.com/track/..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917]"
                />
                <p className="text-[11px] text-[#78716C] mt-1">
                  Pasting a Spotify link will embed a sleek, playable compact player directly into your digest.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1C1917] mb-1">
                  Danny’s Personal Notes & Reflections (One note per line)
                </label>
                <textarea
                  rows={4}
                  value={personalNotesText}
                  onChange={(e) => setPersonalNotesText(e.target.value)}
                  placeholder="Finished reading Days at the Morisaki Bookshop on the balcony.
Switched to single-origin Ethiopian beans for morning pour-overs.
Took late afternoon bike rides through the autumn leaves."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917] font-sans"
                />
              </div>
            </div>
          )}

          {/* TRAVEL SPECIFICS: Visited Spots, Mountain Ratings & Memory */}
          {section === 'travel' && (
            <div className="p-5 bg-[#F0F4F7] rounded-2xl border border-[#DDE4E9] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#DDE4E9]">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2B4C6F]">
                  <span className="text-base">🏔️</span>
                  <span>Travel Details & Places Visited</span>
                </div>
                <span className="text-xs font-mono text-[#57534E]">
                  {travelSpots.length} {travelSpots.length === 1 ? 'Spot' : 'Spots'} Cataloged
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1">
                    Status
                  </label>
                  <select
                    value={travelStatus}
                    onChange={(e) => setTravelStatus(e.target.value as 'visited' | 'wishlist')}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917]"
                  >
                    <option value="visited">Visited Dispatch (Green Pin)</option>
                    <option value="wishlist">Wishlist Horizon (Gold Pin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1">
                    Season
                  </label>
                  <input
                    type="text"
                    value={travelSeason}
                    onChange={(e) => setTravelSeason(e.target.value)}
                    placeholder="e.g. Spring (Cherry Blossoms)"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1">
                    Key Memory Snippet
                  </label>
                  <input
                    type="text"
                    value={bestMemory}
                    onChange={(e) => setBestMemory(e.target.value)}
                    placeholder="e.g. Cycling along the Kamogawa at twilight"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917]"
                  />
                </div>
              </div>

              {/* Visited Spots List with Mountain Ratings */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#2B4C6F]">
                    Places Visited & Liked (Displayed on Smaller Side of Travel View)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddSpotForm(!showAddSpotForm)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#2B4C6F] bg-white border border-[#DDE4E9] hover:bg-[#DEE9F0] rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddSpotForm ? 'Cancel Spot' : 'Add Visited Spot'}</span>
                  </button>
                </div>

                {/* Form to add a new spot */}
                {showAddSpotForm && (
                  <div className="p-4 bg-white rounded-2xl border border-[#CBD5E1] space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#1C1917] mb-1">
                          Spot / Location Name *
                        </label>
                        <input
                          type="text"
                          value={newSpotName}
                          onChange={(e) => setNewSpotName(e.target.value)}
                          placeholder="e.g. Yanaka Ginza or Kennin-ji Temple"
                          className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#D8D0C2] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#1C1917] mb-1">
                          Neighborhood / Area
                        </label>
                        <input
                          type="text"
                          value={newSpotNeighborhood}
                          onChange={(e) => setNewSpotNeighborhood(e.target.value)}
                          placeholder="e.g. Taito City or Gion"
                          className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#D8D0C2] rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#1C1917] mb-1">
                          Mountain Rating (1 to 5 🏔️)
                        </label>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setNewSpotMountainRating(lvl)}
                              className={`p-1.5 rounded-lg text-sm transition-transform cursor-pointer ${
                                newSpotMountainRating >= lvl
                                  ? 'bg-[#EEF4F7] scale-105'
                                  : 'opacity-30'
                              }`}
                            >
                              🏔️
                            </button>
                          ))}
                          <span className="text-xs font-mono text-[#78716C] ml-1">
                            {newSpotMountainRating}/5
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[#1C1917] mb-1">
                          Google Maps URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={newSpotMapsUrl}
                          onChange={(e) => setNewSpotMapsUrl(e.target.value)}
                          placeholder="https://maps.google.com/..."
                          className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#D8D0C2] rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#1C1917] mb-1">
                        Photo URL of Spot (Optional)
                      </label>
                      <input
                        type="url"
                        value={newSpotPhotoUrl}
                        onChange={(e) => setNewSpotPhotoUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... or image link"
                        className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#D8D0C2] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#1C1917] mb-1">
                        Danny’s Note / Tip for this Spot
                      </label>
                      <input
                        type="text"
                        value={newSpotNotes}
                        onChange={(e) => setNewSpotNotes(e.target.value)}
                        placeholder="e.g. Come at sunset for quiet steps and local street croquettes."
                        className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#D8D0C2] rounded-lg"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddTravelSpot}
                        disabled={!newSpotName.trim()}
                        className="px-4 py-1.5 text-xs font-medium text-white bg-[#2B4C6F] hover:bg-[#203954] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                      >
                        Save Spot to Itinerary
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing spots badges */}
                {travelSpots.length > 0 && (
                  <div className="space-y-2">
                    {travelSpots.map((spot, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-[#DDE4E9]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {spot.photoUrl ? (
                            <img
                              src={spot.photoUrl}
                              alt={spot.name}
                              className="w-10 h-10 object-cover rounded-lg shrink-0 border border-[#E7E2D8]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#EEF4F7] flex items-center justify-center shrink-0 text-base">
                              🏔️
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-medium text-xs text-[#1C1917] truncate">
                                {spot.name}
                              </span>
                              <span className="text-[11px] text-[#2B4C6F]">
                                {'🏔️'.repeat(spot.mountainRating)}
                              </span>
                            </div>
                            {spot.notes && (
                              <p className="text-[11px] text-[#78716C] truncate mt-0.5">
                                {spot.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveTravelSpot(idx)}
                          className="p-1.5 text-[#A8A29E] hover:text-[#DC2626] rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Remove spot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FOOD & RECIPE SUB-SECTION */}
          {section === 'food' && (
            <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#EDE6DC] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#EDE6DC]">
                <div className="flex items-center gap-2 text-xs font-medium text-[#B45309]">
                  <MangoIcon size={16} />
                  <span>Culinary Type</span>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-[#DCD5C9]">
                  <button
                    type="button"
                    onClick={() => setIsHomeCooked(false)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      !isHomeCooked ? 'bg-[#2D5A43] text-white' : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    Restaurant Discovery
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHomeCooked(true)}
                    className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      isHomeCooked ? 'bg-[#B45309] text-white' : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Cooked by Danny (Recipe)</span>
                  </button>
                </div>
              </div>

              {isHomeCooked ? (
                /* Home Cooked Recipe Form */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        Prep Time
                      </label>
                      <input
                        type="text"
                        value={prepTime}
                        onChange={(e) => setPrepTime(e.target.value)}
                        placeholder="e.g. 20 mins"
                        className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        Cook Time
                      </label>
                      <input
                        type="text"
                        value={cookTime}
                        onChange={(e) => setCookTime(e.target.value)}
                        placeholder="e.g. 35 mins"
                        className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        Yield / Servings
                      </label>
                      <input
                        type="text"
                        value={recipeYield}
                        onChange={(e) => setRecipeYield(e.target.value)}
                        placeholder="e.g. Serves 2-3"
                        className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        Ingredients (One item per line)
                      </label>
                      <textarea
                        rows={6}
                        value={ingredientsText}
                        onChange={(e) => setIngredientsText(e.target.value)}
                        placeholder="1.5 cups Thai sweet glutinous rice
2 ripe Alphonso or Ataulfo mangoes
1 can full-fat coconut cream
1/3 cup organic cane sugar
3/4 tsp sea salt"
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917] font-mono leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        Step-by-Step Cooking Method (One step per line)
                      </label>
                      <textarea
                        rows={6}
                        value={stepsText}
                        onChange={(e) => setStepsText(e.target.value)}
                        placeholder="Steam soaked glutinous rice for 25 mins until tender.
Warm coconut cream with sugar and salt over gentle low heat.
Fold warm coconut cream into rice and cover tightly for 20 mins.
Slice chilled mangoes into ribbons and serve together."
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917] font-sans leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Restaurant Fields */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#1C1917] mb-1">
                      Must-Try Dish / Signature Order
                    </label>
                    <input
                      type="text"
                      value={mustTryDish}
                      onChange={(e) => setMustTryDish(e.target.value)}
                      placeholder="e.g. Special Tori Paitan with Truffle Oil"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        Mango Score (Supports 0.25 & 0.5 steps)
                      </label>
                      <FractionalRating
                        type="mango"
                        rating={rating}
                        max={5}
                        size={22}
                        interactive
                        onChange={setRating}
                        showNumeric
                      />
                    </div>

                    <label className="flex items-center gap-2 text-xs font-medium text-[#B45309] bg-[#FFF8EB] px-3 py-2 rounded-xl border border-[#FDE68A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isMangoSeal}
                        onChange={(e) => setIsMangoSeal(e.target.checked)}
                        className="rounded text-[#E89A3C] focus:ring-0"
                      />
                      <span>Award Danny's Mango Seal of Excellence</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location & Google Maps Linking (when applicable) */}
          {(section === 'travel' || (section === 'food' && !isHomeCooked) || section === 'photos') && (
            <div className="p-4 bg-[#F0F4F7] rounded-2xl border border-[#DDE4E9] space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#2B4C6F]">
                <MapPin className="w-4 h-4" />
                <span>Primary Location & Google Maps</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1">
                    City / Neighborhood / Address
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Ginza, Tokyo, Japan"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1">
                    Direct Google Maps Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Photos Specific Backstory */}
          {section === 'photos' && (
            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EDE6DC] space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#1C1917] mb-1">
                  The Story Behind the Lens
                </label>
                <textarea
                  rows={3}
                  value={photoBackstory}
                  onChange={(e) => setPhotoBackstory(e.target.value)}
                  placeholder="Explain why you took this photo, who you met, the lighting, or what you felt..."
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917] font-serif italic"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1C1917] mb-1">
                  Camera / Film / Lens Details
                </label>
                <input
                  type="text"
                  value={cameraDetails}
                  onChange={(e) => setCameraDetails(e.target.value)}
                  placeholder="e.g. 35mm f/1.8 · ISO 400 · Natural morning light"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917]"
                />
              </div>
            </div>
          )}

          {/* Library Specific Quote */}
          {section === 'library' && (
            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EDE6DC] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1">
                    Medium
                  </label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as 'book' | 'movie')}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917]"
                  >
                    <option value="book">Book</option>
                    <option value="movie">Movie</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1">
                    {mediaType === 'book' ? 'Author' : 'Director'}
                  </label>
                  <input
                    type="text"
                    value={creator}
                    onChange={(e) => setCreator(e.target.value)}
                    placeholder={mediaType === 'book' ? 'e.g. Kazuo Ishiguro' : 'e.g. Wim Wenders'}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1">
                    Release Year
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917]"
                  />
                </div>
              </div>

              {/* Key Memorable Quote (Featured) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[#1C1917]">
                    ⭐ Key Memorable Quote <span className="text-[#9A3412] font-normal">(Primary highlight)</span>
                  </label>
                  <span className="text-[11px] text-[#78716C]">Only one memorable quote</span>
                </div>
                <textarea
                  rows={2}
                  value={favoriteQuote}
                  onChange={(e) => setFavoriteQuote(e.target.value)}
                  placeholder="e.g. Next time is next time. Now is now."
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917] font-serif italic"
                />
              </div>

              {/* Additional Quotes Collection */}
              <div className="p-3.5 bg-white/70 rounded-xl border border-[#E7E2D8] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-[#57534E]">
                    Additional Quotes ({quotes.length})
                  </label>
                  <span className="text-[10px] text-[#78716C]">Add as many quotes as you like</span>
                </div>

                {/* Input for adding new quote */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQuoteInput}
                    onChange={(e) => setNewQuoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newQuoteInput.trim()) {
                          setQuotes((prev) => [...prev, newQuoteInput.trim()]);
                          setNewQuoteInput('');
                        }
                      }
                    }}
                    placeholder="Type an additional quote and press Add..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#D8D0C2] rounded-lg text-[#1C1917] font-serif italic"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newQuoteInput.trim()) {
                        setQuotes((prev) => [...prev, newQuoteInput.trim()]);
                        setNewQuoteInput('');
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#9A3412] hover:bg-[#7C2D12] rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    + Add Quote
                  </button>
                </div>

                {/* List of existing additional quotes */}
                {quotes.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {quotes.map((q, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 bg-[#FAF8F5] rounded-lg border border-[#EDE6DC] text-xs font-serif italic text-[#3E3832]"
                      >
                        <span className="flex-1 truncate">"{q}"</span>
                        <button
                          type="button"
                          onClick={() => setQuotes((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-[#A8A29E] hover:text-[#DC2626] transition-colors cursor-pointer"
                          title="Remove quote"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-[#1C1917] mb-1">
                  {mediaType === 'book' ? 'Book Rating (📖)' : 'Cinema Rating (🎬)'} (Supports 0.25 & 0.5 steps)
                </label>
                <FractionalRating
                  type={mediaType === 'book' ? 'book' : 'clapper'}
                  rating={rating}
                  max={5}
                  size={22}
                  interactive
                  onChange={setRating}
                  showNumeric
                />
              </div>
            </div>
          )}

          {/* Summary */}
          <div>
            <label className="block text-xs font-medium text-[#1C1917] mb-1">
              Short Summary / Takeaway *
            </label>
            <input
              type="text"
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="1-2 sentences capturing why this discovery or recipe mattered..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#D8D0C2] rounded-xl text-[#1C1917] focus:ring-2 focus:ring-[#2D5A43]/30 focus:border-[#2D5A43] focus:outline-hidden"
            />
          </div>

          {/* EXPANSIVE 1,000+ WORD WRITING CANVAS WITH CLIPBOARD IMAGE PASTING */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-[#1C1917]">
                Full Essay & Narrative (Paste images directly into this box!)
              </label>
              <div className="flex items-center gap-2 text-xs text-[#78716C] font-mono">
                <span className={wordCount > 800 ? 'text-[#2D5A43] font-semibold' : ''}>
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
                <span>·</span>
                <span>{content.length} chars</span>
              </div>
            </div>

            {pasteNotice && (
              <div className="px-3 py-1.5 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs rounded-lg animate-in fade-in">
                ✓ {pasteNotice}
              </div>
            )}

            <textarea
              ref={contentTextareaRef}
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handleContentPaste}
              placeholder="Write your reflection, travel essay, or thoughts here (supports 1,000+ words).

Tip: You can copy and paste photos or screenshots directly into this box — they will embed inline and display in the final reading view!"
              className="w-full px-4 py-3 text-sm bg-white border border-[#D8D0C2] rounded-2xl text-[#1C1917] focus:ring-2 focus:ring-[#2D5A43]/30 focus:border-[#2D5A43] focus:outline-hidden font-sans leading-relaxed min-h-[260px]"
            />
          </div>

          {/* Attached Photos Strip */}
          <div className="p-4 bg-[#F5F2EB] rounded-2xl border border-[#E4DDD0] space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-[#1C1917]">
              <span className="flex items-center gap-1.5 text-[#2D5A43]">
                <Camera className="w-4 h-4" />
                <span>Gallery & Cover Photos ({photos.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPresetPicker(!showPresetPicker)}
                className="text-[#2B4C6F] hover:underline cursor-pointer"
              >
                {showPresetPicker ? 'Hide Presets' : 'Browse Presets'}
              </button>
            </div>

            {/* Presets */}
            {showPresetPicker && (
              <div className="p-3 bg-white rounded-xl border border-[#D8D0C2] grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PHOTO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url)}
                    className="group text-left p-1 rounded-lg hover:bg-[#F6F3EC] transition-all cursor-pointer"
                  >
                    <div className="aspect-[4/3] rounded-md overflow-hidden bg-stone-200 mb-1">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-[#1C1917] block truncate">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste Image URL (https://...)"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#D8D0C2] rounded-lg text-[#1C1917]"
              />
              <button
                type="button"
                onClick={handleAddPhotoUrl}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#2D5A43] hover:bg-[#234633] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Add URL
              </button>

              <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2B4C6F] bg-white border border-[#D8D0C2] hover:bg-[#EEF4F7] rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                {photos.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-[#D8D0C2] bg-white"
                  >
                    <img src={photoUrl} alt="entry photo" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/90 text-white rounded-md transition-colors cursor-pointer"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded font-mono">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SIMPLIFIED TAGS MANAGER */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-[#1C1917]">
              Tags & Categories
            </label>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {SIMPLIFIED_TAG_PRESETS.map((preset) => {
                const isSelected = tags.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleToggleTag(preset)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                        : 'bg-white text-[#57534E] border-[#D8D0C2] hover:border-[#2D5A43]/50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {preset}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Custom tag (press enter to add)"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#D8D0C2] rounded-lg text-[#1C1917]"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#2D5A43] hover:bg-[#234633] rounded-lg transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Currently Selected Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-[#EFEBE1] text-[#3E3832] rounded-md font-medium"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-[#78716C] hover:text-[#DC2626] cursor-pointer ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Footer Submit & Delete */}
          <div className="pt-4 border-t border-[#E7E2D8] flex items-center justify-between gap-3">
            {initialEntry && onDelete ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#DC2626] hover:text-white hover:bg-[#DC2626] border border-[#FCA5A5] rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Entry</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917] hover:bg-[#EFEBE1] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-[#2D5A43] hover:bg-[#234633] rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{initialEntry ? 'Save Changes' : 'Publish Entry'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Dialog for Deletion inside EntryModal */}
      {showDeleteConfirm && initialEntry && onDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E7E2D8] max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 text-[#DC2626]">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <Trash2 className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-[#1C1917] text-base leading-tight">
                  Delete Entry
                </h4>
                <p className="text-[11px] text-[#78716C] mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[#57534E] leading-relaxed bg-white/70 p-3 rounded-xl border border-[#E7E2D8]">
              Are you sure you want to permanently delete <strong className="text-[#1C1917]">"{initialEntry.title}"</strong> from your journal?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-2 text-xs font-medium text-[#57534E] hover:bg-[#EAE4D7] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(initialEntry.id);
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Yes, Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
