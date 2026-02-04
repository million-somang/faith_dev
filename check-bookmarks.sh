#!/bin/bash

echo "========================================="
echo "실시간 북마크 상태 확인"
echo "========================================="

node << 'SCRIPT'
const Database = require('better-sqlite3');
const db = new Database('faith-portal.db');

console.log('\n📊 전체 사용자 정보:');
const users = db.prepare('SELECT id, email, name FROM users').all();
console.table(users);

console.log('\n📚 사용자별 북마크 개수:');
const bookmarkCounts = db.prepare(`
  SELECT u.id, u.name, u.email, COUNT(b.id) as bookmark_count
  FROM users u
  LEFT JOIN bookmarks b ON u.id = b.user_id
  GROUP BY u.id
`).all();
console.table(bookmarkCounts);

console.log('\n🔖 최근 북마크 5개:');
const recentBookmarks = db.prepare(`
  SELECT 
    b.id, b.user_id, b.news_id, 
    u.name as user_name,
    n.title,
    b.bookmarked_at
  FROM bookmarks b
  JOIN users u ON b.user_id = u.id
  JOIN news n ON b.news_id = n.id
  ORDER BY b.bookmarked_at DESC
  LIMIT 5
`).all();

recentBookmarks.forEach(bm => {
  console.log(`- [${bm.user_name}] ${bm.title.substring(0, 50)}... (${bm.bookmarked_at})`);
});

db.close();
SCRIPT

echo ""
echo "========================================="
