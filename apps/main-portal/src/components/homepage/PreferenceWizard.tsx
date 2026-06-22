import { useState } from 'react';
import {
    HomepageConfig,
    HomepagePreferences,
    HomepageTheme,
    MainInterest,
    AgeGroup,
    ColorScheme,
    LayoutStyle,
    NewsCategory,
    GameType,
    DEFAULT_HOMEPAGE_CONFIG,
} from '../../types/homepage.types';
import { QuickMenuEditor } from './QuickMenuEditor';

interface PreferenceWizardProps {
    currentConfig: HomepageConfig;
    isSaving: boolean;
    onSave: (config: HomepageConfig) => Promise<void>;
    onClose: () => void;
}

type WizardStep = 1 | 2 | 3;

const STEP_LABELS: Record<WizardStep, string> = {
    1: '퀵메뉴 설정',
    2: '취향 체크',
    3: '테마 선택',
};

const NEWS_CATEGORIES: { id: NewsCategory; label: string; icon: string }[] = [
    { id: 'politics', label: '정치', icon: 'fa-landmark' },
    { id: 'economy', label: '경제', icon: 'fa-chart-bar' },
    { id: 'sports', label: '스포츠', icon: 'fa-futbol' },
    { id: 'tech', label: 'IT/과학', icon: 'fa-microchip' },
    { id: 'entertainment', label: '연예', icon: 'fa-star' },
    { id: 'society', label: '사회', icon: 'fa-users' },
];

const GAME_TYPES: { id: GameType; label: string; icon: string }[] = [
    { id: 'tetris', label: '테트리스', icon: 'fa-th' },
    { id: 'sudoku', label: '스도쿠', icon: 'fa-table' },
    { id: '2048', label: '2048', icon: 'fa-th-large' },
    { id: 'minesweeper', label: '지뢰찾기', icon: 'fa-bomb' },
];

const COLOR_SCHEMES: { id: ColorScheme; label: string; primary: string; bg: string }[] = [
    { id: 'green', label: '그린', primary: 'bg-green-500', bg: 'bg-green-50' },
    { id: 'blue', label: '블루 (기본)', primary: 'bg-blue-500', bg: 'bg-blue-50' },
    { id: 'purple', label: '퍼플', primary: 'bg-purple-500', bg: 'bg-purple-50' },
    { id: 'orange', label: '오렌지', primary: 'bg-orange-500', bg: 'bg-orange-50' },
    { id: 'dark', label: '다크', primary: 'bg-gray-800', bg: 'bg-gray-900' },
];

const LAYOUTS: { id: LayoutStyle; label: string; desc: string; icon: string }[] = [
    { id: 'portal', label: '포털형', desc: '검색창 + 퀵메뉴 + 뉴스 + 위젯 (기본)', icon: 'fa-th-list' },
    { id: 'minimal', label: '미니멀형', desc: '검색창 + 맞춤 퀵메뉴만 (깔끔)', icon: 'fa-minus-square' },
    { id: 'card', label: '카드형', desc: '대형 카드 그리드 (시각적)', icon: 'fa-th-large' },
];

/**
 * 3단계 개인화 설정 마법사
 */
