import React, { useState } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import { useOmokGame } from './hooks/useOmokGame';
import { SplashScreen } from './components/SplashScreen';
import { GameHeader } from './components/GameHeader';
import { OmokBoard } from './components/OmokBoard';
import { GameControls } from './components/GameControls';
import { StatusInsightPanel } from './components/StatusInsightPanel';
import { VictoryModal } from './components/VictoryModal';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const {
    board,
    humanPlayer,
    currentTurn,
    difficulty,
    status,
    winningLine,
    lastMove,
    moveHistory,
    isThinking,
    timeElapsed,
    isMuted,
    stats,
    advantage,
    makeMove,
    resetGame,
    undoMove,
    setDifficulty,
    setHumanPlayer,
    toggleMute,
  } = useOmokGame();

  return (
    <MiniAppLayout title="베라오목">
      {/* 1. miniapp.md 기준 3초 스플래시 인트로 로더 */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* 2. 450px × 850px 팝업 풀-하이트 컨테이너 */}
      <main
        data-screenshot-enter
        className="w-full max-w-[450px] min-h-[850px] mx-auto bg-slate-50 flex flex-col justify-between shadow-2xl relative select-none overflow-hidden"
      >
        {/* 상단 헤더: 타이틀, 턴, 난이도 뱃지, 사운드 토글 */}
        <GameHeader
          currentTurn={currentTurn}
          humanPlayer={humanPlayer}
          isThinking={isThinking}
          difficulty={difficulty}
          timeElapsed={timeElapsed}
          moveCount={moveHistory.length}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />

        {/* 중앙 인터랙티브 15×15 원목 오목판 */}
        <div data-screenshot-control className="flex-1 flex flex-col items-center justify-center">
          <OmokBoard
            board={board}
            currentTurn={currentTurn}
            humanPlayer={humanPlayer}
            isThinking={isThinking}
            lastMove={lastMove}
            winningLine={winningLine}
            onCellClick={makeMove}
          />
        </div>

        {/* 조작 컨트롤 바: 새 게임, 무르기, 난이도, 흑/백 선택 */}
        <GameControls
          difficulty={difficulty}
          humanPlayer={humanPlayer}
          isThinking={isThinking}
          canUndo={moveHistory.length > 0}
          onReset={() => resetGame()}
          onUndo={undoMove}
          onSelectDifficulty={setDifficulty}
          onSelectPlayer={setHumanPlayer}
        />

        {/* 하단 풍성한 서브 인포/형세 분석 패널 (850px 하단 데드 스페이스 100% 방지) */}
        <StatusInsightPanel
          advantage={advantage}
          lastMove={lastMove}
          stats={stats}
        />

        {/* 승패 결과 및 축하 폭죽 모달 (마케팅 결과 캡처 data-screenshot-result 포함) */}
        <VictoryModal
          status={status}
          difficulty={difficulty}
          timeElapsed={timeElapsed}
          moveCount={moveHistory.length}
          onRestart={() => resetGame()}
        />
      </main>
    </MiniAppLayout>
  );
}
