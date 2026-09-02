import { useState, useEffect, useRef, useCallback } from 'react';
import { soundManager } from '../utils/audio';

export const BOARD_SIZE = 8;
export const NUM_COLORS = 5;
export const GAME_DURATION = 60; // 60초 타임어택

export type GemType = 0 | 1 | 2 | 3 | 4; // 5가지 기본 색상
export type SpecialType = 'none' | 'laser_h' | 'laser_v' | 'rainbow';

export interface EffectEvent {
    id: string;
    type: 'pop' | 'laser_h' | 'laser_v' | 'rainbow' | 'score';
    r: number;
    c: number;
    gemType?: GemType;
    score?: number;
    combo?: number;
}

export interface Gem {
    id: string;
    type: GemType;
    special: SpecialType;
    isMatched?: boolean;
    isNew?: boolean;
    row: number;
    col: number;
}

export const GEM_COLORS: Record<GemType, { name: string; hex: string; gradient: string; glow: string; particleColors: string[] }> = {
    0: { name: '사파이어 블루', hex: '#3B82F6', gradient: 'from-blue-400 to-blue-600', glow: 'rgba(59, 130, 246, 0.9)', particleColors: ['#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#FFFFFF', '#DBEAFE'] },
    1: { name: '에메랄드 그린', hex: '#10B981', gradient: 'from-emerald-400 to-emerald-600', glow: 'rgba(16, 185, 129, 0.9)', particleColors: ['#A7F3D0', '#34D399', '#10B981', '#059669', '#FFFFFF', '#D1FAE5'] },
    2: { name: '아메지스트 퍼플', hex: '#8B5CF6', gradient: 'from-purple-400 to-purple-600', glow: 'rgba(139, 92, 246, 0.9)', particleColors: ['#DDD6FE', '#A78BFA', '#8B5CF6', '#7C3AED', '#FFFFFF', '#EDE9FE'] },
    3: { name: '토파즈 옐로우', hex: '#F59E0B', gradient: 'from-amber-400 to-amber-600', glow: 'rgba(245, 158, 11, 0.9)', particleColors: ['#FDE68A', '#FBBF24', '#F59E0B', '#D97706', '#FFFFFF', '#FEF3C7'] },
    4: { name: '루비 레드', hex: '#EF4444', gradient: 'from-rose-400 to-red-600', glow: 'rgba(239, 68, 68, 0.9)', particleColors: ['#FECACA', '#F87171', '#EF4444', '#DC2626', '#FFFFFF', '#FEE2E2'] },
};

let nextId = 1;
const createGem = (row: number, col: number, type?: GemType, special: SpecialType = 'none', isNew: boolean = false): Gem => ({
    id: `gem_${nextId++}_${Date.now().toString(36)}`,
    type: type !== undefined ? type : (Math.floor(Math.random() * NUM_COLORS) as GemType),
    special,
    row,
    col,
    isMatched: false,
    isNew,
});

interface EngineOptions {
    isActive?: boolean;
}

