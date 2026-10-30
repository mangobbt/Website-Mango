/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { JournalEntry, SectionType } from '../../types';
import { MangoIcon } from '../icons/MangoIcon';
import { ArrowRight, Sparkles, MapPin, Compass, BookOpen, Calendar, Camera } from 'lucide-react';
import { getGoogleMapsUrl } from '../../utils/mapLinks';

interface HomeViewProps {
  entries: JournalEntry[];
  onSelectSection: (section: SectionType) => void;
  onSelectEntry: (entry: JournalEntry) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  entries,
  onSelectSection,
  onSelectEntry,
}) => {
  // Recent highlights across sections
  const latestDigest = entries.find((e) => e.section === 'digest');
  const latestTravel = entries.find((e) => e.section === 'travel');
  const latestFood = entries.find((e) => e.section === 'food');
  const latestPhoto = entries.find((e) => e.section === 'photos');
  const latestBookOrMovie = entries.find((e) => e.section === 'library');

  // Count items per section
  const digestCount = entries.filter((e) => e.section === 'digest').length;
  const travelCount = entries.filter((e) => e.section === 'travel').length;
  const foodCount = entries.filter((e) => e.section === 'food').length;
  const libraryCount = entries.filter((e) => e.section === 'library').length;
  const photoCount = entries.filter((e) => e.section === 'photos').length;

  const sectionPortals = [
    {
      id: 'digest' as SectionType,
      title: 'Digests & Thoughts',
      emoji: '🦦',
      count: `${digestCount} issues & essays`,
      tagline: 'Quiet reflections, rituals, seasonal notes, and unhurried mornings.',
      color: 'bg-[#F2F6F3] border-[#D9E5DC] text-[#2D5A43] hover:border-[#2D5A43]/60',
      badge: 'Essays & Musings',
    },
    {
      id: 'travel' as SectionType,
      title: 'Travelling',
      emoji: '🏔️',
      count: `${travelCount} places documented`,
      tagline: 'Interactive world map, cobblestone alleys, coastal winds, and future horizons.',
      color: 'bg-[#EEF4F7] border-[#D6E3EB] text-[#2B4C6F] hover:border-[#2B4C6F]/40',
      badge: 'Interactive Map',
    },
    {
      id: 'food' as SectionType,
      title: 'Food & Dining',
      emoji: '🥭',
      count: `${foodCount} culinary spots`,
      tagline: 'Subterranean ramens, tavern petiscos, seasonal mango tarts, and signature orders.',
      color: 'bg-[#FFF9EE] border-[#F6E6C5] text-[#B45309] hover:border-[#B45309]/40',
      badge: "Personal Mango Seal",
    },
    {
      id: 'library' as SectionType,
      title: 'Books & Movies',
      emoji: '📖',
      count: `${libraryCount} books & films`,
      tagline: 'Stories that linger across lifetimes, memorable quotes, and cinema frames.',
      color: 'bg-[#FAF4F0] border-[#EEDFD5] text-[#9A3412] hover:border-[#9A3412]/60',
      badge: 'Cultural Log',
    },
    {
      id: 'photos' as SectionType,
      title: 'Photos & Backstories',
      emoji: '📷',
      count: `${photoCount} visual essays`,
      tagline: 'Moments captured on film and prime lenses with the heartfelt backstories behind them.',
      color: 'bg-[#F4F4F5] border-[#E4E4E7] text-[#1E3A5F] hover:border-[#94A3B8]',
      badge: 'Photo Stories',
    },
  ];

  return (
    <div className="space-y-14 sm:space-y-16">
      {/* Editorial Welcome & Introduction Hero */}
      <section className="relative bg-white/90 rounded-3xl p-8 sm:p-12 border border-[#E7E2D8] shadow-xs">
        <div className="max-w-3xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#2D5A43]">
            <span className="text-base select-none">🌱</span>
            <span>COMMONPLACE BOOK</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-medium text-[#1C1917] tracking-tight leading-tight">
            Hi, welcome to my space
          </h1>

          <p className="text-base sm:text-lg text-[#3E3832] font-serif leading-relaxed italic">
            'Memory is a patient gardener'
          </p>

          <div className="space-y-4 text-sm sm:text-base text-[#57534E] leading-relaxed pt-1">
            <p>
              Time and memory are both nonlinear, and the connections between them are not always clear. Since middle school, I’ve been drawn to the word <em className="italic font-serif text-[#2D5A43]">hiraeth</em>: a deep longing or yearning for a home, person, or time that can never be returned to, or perhaps never existed in the first place.
            </p>
            <p>
              I think many of us carry moments we wish we could revisit. We remember the scents, the light, the people, and the feelings that made them meaningful. Yet, no matter how hard we try to recreate these experiences, something is always off. The moment has passed, and our memory of it becomes something of its own: a place we can return to in our minds, but never quite inhabit again.
            </p>
            <p>
              I hope this website will offer a different kind of space compared to my Yearbooks. One that is less fixed, more fluid, and easier to access.
            </p>
            <p className="font-serif italic text-[#78716C]">
              More to come?
            </p>
          </div>

          {/* Quick Stats Strip */}
          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-[#78716C] border-t border-[#F0EBE1]">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#1C1917] font-mono">{entries.length}</span>
              <span>Total Entries</span>
            </div>
            <span aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5">
              <span>🥭 Devoted Mango Lover</span>
            </div>
            <span aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5">
              <span>📍 Currently in Autumn Slowness</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section Portal Cards (Shortcuts to all 5 sections) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E7E2D8] pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#1C1917]">
              Journeys
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Notebooks
            </p>
          </div>
          <span className="text-xs text-[#78716C] font-mono">5 Curated Notebooks</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectionPortals.map((portal) => (
            <div
              key={portal.id}
              onClick={() => {
                onSelectSection(portal.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`group relative flex flex-col justify-between p-6 rounded-2xl border ${portal.color} transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-2xl select-none">{portal.emoji}</span>
                  <span className="text-[11px] font-mono text-[#78716C] bg-white/70 px-2 py-0.5 rounded-md border border-[#E7E2D8]">
                    {portal.count}
                  </span>
                </div>

                <h3 className="text-xl font-serif font-medium text-[#1C1917] group-hover:text-[#2D5A43] transition-colors">
                  {portal.title}
                </h3>

                <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                  {portal.tagline}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-[#E7E2D8]/60 flex items-center justify-between text-xs font-medium">
                <span className="text-[#78716C]">{portal.badge}</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-[#1C1917]">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Highlights Across the Site */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E7E2D8] pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#1C1917]">
              Latest Dispatches
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              The latest updates
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Latest Photo Story */}
          {latestPhoto && (
            <article
              onClick={() => onSelectEntry(latestPhoto)}
              className="group flex flex-col justify-between bg-white/90 hover:bg-white rounded-2xl overflow-hidden border border-[#E7E2D8] hover:border-[#2D5A43]/40 shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              {latestPhoto.coverPhoto && (
                <div className="aspect-[16/10] w-full overflow-hidden bg-[#EAE6DE] relative">
                  <img
                    src={latestPhoto.coverPhoto}
                    alt={latestPhoto.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <span>📷 Photo Story</span>
                  </div>
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#78716C] mb-1">
                    <span>{latestPhoto.location || 'Photography'}</span>
                    <span className="font-mono">{latestPhoto.date}</span>
                  </div>
                  <h4 className="text-lg font-serif font-medium text-[#1C1917] group-hover:text-[#2D5A43] transition-colors leading-snug">
                    {latestPhoto.title}
                  </h4>
                  <p className="mt-2 text-xs text-[#57534E] line-clamp-2 leading-relaxed">
                    {latestPhoto.summary}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs text-[#2D5A43] font-medium border-t border-[#F3EFE6]">
                  <span>Read Backstory</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </article>
          )}

          {/* Latest Food Spot */}
          {latestFood && (
            <article
              onClick={() => onSelectEntry(latestFood)}
              className="group flex flex-col justify-between bg-white/90 hover:bg-white rounded-2xl overflow-hidden border border-[#E7E2D8] hover:border-[#B45309]/40 shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              {latestFood.coverPhoto && (
                <div className="aspect-[16/10] w-full overflow-hidden bg-[#EAE6DE] relative">
                  <img
                    src={latestFood.coverPhoto}
                    alt={latestFood.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-[#B45309]/90 text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1">
                    <MangoIcon size={12} />
                    <span>Food & Dining</span>
                  </div>
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#78716C] mb-1">
                    <span>{latestFood.location}</span>
                    <span className="font-mono">{latestFood.date}</span>
                  </div>
                  <h4 className="text-lg font-serif font-medium text-[#1C1917] group-hover:text-[#B45309] transition-colors leading-snug">
                    {latestFood.title}
                  </h4>
                  <p className="mt-2 text-xs text-[#57534E] line-clamp-2 leading-relaxed">
                    {latestFood.summary}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs text-[#B45309] font-medium border-t border-[#F3EFE6]">
                  <span>{latestFood.metadata?.mustTryDish ? `Order: ${latestFood.metadata.mustTryDish}` : 'View Details'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </article>
          )}

          {/* Latest Travel Dispatch */}
          {latestTravel && (
            <article
              onClick={() => onSelectEntry(latestTravel)}
              className="group flex flex-col justify-between bg-white/90 hover:bg-white rounded-2xl overflow-hidden border border-[#E7E2D8] hover:border-[#2B4C6F]/40 shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              {latestTravel.coverPhoto && (
                <div className="aspect-[16/10] w-full overflow-hidden bg-[#EAE6DE] relative">
                  <img
                    src={latestTravel.coverPhoto}
                    alt={latestTravel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-[#2B4C6F]/90 text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1">
                    <span>🏔️ Travelling</span>
                  </div>
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#78716C] mb-1">
                    <span>{latestTravel.location}</span>
                    <span className="font-mono">{latestTravel.date}</span>
                  </div>
                  <h4 className="text-lg font-serif font-medium text-[#1C1917] group-hover:text-[#2B4C6F] transition-colors leading-snug">
                    {latestTravel.title}
                  </h4>
                  <p className="mt-2 text-xs text-[#57534E] line-clamp-2 leading-relaxed">
                    {latestTravel.summary}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs text-[#2B4C6F] font-medium border-t border-[#F3EFE6]">
                  <span>Open Travel Dispatch</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  );
};
