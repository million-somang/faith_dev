import { Link, useLocation } from 'react-router-dom';

const menuItems = [
    { path: '/', label: '주식', icon: 'fas fa-chart-line' },
    { path: '/stocks', label: '종목', icon: 'fas fa-magnifying-glass-chart' },
    { path: '/exchange', label: '환율', icon: 'fas fa-exchange-alt' },
    { path: '/banking', label: '은행', icon: 'fas fa-university' },
];

export default function FinanceSubMenu() {
    const location = useLocation();

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-3 sm:px-4">
                {/* 모바일: 또렷한 알약 버튼 (활성=초록 배경, 화면 폭 균등 분할) */}
                <div className="fin-menu-mobile gap-2 py-2.5 overflow-x-auto hide-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex-1 flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-all ${
                                    isActive
                                        ? 'bg-green-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                <i className={item.icon}></i>
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* 데스크톱: 밑줄 탭 (기존 디자인 유지) */}
                <div className="fin-menu-desktop space-x-8 overflow-x-auto hide-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-4 py-4 whitespace-nowrap transition-all flex items-center gap-2 ${
                                    isActive
                                        ? 'text-green-600 border-b-2 border-green-600 font-semibold'
                                        : 'text-gray-700 hover:text-green-600 hover:border-b-2 hover:border-green-600'
                                }`}
                            >
                                <i className={item.icon}></i>
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
