import { useState, useEffect, useCallback } from 'react';
import { MiniAppLayout, MiniAppCommunity, useAuth } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@faithportal/mini-app-sdk/src/components/MiniAppCommunity.css'; // 커뮤니티 스타일 명시적 직접 주입 (스타일 누수 원천 차단)
import '@fortawesome/fontawesome-free/css/all.css';

// 1. 물리 키보드 릴레이용 전역 타입 선언
declare global {
    interface Document {
        parentKeyboardCallback?: ((key: string) => void) | null;
    }
}

// 2. SEO 메타데이터 동적 주입 컴포넌트 (AEO 최적화)
function PageSEO({ title, description, path }: { title: string; description: string; path: string }) {
    useEffect(() => {
        document.title = title;

        // Meta Description 주입 및 갱신
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', description);

        // Canonical Link 주입 및 갱신
        let linkCanonical = document.querySelector('link[rel="canonical"]');
        if (!linkCanonical) {
            linkCanonical = document.createElement('link');
            linkCanonical.setAttribute('rel', 'canonical');
            document.head.appendChild(linkCanonical);
        }
        linkCanonical.setAttribute('href', `https://faithlink.site${path}`);
    }, [title, description, path]);

    return null;
}

// 변환 상수 (법정 계량 기준)
const PYEONG_TO_M2 = 3.305785; // 1평 = 3.305785 m²

// 일반적인 부동산 면적 참고 데이터
const COMMON_SIZES = [
    { pyeong: 10, label: '원룸/오피스텔', emoji: '🏢' },
    { pyeong: 18, label: '소형 아파트', emoji: '🏠' },
    { pyeong: 24, label: '국민 평형', emoji: '🏡' },
    { pyeong: 34, label: '중형 아파트', emoji: '🏘️' },
    { pyeong: 42, label: '대형 아파트', emoji: '🏰' },
    { pyeong: 59, label: '펜트하우스급', emoji: '👑' },
];

type Unit = 'pyeong' | 'm2' | 'ft2';
type TabType = 'convert' | 'price' | 'howto' | 'community';

/** 가격 한글 포맷 (억/만원) */
function formatPrice(price: number): string {
    const eok = Math.floor(price / 100000000);
    const man = Math.floor((price % 100000000) / 10000);

    if (eok > 0) {
        return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
    } else if (man > 0) {
        return `${man.toLocaleString()}만`;
    }
    return price.toLocaleString();
}

/** 평당가격 수준 판정 */
function getPriceLevel(pricePerPyeong: number): { label: string; emoji: string; color: string } {
    if (pricePerPyeong < 10000000) return { label: '매우 저렴한 편', emoji: '💚', color: 'text-emerald-400' };
    if (pricePerPyeong < 20000000) return { label: '비교적 저렴한 편', emoji: '💙', color: 'text-blue-400' };
    if (pricePerPyeong < 30000000) return { label: '적정 가격대', emoji: '💛', color: 'text-amber-400' };
    if (pricePerPyeong < 50000000) return { label: '다소 높은 편', emoji: '🧡', color: 'text-orange-400' };
    return { label: '매우 높은 가격대', emoji: '❤️‍🔥', color: 'text-red-400' };
}

