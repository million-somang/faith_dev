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

  // 이동 가능한 최대 카드 수 계산 (클래식 프리셀 Supermove 공식)
  const getMaxMovableCards = useCallback((isDestinationEmptyCol: boolean) => {
    const emptyFreecells = freecells.filter(c => c === null).length;
    const emptyTableaus = tableaus.filter(col => col.length === 0).length;
    const effectiveEmptyTableaus = isDestinationEmptyCol ? Math.max(0, emptyTableaus - 1) : emptyTableaus;

    return (1 + emptyFreecells) * Math.pow(2, effectiveEmptyTableaus);
  }, [freecells, tableaus]);

  // 연속된 카드 뭉치가 올바른 내림차순/색상교대 정렬인지 체크
  const isValidSequence = (cards: Card[]) => {
    if (cards.length === 0) return false;
    for (let i = 0; i < cards.length - 1; i++) {
      const top = cards[i];
      const next = cards[i + 1];
      if (top.color === next.color || top.rank !== next.rank + 1) {
        return false;
      }
    }
    return true;
  };

  // 특정 열(col)에서 끝부분의 가장 긴 유효 연속 시퀀스의 시작 인덱스를 구하는 헬퍼
  const getLongestValidSequenceStartIndex = (cards: Card[]): number => {
    if (cards.length <= 1) return 0;
    let start = cards.length - 1;
    while (start > 0) {
      const prev = cards[start - 1];
      const curr = cards[start];
      if (prev.color !== curr.color && prev.rank === curr.rank + 1) {
        start--;
      } else {
        break;
      }
    }
    return start;
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
      if (loc.cardIndex !== col.length - 1) {
        setHintMessage('프리셀에는 카드 1장만 보관할 수 있습니다.');
        return false;
      }
      cardToMove = col.pop() || null;
    }

    if (!cardToMove) return false;

    saveHistory();
    newFreecells[freecellIndex] = cardToMove;
    setFreecells(newFreecells);
    setTableaus(newTableaus);
    setSelected(null);
    setMoveCount(m => m + 1);
    setHintMessage('');
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
    setHintMessage('');
    return true;
  };

  // 테이블로 열로 이동 (스마트 서브시퀀스 매칭 및 수퍼무브)
  const moveToTableauCol = (loc: SelectedCardLocation, targetColIndex: number): boolean => {
    const newTableaus = tableaus.map(col => [...col]);
    const newFreecells = [...freecells];
    const targetCol = newTableaus[targetColIndex];
    const isTargetEmpty = targetCol.length === 0;
    const maxMovable = getMaxMovableCards(isTargetEmpty);

    let movingCards: Card[] = [];
    let fromColIndex = -1;
    let fromCardIndex = -1;

    if (loc.type === 'freecell') {
      const card = newFreecells[loc.index];
      if (!card) return false;
      if (!isTargetEmpty) {
        const targetTopCard = targetCol[targetCol.length - 1];
        if (card.color === targetTopCard.color || card.rank !== targetTopCard.rank - 1) {
          setHintMessage(`카드는 다른 색상이고 1 작은 숫자(${targetTopCard.rank - 1})만 올릴 수 있습니다.`);
          return false;
        }
      }
      movingCards = [card];
    } else {
      if (loc.colIndex === targetColIndex) return false;
      fromColIndex = loc.colIndex;
      const srcCol = newTableaus[fromColIndex];
      if (srcCol.length === 0) return false;

      if (isTargetEmpty) {
        // 목적지가 빈 열인 경우: 클릭한 카드부터의 묶음이 유효한지 확인
        let sliceIdx = loc.cardIndex;
        let testSlice = srcCol.slice(sliceIdx);
        if (!isValidSequence(testSlice)) {
          sliceIdx = getLongestValidSequenceStartIndex(srcCol);
          testSlice = srcCol.slice(sliceIdx);
        }

        // 최대 이동 가능 한도 내로 맞춤
        if (testSlice.length > maxMovable) {
          sliceIdx = srcCol.length - maxMovable;
          testSlice = srcCol.slice(sliceIdx);
        }

        if (testSlice.length === 0 || !isValidSequence(testSlice)) {
          setHintMessage(`빈 열로 이동할 수 있는 유효한 카드 묶음이 없습니다.`);
          return false;
        }

        fromCardIndex = sliceIdx;
        movingCards = testSlice;
      } else {
        // 목적지에 카드가 있는 경우: targetCol의 맨 위 카드와 매칭되는 묶음 검색
        const targetTopCard = targetCol[targetCol.length - 1];
        const matchRank = targetTopCard.rank - 1;
        const matchColor = targetTopCard.color === 'red' ? 'black' : 'red';

        // 1) srcCol에서 타겟 카드와 완벽하게 연결되는 유효 시퀀스 찾기
        const longestIdx = getLongestValidSequenceStartIndex(srcCol);
        const matchIdx = srcCol.findIndex((c, i) => i >= longestIdx && c.rank === matchRank && c.color === matchColor);

        if (matchIdx !== -1) {
          const sliceToMove = srcCol.slice(matchIdx);
          if (isValidSequence(sliceToMove)) {
            if (sliceToMove.length > maxMovable) {
              const emptyF = freecells.filter(c => c === null).length;
              const emptyT = tableaus.filter(c => c.length === 0).length;
              setHintMessage(`빈 프리셀(${emptyF}개)/빈 열(${emptyT}개) 부족으로 최대 ${maxMovable}장까지만 이동 가능합니다 (필요: ${sliceToMove.length}장).`);
              return false;
            }
            fromCardIndex = matchIdx;
            movingCards = sliceToMove;
          }
        }

        // 2) 사용자가 직접 선택한 특정 카드부터의 시퀀스 이동 검사
        if (movingCards.length === 0) {
          const userSlice = srcCol.slice(loc.cardIndex);
          if (userSlice.length > 0 && isValidSequence(userSlice)) {
            const bottomCard = userSlice[0];
            if (bottomCard.color !== targetTopCard.color && bottomCard.rank === targetTopCard.rank - 1) {
              if (userSlice.length > maxMovable) {
                const emptyF = freecells.filter(c => c === null).length;
                const emptyT = tableaus.filter(c => c.length === 0).length;
                setHintMessage(`빈 프리셀(${emptyF}개)/빈 열(${emptyT}개) 부족으로 최대 ${maxMovable}장까지만 이동 가능합니다.`);
                return false;
              }
              fromCardIndex = loc.cardIndex;
              movingCards = userSlice;
            }
          }
        }

        if (movingCards.length === 0) {
          setHintMessage(`카드는 다른 색상이고 1 작은 숫자(${matchRank})만 올릴 수 있습니다.`);
          return false;
        }
      }
    }

    if (movingCards.length === 0) return false;

    saveHistory();
    if (loc.type === 'freecell') {
      newFreecells[loc.index] = null;
    } else {
      newTableaus[fromColIndex] = newTableaus[fromColIndex].slice(0, fromCardIndex);
    }

    newTableaus[targetColIndex] = [...targetCol, ...movingCards];

    setFreecells(newFreecells);
    setTableaus(newTableaus);
    setSelected(null);
    setMoveCount(m => m + 1);
    setHintMessage('');
    return true;
  };

  // 원클릭/스마트 카드 클릭 처리
  const handleCardClick = (loc: SelectedCardLocation) => {
    if (isWon) return;

    // 1) 아직 선택된 카드가 없는 경우
    if (!selected) {
      if (loc.type === 'freecell') {
        if (!freecells[loc.index]) return;
        setSelected(loc);
        setHintMessage('');
      } else {
        const col = tableaus[loc.colIndex];
        if (col.length === 0) return;
        
        const selectedCards = col.slice(loc.cardIndex);
        if (isValidSequence(selectedCards)) {
          setSelected(loc);
          setHintMessage('');
        } else {
          const longestIdx = getLongestValidSequenceStartIndex(col);
          setSelected({ type: 'tableau', colIndex: loc.colIndex, cardIndex: longestIdx });
          setHintMessage('연속으로 정렬된 카드 뭉치가 선택되었습니다.');
        }
      }
      return;
    }

    // 2) 이미 카드가 선택되어 있는 경우
    // 2-1) 같은 카드 또는 같은 열 재클릭 -> 선택 해제 또는 범위 조정
    if (selected.type === loc.type) {
      if (selected.type === 'freecell' && selected.index === (loc as any).index) {
        setSelected(null);
        return;
      }
      if (selected.type === 'tableau' && selected.colIndex === (loc as any).colIndex) {
        if (selected.cardIndex === (loc as any).cardIndex) {
          setSelected(null);
          return;
        } else {
          const col = tableaus[loc.colIndex];
          const selectedCards = col.slice(loc.cardIndex);
          if (isValidSequence(selectedCards)) {
            setSelected(loc);
          } else {
            const longestIdx = getLongestValidSequenceStartIndex(col);
            setSelected({ type: 'tableau', colIndex: loc.colIndex, cardIndex: longestIdx });
          }
          return;
        }
      }
    }

    // 2-2) 다른 위치로 이동 시도
    if (loc.type === 'tableau') {
      const moved = moveToTableauCol(selected, loc.colIndex);
      if (!moved) {
        const col = tableaus[loc.colIndex];
        if (col.length > 0) {
          const selectedCards = col.slice(loc.cardIndex);
          if (isValidSequence(selectedCards)) {
            setSelected(loc);
          } else {
            const longestIdx = getLongestValidSequenceStartIndex(col);
            setSelected({ type: 'tableau', colIndex: loc.colIndex, cardIndex: longestIdx });
          }
        } else {
          setSelected(null);
        }
      }
    } else if (loc.type === 'freecell') {
      const moved = moveToFreecell(selected, loc.index);
      if (!moved) {
        if (freecells[loc.index]) {
          setSelected(loc);
        } else {
          setSelected(null);
        }
      }
    }
  };

  // 더블 클릭 또는 원터치 자동 이동 시도 (모든 시퀀스 대응)
  const handleAutoMoveCard = (loc: SelectedCardLocation) => {
    if (isWon) return;

    if (loc.type === 'freecell') {
      const card = freecells[loc.index];
      if (!card) return;

      // 1. Try foundation
      const foundationStack = foundations[card.suit];
      if (card.rank === foundationStack.length + 1) {
        moveToFoundation(loc, card.suit);
        return;
      }

      // 2. Try tableau
      for (let colIdx = 0; colIdx < 8; colIdx++) {
        const targetCol = tableaus[colIdx];
        if (targetCol.length > 0) {
          const topCard = targetCol[targetCol.length - 1];
          if (card.color !== topCard.color && card.rank === topCard.rank - 1) {
            if (moveToTableauCol(loc, colIdx)) return;
          }
        }
      }

      // 3. Try empty tableau
      const emptyTableauIdx = tableaus.findIndex(col => col.length === 0);
      if (emptyTableauIdx !== -1) {
        moveToTableauCol(loc, emptyTableauIdx);
        return;
      }
      return;
    }

    // loc.type === 'tableau'
    const col = tableaus[loc.colIndex];
    if (col.length === 0) return;

    const isTopCard = loc.cardIndex === col.length - 1;
    const topCard = col[col.length - 1];

    // 1. 맨 끝 1장이면 홈셀(Foundation) 먼저 확인
    if (isTopCard) {
      const foundationStack = foundations[topCard.suit];
      if (topCard.rank === foundationStack.length + 1) {
        moveToFoundation(loc, topCard.suit);
        return;
      }
    }

    // 2. 카드 또는 시퀀스를 다른 테이블로 열로 이동 시도
    const sliceFromClick = col.slice(loc.cardIndex);
    const validFromClick = isValidSequence(sliceFromClick);

    const longestSeqIdx = getLongestValidSequenceStartIndex(col);
    const longestSlice = col.slice(longestSeqIdx);

    const targetLoc = validFromClick ? loc : { type: 'tableau' as const, colIndex: loc.colIndex, cardIndex: longestSeqIdx };
    const movingLeadCard = validFromClick ? sliceFromClick[0] : longestSlice[0];

    // 비어있지 않은 다른 7개 열로 붙여보기
    for (let targetColIdx = 0; targetColIdx < 8; targetColIdx++) {
      if (targetColIdx === loc.colIndex) continue;
      const targetCol = tableaus[targetColIdx];
      if (targetCol.length > 0) {
        const targetTop = targetCol[targetCol.length - 1];
        if (movingLeadCard.color !== targetTop.color && movingLeadCard.rank === targetTop.rank - 1) {
          if (moveToTableauCol(targetLoc, targetColIdx)) return;
        }
      }
    }

    // 3. 맨 끝 1장이고 프리셀에 자리가 있으면 프리셀로 이동
    if (isTopCard) {
      const emptyFreecellIdx = freecells.findIndex(c => c === null);
      if (emptyFreecellIdx !== -1) {
        moveToFreecell(loc, emptyFreecellIdx);
        return;
      }
    }

    // 4. 빈 열이 있으면 빈 열로 이동 시도
    const emptyTableauIdx = tableaus.findIndex(c => c.length === 0);
    if (emptyTableauIdx !== -1 && emptyTableauIdx !== loc.colIndex) {
      if (validFromClick && loc.cardIndex > 0) {
        if (moveToTableauCol(loc, emptyTableauIdx)) return;
      } else if (longestSeqIdx > 0) {
        if (moveToTableauCol({ type: 'tableau', colIndex: loc.colIndex, cardIndex: longestSeqIdx }, emptyTableauIdx)) return;
      }
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
