/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PhotoPreset {
  id: string;
  name: string;
  category: 'travel' | 'food' | 'nature' | 'urban';
  url: string;
  description: string;
}

// Curated aesthetic photos for presets
export const PHOTO_PRESETS: PhotoPreset[] = [
  {
    id: 'preset-ramen',
    name: 'Artisanal Ramen Bowl',
    category: 'food',
    url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    description: 'Steaming shio ramen in ceramic bowl with soft-boiled ajitsuke egg',
  },
  {
    id: 'preset-mango',
    name: 'Ripe Alphonso Mangoes',
    category: 'food',
    url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
    description: 'Golden ripe summer mango slices on linen cloth',
  },
  {
    id: 'preset-kyoto',
    name: 'Kyoto Gion Twilight',
    category: 'travel',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    description: 'Traditional wooden machiya houses with glowing lanterns in Kyoto',
  },
  {
    id: 'preset-lisbon',
    name: 'Lisbon Terracotta Rooftops',
    category: 'travel',
    url: 'https://images.unsplash.com/photo-1508672019048-805b876b67e2?auto=format&fit=crop&w=800&q=80',
    description: 'Sun-drenched view over Alfama terracotta tiles towards Tagus river',
  },
  {
    id: 'preset-coffee',
    name: 'Pour-Over Coffee & Notebook',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
    description: 'Morning hand pour-over coffee ritual with linen journal and morning light',
  },
  {
    id: 'preset-bookshop',
    name: 'Antique Bookshelf',
    category: 'urban',
    url: 'https://images.unsplash.com/photo-1507842229458-7c858be16892?auto=format&fit=crop&w=800&q=80',
    description: 'Warm second-hand bookshop corner with well-loved volumes',
  },
  {
    id: 'preset-mountain',
    name: 'Misty Alpine Ridge',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    description: 'Tranquil mountain summit shrouded in morning mist',
  },
  {
    id: 'preset-camera',
    name: 'Vintage 35mm Camera',
    category: 'urban',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    description: 'Classic rangefinder camera on wooden study desk',
  },
];
