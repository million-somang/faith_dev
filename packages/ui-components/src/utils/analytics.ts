/**
 * Google Analytics (GA4) 통합 유틸리티
 * - SPA 라우팅 페이지뷰 추적
 * - 커스텀 비즈니스 이벤트 발송
 * - 개인정보 (PII) 자동 마스킹 및 보안 처리
 * - 회원 User ID 연동
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /01[016789]-?\d{3,4}-?\d{4}/g;

/**
 * PII (개인식별정보) 마스킹 처리 헬퍼
 */
export function maskPII(text: string): string {
    if (!text || typeof text !== 'string') return text;
    return text
        .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
        .replace(PHONE_REGEX, '[REDACTED_PHONE]');
}

/**
 * PII 마스킹이 적용된 객체 파라미터 생성
 */
function sanitizeParams(params?: Record<string, any>): Record<string, any> {
    if (!params) return {};
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(params)) {
        const val = params[key];
        if (typeof val === 'string') {
            sanitized[key] = maskPII(val);
        } else {
            sanitized[key] = val;
        }
    }
    return sanitized;
}

/**
 * GA4 스크립트 동적 초기화
 */
export function initGA(measurementId?: string): void {
    if (typeof window === 'undefined') return;
    const gaId = measurementId || (import.meta as any).env?.VITE_GA_ID || 'G-J62JHHDLRY';
    if (!gaId) return;

    // 이미 로드되었는지 확인
    if ((window as any).dataLayer) return;

    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;

    gtag('js', new Date());
    // Consent Mode default: granted for analytics
    gtag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
    });

    gtag('config', gaId, {
        send_page_view: false, // SPA에서 수동 처리
        anonymize_ip: true
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
}

/**
 * SPA 라우트 변경 시 페이지뷰 전송
 */
export function trackPageView(path: string, title?: string): void {
    if (typeof window === 'undefined' || !(window as any).gtag) return;
    const cleanPath = maskPII(path);
    const cleanTitle = title ? maskPII(title) : document.title;

    const gaId = (import.meta as any).env?.VITE_GA_ID || 'G-J62JHHDLRY';
    (window as any).gtag('event', 'page_view', {
        page_path: cleanPath,
        page_title: cleanTitle,
        send_to: gaId
    });
}

/**
 * 커스텀 비즈니스 이벤트 전송
 */
export function trackEvent(eventName: string, params?: Record<string, any>): void {
    if (typeof window === 'undefined' || !(window as any).gtag) return;
    const cleanParams = sanitizeParams(params);
    (window as any).gtag('event', eventName, cleanParams);
}

/**
 * 로그인 회원의 ID 및 프로필 속성 설정
 */
export function setGAUserContext(userId: string | number, role?: string): void {
    if (typeof window === 'undefined' || !(window as any).gtag) return;
    (window as any).gtag('set', 'user_properties', {
        user_id: String(userId),
        user_role: role || 'member'
    });
}
