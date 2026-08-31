import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RotateCcw, Lightbulb, Trophy, Sparkles, RefreshCw, HelpCircle, Play, Pause, CheckCircle2, Zap, Lock, Info } from 'lucide-react';
import { useFreeCell } from './hooks/useFreeCell';
import { FreeCellBoard } from './components/FreeCellBoard';
import { LoadingScreen } from './components/LoadingScreen';
import { LeaderboardModal } from './components/LeaderboardModal';

export function App() {
  const {
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
    historyLength,
    isLoading,
    moveRuleMode,
    setMoveRuleMode,
    getMaxMovableCards,
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
  } = useFreeCell();

  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);
  const [hasSavedScore, setHasSavedScore] = useState<boolean>(false);

  const emptyFreecellsCount = freecells.filter(c => c === null).length;
  const emptyTableausCount = tableaus.filter(c => c.length === 0).length;
  const maxMovableClassic = getMaxMovableCards(false);

  // 승리 시 서버에 점수 저장
  useEffect(() => {
    if (isWon && !hasSavedScore) {
      setHasSavedScore(true);
      setIsSavingScore(true);
      const score = Math.max(100, 10000 - (moveCount * 15) - (timeSeconds * 3));

      axios.post('/api/games/freecell/score', {
        score,
        moves: moveCount,
        timeSeconds
      }, { withCredentials: true })
        .then(() => console.log('[FreeCell] Score saved successfully'))
        .catch((err) => console.error('[FreeCell] Score save failed:', err))
        .finally(() => setIsSavingScore(false));
    }
  }, [isWon, hasSavedScore, moveCount, timeSeconds]);

  // 시드 선택기 (MS FreeCell #1 ~ #32000)
  const handleChooseSeed = () => {
    const input = prompt('게임을 선택할 시드 번호를 입력하세요 (1 ~ 32000):', String(gameSeed));
    if (input !== null) {
      const num = parseInt(input.trim(), 10);
      if (!isNaN(num) && num >= 1) {
        setHasSavedScore(false);
        initGame(num);
      } else {
        alert('1 이상의 올바른 숫자를 입력해 주세요.');
      }
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-emerald-950 text-slate-100 flex flex-col font-sans select-none relative overflow-x-hidden">
      {/* 1. Loading Screen */}
      {isLoading && <LoadingScreen seedNum={gameSeed} />}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-emerald-900/90 backdrop-blur-md border-b border-emerald-800/80 px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-emerald-950 font-black shadow-md">
              <i className="fas fa-spade text-base sm:text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-extrabold text-sm sm:text-lg tracking-tight text-white">프리셀</h1>
                <button
                  onClick={handleChooseSeed}
                  className="px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-emerald-200 text-[10px] font-bold border border-emerald-600 transition-colors"
                  title="게임 번호 변경"
                >
                  #{gameSeed}
                </button>
              </div>
            </div>
          </div>

          {/* Center Mode Switcher & Move Limit Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMoveRuleMode(m => {
                  const next = m === 'relaxed' ? 'classic' : 'relaxed';
                  return next;
                });
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm ${
                moveRuleMode === 'relaxed'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-indigo-500/20 border-indigo-400 text-indigo-300 hover:bg-indigo-500/30'
              }`}
              title="클릭하여 이동 규칙 모드 변경 (자유 이동 / 정통 룰)"
            >
              {moveRuleMode === 'relaxed' ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">이동 룰:</span>
                  <span className="font-extrabold text-amber-300">자유 이동 ⚡</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="hidden sm:inline">이동 룰:</span>
                  <span className="font-extrabold text-indigo-300">정통 (최대 {maxMovableClassic}장)</span>
                </>
              )}
            </button>
          </div>

          {/* Right Stats & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Stats Bar */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold bg-emerald-950/80 px-2.5 py-1 sm:py-1.5 rounded-xl border border-emerald-800/60 shadow-inner">
              <div className="flex items-center gap-1">
                <span className="text-emerald-400 text-[10px]">이동</span>
                <span className="text-white font-mono">{moveCount}</span>
              </div>
              <div className="w-px h-3 bg-emerald-800"></div>
              <div className="flex items-center gap-1">
                <span className="text-emerald-400 text-[10px]">시간</span>
                <span className="text-white font-mono">{formatTime(timeSeconds)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowLeaderboard(true)}
              className="p-1.5 sm:p-2 rounded-lg bg-emerald-800/60 hover:bg-emerald-700 text-amber-300 transition-colors"
              title="리더보드 랭킹"
            >
              <Trophy className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-1.5 sm:p-2 rounded-lg bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 transition-colors"
              title="게임 규칙 및 팁"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Board Container */}
      <main className="flex-1 flex flex-col items-center justify-start p-2 sm:p-4 max-w-4xl w-full mx-auto">
        {/* Helper Notification / Hint Banner */}
        {hintMessage && (
          <div className="w-full mb-3 px-4 py-2.5 rounded-xl bg-emerald-900/80 border border-emerald-600/80 text-emerald-100 text-xs flex items-center justify-between shadow-lg animate-fade-in">
            <span className="flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              {hintMessage}
            </span>
          </div>
        )}

        {/* Board Component */}
        <FreeCellBoard
          freecells={freecells}
          foundations={foundations}
          tableaus={tableaus}
          selected={selected}
          onCardClick={handleCardClick}
          onAutoMoveCard={handleAutoMoveCard}
          onFreeCellClick={(idx) => {
            if (selected) moveToFreecell(selected, idx);
          }}
          onFoundationClick={(suit) => {
            if (selected) moveToFoundation(selected, suit);
          }}
          onTableauColClick={(colIdx) => {
            if (selected) moveToTableauCol(selected, colIdx);
          }}
        />
      </main>

      {/* Bottom Floating Control Bar */}
      <footer className="sticky bottom-0 z-30 bg-emerald-900/90 backdrop-blur-md border-t border-emerald-800/80 px-4 py-2.5 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center justify-around gap-2">
          <button
            onClick={undo}
            disabled={historyLength === 0 || isWon}
            className="flex flex-col items-center gap-1 text-slate-200 disabled:opacity-40 hover:text-white transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[10px] font-bold">실행 취소 ({historyLength})</span>
          </button>

          <button
            onClick={tryAutoFoundation}
            disabled={isWon}
            className="flex flex-col items-center gap-1 text-teal-300 hover:text-teal-100 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-bold">자동 올리기</span>
          </button>

          <button
            onClick={findHint}
            disabled={isWon}
            className="flex flex-col items-center gap-1 text-amber-300 hover:text-amber-100 transition-colors"
          >
            <Lightbulb className="w-5 h-5" />
            <span className="text-[10px] font-bold">힌트</span>
          </button>

          <button
            onClick={() => {
              setHasSavedScore(false);
              initGame(Math.floor(Math.random() * 32000) + 1);
            }}
            className="flex flex-col items-center gap-1 text-emerald-300 hover:text-emerald-100 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-[10px] font-bold">새 게임</span>
          </button>
        </div>
      </footer>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-200">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-400" />
              프리셀 규칙 및 카드 이동 가이드
            </h3>
            <div className="text-xs space-y-3.5 leading-relaxed text-slate-300 max-h-96 overflow-y-auto pr-1">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <p className="font-bold text-amber-300 mb-1">⚡ 왜 뭉쳐있는 카드가 2~3장만 가거나 다르게 이동하나요?</p>
                <p className="text-slate-300">
                  1) <strong>도착지 열의 맨 위 카드 숫자</strong>에 따라 연결 가능한 시작 카드가 달라집니다.<br />
                  예: [10-9-8-7] 뭉치가 있을 때, 목적지가 <strong>J(11)</strong>면 <strong>4장 전체</strong>가 이동하지만, 목적지가 <strong>9</strong>면 <strong>[8-7] 2장만</strong> 자동으로 잘려서 붙습니다.
                </p>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <p className="font-bold text-teal-300 mb-1">⚙️ 두 가지 이동 모드 안내</p>
                <p className="mb-1.5">
                  • <strong>자유 이동 모드 (기본 추천 ⚡):</strong> 올바르게 정렬된 카드 뭉치라면 빈 칸 개수에 상관없이 뭉치 전체를 제한 없이 한 번에 옮길 수 있습니다.
                </p>
                <p>
                  • <strong>정통 프리셀 룰 (🔒):</strong> 빈 프리셀 수와 빈 열 수에 따라 한 번에 옮길 수 있는 최대 카드 수(Supermove 공식: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">(1 + 빈 프리셀) × 2^빈 열</code>)가 엄격히 제한됩니다.
                </p>
              </div>

              <p><strong>1. 목적:</strong> 52장 카드를 우측 상단 홈셀(Foundation)로 문양별 A부터 K까지 올려 쌓으면 승리합니다.</p>
              <p><strong>2. 프리셀 (좌측 상단 4칸):</strong> 카드를 1장씩 임시로 보관할 수 있는 공간입니다.</p>
              <p><strong>3. 테이블로 배치:</strong> 검은색과 빨간색을 번갈아가며 내림차순(K ➔ Q ➔ J ➔ 10 ...)으로 정렬합니다.</p>
              <p className="text-emerald-400 font-bold bg-emerald-950 p-2.5 rounded-xl border border-emerald-800">
                💡 팁: 카드를 더블클릭하면 홈셀이나 가장 적절한 열로 즉시 자동 이동합니다!
              </p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
            >
              확인 및 닫기
            </button>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {isWon && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-400/80 rounded-3xl w-full max-w-sm p-6 text-center shadow-[0_0_50px_rgba(251,191,36,0.3)] relative">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 mx-auto mb-4 flex items-center justify-center font-black text-3xl shadow-xl animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">축하합니다! 승리하셨습니다! 🎉</h2>
            <p className="text-xs text-amber-300 mb-6 font-bold">#{gameSeed}번 프리셀 퍼즐 클리어!</p>

            <div className="bg-slate-800/80 rounded-2xl p-4 mb-6 border border-slate-700 flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>이동 횟수:</span>
                <span className="font-bold text-white">{moveCount} 회</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>소요 시간:</span>
                <span className="font-bold text-white">{formatTime(timeSeconds)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>최종 획득 점수:</span>
                <span className="font-black text-emerald-400 text-sm">{Math.max(100, 10000 - (moveCount * 15) - (timeSeconds * 3)).toLocaleString()} 점</span>
              </div>
            </div>

            {isSavingScore && <p className="text-xs text-emerald-400 animate-pulse mb-4">점수 서버 저장 중...</p>}
            {!isSavingScore && <p className="text-xs text-emerald-400 font-bold mb-4 flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" /> 점수가 정상 기록되었습니다!</p>}

            <button
              onClick={() => {
                setHasSavedScore(false);
                initGame(Math.floor(Math.random() * 32000) + 1);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg"
            >
              다음 게임 시작하기
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </div>
  );
}
