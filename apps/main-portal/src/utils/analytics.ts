/**
 * FaithLink 페이지뷰 분석 트래킹
 * - 페이지 전환 시 자동으로 페이지뷰 기록
 * - sessionId 기반 비회원 포함 추적
 * - 체류 시간 측정 및 전송
 */

const API_BASE = '';

// 세션 ID 관리 (브라우저 탭 단위)
function getSessionId(): string {
    let sessionId = sessionStorage.getItem('fl_session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID ? crypto.randomUUID() : generateUUID();
        sessionStorage.setItem('fl_session_id', sessionId);
    }
    return sessionId;
}

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// 현재 페이지 진입 시간
let pageEnteredAt: number = Date.now();
let currentPath: string = '';

/**
 * 페이지뷰 기록
 */
export function trackPageView(path: string): void {
    // 관리자 페이지는 추적하지 않음
    if (path.startsWith('/admin')) return;
    // 같은 페이지 중복 방지
    if (path === currentPath) return;

    // 이전 페이지 체류 시간 전송
    if (currentPath) {
        sendDuration();
    }

    currentPath = path;
    pageEnteredAt = Date.now();

    const sessionId = getSessionId();
    const userId = localStorage.getItem('user_id') || undefined;

    const data: Record<string, string | number | undefined> = {
        sessionId,
        path,
        referrer: document.referrer || '',
        screenWidth: window.innerWidth,
        userId
    };

    // 비동기로 전송 (UI 블로킹 없음)
    try {
        if (navigator.sendBeacon) {
            navigator.sendBeacon(
                `${API_BASE}/api/analytics/pageview`,
                new Blob([JSON.stringify(data)], { type: 'application/json' })
            );
        } else {
            fetch(`${API_BASE}/api/analytics/pageview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                keepalive: true
            }).catch(() => { /* 무시 */ });
        }
    } catch (_e) {
        // 트래킹 실패는 무시
    }
}

/**
 * 체류 시간 전송
 */
function sendDuration(): void {
    if (!currentPath || !pageEnteredAt) return;

    const durationMs = Date.now() - pageEnteredAt;
    if (durationMs < 1000) return; // 1초 미만은 무시

    const data = {
        sessionId: getSessionId(),
        path: currentPath,
        durationMs: Math.min(durationMs, 30 * 60 * 1000) // 최대 30분
    };

    try {
        if (navigator.sendBeacon) {
            navigator.sendBeacon(
                `${API_BASE}/api/analytics/duration`,
                new Blob([JSON.stringify(data)], { type: 'application/json' })
            );
        } else {
            fetch(`${API_BASE}/api/analytics/duration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                keepalive: true
            }).catch(() => { /* 무시 */ });
        }
    } catch (_e) {
        // 무시
    }
}

// 페이지 이탈 시 체류 시간 전송
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', sendDuration);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            sendDuration();
        }
    });
}
