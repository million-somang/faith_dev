import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function TabBar({ activeTab, onTabChange }) {
    const tabs = [
        { id: 'basic', icon: 'fa-calculator', label: '기본' },
        { id: 'scientific', icon: 'fa-square-root-alt', label: '공학' },
        { id: 'loan', icon: 'fa-money-bill-wave', label: '대출' },
        { id: 'bmi', icon: 'fa-weight', label: 'BMI' },
        { id: 'age', icon: 'fa-birthday-cake', label: '나이' },
        { id: 'date', icon: 'fa-calendar', label: '날짜' },
        { id: 'unit', icon: 'fa-exchange-alt', label: '단위' },
        { id: 'percent', icon: 'fa-percent', label: '백분율' }
    ];
    return (_jsx("div", { className: "flex flex-wrap justify-center gap-1.5 mb-4 border-b pb-2", children: tabs.map(tab => (_jsxs("button", { onClick: () => onTabChange(tab.id), className: `px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center ${activeTab === tab.id ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: [_jsx("i", { className: `fas ${tab.icon} mr-1.5` }), tab.label] }, tab.id))) }));
}
