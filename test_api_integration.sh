#!/bin/bash

echo "=========================================="
echo "마이페이지 API 통합 테스트"
echo "=========================================="
echo ""

# 쿠키 파일
COOKIE_FILE="/tmp/cookies.txt"

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 테스트 결과 카운터
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 테스트 함수
test_api() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=${5:-200}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${YELLOW}테스트 #${TOTAL_TESTS}: ${test_name}${NC}"
    
    if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -b $COOKIE_FILE -X $method "http://localhost:3000${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -b $COOKIE_FILE -X $method "http://localhost:3000${endpoint}" \
            -H "Content-Type: application/json" -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "$body"
    fi
    echo ""
}

echo "1️⃣  로그인 테스트"
echo "=========================================="
test_api "사용자 로그인" "POST" "/api/auth/login" '{"email":"sukman@naver.com","password":"1234"}' 200
sleep 1

echo ""
echo "2️⃣  뉴스 API 테스트"
echo "=========================================="
test_api "키워드 목록 조회" "GET" "/api/user/keywords"
test_api "북마크 목록 조회" "GET" "/api/user/bookmarks?page=1&limit=10"
test_api "키워드별 뉴스 조회" "GET" "/api/user/news/by-keyword?keyword=AI&page=1&limit=5"

echo ""
echo "3️⃣  주식 API 테스트"
echo "=========================================="
test_api "관심 종목 목록 조회" "GET" "/api/user/watchlist"
test_api "주식 알림 목록 조회" "GET" "/api/user/watchlist/alerts"
test_api "포트폴리오 통계 조회" "GET" "/api/user/watchlist/stats"

echo ""
echo "4️⃣  게임 API 테스트"
echo "=========================================="
test_api "게임 통계 조회" "GET" "/api/user/games/stats"
test_api "게임 히스토리 조회" "GET" "/api/user/games/history?game_type=number_guess&page=1&limit=10"
test_api "게임 리더보드 조회" "GET" "/api/games/leaderboard?game_type=number_guess&limit=10"

echo ""
echo "5️⃣  유틸 API 테스트"
echo "=========================================="
test_api "유틸 설정 조회" "GET" "/api/user/utils/settings"
test_api "유틸 히스토리 조회" "GET" "/api/user/utils/history?util_type=calculator&page=1&limit=10"

echo ""
echo "=========================================="
echo "테스트 결과 요약"
echo "=========================================="
echo -e "총 테스트: ${TOTAL_TESTS}"
echo -e "${GREEN}통과: ${PASSED_TESTS}${NC}"
echo -e "${RED}실패: ${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 모든 테스트 통과!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  일부 테스트 실패${NC}"
    exit 1
fi
