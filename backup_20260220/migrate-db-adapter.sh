#!/bin/bash

# Faith Portal - DB Adapter 마이그레이션 스크립트
# c.env.DB를 getDB(c)로 일괄 변경

echo "🔧 데이터베이스 어댑터 마이그레이션 시작..."

# 백업 파일 생성
cp src/index.tsx src/index.tsx.backup
echo "✅ 백업 파일 생성: src/index.tsx.backup"

# c.env.DB를 getDB(c)로 변경
# 1. "const DB = c.env.DB" → "const DB = getDB(c)"
sed -i 's/const DB = c\.env\.DB/const DB = getDB(c)/g' src/index.tsx

# 2. "c.env.DB.prepare" → "DB.prepare" (이미 DB 변수가 있는 경우)
# 이미 "const DB = getDB(c)"가 있으면 사용

# 3. 직접 사용하는 경우: "c.env.DB" → "getDB(c)"
# 단, 이미 변수 선언이 있는 블록은 제외
sed -i 's/await c\.env\.DB\./await DB\./g' src/index.tsx
sed -i 's/c\.env\.DB\./DB\./g' src/index.tsx

# 4. 남아있는 c.env.DB를 getDB(c)로 변경
sed -i 's/c\.env\.DB/getDB(c)/g' src/index.tsx

echo "✅ c.env.DB → getDB(c) 변환 완료"

# 변경 사항 확인
CHANGES=$(diff -u src/index.tsx.backup src/index.tsx | grep "^[-+]" | wc -l)
echo "📊 변경된 라인 수: $CHANGES"

echo ""
echo "✅ 마이그레이션 완료!"
echo ""
echo "📝 다음 단계:"
echo "   1. git diff src/index.tsx  # 변경 사항 확인"
echo "   2. npm run start:prod      # 테스트"
echo "   3. git add src/            # 커밋 준비"
echo ""
