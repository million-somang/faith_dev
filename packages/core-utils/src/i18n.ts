export type SupportedLanguage = 'ko' | 'en';

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  ko: {
    // Navigation & General
    'nav.news': '실시간 뉴스',
    'nav.games': '미니게임',
    'nav.miniapps': '생활 도구',
    'nav.novels': '웹소설',
    'nav.finance': '금융/증시',
    'nav.saju': '운세/사주',
    'nav.mypage': '마이페이지',
    'nav.login': '로그인',
    'nav.logout': '로그아웃',
    'nav.admin': '관리자',
    'nav.search': '검색',
    'nav.home': '홈',

    // Header & Hero
    'hero.title': '매일 새로운 즐거움과 유용한 도구',
    'hero.subtitle': '실시간 뉴스, 미니게임, 생활 계산기를 한곳에서 쉽고 편리하게 이용하세요.',
    'hero.searchPlaceholder': '뉴스, 게임, 유용한 도구를 검색해보세요...',

    // Categories
    'cat.all': '전체',
    'cat.politics': '정치',
    'cat.economy': '경제',
    'cat.society': '사회',
    'cat.tech': 'IT/과학',
    'cat.world': '세계',
    'cat.entertainment': '연예/문화',
    'cat.sports': '스포츠',

    // Games
    'game.tetris': '테트리스',
    'game.tetrisDesc': '클래식 블록 맞추기 게임',
    'game.sudoku': '스도쿠',
    'game.sudokuDesc': '두뇌 자극 숫자 논리 퍼즐',
    'game.2048': '2048',
    'game.2048Desc': '숫자 합치기 중독성 퍼즐',
    'game.minesweeper': '지뢰찾기',
    'game.minesweeperDesc': '전략적 추론 지뢰 제거',

    // Mini Apps
    'app.calculator': '다기능 계산기',
    'app.calculatorDesc': '일반/대출/날짜 통합 계산',
    'app.ageCalc': '나이 계산기',
    'app.ageCalcDesc': '만 나이, 연 나이, 띠 한눈에',
    'app.ddayCalc': '디데이 계산기',
    'app.ddayCalcDesc': '기념일 및 일정 카운트다운',
    'app.pyeongCalc': '평수 계산기',
    'app.pyeongCalcDesc': '아파트/토지 평 $\\leftrightarrow$ ㎡ 변환',
    'app.textChecker': '글자수 세기',
    'app.textCheckerDesc': '공백 포함/제외 글자수 검사',
    'app.jsonFormatter': 'JSON 포맷터',
    'app.jsonFormatterDesc': 'JSON 정렬 및 유효성 검사',
    'app.base64Converter': 'Base64 변환기',
    'app.base64ConverterDesc': '텍스트 $\\leftrightarrow$ Base64 인코딩/디코딩',
    'app.svgConverter': 'SVG 변환기',
    'app.svgConverterDesc': 'SVG 이미지를 PNG/JPG로 변환',

    // Action & Status UI
    'ui.playNow': '바로 플레이',
    'ui.useNow': '바로 사용',
    'ui.score': '점수',
    'ui.bestScore': '최고 점수',
    'ui.gameOver': '게임 오버',
    'ui.retry': '다시 시도',
    'ui.copy': '복사',
    'ui.copied': '복사됨!',
    'ui.reset': '초기화',
    'ui.calculate': '계산하기',
    'ui.result': '결과',
    'ui.backToPortal': '포털로 돌아가기',
    'ui.share': '공유하기',
    'ui.language': '언어 설정',
    'ui.korean': '한국어',
    'ui.english': 'English',
    'ui.autoDetected': '접속 국가 자동 감지됨',
  },
  en: {
    // Navigation & General
    'nav.news': 'Live News',
    'nav.games': 'Mini Games',
    'nav.miniapps': 'Utility Tools',
    'nav.novels': 'Web Novels',
    'nav.finance': 'Finance/Stock',
    'nav.saju': 'Horoscope/Saju',
    'nav.mypage': 'My Page',
    'nav.login': 'Log In',
    'nav.logout': 'Log Out',
    'nav.admin': 'Admin',
    'nav.search': 'Search',
    'nav.home': 'Home',

    // Header & Hero
    'hero.title': 'Fresh Fun & Helpful Tools Every Day',
    'hero.subtitle': 'Enjoy real-time news, fun mini games, and useful calculators all in one place.',
    'hero.searchPlaceholder': 'Search news, games, and tools...',

    // Categories
    'cat.all': 'All',
    'cat.politics': 'Politics',
    'cat.economy': 'Economy',
    'cat.society': 'Society',
    'cat.tech': 'Tech/Science',
    'cat.world': 'World',
    'cat.entertainment': 'Culture',
    'cat.sports': 'Sports',

    // Games
    'game.tetris': 'Tetris',
    'game.tetrisDesc': 'Classic block matching game',
    'game.sudoku': 'Sudoku',
    'game.sudokuDesc': 'Brain-stimulating number logic puzzle',
    'game.2048': '2048',
    'game.2048Desc': 'Addictive number merging puzzle',
    'game.minesweeper': 'Minesweeper',
    'game.minesweeperDesc': 'Strategic mine clearance puzzle',

    // Mini Apps
    'app.calculator': 'Multi Calculator',
    'app.calculatorDesc': 'General, loan & date calculator',
    'app.ageCalc': 'Age Calculator',
    'app.ageCalcDesc': 'Exact age, birth year & zodiac info',
    'app.ddayCalc': 'D-Day Calculator',
    'app.ddayCalcDesc': 'Anniversary & event countdown',
    'app.pyeongCalc': 'Area Unit Converter',
    'app.pyeongCalcDesc': 'Pyeong $\\leftrightarrow$ m² unit converter',
    'app.textChecker': 'Character Counter',
    'app.textCheckerDesc': 'Count letters, words & spaces',
    'app.jsonFormatter': 'JSON Formatter',
    'app.jsonFormatterDesc': 'JSON prettifier & validator',
    'app.base64Converter': 'Base64 Converter',
    'app.base64ConverterDesc': 'Text $\\leftrightarrow$ Base64 encode & decode',
    'app.svgConverter': 'SVG Converter',
    'app.svgConverterDesc': 'Convert SVG images to PNG/JPG',

    // Action & Status UI
    'ui.playNow': 'Play Now',
    'ui.useNow': 'Use Tool',
    'ui.score': 'Score',
    'ui.bestScore': 'High Score',
    'ui.gameOver': 'Game Over',
    'ui.retry': 'Try Again',
    'ui.copy': 'Copy',
    'ui.copied': 'Copied!',
    'ui.reset': 'Reset',
    'ui.calculate': 'Calculate',
    'ui.result': 'Result',
    'ui.backToPortal': 'Back to Portal',
    'ui.share': 'Share',
    'ui.language': 'Language',
    'ui.korean': '한국어',
    'ui.english': 'English',
    'ui.autoDetected': 'Auto-detected by region',
  }
};

/**
 * Helper function to retrieve translated string for a given key.
 * Falls back to Korean translation or key itself if missing.
 */
export function t(key: string, lang: SupportedLanguage = 'ko'): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS['ko'];
  return dict[key] || TRANSLATIONS['ko'][key] || key;
}

/**
 * Detect browser locale preference. Returns 'ko' if browser prefers Korean, otherwise 'en'.
 */
export function detectBrowserLanguage(): SupportedLanguage {
  if (typeof window === 'undefined' || !window.navigator) {
    return 'en';
  }

  const userLangs = window.navigator.languages || [window.navigator.language];
  const hasKorean = userLangs.some(l => l && l.toLowerCase().startsWith('ko'));
  return hasKorean ? 'ko' : 'en';
}
