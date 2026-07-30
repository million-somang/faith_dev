import React from 'react';
import { Card, Suit, SelectedCardLocation } from '../types/freecell';
import { CardView } from './CardView';

interface FreeCellBoardProps {
  freecells: (Card | null)[];
  foundations: Record<Suit, Card[]>;
  tableaus: Card[][];
  selected: SelectedCardLocation | null;
  onCardClick: (loc: SelectedCardLocation) => void;
  onAutoMoveCard: (loc: SelectedCardLocation) => void;
  onFreeCellClick: (index: number) => void;
  onFoundationClick: (suit: Suit) => void;
  onTableauColClick: (colIndex: number) => void;
}

const SUITS: Suit[] = ['spade', 'heart', 'diamond', 'club'];
const SUIT_ICONS: Record<Suit, string> = {
  spade: '♠',
  heart: '♥',
  diamond: '♦',
  club: '♣'
};

export const FreeCellBoard: React.FC<FreeCellBoardProps> = ({
  freecells,
  foundations,
  tableaus,
  selected,
  onCardClick,
  onAutoMoveCard,
  onFreeCellClick,
  onFoundationClick,
  onTableauColClick
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-2 sm:p-4">
      {/* Top Section: FreeCells (Left 4) & Foundations (Right 4) */}
      <div className="grid grid-cols-8 gap-2 sm:gap-4 items-center">
        {/* Left 4: FreeCells (임시 보관소) */}
        {freecells.map((card, idx) => {
          const isSelected = selected?.type === 'freecell' && selected.index === idx;
          return (
            <div
              key={`freecell-${idx}`}
              onClick={() => {
                if (card) {
                  onCardClick({ type: 'freecell', index: idx });
                } else {
                  onFreeCellClick(idx);
                }
              }}
              className="relative w-12 sm:w-16 h-16 sm:h-22 rounded-xl bg-emerald-900/40 border-2 border-dashed border-emerald-700/60 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors shadow-inner"
            >
              {!card ? (
                <span className="text-emerald-600/60 font-bold text-xs">FREE</span>
              ) : (
                <CardView
                  card={card}
                  isSelected={isSelected}
                  onDoubleClick={() => onAutoMoveCard({ type: 'freecell', index: idx })}
                />
              )}
            </div>
          );
        })}

        {/* Right 4: Foundations (홈셀 목표 지점) */}
        {SUITS.map((suit) => {
          const stack = foundations[suit];
          const topCard = stack.length > 0 ? stack[stack.length - 1] : null;
          const isRed = suit === 'heart' || suit === 'diamond';

          return (
            <div
              key={`foundation-${suit}`}
              onClick={() => onFoundationClick(suit)}
              className="relative w-12 sm:w-16 h-16 sm:h-22 rounded-xl bg-emerald-900/40 border-2 border-dashed border-emerald-700/60 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors shadow-inner"
            >
              {!topCard ? (
                <span className={`text-xl sm:text-2xl font-black ${isRed ? 'text-rose-500/50' : 'text-slate-400/50'}`}>
                  {SUIT_ICONS[suit]}
                </span>
              ) : (
                <CardView card={topCard} />
              )}
              {stack.length > 0 && (
                <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-400 text-emerald-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-md z-10">
                  {stack.length}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Section: 8 Tableau Columns (테이블로 8열) */}
      <div className="grid grid-cols-8 gap-2 sm:gap-4 items-start min-h-[380px] sm:min-h-[460px]">
        {tableaus.map((column, colIdx) => {
          const isEmpty = column.length === 0;

          return (
            <div
              key={`tableau-col-${colIdx}`}
              onClick={() => {
                if (isEmpty) {
                  onTableauColClick(colIdx);
                }
              }}
              className="relative w-12 sm:w-16 min-h-[160px] flex flex-col items-center"
            >
              {/* Empty Column Drop Indicator */}
              {isEmpty && (
                <div
                  onClick={() => onTableauColClick(colIdx)}
                  className="w-12 sm:w-16 h-16 sm:h-22 rounded-xl border-2 border-dashed border-emerald-800/60 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors"
                >
                  <span className="text-emerald-700 text-[10px] font-bold">K / Any</span>
                </div>
              )}

              {/* Column Cards Overlapping Stack */}
              {column.map((card, cardIdx) => {
                const isSelected = selected?.type === 'tableau' && selected.colIndex === colIdx && selected.cardIndex === cardIdx;
                const isTopCard = cardIdx === column.length - 1;

                return (
                  <div
                    key={card.id}
                    style={{
                      marginTop: cardIdx === 0 ? '0px' : '-44px' // Stack vertical offset
                    }}
                    className="relative transition-all duration-150"
                  >
                    <CardView
                      card={card}
                      isSelected={isSelected}
                      onClick={() => onCardClick({ type: 'tableau', colIndex: colIdx, cardIndex: cardIdx })}
                      onDoubleClick={() => {
                        if (isTopCard) {
                          onAutoMoveCard({ type: 'tableau', colIndex: colIdx, cardIndex: cardIdx });
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
