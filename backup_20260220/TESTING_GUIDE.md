# 마이페이지 게임 기록 테스트 가이드

## 테스트 URL
- **메인 페이지**: https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai
- **스도쿠 게임**: https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai/game/simple/sudoku
- **마이페이지**: https://3000-igqqzgkeu63c4u9ihulwt-c81df28e.sandbox.novita.ai/mypage

## 테스트 시나리오

### 1단계: 회원가입/로그인
1. 메인 페이지 접속
2. 상단 네비게이션에서 **로그인/회원가입** 클릭
3. 새 계정으로 회원가입 또는 기존 계정으로 로그인

### 2단계: 스도쿠 게임 플레이
1. **게임** 메뉴 → **심플 게임** → **스도쿠** 클릭
2. 난이도 선택 (Easy, Medium, Hard)
3. **게임 시작** 버튼 클릭
4. 스도쿠 퍼즐을 풀거나 일부만 완료
5. 완료 후 **점수 저장** 버튼 클릭

### 3단계: 마이페이지에서 기록 확인
1. 상단 네비게이션에서 **마이페이지** 클릭
2. 왼쪽 사이드바에서 **게임** 섹션 선택
3. 확인할 항목:
   - **게임 통계**: 스도쿠 최고 점수, 플레이 횟수 표시
   - **최근 플레이**: 스도쿠 게임 기록과 점수 표시

## 디버깅 방법

### 브라우저 개발자 도구
1. F12 키를 눌러 개발자 도구 열기
2. **Console** 탭 선택
3. 다음 로그 확인:
   ```
   🎮 [마이페이지 프론트] 게임 데이터 로딩 시작...
   📡 [마이페이지 프론트] API 요청: /api/user/games/stats
   📦 [마이페이지 프론트] 통계 응답: { ... }
   🎯 [마이페이지 프론트] sudoku 통계: { ... }
   ```

### 쿠키 확인
콘솔에서 다음 명령어 실행:
```javascript
document.cookie
```

세션 ID가 있어야 함: `session_id=xxxxxx`

### API 직접 테스트 (개발자 도구 Console)
```javascript
// 게임 통계 조회
fetch('/api/user/games/stats', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)

// 게임 히스토리 조회
fetch('/api/user/games/history?limit=10', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

## 예상 결과

### 게임 통계 API 응답
```json
{
  "success": true,
  "stats": {
    "sudoku": {
      "best_score": 11550,
      "average_score": 11550,
      "play_count": 1,
      "rank": 1,
      "percentile": 100,
      "last_played": "2026-01-27 16:00:25"
    }
  }
}
```

### 게임 히스토리 API 응답
```json
{
  "success": true,
  "history": {
    "history": [
      {
        "id": 5,
        "user_id": 5,
        "game_type": "sudoku",
        "score": 11550,
        "game_data": "{\"difficulty\":\"medium\",\"time\":180,\"mistakes\":5,\"raw_score\":7700,\"multiplier\":1.5}",
        "played_at": "2026-01-27 16:00:25"
      }
    ],
    "total": 1
  }
}
```

## 점수 계산 로직

스도쿠 점수는 다음과 같이 계산됩니다:

```
기본 점수 = 10000 - (시간 × 10) - (실수 × 100)
최종 점수 = 기본 점수 × 난이도 배수

난이도 배수:
- Easy: 1.0
- Medium: 1.5
- Hard: 2.0
```

예시:
- 시간: 180초
- 실수: 5번
- 난이도: Medium
- 기본 점수: 10000 - (180 × 10) - (5 × 100) = 7700
- 최종 점수: 7700 × 1.5 = 11550점

## 문제 해결

### 로그인 상태인데 "로그인이 필요합니다" 오류
1. 브라우저 쿠키 확인 (`document.cookie`)
2. 세션 만료 여부 확인
3. 로그아웃 후 다시 로그인

### 점수가 저장되지 않음
1. 브라우저 콘솔에서 에러 메시지 확인
2. 네트워크 탭에서 API 응답 확인
3. PM2 로그 확인: `pm2 logs webapp --nostream | grep 스도쿠`

### 마이페이지에 기록이 보이지 않음
1. F5 키로 페이지 새로고침
2. 로그아웃 후 다시 로그인
3. 브라우저 콘솔에서 API 응답 확인
4. 다른 브라우저에서 테스트

## 참고 문서
- [SUDOKU_AUTH_FIX.md](./SUDOKU_AUTH_FIX.md) - 스도쿠 인증 수정 내역
- [MYPAGE_GAME_RECORDS_FIX.md](./MYPAGE_GAME_RECORDS_FIX.md) - 마이페이지 게임 기록 수정 내역
- [README.md](./README.md) - 프로젝트 전체 문서

