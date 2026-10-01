import fs from 'fs';
import path from 'path';
import { Hono } from 'hono';
import { getDB } from '../db/adapter.js';
import { checkSession } from '../middleware/auth.js';
import { generateMarketingContent } from '../services/marketing/marketingAi.service.js';
import { generateCardSvg } from '../services/marketing/ogCardRenderer.service.js';
import { publishToSocialMedia } from '../services/marketing/metaPublisher.service.js';
import { getMiniAppScreenshot, getMiniAppScreenshots } from '../services/marketing/screenshot.service.js';

export const marketingRoutes = new Hono<{ Variables: { adminUserId: string } }>();

// 관리자 권한 미들웨어 (브라우저 세션 쿠키 + Authorization 헤더 듀얼 지원)
const requireMarketingAdmin = async (c: any, next: any) => {
    // 1. 브라우저 세션 쿠키 우선 확인
    try {
        const sessionUser = await checkSession(c);
        if (sessionUser && (sessionUser.role === 'admin' || sessionUser.level >= 6)) {
            c.set('adminUserId', String(sessionUser.id));
            return next();
        }
    } catch (e) {}

    // 2. Authorization Bearer 헤더 확인 (REST 클라이언트 / 로컬스토리지 토큰 호환)
    const authHeader = c.req.header('Authorization');
    if (authHeader) {
        try {
            const token = authHeader.replace('Bearer ', '').trim();
            if (token && token !== 'true') {
                const decoded = Buffer.from(token, 'base64').toString();
                const userId = decoded.split(':')[0];
                if (userId) {
                    const DB = getDB(c);
                    const admin = await DB.prepare('SELECT id, level, status, role FROM users WHERE id = ?').bind(userId).first();
                    if (admin && (admin.role === 'admin' || admin.level >= 6) && admin.status === 'active') {
                        c.set('adminUserId', String(admin.id));
                        return next();
                    }
                }
            }
        } catch (e) {}
    }

    return c.json({ success: false, message: '관리자 권한이 필요합니다.' }, 401);
};

// 헬퍼: 활동 로그 기록
async function logActivity(db: any, userId: string | null, action: string, description: string) {
    try {
        await db.prepare('INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)')
            .bind(userId, action, description).run();
    } catch (e) {}
}

interface AppRegistryMeta {
    name: string;
    category: string;
    color: string;
    icon: string;
    description: string;
    features: string[];
    actionLabel: string;
    resultTitle: string;
    resultMetric: string;
    appUrl: string;
}

const APP_SLUG_ALIASES: Record<string, string> = {
    'webp': 'webp-converter',
    'lotto': 'saju',
    'customs': 'customs-calc',
    'dday': 'dday-calc',
    'age': 'age-calc',
    'interest': 'interest-calc',
    'severance': 'severance-calc',
    'salary': 'severance-calc',
    'text': 'text-checker',
    'pyeong': 'pyeong-calc',
    'base64': 'base64-converter',
    'svg': 'svg-converter',
    'json': 'json-formatter',
    'game-2048': '2048',
    'app-2048': '2048',
    'app-saju': 'saju',
    'app-omok': 'omok',
    'app-baseball': 'baseball',
};

function normalizeSlug(slug: string): string {
    const raw = (slug || '').trim().toLowerCase().replace(/^app-/, '');
    return APP_SLUG_ALIASES[raw] || raw;
}

