import { useState, useEffect, useRef, useCallback } from 'react';
import { soundManager } from '../utils/audio';

export const BOARD_SIZE = 8;
export const MAX_COLORS = 5;
export const GAME_DURATION = 60; // 스테이지당 60초 타임어택

export type GemType = 0 | 1 | 2 | 3 | 4; // 5가지 기본 색상
export type SpecialType = 'none' | 'laser_h' | 'laser_v' | 'rainbow';

// 스테이지별 목표 점수 계산 (완만한 난이도 곡선)
export const getTargetScore = (stage: number): number => {
    if (stage === 1) return 4500;
    if (stage === 2) return 7500;
    if (stage === 3) return 11000;
    if (stage === 4) return 15000;
    return Math.round(15000 + (stage - 4) * 4500);
};

// 스테이지별 보석 색상 수 (1~2스테이지: 4색, 3스테이지+: 5색)
export const getNumColorsForStage = (stage: number): number => {
    return stage <= 2 ? 4 : 5;
};

export interface EffectEvent {
    id: string;
    type: 'pop' | 'laser_h' | 'laser_v' | 'rainbow' | 'score';
    r: number;
    c: number;
    gemType?: GemType;
    score?: number;
    combo?: number;
}

export interface StageClearEvent {
    stage: number;
    bonus: number;
    nextTarget: number;
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
const createGem = (row: number, col: number, type?: GemType, special: SpecialType = 'none', isNew: boolean = false, numColors: number = 5): Gem => ({
    id: `gem_${nextId++}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    type: type !== undefined ? type : (Math.floor(Math.random() * numColors) as GemType),
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
    const [stage, setStage] = useState(1);
    const [stageScore, setStageScore] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [targetScore, setTargetScore] = useState(getTargetScore(1));
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [feverGauge, setFeverGauge] = useState(0);
    const [isFever, setIsFever] = useState(false);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedGem, setSelectedGem] = useState<{ r: number; c: number } | null>(null);
    const [effects, setEffects] = useState<EffectEvent[]>([]);
    const [stageClearEvent, setStageClearEvent] = useState<StageClearEvent | null>(null);

    const lastMatchTimeRef = useRef<number>(0);
    const feverTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isGameOverRef = useRef<boolean>(false);
    const isFeverRef = useRef<boolean>(false);
    const stageRef = useRef<number>(1);
    const timeLeftRef = useRef<number>(GAME_DURATION);
    const stageScoreRef = useRef<number>(0);
    const targetScoreRef = useRef<number>(getTargetScore(1));

    isFeverRef.current = isFever;
    isGameOverRef.current = isGameOver;
    stageRef.current = stage;
    timeLeftRef.current = timeLeft;
    stageScoreRef.current = stageScore;
    targetScoreRef.current = targetScore;

    // 1. 초기 무매칭 8x8 보드 생성 (현재 스테이지 난이도 반영)
    const initBoard = useCallback((curStage: number = 1) => {
        const numColors = getNumColorsForStage(curStage);
        const newBoard: Gem[][] = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            newBoard[r] = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                let type: GemType;
                do {
                    type = Math.floor(Math.random() * numColors) as GemType;
                } while (
                    (c >= 2 && newBoard[r][c - 1].type === type && newBoard[r][c - 2].type === type) ||
                    (r >= 2 && newBoard[r - 1][c].type === type && newBoard[r - 2][c].type === type)
                );
                newBoard[r][c] = createGem(r, c, type, 'none', false, numColors);
            }
        }
        return newBoard;
    }, []);

    // 새 게임 시작 (Stage 1부터 초기화)
    const startNewGame = useCallback(() => {
        if (feverTimerRef.current) clearTimeout(feverTimerRef.current);

        setBoard(initBoard(1));
        setStage(1);
        setStageScore(0);
        setTotalScore(0);
        setTargetScore(getTargetScore(1));
        setCombo(0);
        setMaxCombo(0);
        setFeverGauge(0);
        setIsFever(false);
        setTimeLeft(GAME_DURATION);
        setIsGameOver(false);
        setIsProcessing(false);
        setSelectedGem(null);
        setEffects([]);
        setStageClearEvent(null);

        stageRef.current = 1;
        stageScoreRef.current = 0;
        targetScoreRef.current = getTargetScore(1);
        timeLeftRef.current = GAME_DURATION;
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

    // 연쇄 폭발 및 드롭 처리 (스테이지 클리어 및 점수 합산 동기화)
    const processMatches = useCallback(async (initialBoard: Gem[][]) => {
        setIsProcessing(true);
        let currentBoard = initialBoard.map(row => [...row]);
        let cascadeCombo = 0;

        while (true) {
            const { matches, matchGroups } = findMatches(currentBoard);
            if (matches.length === 0) break;

            const now = Date.now();
            let currentCombo = 1;
            if (now - lastMatchTimeRef.current < 2600) {
                currentCombo = combo + 1 + cascadeCombo;
            }
            lastMatchTimeRef.current = now;
            setCombo(currentCombo);
            setMaxCombo(m => Math.max(m, currentCombo));

            soundManager.playPop(currentCombo);

            const newSpecialsToSpawn: { r: number; c: number; type: GemType; special: SpecialType }[] = [];
            const destroyedMap = new Map<string, { r: number; c: number; type: GemType }>();

            matchGroups.forEach(group => {
                const centerGem = group[Math.floor(group.length / 2)];
                if (group.length === 4) {
                    const isHorizontal = group[0].r === group[1].r;
                    newSpecialsToSpawn.push({
                        r: centerGem.r,
                        c: centerGem.c,
                        type: centerGem.type,
                        special: isHorizontal ? 'laser_h' : 'laser_v',
                    });
                } else if (group.length >= 5) {
                    newSpecialsToSpawn.push({
                        r: centerGem.r,
                        c: centerGem.c,
                        type: centerGem.type,
                        special: 'rainbow',
                    });
                }

                group.forEach(g => {
                    destroyedMap.set(`${g.r},${g.c}`, g);
                });
            });

            const baseScore = destroyedMap.size * 100;
            const comboBonus = Math.floor(baseScore * (currentCombo * 0.2));
            const feverMultiplier = isFeverRef.current ? 2 : 1;
            const addedScore = (baseScore + comboBonus) * feverMultiplier;

            setFeverGauge(prev => {
                const next = Math.min(100, prev + 12);
                if (next >= 100 && !isFeverRef.current) {
                    triggerFever();
                }
                return next;
            });

            setTotalScore(t => t + addedScore);
            setStageScore(prev => {
                const newScore = prev + addedScore;
                const curTarget = targetScoreRef.current;
                const curStage = stageRef.current;

                if (newScore >= curTarget && !isGameOverRef.current) {
                    const nextStage = curStage + 1;
                    const nextTarget = getTargetScore(nextStage);
                    const timeBonus = timeLeftRef.current * 50;

                    setTotalScore(tot => tot + timeBonus);
                    setStage(nextStage);
                    setTargetScore(nextTarget);
                    setTimeLeft(GAME_DURATION);
                    soundManager.playRainbow();

                    setStageClearEvent({
                        stage: nextStage,
                        bonus: timeBonus,
                        nextTarget,
                    });

                    stageRef.current = nextStage;
                    targetScoreRef.current = nextTarget;
                    return 0;
                }
                return newScore;
            });

            const breakingBoard = currentBoard.map(row => row.map(g => ({ ...g })));
            const newEffects: EffectEvent[] = [];

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
                newEffects.push({
                    id: `score_${Date.now()}_${Math.random()}`,
                    type: 'score',
                    r: Math.round(sumR / destroyedMap.size),
                    c: Math.round(sumC / destroyedMap.size),
                    score: addedScore,
                    combo: currentCombo,
                });
            }

            setEffects(prev => [...prev.slice(-30), ...newEffects]);
            setBoard(breakingBoard);

            await new Promise(res => setTimeout(res, 220));

            const droppedBoard: Gem[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
            const curNumColors = getNumColorsForStage(stageRef.current);

            for (let c = 0; c < BOARD_SIZE; c++) {
                const survivors: Gem[] = [];
                for (let r = BOARD_SIZE - 1; r >= 0; r--) {
                    if (!destroyedMap.has(`${r},${c}`)) {
                        survivors.push(currentBoard[r][c]);
                    }
                }

                let targetRow = BOARD_SIZE - 1;
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

                while (targetRow >= 0) {
                    droppedBoard[targetRow][c] = createGem(targetRow, c, undefined, 'none', true, curNumColors);
                    targetRow--;
                }
            }

            newSpecialsToSpawn.forEach(sp => {
                droppedBoard[sp.r][sp.c] = createGem(sp.r, sp.c, sp.type, sp.special, true, curNumColors);
            });

            currentBoard = droppedBoard;
            setBoard(currentBoard);
            cascadeCombo++;

            await new Promise(res => setTimeout(res, 260));
        }

        setIsProcessing(false);
    }, [findMatches, triggerFever, combo]);

    // 보석 스왑 처리 (애니메이션 동기화)
    const swapGems = useCallback(async (r1: number, c1: number, r2: number, c2: number) => {
        if (isProcessing || isGameOver) return;
        setIsProcessing(true);

        const g1 = board[r1][c1];
        const g2 = board[r2][c2];

        if (g1.special !== 'none' || g2.special !== 'none') {
            soundManager.playSwap();
            const tempBoard = board.map(r => [...r]);

            if ((g1.special === 'laser_h' || g1.special === 'laser_v') && (g2.special === 'laser_h' || g2.special === 'laser_v')) {
                soundManager.playLaser();
                const laserEffects: EffectEvent[] = [
                    { id: `lh_${r1}_${Date.now()}`, type: 'laser_h', r: r1, c: c1 },
                    { id: `lv_${c1}_${Date.now()}`, type: 'laser_v', r: r1, c: c1 },
                ];
                setEffects(prev => [...prev.slice(-30), ...laserEffects]);

                for (let c = 0; c < BOARD_SIZE; c++) tempBoard[r1][c] = { ...tempBoard[r1][c], isMatched: true };
                for (let r = 0; r < BOARD_SIZE; r++) tempBoard[r][c1] = { ...tempBoard[r][c1], isMatched: true };
                setBoard(tempBoard);
                await new Promise(res => setTimeout(res, 220));
                await processMatches(tempBoard);
                return;
            }

            if (g1.special === 'rainbow' || g2.special === 'rainbow') {
                soundManager.playRainbow();
                const targetType = g1.special === 'rainbow' ? g2.type : g1.type;
                const rainbowEffects: EffectEvent[] = [
                    { id: `rb_${Date.now()}`, type: 'rainbow', r: r1, c: c1, gemType: targetType },
                ];
                setEffects(prev => [...prev.slice(-30), ...rainbowEffects]);

                for (let r = 0; r < BOARD_SIZE; r++) {
                    for (let c = 0; c < BOARD_SIZE; c++) {
                        if (tempBoard[r][c].type === targetType || (r === r1 && c === c1) || (r === r2 && c === c2)) {
                            tempBoard[r][c] = { ...tempBoard[r][c], isMatched: true };
                        }
                    }
                }
                setBoard(tempBoard);
                await new Promise(res => setTimeout(res, 220));
                await processMatches(tempBoard);
                return;
            }
        }

        soundManager.playSwap();
        const swappedBoard = board.map(row => [...row]);
        swappedBoard[r1][c1] = { ...g2, row: r1, col: c1 };
        swappedBoard[r2][c2] = { ...g1, row: r2, col: c2 };

        setBoard(swappedBoard);
        await new Promise(res => setTimeout(res, 200));

        const { matches } = findMatches(swappedBoard);
        if (matches.length > 0) {
            await processMatches(swappedBoard);
        } else {
            setBoard(board);
            await new Promise(res => setTimeout(res, 200));
            setIsProcessing(false);
        }
    }, [board, isProcessing, isGameOver, findMatches, processMatches]);

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

    useEffect(() => {
        if (effects.length === 0) return;
        const timer = setTimeout(() => {
            setEffects([]);
        }, 800);
        return () => clearTimeout(timer);
    }, [effects]);

    // 스테이지 클리어 팝업 타이머
    useEffect(() => {
        if (!stageClearEvent) return;
        const timer = setTimeout(() => {
            setStageClearEvent(null);
        }, 1600);
        return () => clearTimeout(timer);
    }, [stageClearEvent]);

    // 초기 실행
    useEffect(() => {
        startNewGame();
    }, [startNewGame]);

    return {
        board,
        stage,
        stageScore,
        targetScore,
        totalScore,
        score: totalScore, // 하위 호환성 유지
        combo,
        maxCombo,
        feverGauge,
        isFever,
        timeLeft,
        isGameOver,
        isProcessing,
        selectedGem,
        effects,
        stageClearEvent,
        handleCellClick,
        swapGems,
        startNewGame,
    };
}


