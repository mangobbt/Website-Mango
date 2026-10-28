/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SectionType = 'home' | 'digest' | 'travel' | 'food' | 'library' | 'photos';

export type SubType = 
  | 'restaurant' 
  | 'street_food' 
  | 'dessert' 
  | 'recipe'
  | 'city_visited' 
  | 'city_wishlist'
  | 'book' 
  | 'movie' 
  | 'monthly_digest' 
  | 'reflection'
  | 'photo_story';

export interface TravelCoords {
  lat: number;
  lng: number;
}

export interface TravelSpot {
  name: string;
  neighborhood?: string;
  mountainRating: number; // 1 to 5 mountain emojis 🏔️
  photoUrl?: string;
  googleMapsUrl?: string;
  notes?: string;
  coordinates?: TravelCoords;
}

export interface JournalEntry {
  id: string;
  section: SectionType;
  subType: SubType;
  title: string;
  subtitle?: string;
  date: string; // e.g. "October 2026"
  createdAt: string; // ISO string
  location?: string; // e.g. "Tokyo, Japan" or "Danny’s Kitchen"
  coordinates?: TravelCoords;
  tags: string[];
  rating?: number; // 1 to 5 (Mangoes for food, Stars for library)
  isFavorite: boolean;
  summary: string;
  content: string; // Long-form essay (supports 1,000+ words and inline markdown images)
  coverPhoto?: string;
  photos?: string[]; // Multiple photos attached to this entry
  
  // Specific contextual metadata
  metadata?: {
    // Google Maps integration
    googleMapsUrl?: string;

    // Spotify soundtrack integration
    spotifyUrl?: string;

    // Travel recommendations & spots
    travelSpots?: TravelSpot[];
    country?: string;
    travelSeason?: string;
    status?: 'visited' | 'wishlist';
    bestMemory?: string;

    // Photos section
    photoBackstory?: string;
    cameraDetails?: string;

    // Food & Recipes
    isHomeCooked?: boolean;
    recipeYield?: string; // e.g. "Serves 2-3"
    prepTime?: string; // e.g. "20 mins"
    cookTime?: string; // e.g. "45 mins"
    ingredients?: string[]; // List of ingredients
    cookingSteps?: string[]; // Step-by-step cooking process
    mustTryDish?: string;
    cuisine?: string;
    neighborhood?: string;
    priceRange?: '$' | '$$' | '$$$' | '$$$$';
    mangoRating?: number; // 1 to 5 mangoes
    isMangoSeal?: boolean; // Danny's personal top recommendation

    // Books & Movies
    creator?: string; // Author or Director
    mediaType?: 'book' | 'movie';
    year?: number;
    favoriteQuote?: string; // Single key memorable quote
    quotes?: string[]; // Additional memorable quotes
    genre?: string;

    // Monthly Digest / Blog
    monthYear?: string;
    personalNotes?: string[]; // Danny's personal notes & reflections
    monthlyTrack?: string;
    linkedItemIds?: string[]; // Linked items from travel, food, and photos highlighted this month
  };
}

export interface TagCount {
  tag: string;
  count: number;
}

export type SortOption = 'highest_rated' | 'lowest_rated' | 'date_newest' | 'date_oldest';
