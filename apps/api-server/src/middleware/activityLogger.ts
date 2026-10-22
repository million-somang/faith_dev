import { Context, Next } from 'hono';

/**
 * KST (UTC+9) 시각 문자열 반환 (예: "19:15:04")
 */
export function getKstTimeString(): string {
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    return now.toISOString().substring(11, 19);
}

/**
 * IP 주소 부분 마스킹 (개인정보 보호 및 가독성 확보: 211.188.48.230 -> 211.188.48.*)
 */
export function maskIp(rawIp: string): string {
    if (!rawIp || rawIp === '0.0.0.0' || rawIp === '127.0.0.1' || rawIp === '::1') {
        return '로컬';
    }
    const ipv4 = rawIp.replace(/^::ffff:/, '');
    const parts = ipv4.split('.');
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
    }
    return ipv4.slice(0, 15);
}

/**
 * 요청 컨텍스트에서 클라이언트 IP 추출
 */
export function getClientIp(c: Context): string {
    const forwarded = c.req.header('X-Forwarded-For') || c.req.header('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return c.req.header('X-Real-IP') || c.req.header('x-real-ip') || '127.0.0.1';
}

/**
 * User-Agent에서 기기 구분 (Mobile / PC / Bot / API)
 */
export function getDeviceLabel(ua?: string): string {
    if (!ua) return 'API';
    const lower = ua.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone') || lower.includes('ipad')) {
        return 'Mobile';
    }
    if (lower.includes('bot') || lower.includes('crawl') || lower.includes('spider') || lower.includes('slurp') || lower.includes('yeti')) {
        return 'Bot';
    }
    if (lower.includes('curl') || lower.includes('python') || lower.includes('axios') || lower.includes('node')) {
        return 'Script';
    }
    return 'PC';
}

/**
 * 현재 요청 주체(회원 / API키 연동 / 비회원) 요약 문자열 반환
 */
export function getActorLabel(c: Context, explicitUserId?: number | string | null): string {
    try {
        const user = c.get('user') as { id?: number; email?: string; name?: string; nickname?: string } | undefined;
        const ua = c.req.header('User-Agent');
        const device = getDeviceLabel(ua);

        if (user && (user.email || user.name || user.id)) {
            const ident = user.name || user.nickname || user.email || `#${user.id}`;
            return `회원(${ident}·${device})`;
        }

        if (explicitUserId) {
            return `회원(#${explicitUserId}·${device})`;
        }

        const hasApiKey = Boolean(
            c.req.header('x-api-key') ||
            c.req.header('X-API-KEY') ||
            c.req.header('X-Api-Key') ||
            c.req.header('x-api-token')
        );
        if (hasApiKey) {
            return `API발행(${maskIp(getClientIp(c))})`;
        }

        const ipLabel = maskIp(getClientIp(c));
        if (ipLabel === '로컬' && (device === 'Script' || device === 'API')) {
            return '포털SSR(크롤러·프리뷰)';
        }

        return `비회원(${ipLabel}·${device})`;
    } catch {
        return '방문자';
    }
}

/**
 * 포털 URL 경로(path)를 사람이 읽기 쉬운 한글 콘텐츠 라벨로 변환
 */
const MINIAPP_NAMES: Record<string, string> = {
    'billiards': '3쿠션·4구 당구',
    'omok': '정통 오목',
    'janggi': '정통 장기',
    'flight': '스카이 파이터 비행슈팅',
    '2048': '2048 퍼즐',
    'sudoku': '스도쿠',
    'minesweeper': '지뢰찾기',
    'freecell': '프리셀 카드게임',
    'baseball': '숫자야구',
    'comboy': '추억의 컴보이 오락실',
    'sfc': '슈퍼패미컴 오락실',
    'vera-pop': '베라팝 아케이드',
    'calculator': '공학·일반 계산기',
    'text-checker': '글자수·맞춤법 검사기',
    'pyeong-calc': '평수·면적 변환기',
    'age-calc': '만 나이·띠 계산기',
    'dday-calc': '디데이(D-Day) 계산기',
    'json-formatter': 'JSON 포맷터',
    'base64-converter': 'Base64 인코더/디코더',
    'svg-converter': 'SVG 이미지 변환기',
    'webp-converter': 'WebP 이미지 변환기',
    'image-resizer': '이미지 리사이저',
    'ocr': 'AI 이미지 텍스트 추출(OCR)',
    'severance-calc': '퇴직금 계산기',
    'interest-calc': '예적금·대출 이자 계산기',
    'customs-calc': '해외직구 관부가세 계산기',
    'vacation-planner': '연차·휴가 플래너',
    'saju': '정통 사주·오늘의 운세',
    'novel': '웹소설 뷰어',
    'news': '실시간 뉴스'
};

