import { useState, useCallback } from 'react';
import { MiniAppLayout, useAuth, usePortalMessenger } from '@faithportal/mini-app-sdk';
import { useMinesweeper } from './hooks/useMinesweeper';
import GameBoard from './components/GameBoard';
import DifficultySelector from './components/DifficultySelector';
import Timer from './components/Timer';
import GameOverModal from './components/GameOverModal';
import LeaderboardModal from './components/LeaderboardModal';
import axios from 'axios';

function App() {
  const { user, isLoading } = useAuth();
  const { sendToPortal } = usePortalMessenger();

  const {
    board,
    difficulty,
    config,
    gameStatus,
    elapsedTime,
    flagCount,
    revealCell,
    toggleFlag,
    chording,
    initGame,
    changeDifficulty,
  } = useMinesweeper();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  // 점수 저장
  const handleSaveScore = useCallback(async () => {
    if (!user) {
      setSaveResult({ success: false, message: '로그인이 필요합니다. 로그인 후 다시 시도해주세요.' });
      return;
    }

    setIsSaving(true);
    try {
      const score = Math.max(0, 10000 - (elapsedTime * 10));
      const res = await axios.post('/api/games/minesweeper/score', {
        score,
        metadata: { difficulty, time: elapsedTime },
      }, {
        withCredentials: true,
      });

      if (res.data.success) {
        setSaveResult({ success: true, message: '🎉 기록이 저장되었습니다!' });
        sendToPortal('MISSION_CLEAR');
      } else {
        setSaveResult({ success: false, message: res.data.message || '저장에 실패했습니다.' });
      }
    } catch (err: any) {
      const msg = err.response?.status === 401
        ? '로그인이 필요합니다. 로그인 페이지로 이동해주세요.'
        : '저장 중 오류가 발생했습니다.';
      setSaveResult({ success: false, message: msg });
    } finally {
      setIsSaving(false);
    }
  }, [user, difficulty, elapsedTime, sendToPortal]);

  // 게임 리셋
  const handleReset = useCallback(() => {
    initGame();
    setSaveResult(null);
    setIsSaving(false);
  }, [initGame]);

  if (isLoading) {
    return (
      <MiniAppLayout title="스피드 지뢰찾기">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-slate-500">
            <div className="animate-spin text-4xl mb-3">💣</div>
            <p>로딩 중...</p>
          </div>
        </div>
      </MiniAppLayout>
    );
  }

  return (
    <MiniAppLayout title="스피드 지뢰찾기">
      <div className="flex flex-col items-center px-3 py-4 min-h-full bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="w-full max-w-[560px]">
          {/* 타이틀 */}
          <div className="text-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <span>💣</span>
              <span>스피드 지뢰찾기</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">지뢰를 피해 모든 칸을 열어라!</p>
          </div>

          {/* 난이도 선택 */}
          <div className="mb-4">
            <DifficultySelector
              current={difficulty}
              onChange={(d) => {
                changeDifficulty(d);
                setSaveResult(null);
              }}
              disabled={gameStatus === 'playing'}
            />
          </div>

          {/* 타이머 + 지뢰 카운터 */}
          <div className="mb-3">
            <Timer
              mineCount={config.mines}
              flagCount={flagCount}
              elapsedTime={elapsedTime}
              gameStatus={gameStatus}
              onReset={handleReset}
            />
          </div>

          {/* 게임 보드 */}
          <GameBoard
            board={board}
            cols={config.cols}
            gameStatus={gameStatus}
            onReveal={revealCell}
            onFlag={toggleFlag}
            onChord={chording}
          />

          {/* 하단 버튼/안내 */}
          <div className="mt-4 space-y-3">
            {/* 리더보드 버튼 */}
            <button
              onClick={() => setShowLeaderboard(true)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold text-base hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer shadow-md"
            >
              🏆 명예의 전당
            </button>

            {/* 게임 규칙 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-2 text-sm">
                📋 게임 규칙
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-gray-600">
                <div>🖱️ 좌클릭 → 칸 열기</div>
                <div>🚩 우클릭 → 깃발 꽂기</div>
                <div>🔢 열린 숫자 클릭 → Chording</div>
                <div>🛡️ 첫 클릭은 절대 안전!</div>
              </div>
            </div>

            {/* 로그인 안내 */}
            {!user && (
              <p className="text-center text-amber-600 text-xs bg-amber-50 py-2 px-3 rounded-lg">
                ⚡ 로그인하면 기록이 리더보드에 저장됩니다!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 게임 오버 모달 */}
      <GameOverModal
        gameStatus={gameStatus}
        elapsedTime={elapsedTime}
        difficulty={difficulty}
        onReset={handleReset}
        onSaveScore={handleSaveScore}
        isSaving={isSaving}
        saveResult={saveResult}
      />

      {/* 리더보드 모달 */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        difficulty={difficulty}
        onClose={() => setShowLeaderboard(false)}
      />
    </MiniAppLayout>
  );
}

export default App;
