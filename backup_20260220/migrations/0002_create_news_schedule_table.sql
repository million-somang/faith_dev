-- 뉴스 자동 가져오기 스케줄 설정 테이블
CREATE TABLE IF NOT EXISTS news_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enabled INTEGER DEFAULT 1, -- 1: 활성화, 0: 비활성화
  schedule_type TEXT DEFAULT 'hourly', -- hourly, daily, custom
  schedule_time TEXT, -- HH:mm 형식 (daily, custom용)
  interval_hours INTEGER DEFAULT 1, -- hourly용 간격 (시간 단위)
  last_run DATETIME, -- 마지막 실행 시간
  next_run DATETIME, -- 다음 실행 예정 시간
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 설정 삽입 (매 1시간마다)
INSERT OR IGNORE INTO news_schedule (id, enabled, schedule_type, interval_hours) 
VALUES (1, 1, 'hourly', 1);
