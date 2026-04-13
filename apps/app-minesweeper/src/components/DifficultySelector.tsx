import { type Difficulty, DIFFICULTY_CONFIG } from '../hooks/useMinesweeper';

interface DifficultySelectorProps {
  current: Difficulty;
  onChange: (d: Difficulty) => void;
  disabled?: boolean;
}

const difficulties: Difficulty[] = ['beginner', 'intermediate', 'expert'];

export default function DifficultySelector({ current, onChange, disabled }: DifficultySelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {difficulties.map(d => {
        const cfg = DIFFICULTY_CONFIG[d];
        const isActive = current === d;
        return (
          <button
            key={d}
            className={`difficulty-tab ${isActive ? 'active' : ''}`}
            onClick={() => onChange(d)}
            disabled={disabled}
          >
            <span className="mr-1">{cfg.icon}</span>
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
