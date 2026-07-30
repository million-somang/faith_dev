import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Suit, SelectedCardLocation, GameMoveHistory } from '../types/freecell';
import { generateMsFreeCellDeck, generateRandomDeck } from '../utils/msPrng';

const SUITS: Suit[] = ['spade', 'heart', 'diamond', 'club'];

export function useFreeCell() {
  const [gameSeed, setGameSeed] = useState<number>(() => Math.floor(Math.random() * 32000) + 1);
  const [freecells, setFreecells] = useState<(Card | null)[]>([null, null, null, null]);
  const [foundations, setFoundations] = useState<Record<Suit, Card[]>>({
    spade: [],
    heart: [],
    diamond: [],
    club: []
  });
  const [tableaus, setTableaus] = useState<Card[][]>([[], [], [], [], [], [], [], []]);
  
  const [selected, setSelected] = useState<SelectedCardLocation | null>(null);
  const [history, setHistory] = useState<GameMoveHistory[]>([]);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hintMessage, setHintMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 로딩 화면 타이머
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // 게임 시드 기반 초기화
  const initGame = useCallback((seedNum: number) => {
    setIsLoading(true);
    setGameSeed(seedNum);
    setFreecells([null, null, null, null]);
    setFoundations({ spade: [], heart: [], diamond: [], club: [] });
    setSelected(null);
    setHistory([]);
    setMoveCount(0);
    setTimeSeconds(0);
    setIsWon(false);
    setHintMessage('');

    const deck = seedNum >= 1 && seedNum <= 32000 
      ? generateMsFreeCellDeck(seedNum)
      : generateRandomDeck();

    // 8개 테이블 열에 딜링 (0~3열 7장, 4~7열 6장)
    const newTableaus: Card[][] = [[], [], [], [], [], [], [], []];
    deck.forEach((card, index) => {
      const col = index % 8;
      newTableaus[col].push(card);
    });

    setTableaus(newTableaus);

    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  }, []);

  // 초기 1회 실행
  useEffect(() => {
    initGame(gameSeed);
  }, []);

  // 타이머 실행
  useEffect(() => {
    if (isWon || isPaused || isLoading) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeSeconds(t => t + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWon, isPaused, isLoading]);

  // 승리 조건 체크 (Foundations 합계 52)
  useEffect(() => {
    const totalFoundationCards = Object.values(foundations).reduce((acc, curr) => acc + curr.length, 0);
    if (totalFoundationCards === 52 && !isWon) {
      setIsWon(true);
    }
  }, [foundations, isWon]);

  // 히스토리 기록
  const saveHistory = useCallback(() => {
    const stateCopy: GameMoveHistory = {
      freecells: [...freecells],
      foundations: {
        spade: [...foundations.spade],
        heart: [...foundations.heart],
        diamond: [...foundations.diamond],
        club: [...foundations.club]
      },
      tableaus: tableaus.map(col => [...col]),
      moveCount
    };
    setHistory(prev => [...prev, stateCopy]);
  }, [freecells, foundations, tableaus, moveCount]);

  // 실행 취소 (Undo)
  const undo = useCallback(() => {
    if (history.length === 0 || isWon) return;
    const lastState = history[history.length - 1];
    setFreecells(lastState.freecells);
    setFoundations(lastState.foundations);
    setTableaus(lastState.tableaus);
    setMoveCount(lastState.moveCount);
    setSelected(null);
    setHistory(prev => prev.slice(0, -1));
    setHintMessage('이전 상태로 되돌렸습니다.');
  }, [history, isWon]);

  // 이동 가능한 최대 카드 수 계산
  const getMaxMovableCards = useCallback((isDestinationEmptyCol: boolean) => {
    const emptyFreecells = freecells.filter(c => c === null).length;
    const emptyTableaus = tableaus.filter(col => col.length === 0).length;
    const effectiveEmptyTableaus = isDestinationEmptyCol ? Math.max(0, emptyTableaus - 1) : emptyTableaus;

    return (1 + emptyFreecells) * Math.pow(2, effectiveEmptyTableaus);
  }, [freecells, tableaus]);

  // 연속된 카드 뭉치가 올바른 내림차순/색상교대 정렬인지 체크
  const isValidSequence = (cards: Card[]) => {
    for (let i = 0; i < cards.length - 1; i++) {
      const top = cards[i];
      const next = cards[i + 1];
      if (top.color === next.color || top.rank !== next.rank + 1) {
        return false;
      }
    }
    return true;
  };

  // 홈셀 자동 수집 (Auto-Foundation)
  const tryAutoFoundation = useCallback(() => {
    let movedAny = false;
    let newFreecells = [...freecells];
    let newFoundations = {
      spade: [...foundations.spade],
      heart: [...foundations.heart],
      diamond: [...foundations.diamond],
      club: [...foundations.club]
    };
    let newTableaus = tableaus.map(col => [...col]);

    const isSafeToAutoMove = (card: Card) => {
      if (card.rank <= 2) return true; // Ace, 2는 무조건 안전
      const oppColors: Suit[] = (card.color === 'red') ? ['spade', 'club'] : ['heart', 'diamond'];
      const oppMinRank = Math.min(...oppColors.map(s => newFoundations[s].length));
      return card.rank <= oppMinRank + 1;
    };

    // 1. Check freecells
    for (let i = 0; i < 4; i++) {
      const card = newFreecells[i];
      if (card) {
        const foundationStack = newFoundations[card.suit];
        const topRank = foundationStack.length;
        if (card.rank === topRank + 1 && isSafeToAutoMove(card)) {
          newFoundations[card.suit].push(card);
          newFreecells[i] = null;
          movedAny = true;
          break;
        }
      }
    }

    // 2. Check tableaus
    if (!movedAny) {
      for (let col = 0; col < 8; col++) {
        const column = newTableaus[col];
        if (column.length > 0) {
          const card = column[column.length - 1];
          const foundationStack = newFoundations[card.suit];
          const topRank = foundationStack.length;
          if (card.rank === topRank + 1 && isSafeToAutoMove(card)) {
            newFoundations[card.suit].push(card);
            column.pop();
            movedAny = true;
            break;
          }
        }
      }
    }

    if (movedAny) {
      saveHistory();
      setFreecells(newFreecells);
      setFoundations(newFoundations);
      setTableaus(newTableaus);
      setMoveCount(m => m + 1);
    }
  }, [freecells, foundations, tableaus, saveHistory]);

  // 프리셀로 이동
  const moveToFreecell = (loc: SelectedCardLocation, freecellIndex: number) => {
    if (freecells[freecellIndex] !== null) return false;

    let cardToMove: Card | null = null;
    let newTableaus = tableaus.map(col => [...col]);
    let newFreecells = [...freecells];

    if (loc.type === 'freecell') {
      if (loc.index === freecellIndex) return false;
      cardToMove = newFreecells[loc.index];
      newFreecells[loc.index] = null;
    } else {
      const col = newTableaus[loc.colIndex];
      if (loc.cardIndex !== col.length - 1) return false; // 오직 맨 위의 카드 1장만 프리셀 이동 가능
      cardToMove = col.pop() || null;
    }

    if (!cardToMove) return false;

    saveHistory();
    newFreecells[freecellIndex] = cardToMove;
    setFreecells(newFreecells);
    setTableaus(newTableaus);
    setSelected(null);
    setMoveCount(m => m + 1);
    return true;
  };

  // 홈셀로 이동
  const moveToFoundation = (loc: SelectedCardLocation, suit: Suit) => {
    let cardToMove: Card | null = null;
    let newTableaus = tableaus.map(col => [...col]);
    let newFreecells = [...freecells];

    if (loc.type === 'freecell') {
      cardToMove = newFreecells[loc.index];
    } else {
      const col = newTableaus[loc.colIndex];
      if (loc.cardIndex !== col.length - 1) return false;
      cardToMove = col[col.length - 1];
    }

    if (!cardToMove || cardToMove.suit !== suit) return false;

    const foundationStack = foundations[suit];
    const topRank = foundationStack.length;
    if (cardToMove.rank !== topRank + 1) return false;

    saveHistory();
    if (loc.type === 'freecell') {
      newFreecells[loc.index] = null;
    } else {
      newTableaus[loc.colIndex].pop();
    }

    const newFoundations = {
      ...foundations,
      [suit]: [...foundationStack, cardToMove]
    };

    setFreecells(newFreecells);
    setFoundations(newFoundations);
    setTableaus(newTableaus);
    setSelected(null);
    setMoveCount(m => m + 1);
    return true;
  };

  // 테이블로 열로 이동
  const moveToTableauCol = (loc: SelectedCardLocation, targetColIndex: number) => {
    let movingCards: Card[] = [];
    let newTableaus = tableaus.map(col => [...col]);
    let newFreecells = [...freecells];

    if (loc.type === 'freecell') {
      const card = newFreecells[loc.index];
      if (card) movingCards = [card];
    } else {
      if (loc.colIndex === targetColIndex) return false;
      const srcCol = newTableaus[loc.colIndex];
      movingCards = srcCol.slice(loc.cardIndex);
    }

    if (movingCards.length === 0) return false;

    // 이동 유효성 검사 (내림차순, 색상 교대)
    if (!isValidSequence(movingCards)) return false;

    const targetCol = newTableaus[targetColIndex];
    const isTargetEmpty = targetCol.length === 0;
    const maxMovable = getMaxMovableCards(isTargetEmpty);

    if (movingCards.length > maxMovable) {
      setHintMessage(`현재 빈 프리셀/열 부족으로 최대 ${maxMovable}장까지만 이동 가능합니다.`);
      return false;
    }

    if (!isTargetEmpty) {
      const targetTopCard = targetCol[targetCol.length - 1];
      const bottomMovingCard = movingCards[0];
      if (bottomMovingCard.color === targetTopCard.color || bottomMovingCard.rank !== targetTopCard.rank - 1) {
        return false;
      }
    }

    saveHistory();
    if (loc.type === 'freecell') {
      newFreecells[loc.index] = null;
    } else {
      newTableaus[loc.colIndex] = newTableaus[loc.colIndex].slice(0, loc.cardIndex);
    }

    newTableaus[targetColIndex] = [...targetCol, ...movingCards];

    setFreecells(newFreecells);
    setTableaus(newTableaus);
    setSelected(null);
    setMoveCount(m => m + 1);
    return true;
  };

  // 원클릭/스마트 카드 클릭 처리
  const handleCardClick = (loc: SelectedCardLocation) => {
    if (isWon) return;

    // 이미 선택된 상태가 없다면 -> 선택 실행
    if (!selected) {
      // 선택하려는 카드가 유효한지 확인
      if (loc.type === 'freecell' && !freecells[loc.index]) return;
      if (loc.type === 'tableau') {
        const col = tableaus[loc.colIndex];
        const selectedCards = col.slice(loc.cardIndex);
        if (!isValidSequence(selectedCards)) {
          setHintMessage('올바르게 정렬된 카드 뭉치만 선택할 수 있습니다.');
          return;
        }
      }
      setSelected(loc);
      setHintMessage('');
      return;
    }

    // 이미 다른 카드가 선택된 상태에서 타겟 위치 클릭
    // 1) 똑같은 카드 재클릭 -> 선택 해제
    if (selected.type === loc.type) {
      if (selected.type === 'freecell' && selected.index === (loc as any).index) {
        setSelected(null);
        return;
      }
      if (selected.type === 'tableau' && selected.colIndex === (loc as any).colIndex && selected.cardIndex === (loc as any).cardIndex) {
        setSelected(null);
        return;
      }
    }

    // 2) 선택된 카드를 클릭된 위치로 이동 시도
    if (loc.type === 'tableau') {
      const moved = moveToTableauCol(selected, loc.colIndex);
      if (!moved) {
        // 이동 실패 시 클릭한 새 카드로 선택 변경
        const col = tableaus[loc.colIndex];
        const selectedCards = col.slice(loc.cardIndex);
        if (isValidSequence(selectedCards)) {
          setSelected(loc);
        } else {
          setSelected(null);
        }
      }
    } else if (loc.type === 'freecell') {
      const moved = moveToFreecell(selected, loc.index);
      if (!moved) setSelected(null);
    }
  };

  // 더블 클릭 또는 원터치 자동 이동 시도
  const handleAutoMoveCard = (loc: SelectedCardLocation) => {
    let card: Card | null = null;
    if (loc.type === 'freecell') {
      card = freecells[loc.index];
    } else {
      const col = tableaus[loc.colIndex];
      if (loc.cardIndex === col.length - 1) {
        card = col[col.length - 1];
      }
    }

    if (!card) return;

    // 1. Try foundation
    const foundationStack = foundations[card.suit];
    if (card.rank === foundationStack.length + 1) {
      moveToFoundation(loc, card.suit);
      return;
    }

    // 2. Try tableau
    for (let colIdx = 0; colIdx < 8; colIdx++) {
      if (loc.type === 'tableau' && loc.colIndex === colIdx) continue;
      const targetCol = tableaus[colIdx];
      if (targetCol.length > 0) {
        const topCard = targetCol[targetCol.length - 1];
        if (card.color !== topCard.color && card.rank === topCard.rank - 1) {
          moveToTableauCol(loc, colIdx);
          return;
        }
      }
    }

    // 3. Try empty freecell (only single top card)
    const emptyFreecellIdx = freecells.findIndex(c => c === null);
    if (emptyFreecellIdx !== -1) {
      moveToFreecell(loc, emptyFreecellIdx);
      return;
    }

    // 4. Try empty tableau col
    const emptyTableauIdx = tableaus.findIndex(col => col.length === 0);
    if (emptyTableauIdx !== -1 && (loc.type === 'freecell' || loc.cardIndex < tableaus[loc.colIndex].length - 1)) {
      moveToTableauCol(loc, emptyTableauIdx);
      return;
    }
  };

  // 힌트 찾기
  const findHint = () => {
    // 1. Check if any card can go to Foundation
    for (let i = 0; i < 4; i++) {
      const c = freecells[i];
      if (c && c.rank === foundations[c.suit].length + 1) {
        setHintMessage(`프리셀의 ${c.rank} ${c.suit} 카드를 홈셀로 올릴 수 있습니다.`);
        return;
      }
    }

    for (let col = 0; col < 8; col++) {
      const column = tableaus[col];
      if (column.length > 0) {
        const c = column[column.length - 1];
        if (c.rank === foundations[c.suit].length + 1) {
          setHintMessage(`${col + 1}번 열의 ${c.rank} 카드를 홈셀로 올릴 수 있습니다.`);
          return;
        }
      }
    }

    setHintMessage('가능한 이동을 탐색 중입니다. 카드를 클릭하여 팁을 확인해 보세요.');
  };

  return {
    gameSeed,
    freecells,
    foundations,
    tableaus,
    selected,
    moveCount,
    timeSeconds,
    isWon,
    isPaused,
    hintMessage,
    historyLength: history.length,
    isLoading,
    setIsPaused,
    initGame,
    undo,
    handleCardClick,
    handleAutoMoveCard,
    moveToFreecell,
    moveToFoundation,
    moveToTableauCol,
    tryAutoFoundation,
    findHint,
    setSelected
  };
}