const APP_REGISTRY: Record<string, AppRegistryMeta> = {
    'calculator': {
        name: '다기능 스마트 계산기',
        category: '금융 · 유틸리티',
        color: '#0284C7',
        icon: '🔢',
        description: '퍼센트·할인율·단위변환 올인원 무료 계산기',
        features: ['부가세/할인율 즉시 산출', '일반 수식 및 공학용 변환', '계산 내역 실시간 저장'],
        actionLabel: '실시간 수식 계산하기',
        resultTitle: '최종 계산 결과 리포트',
        resultMetric: '오차 없는 정밀 연산 100%',
        appUrl: '/app/calculator/'
    },
    'webp-converter': {
        name: 'WebP 이미지 초고속 압축기',
        category: '이미지 · 최적화',
        color: '#059669',
        icon: '🖼️',
        description: '화질 저하 없이 용량 최대 80% 압축 변환',
        features: ['서버 업로드 없는 브라우저 로컬 변환', 'WebP/PNG/JPG 상호 일괄 변환', '품질 조절 및 실시간 비교 뷰'],
        actionLabel: '무손실 WebP 변환 실행',
        resultTitle: '용량 78.4% 절감 완료',
        resultMetric: '2.4MB ➔ 520KB 압축 성공',
        appUrl: '/app/webp-converter/'
    },
    'saju': {
        name: '정밀 사주명리 & 운세 허브',
        category: '전통운세 · 행운도구',
        color: '#7E22CE',
        icon: '🔮',
        description: '8글자 사주원국 · 오행 밸런스 · 럭키 로또',
        features: ['정통 만세력 기반 4주 8자 정밀 분석', '오행 결핍 보완 맞춤 행운 처방', '매력 신살 지수 및 행운 로또 번호'],
        actionLabel: '나의 사주 원국 풀이하기',
        resultTitle: '오행 조화도 88점 · 황금운세',
        resultMetric: '올해 최고의 길신: 천을귀인(天乙)',
        appUrl: '/app/saju/'
    },
    'dday-calc': {
        name: '감성 D-Day 매니저',
        category: '일정 · 카운트다운',
        color: '#E11D48',
        icon: '📅',
        description: '시험·기념일·목표 달성 완벽 카운트다운',
        features: ['디데이 & 기념일 일괄 자동 등록', '주요 일정 남은 날짜 실시간 카운트', '감성 테마 및 캘린더 연동'],
        actionLabel: '새로운 목표 D-Day 등록',
        resultTitle: 'D-35일 (목표 달성률 68%)',
        resultMetric: '남은 시간: 840시간 15분',
        appUrl: '/app/dday-calc/'
    },
    'interest-calc': {
        name: '예·적금 이자 복리 계산기',
        category: '재테크 · 금융',
        color: '#16A34A',
        icon: '💰',
        description: '단리/복리 및 비과세·세후 실수령액 정밀 비교',
        features: ['정기예금/적금 만기 수령액 3초 계산', '일반과세(15.4%) 및 비과세 세금 정밀 반영', '월별 이자 발생 시뮬레이션 표'],
        actionLabel: '만기 수령액 정밀 계산',
        resultTitle: '세후 실수령액: 10,380,500원',
        resultMetric: '세전 이자 +450,000원 (실수령률 98.4%)',
        appUrl: '/app/interest-calc/'
    },
    'severance-calc': {
        name: '퇴직금 & 실업급여 계산기',
        category: '직장인 · 노무',
        color: '#EA580C',
        icon: '💼',
        description: '최근 3개월 급여 기준 퇴직금 실수령액 3초 조회',
        features: ['최신 근로기준법 통상/평균임금 자동 반영', '근속연수 공제 및 퇴직소득세 자동 계산', '실업급여 예상 수급액 동시 산출'],
        actionLabel: '예상 퇴직금 3초 계산하기',
        resultTitle: '예상 퇴직 실수령액: 32,450,000원',
        resultMetric: '근속기간: 4년 8개월 (세금 48만원 공제)',
        appUrl: '/app/severance-calc/'
    },
    'customs-calc': {
        name: '해외직구 관·부가세 계산기',
        category: '쇼핑 · 관세',
        color: '#0284C7',
        icon: '✈️',
        description: '미국($200)/일반($150) 목록통관 기준 관세 실시간 계산',
        features: ['품목별 관세율(0~13%) 및 부가세(10%) 자동 적용', '실시간 고시 환율 기반 한화 환산', '합산과세 방지 면세 범위 체크'],
        actionLabel: '예상 관·부가세 산출하기',
        resultTitle: '최종 납부 예상세액: 38,200원',
        resultMetric: '목록통관 기준: 과세 대상 ($189.50)',
        appUrl: '/app/customs-calc/'
    },
    'text-checker': {
        name: '글자수 세기 & 맞춤법 검사기',
        category: '문서 · 작성',
        color: '#2563EB',
        icon: '📝',
        description: '공백 포함/제외 실시간 글자수 및 바이트 측정',
        features: ['공백 포함/제외 글자수 실시간 동시 집계', '자기소개서·이력서 맞춤법 자동 검사', '원고지 매수 및 읽기 소요 시간 예측'],
        actionLabel: '글자수 분석 및 맞춤법 검사',
        resultTitle: '총 1,420자 (공백제외 1,080자)',
        resultMetric: '한글 2,840 Bytes · 원고지 7.1매',
        appUrl: '/app/text-checker/'
    },
    'pyeong-calc': {
        name: '아파트 평수·제곱미터 변환기',
        category: '부동산 · 생활',
        color: '#0D9488',
        icon: '📐',
        description: '공급·전용면적 및 실평수 양방향 즉시 환산',
        features: ['평(坪) ↔ 제곱미터(㎡) 0.1초 양방향 변환', '국민평형 84㎡(34평), 59㎡(24평) 원클릭 프리셋', '전용률 계산 및 실평수 비교 분석'],
        actionLabel: '면적 양방향 환산하기',
        resultTitle: '84.92㎡ ➔ 25.68평 (실평수 34평형)',
        resultMetric: '전용률 75.5% · 안심 주거 면적',
        appUrl: '/app/pyeong-calc/'
    },
    'base64-converter': {
        name: 'Base64 텍스트/이미지 변환기',
        category: '개발자 · 유틸리티',
        color: '#4F46E5',
        icon: '⚡',
        description: '텍스트 및 이미지 파일 Base64 상호 인코딩/디코딩',
        features: ['UTF-8 한글 완벽 지원 텍스트 인코딩', '이미지 드래그 앤 드롭 DataURL 즉시 추출', '클립보드 원클릭 복사 및 실시간 미리보기'],
        actionLabel: 'Base64 상호 변환 실행',
        resultTitle: '변환 완료: Data URI 100% 정상',
        resultMetric: '인코딩 크기: 4,820자 (UTF-8 OK)',
        appUrl: '/app/base64-converter/'
    },
    'json-formatter': {
        name: 'JSON 포맷터 & 데이터 뷰어',
        category: '개발자 · 데이터',
        color: '#7C3AED',
        icon: '💻',
        description: '트리 뷰어 및 구문 오류 하이라이팅',
        features: ['지저분한 JSON 2탭/4탭 자동 정렬', '구문 에러 라인 실시간 감지', '트리 구조 확장/축소 및 미니파이'],
        actionLabel: 'JSON 정렬 및 유효성 검사',
        resultTitle: '유효한 JSON 포맷팅 완료',
        resultMetric: '유효성: 정상 (오류 없음 · 14개 노드)',
        appUrl: '/app/json-formatter/'
    },
    'svg-converter': {
        name: 'Vector Studio (SVG 변환기)',
        category: '디자인 · 벡터',
        color: '#9333EA',
        icon: '🎨',
        description: 'PNG/JPG 이미지의 초정밀 SVG 벡터화 및 최적화',
        features: ['비트맵 이미지를 깔끔한 벡터 패스로 변환', 'SVG 코드 용량 최적화 및 인라인 뷰어', '색상 팔레트 추출 및 React 컴포넌트 복사'],
        actionLabel: '벡터 SVG 변환 실행',
        resultTitle: '벡터 패스 128개 추출 완료',
        resultMetric: '용량 62% 최적화 · 무한 확대 무손실',
        appUrl: '/app/svg-converter/'
    },
    'age-calc': {
        name: '만 나이 & 띠 계산기',
        category: '생활 · 행정',
        color: '#D97706',
        icon: '🎂',
        description: '개정 만 나이 법안 기준 정확한 나이·생일 디데이',
        features: ['개정 만 나이 통일법 100% 정밀 적용', '12간지 띠 및 탄생 별자리 즉시 확인', '다음 생일까지 남은 일수 디데이 카운트'],
        actionLabel: '만 나이 및 생일 확인하기',
        resultTitle: '현재 만 29세 (소띠 · 처녀자리)',
        resultMetric: '다음 생일까지 앞으로 D-112일',
        appUrl: '/app/age-calc/'
    },
    'ocr': {
        name: '이미지 글자 추출기 (OCR)',
        category: '문서 · AI도구',
        color: '#0891B2',
        icon: '📄',
        description: '이미지 속 텍스트를 브라우저에서 즉시 추출',
        features: ['스크린샷·영수증·서류 이미지 텍스트 인식', '한국어/영어 고정밀 Tesseract 엔진 탑재', '추출된 텍스트 텍스트파일 즉시 다운로드'],
        actionLabel: '이미지 글자 추출 실행',
        resultTitle: '텍스트 18줄 인식 완료 (정확도 99.2%)',
        resultMetric: '인식 글자수: 480자 · 즉시 복사 가능',
        appUrl: '/app/ocr/'
    },
    '2048': {
        name: '베라 2048 퍼즐',
        category: '게임 · 두뇌퍼즐',
        color: '#EAB308',
        icon: '🎮',
        description: '숫자 블록을 합쳐 2048을 완성하는 두뇌 게임',
        features: ['부드러운 타일 슬라이딩 애니메이션', '최고 점수 및 명예의 전당 로컬 저장', '실행 취소(Undo) 및 다양한 보드 크기'],
        actionLabel: '새로운 2048 게임 시작',
        resultTitle: '현재 스코어: 4,096점 갱신!',
        resultMetric: '최대 블록: 1024 완성 (상위 5%)',
        appUrl: '/app/2048/'
    },
    'sudoku': {
        name: '베라 프리미엄 스도쿠',
        category: '게임 · 두뇌퍼즐',
        color: '#4338CA',
        icon: '🧩',
        description: '초급부터 전문가까지 매일 즐기는 정통 스도쿠',
        features: ['난이도별 무제한 퍼즐 자동 생성', '후보 숫자 메모 기능 및 자동 오류 체크', '타이머 및 클리어 통계 관리'],
        actionLabel: '스도쿠 퍼즐 시작하기',
        resultTitle: '스도쿠 클리어! (소요시간 4분 12초)',
        resultMetric: '실수 횟수: 0회 · 완벽한 논리 클리어',
        appUrl: '/app/sudoku/'
    },
    'minesweeper': {
        name: '베라 지뢰찾기 클래식',
        category: '게임 · 클래식',
        color: '#DC2626',
        icon: '💣',
        description: '긴장감 넘치는 윈도우 감성 명작 지뢰찾기',
        features: ['첫 클릭 지뢰 방지 100% 안심 시스템', '초급/중급/고급 및 커스텀 보드 설정', '깃발 꽂기 햅틱 및 실시간 타이머'],
        actionLabel: '지뢰찾기 보드 생성하기',
        resultTitle: '작전 성공! 지뢰 10개 완벽 탐지',
        resultMetric: '클리어 타임: 28초 (신기록 달성)',
        appUrl: '/app/minesweeper/'
    },
    'baseball': {
        name: '베라 숫자야구 게임',
        category: '게임 · 심리추리',
        color: '#2563EB',
        icon: '⚾',
        description: '스트라이크 & 볼 카운트로 찾는 3자리/4자리 숫자',
        features: ['컴퓨터 비밀 숫자 3자리/4자리 모드', '이닝별 스트라이크/볼 히스토리 보드', '최적의 추리 알고리즘 힌트 제공'],
        actionLabel: '첫 번째 투구 예측 입력',
        resultTitle: '3 Strike! 홈런 클리어 (5이닝 승리)',
        resultMetric: '정답: [7, 2, 9] · 탁월한 추리력',
        appUrl: '/app/baseball/'
    },
    'omok': {
        name: '베라 오목 (AI & 대전)',
        category: '게임 · 전략보드',
        color: '#1E293B',
        icon: '⚫',
        description: '스마트 AI 대전 및 2인 대전 정통 15줄 오목',
        features: ['삼삼(3-3) 금수 룰 완벽 판정', '스마트 미니맥스 AI 대전 모드', '착수 효과음 및 명경기 기보 복기'],
        actionLabel: '오목 대국 시작하기',
        resultTitle: '흑(Black) 5목 완성 승리!',
        resultMetric: '총 착수: 32수 · 완벽한 승리 전략',
        appUrl: '/app/omok/'
    }
};

