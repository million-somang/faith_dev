import { Link, useLocation } from 'react-router-dom';
import { useUserPreferenceContext } from '../context/UserPreferenceContext';
import { ALL_MOBILE_TAB_ITEMS, DEFAULT_HOMEPAGE_CONFIG, MAX_MOBILE_TABS, MobileTabItem } from '../types/homepage.types';

/**
 * 모바일 하단 플로팅 탭 바
 * - 마이페이지에서 설정한 탭 구성(config.mobileTabs)을 표시 (없으면 기본값)
 */
export function MobileTabBar() {
    const location = useLocation();
    const { config } = useUserPreferenceContext();

    const tabMap = new Map<string, MobileTabItem>(ALL_MOBILE_TAB_ITEMS.map(t => [t.id, t]));
    const selectedTabIds = config.mobileTabs && config.mobileTabs.length > 0
        ? config.mobileTabs
        : DEFAULT_HOMEPAGE_CONFIG.mobileTabs;
    const tabItems: MobileTabItem[] = selectedTabIds
        .map(id => tabMap.get(id))
        .filter((t): t is MobileTabItem => !!t)
        .slice(0, MAX_MOBILE_TABS);

    return (
        <nav className="mobile-tab-bar" role="navigation" aria-label="하단 네비게이션 바">
            {tabItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <Link
                        key={item.id}
                        to={item.path}
                        className={`mobile-tab-item ${isActive ? 'active' : ''}`}
                        aria-label={`${item.label} 페이지로 이동`}
                    >
                        <i className={item.icon} aria-hidden="true"></i>
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
