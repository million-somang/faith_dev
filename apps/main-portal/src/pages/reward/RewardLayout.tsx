import { NavLink, Outlet } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../../context/AuthContext';
import { PageSEO } from '../../components/PageSEO';

const TABS = [
    { to: '/reward', label: '메인페이지', icon: 'fa-house', end: true },
    { to: '/reward/attendance', label: '출석체크', icon: 'fa-calendar-check', end: false },
    { to: '/reward/missions', label: '오늘의 미션', icon: 'fa-bullseye', end: false },
    { to: '/reward/exchange', label: '리워드 교환', icon: 'fa-store', end: false },
];

export default function RewardLayout() {
    const { user, logout, isLoading } = useAuth();

    const isAuthorized = user && user.email === 'sukman@naver.com';

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <PageSEO
                    title="리워드 - 포인트 적립하고 혜택 받기"
                    description="출석 체크, 미션 완료로 포인트를 모으고 다양한 리워드로 교환하세요."
                    path="/reward"
                />
                <Header user={user} onLogout={logout} />
                <main className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <PageSEO
                title="리워드 - 포인트 적립하고 혜택 받기"
                description="출석 체크, 미션 완료로 포인트를 모으고 다양한 리워드로 교환하세요."
                path="/reward"
            />
            <Header user={user} onLogout={logout} />

            {isAuthorized ? (
                <>
                    {/* 리워드 내부 탭 메뉴 */}
                    <div className="sticky top-14 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
                        <nav className="max-w-5xl mx-auto px-2 sm:px-4 flex gap-1 overflow-x-auto hide-scrollbar">
                            {TABS.map((t) => (
                                <NavLink
                                    key={t.to}
                                    to={t.to}
                                    end={t.end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-4 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                                            isActive
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-blue-600'
                                        }`
                                    }
                                >
                                    <i className={`fas ${t.icon} text-xs`}></i>
                                    {t.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 mb-6">
                            <i className="fas fa-flask"></i> 목업 화면 — 디자인 미리보기용 (실제 데이터 아님)
                        </div>
                        <Outlet />
                    </main>
                </>
            ) : (
                <main className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
                            <i className="fas fa-clock"></i>
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">서비스 준비 중</h2>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            리워드 서비스는 현재 준비 중입니다. 더 나은 서비스로 찾아뵙겠습니다.
                        </p>
                    </div>
                </main>
            )}

            <Footer />
        </div>
    );
}
