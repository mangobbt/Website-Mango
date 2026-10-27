/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MangoIcon } from '../icons/MangoIcon';

export type RatingIconType = 'mango' | 'book' | 'clapper' | 'mountain';

interface FractionalRatingProps {
  rating: number; // e.g. 4.25, 4.5, 4.75, 5.0
  max?: number;
  size?: number;
  type?: RatingIconType;
  showNumeric?: boolean;
  interactive?: boolean;
  onChange?: (newRating: number) => void;
  className?: string;
}

// Crisp SVG Icons for Book, Clapperboard, and Mountain
export const BookRatingIcon: React.FC<{ size?: number; filled?: boolean }> = ({
  size = 18,
  filled = true,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    style={{ width: size, height: size }}
    className="shrink-0"
    xmlns="http://www.w3.org/2000/svg"
  >
    {filled ? (
      <>
        <path
          d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v18H6.5a2.5 2.5 0 0 0-2.5 2.5v-3z"
          fill="#C2410C"
          stroke="#9A3412"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M6 6h10M6 10h10M6 14h6"
          stroke="#FED7AA"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
          stroke="#7C2D12"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </>
    ) : (
      <path
        d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v18H6.5a2.5 2.5 0 0 0-2.5 2.5v-3zM4 19.5A2.5 2.5 0 0 1 6.5 17H20"
        stroke="#D1D5DB"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="transparent"
      />
    )}
  </svg>
);

export const ClapperRatingIcon: React.FC<{ size?: number; filled?: boolean }> = ({
  size = 18,
  filled = true,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    style={{ width: size, height: size }}
    className="shrink-0"
    xmlns="http://www.w3.org/2000/svg"
  >
    {filled ? (
      <>
        {/* Base Clapperboard */}
        <rect
          x="3"
          y="8"
          width="18"
          height="13"
          rx="2"
          fill="#1C1917"
          stroke="#0C0A09"
          strokeWidth="1.5"
        />
        {/* Clapper Top with Diagonal Striping */}
        <path
          d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3H3z"
          fill="#292524"
          stroke="#0C0A09"
          strokeWidth="1.5"
        />
        <path
          d="M7 3l-2 5M12 3l-2 5M17 3l-2 5"
          stroke="#F5F5F4"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="14.5" r="2.5" fill="#E89A3C" />
      </>
    ) : (
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
        stroke="#D1D5DB"
        strokeWidth="1.5"
        fill="transparent"
      />
    )}
  </svg>
);

export const MountainRatingIcon: React.FC<{ size?: number; filled?: boolean }> = ({
  size = 18,
  filled = true,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    style={{ width: size, height: size }}
    className="shrink-0"
    xmlns="http://www.w3.org/2000/svg"
  >
    {filled ? (
      <>
        {/* Main Mountain */}
        <path
          d="M3 20L10.5 5L18 20H3Z"
          fill="#2B4C6F"
          stroke="#1E3752"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Snow Cap */}
        <path
          d="M8.5 9L10.5 5L12.5 9L11.5 10L10.5 9.5L9.5 10L8.5 9Z"
          fill="#F0F9FF"
          stroke="#BAE6FD"
          strokeWidth="0.8"
        />
        {/* Secondary Peak */}
        <path
          d="M13 20L17 12L21 20H13Z"
          fill="#3B6590"
          stroke="#1E3752"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </>
    ) : (
      <path
        d="M3 20L10.5 5L18 20H3ZM13 20L17 12L21 20H13Z"
        stroke="#D1D5DB"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="transparent"
      />
    )}
  </svg>
);

export const FractionalRating: React.FC<FractionalRatingProps> = ({
  rating,
  max = 5,
  size = 18,
  type = 'mango',
  showNumeric = false,
  interactive = false,
  onChange,
  className = '',
}) => {
  // Normalize rating between 0 and max with 0.25 precision
  const safeRating = Math.max(0, Math.min(max, Math.round(rating * 4) / 4));

  const renderIcon = (filled: boolean) => {
    switch (type) {
      case 'book':
        return <BookRatingIcon size={size} filled={filled} />;
      case 'clapper':
        return <ClapperRatingIcon size={size} filled={filled} />;
      case 'mountain':
        return <MountainRatingIcon size={size} filled={filled} />;
      case 'mango':
      default:
        return (
          <MangoIcon
            size={size}
            filled={filled}
            className={filled ? '' : 'opacity-30 grayscale'}
          />
        );
    }
  };

  const stepOptions = [3.5, 4.0, 4.25, 4.5, 4.75, 5.0];

  return (
    <div className={`inline-flex flex-col gap-1.5 ${className}`}>
      <div
        className="inline-flex items-center gap-1 select-none"
        title={`${safeRating.toFixed(2)} of ${max}`}
      >
        {Array.from({ length: max }).map((_, idx) => {
          const fillRatio = Math.max(0, Math.min(1, safeRating - idx));
          const isFullyFilled = fillRatio >= 0.99;
          const isPartiallyFilled = fillRatio > 0 && fillRatio < 0.99;

          return (
            <div
              key={idx}
              onClick={() => {
                if (interactive && onChange) {
                  // Toggle or set to integer if clicked directly
                  onChange(idx + 1 === safeRating ? idx : idx + 1);
                }
              }}
              className={`relative inline-flex items-center justify-center ${
                interactive ? 'cursor-pointer hover:scale-105 transition-transform' : ''
              }`}
              style={{ width: size, height: size }}
            >
              {/* Background Empty / Outline Layer */}
              <div className="absolute inset-0 flex items-center justify-center">
                {renderIcon(false)}
              </div>

              {/* Foreground Filled Layer with dynamic width clipping */}
              {isFullyFilled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {renderIcon(true)}
                </div>
              )}

              {isPartiallyFilled && (
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden flex items-center"
                  style={{ width: `${fillRatio * 100}%` }}
                >
                  <div style={{ width: size, height: size }} className="shrink-0">
                    {renderIcon(true)}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Optional Numeric Badge */}
        {showNumeric && (
          <span className="ml-1 text-xs font-mono font-medium text-[#57534E]">
            {safeRating % 1 === 0 ? safeRating.toFixed(1) : safeRating.toFixed(2)}
          </span>
        )}
      </div>

      {/* Interactive Quarter-Step Controls for Modal Editing */}
      {interactive && onChange && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-[#78716C] mr-0.5 font-medium">Quick Pick:</span>
          {stepOptions.map((step) => {
            const isActive = Math.abs(safeRating - step) < 0.05;
            return (
              <button
                key={step}
                type="button"
                onClick={() => onChange(step)}
                className={`px-2 py-0.5 text-xs font-mono rounded-md border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1C1917] text-white border-[#1C1917] font-semibold scale-105 shadow-2xs'
                    : 'bg-white text-[#57534E] border-[#D8D0C2] hover:border-[#1C1917]'
                }`}
              >
                {step.toFixed(2)}
              </button>
            );
          })}

          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() => onChange(Math.max(1, safeRating - 0.25))}
              className="px-1.5 py-0.5 text-xs font-mono bg-white border border-[#D8D0C2] rounded text-[#57534E] hover:bg-[#F5F2EB]"
              title="Decrease by 0.25"
            >
              -0.25
            </button>
            <button
              type="button"
              onClick={() => onChange(Math.min(max, safeRating + 0.25))}
              className="px-1.5 py-0.5 text-xs font-mono bg-white border border-[#D8D0C2] rounded text-[#57534E] hover:bg-[#F5F2EB]"
              title="Increase by 0.25"
            >
              +0.25
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
