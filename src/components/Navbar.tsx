/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SectionType } from '../types';
import { Plus, Menu, X, Lock, Unlock } from 'lucide-react';

interface NavbarProps {
  activeSection: SectionType;
  onSelectSection: (section: SectionType) => void;
  onOpenNewEntryModal: () => void;
  isOwnerMode: boolean;
  onToggleOwnerMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onSelectSection,
  onOpenNewEntryModal,
  isOwnerMode,
  onToggleOwnerMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: SectionType; label: string; emoji: string }[] = [
    { id: 'digest', label: 'Digests & Thoughts', emoji: '🦦' },
    { id: 'travel', label: 'Travelling', emoji: '🏔️' },
    { id: 'food', label: 'Food & Dining', emoji: '🥭' },
    { id: 'library', label: 'Books & Movies', emoji: '📖' },
    { id: 'photos', label: 'Photos', emoji: '📷' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#E7E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark with Sprout (Clicking takes user to Home) */}
        <button
          type="button"
          onClick={() => {
            onSelectSection('home');
            setMobileMenuOpen(false);
          }}
          className="group text-2xl font-serif font-medium tracking-tight text-[#1C1917] hover:text-[#2D5A43] transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2"
          title="Return to Home"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">🌱</span>
          <span className="font-serif">Danny</span>
          <span className="text-xs font-sans tracking-widest text-[#78716C] uppercase font-normal hidden lg:inline">
            · Garden
          </span>
        </button>

        {/* Zone 2: Navigation Links (Clean links with section emojis; Home is accessed via title) */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs lg:text-sm font-medium text-[#57534E]">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer relative ${
                  isActive
                    ? 'text-[#2D5A43] font-semibold'
                    : 'hover:text-[#1C1917]'
                }`}
              >
                <span className="text-sm select-none">{item.emoji}</span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-[-17px] left-0 right-0 h-[2px] bg-[#2D5A43] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Private Add Entry action (only visible in owner mode) & Mobile Menu Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {isOwnerMode ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenNewEntryModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#2D5A43] hover:bg-[#234633] active:bg-[#1B3627] rounded-xl transition-all shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Entry</span>
              </button>

              {onToggleOwnerMode && (
                <button
                  type="button"
                  onClick={onToggleOwnerMode}
                  title="Exit Private Editor Mode"
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-[#B45309] bg-[#FFF8EB] hover:bg-[#FEF3C7] rounded-lg border border-[#FDE68A] transition-colors cursor-pointer"
                >
                  <Unlock className="w-3 h-3" />
                  <span>Editor Active</span>
                </button>
              )}
            </div>
          ) : null}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden text-[#57534E] hover:text-[#1C1917] hover:bg-[#EFEBE1] rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E7E2D8] bg-[#FBF9F5] px-6 py-4 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {/* Home button in mobile drawer */}
          <button
            type="button"
            onClick={() => {
              onSelectSection('home');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
              activeSection === 'home'
                ? 'bg-[#2D5A43]/10 text-[#2D5A43] font-semibold'
                : 'text-[#57534E] hover:bg-[#EFEBE1] hover:text-[#1C1917]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🌱</span>
              <span>Home</span>
            </div>
            {activeSection === 'home' && <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A43]" />}
          </button>

          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#2D5A43]/10 text-[#2D5A43] font-semibold'
                    : 'text-[#57534E] hover:bg-[#EFEBE1] hover:text-[#1C1917]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.emoji}</span>
                  <span>{item.label}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A43]" />}
              </button>
            );
          })}

          {isOwnerMode && (
            <div className="pt-2 border-t border-[#E7E2D8]">
              <button
                type="button"
                onClick={() => {
                  onOpenNewEntryModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-[#2D5A43] rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Entry</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