export function describePortalPath(rawPath: string): { icon: string; category: string; label: string } {
    const cleanPath = (rawPath || '/').split('?')[0];

    if (cleanPath === '/' || cleanPath === '') {
        return { icon: '🏠', category: '포털홈', label: '메인 홈 화면' };
    }
    if (cleanPath === '/news') {
        return { icon: '📰', category: '뉴스탐색', label: '뉴스 메인 목록' };
    }
    if (cleanPath.startsWith('/news/')) {
        const id = cleanPath.replace('/news/', '');
        return { icon: '📰', category: '뉴스본문', label: `뉴스 기사 #${id}` };
    }
    if (cleanPath === '/entertainment/travel' || cleanPath === '/travel') {
        return { icon: '🗺️', category: '여행탐색', label: '재미 - 여행 메인 & 대한민국 지도' };
    }
    if (cleanPath.startsWith('/entertainment/travel/')) {
        const id = cleanPath.replace('/entertainment/travel/', '');
        return { icon: '📖', category: '여행상세', label: `여행기 상세 #${id}` };
    }
    if (cleanPath === '/entertainment/novel' || cleanPath === '/novel') {
        return { icon: '📚', category: '웹소설', label: '웹소설 메인 목록' };
    }
    if (cleanPath.startsWith('/entertainment/novel/') || cleanPath.startsWith('/novel/')) {
        const id = cleanPath.replace(/^\/(entertainment\/)?novel\//, '');
        return { icon: '📚', category: '웹소설', label: `웹소설 작품 #${id}` };
    }
    if (cleanPath === '/entertainment/saju') {
        return { icon: '🔮', category: '사주운세', label: '재미 - 사주·운세' };
    }
    if (cleanPath === '/entertainment') {
        return { icon: '🎡', category: '엔터홈', label: '재미(엔터테인먼트) 허브' };
    }
    if (cleanPath === '/game') {
        return { icon: '🎮', category: '게임허브', label: '미니게임 전체 목록' };
    }
    if (cleanPath.startsWith('/game/')) {
        const slug = cleanPath.replace('/game/', '').split('/')[0];
        const gameName = MINIAPP_NAMES[slug] || slug;
        return { icon: '🎮', category: '미니게임', label: `${gameName} (/game/${slug})` };
    }
    if (cleanPath.startsWith('/app/')) {
        const slug = cleanPath.replace('/app/', '').split('/')[0];
        const appName = MINIAPP_NAMES[slug] || slug;
        return { icon: '🧩', category: '미니앱실행', label: `${appName} (/app/${slug})` };
    }
    if (cleanPath.startsWith('/onlinegame/')) {
        const slug = cleanPath.replace('/onlinegame/', '').split('/')[0];
        return { icon: '⚔️', category: '온라인게임', label: `멀티플레이 게임 (${slug})` };
    }
    if (cleanPath === '/utility' || cleanPath === '/lifestyle') {
        return { icon: '🛠️', category: '생활도구', label: '생활·유틸리티 도구 허브' };
    }
    if (cleanPath.startsWith('/tools/')) {
        const slug = cleanPath.replace('/tools/', '').split('/')[0];
        const toolName = MINIAPP_NAMES[slug] || slug;
        return { icon: '🛠️', category: '생활도구', label: `${toolName} (/tools/${slug})` };
    }
    if (cleanPath === '/finance/util') {
        return { icon: '🧮', category: '금융계산기', label: '금융·재테크 계산기 모음' };
    }
    if (cleanPath.startsWith('/finance')) {
        if (cleanPath.includes('/stock')) return { icon: '📈', category: '금융포털', label: `실시간 주식·시세 (${cleanPath})` };
        if (cleanPath.includes('/exchange')) return { icon: '💱', category: '금융포털', label: '실시간 환율 조회' };
        if (cleanPath.includes('/banking')) return { icon: '🏦', category: '금융포털', label: '예적금·금리 비교' };
        return { icon: '💹', category: '금융포털', label: `금융 메인 (${cleanPath})` };
    }
    if (cleanPath === '/lounge') {
        return { icon: '💬', category: '라운지', label: '실시간 커뮤니티 라운지' };
    }
    if (cleanPath.startsWith('/minihome')) {
        const handle = cleanPath.replace('/minihome', '').replace(/^\//, '') || '메인';
        return { icon: '🏡', category: '미니홈피', label: `미니홈피 (${handle})` };
    }
    if (cleanPath.startsWith('/guides')) {
        const slug = cleanPath.replace('/guides', '').replace(/^\//, '');
        return { icon: '📘', category: '지식가이드', label: slug ? `가이드 칼럼 (${slug})` : '지식 가이드 목록' };
    }
    if (cleanPath === '/mypage') {
        return { icon: '👤', category: '마이페이지', label: '마이페이지·일정 관리' };
    }
    if (cleanPath === '/login' || cleanPath === '/signup') {
        return { icon: '🔐', category: '회원인증', label: cleanPath === '/login' ? '로그인 페이지' : '회원가입 페이지' };
    }
    if (cleanPath.startsWith('/admin')) {
        return { icon: '⚙️', category: '관리자', label: `관리자 페이지 (${cleanPath})` };
    }

    return { icon: '👀', category: '페이지이동', label: cleanPath };
}

/**
 * 표준화된 한 줄 활동 로그 출력 (stdout -> pm2 out log)
 */
export function logActivity(icon: string, category: string, actor: string, detail: string, durationMs?: number) {
    const time = getKstTimeString();
    const durSuffix = typeof durationMs === 'number' ? ` [${Math.round(durationMs)}ms]` : '';
    console.log(`[${time}] ${icon} [${category}] ${actor} ➔ ${detail}${durSuffix}`);
}

function getReadablePathWithQuery(c: Context): string {
    const raw = c.req.path + (c.req.url.includes('?') ? '?' + c.req.url.split('?')[1] : '');
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
}

/**
 * 표준화된 경고/에러 로그 출력 (stderr -> pm2 error log & stdout 동시 가시성)
 */
export function logApiError(c: Context, statusCode: number, reason: string, durationMs?: number, errObj?: unknown) {
    c.set('errorLogged', true);
    const time = getKstTimeString();
    const actor = getActorLabel(c);
    const method = c.req.method;
    const pathWithQuery = getReadablePathWithQuery(c);
    const durSuffix = typeof durationMs === 'number' ? ` [${Math.round(durationMs)}ms]` : '';
    const badge = statusCode >= 500 ? '🚨 [서버에러]' : '⚠️ [요청오류]';

    const line = `[${time}] ${badge} ${method} ${pathWithQuery} (${statusCode}) | ${actor} | 사유: ${reason}${durSuffix}`;
    console.error(line);
    if (errObj instanceof Error && statusCode >= 500 && errObj.stack) {
        console.error(errObj.stack.split('\n').slice(0, 4).join('\n'));
    }
}

/**
 * 정적 에셋이나 주기적 핑 요청인지 판별 (로그 노이즈 제거용)
 */
function isNoisyStaticOrPingPath(path: string): boolean {
    if (
        path === '/health' ||
        path === '/api/health' ||
        path === '/api/analytics/duration' ||
        path === '/favicon.ico' ||
        path === '/robots.txt' ||
        path === '/sitemap.xml' ||
        path.startsWith('/uploads/') ||
        path.startsWith('/_next/')
    ) {
        return true;
    }

    if (/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|map|json|mp3|wav)$/i.test(path)) {
        return true;
    }

    return false;
}

/**
 * 전역 활동 & 에러 & 지연(Slow) 감지 미들웨어
 */
export async function activityLoggerMiddleware(c: Context, next: Next) {
    const path = c.req.path;
    if (isNoisyStaticOrPingPath(path)) {
        return next();
    }

    const start = performance.now();
    await next();
    const elapsed = performance.now() - start;
    const status = c.res.status;
    const method = c.req.method;

    // 1. 미니앱(/app/:name), 온라인게임(/onlinegame/:name), 금융앱(/finance) HTML 진입 시 실시간 로깅
    if (
        method === 'GET' &&
        status < 400 &&
        (path.startsWith('/app/') || path.startsWith('/onlinegame/') || path.startsWith('/finance'))
    ) {
        // 하위 정적 파일이 아닌 진입 경로만 로깅
        const segments = path.split('/').filter(Boolean);
        if (segments.length <= 2 || path.startsWith('/finance/stock/')) {
            const desc = describePortalPath(path);
            logActivity(desc.icon, desc.category, getActorLabel(c), `${desc.label} 실행`, elapsed);
        }
        return;
    }

    // 2. 4xx / 5xx 에러 응답이지만 개별 라우트에서 아직 로깅하지 않은 경우 자동 감지 로깅
    if (status >= 400 && !c.get('errorLogged')) {
        const pathWithQuery = getReadablePathWithQuery(c);
        const time = getKstTimeString();
        const actor = getActorLabel(c);
        if (status === 404) {
            console.log(`[${time}] ℹ️ [미존재경로404] ${actor} ➔ ${method} ${pathWithQuery} (404 응답) [${Math.round(elapsed)}ms]`);
            return;
        }
        const badge = status >= 500 ? '🚨 [API서버에러]' : '⚠️ [API요청오류]';
        console.error(`[${time}] ${badge} ${method} ${pathWithQuery} ➔ HTTP ${status} | ${actor} [${Math.round(elapsed)}ms]`);
        return;
    }

    // 3. 500ms 이상 소요된 지연 API 요청 경고 로깅 (정상 2xx/3xx 응답 대상)
    if (elapsed >= 500 && status < 400 && path.startsWith('/api/')) {
        const pathWithQuery = getReadablePathWithQuery(c);
        logActivity('🐢', '지연요청감지', getActorLabel(c), `${method} ${pathWithQuery} (HTTP ${status})`, elapsed);
    }
}
