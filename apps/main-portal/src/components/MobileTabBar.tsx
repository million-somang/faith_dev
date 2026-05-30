import { Link, useLocation } from 'react-router-dom';

export interface TabItem {
    id: string;
    label: string;
    icon: string;
    path: string;
}

const TAB_ITEMS: TabItem[] = [
    { id: 'home', label: '홈', icon: 'fas fa-home', path: '/' },
    { id: 'lifestyle', label: '생활도구', icon: 'fas fa-screwdriver-wrench', path: '/lifestyle' },
    { id: 'news', label: '소식', icon: 'fas fa-newspaper', path: '/news' },
    { id: 'mypage', label: '마이', icon: 'fas fa-user', path: '/mypage' }
];

/**
 * [Step 1: 정적 UI] 모바일 하단 플로팅 탭 바 뼈대 컴포넌트
 */
export function MobileTabBar() {
    const location = useLocation();

    return (
        <nav className="mobile-tab-bar" role="navigation" aria-label="하단 네비게이션 바">
            {TAB_ITEMS.map((item) => {
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
