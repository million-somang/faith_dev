import { type GameStatus } from '../hooks/useMinesweeper';

interface TimerProps {
  mineCount: number;
  flagCount: number;
  elapsedTime: number;
  gameStatus: GameStatus;
  onReset: () => void;
}

export default function Timer({ mineCount, flagCount, elapsedTime, gameStatus, onReset }: TimerProps) {
  const remaining = Math.max(0, mineCount - flagCount);

  const getEmoji = () => {
    switch (gameStatus) {
      case 'won': return '😎';
      case 'lost': return '😵';
      default: return '🙂';
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4 bg-slate-800 rounded-xl">
      {/* 지뢰 카운터 */}
      <div className="segment-counter" title="남은 지뢰">
        {String(remaining).padStart(3, '0')}
      </div>

      {/* 리셋 버튼 */}
      <button
        onClick={onReset}
        className="reset-emoji w-12 h-12 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
        title="새 게임"
      >
        {getEmoji()}
      </button>

      {/* 타이머 */}
      <div className="segment-counter" title="경과 시간">
        {String(Math.min(elapsedTime, 999)).padStart(3, '0')}
      </div>
    </div>
  );
}
