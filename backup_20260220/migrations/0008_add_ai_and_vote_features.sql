-- AI 요약 및 감정 분석 필드 추가
ALTER TABLE news ADD COLUMN ai_summary TEXT;
ALTER TABLE news ADD COLUMN sentiment TEXT; -- 'positive', 'negative', 'neutral'
ALTER TABLE news ADD COLUMN ai_processed INTEGER DEFAULT 0; -- AI 처리 완료 여부

-- 투표 및 참여 필드 추가
ALTER TABLE news ADD COLUMN vote_up INTEGER DEFAULT 0;
ALTER TABLE news ADD COLUMN vote_down INTEGER DEFAULT 0;
ALTER TABLE news ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE news ADD COLUMN comment_count INTEGER DEFAULT 0;

-- 인기도 점수 (랭킹용)
ALTER TABLE news ADD COLUMN popularity_score INTEGER DEFAULT 0;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_news_vote_up ON news(vote_up DESC);
CREATE INDEX IF NOT EXISTS idx_news_popularity ON news(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_ai_processed ON news(ai_processed);
