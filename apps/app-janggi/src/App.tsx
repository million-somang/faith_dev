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
import { AI_PERSONAS, getRandomLine } from './data/aiPersonas';

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
import { CheckmateBanner } from './components/CheckmateBanner';
import { BigjangModal } from './components/BigjangModal';

const DIFFICULTY_SEQUENCE: Difficulty[] = ['beginner', 'easy', 'normal', 'hard', 'master'];
const DIFFICULTY_INFO: Record<Difficulty, { label: string; badge: string; color: string }> = {
  beginner: { label: '입문 (18급)', badge: '🌱 입문', color: 'text-emerald-800 bg-emerald-100/90 border-emerald-300' },
  easy: { label: '초급 (10급)', badge: '⭐ 초급', color: 'text-sky-800 bg-sky-100/90 border-sky-300' },
  normal: { label: '중급 (3급)', badge: '⭐⭐ 중급', color: 'text-amber-800 bg-amber-100/90 border-amber-300' },
  hard: { label: '고급 (1단)', badge: '⭐⭐⭐ 고급', color: 'text-indigo-800 bg-indigo-100/90 border-indigo-300' },
  master: { label: '달인 (9단)', badge: '👑 프로', color: 'text-rose-800 bg-rose-100/90 border-rose-300' },
};

