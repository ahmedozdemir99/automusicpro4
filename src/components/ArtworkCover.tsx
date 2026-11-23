import React from 'react';
import { ArtworkMotif } from '../types/media';

interface ArtworkCoverProps {
  motif: ArtworkMotif;
  title?: string;
  arabicTitle?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<ArtworkCoverProps['size']>, string> = {
  xs: 'w-10 h-10 rounded-lg',
  sm: 'w-12 h-12 rounded-xl',
  md: 'w-16 h-16 rounded-xl',
  lg: 'w-44 h-44 rounded-2xl',
  xl: 'w-64 h-64 sm:w-72 sm:h-72 rounded-3xl',
};

const MOTIF_GRADIENTS: Record<ArtworkMotif, string> = {
  quran: 'from-[#1D180B] via-[#12110E] to-[#09090B]',
  anatolia: 'from-[#22170D] via-[#13110E] to-[#0B0A09]',
  karadeniz: 'from-[#0E1B18] via-[#0F1312] to-[#09090B]',
  tasavvuf: 'from-[#1C160C] via-[#12100D] to-[#09090B]',
  arabic: 'from-[#211A0B] via-[#14110C] to-[#09090B]',
  pop_rock: 'from-[#1A1612] via-[#131316] to-[#09090B]',
  nostalgia: 'from-[#201910] via-[#141210] to-[#0A0908]',
  studio: 'from-[#181713] via-[#111114] to-[#09090B]',
};

export const ArtworkCover: React.FC<ArtworkCoverProps> = ({
  motif,
  arabicTitle,
  size = 'md',
  className = '',
}) => {
  const showDetail = size === 'lg' || size === 'xl';

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-gradient-to-br ${MOTIF_GRADIENTS[motif]} border border-white/[0.08] flex items-center justify-center select-none ${SIZE_CLASSES[size]} ${className}`}
    >
      {/* Subtle architectural burnished gold geometric SVG motif */}
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 w-full h-full opacity-70"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`goldGlow-${motif}`} cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="120" height="120" fill={`url(#goldGlow-${motif})`} />

        {motif === 'quran' && (
          <g stroke="#D4AF37" strokeOpacity="0.38" fill="none" strokeWidth="0.9">
            <rect x="26" y="26" width="68" height="68" />
            <rect x="26" y="26" width="68" height="68" transform="rotate(45 60 60)" />
            <circle cx="60" cy="60" r="34" strokeOpacity="0.22" />
            <circle cx="60" cy="60" r="18" strokeOpacity="0.3" />
          </g>
        )}

        {(motif === 'anatolia' || motif === 'nostalgia') && (
          <g stroke="#D4AF37" strokeOpacity="0.35" fill="none" strokeWidth="0.9">
            <circle cx="60" cy="60" r="42" />
            <circle cx="60" cy="60" r="28" strokeDasharray="3 4" />
            <circle cx="60" cy="60" r="10" fill="#D4AF37" fillOpacity="0.12" />
            <line x1="18" y1="60" x2="102" y2="60" strokeOpacity="0.18" />
          </g>
        )}

        {motif === 'karadeniz' && (
          <g stroke="#D4AF37" strokeOpacity="0.34" fill="none" strokeWidth="1">
            <path d="M0 84 Q30 56 60 72 T120 62" />
            <path d="M0 96 Q36 68 72 82 T120 74" strokeOpacity="0.22" />
            <path d="M16 48 L48 26 L78 50 L104 32" strokeOpacity="0.28" />
          </g>
        )}

        {(motif === 'tasavvuf' || motif === 'arabic') && (
          <g stroke="#D4AF37" strokeOpacity="0.36" fill="none" strokeWidth="0.9">
            <circle cx="60" cy="60" r="38" />
            <ellipse cx="60" cy="60" rx="22" ry="38" />
            <ellipse cx="60" cy="60" rx="38" ry="22" />
            <circle cx="60" cy="60" r="6" fill="#D4AF37" fillOpacity="0.25" />
          </g>
        )}

        {(motif === 'pop_rock' || motif === 'studio') && (
          <g stroke="#D4AF37" strokeOpacity="0.38" fill="none" strokeWidth="1.2">
            <line x1="24" y1="74" x2="24" y2="46" />
            <line x1="36" y1="84" x2="36" y2="36" />
            <line x1="48" y1="90" x2="48" y2="30" />
            <line x1="60" y1="96" x2="60" y2="24" />
            <line x1="72" y1="88" x2="72" y2="32" />
            <line x1="84" y1="78" x2="84" y2="42" />
            <line x1="96" y1="70" x2="96" y2="50" />
          </g>
        )}
      </svg>

      {arabicTitle ? (
        <span
          className={`relative z-10 font-arabic text-[#E8CF78] drop-shadow-sm text-center px-2 leading-tight ${
            showDetail ? 'text-4xl' : size === 'md' ? 'text-base' : 'text-xs'
          }`}
          dir="rtl"
        >
          {arabicTitle}
        </span>
      ) : (
        <span
          className={`relative z-10 font-semibold tracking-wider text-[#D4AF37]/80 ${
            showDetail ? 'text-xs uppercase' : 'text-[10px]'
          }`}
        >
          {showDetail ? 'AutoMusic Pro' : ''}
        </span>
      )}
    </div>
  );
};