export function useVeraPopEngine(options: EngineOptions = { isActive: true }) {
    const { isActive = true } = options;
    const [board, setBoard] = useState<Gem[][]>([]);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [feverGauge, setFeverGauge] = useState(0);
    const [isFever, setIsFever] = useState(false);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedGem, setSelectedGem] = useState<{ r: number; c: number } | null>(null);
    const [effects, setEffects] = useState<EffectEvent[]>([]);

    const lastMatchTimeRef = useRef<number>(0);
    const feverTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isGameOverRef = useRef<boolean>(false);
    const isFeverRef = useRef<boolean>(false);
    isFeverRef.current = isFever;
    isGameOverRef.current = isGameOver;

    // 1. 초기 무매칭 8x8 보드 생성
    const initBoard = useCallback(() => {
        const newBoard: Gem[][] = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            newBoard[r] = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                let type: GemType;
                do {
                    type = Math.floor(Math.random() * NUM_COLORS) as GemType;
                } while (
                    (c >= 2 && newBoard[r][c - 1].type === type && newBoard[r][c - 2].type === type) ||
                    (r >= 2 && newBoard[r - 1][c].type === type && newBoard[r - 2][c].type === type)
                );
                newBoard[r][c] = createGem(r, c, type);
            }
        }
        return newBoard;
    }, []);

    // 새 게임 시작
    const startNewGame = useCallback(() => {
        if (feverTimerRef.current) clearTimeout(feverTimerRef.current);

        setBoard(initBoard());
        setScore(0);
        setCombo(0);
        setMaxCombo(0);
        setFeverGauge(0);
        setIsFever(false);
        setTimeLeft(GAME_DURATION);
        setIsGameOver(false);
        setIsProcessing(false);
        setSelectedGem(null);
        setEffects([]);
        isGameOverRef.current = false;
        lastMatchTimeRef.current = Date.now();
    }, [initBoard]);

    // 60초 타이머
    useEffect(() => {
        if (!isActive || isGameOver) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsGameOver(true);
                    isGameOverRef.current = true;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, [isActive, isGameOver]);

    // 피버 모드 발동
    const triggerFever = useCallback(() => {
        setIsFever(true);
        soundManager.playFever();
        if (feverTimerRef.current) clearTimeout(feverTimerRef.current);
        feverTimerRef.current = setTimeout(() => {
            setIsFever(false);
            setFeverGauge(0);
        }, 5000);
    }, []);

    // 매칭 탐지 함수 (3개 이상 연속)
    const findMatches = useCallback((b: Gem[][]) => {
        const matches: { r: number; c: number }[] = [];
        const matchGroups: { r: number; c: number; type: GemType }[][] = [];

        // 가로 탐색
        for (let r = 0; r < BOARD_SIZE; r++) {
            let matchLen = 1;
            for (let c = 0; c < BOARD_SIZE; c++) {
                const isSame = c < BOARD_SIZE - 1 && b[r][c]?.type === b[r][c + 1]?.type;
                if (isSame) {
                    matchLen++;
                } else {
                    if (matchLen >= 3) {
                        const group: { r: number; c: number; type: GemType }[] = [];
                        for (let k = 0; k < matchLen; k++) {
                            const colIdx = c - k;
                            matches.push({ r, c: colIdx });
                            group.push({ r, c: colIdx, type: b[r][colIdx].type });
                        }
                        matchGroups.push(group);
                    }
                    matchLen = 1;
                }
            }
        }

        // 세로 탐색
        for (let c = 0; c < BOARD_SIZE; c++) {
            let matchLen = 1;
            for (let r = 0; r < BOARD_SIZE; r++) {
                const isSame = r < BOARD_SIZE - 1 && b[r][c]?.type === b[r + 1][c]?.type;
                if (isSame) {
                    matchLen++;
                } else {
                    if (matchLen >= 3) {
                        const group: { r: number; c: number; type: GemType }[] = [];
                        for (let k = 0; k < matchLen; k++) {
                            const rowIdx = r - k;
                            matches.push({ r: rowIdx, c });
                            group.push({ r: rowIdx, c, type: b[rowIdx][c].type });
                        }
                        matchGroups.push(group);
                    }
                    matchLen = 1;
                }
            }
        }

        return { matches, matchGroups };
    }, []);

    // 연쇄 폭발 및 드롭 처리 (깨짐 애니메이션 + 중력 낙하 트랜지션)
    const processMatches = useCallback(async (initialBoard: Gem[][]) => {
        setIsProcessing(true);
        let currentBoard = initialBoard.map(row => [...row]);
        let cascadeCombo = 1;

        while (!isGameOverRef.current) {
            const { matches, matchGroups } = findMatches(currentBoard);
            if (matches.length === 0) break;

            const destroyedMap = new Map<string, { r: number; c: number; type: GemType }>();
            const newSpecialsToSpawn: { r: number; c: number; type: GemType; special: SpecialType }[] = [];

            // 특수 젬 생성 판정 (4매치 = 레이저, 5매치/TL자 = 무지개 폭탄)
            matchGroups.forEach(group => {
                if (group.length === 4) {
                    const center = group[1] || group[0];
                    const isHorizontal = group[0].r === group[1].r;
                    newSpecialsToSpawn.push({
                        r: center.r,
                        c: center.c,
                        type: center.type,
                        special: isHorizontal ? 'laser_h' : 'laser_v'
                    });
                } else if (group.length >= 5) {
                    const center = group[2] || group[0];
                    newSpecialsToSpawn.push({
                        r: center.r,
                        c: center.c,
                        type: center.type,
                        special: 'rainbow'
                    });
                }
            });

            matches.forEach(({ r, c }) => {
                destroyedMap.set(`${r},${c}`, { r, c, type: currentBoard[r][c].type });
            });

            // 피버 모드일 때 3x3 스플래시 추가 파괴
            if (isFeverRef.current) {
                matches.forEach(({ r, c }) => {
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = r + dr;
                            const nc = c + dc;
                            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                                destroyedMap.set(`${nr},${nc}`, { r: nr, c: nc, type: currentBoard[nr][nc].type });
                            }
                        }
                    }
                });
            }

            // 점수 계산
            const feverMultiplier = isFeverRef.current ? 2 : 1;
            const addedScore = destroyedMap.size * 100 * cascadeCombo * feverMultiplier;

            // 사운드 재생
            soundManager.playPop(cascadeCombo);

            // 콤보 및 피버 게이지 갱신
            const now = Date.now();
            const timeDiff = now - lastMatchTimeRef.current;
            lastMatchTimeRef.current = now;

            let currentCombo = cascadeCombo;
            setCombo(prev => {
                const next = timeDiff < 2200 ? prev + 1 : 1;
                currentCombo = next;
                setMaxCombo(m => Math.max(m, next));
                return next;
            });

            setFeverGauge(prev => {
                const next = Math.min(100, prev + 12);
                if (next >= 100 && !isFeverRef.current) {
                    triggerFever();
                }
                return next;
            });

            setScore(s => s + addedScore);

            // 💥 1단계: 매칭된 보석 깨짐(isMatched) 상태 설정 및 파티클/스코어 이벤트 생성
            const breakingBoard = currentBoard.map(row => row.map(g => ({ ...g })));
            const newEffects: EffectEvent[] = [];

            // 각 파괴 위치에 파티클 및 중앙 대표 위치에 점수 팝업 추가
            let sumR = 0;
            let sumC = 0;
            destroyedMap.forEach(({ r, c, type }) => {
                breakingBoard[r][c].isMatched = true;
                sumR += r;
                sumC += c;
                newEffects.push({
                    id: `pop_${r}_${c}_${Date.now()}_${Math.random()}`,
                    type: 'pop',
                    r,
                    c,
                    gemType: type,
                });
            });

            if (destroyedMap.size > 0) {
                const avgR = Math.round(sumR / destroyedMap.size);
                const avgC = Math.round(sumC / destroyedMap.size);
                newEffects.push({
                    id: `score_${Date.now()}_${Math.random()}`,
                    type: 'score',
                    r: avgR,
                    c: avgC,
                    score: addedScore,
                    combo: currentCombo,
                });
            }

            setEffects(prev => [...prev, ...newEffects]);
            setBoard(breakingBoard);

            // ⏱️ 4조각 파쇄(Shatter) 및 쇼크웨이브 연출 대기 (320ms)
            await new Promise(res => setTimeout(res, 320));

            // ⬇️ 2단계: 파괴된 셀 제거 및 상단 보석 중력 드롭 + 새 보석 스폰
            const droppedBoard: Gem[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

            for (let c = 0; c < BOARD_SIZE; c++) {
                const survivors: Gem[] = [];
                for (let r = BOARD_SIZE - 1; r >= 0; r--) {
                    if (!destroyedMap.has(`${r},${c}`)) {
                        survivors.push(currentBoard[r][c]);
                    }
                }

                let targetRow = BOARD_SIZE - 1;
                // 살아남은 보석들: id를 유지하며 새 row를 부여 (CSS top transition 발동!)
                survivors.forEach(g => {
                    droppedBoard[targetRow][c] = {
                        ...g,
                        row: targetRow,
                        col: c,
                        isMatched: false,
                        isNew: false,
                    };
                    targetRow--;
                });

                // 빈 위쪽 공간에 새 보석 생성 (isNew: true로 상단 젤리 스쿼시 낙하 모션)
                while (targetRow >= 0) {
                    droppedBoard[targetRow][c] = createGem(targetRow, c, undefined, 'none', true);
                    targetRow--;
                }
            }

            // 새로 생성된 특수 젬 배치
            newSpecialsToSpawn.forEach(sp => {
                droppedBoard[sp.r][sp.c] = createGem(sp.r, sp.c, sp.type, sp.special, true);
            });

            currentBoard = droppedBoard;
            setBoard(currentBoard);
            cascadeCombo++;

            // ⏱️ 젤리 착지 스쿼시 & 바운스 안정화 대기 (380ms)
            await new Promise(res => setTimeout(res, 380));
        }

        setIsProcessing(false);
    }, [findMatches, triggerFever]);

    // 보석 스왑 처리 (애니메이션 동기화)
    const swapGems = useCallback(async (r1: number, c1: number, r2: number, c2: number) => {
        if (isProcessing || isGameOver) return;
        setIsProcessing(true);

        const g1 = board[r1][c1];
        const g2 = board[r2][c2];

        // 1. 특수 젬 교차 조합 처리
        if (g1.special !== 'none' || g2.special !== 'none') {
            soundManager.playSwap();
            const tempBoard = board.map(r => [...r]);

            // [라인] + [라인] ➔ 십자 전체 삭제
            if ((g1.special === 'laser_h' || g1.special === 'laser_v') && (g2.special === 'laser_h' || g2.special === 'laser_v')) {
                soundManager.playLaser();
                const laserEffects: EffectEvent[] = [
                    { id: `lh_${r1}_${Date.now()}`, type: 'laser_h', r: r1, c: c1 },
                    { id: `lv_${c1}_${Date.now()}`, type: 'laser_v', r: r1, c: c1 },
                ];
                setEffects(prev => [...prev, ...laserEffects]);

                for (let c = 0; c < BOARD_SIZE; c++) tempBoard[r1][c] = { ...tempBoard[r1][c], isMatched: true };
                for (let r = 0; r < BOARD_SIZE; r++) tempBoard[r][c1] = { ...tempBoard[r][c1], isMatched: true };
                setBoard(tempBoard);
                await new Promise(res => setTimeout(res, 300));
                await processMatches(tempBoard);
                return;
            }

            // [무지개] + [라인/기본] ➔ 해당 색상 전체 폭파
            if (g1.special === 'rainbow' || g2.special === 'rainbow') {
                soundManager.playRainbow();
                const targetType = g1.special === 'rainbow' ? g2.type : g1.type;
                const rainbowEffects: EffectEvent[] = [
                    { id: `rb_${Date.now()}`, type: 'rainbow', r: r1, c: c1, gemType: targetType },
                ];
                setEffects(prev => [...prev, ...rainbowEffects]);

                for (let r = 0; r < BOARD_SIZE; r++) {
                    for (let c = 0; c < BOARD_SIZE; c++) {
                        if (tempBoard[r][c].type === targetType || (r === r1 && c === c1) || (r === r2 && c === c2)) {
                            tempBoard[r][c] = { ...tempBoard[r][c], isMatched: true };
                        }
                    }
                }
                setBoard(tempBoard);
                await new Promise(res => setTimeout(res, 300));
                await processMatches(tempBoard);
                return;
            }
        }

        // 2. 일반 스왑 애니메이션 (두 보석의 row/col을 맞바꿔 렌더링)
        soundManager.playSwap();
        const swappedBoard = board.map(row => [...row]);
        swappedBoard[r1][c1] = { ...g2, row: r1, col: c1 };
        swappedBoard[r2][c2] = { ...g1, row: r2, col: c2 };

        setBoard(swappedBoard);

        // ⏱️ 스와프 슬라이딩 애니메이션 시간(220ms) 대기
        await new Promise(res => setTimeout(res, 220));

        const { matches } = findMatches(swappedBoard);

        if (matches.length > 0) {
            await processMatches(swappedBoard);
        } else {
            // 매칭 실패 시 원위치로 부드럽게 되돌리기
            setBoard(board);
            await new Promise(res => setTimeout(res, 220));
            setIsProcessing(false);
        }
    }, [board, isProcessing, isGameOver, findMatches, processMatches]);

    // 셀 클릭/터치 조작
    const handleCellClick = useCallback((r: number, c: number) => {
        if (isProcessing || isGameOver) return;

        if (!selectedGem) {
            setSelectedGem({ r, c });
        } else {
            const { r: r1, c: c1 } = selectedGem;
            const dist = Math.abs(r1 - r) + Math.abs(c1 - c);
            if (dist === 1) {
                swapGems(r1, c1, r, c);
                setSelectedGem(null);
            } else {
                setSelectedGem({ r, c });
            }
        }
    }, [isProcessing, isGameOver, selectedGem, swapGems]);

    // 오래된 이펙트 자동 정리
    useEffect(() => {
        if (effects.length === 0) return;
        const timer = setTimeout(() => {
            setEffects([]);
        }, 800);
        return () => clearTimeout(timer);
    }, [effects]);

    // 초기 실행
    useEffect(() => {
        startNewGame();
    }, [startNewGame]);

    return {
        board,
        score,
        combo,
        maxCombo,
        feverGauge,
        isFever,
        timeLeft,
        isGameOver,
        isProcessing,
        selectedGem,
        effects,
        handleCellClick,
        swapGems,
        startNewGame,
    };
}

