import { Link, useLocation } from 'react-router-dom';

const menuItems = [
    { path: '/', label: '주식', icon: 'fas fa-chart-line' },
    { path: '/exchange', label: '환율', icon: 'fas fa-exchange-alt' },
    { path: '/banking', label: '은행', icon: 'fas fa-university' },
];

export default function FinanceSubMenu() {
    const location = useLocation();

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex space-x-8 overflow-x-auto hide-scrollbar">
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
