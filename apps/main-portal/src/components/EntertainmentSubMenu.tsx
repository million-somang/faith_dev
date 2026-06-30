import { Link, useLocation } from 'react-router-dom';

const menuItems = [
    { path: '/entertainment/saju', label: '사주', icon: 'fas fa-yin-yang', active: true },
    { path: '/entertainment/palmistry', label: '손금', icon: 'fas fa-hand-paper', active: false },
    { path: '/entertainment/movies', label: '영화', icon: 'fas fa-film', active: false },
];

export default function EntertainmentSubMenu() {
    const location = useLocation();

    const handleInactiveClick = (e: React.MouseEvent, label: string) => {
        e.preventDefault();
        alert(`${label} 서비스는 현재 열심히 준비 중입니다. 곧 찾아뵙겠습니다! ✨`);
    };

    return (
        <nav className="bg-white border-b border-slate-200 shadow-sm w-full">
            <div className="max-w-6xl mx-auto px-3 sm:px-4">
                {/* 모바일: 알약 버튼 */}
                <div className="flex sm:hidden gap-1.5 py-2.5 overflow-x-auto hide-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        if (!item.active) {
                            return (
                                <button
                                    key={item.path}
                                    onClick={(e) => handleInactiveClick(e, item.label)}
                                    className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-xs font-semibold whitespace-nowrap bg-slate-100 text-slate-400 border border-transparent"
                                >
                                    <i className={`${item.icon} text-base`}></i>
                                    {item.label} (준비중)
                                </button>
                            );
                        }
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-xs font-semibold whitespace-nowrap transition-all border ${
                                    isActive
                                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm font-bold'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                            >
                                <i className={`${item.icon} text-base`}></i>
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* 데스크톱: 밑줄 탭 */}
                <div className="hidden sm:flex space-x-8 overflow-x-auto hide-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        if (!item.active) {
                            return (
                                <button
                                    key={item.path}
                                    onClick={(e) => handleInactiveClick(e, item.label)}
                                    className="px-4 py-4 whitespace-nowrap transition-all flex items-center gap-2 text-slate-400 cursor-not-allowed"
                                >
                                    <i className={item.icon}></i>
                                    {item.label} <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-normal">준비중</span>
                                </button>
                            );
                        }
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-4 py-4 whitespace-nowrap transition-all flex items-center gap-2 font-bold ${
                                    isActive
                                        ? 'text-violet-600 border-b-2 border-violet-600'
                                        : 'text-slate-600 hover:text-violet-600 hover:border-b-2 hover:border-violet-600'
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
