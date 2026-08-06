export type SupportedLang = 'ko' | 'en';

export const getLang = (): SupportedLang => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('user_lang');
        if (saved === 'ko' || saved === 'en') return saved;
        
        const urlParams = new URLSearchParams(window.location.search);
        const paramLang = urlParams.get('lang');
        if (paramLang === 'ko' || paramLang === 'en') return paramLang;

        const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
        return browserLang.startsWith('ko') ? 'ko' : 'en';
    }
    return 'ko';
};

export const sdkTranslations: Record<SupportedLang, Record<string, string>> = {
    ko: {
        '기본': '기본',
        '공학': '공학',
        '대출': '대출',
        'BMI': 'BMI',
        '나이': '나이',
        '날짜': '날짜',
        '단위': '단위',
        '백분율': '백분율',
        '다기능 계산기': '다기능 계산기',
        '나이 계산기': '나이 계산기',
        '만나이 계산기': '만나이 계산기',
        '디데이 계산기': '디데이 계산기',
        '평수 계산기': '평수 계산기',
        '평수 변환기': '평수 변환기',
        '맞춤법 검사기': '맞춤법 검사기',
        '글자수 검사기': '글자수 검사기',
        'JSON 포맷터': 'JSON 포맷터',
        'Base64 변환기': 'Base64 변환기',
        'SVG 변환기': 'SVG 변환기',
        '계산기': '계산기',
        '초기화': '초기화',
        '복사': '복사',
        '변환': '변환',
        '입력': '입력',
        '결과': '결과',
        '생년월일': '생년월일',
        '기준일': '기준일',
        '목표일': '목표일',
        '오늘': '오늘',
        '계산하기': '계산하기',
        '닫기': '닫기',
        '만 나이': '만 나이',
        '연 나이': '연 나이',
        '세는 나이': '세는 나이',
        '세': '세',
        '선택': '선택',
        '년': '년',
        '월': '월',
        '일': '일',
        '계산 기준일 (기본: 오늘)': '계산 기준일 (기본: 오늘)',
        '나이 계산하기': '나이 계산하기',
        '법적·표준 행정 기준': '법적·표준 행정 기준',
        '청소년보호법 기준': '청소년보호법 기준',
        '일반 사회적 한국식': '일반 사회적 한국식',
    },
    en: {
        '기본': 'Basic',
        '공학': 'Scientific',
        '대출': 'Loan',
        'BMI': 'BMI',
        '나이': 'Age',
        '날짜': 'Date',
        '단위': 'Unit',
        '백분율': 'Percent',
        '다기능 계산기': 'Multi-Function Calculator',
        '나이 계산기': 'Age Calculator',
        '만나이 계산기': 'Age Calculator',
        '디데이 계산기': 'D-Day Counter',
        '평수 계산기': 'Pyeong Converter',
        '평수 변환기': 'Pyeong Converter',
        '맞춤법 검사기': 'Spell & Word Checker',
        '글자수 검사기': 'Word & Character Counter',
        'JSON 포맷터': 'JSON Formatter',
        'Base64 변환기': 'Base64 Converter',
        'SVG 변환기': 'SVG Converter',
        '계산기': 'Calculator',
        '초기화': 'Reset',
        '복사': 'Copy',
        '변환': 'Convert',
        '입력': 'Input',
        '결과': 'Result',
        '생년월일': 'Date of Birth',
        '기준일': 'Reference Date',
        '목표일': 'Target Date',
        '오늘': 'Today',
        '계산하기': 'Calculate',
        '닫기': 'Close',
        '만 나이': 'International Age',
        '연 나이': 'Year Age',
        '세는 나이': 'Korean Age',
        '세': ' yrs',
        '선택': 'Select',
        '년': 'Year',
        '월': 'Month',
        '일': 'Day',
        '계산 기준일 (기본: 오늘)': 'Reference Date (Default: Today)',
        '나이 계산하기': 'Calculate Age',
        '법적·표준 행정 기준': 'Legal & Administrative Standard',
        '청소년보호법 기준': 'Youth Protection Act Standard',
        '일반 사회적 한국식': 'Traditional Social Age',
    }
};

export const t = (key: string, overrideLang?: SupportedLang): string => {
    const lang = overrideLang || getLang();
    return sdkTranslations[lang]?.[key] || sdkTranslations['ko']?.[key] || key;
};
