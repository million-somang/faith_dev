import { useState, useEffect } from 'react';
import axios from 'axios';

// 금융 앱은 메인 포털과 분리된 별도 앱이므로, 탭/메뉴 이동은 메인 포털 URL을 기준으로 한다.
const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface MobileTabItem {
    id: string;
    label: string;
    icon: string;
    path: string;
    color?: string;   // 아이콘 색상 (하단 탭바에서 사용)
}

const ALL_MOBILE_TAB_ITEMS: MobileTabItem[] = [
    { id: 'home', label: '홈', icon: 'fas fa-home', path: '/', color: '#2563eb' },
    { id: 'news', label: '뉴스', icon: 'fas fa-newspaper', path: '/news', color: '#0ea5e9' },
    { id: 'shopping', label: '쇼핑', icon: 'fas fa-bag-shopping', path: '/shopping', color: '#ec4899' },
    { id: 'lifestyle', label: '도구', icon: 'fas fa-screwdriver-wrench', path: '/lifestyle', color: '#16a34a' },
    { id: 'mypage', label: '마이페이지', icon: 'fas fa-user', path: '/mypage', color: '#6366f1' },
    { id: 'finance', label: '금융', icon: 'fas fa-chart-line', path: '/finance', color: '#f97316' },
    { id: 'game', label: '게임', icon: 'fas fa-gamepad', path: '/game', color: '#a855f7' },
    { id: 'reward', label: '리워드', icon: 'fas fa-gift', path: '/reward', color: '#f59e0b' },
];

const DEFAULT_MOBILE_TABS = ['home', 'news', 'shopping', 'lifestyle', 'mypage'];
const MAX_MOBILE_TABS = 5;

const toHref = (path: string) => `${MAIN_PORTAL_URL}${path}`;

/**
 * 금융 앱용 모바일 하단 플로팅 탭 바
 * - 메인 포털의 MobileTabBar와 동일하게 API 개인화 설정을 읽어와 5개 탭을 동적으로 렌더링합니다.
 */
export function MobileTabBar() {
    const [tabIds, setTabIds] = useState<string[]>(DEFAULT_MOBILE_TABS);

    // API를 통해 메인 포털의 개인화 탭 설정을 로드하여 동기화
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get<{ success: boolean; config?: { mobileTabs?: string[] } }>(
                    `${API_BASE_URL}/api/user/homepage-config`,
                    { withCredentials: true }
                );
                if (res.data && res.data.success && res.data.config?.mobileTabs) {
                    setTabIds(res.data.config.mobileTabs);
                }
            } catch (err) {
                console.warn('[Finance MobileTabBar] 메인 포털 설정 로드 실패, 기본값 사용:', err);
            }
        };
        fetchConfig();
    }, []);

    const tabMap = new Map<string, MobileTabItem>(ALL_MOBILE_TAB_ITEMS.map(t => [t.id, t]));
    const tabItems: MobileTabItem[] = tabIds
        .map(id => tabMap.get(id))
        .filter((t): t is MobileTabItem => !!t)
        .slice(0, MAX_MOBILE_TABS);

    // 현재 경로 활성화 체크 (금융 앱 내부 경로는 /finance 로 매핑됨)
    const isTabActive = (itemPath: string) => {
        const currentPath = window.location.pathname;
        if (itemPath === '/finance') {
            return currentPath.startsWith('/finance');
        }
        return false;
    };

    return (
        <nav className="mobile-tab-bar" role="navigation" aria-label="하단 네비게이션 바">
            {tabItems.map((item) => {
                const isActive = isTabActive(item.path);
                return (
                    <a
                        key={item.id}
                        href={toHref(item.path)}
                        className={`mobile-tab-item ${isActive ? 'active' : ''}`}
                        aria-label={`${item.label} 페이지로 이동`}
                    >
                        <i className={item.icon} style={item.color ? { color: item.color } : undefined} aria-hidden="true"></i>
                        <span>{item.label}</span>
                    </a>
                );
            })}
        </nav>
    );
}
