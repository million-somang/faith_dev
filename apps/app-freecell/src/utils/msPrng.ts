import { Card, Suit, CardColor } from '../types/freecell';

const SUITS: Suit[] = ['club', 'diamond', 'heart', 'spade'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (let s = 0; s < 4; s++) {
    const suit = SUITS[s];
    const color: CardColor = (suit === 'heart' || suit === 'diamond') ? 'red' : 'black';
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        color
      });
    }
  }
  return deck;
}

/**
 * Microsoft Windows FreeCell PRNG Deck Generator (#1 ~ #32000)
 */
export function generateMsFreeCellDeck(seedNum: number): Card[] {
  // Standard 52 card array index 0..51
  // MS FreeCell ordering: A♣..K♣ (0..12), A♦..K♦ (13..25), A♥..K♥ (26..38), A♠..K♠ (39..51)
  const deckIndices: number[] = Array.from({ length: 52 }, (_, i) => i);
  let seed = seedNum & 0x7fffffff;

  function msRand(): number {
    seed = (Math.imul(seed, 214013) + 2531011) & 0x7fffffff;
    return (seed >> 16) & 0x7fff;
  }

  // Fisher-Yates shuffle backwards as performed in Windows FreeCell C source code
  for (let i = 51; i > 0; i--) {
    const j = msRand() % (i + 1);
    const tmp = deckIndices[i];
    deckIndices[i] = deckIndices[j];
    deckIndices[j] = tmp;
  }

  // Convert indices back to Card objects
  return deckIndices.map((idx) => {
    const suitIdx = Math.floor(idx / 13);
    const rank = (idx % 13) + 1;
    const suit = SUITS[suitIdx];
    const color: CardColor = (suit === 'heart' || suit === 'diamond') ? 'red' : 'black';
    return {
      id: `${suit}-${rank}-${seedNum}`,
      suit,
      rank,
      color
    };
  });
}

/**
 * Standard Random Deck Generator for random seeds
 */
export function generateRandomDeck(): Card[] {
  const deck = createDeck();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}
