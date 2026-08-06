// Internationalization (i18n) Utility Module for FaithPortal Monorepo

export type SupportedLang = 'ko' | 'en';

export const getLang = (): SupportedLang => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('user_lang');
        if (saved === 'ko' || saved === 'en') return saved;
        
        // Auto-detect browser language: Default to 'en' for non-Korean users
        const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
        return browserLang.startsWith('ko') ? 'ko' : 'en';
    }
    return 'ko';
};

export const setLang = (lang: SupportedLang): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('user_lang', lang);
        window.location.reload();
    }
};

export const translations: Record<SupportedLang, Record<string, string>> = {
    ko: {
        // Navigation & General
        '홈': '홈',
        '뉴스': '뉴스',
        '생활도구': '생활도구',
        '유틸리티': '유틸리티',
        '금융': '금융',
        '주식': '주식',
        '게임': '게임',
        '재미': '재미',
        '쇼핑': '쇼핑',
        '리워드': '리워드',
        '라운지': '라운지',
        '마이페이지': '마이페이지',
        '로그인': '로그인',
        '로그아웃': '로그아웃',
        '회원가입': '회원가입',
        '홈페이지 제작': '홈페이지 제작',
        '전체메뉴': '전체메뉴',
        '일반 포털': '🔮 일반 포털',
        '비즈니스': '💼 비즈니스',
        '포털': '포털',
        '비즈': '비즈',

        // Header & Main Portal
        '나만의 스마트 통합 포털': '나만의 스마트 통합 포털',
        '실시간 뉴스, 주식, 게임 및 유틸리티 대시보드': '실시간 연동된 뉴스, 주식, 게임 및 생활도구 대시보드입니다.',
        '나만의 홈페이지': '나만의 홈페이지',
        '나의 홈': '나의 홈',
        '홈꾸미기': '홈꾸미기',
        '일정 관리': '일정 관리',
        '나의 일정 관리': '나의 일정 관리',
        '오늘 할 일과 스케줄을 손쉽게 기록하세요.': '오늘 할 일과 스케줄을 손쉽게 기록하세요.',
        '하루 종일': '하루 종일',
        '종일': '종일',
        '오늘': '오늘',
        '추가': '추가',
        '삭제': '삭제',
        '저장': '저장',
        '취소': '취소',

        // MyPage & Services
        '나의 스크랩과 활동 내역을 한눈에 확인하세요.': '나의 스크랩과 활동 내역을 한눈에 확인하세요.',
        '내가 구독한 주제 최신 뉴스': '내가 구독한 주제 최신 뉴스',
        '관심 주식 시세': '관심 주식 시세',
        '미니게임 최고 전적': '미니게임 최고 전적',
        '나만의 오행 생년월일 분석': '나만의 오행 생년월일 분석',
        '금융 / 주식 서비스': '금융 / 주식 서비스',
        '게임 센터': '게임 센터',
        '유틸리티 모음': '유틸리티 모음',
        '사주 / 운세': '사주 / 운세',
        '바로가기': '바로가기',
        '자세히 보기': '자세히 보기',
        '플레이하기': '플레이하기',
        '뉴스 메인 서비스로 이동': '뉴스 메인 서비스로 이동',
        '금융 서비스 메인으로 이동': '금융 서비스 메인으로 이동',
        '게임 센터 메인으로 이동': '게임 센터 메인으로 이동',
        '유틸리티 메인으로 이동': '유틸리티 메인으로 이동',
        '총 종목 수': '총 종목 수',
        '미국 주식': '미국 주식',
        '한국 주식': '한국 주식',
        '최고 기록': '최고 기록',
        '저장된 설정': '저장된 설정',
        '사용 히스토리': '사용 히스토리',
        '미니게임 바로가기': '미니게임 바로가기',
        '유틸리티 서비스 바로가기': '유틸리티 서비스 바로가기',
        '계산기 모음': '계산기 모음',
        '금융 계산기': '금융 계산기',
        '개발자 도구': '개발자 도구',
        '테트리스': '테트리스',
        '2048': '2048',
        '지뢰찾기': '지뢰찾기',
        '스도쿠': '스도쿠',
        '전체': '전체',
        '계산기': '계산기',
        '텍스트': '텍스트',
        '개발 도구': '개발 도구',
        '미니게임': '미니게임',
        '고전게임': '고전게임',
        '에뮬레이터': '에뮬레이터',

        // Utility Page Specifics
        '자주 쓰는 앱': '자주 쓰는 앱',
        '일상에 유용한 도구들을 모았습니다.': '일상에 유용한 도구들을 모았습니다.',
        '만나이 계산기': '만나이 계산기',
        '만 나이 계산기': '만 나이 계산기',
        '평수 변환기': '평수 변환기',
        '부동산 평수 계산기': '부동산 평수 계산기',
        'D-Day 계산기': 'D-Day 계산기',
        '글자수 세기': '글자수 세기',
        '글자수 검사기': '글자수 검사기',
        'JSON 포맷터': 'JSON 포맷터',
        'Base64 변환기': 'Base64 변환기',
        'SVG 변환기': 'SVG 변환기',
        '공학용 계산기': '공학용 계산기',
        '일반 계산기': '일반 계산기',
        '생활도구 - 계산기, 변환기, 텍스트 도구': '생활도구 - 계산기, 변환기, 텍스트 도구',
        '만나이 계산기, 평수 변환기, D-Day 계산기, JSON 포맷터, Base64 변환기 등 유용한 생활 도구 모음.': '만나이 계산기, 평수 변환기, D-Day 계산기, JSON 포맷터, Base64 변환기 등 유용한 생활 도구 모음.',
        '앱 목록을 불러오는 중입니다...': '앱 목록을 불러오는 중입니다...',
        '사용 가능한 미니앱이 없습니다.': '사용 가능한 미니앱이 없습니다.',
    },
    en: {
        // Navigation & General
        '홈': 'Home',
        '뉴스': 'News',
        '생활도구': 'Tools',
        '유틸리티': 'Utilities',
        '금융': 'Finance',
        '주식': 'Stocks',
        '게임': 'Games',
        '재미': 'Fun',
        '쇼핑': 'Shopping',
        '리워드': 'Rewards',
        '라운지': 'Lounge',
        '마이페이지': 'My Page',
        '로그인': 'Log In',
        '로그아웃': 'Log Out',
        '회원가입': 'Sign Up',
        '홈페이지 제작': 'Web Design',
        '전체메뉴': 'All Menu',
        '일반 포털': '🔮 General',
        '비즈니스': '💼 Business',
        '포털': 'Portal',
        '비즈': 'Biz',

        // Header & Main Portal
        '나만의 스마트 통합 포털': 'My Smart Personal Portal',
        '실시간 뉴스, 주식, 게임 및 유틸리티 대시보드': 'Real-time dashboard for news, stocks, games, and tools.',
        '나만의 홈페이지': 'My Personal Homepage',
        '나의 홈': 'My Home',
        '홈꾸미기': 'Customize',
        '일정 관리': 'Schedule Manager',
        '나의 일정 관리': 'My Schedules',
        '오늘 할 일과 스케줄을 손쉽게 기록하세요.': 'Easily record today\'s tasks and schedules.',
        '하루 종일': 'All Day',
        '종일': 'All Day',
        '오늘': 'Today',
        '추가': 'Add',
        '삭제': 'Delete',
        '저장': 'Save',
        '취소': 'Cancel',

        // MyPage & Services
        '나의 스크랩과 활동 내역을 한눈에 확인하세요.': 'View your scraps and activity history at a glance.',
        '내가 구독한 주제 최신 뉴스': 'Subscribed Topic News Feed',
        '관심 주식 시세': 'Watchlist Stock Quotes',
        '미니게임 최고 전적': 'Mini Game High Scores',
        '나만의 오행 생년월일 분석': 'Five-Elements Birth Analysis',
        '금융 / 주식 서비스': 'Finance & Stocks',
        '게임 센터': 'Game Center',
        '유틸리티 모음': 'Tools & Utilities',
        '사주 / 운세': 'Fortune & Astrology',
        '바로가기': 'Go',
        '자세히 보기': 'View Details',
        '플레이하기': 'Play Now',
        '뉴스 메인 서비스로 이동': 'Go to News Portal',
        '금융 서비스 메인으로 이동': 'Go to Finance Portal',
        '게임 센터 메인으로 이동': 'Go to Game Center',
        '유틸리티 메인으로 이동': 'Go to Utilities Portal',
        '총 종목 수': 'Total Stocks',
        '미국 주식': 'US Stocks',
        '한국 주식': 'KR Stocks',
        '최고 기록': 'High Scores',
        '저장된 설정': 'Saved Settings',
        '사용 히스토리': 'Usage History',
        '미니게임 바로가기': 'Mini Game Shortcuts',
        '유틸리티 서비스 바로가기': 'Utility Shortcuts',
        '계산기 모음': 'Calculators',
        '금융 계산기': 'Financial Calculators',
        '개발자 도구': 'Developer Tools',
        '테트리스': 'Tetris',
        '2048': '2048',
        '지뢰찾기': 'Minesweeper',
        '스도쿠': 'Sudoku',
        '전체': 'All',
        '계산기': 'Calculators',
        '텍스트': 'Text Tools',
        '개발 도구': 'Developer Tools',
        '미니게임': 'Mini Games',
        '고전게임': 'Classic Games',
        '에뮬레이터': 'Emulators',

        // Utility Page Specifics
        '자주 쓰는 앱': 'Frequently Used Tools',
        '일상에 유용한 도구들을 모았습니다.': 'A collection of useful tools for everyday life.',
        '만나이 계산기': 'Age Calculator',
        '만 나이 계산기': 'Age Calculator',
        '평수 변환기': 'Pyeong Converter',
        '부동산 평수 계산기': 'Pyeong Converter',
        'D-Day 계산기': 'D-Day Counter',
        '글자수 세기': 'Word/Character Counter',
        '글자수 검사기': 'Word/Character Counter',
        'JSON 포맷터': 'JSON Formatter',
        'Base64 변환기': 'Base64 Converter',
        'SVG 변환기': 'SVG Converter',
        '공학용 계산기': 'Scientific Calculator',
        '일반 계산기': 'Standard Calculator',
        '생활도구 - 계산기, 변환기, 텍스트 도구': 'Utilities - Calculators, Converters & Text Tools',
        '만나이 계산기, 평수 변환기, D-Day 계산기, JSON 포맷터, Base64 변환기 등 유용한 생활 도구 모음.': 'Collection of useful tools such as Age Calculator, Pyeong Converter, D-Day Counter, JSON Formatter, Base64 Converter, etc.',
        '앱 목록을 불러오는 중입니다...': 'Loading tools...',
        '사용 가능한 미니앱이 없습니다.': 'No tools available.',
    }
};

export const t = (key: string, overrideLang?: SupportedLang): string => {
    const lang = overrideLang || getLang();
    return translations[lang]?.[key] || translations['ko']?.[key] || key;
};
