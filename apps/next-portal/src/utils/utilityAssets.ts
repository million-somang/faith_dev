export interface UtilityVisualMeta {
    image: string;
    categoryLabel: string;
    badge?: string;
    badgeStyle?: string;
    visualBg: string;
    borderHover: string;
    buttonStyle: string;
    shortDesc: string;
    guideSlug?: string;
    highlights: string[];
}

export const UTILITY_HERO_BANNER = '/images/utility/utility_hero_banner.png';

const DEFAULT_META: UtilityVisualMeta = {
    image: '/images/utility/icon_calculator.png',
    categoryLabel: '생활 도구',
    badge: '무료 도구',
    badgeStyle: 'bg-blue-100 text-blue-700 border-blue-200',
    visualBg: 'from-blue-50 via-indigo-50/70 to-sky-50',
    borderHover: 'hover:border-blue-300',
    buttonStyle: 'bg-blue-600 hover:bg-blue-500 text-white',
    shortDesc: '설치 없이 웹 브라우저에서 즉시 실행되는 스마트 생활 유틸리티입니다.',
    highlights: ['무설치 즉시 실행', '100% 무료']
};

export const UTILITY_VISUAL_MAP: Record<string, UtilityVisualMeta> = {
    'image-resizer': {
        image: '/images/utility/icon_image_resizer.png',
        categoryLabel: '계산 · 변환',
        badge: 'POPULAR 🔥',
        badgeStyle: 'bg-rose-500 text-white border-rose-400 shadow-xs',
        visualBg: 'from-indigo-50 via-purple-50/80 to-pink-50',
        borderHover: 'hover:border-indigo-300',
        buttonStyle: 'bg-indigo-600 hover:bg-indigo-500 text-white',
        shortDesc: 'SNS 권장 규격 및 픽셀·비율·용량(KB) 단위로 최대 50장의 이미지를 일괄 리사이즈 & WebP/JPG/PNG 변환',
        guideSlug: 'image-resizer',
        highlights: ['최대 50장 일괄 처리', '목표 용량(KB) 맞춤', '로컬 보안 처리']
    },
    'calculator': {
        image: '/images/utility/icon_calculator.png',
        categoryLabel: '계산기',
        badge: '필수 유틸',
        badgeStyle: 'bg-blue-600 text-white border-blue-500',
        visualBg: 'from-blue-50 via-sky-50/80 to-cyan-50',
        borderHover: 'hover:border-blue-300',
        buttonStyle: 'bg-blue-600 hover:bg-blue-500 text-white',
        shortDesc: '사칙연산·공학 계산부터 쇼핑 할인율, 부가세(VAT), 비만도(BMI), 단위 변환까지 원스톱 통합 계산',
        guideSlug: 'calculator',
        highlights: ['할인율 · VAT 계산', '연산 히스토리 보관']
    },
    'text-checker': {
        image: '/images/utility/icon_text_ocr.png',
        categoryLabel: '텍스트 · 문서',
        badge: '자소서 필수',
        badgeStyle: 'bg-emerald-600 text-white border-emerald-500',
        visualBg: 'from-emerald-50 via-teal-50/80 to-cyan-50',
        borderHover: 'hover:border-emerald-300',
        buttonStyle: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        shortDesc: '공백 포함/제외 글자수, 단어 수, EUC-KR/UTF-8 바이트(Byte) 실시간 계산 및 맞춤법 점검',
        guideSlug: 'text-checker',
        highlights: ['공백 포함/제외 글자수', '바이트(Byte) 정밀 검증']
    },
    'pyeong-calc': {
        image: '/images/utility/icon_pyeong_house.png',
        categoryLabel: '부동산 · 계산',
        badge: '부동산 필수',
        badgeStyle: 'bg-teal-600 text-white border-teal-500',
        visualBg: 'from-teal-50 via-emerald-50/80 to-green-50',
        borderHover: 'hover:border-teal-300',
        buttonStyle: 'bg-teal-600 hover:bg-teal-500 text-white',
        shortDesc: '아파트 전용·공급면적 제곱미터(㎡) ↔ 평수(평) 원클릭 환산 및 국민평형(59·84㎡) 프리셋 비교',
        guideSlug: 'pyeong-calc',
        highlights: ['㎡ ↔ 평 즉시 변환', '59㎡ · 84㎡ 프리셋']
    },
    'age-calc': {
        image: '/images/utility/icon_age_dday.png',
        categoryLabel: '계산기',
        badge: '만 나이 통일법',
        badgeStyle: 'bg-pink-500 text-white border-pink-400',
        visualBg: 'from-pink-50 via-rose-50/80 to-orange-50',
        borderHover: 'hover:border-pink-300',
        buttonStyle: 'bg-pink-600 hover:bg-pink-500 text-white',
        shortDesc: '출생일 기준 대한민국 법정 만 나이, 연 나이, 세는 나이와 띠·별자리·주요 법적 기준 연령 산출',
        guideSlug: 'age-calc',
        highlights: ['만 나이 · 연 나이', '띠 · 생일 D-Day']
    },
    'customs-calc': {
        image: '/images/utility/icon_customs_plane.png',
        categoryLabel: '계산 · 쇼핑',
        badge: '실시간 환율',
        badgeStyle: 'bg-sky-600 text-white border-sky-500',
        visualBg: 'from-sky-50 via-blue-50/80 to-indigo-50',
        borderHover: 'hover:border-sky-300',
        buttonStyle: 'bg-sky-600 hover:bg-sky-500 text-white',
        shortDesc: '미국($200)·일반($150) 목록통관 면세 판별 및 11대 품목별 예상 관세·부가세 실시간 환율 계산',
        guideSlug: 'customs-calc',
        highlights: ['면세 한도 즉시 판별', '품목별 관·부가세']
    },
    'ocr': {
        image: '/images/utility/icon_text_ocr.png',
        categoryLabel: 'AI · 텍스트',
        badge: 'LOCAL AI ✨',
        badgeStyle: 'bg-violet-600 text-white border-violet-500',
        visualBg: 'from-violet-50 via-purple-50/80 to-indigo-50',
        borderHover: 'hover:border-violet-300',
        buttonStyle: 'bg-violet-600 hover:bg-violet-500 text-white',
        shortDesc: '캡처 이미지·사진을 Ctrl+V로 붙여넣으면 서버 전송 없이 브라우저에서 한글·영문 텍스트 즉시 추출',
        guideSlug: 'ocr',
        highlights: ['Ctrl+V 캡처 즉시 인식', '100% 로컬 프라이버시']
    },
    'vacation-planner': {
        image: '/images/utility/icon_vacation_beach.png',
        categoryLabel: '계산 · 일정',
        badge: '2026-2027 연휴',
        badgeStyle: 'bg-amber-500 text-slate-950 border-amber-400',
        visualBg: 'from-amber-50 via-orange-50/80 to-yellow-50',
        borderHover: 'hover:border-amber-300',
        buttonStyle: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
        shortDesc: '남은 연차 일수만 입력하면 대체공휴일과 주말을 조합해 최장 연속 휴가 황금 루트를 달력으로 추천',
        highlights: ['황금연휴 최적 조합', '연차 효율 극대화']
    },
    'dday-calc': {
        image: '/images/utility/icon_age_dday.png',
        categoryLabel: '계산 · 기념일',
        badge: '기념일 관리',
        badgeStyle: 'bg-rose-500 text-white border-rose-400',
        visualBg: 'from-rose-50 via-pink-50/80 to-fuchsia-50',
        borderHover: 'hover:border-rose-300',
        buttonStyle: 'bg-rose-500 hover:bg-rose-400 text-white',
        shortDesc: '시험, 커플 기념일, 출산 예정일, 전역일 등 소중한 날까지 남은 일수(D-)와 100일·1주년 자동 계산',
        guideSlug: 'dday-calc',
        highlights: ['당일 포함/미포함 지원', '100일 · 1주년 타임라인']
    },
    'interest-calc': {
        image: '/images/utility/icon_finance_wealth.png',
        categoryLabel: '금융 · 재테크',
        badge: '비과세 비교',
        badgeStyle: 'bg-emerald-600 text-white border-emerald-500',
        visualBg: 'from-emerald-50 via-amber-50/60 to-teal-50',
        borderHover: 'hover:border-emerald-300',
        buttonStyle: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        shortDesc: '정기예금·적금 단리/월복리 이자 산출 및 일반과세(15.4%)·세금우대·비과세 만기 실수령액 원클릭 비교',
        guideSlug: 'interest-calc',
        highlights: ['단리 · 월복리 비교', '비과세 절세액 산출']
    },
    'severance-calc': {
        image: '/images/utility/icon_finance_wealth.png',
        categoryLabel: '금융 · 노동법',
        badge: '2026 개정세법',
        badgeStyle: 'bg-blue-700 text-white border-blue-600',
        visualBg: 'from-blue-50 via-indigo-50/80 to-amber-50/60',
        borderHover: 'hover:border-blue-300',
        buttonStyle: 'bg-blue-700 hover:bg-blue-600 text-white',
        shortDesc: '최근 3개월 급여·상여금 기반 1일 평균임금 산출, 퇴직소득세 공제 반영 세후 퇴직금 및 실업급여 계산',
        guideSlug: 'severance-calc',
        highlights: ['세후 실수령 퇴직금', '2026 실업급여 상·하한']
    },
    'finance-dsr': {
        image: '/images/utility/icon_finance_wealth.png',
        categoryLabel: '금융 · 대출',
        badge: '스트레스 DSR',
        badgeStyle: 'bg-indigo-700 text-white border-indigo-600',
        visualBg: 'from-indigo-50 via-slate-50 to-blue-50',
        borderHover: 'hover:border-indigo-300',
        buttonStyle: 'bg-indigo-700 hover:bg-indigo-600 text-white',
        shortDesc: '연소득 대비 DSR 40% 규제 및 스트레스 가산금리를 반영한 최대 주택담보·신용대출 한도와 월 상환액 계산',
        guideSlug: 'finance-dsr',
        highlights: ['스트레스 금리 반영', '최대 대출 한도 시뮬레이션']
    },
    'json-formatter': {
        image: '/images/utility/icon_dev_studio.png',
        categoryLabel: '개발 도구',
        badge: 'DEV STUDIO',
        badgeStyle: 'bg-slate-800 text-cyan-300 border-slate-700',
        visualBg: 'from-slate-100 via-indigo-50/70 to-cyan-50/70',
        borderHover: 'hover:border-indigo-400',
        buttonStyle: 'bg-slate-900 hover:bg-slate-800 text-white',
        shortDesc: '복잡한 JSON 실시간 정렬(Prettify)·압축(Minify), 문법 에러 위치 검출 및 YAML/XML/CSV 상호 변환',
        guideSlug: 'json-formatter',
        highlights: ['트리뷰 & 에러 검출', 'YAML · XML · CSV 변환']
    },
    'base64-converter': {
        image: '/images/utility/icon_dev_studio.png',
        categoryLabel: '개발 도구',
        badge: 'JWT 디코더',
        badgeStyle: 'bg-slate-800 text-amber-300 border-slate-700',
        visualBg: 'from-slate-100 via-amber-50/60 to-indigo-50/60',
        borderHover: 'hover:border-amber-400',
        buttonStyle: 'bg-slate-900 hover:bg-slate-800 text-white',
        shortDesc: '한글·다국어 텍스트 및 이미지 Base64 인코딩/디코딩, Data URI 생성 및 JWT 토큰 페이로드 즉시 분석',
        guideSlug: 'base64-converter',
        highlights: ['UTF-8 완벽 지원', 'JWT 토큰 파싱']
    },
    'svg-converter': {
        image: '/images/utility/icon_dev_studio.png',
        categoryLabel: '개발 · 그래픽',
        badge: 'VECTOR AI',
        badgeStyle: 'bg-purple-700 text-white border-purple-600',
        visualBg: 'from-purple-50 via-fuchsia-50/70 to-indigo-50',
        borderHover: 'hover:border-purple-300',
        buttonStyle: 'bg-purple-700 hover:bg-purple-600 text-white',
        shortDesc: '해상도가 깨지는 PNG/JPG 비트맵 로고·아이콘을 확대해도 선명한 SVG 벡터 그래픽으로 실시간 변환',
        guideSlug: 'svg-converter',
        highlights: ['윤곽선 · 컬러 벡터화', '배경 투명화 지원']
    },
    'webp-converter': {
        image: '/images/utility/icon_image_resizer.png',
        categoryLabel: '개발 · 이미지',
        badge: '최대 80% 압축',
        badgeStyle: 'bg-cyan-700 text-white border-cyan-600',
        visualBg: 'from-cyan-50 via-sky-50/80 to-blue-50',
        borderHover: 'hover:border-cyan-300',
        buttonStyle: 'bg-cyan-700 hover:bg-cyan-600 text-white',
        shortDesc: '서버 업로드 없이 브라우저 로컬에서 초고속 무손실 WebP 포맷 변환 및 최대 80% 이미지 용량 다이어트',
        highlights: ['초고속 WebP 압축', '서버 전송 0% 보안']
    }
};

export function getUtilityVisualMeta(slug: string, fallbackDescription?: string): UtilityVisualMeta {
    const found = UTILITY_VISUAL_MAP[slug];
    if (found) return found;
    return {
        ...DEFAULT_META,
        shortDesc: fallbackDescription || DEFAULT_META.shortDesc
    };
}
