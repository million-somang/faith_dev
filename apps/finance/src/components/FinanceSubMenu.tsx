import { Link, useLocation } from 'react-router-dom';
import { t } from '@faithportal/ui';

const menuItems = [
    { path: '/', label: '주식', icon: 'fas fa-chart-line' },
    { path: '/stocks', label: '종목', icon: 'fas fa-magnifying-glass-chart' },
    { path: '/exchange', label: '환율', icon: 'fas fa-exchange-alt' },
    { path: '/banking', label: '은행', icon: 'fas fa-university' },
    { path: '/insurance', label: '보험', icon: 'fas fa-umbrella' },
    { path: '/util', label: '금융Util', icon: 'fas fa-chart-pie' },
];

export default function FinanceSubMenu() {
    const location = useLocation();

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-3 sm:px-4">
                {/* 모바일: 또렷한 알약 버튼 (활성=초록/앰버 배경, 화면 폭 균등 분할) */}
                <div className="fin-menu-mobile gap-1.5 py-2.5 overflow-x-auto hide-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path || 
                            (item.path === '/util' && (location.pathname === '/finance/util' || location.pathname === '/util'));
                        const isUtil = item.path === '/util';

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                                    isActive
                                        ? isUtil 
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'bg-green-600 text-white shadow-sm'
                                        : isUtil
                                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <i className={`${item.icon} text-base`}></i>
                                {t(item.label)}
                            </Link>
                        );
                    })}
                </div>

                {/* 데스크톱: 밑줄 탭 */}
                <div className="fin-menu-desktop space-x-8 overflow-x-auto hide-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path || 
                            (item.path === '/util' && (location.pathname === '/finance/util' || location.pathname === '/util'));
                        const isUtil = item.path === '/util';

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-4 py-4 whitespace-nowrap transition-all flex items-center gap-2 font-medium ${
                                    isActive
                                        ? isUtil
                                            ? 'text-amber-600 border-b-2 border-amber-600 font-extrabold'
                                            : 'text-green-600 border-b-2 border-green-600 font-extrabold'
                                        : isUtil
                                            ? 'text-amber-700 hover:text-amber-800 font-bold hover:border-b-2 hover:border-amber-600'
                                            : 'text-gray-700 hover:text-green-600 hover:border-b-2 hover:border-green-600'
                                }`}
                            >
                                <i className={item.icon}></i>
                                {t(item.label)}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
