#!/bin/bash

# 1. 로그인
echo "=== 로그인 ==="
LOGIN_RESPONSE=$(curl -s -c /tmp/test-cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}')
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id')
echo "User ID: $USER_ID"

# 2. 좋아요 투표
echo -e "\n=== 좋아요 투표 (newsId=83) ==="
VOTE_UP=$(curl -s -b /tmp/test-cookies.txt -X POST http://localhost:3000/api/news/vote \
  -H "Content-Type: application/json" \
  -d "{\"userId\":$USER_ID,\"newsId\":83,\"voteType\":\"up\"}")
echo "$VOTE_UP" | jq '.'

# 3. 뉴스 상세 조회 (투표 수 확인)
echo -e "\n=== 뉴스 조회 (투표 수 확인) ==="
NEWS=$(curl -s http://localhost:3000/api/news/83)
echo "$NEWS" | jq '{id, title, vote_up, vote_down, popularity_score}'

# 4. 같은 투표 다시 (취소)
echo -e "\n=== 같은 투표 다시 (취소) ==="
VOTE_CANCEL=$(curl -s -b /tmp/test-cookies.txt -X POST http://localhost:3000/api/news/vote \
  -H "Content-Type: application/json" \
  -d "{\"userId\":$USER_ID,\"newsId\":83,\"voteType\":\"up\"}")
echo "$VOTE_CANCEL" | jq '.'

# 5. 취소 후 뉴스 조회
echo -e "\n=== 취소 후 뉴스 조회 ==="
NEWS_AFTER=$(curl -s http://localhost:3000/api/news/83)
echo "$NEWS_AFTER" | jq '{id, title, vote_up, vote_down, popularity_score}'

# 6. 싫어요 투표
echo -e "\n=== 싫어요 투표 ==="
VOTE_DOWN=$(curl -s -b /tmp/test-cookies.txt -X POST http://localhost:3000/api/news/vote \
  -H "Content-Type: application/json" \
  -d "{\"userId\":$USER_ID,\"newsId\":83,\"voteType\":\"down\"}")
echo "$VOTE_DOWN" | jq '.'

# 7. 최종 뉴스 조회
echo -e "\n=== 최종 뉴스 조회 ==="
NEWS_FINAL=$(curl -s http://localhost:3000/api/news/83)
echo "$NEWS_FINAL" | jq '{id, title, vote_up, vote_down, popularity_score}'

