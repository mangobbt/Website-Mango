/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MangoIconProps {
  className?: string;
  size?: number;
  filled?: boolean;
}

export const MangoIcon: React.FC<MangoIconProps> = ({
  className = 'w-5 h-5',
  size,
  filled = true,
}) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Mango"
    >
      <defs>
        <linearGradient id="mangoBodyGrad" x1="6" y1="8" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="45%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <linearGradient id="mangoLeafGrad" x1="12" y1="3" x2="22" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2D5A43" />
          <stop offset="100%" stopColor="#4A7C59" />
        </linearGradient>
      </defs>

      {/* Stem */}
      <path
        d="M16 8C16 5.5 15 3.5 14 2.5"
        stroke="#593E2B"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Leaf */}
      <path
        d="M15.5 5.5C18 3.5 22.5 4 23.5 7.5C21 8.5 17.5 8 15.5 5.5Z"
        fill="url(#mangoLeafGrad)"
        stroke="#234633"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Mango Body - Organic kidney-curved silhouette */}
      <path
        d="M16 8.5C12.5 8.5 8 11.5 7 16.5C5.8 22.5 10.5 28.5 16.5 28.5C22.5 28.5 25.5 23 25 18C24.5 13 20 8.5 16 8.5Z"
        fill={filled ? 'url(#mangoBodyGrad)' : 'transparent'}
        stroke={filled ? '#EA580C' : '#9CA3AF'}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Soft natural sheen highlight */}
      {filled && (
        <path
          d="M11 14.5C10 17 11 21 12 23"
          stroke="#FED7AA"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
        />
      )}
    </svg>
  );
};

export const MangoRating: React.FC<{
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (val: number) => void;
}> = ({ rating, max = 5, size = 18, interactive = false, onChange }) => {
  return (
    <div className="inline-flex items-center gap-1" title={`${rating} of ${max} Mangoes`}>
      {Array.from({ length: max }).map((_, idx) => {
        const isFilled = idx < rating;
        return (
          <button
            key={idx}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(idx + 1)}
            className={`transition-transform ${interactive ? 'hover:scale-110 cursor-pointer p-0.5' : 'cursor-default'}`}
          >
            <MangoIcon size={size} filled={isFilled} className={isFilled ? '' : 'opacity-35 grayscale'} />
          </button>
        );
      })}
    </div>
  );
};
