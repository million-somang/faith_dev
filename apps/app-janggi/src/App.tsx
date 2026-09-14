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
} from './types/janggi';
import {
  createClassicBoard,
  createMiniBoard,
  getValidMovesForPiece,
  isCheck,
  isBigjang,
  calculateJanggiScore,
  getAllLegalMoves,
} from './logic/janggiRules';
import { findBestMove } from './logic/janggiAi';
import { getDailyPuzzle, JanggiPuzzle } from './data/dailyPuzzles';
import { getTodaySajuBuff } from './utils/sajuCalculator';
import { soundEffects } from './utils/soundEffects';

// Components
import { SplashScreen } from './components/SplashScreen';
import { GameHeader } from './components/GameHeader';
import { JanggiBoard } from './components/JanggiBoard';
import { GameControls } from './components/GameControls';
import { StatusInsightPanel } from './components/StatusInsightPanel';
import { VictoryModal } from './components/VictoryModal';
import { SetupModal } from './components/SetupModal';
import { RuleGuideModal } from './components/RuleGuideModal';

export function App() {
  // 1. 초기 3초 스플래시 상태 (miniapp.md 필수 규격)
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // 2. 대국 모드 및 설정 상태
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [choSetup, setChoSetup] = useState<SetupType>('masangsangma');
  const [hanSetup, setHanSetup] = useState<SetupType>('masangsangma');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('normal');
  const [playerSide, setPlayerSide] = useState<Side>('cho'); // 유저 진영 (기본 초 선공)

  // 3. 보드 및 턴 상태
  const cols = gameMode === 'mini' ? 7 : 9;
  const rows = gameMode === 'mini' ? 7 : 10;
  const [board, setBoard] = useState<(Piece | null)[][]>(() => createClassicBoard('masangsangma', 'masangsangma'));
  const [currentTurn, setCurrentTurn] = useState<Side>('cho');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);

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
  const initGame = useCallback((mode = gameMode, cSetup = choSetup, hSetup = hanSetup) => {
    setSelectedPos(null);
    setValidMoves([]);
    setLastMove(null);
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

  // 모드 변경 처리
  const handleSelectMode = (newMode: GameMode) => {
    soundEffects.playSnap();
    setGameMode(newMode);
    initGame(newMode, choSetup, hanSetup);
  };

  // 타이머 틱 처리
  useEffect(() => {
    if (showSplash || winner || isAiThinking) return;

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
  }, [showSplash, winner, isAiThinking, currentTurn, gameMode]);

  // AI 자동 착수 루프
  useEffect(() => {
    if (showSplash || winner || isAiThinking) return;

    // 1인용 AI 대국 모드: 상대방 턴일 때 AI 작동
    const isAiTurn = currentTurn !== playerSide && gameMode !== 'puzzle';

    if (isAiTurn) {
      setIsAiThinking(true);
      const thinkDuration = aiDifficulty === 'hard' ? 700 : aiDifficulty === 'normal' ? 500 : 350;

      const timer = setTimeout(() => {
        const bestMove = findBestMove(board, currentTurn, aiDifficulty, cols, rows);

        if (!bestMove) {
          // AI가 둘 수 있는 수가 없음 -> 외통수 패배
          const winSide: Side = currentTurn === 'cho' ? 'han' : 'cho';
          setWinner(winSide);
          setWinReason(`외통수 (장군을 피할 수 없음)`);
          soundEffects.playVictory();
          setIsAiThinking(false);
          return;
        }

        // AI 착수 실행
        executeMove(bestMove.from, bestMove.to, true);
        setIsAiThinking(false);
      }, thinkDuration);

      return () => clearTimeout(timer);
    }
  }, [board, currentTurn, playerSide, winner, showSplash, isAiThinking, aiDifficulty, gameMode, cols, rows]);

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
    setMoveCount((prev) => prev + 1);
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

    // 장군(Check) 판별
    const checkOnOpponent = isCheck(newBoard, nextTurn, cols, rows);
    setIsCheckState(checkOnOpponent);

    if (checkOnOpponent) {
      soundEffects.playCheck();
      // 외통수(Checkmate) 체크: 다음 턴 상대가 둘 수 있는 합법 수가 전혀 없는가?
      const opponentMoves = getAllLegalMoves(newBoard, nextTurn, cols, rows);
      if (opponentMoves.length === 0) {
        soundEffects.playVictory();
        setWinner(currentTurn);
        setWinReason(`외통수! ${currentTurn === 'cho' ? '초(楚)' : '한(漢)'} 완승`);
        return;
      }
    }

    // 빅장(대치) 체크
    if (isBigjang(newBoard, cols, rows)) {
      // 빅장 상태 알림
    }

    setCurrentTurn(nextTurn);
  };

  // 플레이어 기물 선택
  const handleSelectPiece = (pos: Position) => {
    if (winner || isAiThinking) return;
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
    if (!selectedPos || winner || isAiThinking) return;
    executeMove(selectedPos, to, false);
  };

  // 한수 쉼 (Pass)
  const handlePass = () => {
    if (winner || isAiThinking) return;
    soundEffects.playSnap();
    const nextTurn: Side = currentTurn === 'cho' ? 'han' : 'cho';
    setCurrentTurn(nextTurn);
    setSelectedPos(null);
    setValidMoves([]);
    setTimeRemaining(gameMode === 'mini' ? 15 : 30);
  };

  // 무르기 (Undo) - 최대 3회
  const handleUndo = () => {
    if (undoHistory.length === 0 || undoCount >= 3 || isAiThinking) return;
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
      setUndoHistory(newHistory);
      setUndoCount((prev) => prev + 1);
      setSelectedPos(null);
      setValidMoves([]);
      setIsCheckState(false);
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

  return (
    <div className="w-full min-h-screen bg-slate-100 flex flex-col items-center justify-start py-1 px-1 sm:py-3 sm:px-4">
      {/* 3초 필수 스플래시 인트로 (miniapp.md 규격 준수) */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

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

        {/* AI 생각 중 안내 뱃지 */}
        {isAiThinking && (
          <div className="w-full py-1 px-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center gap-2 text-indigo-700 text-xs font-black animate-pulse">
            <i className="fas fa-microchip text-indigo-500"></i>
            <span>베라 AI 인공지능이 최적의 묘수를 연산 중입니다...</span>
          </div>
        )}

        {/* 메인 장기판 (9x10 또는 7x7 보드) */}
        <div data-screenshot-target="janggi-board" className="flex items-center justify-center w-full">
          <JanggiBoard
            board={board}
            cols={cols}
            rows={rows}
            selectedPos={selectedPos}
            validMoves={validMoves}
            lastMove={lastMove}
            isCheckSide={isCheckState ? currentTurn : null}
            currentTurn={currentTurn}
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
            onOpenSetup={() => setIsSetupOpen(true)}
            onNewGame={() => initGame()}
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
        onRestart={() => initGame()}
        onNewGame={() => initGame()}
      />

      {/* 대국 상차림 & AI 난이도 설정 모달 */}
      <SetupModal
        isOpen={isSetupOpen}
        choSetup={choSetup}
        hanSetup={hanSetup}
        aiDifficulty={aiDifficulty}
        playerSide={playerSide}
        onClose={() => setIsSetupOpen(false)}
        onSave={(opts) => {
          setChoSetup(opts.choSetup);
          setHanSetup(opts.hanSetup);
          setAiDifficulty(opts.aiDifficulty);
          setPlayerSide(opts.playerSide);
          initGame(gameMode, opts.choSetup, opts.hanSetup);
        }}
      />

      {/* 장기 규칙 및 행마법 도움말 모달 */}
      <RuleGuideModal isOpen={isRuleOpen} onClose={() => setIsRuleOpen(false)} />
    </div>
  );
}

export default App;
