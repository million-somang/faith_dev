import { useState, useCallback } from 'react';
import { MiniAppLayout, useAuth } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';

// 변환 상수
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
type Tab = 'convert' | 'price';

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
    const { isLoading } = useAuth();

    // 탭
    const [activeTab, setActiveTab] = useState<Tab>('convert');

    // 면적 변환
    const [inputValue, setInputValue] = useState('');
    const [fromUnit, setFromUnit] = useState<Unit>('pyeong');

    // 평당가격
    const [totalPrice, setTotalPrice] = useState('');
    const [priceArea, setPriceArea] = useState('');
    const [priceUnit, setPriceUnit] = useState<'pyeong' | 'm2'>('m2');

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

    // 평당가격 계산
    const priceResult = (() => {
        const price = parseFloat(totalPrice);
        const area = parseFloat(priceArea);
        if (isNaN(price) || isNaN(area) || price <= 0 || area <= 0) return null;

        const pyeongArea = priceUnit === 'm2' ? area / PYEONG_TO_M2 : area;
        const m2Area = priceUnit === 'pyeong' ? area * PYEONG_TO_M2 : area;
        const pricePerPyeong = (price * 10000) / pyeongArea; // 만원 단위로 입력
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

    if (isLoading) return <div className="p-8 text-center text-slate-500 min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <MiniAppLayout title="평수 계산기">
            <div className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 overflow-y-auto flex flex-col">
                <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center w-full">

                    {/* 헤더 */}
                    <div className="w-full text-center mb-4">
                        <div className="text-4xl mb-2">🏠</div>
                        <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-tight">
                            평수 계산기
                        </h1>
                    </div>

                    {/* 탭 */}
                    <div className="w-full flex gap-2 mb-5">
                        <button
                            onClick={() => setActiveTab('convert')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'convert'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`}
                        >
                            📐 면적 변환
                        </button>
                        <button
                            onClick={() => setActiveTab('price')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'price'
                                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`}
                        >
                            💰 평당가격
                        </button>
                    </div>

                    {/* ===== 면적 변환 탭 ===== */}
                    {activeTab === 'convert' && (
                        <>
                            <div className="w-full bg-slate-800/60 rounded-2xl p-5 mb-4 border border-slate-700/50">
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
                                <div className="w-full grid grid-cols-3 gap-3 mb-5">
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
                                    <span>📐</span> 일반적인 부동산 면적
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
                        </>
                    )}

                    {/* ===== 평당가격 탭 ===== */}
                    {activeTab === 'price' && (
                        <>
                            <div className="w-full bg-slate-800/60 rounded-2xl p-5 mb-4 border border-slate-700/50">
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
                        </>
                    )}

                    {/* 참고 정보 */}
                    <div className="w-full mt-4 bg-slate-800/30 rounded-xl p-4 border border-slate-700/20">
                        <p className="text-slate-500 text-[11px] leading-relaxed text-center">
                            📝 1평 = {PYEONG_TO_M2}m² (법정 환산 기준) • 1m² = {(1 / PYEONG_TO_M2).toFixed(4)}평<br />
                            부동산 전용면적과 공급면적은 다를 수 있습니다
                        </p>
                    </div>
                </div>
            </div>
        </MiniAppLayout>
    );
}

export default App;