export function App() {
  // 인증 및 포털 메신저 훅
  const { user } = useAuth();
  const { sendToPortal } = usePortalMessenger();

  // 대국 종료 점수 저장 상태
  const gameOverHandledRef = useRef<boolean>(false);
  const [gameScoreDetails, setGameScoreDetails] = useState<JanggiGameScoreDetails | null>(null);
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
  const [checkmateWinner, setCheckmateWinner] = useState<Side | null>(null);
  const [isBigjangModalOpen, setIsBigjangModalOpen] = useState<boolean>(false);
  const [boardHashes, setBoardHashes] = useState<string[]>([]);

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

  // 6. 타이머 / 샷클락 & 오디오
  const initialTime = gameMode === 'mini' ? 15 : 30;
  const [timeRemaining, setTimeRemaining] = useState<number>(initialTime);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // 7. 모달 상태
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [isRuleOpen, setIsRuleOpen] = useState<boolean>(false);

  // 점수 계산 (73.5점 공식)
  const score: ScoreBreakdown = calculateJanggiScore(board, cols, rows);

  // 대국판 초기화 함수
  const initGame = useCallback((mode = gameMode, cSetup = choSetup, hSetup = hanSetup, diff = aiDifficulty) => {
    setSelectedPos(null);
    setValidMoves([]);
    setLastMove(null);
    setLastMoveIsCapture(false);
    setJanggunAttacker(null);
    setCheckmateWinner(null);
    setIsBigjangModalOpen(false);
    setBoardHashes([]);
    setIsCheckState(false);
    setWinner(null);
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
  }, [gameMode, choSetup, hanSetup]);

  // 대국 종료 시 종합 점수 산출 및 서버 DB/포털 리더보드 연동
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

      // 1. 최고 점수 로컬스토리지 저장 (비회원/오프라인 지원)
      try {
        const prevHigh = parseInt(localStorage.getItem('vera_janggi_high_score') || '0', 10);
        if (details.totalScore > prevHigh) {
          localStorage.setItem('vera_janggi_high_score', details.totalScore.toString());
        }
      } catch (e) {
        console.warn('[Janggi] LocalStorage error:', e);
      }

      // 2. 포털 부모 창(GameLeaderboard)에 점수 업데이트 메시지 전송
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

      // 4. 로그인 회원일 경우 백엔드 API 서버에 점수 및 베라 포인트 영구 저장
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
                winReason,
                moveCount,
                choScore: score.choPoints,
                hanScore: score.hanPoints,
                earnedPoints: details.earnedPoints,
                breakdown: details,
              },
            },
            { withCredentials: true }
          )
          .then(() => {
            setSaveMessage('명예의 전당 랭킹에 등록되었습니다!');
          })
          .catch((err) => {
            console.error('[Janggi] 점수 저장 실패:', err);
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
  ]);

  // 모드 변경 처리: AI 대전 모드인 경우 난이도/설정 모달을 띄워 대국을 준비
  const handleSelectMode = (newMode: GameMode) => {
    soundEffects.playSnap();
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
        // AI가 둘 수 있는 수가 없음 -> 외통수 패배
        const winSide: Side = activeTurn === 'cho' ? 'han' : 'cho';
        setWinner(winSide);
        setWinReason('외통수 (장군을 피할 수 없음)');
        setCheckmateWinner(winSide);
        soundEffects.playCheckmate();
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
  }, [currentTurn, playerSide, winner, showSplash, gameMode, cols, rows, aiDifficulty]);

  // 실제 기물 이동 실행
  const executeMove = (from: Position, to: Position, isAi = false) => {
    const movingPiece = board[from.y][from.x];
    if (!movingPiece) return;

    const targetPiece = board[to.y][to.x];

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

    // 기물 포획 사운드 및 목록 업데이트
    const hasCaptured = !!targetPiece;
    setLastMoveIsCapture(hasCaptured);

    if (movingPiece.type === 'cannon') {
      soundEffects.playCannonShot();
    }

    if (targetPiece) {
      soundEffects.playCapture();
      if (currentTurn === 'cho') {
        setCapturedByCho((prev) => [...prev, targetPiece]);
        setSkillGauge((prev) => Math.min(100, prev + 25));
      } else {
        setCapturedByHan((prev) => [...prev, targetPiece]);
        setSkillGauge((prev) => Math.min(100, prev + 25));
      }
    } else {
      soundEffects.playSnap();
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
        // 정답 수 성공!
        const nextStep = puzzleMoveStep + 1;
        setPuzzleMoveStep(nextStep);

        if (nextStep >= dailyPuzzle.solution.length) {
          // 외통수 퍼즐 최종 해결!
          soundEffects.playVictory();
          setWinner('cho');
          setWinReason(`🎉 오늘의 묘수풀이 [${dailyPuzzle.title}] 완전 정복!`);
          setPuzzleStreak((prev) => prev + 1);
          return;
        }
      } else {
        // 오답 수
        alert('아쉽습니다! 정답 수순이 아닙니다. 다시 시도해보세요.');
        initGame('puzzle');
        return;
      }
    }

    // 1. 150수 제한 도달 시 한국장기협회 공식 점수제 판정
    if (nextMoveCount >= 150) {
      soundEffects.playVictory();
      const finalScore = calculateJanggiScore(newBoard, cols, rows);
      setWinner(finalScore.leader);
      setWinReason('150수 제한 도달 — 한국장기협회 공식 점수제 판정');
      return;
    }

    // 2. 양측 핵심 공격 기물(차, 포, 마, 상) 전멸 시 외통 불능 점수제 판정
    if (hasInsufficientMaterial(newBoard)) {
      soundEffects.playVictory();
      const finalScore = calculateJanggiScore(newBoard, cols, rows);
      setWinner(finalScore.leader);
      setWinReason('양측 공격 기물 소진 (외통 불능) — 공식 점수제 판정');
      return;
    }

    // 3. 동일 국면 3회 반복(삼복수) 감지
    const currentHash = getBoardHash(newBoard, nextTurn);
    const hashOccurrences = boardHashes.filter((h) => h === currentHash).length;
    if (hashOccurrences >= 2) {
      soundEffects.playVictory();
      setWinner('draw');
      setWinReason('동일 국면 3회 반복 (한국장기협회 공식 삼복수 무승부)');
      return;
    }
    setBoardHashes((prev) => [...prev, currentHash]);

    // 4. 장군(Check) 판별
    const checkOnOpponent = isCheck(newBoard, nextTurn, cols, rows);
    setIsCheckState(checkOnOpponent);

    if (checkOnOpponent) {
      soundEffects.playCheck();
      setJanggunAttacker(currentTurn);

      // 외통수(Checkmate) 체크: 다음 턴 상대가 둘 수 있는 합법 수가 전혀 없는가?
      const opponentMoves = getAllLegalMoves(newBoard, nextTurn, cols, rows);
      if (opponentMoves.length === 0) {
        soundEffects.playCheckmate();
        setCheckmateWinner(currentTurn);
        setWinner(currentTurn);
        setWinReason(`외통수(外痛手)! ${currentTurn === 'cho' ? '초(楚)' : '한(漢)'} 완승`);

        if (currentTurn === playerSide) {
          setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onDefeat));
        } else {
          setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onVictory));
        }
        return;
      } else {
        // 장군 시 AI 대사
        if (currentTurn !== playerSide) {
          setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onCheck));
        } else {
          setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onInCheck));
        }
      }
    } else {
      setJanggunAttacker(null);
      if (targetPiece) {
        if (currentTurn !== playerSide) {
          setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onCapture));
        } else {
          setAiDialogue(getRandomLine(AI_PERSONAS[aiDifficulty].onInCheck));
        }
      }
    }

    // 5. 빅장(Face-to-Face King) 체크: 두 궁이 마주보면 무승부 제안 모달 트리거
    if (isBigjang(newBoard, cols, rows)) {
      soundEffects.playCheck();
      setIsBigjangModalOpen(true);
    }

    setCurrentTurn(nextTurn);
  };

  // 플레이어 기물 선택
  const handleSelectPiece = (pos: Position) => {
    if (!isGameStarted || isSetupOpen || winner || isAiThinking) return;
    const piece = board[pos.y][pos.x];

    // 현재 턴의 아군 기물 선택
    if (piece && piece.side === currentTurn) {
      soundEffects.playSnap();
      setSelectedPos(pos);
      const moves = getValidMovesForPiece(board, pos, cols, rows);
      setValidMoves(moves);
    } else if (selectedPos) {
      // 빈 칸이나 상대 기물 클릭 시 (유효 이동 경로인 경우 이동)
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
    soundEffects.playSnap();
    const nextTurn: Side = currentTurn === 'cho' ? 'han' : 'cho';
    setCurrentTurn(nextTurn);
    setSelectedPos(null);
    setValidMoves([]);
    setTimeRemaining(gameMode === 'mini' ? 15 : 30);
  };

  // 무르기 (Undo) - 최대 3회
  const handleUndo = () => {
    if (!isGameStarted || isSetupOpen || undoHistory.length === 0 || undoCount >= 3 || isAiThinking) return;
    soundEffects.playSnap();

    // AI 대국일 경우 내 수와 AI 수 2수를 되돌림
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
      setUndoHistory(newHistory);
      setUndoCount((prev) => prev + 1);
      setSelectedPos(null);
      setValidMoves([]);
      setIsCheckState(isCheck(lastState.board, lastState.turn, cols, rows));
      setWinner(null);
    }
  };

  // 힌트 보기
  const handleHint = () => {
    if (winner || isAiThinking) return;
    soundEffects.playSnap();

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

  // 새 대국 시작 모달 열기 (난이도 및 진영/상차림 선택)
  const handleOpenNewGame = () => {
    soundEffects.playSnap();
    setIsStartModalMode(true);
    setIsSetupOpen(true);
  };

  // 상차림/설정 모달 열기
  const handleOpenSetup = () => {
    soundEffects.playSnap();
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
          sajuBuff={sajuBuff}
          onToggleMute={handleToggleMute}
          onOpenRules={() => setIsRuleOpen(true)}
          onSelectMode={handleSelectMode}
        />

        {/* 상시 고정 대국 상태 브리핑 바 (Zero Layout Shift - 화면 덜컹거림 100% 방지) */}
        <div
          className={`w-full h-10 min-h-[40px] max-h-[40px] px-2.5 rounded-xl border flex items-center justify-between transition-colors duration-200 select-none shadow-xs box-border overflow-hidden ${
            !isGameStarted
              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
              : isCheckState
              ? 'bg-rose-50/95 border-rose-300 text-rose-900'
              : isAiThinking
              ? 'bg-indigo-50/95 border-indigo-300 text-indigo-900'
              : currentTurn === playerSide
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-slate-100/90 border-slate-200 text-slate-700'
          }`}
        >
          {/* 좌측: 실시간 국면 및 AI 수읽기 / 리액션 말풍선 브리핑 */}
          <div className="flex items-center gap-1.5 overflow-hidden text-xs font-black truncate flex-1 mr-2">
            <span className="text-sm shrink-0" title={`${AI_PERSONAS[aiDifficulty]?.name} (${AI_PERSONAS[aiDifficulty]?.title})`}>
              {AI_PERSONAS[aiDifficulty]?.avatar}
            </span>
            {!isGameStarted ? (
              <span className="truncate text-amber-900">
                {AI_PERSONAS[aiDifficulty]?.name}: "{AI_PERSONAS[aiDifficulty]?.greeting}"
              </span>
            ) : isCheckState ? (
              <>
                <i className="fas fa-exclamation-triangle text-rose-600 animate-bounce text-xs shrink-0"></i>
                <span className="truncate">
                  {AI_PERSONAS[aiDifficulty]?.name}: "{aiDialogue || (currentTurn === playerSide ? '장군 위기! 왕을 피하세요!' : '외통의 길목이오, 장군!')}"
                </span>
              </>
            ) : isAiThinking ? (
              <>
                <i className="fas fa-microchip text-indigo-600 animate-spin text-xs shrink-0"></i>
                <span className="truncate animate-pulse text-indigo-950">
                  {AI_PERSONAS[aiDifficulty]?.name}: "{aiDialogue || '수읽기 연산 중...'}"
                </span>
              </>
            ) : (
              <span className="truncate">
                {AI_PERSONAS[aiDifficulty]?.name}: "{aiDialogue || (currentTurn === playerSide ? '당신의 차례입니다. 신중히 두세요.' : '수를 준비 중입니다.')}"
              </span>
            )}
          </div>

          {/* 우측: 현재 AI 대국 난이도 고정 뱃지 (대국 중 실시간 변경 방지) */}
          <div
            title={`상대: ${AI_PERSONAS[aiDifficulty]?.name} (${AI_PERSONAS[aiDifficulty]?.title}) - ${DIFFICULTY_INFO[aiDifficulty]?.label}`}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-[11px] font-black border select-none shrink-0 shadow-xs ${
              DIFFICULTY_INFO[aiDifficulty]?.color || 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            <span>{DIFFICULTY_INFO[aiDifficulty]?.badge}</span>
          </div>
        </div>

        {/* 메인 장기판 (9x10 또는 7x7 보드) */}
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
            onSelectPiece={handleSelectPiece}
            onMakeMove={handleMakeMove}
          />

          {/* 중앙 시네마틱 '장군(將軍)!' 팝업 배너 */}
          {janggunAttacker && !checkmateWinner && (
            <JanggunBanner
              attacker={janggunAttacker}
              onClose={() => setJanggunAttacker(null)}
            />
          )}

          {/* 피날레 '외통수(外痛手)!' 시네마틱 배너 */}
          {checkmateWinner && (
            <CheckmateBanner
              winner={checkmateWinner}
              playerSide={playerSide}
              onClose={() => setCheckmateWinner(null)}
            />
          )}
        </div>

        {/* 점수 & 국면 현황 & 포획 기물 트레이 */}
        <StatusInsightPanel
          score={score}
          moveCount={moveCount}
          capturedByCho={capturedByCho}
          capturedByHan={capturedByHan}
          currentMode={gameMode}
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
        winner={winner}
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
