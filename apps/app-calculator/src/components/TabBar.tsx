interface TabBarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
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

    return (
        <nav className="calc-tab-bar" role="tablist" aria-label="계산기 종류 선택">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`calc-${tab.id}`}
                    className={`calc-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                >
                    <i className={`fas ${tab.icon}`} aria-hidden="true"></i>
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}
