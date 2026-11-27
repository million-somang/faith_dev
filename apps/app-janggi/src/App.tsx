import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Side,
  Piece,
  Position,
  GameMode,
  SetupType,
  Difficulty,
  SpecialSkill,
  ScoreBreakdown,
  SajuElementBuff,
  JanggiGameScoreDetails,
  JanggiRecordsMap,
  BoardTheme,
  AiEmotion,
  SoundSettings,
  JanggiPreferences,
  ComboBannerEvent,
  DEFAULT_JANGGI_PREFERENCES,
  createEmptyJanggiRecords,
} from './types/janggi';
import { useAuth, usePortalMessenger } from '@faithportal/mini-app-sdk';
import axios from 'axios';
import { calculateJanggiGameScore } from './utils/janggiScoreCalculator';
import {
  createClassicBoard,
  createMiniBoard,
  getValidMovesForPiece,
  isCheck,
  isBigjang,
  calculateJanggiScore,
  getAllLegalMoves,
  getBoardHash,
  hasInsufficientMaterial,
} from './logic/janggiRules';
import { findBestMove } from './logic/janggiAi';
import { getDailyPuzzle, JanggiPuzzle } from './data/dailyPuzzles';
import { getTodaySajuBuff } from './utils/sajuCalculator';
import { soundEffects } from './utils/soundEffects';
import { AI_PERSONAS, getJanggiAssetUrl, getRandomLine } from './data/aiPersonas';

// Components
import { SplashScreen } from './components/SplashScreen';
import { GameHeader } from './components/GameHeader';
import { JanggiBoard } from './components/JanggiBoard';
import { GameControls } from './components/GameControls';
import { StatusInsightPanel } from './components/StatusInsightPanel';
import { VictoryModal } from './components/VictoryModal';
import { SetupModal } from './components/SetupModal';
import { RuleGuideModal } from './components/RuleGuideModal';
import { JanggunBanner } from './components/JanggunBanner';
import { MunggunBanner } from './components/MunggunBanner';
import { CheckmateBanner } from './components/CheckmateBanner';
import { BigjangModal } from './components/BigjangModal';

const DIFFICULTY_SEQUENCE: Difficulty[] = ['beginner', 'easy', 'normal', 'hard', 'master'];
const DIFFICULTY_INFO: Record<Difficulty, { label: string; badge: string; color: string }> = {
  beginner: { label: '입문 (18급)', badge: '🌱 18급', color: 'text-emerald-800 bg-emerald-100/90 border-emerald-300' },
  easy: { label: '초급 (10급)', badge: '⭐ 10급', color: 'text-sky-800 bg-sky-100/90 border-sky-300' },
  normal: { label: '중급 (3급)', badge: '⭐⭐ 3급', color: 'text-amber-800 bg-amber-100/90 border-amber-300' },
  hard: { label: '고급 (1단)', badge: '⭐⭐⭐ 1단', color: 'text-indigo-800 bg-indigo-100/90 border-indigo-300' },
  master: { label: '달인 (9단)', badge: '👑 9단', color: 'text-rose-800 bg-rose-100/90 border-rose-300' },
};

const PREFS_STORAGE_KEY = 'vera_janggi_prefs_v1';

const loadJanggiPreferences = (): JanggiPreferences => {
  if (typeof window === 'undefined') return DEFAULT_JANGGI_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_JANGGI_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<JanggiPreferences>;
    const boardTheme: BoardTheme =
      parsed.boardTheme === 'royal_ebony' || parsed.boardTheme === 'night_ink'
        ? parsed.boardTheme
        : 'classic_wood';
    return {
      boardTheme,
      showKoreanSubLabel: Boolean(parsed.showKoreanSubLabel),
      sound: {
        sfxEnabled: parsed.sound?.sfxEnabled ?? true,
        voiceEnabled: parsed.sound?.voiceEnabled ?? true,
        bgmEnabled: parsed.sound?.bgmEnabled ?? false,
      },
    };
  } catch {
    return DEFAULT_JANGGI_PREFERENCES;
  }
};

const parseRecordsJson = (raw: string | null | undefined): JanggiRecordsMap => {
  const base = createEmptyJanggiRecords();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw);
    for (const d of DIFFICULTY_SEQUENCE) {
      if (parsed?.[d]) {
        base[d] = {
          wins: Math.max(0, Number(parsed[d].wins) || 0),
          losses: Math.max(0, Number(parsed[d].losses) || 0),
          draws: Math.max(0, Number(parsed[d].draws) || 0),
        };
      }
    }
  } catch {
    // ignore invalid json
  }
  return base;
};

const mergeRecordsMax = (a: JanggiRecordsMap, b: Partial<JanggiRecordsMap> | null | undefined): JanggiRecordsMap => {
  const merged = createEmptyJanggiRecords();
  for (const d of DIFFICULTY_SEQUENCE) {
    const ra = a?.[d] || { wins: 0, losses: 0, draws: 0 };
    const rb = b?.[d] || { wins: 0, losses: 0, draws: 0 };
    merged[d] = {
      wins: Math.max(ra.wins, Number(rb.wins) || 0),
      losses: Math.max(ra.losses, Number(rb.losses) || 0),
      draws: Math.max(ra.draws, Number(rb.draws) || 0),
    };
  }
  return merged;
};

