#!/bin/bash

echo "=== 헤더 인증 스크립트 테스트 ==="
echo ""

# D-Day 페이지 테스트
echo "✅ D-Day 페이지 테스트..."
result=$(curl -s http://localhost:3000/lifestyle/dday-calculator | grep -A 2 '<body' | grep -c "function initDarkMode")
if [ "$result" -eq 1 ]; then
    echo "   ✓ D-Day: authScript가 body 바로 다음에 있음"
else
    echo "   ✗ D-Day: authScript 위치 문제"
fi

# 평수 계산기 테스트
echo "✅ 평수 계산기 테스트..."
result=$(curl -s http://localhost:3000/lifestyle/pyeong-calculator | grep -A 2 '<body' | grep -c "function initDarkMode")
if [ "$result" -eq 1 ]; then
    echo "   ✓ 평수 계산기: authScript가 body 바로 다음에 있음"
else
    echo "   ✗ 평수 계산기: authScript 위치 문제"
fi

# 나이 계산기 테스트
echo "✅ 나이 계산기 테스트..."
result=$(curl -s http://localhost:3000/lifestyle/age-calculator | grep -A 2 '<body' | grep -c "function initDarkMode")
if [ "$result" -eq 1 ]; then
    echo "   ✓ 나이 계산기: authScript가 body 바로 다음에 있음"
else
    echo "   ✗ 나이 계산기: authScript 위치 문제"
fi

echo ""
echo "=== 테스트 완료 ==="
