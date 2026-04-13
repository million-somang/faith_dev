import { type GameStatus } from '../hooks/useMinesweeper';

interface GameOverModalProps {
  gameStatus: GameStatus;
  elapsedTime: number;
  difficulty: string;
  onReset: () => void;
  onSaveScore: () => void;
  isSaving: boolean;
  saveResult: { success: boolean; message: string } | null;
}

export default function GameOverModal({
  gameStatus,
  elapsedTime,
  difficulty,
  onReset,
  onSaveScore,
  isSaving,
  saveResult,
}: GameOverModalProps) {
  if (gameStatus !== 'won' && gameStatus !== 'lost') return null;

  const isWin = gameStatus === 'won';

  const diffLabel = {
    beginner: '초급',
    intermediate: '중급',
    expert: '고급',
  }[difficulty] ?? difficulty;

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    if (min > 0) return `${min}분 ${sec}초`;
    return `${sec}초`;
  };

  return (
    <div className="modal-overlay" onClick={onReset}>
      <div
        className="modal-card bg-white rounded-2xl p-6 max-w-sm w-[90%] mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 타이틀 */}
        <div className="text-center mb-4">
          <div className="text-5xl mb-3">{isWin ? '🎉' : '💥'}</div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isWin ? '클리어!' : '게임 오버'}
          </h2>
        </div>

        {/* 결과 정보 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>난이도</span>
            <span className="font-semibold text-gray-800">{diffLabel}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>시간</span>
            <span className="font-bold text-red-600 text-lg">{formatTime(elapsedTime)}</span>
          </div>
        </div>

        {/* 점수 저장 (승리 시만) */}
        {isWin && !saveResult && (
          <button
            onClick={onSaveScore}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold text-base hover:from-green-600 hover:to-emerald-700 transition-all mb-3 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? '저장 중...' : '🏆 기록 저장하기'}
          </button>
        )}

        {/* 저장 결과 */}
        {saveResult && (
          <div className={`text-center text-sm mb-3 py-2 px-3 rounded-lg ${
            saveResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {saveResult.message}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all cursor-pointer"
          >
            다시하기
          </button>
        </div>
      </div>
    </div>
  );
}