function App() {
    // 프리미엄 초기 로딩 상태 (UX 극대화)
    const [isLoadingScreen, setIsLoadingScreen] = useState(true);

    // 4탭 시스템 상태
    const [activeTab, setActiveTab] = useState<TabType>('convert');

    // 면적 변환 상태
    const [inputValue, setInputValue] = useState('');
    const [fromUnit, setFromUnit] = useState<Unit>('pyeong');

    // 평당가격 상태
    const [totalPrice, setTotalPrice] = useState('');
    const [priceArea, setPriceArea] = useState('');
    const [priceUnit, setPriceUnit] = useState<'pyeong' | 'm2'>('m2');

    // 3초 강제 스켈레톤 로딩 가동
    useEffect(() => {
        const timer = setTimeout(() => setIsLoadingScreen(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    // 물리 키보드 릴레이 이벤트 수신 설정
    useEffect(() => {
        const handleGlobalMessage = (e: MessageEvent) => {
            if (e.data && e.data.type === 'PARENT_KEYBOARD_EVENT') {
                const key = e.data.key;
                if (typeof document.parentKeyboardCallback === 'function') {
                    document.parentKeyboardCallback(key);
                }
            }
        };
        window.addEventListener('message', handleGlobalMessage);
        return () => window.removeEventListener('message', handleGlobalMessage);
    }, []);

    // 개별 물리 키보드 포커스 릴레이 및 콜백 매핑
    useEffect(() => {
        if (isLoadingScreen) return;

        const focusContainer = () => {
            window.focus();
            window.parent.postMessage({ type: 'MINI_APP_READY' }, '*');
        };
        const timer = setTimeout(focusContainer, 50);
        window.addEventListener('click', focusContainer);

        // 물리 타건 키 바인딩
        const myCallback = (key: string) => {
            if (/^[0-9.]$/.test(key)) {
                if (activeTab === 'convert') {
                    setInputValue(prev => prev + key);
                } else if (activeTab === 'price') {
                    const activeEl = document.activeElement;
                    if (activeEl && activeEl.tagName === 'INPUT') return;
                    setTotalPrice(prev => prev + key);
                }
            } else if (key === 'Backspace') {
                if (activeTab === 'convert') {
                    setInputValue(prev => prev.slice(0, -1));
                } else if (activeTab === 'price') {
                    const activeEl = document.activeElement;
                    if (activeEl && activeEl.tagName === 'INPUT') return;
                    setTotalPrice(prev => prev.slice(0, -1));
                }
            }
        };

        document.parentKeyboardCallback = myCallback;

        return () => {
            clearTimeout(timer);
            if (document.parentKeyboardCallback === myCallback) {
                document.parentKeyboardCallback = null;
            }
            window.removeEventListener('click', focusContainer);
        };
    }, [isLoadingScreen, activeTab]);

    // 면적 변환 연산
    const convert = useCallback((value: string, unit: Unit) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) return null;

        let pyeong: number, m2: number, ft2: number;

        switch (unit) {
            case 'pyeong':
                pyeong = num;
                m2 = num * PYEONG_TO_M2;
                ft2 = m2 * 10.7639;
                break;
            case 'm2':
                m2 = num;
                pyeong = num / PYEONG_TO_M2;
                ft2 = num * 10.7639;
                break;
            case 'ft2':
                ft2 = num;
                m2 = num / 10.7639;
                pyeong = m2 / PYEONG_TO_M2;
                break;
        }

        return { pyeong: pyeong!, m2: m2!, ft2: ft2! };
    }, []);

    const result = convert(inputValue, fromUnit);

    // 평당가격 연산
    const priceResult = (() => {
        const price = parseFloat(totalPrice);
        const area = parseFloat(priceArea);
        if (isNaN(price) || isNaN(area) || price <= 0 || area <= 0) return null;

        const pyeongArea = priceUnit === 'm2' ? area / PYEONG_TO_M2 : area;
        const m2Area = priceUnit === 'pyeong' ? area * PYEONG_TO_M2 : area;
        const pricePerPyeong = (price * 10000) / pyeongArea;
        const pricePerM2 = (price * 10000) / m2Area;

        return { pyeongArea, m2Area, pricePerPyeong, pricePerM2, totalPriceWon: price * 10000 };
    })();

    const handleQuickSelect = (pyeong: number) => {
        setFromUnit('pyeong');
        setInputValue(pyeong.toString());
    };

    const unitLabel = (u: Unit) => {
        switch (u) {
            case 'pyeong': return '평';
            case 'm2': return 'm²';
            case 'ft2': return 'ft²';
        }
    };

    // 프리미엄 로딩 스크린 (UX 극대화)
    if (isLoadingScreen) {
        return (
            <MiniAppLayout title="">
                <div className="loading-screen" role="status" aria-label="앱 로딩 중">
                    <div className="loading-body">
                        <div className="loading-icon-wrapper">
                            <i className="fas fa-home text-purple-400 text-6xl" aria-hidden="true"></i>
                        </div>

                        <h1 className="loading-title">부동산 평수 계산기</h1>
                        <p className="loading-subtitle">㎡, 평(坪), ft² 단위를 오차 없이 실시간 교차 환산하고 평당가를 연산합니다</p>

                        <div className="loading-spinner" aria-hidden="true">
                            <div className="spinner-dot"></div>
                            <div className="spinner-dot"></div>
                            <div className="spinner-dot"></div>
                        </div>

                        <aside className="loading-ad-banner" aria-label="광고 및 안내">
                            <div className="ad-placeholder">
                                <span className="ad-badge">안내</span>
                                <span className="ad-text">FaithLink와 함께하는 프리미엄 유틸리티</span>
                            </div>
                        </aside>

                        <div className="loading-info-banner" aria-label="보안 안내">
                            <div className="info-placeholder">
                                <span className="info-badge">보안</span>
                                <span className="info-text">입력하신 모든 면적과 연산 수치는 로컬 브라우저 내에서만 안전하게 보장됩니다.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </MiniAppLayout>
        );
    }

    return (
        <MiniAppLayout title="">
            {/* 동적 SEO 주입 (AEO 최적화) */}
            <PageSEO 
                title="평수 계산기 - 아파트 ㎡ 평수 환산 및 평당가격 계산기"
                description="아파트 공급면적 및 전용면적(㎡)을 평수로, 혹은 평수를 ㎡(제곱미터)와 ft²(제곱피트)로 즉시 교차 환산해주는 프리미엄 부동산 평수 계산기입니다."
                path="/app/pyeong-calc"
            />

            {/* 콤팩트 가두리 전체 레이아웃 (불필요 스크롤 완전 제거) */}
            <div className="min-h-screen bg-gradient-to-b from-[#180a30] via-[#090514] to-[#0c0818] overflow-y-auto flex flex-col w-full pb-10">
                <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center w-full">

                    {/* 헤더 */}
                    <div className="w-full text-center mb-6 mt-2">
                        <div className="text-4xl mb-2">🏠</div>
                        <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-tight">
                            평수 계산기
                        </h1>
                        <p className="text-slate-400 text-xs mt-1">부동산 법정 면적 계량 및 실시간 가격 환산 도구</p>
                    </div>

                    {/* 4탭 바 내비게이션 바 시스템 */}
                    <nav className="w-full flex gap-1 p-1 bg-slate-800/80 backdrop-blur-xs rounded-2xl mb-6 shadow-inner border border-slate-700/50" role="tablist">
                        <button
                            role="tab"
                            aria-selected={activeTab === 'convert'}
                            onClick={() => setActiveTab('convert')}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'convert'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            📐 면적 변환
                        </button>
                        <button
                            role="tab"
                            aria-selected={activeTab === 'price'}
                            onClick={() => setActiveTab('price')}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'price'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            💰 평당 가격
                        </button>
                        <button
                            role="tab"
                            aria-selected={activeTab === 'howto'}
                            onClick={() => setActiveTab('howto')}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'howto'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            📖 사용방법
                        </button>
                        <button
                            role="tab"
                            aria-selected={activeTab === 'community'}
                            onClick={() => setActiveTab('community')}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'community'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            💬 자유토론
                        </button>
                    </nav>

                    {/* ===== 1. 면적 변환 탭 ===== */}
                    {activeTab === 'convert' && (
                        <div className="w-full space-y-4 animate-fadeIn">
                            <div className="w-full bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
                                <div className="flex gap-2 mb-4">
                                    {(['pyeong', 'm2', 'ft2'] as Unit[]).map(u => (
                                        <button
                                            key={u}
                                            onClick={() => setFromUnit(u)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${fromUnit === u
                                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                                                }`}
                                        >
                                            {unitLabel(u)}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        placeholder="면적을 입력하세요"
                                        className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-4 text-2xl font-bold text-white text-center placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-lg">
                                        {unitLabel(fromUnit)}
                                    </span>
                                </div>
                            </div>

                            {result && inputValue && (
                                <div className="w-full grid grid-cols-3 gap-3">
                                    {[
                                        { unit: 'pyeong' as Unit, value: result.pyeong, color: 'from-purple-500 to-indigo-600' },
                                        { unit: 'm2' as Unit, value: result.m2, color: 'from-blue-500 to-cyan-600' },
                                        { unit: 'ft2' as Unit, value: result.ft2, color: 'from-teal-500 to-emerald-600' },
                                    ].map(item => (
                                        <div
                                            key={item.unit}
                                            className={`rounded-xl p-4 text-center transition-all ${fromUnit === item.unit
                                                    ? 'bg-slate-800/40 border border-slate-700/50 opacity-60'
                                                    : `bg-gradient-to-br ${item.color} shadow-lg`
                                                }`}
                                        >
                                            <div className="text-xs font-semibold text-white/70 mb-1">{unitLabel(item.unit)}</div>
                                            <div className="text-xl font-black text-white">
                                                {item.value < 0.01 ? item.value.toFixed(4) :
                                                    item.value < 1 ? item.value.toFixed(3) :
                                                        item.value < 100 ? item.value.toFixed(2) :
                                                            item.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="w-full bg-slate-800/40 rounded-2xl p-5 border border-slate-700/30">
                                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                    <span>📐</span> 일반적인 아파트 공급 면적 (퀵 셀렉트)
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {COMMON_SIZES.map(item => (
                                        <button
                                            key={item.pyeong}
                                            onClick={() => handleQuickSelect(item.pyeong)}
                                            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all group ${inputValue === item.pyeong.toString() && fromUnit === 'pyeong'
                                                    ? 'bg-purple-600/30 border border-purple-500/50'
                                                    : 'bg-slate-800/50 border border-slate-700/30 hover:bg-slate-700/50 hover:border-purple-500/30'
                                                }`}
                                        >
                                            <span className="text-xl">{item.emoji}</span>
                                            <div>
                                                <div className="text-white font-bold text-sm">{item.pyeong}평</div>
                                                <div className="text-slate-400 text-[10px]">{item.label} · {(item.pyeong * PYEONG_TO_M2).toFixed(1)}m²</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== 2. 평당가격 탭 ===== */}
                    {activeTab === 'price' && (
                        <div className="w-full space-y-4 animate-fadeIn">
                            <div className="w-full bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                                    <span>💰</span> 매매가 · 면적 입력
                                </h3>

                                <div className="mb-4">
                                    <label className="text-xs text-slate-400 mb-1.5 block">총 매매가격</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={totalPrice}
                                            onChange={e => setTotalPrice(e.target.value)}
                                            placeholder="예: 55000"
                                            className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3.5 text-xl font-bold text-white text-center placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-400 font-bold text-sm">
                                            만원
                                        </span>
                                    </div>
                                    {totalPrice && parseFloat(totalPrice) > 0 && (
                                        <p className="text-slate-500 text-[11px] mt-1 text-right">
                                            = {formatPrice(parseFloat(totalPrice) * 10000)}원
                                        </p>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="text-xs text-slate-400 mb-1.5 block">면적</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                value={priceArea}
                                                onChange={e => setPriceArea(e.target.value)}
                                                placeholder="면적 입력"
                                                className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3.5 text-xl font-bold text-white text-center placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setPriceUnit('m2')}
                                                className={`px-4 rounded-xl text-sm font-bold transition-all ${priceUnit === 'm2'
                                                        ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                                                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                                                    }`}
                                            >
                                                m²
                                            </button>
                                            <button
                                                onClick={() => setPriceUnit('pyeong')}
                                                className={`px-4 rounded-xl text-sm font-bold transition-all ${priceUnit === 'pyeong'
                                                        ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                                                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                                                    }`}
                                            >
                                                평
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {priceResult && (
                                <div className="w-full space-y-3">
                                    <div className="bg-gradient-to-br from-pink-600 to-rose-700 rounded-2xl p-5 shadow-lg shadow-pink-600/20">
                                        <div className="text-pink-200 text-xs font-semibold mb-1">평당 가격</div>
                                        <div className="text-3xl font-black text-white">
                                            {formatPrice(priceResult.pricePerPyeong)}원
                                        </div>
                                        <div className="text-pink-200 text-xs mt-1">
                                            m²당 {formatPrice(priceResult.pricePerM2)}원
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                                            <div className="text-slate-400 text-[11px] mb-1">총 매매가</div>
                                            <div className="text-white font-bold text-sm">{formatPrice(priceResult.totalPriceWon)}원</div>
                                        </div>
                                        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                                            <div className="text-slate-400 text-[11px] mb-1">면적</div>
                                            <div className="text-white font-bold text-sm">
                                                {priceResult.pyeongArea.toFixed(1)}평
                                                <span className="text-slate-500 text-[10px] ml-1">({priceResult.m2Area.toFixed(1)}m²)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {(() => {
                                        const level = getPriceLevel(priceResult.pricePerPyeong);
                                        return (
                                            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 flex items-center gap-3">
                                                <span className="text-2xl">{level.emoji}</span>
                                                <div>
                                                    <div className={`font-bold text-sm ${level.color}`}>{level.label}</div>
                                                    <div className="text-slate-500 text-[10px]">전국 평균 기준 참고 수치입니다</div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== 3. 사용방법 탭 ===== */}
                    {activeTab === 'howto' && (
                        <div className="w-full bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50 space-y-6 text-slate-300 animate-fadeIn text-sm">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                                    <i className="fas fa-book-open text-purple-400"></i>
                                    평수 계산기 사용방법 및 부동산 면적 가이드
                                </h2>
                                <p className="text-slate-400 text-xs">
                                    ㎡(제곱미터)와 평(坪) 단위를 손쉽게 오가며 아파트 면적을 보다 명확히 이해하도록 돕는 가이드북입니다.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30 space-y-1">
                                    <span className="text-[10px] font-bold text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded">원칙 01</span>
                                    <h3 className="text-white font-bold text-sm">법정 계량 단위 전환 의무화</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        2007년부터 비법정 단위인 '평' 대신 '㎡(제곱미터)' 사용이 전면 의무화되었습니다. 다만 일상생활 및 분양 정보에서는 여전히 평수가 친숙하게 활용되므로, 본 계산기는 1평당 <b>3.305785㎡</b>의 정밀 공식 비율로 오차 없는 양방향 변환을 지원합니다.
                                    </p>
                                </div>
                                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30 space-y-1">
                                    <span className="text-[10px] font-bold text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded">원칙 02</span>
                                    <h3 className="text-white font-bold text-sm">전용면적과 공급면적의 이해</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        아파트 분양 시 표시되는 59㎡, 84㎡ 등은 실생활에서 현관문 안쪽의 순수 내부 생활공간인 <b>'전용면적'</b>을 지칭합니다. 반면 흔히 부르는 '24평', '34평'은 복도, 계단, 엘리베이터 등 공동이 사용하는 공용 공간이 합쳐진 <b>'공급면적'</b> 기준이므로 수치 해석에 주의가 필요합니다.
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-slate-700/50 pt-5">
                                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-1.5">
                                    <i className="fas fa-lightbulb text-amber-400"></i>
                                    주요 아파트 평형 환산 FAQ 매핑 가이드
                                </h3>
                                <div className="overflow-x-auto rounded-lg border border-slate-700/50">
                                    <table className="min-w-full divide-y divide-slate-700 text-xs">
                                        <thead className="bg-slate-900/80 text-slate-300">
                                            <tr>
                                                <th className="px-4 py-2.5 text-left font-bold text-slate-300">대표 법정 전용면적</th>
                                                <th className="px-4 py-2.5 text-left font-bold text-slate-300">대략적인 공급평형</th>
                                                <th className="px-4 py-2.5 text-left font-bold text-slate-300">핵심 특징 및 실면적 계산 가이드</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50 bg-slate-900/20 text-slate-400">
                                            <tr>
                                                <td className="px-4 py-3 text-purple-400 font-semibold">전용 59㎡ (약 17.8평)</td>
                                                <td className="px-4 py-3 text-emerald-400 font-semibold">약 24 ~ 25 평형</td>
                                                <td className="px-4 py-3 text-slate-400">소형 아파트의 대명사. 방 3개, 욕실 2개 평면으로 신혼부부 및 3인 가구가 거주하기 최적화된 규모입니다.</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-purple-400 font-semibold">전용 84㎡ (약 25.4평)</td>
                                                <td className="px-4 py-3 text-emerald-400 font-semibold">약 33 ~ 35 평형</td>
                                                <td className="px-4 py-3 text-slate-400">일명 '국민 평형(국평)'. 가장 선호도가 높은 면적으로 4인 가구가 쾌적하게 생활할 수 있는 표준 규격입니다.</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-purple-400 font-semibold">전용 114㎡ (약 34.5평)</td>
                                                <td className="px-4 py-3 text-emerald-400 font-semibold">약 43 ~ 45 평형</td>
                                                <td className="px-4 py-3 text-slate-400">대형 평형대에 속하며 거실과 주방이 매우 넓게 설계되며 수납 공간과 펜트리 시설이 여유롭게 구비됩니다.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== 4. 자유토론 탭 ===== */}
                    {activeTab === 'community' && (
                        <div className="w-full animate-fadeIn">
                            <MiniAppCommunity appId="pyeong-calc" />
                        </div>
                    )}

                    {/* 하단 기본 참고 딱지 */}
                    {activeTab !== 'community' && (
                        <div className="w-full mt-4 bg-slate-800/30 rounded-xl p-4 border border-slate-700/20">
                            <p className="text-slate-500 text-[11px] leading-relaxed text-center">
                                📝 1평 = {PYEONG_TO_M2}m² (법정 환산 기준) • 1m² = {(1 / PYEONG_TO_M2).toFixed(4)}평<br />
                                부동산 전용면적과 공급면적은 다를 수 있습니다
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </MiniAppLayout>
    );
}

export default App;
