const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let rootDir = process.cwd();
while (!fs.existsSync(path.join(rootDir, 'faith-portal.db')) && rootDir !== path.parse(rootDir).root) {
    rootDir = path.dirname(rootDir);
}
const db = new Database(path.join(rootDir, 'faith-portal.db'));

const fixes = [
    { id: 2, description: '실시간 글자수/바이트/단어 수 계산 및 맞춤법 검사기' },
    { id: 6, description: '개발자를 위한 전문 JSON 포맷터. 실시간 편집, 유효성검사, 트리뷰, YAML/XML/CSV 변환. 100% 클라이언트 처리.' },
    { id: 7, description: '100% 클라이언트 처리 Base64 변환기. 한글 일본어 지원, JWT 자동 디코드, 이미지 변환. 데이터 유출 0%.' },
    { id: 8, description: 'Image to SVG 벡터 변환기. 윤곽선/컬러/일러스트 모드, 커스텀 옵션, Base64 지원. 100% 클라이언트 처리.' },
];

const stmt = db.prepare('UPDATE mini_apps SET description = ? WHERE id = ?');

for (const fix of fixes) {
    stmt.run(fix.description, fix.id);
    console.log(`✅ id=${fix.id}: ${fix.description}`);
}

// 확인
const rows = db.prepare('SELECT id, name, description FROM mini_apps ORDER BY sort_order').all();
console.log('\n=== 수정 후 전체 목록 ===');
rows.forEach(r => console.log(`[${r.id}] ${r.name}: ${r.description}`));

db.close();
console.log('\n✅ 한글 설명 수정 완료!');
