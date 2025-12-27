# 헤더 인증 상태 일관성 가이드라인

## 문제 상황 (Problem)
사용자가 로그인한 상태에서도 특정 페이지에서 "로그인/회원가입" 버튼이 보이는 문제가 반복적으로 발생했습니다. 이는 **Flash of Unstyled Content (FOUC)** 문제로, 페이지가 렌더링된 후 JavaScript가 실행되어 헤더를 업데이트하는 과정에서 발생합니다.

## 근본 원인 (Root Cause)
1. **서버 사이드 렌더링**: 서버에서 HTML을 생성할 때는 LocalStorage에 접근할 수 없어 기본적으로 "로그인 안 된 상태"로 헤더를 생성
2. **스크립트 실행 순서**: `getCommonAuthScript()`가 페이지 하단(`</body>` 직전)에 위치하여, 헤더가 먼저 렌더링되고 나중에 스크립트가 실행됨
3. **타이밍 문제**: 네트워크 속도나 브라우저 성능에 따라 스크립트 실행이 지연될 수 있음

## 해결 방법 (Solution)

### ✅ 표준 패턴
모든 페이지에서 다음 순서를 **반드시 따라야 합니다**:

```typescript
<body class="..." id="html-root">
    ${getCommonAuthScript()}  // 1. 인증 스크립트 먼저
    ${getCommonHeader('섹션명')}  // 2. 헤더
    ${getStickyHeader()}  // 3. Sticky 헤더
    
    <!-- 페이지 콘텐츠 -->
    
    ${getCommonFooter()}  // 마지막에 푸터
</body>
```

### ❌ 잘못된 패턴 (절대 사용 금지)
```typescript
<body>
    ${getCommonHeader('섹션명')}  // ❌ 스크립트보다 먼저
    
    <!-- 페이지 콘텐츠 -->
    
    ${getCommonFooter()}
    ${getCommonAuthScript()}  // ❌ 푸터 다음
</body>
```

## 적용된 페이지
- ✅ `/lifestyle/dday-calculator` (D-Day 매니저)
- ✅ `/lifestyle/pyeong-calculator` (평수 계산기)
- ✅ `/lifestyle/age-calculator` (나이 계산기)

## 새 페이지 추가 시 체크리스트
1. [ ] `<body>` 태그 바로 다음에 `${getCommonAuthScript()}` 추가
2. [ ] 그 다음에 `${getCommonHeader('섹션명')}` 추가
3. [ ] 마지막에 `${getCommonFooter()}` 추가 (AuthScript는 **제외**)
4. [ ] 테스트: 로그인 후 페이지 접속 시 헤더에 "마이페이지/로그아웃" 버튼이 즉시 보이는지 확인

## 기술적 세부사항

### getCommonAuthScript() 함수
이 함수는 다음 작업을 수행합니다:
1. **다크모드 초기화**: LocalStorage에서 다크모드 설정 읽기
2. **로그인 상태 확인**: LocalStorage에서 `auth_token`, `user_email`, `user_level` 읽기
3. **헤더 업데이트**: `user-menu` div의 innerHTML을 동적으로 변경
4. **이벤트 리스너**: 로그아웃, 햄버거 메뉴 버튼 등

### 실행 타이밍
```javascript
// getCommonAuthScript() 내부 코드
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateUserMenu);
} else {
  updateUserMenu();  // 이미 로드된 경우 즉시 실행
}
```

**<body> 바로 다음**에 위치시키면:
- HTML 파서가 `<body>` 태그를 읽자마자 스크립트 실행
- 헤더가 렌더링되기 **전**에 함수 정의가 완료됨
- `DOMContentLoaded` 이벤트 또는 즉시 실행으로 헤더 업데이트

## 문제 발생 시 디버깅
```bash
# 1. 페이지 소스에서 스크립트 순서 확인
curl -s http://localhost:3000/페이지경로 | grep -A 3 '<body'

# 2. authScript가 header보다 먼저 나와야 함
# 출력 예시 (정상):
# <body class="..." id="html-root">
#     <script>
#       // ==================== 다크모드 초기화 ====================
#       function initDarkMode() {

# 3. getCommonAuthScript 호출 횟수 확인 (1번이어야 함)
curl -s http://localhost:3000/페이지경로 | grep -c "function updateUserMenu"
```

## 관련 파일
- `src/index.tsx`: 모든 라우트 정의
- Line 432: `getCommonAuthScript()` 함수 정의
- Line 263: `getCommonHeader()` 함수 정의

## 향후 개선 사항
1. **서버 사이드 인증**: Cloudflare Workers KV나 D1을 사용하여 서버 사이드에서 세션 확인
2. **컴포넌트 추상화**: 공통 레이아웃 컴포넌트로 추출하여 실수 방지
3. **자동 테스트**: E2E 테스트로 로그인 상태 헤더 렌더링 검증

## 참고 자료
- [FOUC (Flash of Unstyled Content) 문제](https://en.wikipedia.org/wiki/Flash_of_unstyled_content)
- Cloudflare Workers LocalStorage 제한사항
- DOM Content Loaded 이벤트 타이밍

---

**마지막 업데이트**: 2025-12-27
**작성자**: Faith Portal 개발팀
