-- 스도쿠 점수 테이블에 mistakes와 player_name 컬럼 추가
ALTER TABLE sudoku_scores ADD COLUMN mistakes INTEGER DEFAULT 0;
ALTER TABLE sudoku_scores ADD COLUMN player_name TEXT;
