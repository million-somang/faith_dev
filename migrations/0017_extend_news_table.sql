-- 기존 뉴스 테이블에 추가 컬럼 추가
ALTER TABLE news ADD COLUMN content TEXT;
ALTER TABLE news ADD COLUMN thumbnail TEXT;
ALTER TABLE news ADD COLUMN tags TEXT;
ALTER TABLE news ADD COLUMN author TEXT;
ALTER TABLE news ADD COLUMN source TEXT;
ALTER TABLE news ADD COLUMN source_url TEXT;
ALTER TABLE news ADD COLUMN description TEXT;

-- FTS5 가상 테이블 생성
CREATE VIRTUAL TABLE IF NOT EXISTS news_fts USING fts5(
  news_id UNINDEXED,
  title,
  description,
  content,
  tags,
  tokenize='unicode61'
);
