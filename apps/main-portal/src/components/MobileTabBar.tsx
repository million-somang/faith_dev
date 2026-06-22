import { useState, useEffect } from 'react';
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
    { id: 'news', label: '소식', icon: 'fas fa-newspaper', path: '/news' }
];

interface MenuCardItem {
    label: string;
    desc: string;
    icon: string;
    path: string;
}

const MENU_CARDS: MenuCardItem[] = [
    { label: '포털 홈', desc: '실시간 뉴스 및 주요 대시보드', icon: 'fas fa-home', path: '/' },
    { label: '생활도구', desc: '계산기, 변환기, 맞춤법 등 유용 도구', icon: 'fas fa-screwdriver-wrench', path: '/lifestyle' },
    { label: '금융 정보', desc: '국내외 증시 실시간 트렌드 확인', icon: 'fas fa-chart-line', path: '/finance' },
    { label: '미니게임', desc: '테트리스, 스도쿠, 지뢰찾기 아케이드', icon: 'fas fa-gamepad', path: '/game' },
    { label: '실시간 뉴스', desc: '가장 신속하게 전달되는 정보 피드', icon: 'fas fa-newspaper', path: '/news' },
    { label: '리워드', desc: '출석·미션으로 포인트 적립 및 교환', icon: 'fas fa-gift', path: '/reward' },
    { label: '마이페이지', desc: '개인 등급 및 게임 스코어 관리', icon: 'fas fa-user', path: '/mypage' }
];

/**
 * [Step 2: 상태 연결] 
 * 크리스탈 에메랄드 모바일 하단 플로팅 탭 바 & 전체메뉴 드로어 컴포넌트
 */
export function MobileTabBar() {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // 메뉴가 열렸을 때 뒷배경 스크롤 방지 락
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

    // 라우트 경로가 바뀔 때 메뉴를 자동으로 닫음
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    return (
        <>
            <nav className="mobile-tab-bar" role="navigation" aria-label="하단 네비게이션 바">
                {TAB_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path && !isMenuOpen;
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
                
                {/* 4번째 전체메뉴 트리거 탭 */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className={`mobile-tab-item ${isMenuOpen ? 'active' : ''}`}
                    aria-label="전체메뉴 보기"
                    style={{ background: 'none', border: 'none', padding: 0 }}
                >
                    <i className="fas fa-bars" aria-hidden="true"></i>
                    <span>전체메뉴</span>
                </button>
            </nav>

            {/* 전체메뉴 럭셔리 오버레이 (Emerald Overlay) */}
            {isMenuOpen && (
                <div className="mobile-menu-overlay" role="dialog" aria-modal="true" aria-label="전체메뉴 목록">
                    {/* 상단 헤더 */}
                    <div className="mobile-menu-header">
                        <span className="mobile-menu-title">
                            <i className="fas fa-cubes"></i>
                            FaithLink 전체서비스
                        </span>
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="mobile-menu-close"
                            aria-label="메뉴 닫기"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    {/* 본문 그리드 카드 */}
                    <div className="mobile-menu-body">
                        <div className="mobile-menu-section-title">전체 카테고리</div>
                        <div className="mobile-menu-grid">
                            {MENU_CARDS.map((card) => (
                                <Link
                                    key={card.path}
                                    to={card.path}
                                    className="mobile-menu-card"
                                    aria-label={`${card.label} 바로가기`}
                                >
                                    <div className="mobile-menu-card-icon">
                                        <i className={card.icon}></i>
                                    </div>
                                    <span className="mobile-menu-card-title">{card.label}</span>
                                    <span className="mobile-menu-card-desc">{card.desc}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
