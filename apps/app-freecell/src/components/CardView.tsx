import React from 'react';
import { Card, Suit } from '../types/freecell';

interface CardViewProps {
  card: Card;
  isSelected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const SUIT_ICONS: Record<Suit, string> = {
  spade: '♠',
  heart: '♥',
  diamond: '♦',
  club: '♣'
};

const RANK_LABELS: Record<number, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K'
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  isSelected = false,
  onClick,
  onDoubleClick,
  className = '',
  style
}) => {
  const isRed = card.color === 'red';
  const rankStr = RANK_LABELS[card.rank] || String(card.rank);
  const suitSymbol = SUIT_ICONS[card.suit];

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={style}
      className={`relative w-12 sm:w-16 h-16 sm:h-22 rounded-xl bg-white border border-slate-300 shadow-md select-none cursor-pointer transition-all duration-150 transform hover:-translate-y-1 ${
        isRed ? 'text-rose-600' : 'text-slate-900'
      } ${
        isSelected
          ? 'ring-4 ring-amber-400 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] -translate-y-2 z-30'
          : 'hover:shadow-lg'
      } ${className}`}
    >
      {/* Top Left Rank & Suit */}
      <div className="absolute top-1 left-1.5 flex flex-col items-center leading-none">
        <span className="font-extrabold text-xs sm:text-sm tracking-tighter">{rankStr}</span>
        <span className="text-[10px] sm:text-xs">{suitSymbol}</span>
      </div>

      {/* Center Large Suit Symbol */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-90">
        <span className="text-xl sm:text-3xl font-black drop-shadow-sm">{suitSymbol}</span>
      </div>

      {/* Bottom Right Rank & Suit (Inverted) */}
      <div className="absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180">
        <span className="font-extrabold text-xs sm:text-sm tracking-tighter">{rankStr}</span>
        <span className="text-[10px] sm:text-xs">{suitSymbol}</span>
      </div>
    </div>
  );
};
