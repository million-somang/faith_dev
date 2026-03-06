// 스도쿠 게임 로직 유틸리티

export type Difficulty = 'easy' | 'medium' | 'hard';
export type CellValue = number | null;
export type Board = CellValue[][];

/** 9x9 빈 보드 생성 */
function createEmptyBoard(): Board {
    return Array.from({ length: 9 }, () => Array(9).fill(null));
}

/** 해당 위치에 값을 놓을 수 있는지 검증 */
function isValid(board: Board, row: number, col: number, num: number): boolean {
    // 행 검사
    for (let c = 0; c < 9; c++) {
        if (board[row][c] === num) return false;
    }
    // 열 검사
    for (let r = 0; r < 9; r++) {
        if (board[r][col] === num) return false;
    }
    // 3x3 박스 검사
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if (board[r][c] === num) return false;
        }
    }
    return true;
}

/** 백트래킹을 이용한 보드 솔빙 */
function solve(board: Board): boolean {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === null) {
                // 1~9 순서를 셔플하여 랜덤성 확보
                const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                for (const num of nums) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (solve(board)) return true;
                        board[row][col] = null;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

/** 배열 셔플 (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/** 난이도별 제거할 셀 수 */
function getCellsToRemove(difficulty: Difficulty): number {
    switch (difficulty) {
        case 'easy': return 35;
        case 'medium': return 45;
        case 'hard': return 55;
    }
}

/** 새 스도쿠 퍼즐 생성 */
export function generatePuzzle(difficulty: Difficulty): { puzzle: Board; solution: Board } {
    const solution = createEmptyBoard();
    solve(solution);

    // 퍼즐 생성: solution 복사 후 셀 제거
    const puzzle: Board = solution.map(row => [...row]);
    const cellsToRemove = getCellsToRemove(difficulty);

    const positions = shuffle(
        Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
    );

    for (let i = 0; i < cellsToRemove; i++) {
        const [row, col] = positions[i];
        puzzle[row][col] = null;
    }

    return { puzzle, solution };
}

/** 보드가 완성되었는지 확인 */
export function isBoardComplete(board: Board): boolean {
    return board.every(row => row.every(cell => cell !== null));
}

/** 보드가 정답인지 확인 */
export function isBoardCorrect(board: Board, solution: Board): boolean {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] !== solution[r][c]) return false;
        }
    }
    return true;
}

/** 특정 셀이 에러인지 확인 (현재 보드 기준 중복 검사) */
export function hasConflict(board: Board, row: number, col: number): boolean {
    const val = board[row][col];
    if (val === null) return false;

    // 행 중복
    for (let c = 0; c < 9; c++) {
        if (c !== col && board[row][c] === val) return true;
    }
    // 열 중복
    for (let r = 0; r < 9; r++) {
        if (r !== row && board[r][col] === val) return true;
    }
    // 3x3 중복
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if (r !== row && c !== col && board[r][c] === val) return true;
        }
    }
    return false;
}

/** 난이도 한글 라벨 */
export function getDifficultyLabel(d: Difficulty): string {
    switch (d) {
        case 'easy': return '쉬움';
        case 'medium': return '보통';
        case 'hard': return '어려움';
    }
}