function getAppMeta(slug: string, fallbackName: string = ''): AppRegistryMeta {
    const norm = normalizeSlug(slug);
    if (APP_REGISTRY[norm]) return APP_REGISTRY[norm];

    const clean = norm.replace(/^app-/, '');
    const displayName = fallbackName || clean.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

    return {
        name: displayName,
        category: '스마트 유틸리티',
        color: '#4F46E5',
        icon: '⚡',
        description: '로그인 없이 브라우저에서 즉시 실행하는 유용한 웹 툴',
        features: ['100% 무료 즉시 실행', '개인정보 안심 로컬 처리', '모바일/PC 완벽 반응형 UI'],
        actionLabel: '실시간 기능 실행하기',
        resultTitle: '최종 산출 결과 리포트',
        resultMetric: '정상 처리 완료 100%',
        appUrl: `/app/${norm}/`
    };
}

function findScreenshotFile(slug: string, stepIndex: number): Buffer | null {
    const normSlug = normalizeSlug(slug);
    const candidateFilenames = [
        `${slug}_step${stepIndex}.png`,
        `${slug}_key${stepIndex}.png`,
        `${normSlug}_step${stepIndex}.png`,
        `${normSlug}_key${stepIndex}.png`,
        `app-${slug}_step${stepIndex}.png`,
        `app-${slug}_key${stepIndex}.png`,
        `app-${normSlug}_step${stepIndex}.png`,
        `app-${normSlug}_key${stepIndex}.png`,
        `${slug}.png`,
        `${normSlug}.png`
    ];

    const candidateDirs = [
        path.resolve(process.cwd(), 'public/uploads/marketing/screenshots'),
        path.resolve(process.cwd(), 'apps/api-server/public/uploads/marketing/screenshots'),
        path.resolve('./public/uploads/marketing/screenshots')
    ];

    for (const dir of candidateDirs) {
        for (const fn of candidateFilenames) {
            const fp = path.join(dir, fn);
            if (fs.existsSync(fp)) {
                try {
                    const buf = fs.readFileSync(fp);
                    if (buf.length > 100) return buf;
                } catch (e) {}
            }
        }
    }
    return null;
}

