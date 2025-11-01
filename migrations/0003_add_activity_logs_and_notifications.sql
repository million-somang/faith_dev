-- 활동 로그 테이블 생성
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 알림 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_user_id INTEGER,
  is_read INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'normal',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (target_user_id) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

CREATE INDEX IF NOT EXISTS idx_notifications_target_user_id ON notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 활동 로그 타입:
-- 'login' - 로그인
-- 'signup' - 회원가입
-- 'profile_update' - 프로필 수정
-- 'password_change' - 비밀번호 변경
-- 'admin_action' - 관리자 작업

-- 알림 타입:
-- 'new_signup' - 신규 가입
-- 'suspicious_activity' - 의심스러운 활동
-- 'user_suspended' - 회원 정지
-- 'user_deleted' - 회원 삭제
-- 'system' - 시스템 알림
