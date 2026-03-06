#!/bin/bash

# 뉴스 자동 수집 스크립트
# 이 스크립트는 cron으로 매 시간마다 실행됩니다

cd /home/user/webapp

echo "[$(date)] 뉴스 자동 수집 시작"

# /api/news/fetch 엔드포인트 호출
for category in general politics economy tech sports entertainment stock; do
  echo "[$(date)] ${category} 카테고리 수집 중..."
  curl -s "http://localhost:3000/api/news/fetch?category=${category}" > /dev/null
  sleep 2
done

echo "[$(date)] 뉴스 자동 수집 완료"