function generateMockupSvg(slug: string, stepIndex: number, appName: string = ''): string {
    const meta = getAppMeta(slug, appName);
    const step = Math.max(1, Math.min(3, stepIndex || 1));
    const stepTitles = [
        '1단계: 진입 화면 (Entry)',
        '2단계: 메인 조작 (Action)',
        '3단계: 결과 리포트 (Result)'
    ];
    const stepSubtitle = [
        '무료 접속 직후 시작 화면',
        '주요 파라미터 조작 및 입력',
        '최종 산출 결과 및 분석 리포트'
    ];
    const stepBadges = ['INTRO · ENTRY', 'INTERACTION · ACTION', 'FINAL REPORT · RESULT'];
    const currentStepTitle = stepTitles[step - 1];
    const currentStepSub = stepSubtitle[step - 1];
    const currentBadge = stepBadges[step - 1];

    let contentBodySvg = '';

    if (step === 1) {
        // [1단계: 진입/소개 화면]
        contentBodySvg = `
  <!-- Step 1: Hero & Intro Card -->
  <g filter="url(#cardShadow)">
    <rect x="20" y="210" width="390" height="230" rx="24" fill="#FFFFFF" />
    <circle cx="68" cy="268" r="32" fill="${meta.color}" opacity="0.12" />
    <text x="68" y="278" font-size="30" text-anchor="middle">${meta.icon}</text>
    <text x="114" y="260" font-family="-apple-system, sans-serif" font-size="20" font-weight="900" fill="#0F172A">${meta.name}</text>
    <rect x="114" y="272" width="130" height="22" rx="6" fill="#F1F5F9" />
    <text x="122" y="287" font-family="-apple-system, sans-serif" font-size="11" font-weight="700" fill="#64748B">${meta.category}</text>
    <text x="40" y="335" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#334155">${meta.description}</text>
    <line x1="40" y1="365" x2="390" y2="365" stroke="#F1F5F9" stroke-width="1.5" />
    <circle cx="52" cy="395" r="4" fill="#10B981" />
    <text x="66" y="399" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#10B981">로그인 불필요 · 100% 무료 즉시 사용 가능</text>
  </g>

  <!-- Key Value Points -->
  <g filter="url(#cardShadow)">
    <rect x="20" y="460" width="390" height="210" rx="20" fill="#FFFFFF" />
    <text x="40" y="495" font-family="-apple-system, sans-serif" font-size="14" font-weight="800" fill="#0F172A">핵심 특장점 &amp; 기능</text>
    
    <rect x="36" y="515" width="358" height="38" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
    <text x="52" y="539" font-family="-apple-system, sans-serif" font-size="13" font-weight="700" fill="${meta.color}">✓</text>
    <text x="74" y="539" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#1E293B">${meta.features[0] || '초고속 실행'}</text>

    <rect x="36" y="563" width="358" height="38" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
    <text x="52" y="587" font-family="-apple-system, sans-serif" font-size="13" font-weight="700" fill="${meta.color}">✓</text>
    <text x="74" y="587" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#1E293B">${meta.features[1] || '안심 보안'}</text>

    <rect x="36" y="611" width="358" height="38" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
    <text x="52" y="635" font-family="-apple-system, sans-serif" font-size="13" font-weight="700" fill="${meta.color}">✓</text>
    <text x="74" y="635" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#1E293B">${meta.features[2] || '반응형 UI'}</text>
  </g>

  <!-- Big Start CTA -->
  <g filter="url(#cardShadow)">
    <rect x="20" y="690" width="390" height="58" rx="16" fill="${meta.color}" />
    <text x="215" y="726" font-family="-apple-system, sans-serif" font-size="16" font-weight="800" fill="#FFFFFF" text-anchor="middle">🚀 지금 바로 무료 시작하기</text>
  </g>`;
    } else if (step === 2) {
        // [2단계: 조작/입력 화면]
        contentBodySvg = `
  <!-- Step 2: Interactive Input Form -->
  <g filter="url(#cardShadow)">
    <rect x="20" y="210" width="390" height="240" rx="24" fill="#FFFFFF" />
    <text x="40" y="248" font-family="-apple-system, sans-serif" font-size="15" font-weight="800" fill="#0F172A">입력 파라미터 및 옵션 설정</text>

    <rect x="38" y="268" width="354" height="48" rx="12" fill="#F8FAFC" stroke="${meta.color}" stroke-width="1.8" />
    <text x="56" y="298" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="#0F172A">테스트 데이터 자동 입력됨</text>
    <circle cx="366" cy="292" r="10" fill="${meta.color}" opacity="0.2" />
    <text x="366" y="296" font-size="11" font-weight="900" fill="${meta.color}" text-anchor="middle">✓</text>

    <!-- Preset Chips -->
    <rect x="38" y="332" width="76" height="30" rx="8" fill="${meta.color}" opacity="0.12" />
    <text x="76" y="352" font-family="-apple-system, sans-serif" font-size="11" font-weight="800" fill="${meta.color}" text-anchor="middle">기본값 A</text>

    <rect x="122" y="332" width="76" height="30" rx="8" fill="#F1F5F9" />
    <text x="160" y="352" font-family="-apple-system, sans-serif" font-size="11" font-weight="700" fill="#64748B" text-anchor="middle">옵션 B</text>

    <rect x="206" y="332" width="76" height="30" rx="8" fill="#F1F5F9" />
    <text x="244" y="352" font-family="-apple-system, sans-serif" font-size="11" font-weight="700" fill="#64748B" text-anchor="middle">옵션 C</text>

    <!-- Range/Slider Bar -->
    <text x="40" y="396" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#64748B">정밀도 조절: 100% 최적화</text>
    <rect x="38" y="408" width="354" height="8" rx="4" fill="#E2E8F0" />
    <rect x="38" y="408" width="280" height="8" rx="4" fill="${meta.color}" />
    <circle cx="318" cy="412" r="10" fill="${meta.color}" stroke="#FFFFFF" stroke-width="2.5" />
  </g>

  <!-- Action Controller Panel -->
  <g filter="url(#cardShadow)">
    <rect x="20" y="470" width="390" height="150" rx="20" fill="#FFFFFF" />
    <text x="40" y="505" font-family="-apple-system, sans-serif" font-size="14" font-weight="800" fill="#0F172A">실시간 프리뷰 &amp; 조작</text>
    <rect x="38" y="525" width="354" height="74" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-dasharray="4 4" />
    <text x="215" y="567" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="#64748B" text-anchor="middle">설정값에 따른 실시간 변환 감지 중...</text>
  </g>

  <!-- Big Action Button -->
  <g filter="url(#cardShadow)">
    <rect x="20" y="640" width="390" height="58" rx="16" fill="${meta.color}" />
    <text x="215" y="676" font-family="-apple-system, sans-serif" font-size="16" font-weight="800" fill="#FFFFFF" text-anchor="middle">⚡ ${meta.actionLabel}</text>
  </g>`;
    } else {
        // [3단계: 결과 리포트 화면]
        contentBodySvg = `
  <!-- Step 3: Result Showcase Card -->
  <g filter="url(#cardShadow)">
    <rect x="20" y="210" width="390" height="260" rx="24" fill="#FFFFFF" />
    
    <!-- Success Badge -->
    <rect x="40" y="235" width="124" height="28" rx="14" fill="#ECFDF5" />
    <circle cx="54" cy="249" r="6" fill="#10B981" />
    <text x="68" y="254" font-family="-apple-system, sans-serif" font-size="12" font-weight="800" fill="#059669">분석 · 산출 완료</text>

    <!-- Main Output Headline -->
    <text x="40" y="302" font-family="-apple-system, sans-serif" font-size="20" font-weight="900" fill="#0F172A">${meta.resultTitle}</text>
    <text x="40" y="328" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="${meta.color}">★ ${meta.resultMetric}</text>

    <line x1="40" y1="350" x2="390" y2="350" stroke="#F1F5F9" stroke-width="1.5" />

    <!-- 2-Col Stat Boxes -->
    <rect x="40" y="366" width="168" height="80" rx="14" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
    <text x="56" y="394" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#64748B">신뢰도 &amp; 정확도</text>
    <text x="56" y="426" font-family="-apple-system, sans-serif" font-size="22" font-weight="900" fill="#10B981">99.9%</text>

    <rect x="222" y="366" width="168" height="80" rx="14" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
    <text x="238" y="394" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#64748B">처리 소요 시간</text>
    <text x="238" y="426" font-family="-apple-system, sans-serif" font-size="22" font-weight="900" fill="#0284C7">0.12초</text>
  </g>

  <!-- Share & Next Actions Dock -->
  <g filter="url(#cardShadow)">
    <rect x="20" y="490" width="390" height="150" rx="20" fill="#FFFFFF" />
    <text x="40" y="525" font-family="-apple-system, sans-serif" font-size="14" font-weight="800" fill="#0F172A">결과 활용 &amp; 공유</text>
    
    <rect x="38" y="545" width="172" height="46" rx="12" fill="${meta.color}" />
    <text x="124" y="574" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="#FFFFFF" text-anchor="middle">📋 결과값 복사</text>

    <rect x="220" y="545" width="172" height="46" rx="12" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1" />
    <text x="306" y="574" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="#334155" text-anchor="middle">🔗 링크 공유하기</text>

    <text x="215" y="622" font-family="-apple-system, sans-serif" font-size="12" font-weight="600" fill="#94A3B8" text-anchor="middle">결과는 브라우저 로컬에 안전하게 보관됩니다.</text>
  </g>

  <!-- Reset Button -->
  <g filter="url(#cardShadow)">
    <rect x="20" y="660" width="390" height="52" rx="14" fill="#0F172A" />
    <text x="215" y="692" font-family="-apple-system, sans-serif" font-size="14" font-weight="800" fill="#FFFFFF" text-anchor="middle">🔄 다른 조건으로 다시 실행하기</text>
  </g>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="430" height="860" viewBox="0 0 430 860">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#EDF2F7" />
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0F172A" flood-opacity="0.07" />
    </filter>
  </defs>
  <rect width="430" height="860" fill="url(#bg)" />

  <!-- Status Bar Mock -->
  <rect x="0" y="0" width="430" height="44" fill="#FFFFFF" opacity="0.9" />
  <text x="32" y="28" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="#0F172A">9:41</text>
  <circle cx="390" cy="22" r="4" fill="#0F172A" />
  <circle cx="376" cy="22" r="4" fill="#0F172A" />

  <!-- App Header Bar -->
  <rect x="20" y="58" width="390" height="64" rx="18" fill="#FFFFFF" filter="url(#cardShadow)" />
  <circle cx="54" cy="90" r="18" fill="${meta.color}" />
  <text x="54" y="96" font-size="16" text-anchor="middle">${meta.icon}</text>
  <text x="84" y="93" font-family="-apple-system, sans-serif" font-size="16" font-weight="800" fill="#0F172A">${meta.name}</text>
  <rect x="84" y="99" width="60" height="15" rx="4" fill="#F1F5F9" />
  <text x="88" y="110" font-family="-apple-system, sans-serif" font-size="9" font-weight="700" fill="#64748B">${meta.category}</text>
  <text x="382" y="96" font-size="18" fill="#94A3B8" text-anchor="end">✕</text>

  <!-- Step Indicator Badge -->
  <rect x="20" y="134" width="390" height="60" rx="16" fill="#FFFFFF" filter="url(#cardShadow)" />
  <rect x="34" y="146" width="134" height="22" rx="6" fill="${meta.color}" opacity="0.12" />
  <text x="42" y="161" font-family="-apple-system, sans-serif" font-size="10" font-weight="900" fill="${meta.color}">${currentBadge}</text>
  <text x="34" y="184" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="#0F172A">${currentStepTitle}</text>
  <text x="390" y="184" font-family="-apple-system, sans-serif" font-size="11" font-weight="600" fill="#94A3B8" text-anchor="end">${currentStepSub}</text>

  <!-- Step Content Body -->
  ${contentBodySvg}

  <!-- Footer Branding -->
  <rect x="20" y="792" width="390" height="44" rx="22" fill="#0F172A" />
  <circle cx="44" cy="814" r="8" fill="#10B981" />
  <text x="62" y="819" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="#FFFFFF">VeraNex Mini App Standard</text>
  <text x="386" y="819" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#94A3B8" text-anchor="end">veranex.app</text>
</svg>`;
}

// ==================== 0. 스크린샷 이미지 직접 제공 (디스크 PNG 우선, 부재 시 고품질 SVG 목업 반환) ====================
marketingRoutes.get('/api/admin/marketing/screenshot-image/:slug/:index', async (c) => {
    const slug = path.basename(c.req.param('slug') || '');
    const indexStr = c.req.param('index') || '1';
    const index = Math.max(1, Math.min(3, parseInt(indexStr, 10) || 1));

    // 1. 디스크에 실제 파일이 있는지 다중 경로 및 파일명 별칭으로 검색
    const fileBuf = findScreenshotFile(slug, index);
    if (fileBuf) {
        return new Response(fileBuf as any, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': String(fileBuf.length),
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    // 2. 디스크에 파일이 아직 없는 경우 미니앱별 특화 SVG 반환
    const fallbackSvg = generateMockupSvg(slug, index);
    return new Response(fallbackSvg, {
        status: 200,
        headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=60',
            'Access-Control-Allow-Origin': '*'
        }
    });
});

// 파일명 직접 접근 정적 서빙 라우트 (_step1.png, _key1.png, lotto_step1.png 등 모두 완벽 지원)
marketingRoutes.get('/uploads/marketing/screenshots/:filename', async (c) => {
    const rawFilename = path.basename(c.req.param('filename') || '');

    // 파일명 파싱 정규식: _key1, _step1, -step2, _3 등 유연하게 지원
    const match = rawFilename.match(/^(.+?)[_.-](?:key|step|stage)?([1-3])\.(?:png|jpg|webp)$/i);
    const slug = match ? match[1] : rawFilename.replace(/\.[^.]+$/, '');
    const idx = match ? parseInt(match[2], 10) : 1;

    // 1. 디스크에 실제 파일이 있는지 다중 경로 및 파일명 별칭으로 검색
    const fileBuf = findScreenshotFile(slug, idx);
    if (fileBuf) {
        return new Response(fileBuf as any, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': String(fileBuf.length),
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    // 2. 디스크에 파일이 아직 없는 경우 앱별 고품질 차별화 SVG 목업 반환
    const fallbackSvg = generateMockupSvg(slug, idx);
    return new Response(fallbackSvg, {
        status: 200,
        headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=60',
            'Access-Control-Allow-Origin': '*'
        }
    });
});

// ==================== 0-1. 스레드(Threads) 자동 업로드 전용 API ====================
// 단일 미니앱 스레드 마케팅 데이터 조회 (이미지 3개 + 스레드 본문 + 첫 댓글)
marketingRoutes.get('/api/marketing/threads/:slug', async (c) => {
    const rawSlug = path.basename(c.req.param('slug') || '');
    const normSlug = normalizeSlug(rawSlug);
    const useAi = c.req.query('ai') !== 'false';
    const DB = getDB(c);

    // 1. DB에서 미니앱 메타 조회 (없으면 레지스트리에서 폴백)
    let app: any = null;
    try {
        app = await DB.prepare("SELECT * FROM mini_apps WHERE slug = ? OR slug = ?").bind(normSlug, rawSlug).first();
    } catch (e) {}

    const meta = getAppMeta(normSlug, app?.name || '');
    const name = app?.name || meta.name;
    const description = app?.description || meta.description;
    const category = app?.category || meta.category;
    const appUrl = app?.app_url || meta.appUrl;

    const host = c.req.header('host') || 'veranex.app';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${proto}://${host}`;
    const fullAppUrl = appUrl.startsWith('http') ? appUrl : `${baseUrl}${appUrl.startsWith('/') ? '' : '/'}${appUrl}`;

    // 2. 처음(1), 중간(2), 마지막(3) 3단계 이미지 생성 및 URL 구성
    const stepLabels = ['진입 화면 (Entry)', '조작 화면 (Action)', '결과 리포트 (Result)'];
    const images = [1, 2, 3].map((step) => {
        const stepNum = step as 1 | 2 | 3;
        const relativeUrl = `/uploads/marketing/screenshots/${normSlug}_step${step}.png`;
        const keyRelativeUrl = `/uploads/marketing/screenshots/${normSlug}_key${step}.png`;
        const hasStep = findScreenshotFile(normSlug, step) !== null;

        return {
            step: stepNum,
            label: stepLabels[step - 1],
            url: `${baseUrl}${relativeUrl}`,
            keyUrl: `${baseUrl}${keyRelativeUrl}`,
            relativeUrl,
            fallbackSvgUrl: `${baseUrl}/api/admin/marketing/screenshot-image/${normSlug}/${step}`,
            hasRealFile: hasStep
        };
    });

    const imageUrls = images.map(img => img.url);

    // 3. 스레드(Threads) 최적화 텍스트 생성 (AI 또는 템플릿)
    let threadsContent: any = null;
    let instagramContent: any = null;

    if (useAi) {
        try {
            const aiResult = await generateMarketingContent({
                name,
                slug: normSlug,
                description,
                app_url: fullAppUrl,
                category
            });
            threadsContent = {
                headline: aiResult.headline,
                bodyText: aiResult.threadsBody,
                firstComment: aiResult.threadsFirstComment,
                hashtags: [aiResult.tag].filter(Boolean)
            };
            instagramContent = {
                caption: aiResult.instagramCaption,
                hashtags: aiResult.instagramHashtags
            };
        } catch (aiErr) {
            console.warn('[ThreadsAPI] AI generation failed, using template:', aiErr);
        }
    }

    if (!threadsContent) {
        threadsContent = {
            headline: `${name} 3초 만에 무료 실행`,
            bodyText: `제가 필요해서 직접 만든 [${name}]입니다.\n\n매번 번거롭게 찾기 귀찮아서 로그인 없이 브라우저에서 바로 쓸 수 있게 만들었습니다.\n\n• 100% 무료 · 즉시 실행\n• ${meta.features[0] || '빠르고 편리한 기능'}\n• ${meta.features[1] || '개인정보 안심 처리'}\n\n써보시고 개선할 점 있으면 댓글로 편하게 알려주세요!\n#생산성도구 #웹툴`,
            firstComment: `👉 [${name}] 바로가기 링크:\n${fullAppUrl}`,
            hashtags: ['#생산성도구', '#무료웹툴', '#꿀팁']
        };
        instagramContent = {
            caption: `📌 알아두면 무조건 써먹는 [${name}]\n\n로그인이나 설치 없이 바로 사용할 수 있는 실용적인 웹 툴입니다.\n\n링크는 프로필 상단에 걸어두었습니다!`,
            hashtags: ['#베라넥스', '#직장인꿀팁', '#생산성도구', '#무료유틸리티']
        };
    }

    return c.json({
        success: true,
        data: {
            slug: normSlug,
            name,
            description,
            category,
            appUrl,
            fullAppUrl,
            images,
            imageUrls,
            threads: threadsContent,
            instagram: instagramContent
        }
    });
});

// 전체 미니앱 스레드 마케팅 목록 조회 (자동화 봇 순회용)
marketingRoutes.get('/api/marketing/threads', async (c) => {
    const DB = getDB(c);
    const host = c.req.header('host') || 'veranex.app';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${proto}://${host}`;

    let apps: any[] = [];
    try {
        const result = await DB.prepare("SELECT slug, name, description, app_url, category FROM mini_apps WHERE status = 'active' ORDER BY sort_order ASC").all();
        apps = result.results || [];
    } catch (e) {}

    // DB에 없는 레지스트리 항목도 병합
    const dbSlugs = new Set(apps.map(a => a.slug));
    for (const [slugKey, meta] of Object.entries(APP_REGISTRY)) {
        if (!dbSlugs.has(slugKey)) {
            apps.push({
                slug: slugKey,
                name: meta.name,
                description: meta.description,
                app_url: meta.appUrl,
                category: meta.category
            });
        }
    }

    const items = apps.map(app => {
        const normSlug = normalizeSlug(app.slug);
        const fullAppUrl = app.app_url.startsWith('http')
            ? app.app_url
            : `${baseUrl}${app.app_url.startsWith('/') ? '' : '/'}${app.app_url}`;

        const imageUrls = [1, 2, 3].map(step => `${baseUrl}/uploads/marketing/screenshots/${normSlug}_step${step}.png`);

        return {
            slug: normSlug,
            name: app.name,
            description: app.description || '',
            category: app.category || '',
            fullAppUrl,
            imageUrls,
            endpoint: `${baseUrl}/api/marketing/threads/${normSlug}`
        };
    });

    return c.json({
        success: true,
        data: {
            total: items.length,
            items
        }
    });
});

marketingRoutes.use('/api/admin/marketing/*', requireMarketingAdmin);
marketingRoutes.use('/api/admin/marketing', requireMarketingAdmin);

// ==================== 1. AI 카피 및 카드뉴스 즉시 생성 ====================
marketingRoutes.post('/api/admin/marketing/generate', async (c) => {
    const DB = getDB(c);
    try {
        const body = await c.req.json();
        const { serviceSlug, forceScreenshot = false } = body;

        if (!serviceSlug) {
            return c.json({ success: false, message: '대상 서비스(serviceSlug)를 선택해주세요.' }, 400);
        }

        // mini_apps 테이블에서 메타데이터 조회
        const app = await DB.prepare("SELECT * FROM mini_apps WHERE slug = ?").bind(serviceSlug).first();
        if (!app) {
            return c.json({ success: false, message: '등록되지 않은 미니앱입니다.' }, 404);
        }

        // 1. 미니앱 실제 화면 3단계 멀티 컷 캡처 (홈, 입력, 결과)
        let screenshots: string[] = [];
        try {
            screenshots = await getMiniAppScreenshots({
                slug: app.slug,
                targetUrl: app.app_url,
                name: app.name,
                force: Boolean(forceScreenshot)
            });
        } catch (e: any) {
            console.warn('[MarketingAPI] Screenshot capture error:', e.message);
        }

        const screenshotUri = screenshots[0] || '';

        // 2. Gemini AI 마케팅 카피 생성
        const aiResult = await generateMarketingContent({
            name: app.name,
            slug: app.slug,
            description: app.description || '',
            app_url: app.app_url,
            category: app.category || '유틸리티'
        });

        // 3. 1080x1080 동적 카드뉴스 SVG 생성 (최소 3개 화면이 담긴 슬라이드 1, 2, 3 세트)
        const cardSvg = generateCardSvg({
            title: aiResult.headline,
            subtitle: aiResult.subtitle,
            tag: aiResult.tag,
            domain: 'veranex.app',
            slug: app.slug,
            screenshots,
            screenshotUri,
            slideIndex: 1
        });

        const cardSvg2 = generateCardSvg({
            title: aiResult.headline,
            subtitle: aiResult.subtitle,
            tag: aiResult.tag,
            domain: 'veranex.app',
            slug: app.slug,
            screenshots,
            screenshotUri,
            slideIndex: 2
        });

        const cardSvg3 = generateCardSvg({
            title: aiResult.headline,
            subtitle: aiResult.subtitle,
            tag: aiResult.tag,
            domain: 'veranex.app',
            slug: app.slug,
            screenshots,
            screenshotUri,
            slideIndex: 3
        });

        return c.json({
            success: true,
            data: {
                app: {
                    name: app.name,
                    slug: app.slug,
                    app_url: app.app_url,
                    category: app.category
                },
                content: aiResult,
                screenshots,
                screenshotUri,
                cardSvg,
                cardSet: [cardSvg, cardSvg2, cardSvg3]
            }
        });
    } catch (err: any) {
        console.error('[MarketingAPI] generate error:', err);
        return c.json({ success: false, message: err.message || '카피 생성 중 오류가 발생했습니다.' }, 500);
    }
});

// ==================== 1-1. 미니앱 실화면 캡처 수동 요청 ====================
marketingRoutes.post('/api/admin/marketing/screenshot/capture', async (c) => {
    const DB = getDB(c);
    try {
        const body = await c.req.json();
        const { slug, force = true } = body;

        if (!slug) {
            return c.json({ success: false, message: '미니앱 slug가 필요합니다.' }, 400);
        }

        const app = await DB.prepare("SELECT * FROM mini_apps WHERE slug = ?").bind(slug).first();
        if (!app) {
            return c.json({ success: false, message: '미니앱을 찾을 수 없습니다.' }, 404);
        }

        const screenshots = await getMiniAppScreenshots({
            slug: app.slug,
            targetUrl: app.app_url,
            name: app.name,
            force: Boolean(force)
        });

        return c.json({
            success: true,
            screenshots,
            screenshotUri: screenshots[0] || ''
        });
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 1-2. 카드뉴스 실시간 미리보기 리렌더링 ====================
marketingRoutes.post('/api/admin/marketing/card-preview', async (c) => {
    try {
        const body = await c.req.json();
        const { title, subtitle, tag, domain, slug, screenshots, screenshotUri, slideIndex = 1 } = body;

        let resolvedScreenshots = Array.isArray(screenshots) && screenshots.length > 0
            ? screenshots
            : (screenshotUri ? [screenshotUri] : []);

        if (resolvedScreenshots.length === 0 && slug) {
            resolvedScreenshots = [
                `/api/admin/marketing/screenshot-image/${slug}/1`,
                `/api/admin/marketing/screenshot-image/${slug}/2`,
                `/api/admin/marketing/screenshot-image/${slug}/3`
            ];
        }

        const commonOptions = {
            title: title || '스마트 웹 툴킷',
            subtitle: subtitle || '브라우저에서 즉시 실행',
            tag: tag || '무료 도구',
            domain: domain || 'veranex.app',
            slug: slug || 'app',
            screenshots: resolvedScreenshots,
            screenshotUri: resolvedScreenshots[0] || '',
        };

        const cardSet = [
            generateCardSvg({ ...commonOptions, slideIndex: 1 }),
            generateCardSvg({ ...commonOptions, slideIndex: 2 }),
            generateCardSvg({ ...commonOptions, slideIndex: 3 })
        ];

        const targetSlide = Number(slideIndex) || 1;
        const svg = cardSet[targetSlide - 1] || cardSet[0];

        return c.json({
            success: true,
            svg,
            cardSet
        });
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 2. 마케팅 포스트 목록 조회 ====================
marketingRoutes.get('/api/admin/marketing/posts', async (c) => {
    const DB = getDB(c);
    try {
        const status = c.req.query('status'); // DRAFT, SCHEDULED, PUBLISHED, FAILED or empty for all
        const platform = c.req.query('platform');
        const limit = parseInt(c.req.query('limit') || '30', 10);
        const offset = parseInt(c.req.query('offset') || '0', 10);

        let query = "SELECT * FROM marketing_posts WHERE 1=1";
        const binds: any[] = [];

        if (status && status !== 'ALL') {
            query += " AND status = ?";
            binds.push(status);
        }

        if (platform && platform !== 'ALL') {
            query += " AND platform = ?";
            binds.push(platform);
        }

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        binds.push(limit, offset);

        const result = await DB.prepare(query).bind(...binds).all();

        // 전체 카운트
        const countResult = await DB.prepare("SELECT COUNT(*) as total FROM marketing_posts").first();

        return c.json({
            success: true,
            posts: result.results || [],
            total: countResult?.total || 0
        });
    } catch (err: any) {
        console.error('[MarketingAPI] list error:', err);
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 3. 마케팅 포스트 신규 등록 (저장/예약/즉시) ====================
marketingRoutes.post('/api/admin/marketing/posts', async (c) => {
    const DB = getDB(c);
    try {
        const body = await c.req.json();
        const {
            targetServiceSlug,
            targetServiceName,
            targetServiceUrl,
            platform = 'THREADS',
            headline,
            bodyText,
            firstComment,
            imageUrl,
            status = 'DRAFT',
            scheduledAt,
            publishImmediately = false
        } = body;

        if (!bodyText || !targetServiceSlug) {
            return c.json({ success: false, message: '필수 필드가 누락되었습니다.' }, 400);
        }

        const id = `mkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let postStatus = status;
        let publishedAt = null;
        let externalPostId = null;
        let errorMessage = null;

        // 즉시 발행 요청인 경우
        if (publishImmediately) {
            postStatus = 'PUBLISHING';
            const pubResult = await publishToSocialMedia({
                id,
                platform,
                headline,
                bodyText,
                firstComment,
                imageUrl
            });

            if (pubResult.success) {
                postStatus = 'PUBLISHED';
                publishedAt = new Date().toISOString();
                externalPostId = pubResult.externalPostId || (pubResult.isMock ? 'mock_success' : 'meta_success');
            } else {
                postStatus = 'FAILED';
                errorMessage = pubResult.error || '발행 실패';
            }
        }

        await DB.prepare(`
            INSERT INTO marketing_posts (
                id, target_service_slug, target_service_name, target_service_url,
                platform, headline, body_text, first_comment, image_url,
                status, scheduled_at, published_at, external_post_id, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id,
            targetServiceSlug,
            targetServiceName,
            targetServiceUrl,
            platform,
            headline || '',
            bodyText,
            firstComment || null,
            imageUrl || null,
            postStatus,
            scheduledAt || null,
            publishedAt,
            externalPostId,
            errorMessage
        ).run();

        const adminId = c.get('adminUserId');
        await logActivity(DB, adminId, 'MARKETING_CREATE', `마케팅 포스트 생성: ${headline} (${postStatus})`);

        return c.json({
            success: true,
            post: { id, status: postStatus, externalPostId, errorMessage }
        });
    } catch (err: any) {
        console.error('[MarketingAPI] create error:', err);
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 4. 마케팅 포스트 수정 ====================
marketingRoutes.put('/api/admin/marketing/posts/:id', async (c) => {
    const DB = getDB(c);
    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const { headline, bodyText, firstComment, platform, scheduledAt, status } = body;

        await DB.prepare(`
            UPDATE marketing_posts
            SET headline = COALESCE(?, headline),
                body_text = COALESCE(?, body_text),
                first_comment = COALESCE(?, first_comment),
                platform = COALESCE(?, platform),
                scheduled_at = COALESCE(?, scheduled_at),
                status = COALESCE(?, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(headline, bodyText, firstComment, platform, scheduledAt, status, id).run();

        return c.json({ success: true, message: '포스트가 수정되었습니다.' });
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 5. 1-Click 즉시 발행 ====================
marketingRoutes.post('/api/admin/marketing/posts/:id/publish-now', async (c) => {
    const DB = getDB(c);
    try {
        const id = c.req.param('id');
        const post = await DB.prepare("SELECT * FROM marketing_posts WHERE id = ?").bind(id).first();
        if (!post) {
            return c.json({ success: false, message: '존재하지 않는 포스트입니다.' }, 404);
        }

        // 상태를 PUBLISHING으로 업데이트
        await DB.prepare("UPDATE marketing_posts SET status = 'PUBLISHING' WHERE id = ?").bind(id).run();

        const pubResult = await publishToSocialMedia({
            id: post.id,
            platform: post.platform,
            headline: post.headline,
            bodyText: post.body_text,
            firstComment: post.first_comment,
            imageUrl: post.image_url
        });

        if (pubResult.success) {
            await DB.prepare(`
                UPDATE marketing_posts
                SET status = 'PUBLISHED',
                    published_at = CURRENT_TIMESTAMP,
                    external_post_id = ?,
                    error_message = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(pubResult.externalPostId || 'mock_published', id).run();

            const adminId = c.get('adminUserId');
            await logActivity(DB, adminId, 'MARKETING_PUBLISH', `마케팅 포스트 발행 완료: ${post.headline}`);

            return c.json({ success: true, isMock: pubResult.isMock, externalPostId: pubResult.externalPostId });
        } else {
            await DB.prepare(`
                UPDATE marketing_posts
                SET status = 'FAILED',
                    error_message = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(pubResult.error || '발행 실패', id).run();

            return c.json({ success: false, message: pubResult.error }, 500);
        }
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 6. 실패 포스트 재시도 ====================
marketingRoutes.post('/api/admin/marketing/posts/:id/retry', async (c) => {
    const DB = getDB(c);
    try {
        const id = c.req.param('id');
        const post = await DB.prepare("SELECT * FROM marketing_posts WHERE id = ?").bind(id).first();
        if (!post) {
            return c.json({ success: false, message: '포스트를 찾을 수 없습니다.' }, 404);
        }

        // 재시도 디스패치
        const pubResult = await publishToSocialMedia({
            id: post.id,
            platform: post.platform,
            headline: post.headline,
            bodyText: post.body_text,
            firstComment: post.first_comment,
            imageUrl: post.image_url
        });

        if (pubResult.success) {
            await DB.prepare(`
                UPDATE marketing_posts
                SET status = 'PUBLISHED',
                    published_at = CURRENT_TIMESTAMP,
                    external_post_id = ?,
                    error_message = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(pubResult.externalPostId || 'mock_retry_success', id).run();

            return c.json({ success: true, message: '재발행 성공' });
        } else {
            await DB.prepare(`
                UPDATE marketing_posts
                SET status = 'FAILED',
                    error_message = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(pubResult.error, id).run();

            return c.json({ success: false, message: pubResult.error }, 500);
        }
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 7. 포스트 삭제 ====================
marketingRoutes.delete('/api/admin/marketing/posts/:id', async (c) => {
    const DB = getDB(c);
    try {
        const id = c.req.param('id');
        await DB.prepare("DELETE FROM marketing_posts WHERE id = ?").bind(id).run();
        return c.json({ success: true, message: '삭제되었습니다.' });
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 8. 대시보드 통계 메트릭 ====================
marketingRoutes.get('/api/admin/marketing/stats', async (c) => {
    const DB = getDB(c);
    try {
        const total = await DB.prepare("SELECT COUNT(*) as count FROM marketing_posts").first();
        const draft = await DB.prepare("SELECT COUNT(*) as count FROM marketing_posts WHERE status = 'DRAFT'").first();
        const scheduled = await DB.prepare("SELECT COUNT(*) as count FROM marketing_posts WHERE status = 'SCHEDULED'").first();
        const published = await DB.prepare("SELECT COUNT(*) as count FROM marketing_posts WHERE status = 'PUBLISHED'").first();
        const failed = await DB.prepare("SELECT COUNT(*) as count FROM marketing_posts WHERE status = 'FAILED'").first();

        // 오늘 발행 건수
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayPublished = await DB.prepare(`
            SELECT COUNT(*) as count FROM marketing_posts 
            WHERE status = 'PUBLISHED' AND published_at >= ?
        `).bind(`${todayStr} 00:00:00`).first();

        return c.json({
            success: true,
            stats: {
                total: total?.count || 0,
                draft: draft?.count || 0,
                scheduled: scheduled?.count || 0,
                published: published?.count || 0,
                failed: failed?.count || 0,
                todayPublished: todayPublished?.count || 0
            }
        });
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ==================== 9. 자동화 설정 조회 및 저장 ====================
marketingRoutes.get('/api/admin/marketing/settings', async (c) => {
    const DB = getDB(c);
    try {
        const settings = await DB.prepare("SELECT * FROM marketing_settings").all();
        const config: Record<string, string> = {};
        for (const s of (settings.results || [])) {
            config[s.key] = s.value;
        }
        return c.json({ success: true, settings: config });
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

marketingRoutes.put('/api/admin/marketing/settings', async (c) => {
    const DB = getDB(c);
    try {
        const body = await c.req.json();
        for (const [key, value] of Object.entries(body)) {
            await DB.prepare(`
                INSERT INTO marketing_settings (key, value, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
            `).bind(key, String(value)).run();
        }
        return c.json({ success: true, message: '설정이 저장되었습니다.' });
    } catch (err: any) {
        return c.json({ success: false, message: err.message }, 500);
    }
});
