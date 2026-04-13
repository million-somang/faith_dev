import { type CellState, type GameStatus } from '../hooks/useMinesweeper';

interface GameBoardProps {
  board: CellState[][];
  cols: number;
  gameStatus: GameStatus;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
}

export default function GameBoard({
  board,
  cols,
  gameStatus,
  onReveal,
  onFlag,
  onChord,
}: GameBoardProps) {
  const handleContextMenu = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    onFlag(row, col);
  };

  const handleClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    const cell = board[row][col];

    // 이미 열린 셀 클릭 → chording
    if (cell.isRevealed && cell.adjacentMines > 0) {
      onChord(row, col);
      return;
    }

    onReveal(row, col);
  };

  const getCellContent = (cell: CellState): string => {
    if (cell.isFlagged && !cell.isRevealed) return '🚩';
    if (!cell.isRevealed) return '';

    // 잘못된 깃발
    if (cell.isFlagged && !cell.isMine && cell.isRevealed) return '❌';

    if (cell.isMine) return '💣';
    if (cell.adjacentMines === 0) return '';
    return String(cell.adjacentMines);
  };

  const getCellClass = (cell: CellState, row: number, col: number): string => {
    let cls = 'cell';

    if (cell.isRevealed) {
      cls += ' revealed';
      if (cell.isMine) {
        cls += ' mine-exploded';
      } else if (cell.adjacentMines > 0) {
        cls += ` num-${cell.adjacentMines}`;
      }
      if (cell.isFlagged && !cell.isMine) {
        cls += ' wrong-flag';
      }
    } else if (cell.isFlagged) {
      cls += ' flagged';
    }

    return cls;
  };

  return (
    <div className="flex justify-center overflow-auto py-2">
      <div
        className="board-container"
        style={{ gridTemplateColumns: `repeat(${cols}, 32px)` }}
        onContextMenu={e => e.preventDefault()}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={getCellClass(cell, r, c)}
              onClick={e => handleClick(e, r, c)}
              onContextMenu={e => handleContextMenu(e, r, c)}
            >
              {getCellContent(cell)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
