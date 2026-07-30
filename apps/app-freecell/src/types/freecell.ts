export type Suit = 'spade' | 'heart' | 'diamond' | 'club';
export type CardColor = 'red' | 'black';

export interface Card {
  id: string;
  suit: Suit;
  rank: number; // 1 = A, 11 = J, 12 = Q, 13 = K
  color: CardColor;
}

export type SelectedCardLocation = 
  | { type: 'freecell'; index: number }
  | { type: 'tableau'; colIndex: number; cardIndex: number };

export interface GameMoveHistory {
  freecells: (Card | null)[];
  foundations: Record<Suit, Card[]>;
  tableaus: Card[][];
  moveCount: number;
}
