/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { JournalEntry, SectionType } from './types';
import { INITIAL_ENTRIES } from './data/initialEntries';
import { Navbar } from './components/Navbar';
import { SearchAndTagBar } from './components/SearchAndTagBar';
import { HomeView } from './components/views/HomeView';
import { FoodView } from './components/views/FoodView';
import { TravelView } from './components/views/TravelView';
import { LibraryView } from './components/views/LibraryView';
import { DigestView } from './components/views/DigestView';
import { PhotosView } from './components/views/PhotosView';
import { EntryModal } from './components/modals/EntryModal';
import { EntryDetailModal } from './components/modals/EntryDetailModal';
import { PasswordUnlockModal } from './components/modals/PasswordUnlockModal';
import { Heart, Check } from 'lucide-react';

const STORAGE_KEY = 'danny_personal_journal_v5';
const OWNER_STORAGE_KEY = 'danny_owner_mode_active';

export default function App() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Check private owner mode from URL parameter (?edit=true or ?mode=editor) or stored session
  const [isOwnerMode, setIsOwnerMode] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('edit') === 'false' || params.get('mode') === 'public') {
        localStorage.removeItem(OWNER_STORAGE_KEY);
        return false;
      }
      if (params.get('edit') === 'true' || params.get('edit') === '1' || params.get('mode') === 'editor') {
        localStorage.setItem(OWNER_STORAGE_KEY, 'true');
        return true;
      }
      return localStorage.getItem(OWNER_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Unlock owner mode
  const handleUnlockOwnerMode = () => {
    setIsOwnerMode(true);
    try {
      localStorage.setItem(OWNER_STORAGE_KEY, 'true');
    } catch {}
    showToast('🥭 Owner access unlocked! Edit controls enabled.');
  };

  // Exit owner mode
  const handleExitOwnerMode = () => {
    setIsOwnerMode(false);
    try {
      localStorage.removeItem(OWNER_STORAGE_KEY);
    } catch {}
    showToast('Switched to Public View');
  };

  // Load entries from localStorage or fallback to INITIAL_ENTRIES
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_ENTRIES;
  });

  const [activeSection, setActiveSection] = useState<SectionType>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedEntryForDetail, setSelectedEntryForDetail] = useState<JournalEntry | null>(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn('Unable to persist to localStorage', e);
    }
  }, [entries]);

  // Show gentle toast feedback
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Compute available tags from all entries
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((e) => {
      e.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  // Toggle tag in filter
  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  // Active detail entry derived directly from entries so updates like favoriting reflect instantly
  const activeDetailEntry = useMemo(() => {
    if (!selectedEntryForDetail) return null;
    return entries.find((e) => e.id === selectedEntryForDetail.id) || selectedEntryForDetail;
  }, [entries, selectedEntryForDetail]);

  // Toggle favorite on any entry
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === id) {
          const nextFav = !entry.isFavorite;
          showToast(nextFav ? `Saved to favorites` : `Removed from favorites`);
          return { ...entry, isFavorite: nextFav };
        }
        return entry;
      })
    );
    setSelectedEntryForDetail((current) => {
      if (current && current.id === id) {
        return { ...current, isFavorite: !current.isFavorite };
      }
      return current;
    });
  };

  // Save new or updated entry
  const handleSaveEntry = (entryToSave: JournalEntry) => {
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === entryToSave.id);
      if (exists) {
        showToast(`Updated "${entryToSave.title}"`);
        return prev.map((e) => (e.id === entryToSave.id ? entryToSave : e));
      } else {
        showToast(`Created new entry "${entryToSave.title}"`);
        return [entryToSave, ...prev];
      }
    });

    // Auto-switch to the section of the saved entry
    setActiveSection(entryToSave.section);
  };

  // Delete entry
  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    showToast('Entry deleted successfully');
  };

  // Open edit modal for an entry
  const handleOpenEditModal = (entry: JournalEntry) => {
    setSelectedEntryForDetail(null);
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  // Filter entries based on search & tags
  const hasActiveFilters = searchQuery.trim().length > 0 || selectedTags.length > 0;

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Tag matching (must contain all selected tags)
      if (selectedTags.length > 0) {
        const matchesAllTags = selectedTags.every((t) => entry.tags.includes(t));
        if (!matchesAllTags) return false;
      }

      // Query matching
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const inTitle = entry.title.toLowerCase().includes(q);
        const inSubtitle = entry.subtitle?.toLowerCase().includes(q) ?? false;
        const inSummary = entry.summary.toLowerCase().includes(q);
        const inContent = entry.content.toLowerCase().includes(q);
        const inLocation = entry.location?.toLowerCase().includes(q) ?? false;
        const inTags = entry.tags.some((t) => t.toLowerCase().includes(q));
        const inDish = entry.metadata?.mustTryDish?.toLowerCase().includes(q) ?? false;
        const inIngredients = entry.metadata?.ingredients?.some((ing) => ing.toLowerCase().includes(q)) ?? false;
        const inQuote = entry.metadata?.favoriteQuote?.toLowerCase().includes(q) ?? false;
        const inCreator = entry.metadata?.creator?.toLowerCase().includes(q) ?? false;
        const inBackstory = entry.metadata?.photoBackstory?.toLowerCase().includes(q) ?? false;

        if (
          !inTitle &&
          !inSubtitle &&
          !inSummary &&
          !inContent &&
          !inLocation &&
          !inTags &&
          !inDish &&
          !inIngredients &&
          !inQuote &&
          !inCreator &&
          !inBackstory
        ) {
          return false;
        }
      }

      return true;
    });
  }, [entries, searchQuery, selectedTags]);

  // Section-scoped filtered entries
  const currentSectionEntries = useMemo(() => {
    return filteredEntries.filter((e) => e.section === activeSection);
  }, [filteredEntries, activeSection]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      {/* Top Bar Navigation (Strict 3-zone contract with sprout in title as home button) */}
      <Navbar
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenNewEntryModal={() => {
          setEditingEntry(null);
          setIsEntryModalOpen(true);
        }}
        isOwnerMode={isOwnerMode}
        onToggleOwnerMode={() => setIsPasswordModalOpen(true)}
      />

      {/* Main Container (Expanded width for wide essay reading & travel side-by-side view) */}
      <main className={`flex-1 ${activeSection === 'digest' || activeSection === 'travel' ? 'max-w-7xl' : 'max-w-6xl'} w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10`}>
        {/* Streamlined Minimalist Search & Tag Bar */}
        <section aria-label="Journal Search and Tag Filtering">
          <SearchAndTagBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            availableTags={availableTags}
            selectedTags={selectedTags}
            onToggleTag={handleToggleTag}
            onClearFilters={handleClearFilters}
            totalFilteredCount={filteredEntries.length}
          />
        </section>

        {/* Content Display: If global filters are active, show unified filtered results; otherwise render active section */}
        {hasActiveFilters ? (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E7E2D8] pb-4">
              <div>
                <h2 className="text-2xl font-serif font-medium text-[#1C1917]">
                  Filtered Discoveries ({filteredEntries.length})
                </h2>
                <p className="text-xs text-[#78716C] mt-1">
                  Cross-section matches for your search and selected tags.
                </p>
              </div>

              {/* Quick Jump Tabs for filtered matches */}
              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                {(['all', 'digest', 'travel', 'food', 'library', 'photos'] as const).map((tab) => {
                  const count =
                    tab === 'all'
                      ? filteredEntries.length
                      : filteredEntries.filter((e) => e.section === tab).length;
                  const isCurrent = tab === 'all' ? false : activeSection === tab;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        if (tab !== 'all') setActiveSection(tab);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-colors capitalize ${
                        isCurrent
                          ? 'bg-[#2D5A43] text-white font-medium'
                          : 'bg-[#EDE8DF]/60 text-[#57534E] hover:text-[#1C1917]'
                      }`}
                    >
                      {tab} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="py-20 text-center text-[#78716C] bg-white/40 rounded-3xl border border-dashed border-[#DCD5C9]">
                <p className="text-base font-serif text-[#1C1917]">No journal entries matched your search.</p>
                <p className="text-xs text-[#78716C] mt-1.5">Try clearing selected tags or typing different keywords.</p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 px-4 py-2 text-xs font-medium text-[#2D5A43] bg-white border border-[#DCD5C9] hover:bg-[#F3EFE6] rounded-xl transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEntries.map((entry) => (
                  <article
                    key={entry.id}
                    onClick={() => setSelectedEntryForDetail(entry)}
                    className="group relative flex flex-col justify-between bg-white/80 hover:bg-white rounded-2xl p-6 border border-[#E7E2D8] hover:border-[#2D5A43]/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#78716C] mb-3">
                        <span className="uppercase tracking-widest text-[10px] font-semibold text-[#2D5A43]">
                          {entry.metadata?.isHomeCooked ? 'Home Recipe' : entry.section}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{entry.date}</span>
                          <button
                            type="button"
                            onClick={(e) => handleToggleFavorite(entry.id, e)}
                            className="p-0.5 text-[#A8A29E] hover:text-[#DC2626] transition-colors"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                entry.isFavorite ? 'fill-[#DC2626] text-[#DC2626]' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-xl font-serif font-medium text-[#1C1917] group-hover:text-[#2D5A43] transition-colors leading-snug">
                        {entry.title}
                      </h3>
                      {entry.subtitle && (
                        <p className="text-xs text-[#57534E] font-medium mt-1">
                          {entry.subtitle}
                        </p>
                      )}

                      <p className="mt-3 text-sm text-[#44403C] line-clamp-3 leading-relaxed">
                        {entry.summary}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#F3EFE6] flex items-center justify-between text-xs text-[#78716C]">
                      {entry.location ? (
                        <span className="truncate max-w-[180px]">{entry.location}</span>
                      ) : (
                        <span>{entry.tags.slice(0, 2).join(' · ')}</span>
                      )}
                      <span className="text-[#2D5A43] font-medium group-hover:underline">Read →</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Normal Section Views */
          <div>
            {activeSection === 'home' && (
              <HomeView
                entries={entries}
                onSelectSection={(sec) => {
                  setActiveSection(sec);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectEntry={(entry) => setSelectedEntryForDetail(entry)}
              />
            )}

            {activeSection === 'digest' && (
              <DigestView
                entries={currentSectionEntries}
                allEntries={entries}
                onSelectEntry={(entry) => setSelectedEntryForDetail(entry)}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {activeSection === 'travel' && (
              <TravelView
                entries={currentSectionEntries}
                onSelectEntry={(entry) => setSelectedEntryForDetail(entry)}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {activeSection === 'food' && (
              <FoodView
                entries={currentSectionEntries}
                onSelectEntry={(entry) => setSelectedEntryForDetail(entry)}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {activeSection === 'library' && (
              <LibraryView
                entries={currentSectionEntries}
                onSelectEntry={(entry) => setSelectedEntryForDetail(entry)}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {activeSection === 'photos' && (
              <PhotosView
                entries={currentSectionEntries}
                onSelectEntry={(entry) => setSelectedEntryForDetail(entry)}
                onToggleFavorite={handleToggleFavorite}
                onEdit={handleOpenEditModal}
                isOwnerMode={isOwnerMode}
              />
            )}
          </div>
        )}
      </main>

      {/* Editorial Footer - click mango 🥭 for owner passcode edit access */}
      <footer className="mt-auto border-t border-[#E7E2D8] bg-[#F6F3EC] py-8 px-6 text-center">
        <p className="text-xs text-[#78716C] flex items-center justify-center gap-1.5 select-none font-medium">
          <span>Fueled by fresh mangoes</span>
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="text-base cursor-pointer hover:scale-125 active:scale-95 transition-transform p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2D5A43]/40 relative"
            title={isOwnerMode ? "Editor Mode Active (Click to manage)" : "Owner Access (Click to unlock editing)"}
            aria-label="Owner Access Passcode"
          >
            <span>🥭</span>
            {isOwnerMode && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
            )}
          </button>
        </p>
      </footer>

      {/* Secret Mango Passcode Unlock Modal */}
      <PasswordUnlockModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        isUnlocked={isOwnerMode}
        onUnlock={handleUnlockOwnerMode}
        onLock={handleExitOwnerMode}
      />

      {/* In-App Entry Creator / Editor Modal (Only openable in Owner Mode) */}
      <EntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
        initialEntry={editingEntry}
        defaultSection={activeSection === 'home' ? 'digest' : activeSection}
        allEntries={entries}
      />

      {/* Entry Detail Lightbox Modal (Edit/Delete controls hidden in Public Mode) */}
      <EntryDetailModal
        entry={activeDetailEntry}
        allEntries={entries}
        onClose={() => setSelectedEntryForDetail(null)}
        onSelectEntry={(entry) => setSelectedEntryForDetail(entry)}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteEntry}
        onToggleFavorite={handleToggleFavorite}
        isOwnerMode={isOwnerMode}
      />

      {/* Quiet Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-[#1C1917] text-white text-xs font-medium rounded-xl shadow-xl animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
