import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { t } from '@faithportal/ui';

// 금융 앱은 메인 포털과 분리된 별도 앱이므로, 탭/메뉴 이동은 메인 포털 URL을 기준으로 한다.
const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface MobileTabItem {
    id: string;
    label: string;
    icon: string;
    path: string;
    color?: string;   // 아이콘 색상 (하단 탭바에서 사용)
}

// 메인 포털(apps/next-portal/src/types/homepage.types.ts)과 100% 동일한 11개 모바일 하단 탭 목록
const ALL_MOBILE_TAB_ITEMS: MobileTabItem[] = [
    { id: 'home', label: '홈', icon: 'fas fa-home', path: '/', color: '#2563eb' },
    { id: 'news', label: '뉴스', icon: 'fas fa-newspaper', path: '/news', color: '#0ea5e9' },
    { id: 'guides', label: '지식가이드', icon: 'fas fa-book-open-reader', path: '/guides', color: '#0d9488' },
    { id: 'lifestyle', label: '생활도구', icon: 'fas fa-screwdriver-wrench', path: '/lifestyle', color: '#16a34a' },
    { id: 'finance', label: '금융', icon: 'fas fa-won-sign', path: '/finance', color: '#f97316' },
    { id: 'game', label: '게임', icon: 'fas fa-gamepad', path: '/game', color: '#a855f7' },
    { id: 'entertainment', label: '재미', icon: 'fas fa-masks-theater', path: '/entertainment', color: '#e11d48' },
    { id: 'lounge', label: '라운지', icon: 'fas fa-comments', path: '/lounge', color: '#8b5cf6' },
    { id: 'mypage', label: '마이페이지', icon: 'fas fa-user', path: '/mypage', color: '#6366f1' },
    { id: 'reward', label: '리워드', icon: 'fas fa-gift', path: '/reward', color: '#f59e0b' },
    { id: 'b2b', label: '제작문의', icon: 'fas fa-magic', path: '/b2b', color: '#059669' },
];

const toHref = (path: string) => `${MAIN_PORTAL_URL}${path}`;

/**
 * 금융 앱용 모바일 하단 플로팅 탭 바
 * - 메인 포털(next-portal)의 MobileTabBar와 100% 동일한 11개 가로 스크롤 탭을 렌더링합니다.
 */
export function MobileTabBar() {
    const [tabIds, setTabIds] = useState<string[]>([]);
    const { user } = useAuth();
    const location = useLocation();
    const activeTabRef = useRef<HTMLAnchorElement | null>(null);

    // API를 통해 메인 포털의 개인화 탭 설정을 로드하여 동기화
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get<{ success: boolean; config?: { mobileTabs?: string[] } }>(
                    `${API_BASE_URL}/api/user/homepage-config`,
                    { withCredentials: true }
                );
                if (res.data && res.data.success && Array.isArray(res.data.config?.mobileTabs)) {
                    setTabIds(res.data.config.mobileTabs);
                }
            } catch {
                // 기본 전체 11개 메뉴 사용
            }
        };
        fetchConfig();
    }, []);

    // 메인 포털과 동일하게 전체 11개 메뉴를 기본으로 하되, 커스텀 순서 설정이 있을 경우 우선 반영 후 나머지 탭을 뒤에 배치
    const isDefaultOrOldConfig = !tabIds || tabIds.length <= 5;
    const tabItems: MobileTabItem[] = isDefaultOrOldConfig
        ? ALL_MOBILE_TAB_ITEMS
        : (() => {
            const tabMap = new Map<string, MobileTabItem>(ALL_MOBILE_TAB_ITEMS.map(item => [item.id, item]));
            const items: MobileTabItem[] = [];
            const seen = new Set<string>();
            for (const id of tabIds) {
                const item = tabMap.get(id);
                if (item && !seen.has(id)) {
                    items.push(item);
                    seen.add(id);
                }
            }
            for (const item of ALL_MOBILE_TAB_ITEMS) {
                if (!seen.has(item.id)) {
                    items.push(item);
                    seen.add(item.id);
                }
            }
            return items;
        })();

    // 현재 활성화된 탭('금융')이 화면 중앙에 오도록 자동 스크롤
    useEffect(() => {
        if (activeTabRef.current) {
            activeTabRef.current.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
            });
        }
    }, [location.pathname, tabItems.length]);

    // 현재 경로 활성화 체크 (금융 앱 내부 모든 라우트는 '금융' 탭 활성화)
    const isTabActive = (itemPath: string) => {
        if (itemPath === '/finance') {
            return true;
        }
        return false;
    };

    return (
        <nav className="mobile-tab-bar" role="navigation" aria-label="하단 네비게이션 바">
            {tabItems.map((item) => {
                const isMyPageItem = item.id === 'mypage' || item.path === '/mypage';
                const label = isMyPageItem && !user ? '로그인' : item.label;
                const path = isMyPageItem && !user ? '/login' : item.path;
                const icon = isMyPageItem && !user ? 'fas fa-sign-in-alt' : item.icon;
                const isActive = isTabActive(path);
                return (
                    <a
                        key={item.id}
                        ref={isActive ? activeTabRef : undefined}
                        href={toHref(path)}
                        className={`mobile-tab-item ${isActive ? 'active' : ''}`}
                        aria-label={`${t(label)} 페이지로 이동`}
                    >
                        <i className={icon} style={item.color ? { color: item.color } : undefined} aria-hidden="true"></i>
                        <span>{t(label)}</span>
                    </a>
                );
            })}
        </nav>
    );
}