export function PreferenceWizard({ currentConfig, isSaving, onSave, onClose }: PreferenceWizardProps) {
    const [step, setStep] = useState<WizardStep>(1);

    // 단계별 로컬 상태
    const [quickMenuItems, setQuickMenuItems] = useState<string[]>(
        currentConfig.quickMenuItems.length > 0 ? currentConfig.quickMenuItems : DEFAULT_HOMEPAGE_CONFIG.quickMenuItems
    );
    const [quickMenuOrder, setQuickMenuOrder] = useState<string[]>(
        currentConfig.quickMenuOrder.length > 0 ? currentConfig.quickMenuOrder : DEFAULT_HOMEPAGE_CONFIG.quickMenuOrder
    );
    const [preferences, setPreferences] = useState<HomepagePreferences>({
        ...DEFAULT_HOMEPAGE_CONFIG.preferences,
        ...currentConfig.preferences,
    });
    const [theme, setTheme] = useState<HomepageTheme>({
        ...DEFAULT_HOMEPAGE_CONFIG.theme,
        ...currentConfig.theme,
    });

    const updatePreference = <K extends keyof HomepagePreferences>(key: K, value: HomepagePreferences[K]) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    const toggleArrayItem = <T extends string>(arr: T[], item: T): T[] =>
        arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

    const handleSave = async () => {
        const newConfig: HomepageConfig = {
            quickMenuItems,
            quickMenuOrder,
            mobileTabs: currentConfig.mobileTabs && currentConfig.mobileTabs.length > 0
                ? currentConfig.mobileTabs
                : DEFAULT_HOMEPAGE_CONFIG.mobileTabs,
            preferences,
            theme,
            isConfigured: true,
        };
        await onSave(newConfig);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">
                            <i className="fas fa-magic mr-2 text-blue-500"></i>
                            내 홈페이지 꾸미기
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">이 세상에 단 하나뿐인 나만의 메인 페이지를 만들어요</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="닫기"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* 스텝 인디케이터 */}
                <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        {([1, 2, 3] as WizardStep[]).map((s) => (
                            <div key={s} className="flex items-center gap-2 flex-1">
                                <button
                                    onClick={() => setStep(s)}
                                    className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                                        step === s
                                            ? 'bg-blue-600 text-white scale-110'
                                            : step > s
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-400'
                                    }`}
                                >
                                    {step > s ? <i className="fas fa-check text-[10px]"></i> : s}
                                </button>
                                <span className={`text-xs font-semibold hidden sm:block ${
                                    step === s ? 'text-blue-600' : 'text-gray-400'
                                }`}>
                                    {STEP_LABELS[s]}
                                </span>
                                {s < 3 && <div className={`flex-1 h-0.5 mx-1 ${step > s ? 'bg-blue-300' : 'bg-gray-200'}`}></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 스텝 컨텐츠 (스크롤 가능) */}
                <div className="flex-1 overflow-y-auto px-6 py-5">

                    {/* Step 1: 퀵메뉴 설정 */}
                    {step === 1 && (
                        <div>
                            <h3 className="text-base font-bold text-gray-800 mb-1">어떤 메뉴를 자주 쓰시나요?</h3>
                            <p className="text-xs text-gray-500 mb-4">선택한 메뉴만 메인 페이지 상단에 표시됩니다.</p>
                            <QuickMenuEditor
                                selectedIds={quickMenuItems}
                                orderedIds={quickMenuOrder}
                                onChange={(sel, ord) => {
                                    setQuickMenuItems(sel);
                                    setQuickMenuOrder(ord);
                                }}
                            />
                        </div>
                    )}

                    {/* Step 2: 취향 체크리스트 */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-base font-bold text-gray-800 mb-1">주로 어떤 콘텐츠를 즐기시나요?</h3>
                                <p className="text-xs text-gray-500 mb-3">선택에 따라 메인 페이지 레이아웃이 달라져요.</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {([
                                        { id: 'news' as MainInterest, label: '뉴스 읽기', icon: 'fa-newspaper', color: 'blue' },
                                        { id: 'games' as MainInterest, label: '게임하기', icon: 'fa-gamepad', color: 'purple' },
                                        { id: 'utility' as MainInterest, label: '도구 사용', icon: 'fa-tools', color: 'green' },
                                        { id: 'finance' as MainInterest, label: '금융 정보', icon: 'fa-chart-line', color: 'orange' },
                                    ]).map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => updatePreference('mainInterest', opt.id)}
                                            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                                                preferences.mainInterest === opt.id
                                                    ? `border-${opt.color}-400 bg-${opt.color}-50 text-${opt.color}-700`
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            <i className={`fas ${opt.icon} text-${opt.color}-500`}></i>
                                            {opt.label}
                                            {preferences.mainInterest === opt.id && (
                                                <i className="fas fa-check ml-auto text-xs"></i>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-gray-800 mb-1">관심 뉴스 카테고리</h3>
                                <p className="text-xs text-gray-500 mb-3">복수 선택 가능. 선택한 카테고리 뉴스가 우선 표시됩니다.</p>
                                <div className="flex flex-wrap gap-2">
                                    {NEWS_CATEGORIES.map(cat => {
                                        const isOn = preferences.newsCategories.includes(cat.id);
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => updatePreference('newsCategories', toggleArrayItem(preferences.newsCategories, cat.id))}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                                                    isOn
                                                        ? 'bg-blue-500 border-blue-500 text-white'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                                                }`}
                                            >
                                                <i className={`fas ${cat.icon} text-xs`}></i>
                                                {cat.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-gray-800 mb-1">메인 화면에 보이길 원하는 위젯</h3>
                                <div className="space-y-2">
                                    {([
                                        { key: 'showStockWidget' as const, label: '주식 시세 위젯', icon: 'fa-chart-line', desc: '관심 종목 시세' },
                                        { key: 'showTrendWidget' as const, label: '실시간 트렌드 위젯', icon: 'fa-fire', desc: '인기 검색어' },
                                    ]).map(w => (
                                        <label key={w.key} className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={preferences[w.key]}
                                                onChange={e => updatePreference(w.key, e.target.checked)}
                                                className="w-4 h-4 accent-blue-600"
                                            />
                                            <i className={`fas ${w.icon} text-gray-500 w-4`}></i>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-800">{w.label}</div>
                                                <div className="text-xs text-gray-400">{w.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-gray-800 mb-1">즐겨 하는 게임</h3>
                                <div className="flex flex-wrap gap-2">
                                    {GAME_TYPES.map(g => {
                                        const isOn = preferences.favoriteGames.includes(g.id);
                                        return (
                                            <button
                                                key={g.id}
                                                onClick={() => updatePreference('favoriteGames', toggleArrayItem(preferences.favoriteGames, g.id))}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                                                    isOn
                                                        ? 'bg-purple-500 border-purple-500 text-white'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'
                                                }`}
                                            >
                                                <i className={`fas ${g.icon} text-xs`}></i>
                                                {g.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-gray-800 mb-1">연령대</h3>
                                <div className="flex gap-2">
                                    {([
                                        { id: 'young' as AgeGroup, label: '10-20대' },
                                        { id: 'middle' as AgeGroup, label: '30-40대' },
                                        { id: 'senior' as AgeGroup, label: '50대 이상' },
                                    ]).map(a => (
                                        <button
                                            key={a.id}
                                            onClick={() => updatePreference('ageGroup', a.id)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                                                preferences.ageGroup === a.id
                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            {a.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-gray-800 mb-1">
                                    <i className="fas fa-comment-alt mr-1 text-yellow-400"></i>
                                    나만의 인사말 (선택)
                                </h3>
                                <input
                                    type="text"
                                    value={theme.greeting}
                                    onChange={e => setTheme(prev => ({ ...prev, greeting: e.target.value }))}
                                    placeholder='예: "오늘도 화이팅! 🔥" 또는 "좋은 하루 되세요 😊"'
                                    maxLength={40}
                                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm text-gray-800 placeholder-gray-400 transition-colors"
                                />
                                <p className="text-right text-xs text-gray-400 mt-1">{theme.greeting.length}/40</p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: 테마 선택 */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-base font-bold text-gray-800 mb-1">색상 테마</h3>
                                <p className="text-xs text-gray-500 mb-3">메인 페이지 전체 색상이 바뀝니다.</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {COLOR_SCHEMES.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setTheme(prev => ({ ...prev, colorScheme: c.id }))}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                                theme.colorScheme === c.id
                                                    ? 'border-gray-700 scale-105 shadow-md'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full ${c.primary}`}></div>
                                            <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">{c.label}</span>
                                            {theme.colorScheme === c.id && (
                                                <i className="fas fa-check text-[10px] text-gray-700"></i>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-gray-800 mb-1">레이아웃 스타일</h3>
                                <p className="text-xs text-gray-500 mb-3">메인 페이지의 정보 배치 방식을 선택하세요.</p>
                                <div className="space-y-2">
                                    {LAYOUTS.map(l => (
                                        <button
                                            key={l.id}
                                            onClick={() => setTheme(prev => ({ ...prev, layout: l.id }))}
                                            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                                                theme.layout === l.id
                                                    ? 'border-blue-400 bg-blue-50'
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                theme.layout === l.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                <i className={`fas ${l.icon}`}></i>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-800 text-sm">{l.label}</div>
                                                <div className="text-xs text-gray-500">{l.desc}</div>
                                            </div>
                                            {theme.layout === l.id && (
                                                <i className="fas fa-check text-blue-500"></i>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 미리보기 요약 */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">설정 요약</h4>
                                <ul className="space-y-1 text-sm text-gray-700">
                                    <li><i className="fas fa-check text-blue-500 mr-2 text-xs"></i>퀵메뉴: <span className="font-semibold">{quickMenuItems.length}개 선택</span></li>
                                    <li><i className="fas fa-check text-blue-500 mr-2 text-xs"></i>주 관심사: <span className="font-semibold">
                                        {preferences.mainInterest === 'news' ? '뉴스' : preferences.mainInterest === 'games' ? '게임' : preferences.mainInterest === 'utility' ? '도구' : '금융'}
                                    </span></li>
                                    <li><i className="fas fa-check text-blue-500 mr-2 text-xs"></i>레이아웃: <span className="font-semibold">
                                        {LAYOUTS.find(l => l.id === theme.layout)?.label}
                                    </span></li>
                                    <li><i className="fas fa-check text-blue-500 mr-2 text-xs"></i>색상 테마: <span className="font-semibold">
                                        {COLOR_SCHEMES.find(c => c.id === theme.colorScheme)?.label}
                                    </span></li>
                                    {theme.greeting && (
                                        <li><i className="fas fa-comment-alt text-yellow-400 mr-2 text-xs"></i>인사말: <span className="font-semibold">"{theme.greeting}"</span></li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* 하단 버튼 */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <button
                        onClick={() => step > 1 ? setStep((step - 1) as WizardStep) : onClose()}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <i className="fas fa-chevron-left mr-1 text-xs"></i>
                        {step === 1 ? '취소' : '이전'}
                    </button>

                    <div className="flex gap-2">
                        {step < 3 ? (
                            <button
                                onClick={() => setStep((step + 1) as WizardStep)}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                            >
                                다음 <i className="fas fa-chevron-right text-xs"></i>
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <><i className="fas fa-spinner fa-spin"></i> 저장 중...</>
                                ) : (
                                    <><i className="fas fa-magic"></i> 내 홈 완성하기!</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
