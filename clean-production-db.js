#!/usr/bin/env node

/**
 * 프로덕션 DB 목업 데이터 삭제 스크립트
 * 
 * 사용법:
 * 1. 프로덕션 서버에 SSH 접속
 * 2. cd ~/faith_dev
 * 3. node clean-production-db.js
 */

const Database = require('better-sqlite3');
const path = require('path');

// DB 파일 경로 (프로덕션)
const dbPath = path.join(__dirname, 'faith-portal.db');

console.log('===========================================');
console.log('  프로덕션 DB 목업 데이터 삭제 스크립트');
console.log('===========================================\n');

try {
  const db = new Database(dbPath);
  
  // 1. 삭제 전 데이터 확인
  console.log('📊 삭제 전 데이터 확인:\n');
  
  const beforeScores = db.prepare('SELECT COUNT(*) as count FROM user_game_scores').get();
  console.log(`user_game_scores: ${beforeScores.count}개`);
  
  const beforeTetris = db.prepare('SELECT COUNT(*) as count FROM tetris_scores').get();
  console.log(`tetris_scores: ${beforeTetris.count}개`);
  
  const beforeSudoku = db.prepare('SELECT COUNT(*) as count FROM sudoku_scores').get();
  console.log(`sudoku_scores: ${beforeSudoku.count}개`);
  
  const before2048 = db.prepare('SELECT COUNT(*) as count FROM game2048_scores').get();
  console.log(`game2048_scores: ${before2048.count}개`);
  
  const beforeMine = db.prepare('SELECT COUNT(*) as count FROM minesweeper_scores').get();
  console.log(`minesweeper_scores: ${beforeMine.count}개`);
  
  // 현재 점수 목록 표시
  console.log('\n현재 저장된 점수:');
  const currentScores = db.prepare(`
    SELECT ugs.id, ugs.user_id, u.name, u.email, ugs.game_type, ugs.score, ugs.played_at
    FROM user_game_scores ugs
    LEFT JOIN users u ON ugs.user_id = u.id
    ORDER BY ugs.played_at DESC
    LIMIT 20
  `).all();
  
  if (currentScores.length === 0) {
    console.log('(점수 없음)');
  } else {
    currentScores.forEach(s => {
      console.log(`  ID ${s.id}: ${s.game_type} ${s.score}점 by ${s.name || s.email} (${s.played_at})`);
    });
  }
  
  // 2. 사용자 확인
  console.log('\n\n👥 등록된 사용자:');
  const users = db.prepare('SELECT id, email, name FROM users ORDER BY id').all();
  users.forEach(u => {
    console.log(`  ID ${u.id}: ${u.name} (${u.email})`);
  });
  
  // 3. 삭제 실행
  console.log('\n\n🗑️  모든 게임 점수 삭제 중...');
  
  const deleteMain = db.prepare('DELETE FROM user_game_scores').run();
  console.log(`✅ user_game_scores: ${deleteMain.changes}개 삭제`);
  
  const deleteTetris = db.prepare('DELETE FROM tetris_scores').run();
  console.log(`✅ tetris_scores: ${deleteTetris.changes}개 삭제`);
  
  const deleteSudoku = db.prepare('DELETE FROM sudoku_scores').run();
  console.log(`✅ sudoku_scores: ${deleteSudoku.changes}개 삭제`);
  
  const delete2048 = db.prepare('DELETE FROM game2048_scores').run();
  console.log(`✅ game2048_scores: ${delete2048.changes}개 삭제`);
  
  const deleteMine = db.prepare('DELETE FROM minesweeper_scores').run();
  console.log(`✅ minesweeper_scores: ${deleteMine.changes}개 삭제`);
  
  // 4. 삭제 후 확인
  console.log('\n\n📊 삭제 후 데이터 확인:\n');
  
  const afterScores = db.prepare('SELECT COUNT(*) as count FROM user_game_scores').get();
  console.log(`user_game_scores: ${afterScores.count}개`);
  
  const afterTetris = db.prepare('SELECT COUNT(*) as count FROM tetris_scores').get();
  console.log(`tetris_scores: ${afterTetris.count}개`);
  
  const afterSudoku = db.prepare('SELECT COUNT(*) as count FROM sudoku_scores').get();
  console.log(`sudoku_scores: ${afterSudoku.count}개`);
  
  const after2048 = db.prepare('SELECT COUNT(*) as count FROM game2048_scores').get();
  console.log(`game2048_scores: ${after2048.count}개`);
  
  const afterMine = db.prepare('SELECT COUNT(*) as count FROM minesweeper_scores').get();
  console.log(`minesweeper_scores: ${afterMine.count}개`);
  
  db.close();
  
  console.log('\n\n✅ 모든 목업 데이터 삭제 완료!');
  console.log('\n다음 단계:');
  console.log('1. 서버 재시작: pkill -9 node && pkill -9 npm && pkill -9 tsx');
  console.log('2. 서버 시작: nohup npm run start:prod > server.log 2>&1 &');
  console.log('3. 브라우저에서 확인: 심플 게임 메인 페이지와 마이페이지');
  console.log('\n이제부터 실제 사용자가 플레이한 점수만 저장됩니다!');
  
} catch (error) {
  console.error('\n❌ 오류 발생:', error.message);
  console.error('\nDB 파일 경로를 확인해주세요:', dbPath);
  process.exit(1);
}