export function App() {
  // 인증 및 포털 메신저 훅
  const { user } = useAuth();
  const { sendToPortal } = usePortalMessenger();

  // 대국 종료 전적 저장 상태
  const gameOverHandledRef = useRef<boolean>(false);
  const [gameScoreDetails, setGameScoreDetails] = useState<JanggiGameScoreDetails | null>(null);
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [recordsByTier, setRecordsByTier] = useState<JanggiRecordsMap>(() => {
    if (typeof window === 'undefined') return createEmptyJanggiRecords();
    return parseRecordsJson(localStorage.getItem('vera_janggi_records_v1'));
  });

  // 로그인 회원일 경우 유저별 로컬스토리지 및 서버 전적 동기화
  useEffect(() => {
    if (!user?.id) return;
    const userKey = `vera_janggi_records_${user.id}`;
    const localUserRecs = parseRecordsJson(localStorage.getItem(userKey));
    setRecordsByTier((prev) => {
      const merged = mergeRecordsMax(prev, localUserRecs);
      try {
        localStorage.setItem('vera_janggi_records_v1', JSON.stringify(merged));
        localStorage.setItem(userKey, JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    });

    axios
      .get(`/api/games/janggi/highscore/${user.id}`, { withCredentials: true })
      .then((res) => {
        const serverRecords = res.data?.janggiRecords as Partial<JanggiRecordsMap> | undefined;
        if (serverRecords && typeof serverRecords === 'object') {
          setRecordsByTier((prev) => {
            const synced = mergeRecordsMax(prev, serverRecords);
            try {
              localStorage.setItem('vera_janggi_records_v1', JSON.stringify(synced));
              localStorage.setItem(userKey, JSON.stringify(synced));
            } catch {
              // ignore
            }
            return synced;
          });
        }
      })
      .catch(() => {});
  }, [user?.id]);

  // 1. 초기 3초 스플래시 및 대국 시작 상태 (miniapp.md 필수 규격)
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [isStartModalMode, setIsStartModalMode] = useState<boolean>(true);

  // 2. 대국 모드 및 설정 상태
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [choSetup, setChoSetup] = useState<SetupType>('masangsangma');
  const [hanSetup, setHanSetup] = useState<SetupType>('masangsangma');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('normal');
  const [playerSide, setPlayerSide] = useState<Side>('cho'); // 유저 진영 (기본 초 선공)
  const [aiDialogue, setAiDialogue] = useState<string>(() => AI_PERSONAS['normal'].greeting);

  // 3. 보드 및 턴 상태
  const cols = gameMode === 'mini' ? 7 : 9;
  const rows = gameMode === 'mini' ? 7 : 10;
  const [board, setBoard] = useState<(Piece | null)[][]>(() => createClassicBoard('masangsangma', 'masangsangma'));
  const [currentTurn, setCurrentTurn] = useState<Side>('cho');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  const [lastMoveIsCapture, setLastMoveIsCapture] = useState<boolean>(false);
  const [janggunAttacker, setJanggunAttacker] = useState<Side | null>(null);
  const [munggunDefender, setMunggunDefender] = useState<Side | null>(null);
  const [checkmateWinner, setCheckmateWinner] = useState<Side | null>(null);
  const [isBigjangModalOpen, setIsBigjangModalOpen] = useState<boolean>(false);
  const [boardHashes, setBoardHashes] = useState<string[]>([]);
  const [shakeTrigger, setShakeTrigger] = useState<number>(0);
  const [playerCaptureStreak, setPlayerCaptureStreak] = useState<number>(0);
  const [comboBanner, setComboBanner] = useState<ComboBannerEvent | null>(null);
  const [aiEmotion, setAiEmotion] = useState<AiEmotion>('idle');

  // 4. 승패 및 상태
  const [isCheckState, setIsCheckState] = useState<boolean>(false);
  const [winner, setWinner] = useState<Side | 'draw' | null>(null);
  const [winReason, setWinReason] = useState<string>('');
  const [moveCount, setMoveCount] = useState<number>(0);
  const [capturedByCho, setCapturedByCho] = useState<Piece[]>([]);
  const [capturedByHan, setCapturedByHan] = useState<Piece[]>([]);
  const [undoHistory, setUndoHistory] = useState<{
    board: (Piece | null)[][];
    turn: Side;
    lastMove: { from: Position; to: Position } | null;
  }[]>([]);
  const [undoCount, setUndoCount] = useState<number>(0);

  // 5. 특수 기능 (스킬, 사주, 퍼즐)
  const [skillGauge, setSkillGauge] = useState<number>(30); // 0 ~ 100
  const [activeSkill, setActiveSkill] = useState<SpecialSkill | null>(null);
  const [dailyPuzzle, setDailyPuzzle] = useState<JanggiPuzzle>(() => getDailyPuzzle());
  const [puzzleMoveStep, setPuzzleMoveStep] = useState<number>(0);
  const [puzzleStreak, setPuzzleStreak] = useState<number>(3);
  const [sajuBuff, setSajuBuff] = useState<SajuElementBuff>(() => getTodaySajuBuff());

  // 6. 타이머 / 샷클락 & 오디오 · 테마 설정
  const initialTime = gameMode === 'mini' ? 15 : 30;
  const [timeRemaining, setTimeRemaining] = useState<number>(initialTime);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<JanggiPreferences>(() => loadJanggiPreferences());

  // 오디오·테마 환경설정 로컬스토리지 동기화 및 SoundManager 반영
  useEffect(() => {
    soundEffects.updateSettings(preferences.sound);
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // ignore storage quota error
    }
  }, [preferences]);

  // 콤보 배너 자동 닫기
  useEffect(() => {
    if (!comboBanner) return;
    const timer = window.setTimeout(() => {
      setComboBanner(null);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [comboBanner]);

  const handleCloseJanggun = useCallback(() => setJanggunAttacker(null), []);
  const handleCloseMunggun = useCallback(() => setMunggunDefender(null), []);
  const handleCloseCheckmate = useCallback(() => setCheckmateWinner(null), []);

  const handleUpdateSoundSettings = useCallback((partial: Partial<SoundSettings>) => {
    setPreferences((prev) => ({
      ...prev,
      sound: {
        ...prev.sound,
        ...partial,
      },
    }));
  }, []);

  const handleChangeBoardTheme = useCallback((boardTheme: BoardTheme) => {
    setPreferences((prev) => ({
      ...prev,
      boardTheme,
    }));
  }, []);

  const handleToggleKoreanSubLabel = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      showKoreanSubLabel: !prev.showKoreanSubLabel,
    }));
  }, []);

  // 7. 모달 상태
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [isRuleOpen, setIsRuleOpen] = useState<boolean>(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState<boolean>(false);

  // 점수 계산 (73.5점 공식)
  const score: ScoreBreakdown = calculateJanggiScore(board, cols, rows);

  // 대국판 초기화 함수
  const initGame = useCallback((mode = gameMode, cSetup = choSetup, hSetup = hanSetup, diff = aiDifficulty) => {
    setSelectedPos(null);
    setValidMoves([]);
    setLastMove(null);
    setLastMoveIsCapture(false);
    setJanggunAttacker(null);
    setMunggunDefender(null);
    setCheckmateWinner(null);
    setIsBigjangModalOpen(false);
    setBoardHashes([]);
    setPlayerCaptureStreak(0);
    setComboBanner(null);
    setAiEmotion('idle');
    setIsCheckState(false);
    setWinner(null);
    setIsVictoryModalOpen(false);
    setWinReason('');
    setMoveCount(0);
    setCapturedByCho([]);
    setCapturedByHan([]);
    setUndoHistory([]);
    setUndoCount(0);
    setActiveSkill(null);
    setIsAiThinking(false);
    setTimeRemaining(mode === 'mini' ? 15 : 30);
    setAiDialogue(AI_PERSONAS[diff]?.greeting || '');
    gameOverHandledRef.current = false;
    setGameScoreDetails(null);
    setSaveMessage(null);
    setIsSavingScore(false);

    if (mode === 'mini') {
      setBoard(createMiniBoard());
      setCurrentTurn('cho');
    } else if (mode === 'puzzle') {
      const pz = getDailyPuzzle();
      setDailyPuzzle(pz);
      setBoard(pz.initialBoard());
      setCurrentTurn(pz.turn);
      setPuzzleMoveStep(0);
    } else {
      setBoard(createClassicBoard(cSetup, hSetup));
      setCurrentTurn('cho');
    }
  }, [gameMode, choSetup, hanSetup, aiDifficulty]);

  // 대국 종료 시 마지막 수 확인을 위해 1.8초 딜레이 후 결과 모달 표시
  useEffect(() => {
    if (winner) {
      const timer = setTimeout(() => {
        setIsVictoryModalOpen(true);
      }, 1800);
      return () => clearTimeout(timer);
    } else {
      setIsVictoryModalOpen(false);
    }
  }, [winner]);

  // 대국 종료 시 급수별 승·무·패 전적 갱신 및 서버 DB/포털 리더보드 연동
  useEffect(() => {
    if (winner && !gameOverHandledRef.current) {
      gameOverHandledRef.current = true;
      const details = calculateJanggiGameScore({
        winner,
        playerSide,
        gameMode,
        aiDifficulty,
        moveCount,
        choScore: score.choPoints,
        hanScore: score.hanPoints,
        winReason,
        puzzleStreak,
      });
      setGameScoreDetails(details);

      // 1. 급수별 승·무·패 전적 계산 및 로컬스토리지 저장
      const isDraw = winner === 'draw';
      const isWin = !isDraw && (gameMode === 'puzzle' ? winner === 'cho' : winner === playerSide);

      const baseRecs = parseRecordsJson(localStorage.getItem('vera_janggi_records_v1'));
      const mergedPrev = mergeRecordsMax(recordsByTier, baseRecs);
      const currentTierRec = mergedPrev[aiDifficulty] || { wins: 0, losses: 0, draws: 0 };
      const updatedRecords: JanggiRecordsMap = {
        ...mergedPrev,
        [aiDifficulty]: {
          wins: currentTierRec.wins + (isWin ? 1 : 0),
          losses: currentTierRec.losses + (!isDraw && !isWin ? 1 : 0),
          draws: currentTierRec.draws + (isDraw ? 1 : 0),
        },
      };
      setRecordsByTier(updatedRecords);

      try {
        localStorage.setItem('vera_janggi_records_v1', JSON.stringify(updatedRecords));
        if (user?.id) {
          localStorage.setItem(`vera_janggi_records_${user.id}`, JSON.stringify(updatedRecords));
        }
        const prevHigh = parseInt(localStorage.getItem('vera_janggi_high_score') || '0', 10);
        if (details.totalScore > prevHigh) {
          localStorage.setItem('vera_janggi_high_score', details.totalScore.toString());
        }
      } catch (e) {
        console.warn('[Janggi] LocalStorage error:', e);
      }

      // 2. 포털 부모 창(GameLeaderboard)에 전적 업데이트 메시지 전송
      const targetWindow = window.opener || (window.parent !== window ? window.parent : null);
      if (targetWindow) {
        targetWindow.postMessage(
          {
            type: 'GAME_SCORE_UPDATED',
            gameId: 'janggi',
            score: details.totalScore,
          },
          '*'
        );
      }

      // 3. 포털 미션 및 포인트 갱신 연동
      sendToPortal('MISSION_CLEAR');
      sendToPortal('POINTS_UPDATED', { points: details.earnedPoints });

      // 4. 로그인 회원일 경우 백엔드 API 서버에 급수별 승패 전적 및 베라 포인트 영구 저장
      if (user) {
        setIsSavingScore(true);
        axios
          .post(
            '/api/games/janggi/score',
            {
              score: details.totalScore,
              metadata: {
                gameMode,
                aiDifficulty,
                playerSide,
                winner,
                isWin,
                isDraw,
                winReason,
                moveCount,
                choScore: score.choPoints,
                hanScore: score.hanPoints,
                earnedPoints: details.earnedPoints,
                tierRecords: updatedRecords,
                breakdown: details,
              },
            },
            { withCredentials: true }
          )
          .then(() => {
            setSaveMessage('급수별 승패 전적이 명예의 전당에 기록되었습니다!');
          })
          .catch((err) => {
            console.error('[Janggi] 전적 저장 실패:', err);
            setSaveMessage(null);
          })
          .finally(() => {
            setIsSavingScore(false);
          });
      }
    } else if (!winner) {
      gameOverHandledRef.current = false;
      setGameScoreDetails(null);
      setSaveMessage(null);
      setIsSavingScore(false);
    }
  }, [
    winner,
    playerSide,
    gameMode,
    aiDifficulty,
    moveCount,
    score.choPoints,
    score.hanPoints,
    winReason,
    puzzleStreak,
    user,
    sendToPortal,
    recordsByTier,
  ]);

  // 모드 변경 처리: AI 대전 모드인 경우 난이도/설정 모달을 띄워 대국을 준비
  const handleSelectMode = (newMode: GameMode) => {
    soundEffects.playUiClick();
    setGameMode(newMode);
    if (newMode === 'puzzle') {
      initGame(newMode, choSetup, hanSetup);
      setIsGameStarted(true);
    } else {
      initGame(newMode, choSetup, hanSetup);
      setIsStartModalMode(true);
      setIsSetupOpen(true);
    }
  };

  // 3초 스플래시 종료 처리: 퍼즐 모드가 아니면 대국 시작 전 난이도/진영 선택 모달 자동 표시
  const handleFinishSplash = useCallback(() => {
    setShowSplash(false);
    if (gameMode !== 'puzzle') {
      setIsStartModalMode(true);
      setIsSetupOpen(true);
    } else {
      setIsGameStarted(true);
    }
  }, [gameMode]);

  // 타이머 틱 처리
  useEffect(() => {
    if (showSplash || !isGameStarted || isSetupOpen || winner || isAiThinking) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // 시간 초과 처리
          if (gameMode === 'mini') {
            soundEffects.playCheck();
            const timeoutWinner: Side = currentTurn === 'cho' ? 'han' : 'cho';
            setWinner(timeoutWinner);
            setWinReason(`${currentTurn === 'cho' ? '초(楚)' : '한(漢)'} 15초 초읽기 시간 초과패`);
            return 0;
          }
          return 0;
        }
        if (prev <= 4) {
          soundEffects.playShotClock();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showSplash, isGameStarted, isSetupOpen, winner, isAiThinking, currentTurn, gameMode]);

  // AI 및 최신 보드 참조용 Refs (React 리렌더링 클린업에 의한 타이머 취소 방지)
  const boardRef = useRef(board);
  boardRef.current = board;
  const currentTurnRef = useRef(currentTurn);
  currentTurnRef.current = currentTurn;
  const aiRunningRef = useRef(false);

  // AI 자동 착수 루프
  useEffect(() => {
    if (showSplash || !isGameStarted || isSetupOpen || winner) return;

    const isAiTurn = currentTurn !== playerSide && gameMode !== 'puzzle';
    if (!isAiTurn) {
      aiRunningRef.current = false;
      setIsAiThinking(false);
      return;
    }

    if (aiRunningRef.current) return;
    aiRunningRef.current = true;
    setIsAiThinking(true);
    setAiEmotion('thinking');
    setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onThinking));

    const thinkDuration =
      aiDifficulty === 'master'
        ? 800
        : aiDifficulty === 'hard'
        ? 650
        : aiDifficulty === 'normal'
        ? 450
        : aiDifficulty === 'easy'
        ? 320
        : 220;

    const timer = setTimeout(() => {
      const activeBoard = boardRef.current;
      const activeTurn = currentTurnRef.current;

      const bestMove = findBestMove(activeBoard, activeTurn, aiDifficulty, cols, rows);

      if (!bestMove) {
        // AI가 둘 수 있는 수가 없음 -> 외통수 패배 (플레이어 승리)
        const winSide: Side = activeTurn === 'cho' ? 'han' : 'cho';
        setWinner(winSide);
        setWinReason('외통수 (장군을 피할 수 없음)');
        setCheckmateWinner(winSide);
        setShakeTrigger((prev) => prev + 1);
        setAiEmotion('defeat');
        soundEffects.playCheckmate(true);
        setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onDefeat));
        aiRunningRef.current = false;
        setIsAiThinking(false);
        return;
      }

      // AI 착수 실행
      executeMove(bestMove.from, bestMove.to, true);
      aiRunningRef.current = false;
      setIsAiThinking(false);
    }, thinkDuration);

    return () => {
      clearTimeout(timer);
    };
  }, [currentTurn, playerSide, winner, showSplash, isGameStarted, isSetupOpen, gameMode, cols, rows, aiDifficulty]);

  // 실제 기물 이동 실행
  const executeMove = (from: Position, to: Position, _isAi = false) => {
    const movingPiece = board[from.y][from.x];
    if (!movingPiece) return;

    const targetPiece = board[to.y][to.x];
    const wasInCheck = isCheckState;

    // Undo 기록 저장 (최대 10수 전까지)
    setUndoHistory((prev) => [
      ...prev.slice(-9),
      {
        board: board.map((row) => [...row]),
        turn: currentTurn,
        lastMove,
      },
    ]);

    // 새 보드 생성 및 이동
    const newBoard = board.map((row) => [...row]);
    newBoard[to.y][to.x] = { ...movingPiece };
    newBoard[from.y][from.x] = null;

    // 기물 포획 사운드 · 콤보 · 타격감 업데이트
    const hasCaptured = !!targetPiece;
    setLastMoveIsCapture(hasCaptured);

    if (movingPiece.type === 'cannon') {
      soundEffects.playCannonShot();
    }

    if (targetPiece) {
      let nextStreak = 1;
      if (currentTurn === playerSide) {
        nextStreak = playerCaptureStreak + 1;
        setPlayerCaptureStreak(nextStreak);
      } else {
        setPlayerCaptureStreak(0);
      }

      soundEffects.playCapture(targetPiece.type, currentTurn === playerSide ? nextStreak : 1);

      if (targetPiece.type === 'chariot' || targetPiece.type === 'cannon' || nextStreak >= 2) {
        setShakeTrigger((prev) => prev + 1);
      }

      if (currentTurn === playerSide) {
        if (targetPiece.type === 'chariot') {
          setComboBanner({
            id: Date.now(),
            title: '🔥 차(車) 격파! (+13점)',
            subtitle: nextStreak >= 2 ? `${nextStreak}연속 포획 기세 상승!` : '상대의 주력 기물을 잡았습니다!',
            tone: 'rose',
          });
        } else if (targetPiece.type === 'cannon') {
          setComboBanner({
            id: Date.now(),
            title: '💥 포(包) 격파! (+7점)',
            subtitle: nextStreak >= 2 ? `${nextStreak}연속 포획 기세 상승!` : '화력 핵심 기물을 제압했습니다!',
            tone: 'amber',
          });
        } else if (nextStreak >= 2) {
          setComboBanner({
            id: Date.now(),
            title: `⚡ ${nextStreak}연속 포획!`,
            subtitle: '파죽지세의 공세가 이어집니다',
            tone: 'emerald',
          });
        }
      }

      if (currentTurn === 'cho') {
        setCapturedByCho((prev) => [...prev, targetPiece]);
        setSkillGauge((prev) => Math.min(100, prev + 25));
      } else {
        setCapturedByHan((prev) => [...prev, targetPiece]);
        setSkillGauge((prev) => Math.min(100, prev + 25));
      }
    } else {
      if (currentTurn === playerSide) {
        setPlayerCaptureStreak(0);
      }
      soundEffects.playPieceMove(movingPiece.type);
    }

    setBoard(newBoard);
    setLastMove({ from, to });
    setSelectedPos(null);
    setValidMoves([]);
    const nextMoveCount = moveCount + 1;
    setMoveCount(nextMoveCount);
    setTimeRemaining(gameMode === 'mini' ? 15 : 30);

    const nextTurn: Side = currentTurn === 'cho' ? 'han' : 'cho';

    // 🧩 데일리 묘수풀이 모드 수순 검증
    if (gameMode === 'puzzle') {
      const currentStep = dailyPuzzle.solution[puzzleMoveStep];
      if (
        currentStep &&
        currentStep.from.x === from.x &&
        currentStep.from.y === from.y &&
        currentStep.to.x === to.x &&
        currentStep.to.y === to.y
      ) {
        const nextStep = puzzleMoveStep + 1;
        setPuzzleMoveStep(nextStep);

        if (nextStep >= dailyPuzzle.solution.length) {
          soundEffects.playCheckmate(true);
          setWinner('cho');
          setWinReason(`🎉 오늘의 묘수풀이 [${dailyPuzzle.title}] 완전 정복!`);
          setPuzzleStreak((prev) => prev + 1);
          return;
        }
      } else {
        soundEffects.playDefeat();
        alert('아쉽습니다! 정답 수순이 아닙니다. 다시 시도해보세요.');
        initGame('puzzle');
        return;
      }
    }

    // 1. 150수 제한 도달 시 한국장기협회 공식 점수제 판정
    if (nextMoveCount >= 150) {
      const finalScore = calculateJanggiScore(newBoard, cols, rows);
      const isPlayerWin = finalScore.leader === playerSide;
      if (finalScore.leader === 'draw') {
        soundEffects.playDraw();
      } else if (isPlayerWin) {
        soundEffects.playVictory();
        setAiEmotion('defeat');
      } else {
        soundEffects.playDefeat();
        setAiEmotion('victory');
      }
      setWinner(finalScore.leader);
      setWinReason('150수 제한 도달 — 한국장기협회 공식 점수제 판정');
      return;
    }

    // 2. 양측 핵심 공격 기물(차, 포, 마, 상) 전멸 시 외통 불능 점수제 판정
    if (hasInsufficientMaterial(newBoard)) {
      const finalScore = calculateJanggiScore(newBoard, cols, rows);
      const isPlayerWin = finalScore.leader === playerSide;
      if (finalScore.leader === 'draw') {
        soundEffects.playDraw();
      } else if (isPlayerWin) {
        soundEffects.playVictory();
        setAiEmotion('defeat');
      } else {
        soundEffects.playDefeat();
        setAiEmotion('victory');
      }
      setWinner(finalScore.leader);
      setWinReason('양측 공격 기물 소진 (외통 불능) — 공식 점수제 판정');
      return;
    }

    // 3. 동일 국면 3회 반복(삼복수) 감지
    const currentHash = getBoardHash(newBoard, nextTurn);
    const hashOccurrences = boardHashes.filter((h) => h === currentHash).length;
    if (hashOccurrences >= 2) {
      soundEffects.playDraw();
      setAiEmotion('idle');
      setWinner('draw');
      setWinReason('동일 국면 3회 반복 (한국장기협회 공식 삼복수 무승부)');
      return;
    }
    setBoardHashes((prev) => [...prev, currentHash]);

    // 4. 장군(Check) 및 멍군(방어 성공) 판별
    const checkOnOpponent = isCheck(newBoard, nextTurn, cols, rows);
    setIsCheckState(checkOnOpponent);

    if (checkOnOpponent) {
      setShakeTrigger((prev) => prev + 1);
      setMunggunDefender(null);

      // 외통수(Checkmate) 체크
      const opponentMoves = getAllLegalMoves(newBoard, nextTurn, cols, rows);
      if (opponentMoves.length === 0) {
        const isPlayerWin = currentTurn === playerSide;
        soundEffects.playCheckmate(isPlayerWin);
        setCheckmateWinner(currentTurn);
        setWinner(currentTurn);
        setWinReason(`외통수(外痛手)! ${currentTurn === 'cho' ? '초(楚)' : '한(漢)'} 완승`);
        setAiEmotion(isPlayerWin ? 'defeat' : 'victory');

        if (isPlayerWin) {
          setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onDefeat));
        } else {
          setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onVictory));
        }
        return;
      } else {
        soundEffects.playCheck();
        setJanggunAttacker(currentTurn);

        if (currentTurn !== playerSide) {
          setAiEmotion('attack');
          setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onCheck));
        } else {
          setAiEmotion('danger');
          setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onInCheck));
        }
      }
    } else {
      setJanggunAttacker(null);

      if (wasInCheck) {
        // 직전 장군 상태에서 합법 수로 방어에 성공 -> 멍군!
        soundEffects.playMunggun();
        setMunggunDefender(currentTurn);
        setAiEmotion(currentTurn === playerSide ? 'idle' : 'attack');
        setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onMunggun));
      } else if (targetPiece) {
        if (currentTurn !== playerSide) {
          setAiEmotion('attack');
          setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onCapture));
        } else {
          setAiEmotion('danger');
          setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onInCheck));
        }
      } else {
        setAiEmotion('idle');
      }
    }

    // 5. 빅장(Face-to-Face King) 체크
    if (isBigjang(newBoard, cols, rows)) {
      soundEffects.playBigjang();
      setIsBigjangModalOpen(true);
    }

    setCurrentTurn(nextTurn);
  };

  // 플레이어 기물 선택
  const handleSelectPiece = (pos: Position) => {
    if (!isGameStarted || isSetupOpen || winner || isAiThinking) return;
    const piece = board[pos.y][pos.x];

    if (piece && piece.side === currentTurn) {
      soundEffects.playSelect();
      setSelectedPos(pos);
      const moves = getValidMovesForPiece(board, pos, cols, rows);
      setValidMoves(moves);
    } else if (selectedPos) {
      const isTargetValid = validMoves.some((m) => m.x === pos.x && m.y === pos.y);
      if (isTargetValid) {
        executeMove(selectedPos, pos, false);
      } else {
        setSelectedPos(null);
        setValidMoves([]);
      }
    }
  };

  // 플레이어 착수 실행 (보드에서 직접 호출)
  const handleMakeMove = (to: Position) => {
    if (!isGameStarted || isSetupOpen || !selectedPos || winner || isAiThinking) return;
    executeMove(selectedPos, to, false);
  };

  // 한수 쉼 (Pass)
  const handlePass = () => {
    if (!isGameStarted || isSetupOpen || winner || isAiThinking) return;
    soundEffects.playUiClick();
    const nextTurn: Side = currentTurn === 'cho' ? 'han' : 'cho';
    setCurrentTurn(nextTurn);
    setSelectedPos(null);
    setValidMoves([]);
    setTimeRemaining(gameMode === 'mini' ? 15 : 30);
  };

  // 무르기 (Undo) - 최대 3회
  const handleUndo = () => {
    if (!isGameStarted || isSetupOpen || undoHistory.length === 0 || undoCount >= 3 || isAiThinking) return;
    soundEffects.playUiClick();

    const stepsToPop = gameMode !== 'puzzle' && currentTurn === playerSide ? 2 : 1;
    const newHistory = [...undoHistory];
    let lastState = null;

    for (let i = 0; i < stepsToPop; i++) {
      if (newHistory.length > 0) {
        lastState = newHistory.pop();
      }
    }

    if (lastState) {
      setBoard(lastState.board);
      setCurrentTurn(lastState.turn);
      setLastMove(lastState.lastMove);
      setLastMoveIsCapture(false);
      setJanggunAttacker(null);
      setMunggunDefender(null);
      setUndoHistory(newHistory);
      setUndoCount((prev) => prev + 1);
      setSelectedPos(null);
      setValidMoves([]);
      setIsCheckState(isCheck(lastState.board, lastState.turn, cols, rows));
      setAiEmotion('idle');
      setWinner(null);
    }
  };

  // 힌트 보기
  const handleHint = () => {
    if (winner || isAiThinking) return;
    soundEffects.playUiClick();

    if (gameMode === 'puzzle') {
      const step = dailyPuzzle.solution[puzzleMoveStep];
      if (step) {
        setSelectedPos(step.from);
        setValidMoves([step.to]);
        alert(`💡 [힌트]: ${dailyPuzzle.hint}`);
      }
      return;
    }

    const bestMove = findBestMove(board, currentTurn, 'hard', cols, rows);
    if (bestMove) {
      setSelectedPos(bestMove.from);
      setValidMoves([bestMove.to]);
    }
  };

  // 스킬 발동 (배틀 모드)
  const handleUseSkill = (skill: SpecialSkill) => {
    if (skillGauge < 100 || winner || isAiThinking) return;
    soundEffects.playVictory();
    setActiveSkill(skill);
    setSkillGauge(0);

    if (skill === 'booster') {
      alert('🚀 [차(車) 부스터] 활성화! 차의 멱이 제거되어 어디든 단숨에 돌진합니다.');
    } else if (skill === 'cannon_fire') {
      alert('💥 [쌍포 집중 폭격] 활성화! 이번 턴 포가 다리 없이도 전방 기물을 타격합니다.');
    } else if (skill === 'swap') {
      alert('🔄 [궁-사 비상 위치 교환] 완료! 위기의 궁이 사와 자리를 바꿔 위기를 모면했습니다.');
    }
  };

  // 음소거 토글
  const handleToggleMute = () => {
    const nextMute = soundEffects.toggleMute();
    setIsMuted(nextMute);
  };

  // 새 대국 시작 모달 열기
  const handleOpenNewGame = () => {
    soundEffects.playUiClick();
    setIsStartModalMode(true);
    setIsSetupOpen(true);
  };

  // 상차림/설정 모달 열기
  const handleOpenSetup = () => {
    soundEffects.playUiClick();
    setIsStartModalMode(false);
    setIsSetupOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 flex flex-col items-center justify-start py-1 px-1 sm:py-3 sm:px-4">
      {/* 3초 필수 스플래시 인트로 (miniapp.md 규격 준수) */}
      {showSplash && <SplashScreen onFinish={handleFinishSplash} />}

      {/* 메인 미니앱 컨테이너 (450px × 850px 완전 채움 레이아웃, zero dead space) */}
      <main
        className="w-full max-w-[450px] min-h-[850px] bg-slate-50 rounded-3xl shadow-xl border border-slate-200/90 flex flex-col justify-between p-3.5 space-y-2.5 relative overflow-hidden"
        data-screenshot-target="janggi-main"
      >
        {/* 상단 헤더 & 모드 탭 & 타이머 */}
        <GameHeader
          currentMode={gameMode}
          currentTurn={currentTurn}
          isCheck={isCheckState}
          timeRemaining={timeRemaining}
          isMiniMode={gameMode === 'mini'}
          isMuted={isMuted}
          soundSettings={preferences.sound}
          boardTheme={preferences.boardTheme}
          showKoreanSubLabel={preferences.showKoreanSubLabel}
          sajuBuff={sajuBuff}
          onToggleMute={handleToggleMute}
          onUpdateSoundSettings={handleUpdateSoundSettings}
          onChangeBoardTheme={handleChangeBoardTheme}
          onToggleKoreanSubLabel={handleToggleKoreanSubLabel}
          onOpenRules={() => setIsRuleOpen(true)}
          onSelectMode={handleSelectMode}
        />

        {/* 상시 고정 AI 캐릭터 초상화 & 국면 말풍선 브리핑 바 (Zero Layout Shift) + 장군/멍군/외통/콤보 배너 */}
        <div
          className={`relative w-full min-h-[54px] max-h-[56px] px-2.5 py-1.5 rounded-2xl border flex items-center justify-between transition-colors duration-200 select-none shadow-xs box-border overflow-hidden ${
            winner
              ? 'bg-amber-100/95 border-amber-400 text-amber-950'
              : !isGameStarted
              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
              : isCheckState
              ? 'bg-rose-50/95 border-rose-300 text-rose-900'
              : isAiThinking
              ? 'bg-indigo-50/95 border-indigo-300 text-indigo-900'
              : currentTurn === playerSide
              ? 'bg-emerald-50/85 border-emerald-200 text-emerald-950'
              : 'bg-slate-100/90 border-slate-200 text-slate-700'
          }`}
        >
          {/* 좌측: 한국화 AI 초상화(감정 아우라) + 2줄 가독성 말풍선 */}
          <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
            {winner ? (
              <>
                <i className="fas fa-flag-checkered text-amber-600 text-sm shrink-0"></i>
                <span className="text-xs font-black text-amber-950 line-clamp-2 leading-tight">
                  대국 종료 ({winReason || '최종 수 확인'}) — 마지막 수를 확인하세요
                </span>
              </>
            ) : (
              <>
                <div
                  className={`relative w-9 h-9 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    aiEmotion === 'danger'
                      ? 'border-rose-500 ring-2 ring-rose-300/60'
                      : aiEmotion === 'attack'
                      ? 'border-amber-500 ring-2 ring-amber-300/60'
                      : aiEmotion === 'thinking'
                      ? 'border-indigo-500 animate-pulse'
                      : 'border-amber-300/90'
                  }`}
                  title={`${AI_PERSONAS[aiDifficulty]?.name} (${AI_PERSONAS[aiDifficulty]?.title})`}
                >
                  <img
                    src={getJanggiAssetUrl(AI_PERSONAS[aiDifficulty]?.portrait)}
                    alt={AI_PERSONAS[aiDifficulty]?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-[10px] font-black opacity-80 leading-none mb-0.5">
                    <span>{AI_PERSONAS[aiDifficulty]?.name}</span>
                    {isCheckState && (
                      <i className="fas fa-exclamation-triangle text-rose-600 animate-bounce text-[10px]"></i>
                    )}
                    {isAiThinking && (
                      <i className="fas fa-microchip text-indigo-600 animate-spin text-[10px]"></i>
                    )}
                  </div>
                  <p className="text-[11px] font-bold leading-snug line-clamp-2">
                    {!isGameStarted
                      ? `"${AI_PERSONAS[aiDifficulty]?.greeting}"`
                      : isCheckState
                      ? `"${aiDialogue || (currentTurn === playerSide ? '장군 위기! 왕을 피하세요!' : '외통의 길목이오, 장군!')}"`
                      : isAiThinking
                      ? `"${aiDialogue || '수읽기 연산 중...'}"`
                      : `"${aiDialogue || (currentTurn === playerSide ? '당신의 차례입니다. 신중히 두세요.' : '수를 준비 중입니다.')}"`}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* 우측: 대국 종료 시 [결과창 보기] 버튼 또는 현재 AI 대국 난이도 고정 뱃지 */}
          {winner ? (
            <button
              type="button"
              onClick={() => {
                soundEffects.playUiClick();
                setIsVictoryModalOpen(true);
              }}
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-[11px] font-black bg-amber-500 hover:bg-amber-600 text-white shadow-xs shrink-0 transition-colors cursor-pointer"
            >
              <i className="fas fa-trophy text-[10px]"></i>
              <span>결과창 보기</span>
            </button>
          ) : (
            <div
              title={`상대: ${AI_PERSONAS[aiDifficulty]?.name} (${AI_PERSONAS[aiDifficulty]?.title}) - ${DIFFICULTY_INFO[aiDifficulty]?.label}`}
              className={`flex items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-black border select-none shrink-0 shadow-xs ${
                DIFFICULTY_INFO[aiDifficulty]?.color || 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              <span>{DIFFICULTY_INFO[aiDifficulty]?.badge}</span>
              <span className="font-mono text-[10px] opacity-85">
                · {recordsByTier[aiDifficulty]?.wins ?? 0}승{recordsByTier[aiDifficulty]?.losses ?? 0}패
              </span>
            </div>
          )}

          {/* 장기판 위 기물을 절대 가리지 않도록 상단 브리핑 바 영역에만 배너 표시 */}
          {comboBanner && !janggunAttacker && !munggunDefender && !checkmateWinner && (
            <div
              key={comboBanner.id}
              onClick={() => setComboBanner(null)}
              className={`absolute inset-0 z-20 rounded-2xl px-3 flex items-center justify-between gap-2 cursor-pointer border-2 animate-combo-toast ${
                comboBanner.tone === 'rose'
                  ? 'bg-rose-600 border-rose-300 text-white'
                  : comboBanner.tone === 'amber'
                  ? 'bg-amber-500 border-amber-200 text-white'
                  : 'bg-emerald-600 border-emerald-200 text-white'
              }`}
            >
              <div className="min-w-0 text-left">
                <div className="text-xs font-black tracking-tight truncate">{comboBanner.title}</div>
                <div className="text-[10px] font-semibold opacity-90 truncate">{comboBanner.subtitle}</div>
              </div>
              <i className="fas fa-fire-flame-curved text-base shrink-0"></i>
            </div>
          )}

          {janggunAttacker && !checkmateWinner && (
            <JanggunBanner
              key={`janggun_${moveCount}`}
              attacker={janggunAttacker}
              playerSide={playerSide}
              onClose={handleCloseJanggun}
            />
          )}

          {munggunDefender && !janggunAttacker && !checkmateWinner && (
            <MunggunBanner
              key={`munggun_${moveCount}`}
              defender={munggunDefender}
              playerSide={playerSide}
              onClose={handleCloseMunggun}
            />
          )}

          {checkmateWinner && (
            <CheckmateBanner
              key={`checkmate_${moveCount}`}
              winner={checkmateWinner}
              playerSide={playerSide}
              onClose={handleCloseCheckmate}
            />
          )}
        </div>

        {/* 메인 장기판 (9x10 또는 7x7 보드 — 기물 가림 없음) */}
        <div data-screenshot-target="janggi-board" className="flex items-center justify-center w-full relative">
          <JanggiBoard
            board={board}
            cols={cols}
            rows={rows}
            selectedPos={selectedPos}
            validMoves={validMoves}
            lastMove={lastMove}
            lastMoveIsCapture={lastMoveIsCapture}
            isCheckSide={isCheckState ? currentTurn : null}
            currentTurn={currentTurn}
            playerSide={playerSide}
            boardTheme={preferences.boardTheme}
            showKoreanSubLabel={preferences.showKoreanSubLabel}
            shakeTrigger={shakeTrigger}
            onSelectPiece={handleSelectPiece}
            onMakeMove={handleMakeMove}
          />
        </div>

        {/* 점수 & 국면 현황 & 포획 기물 트레이 */}
        <StatusInsightPanel
          score={score}
          moveCount={moveCount}
          capturedByCho={capturedByCho}
          capturedByHan={capturedByHan}
          currentMode={gameMode}
          aiDifficulty={aiDifficulty}
          recordsByTier={recordsByTier}
          puzzleProgress={
            gameMode === 'puzzle'
              ? { current: puzzleMoveStep, max: dailyPuzzle.solution.length }
              : undefined
          }
        />

        {/* 하단 조작 바 (무르기, 한수쉼, 설정, 새대국, 스킬) */}
        <div data-screenshot-target="janggi-controls">
          <GameControls
            currentMode={gameMode}
            canUndo={undoHistory.length > 0 && undoCount < 3}
            undoCount={undoCount}
            maxUndos={3}
            skillGauge={skillGauge}
            selectedSetup={choSetup}
            onUndo={handleUndo}
            onPass={handlePass}
            onHint={handleHint}
            onOpenSetup={handleOpenSetup}
            onNewGame={handleOpenNewGame}
            onUseSkill={handleUseSkill}
          />
        </div>
      </main>

      {/* 승리 / 무승부 모달 */}
      <VictoryModal
        isOpen={isVictoryModalOpen}
        winner={winner}
        playerSide={playerSide}
        aiDifficulty={aiDifficulty}
        recordsByTier={recordsByTier}
        reason={winReason}
        choScore={score.choPoints}
        hanScore={score.hanPoints}
        gameMode={gameMode}
        puzzleStreak={puzzleStreak}
        gameScore={gameScoreDetails?.totalScore || 0}
        earnedPoints={gameScoreDetails?.earnedPoints || 35}
        isSavingScore={isSavingScore}
        saveMessage={saveMessage}
        isLoggedIn={!!user}
        onClose={() => setIsVictoryModalOpen(false)}
        onRestart={handleOpenNewGame}
        onNewGame={handleOpenNewGame}
      />

      {/* 빅장 (Face-to-Face King) 무승부 제안 모달 */}
      <BigjangModal
        isOpen={isBigjangModalOpen}
        onAcceptDraw={() => {
          setWinner('draw');
          setWinReason('빅장(Face-to-Face King) 무승부 합의');
          setIsBigjangModalOpen(false);
        }}
        onContinue={() => setIsBigjangModalOpen(false)}
      />

      {/* 대국 상차림 & AI 난이도 설정 모달 */}
      <SetupModal
        isOpen={isSetupOpen}
        isStartMode={isStartModalMode}
        choSetup={choSetup}
        hanSetup={hanSetup}
        aiDifficulty={aiDifficulty}
        playerSide={playerSide}
        recordsByTier={recordsByTier}
        onClose={() => {
          setIsSetupOpen(false);
          if (!isGameStarted) {
            setIsGameStarted(true);
          }
        }}
        onSave={(opts) => {
          setChoSetup(opts.choSetup);
          setHanSetup(opts.hanSetup);
          setAiDifficulty(opts.aiDifficulty);
          setPlayerSide(opts.playerSide);
          setIsGameStarted(true);
          initGame(gameMode, opts.choSetup, opts.hanSetup, opts.aiDifficulty);
        }}
      />

      {/* 장기 규칙 및 행마법 도움말 모달 */}
      <RuleGuideModal isOpen={isRuleOpen} onClose={() => setIsRuleOpen(false)} />
    </div>
  );
}

export default App;
