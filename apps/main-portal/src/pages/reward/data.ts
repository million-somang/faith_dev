// 리워드 목업 데이터 (실제 API 연동 전 임시)

export const BALANCE = 12450;

export const ATTENDANCE = [
    { day: '월', done: true, point: 10 },
    { day: '화', done: true, point: 10 },
    { day: '수', done: true, point: 10 },
    { day: '목', done: false, point: 20, today: true },
    { day: '금', done: false, point: 10 },
    { day: '토', done: false, point: 10 },
    { day: '일', done: false, point: 50 },
];

export const MISSIONS = [
    { icon: 'fa-newspaper', title: '오늘의 뉴스 3개 읽기', desc: '관심 카테고리 뉴스를 읽어보세요', point: 30, progress: 2, total: 3 },
    { icon: 'fa-gamepad', title: '미니게임 1판 플레이', desc: '테트리스, 2048 등 아무거나', point: 20, progress: 0, total: 1 },
    { icon: 'fa-chart-line', title: '관심 종목 등록하기', desc: '마이페이지에서 종목을 추가하세요', point: 50, progress: 1, total: 1 },
];

export const REWARDS = [
    { icon: 'fa-coffee', name: '아메리카노 기프티콘', point: 4500, tag: 'HOT' },
    { icon: 'fa-hamburger', name: '햄버거 세트', point: 8000, tag: '' },
    { icon: 'fa-ticket', name: '영화 예매권', point: 12000, tag: '' },
    { icon: 'fa-gift', name: '편의점 5천원권', point: 5000, tag: 'NEW' },
    { icon: 'fa-mug-hot', name: '카페 디저트 세트', point: 9500, tag: '' },
    { icon: 'fa-store', name: '온라인몰 1만원 쿠폰', point: 10000, tag: '' },
];

export const HISTORY = [
    { title: '출석 체크 보상', date: '2026.06.20', point: 10, plus: true },
    { title: '뉴스 읽기 미션 완료', date: '2026.06.19', point: 30, plus: true },
    { title: '아메리카노 교환', date: '2026.06.17', point: 4500, plus: false },
    { title: '미니게임 미션 완료', date: '2026.06.17', point: 20, plus: true },
];
