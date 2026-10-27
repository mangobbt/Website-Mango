/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Tag as TagIcon, ChevronDown, Check } from 'lucide-react';

interface SearchAndTagBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearFilters: () => void;
  totalFilteredCount: number;
}

export const SearchAndTagBar: React.FC<SearchAndTagBarProps> = ({
  searchQuery,
  onSearchChange,
  availableTags,
  selectedTags,
  onToggleTag,
  onClearFilters,
  totalFilteredCount,
}) => {
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedTags.length > 0;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Sleek Single-Line Compact Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-white/90 border border-[#DDD5C7] rounded-xl shadow-2xs hover:border-[#2D5A43]/40 transition-colors">
        {/* Search Input Box */}
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-[#78716C] ml-2.5 shrink-0 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes, dishes, cities, or quotes..."
            className="w-full pl-2.5 pr-8 py-1.5 text-xs sm:text-sm bg-transparent text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 text-[#78716C] hover:text-[#1C1917] cursor-pointer p-0.5"
              title="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tag Dropdown Trigger Button */}
        {availableTags.length > 0 && (
          <button
            type="button"
            onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              selectedTags.length > 0
                ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                : 'bg-[#FBF9F5] text-[#57534E] hover:text-[#1C1917] border-[#DDD5C7] hover:bg-[#F3EFE6]'
            }`}
          >
            <TagIcon className="w-3.5 h-3.5" />
            <span>
              {selectedTags.length > 0
                ? `${selectedTags.length} ${selectedTags.length === 1 ? 'tag' : 'tags'}`
                : 'Tags'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${tagDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        )}

        {/* Clear Filters Button if any active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            title="Reset filters"
            className="p-1.5 text-[#991B1B] hover:bg-[#FEE2E2]/60 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Compact Tag Dropdown Popover */}
      {tagDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 z-30 w-80 max-h-72 overflow-y-auto p-3.5 bg-[#FBF9F5] rounded-2xl border border-[#DDD5C7] shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E7E2D8] text-xs">
            <span className="font-medium text-[#1C1917]">Select Tags to Filter</span>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => selectedTags.forEach((t) => onToggleTag(t))}
                className="text-[11px] text-[#991B1B] hover:underline cursor-pointer"
              >
                Clear all tags
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2D5A43] text-white font-medium shadow-2xs'
                      : 'bg-white text-[#57534E] hover:text-[#1C1917] border border-[#DDD5C7] hover:bg-[#F3EFE6]'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
