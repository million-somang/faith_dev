import { useState, useEffect, useMemo } from 'react';
import { COUNTRIES, CATEGORIES, CountryInfo, CustomsCategory } from '../data/customsData';

const API_BASE = import.meta.env.DEV ? 'http://localhost:4200' : '';

interface ExchangeRateMap {
    [code: string]: number; // 1단위당 원화 환율
}

// 기본 환율 폴백
const DEFAULT_RATES: ExchangeRateMap = {
    USD: 1357.24,
    JPY: 8.804, // 1엔당
    EUR: 1574.5,
    CNY: 182.6,
    GBP: 1655.8,
    KRW: 1,
};

export default function CustomsCalc() {
    const [viewMode, setViewMode] = useState<'input' | 'result'>('input');
    const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(COUNTRIES[0]);
    const [selectedCategory, setSelectedCategory] = useState<CustomsCategory>(CATEGORIES[1]); // 기본 의류
    const [currency, setCurrency] = useState<string>('USD');
    const [amount, setAmount] = useState<string>('');
    const [includeShipping, setIncludeShipping] = useState<boolean>(false);
    const [shippingUSD, setShippingUSD] = useState<string>('');
    const [rates, setRates] = useState<ExchangeRateMap>(DEFAULT_RATES);
    const [ratesLoading, setRatesLoading] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);

    // 실시간 환율 수신
    useEffect(() => {
        fetch(`${API_BASE}/api/finance/exchange`)
            .then((r) => (r.ok ? r.json() : []))
            .then((data: any[]) => {
                if (Array.isArray(data) && data.length > 0) {
                    const map: ExchangeRateMap = { KRW: 1 };
                    data.forEach((item) => {
                        map[item.code] = item.price / (item.unit || 1);
                    });
                    setRates((prev) => ({ ...prev, ...map }));
                }
            })
            .catch(() => {})
            .finally(() => setRatesLoading(false));
    }, []);

    // 국가 변경 시 기본 통화 세팅
    const handleCountryChange = (country: CountryInfo) => {
        setSelectedCountry(country);
        setCurrency(country.defaultCurrency);
    };

    // 빠른 금액 추가 프리셋
    const addPreset = (val: number) => {
        const cur = parseFloat(amount.replace(/,/g, '')) || 0;
        setAmount(String(Math.round(cur + val)));
    };

    // 1. 적용 면세 한도(USD) 결정
    const applicableLimitUSD = useMemo(() => {
        if (selectedCategory.isGeneralClearance) return 150;
        return selectedCountry.limitUSD;
    }, [selectedCategory, selectedCountry]);

    // 2. 입력 금액의 USD 환산치 계산
    const currentRateToKRW = rates[currency] || DEFAULT_RATES[currency] || 1350;
    const usdRateToKRW = rates['USD'] || DEFAULT_RATES['USD'] || 1357.24;

    const parsedAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    const parsedShipping = includeShipping ? (parseFloat(shippingUSD.replace(/,/g, '')) || 0) : 0;

    // 결제금액의 달러 가치 (면세 한도 판정용)
    const amountInUSD = useMemo(() => {
        if (currency === 'USD') return parsedAmount;
        if (currency === 'KRW') return parsedAmount / usdRateToKRW;
        const krwValue = parsedAmount * currentRateToKRW;
        return krwValue / usdRateToKRW;
    }, [parsedAmount, currency, currentRateToKRW, usdRateToKRW]);

    // 3. 면세 여부 판별
    const isDutyFree = amountInUSD <= applicableLimitUSD;

    // 4. 과세가격(원화 CIF) 산출
    const itemKRW = Math.round(parsedAmount * currentRateToKRW);
    const shippingKRW = Math.round(parsedShipping * usdRateToKRW);
    const totalCIF_KRW = itemKRW + shippingKRW;

    // 5. 세액 계산
    const customsAmount = useMemo(() => {
        if (isDutyFree) return 0;
        return Math.round((totalCIF_KRW * selectedCategory.customsRate) / 100);
    }, [isDutyFree, totalCIF_KRW, selectedCategory.customsRate]);

    const vatAmount = useMemo(() => {
        if (isDutyFree) return 0;
        return Math.round(((totalCIF_KRW + customsAmount) * selectedCategory.vatRate) / 100);
    }, [isDutyFree, totalCIF_KRW, customsAmount, selectedCategory.vatRate]);

    const totalTax = customsAmount + vatAmount;
    const totalPayment = totalCIF_KRW + totalTax;

    // 계산 실행 버튼 핸들러 (결과 화면 전환)
    const handleCalculate = () => {
        if (parsedAmount <= 0) {
            alert('결제 금액을 0보다 크게 입력해주세요.');
            return;
        }
        setViewMode('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 결과 복사 기능
    const handleCopyResult = () => {
        const text = `[해외직구 관·부가세 계산 결과]\n구매처: ${selectedCountry.flag} ${selectedCountry.name}\n품목: ${selectedCategory.name}\n결제금액: ${parsedAmount.toLocaleString('ko-KR')} ${currency} (약 ₩${itemKRW.toLocaleString('ko-KR')})\n통관결과: ${isDutyFree ? '면세 통과 ($0)' : `과세 대상 (₩${totalTax.toLocaleString('ko-KR')})`}\n총 예상 지출액: 약 ₩${totalPayment.toLocaleString('ko-KR')}`;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // ========================================================
    // 1. 결과 화면 (Result View)
    // ========================================================
    if (viewMode === 'result') {
        return (
            <div className="space-y-6 animate-fadeIn">
                
                {/* 상단 액션 바: 다시 계산하기 & 입력 조건 요약 */}
                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setViewMode('input');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="nm-btn px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-2 cursor-pointer"
                    >
                        <i className="fas fa-arrow-left text-xs"></i>
                        <span>조건 다시 수정하기</span>
                    </button>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 nm-pill px-3 py-1.5">
                        <span>{selectedCountry.flag} {selectedCountry.name}</span>
                        <span className="text-slate-300">·</span>
                        <span className="truncate max-w-[120px]">{selectedCategory.name.split('·')[0]}</span>
                    </div>
                </div>

                {/* 🚦 통관 판정 신호등 히어로 카드 */}
                <div className={`nm-card p-6 sm:p-7 transition-all duration-300 border-2 ${
                    isDutyFree 
                        ? 'border-emerald-400 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50' 
                        : 'border-red-400 bg-gradient-to-br from-red-50/70 via-rose-50/40 to-slate-50'
                }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        <div className="flex items-start gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-md ${
                                isDutyFree ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                                <i className={`fas ${isDutyFree ? 'fa-check-double' : 'fa-triangle-exclamation'}`}></i>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                                        isDutyFree ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {isDutyFree ? '면세 통과 (TAX-FREE)' : '관·부가세 과세 대상'}
                                    </span>
                                    <span className="text-xs text-slate-500 font-mono">
                                        결제액: 약 ${amountInUSD.toFixed(2)} (면세 한도: ${applicableLimitUSD})
                                    </span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                    {isDutyFree 
                                        ? '예상 관세 및 부가세 0원 (면세)' 
                                        : `면세 한도($${applicableLimitUSD}) 초과로 관·부가세 부과`}
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-600">
                                    {isDutyFree 
                                        ? '결제 금액이 면세 한도 이내이므로 세관 통관 시 추가 납부할 세금이 없습니다.' 
                                        : '자가사용 면세 기준을 초과하여 입항 시 관세청에 세액을 납부하셔야 반출됩니다.'}
                                </p>
                            </div>
                        </div>

                        <div className="sm:border-l sm:border-slate-200/80 sm:pl-6 text-left sm:text-right shrink-0">
                            <div className="text-xs font-bold text-slate-400">총 예상 납부세액</div>
                            <div className={`stock-number text-3xl sm:text-4xl font-black mt-0.5 ${
                                isDutyFree ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                                ₩{totalTax.toLocaleString('ko-KR')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🧾 상세 예상 세액 내역서 영수증 */}
                <div className="nm-card p-6 sm:p-7 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <i className="fas fa-receipt text-indigo-500"></i>
                            예상 세액 상세 영수증
                        </h3>
                        <span className="text-[11px] text-slate-400 font-mono">
                            실시간 환율: 1 {currency} = {currentRateToKRW.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}원
                        </span>
                    </div>

                    <div className="nm-inset p-5 rounded-2xl space-y-3.5 text-xs sm:text-sm">
                        <div className="flex justify-between items-center text-slate-600">
                            <span>물품 결제 금액</span>
                            <span className="font-bold stock-number text-slate-900">
                                {parsedAmount.toLocaleString('ko-KR')} {currency} <span className="text-slate-400 font-normal">(약 ₩{itemKRW.toLocaleString('ko-KR')})</span>
                            </span>
                        </div>

                        {includeShipping && parsedShipping > 0 && (
                            <div className="flex justify-between items-center text-slate-600">
                                <span>국제 배송비 (운임)</span>
                                <span className="font-bold stock-number text-slate-900">
                                    ${parsedShipping} USD <span className="text-slate-400 font-normal">(약 ₩{shippingKRW.toLocaleString('ko-KR')})</span>
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-slate-700 pt-2 border-t border-slate-200/50">
                            <span className="font-bold">과세가격 (CIF 원화 환산액)</span>
                            <span className="font-extrabold stock-number text-slate-900 text-sm sm:text-base">
                                ₩{totalCIF_KRW.toLocaleString('ko-KR')}
                            </span>
                        </div>

                        <div className="flex justify-between items-center text-slate-600">
                            <span className="flex items-center gap-1.5">
                                예상 관세
                                <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                                    {isDutyFree ? '면세' : `${selectedCategory.customsRate}%`}
                                </span>
                            </span>
                            <span className={`font-bold stock-number ${customsAmount > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                {isDutyFree ? '0원 (면세)' : `₩${customsAmount.toLocaleString('ko-KR')}`}
                            </span>
                        </div>

                        <div className="flex justify-between items-center text-slate-600">
                            <span className="flex items-center gap-1.5">
                                예상 부가세
                                <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                                    {isDutyFree ? '면세' : '10%'}
                                </span>
                            </span>
                            <span className={`font-bold stock-number ${vatAmount > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                {isDutyFree ? '0원 (면세)' : `₩${vatAmount.toLocaleString('ko-KR')}`}
                            </span>
                        </div>

                        <div className="pt-4 border-t-2 border-dashed border-slate-300 flex justify-between items-center">
                            <div>
                                <div className="font-black text-slate-900 text-sm sm:text-base">총 예상 납부 세액</div>
                                <div className="text-[10px] text-slate-400">관세 + 부가세 합계</div>
                            </div>
                            <span className={`font-black stock-number text-xl sm:text-2xl ${
                                isDutyFree ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                                ₩{totalTax.toLocaleString('ko-KR')}
                            </span>
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-600 pt-2 border-t border-slate-200/50">
                            <span>직구 총 예상 지출액 (물품가 + 관부가세)</span>
                            <span className="font-extrabold stock-number text-slate-800 text-sm">
                                약 ₩{totalPayment.toLocaleString('ko-KR')}
                            </span>
                        </div>
                    </div>

                    {/* 유의사항 알림 박스 */}
                    <div className="bg-amber-50/70 border border-amber-200/60 p-4 rounded-xl text-xs text-amber-900 space-y-1.5">
                        <div className="font-bold flex items-center gap-1.5 text-amber-800">
                            <i className="fas fa-lightbulb"></i> 통관 필수 유의사항
                        </div>
                        <p className="leading-relaxed">
                            💡 <strong>합산과세 주의:</strong> 둘 이상의 해외 주문건이 같은 날짜에 국내 공항/항만에 동시 도착(입항)하면 물품 금액이 합산되어 면세 한도를 초과할 수 있습니다.
                        </p>
                        {selectedCategory.isGeneralClearance && (
                            <p className="leading-relaxed text-amber-950 font-semibold">
                                💊 <strong>{selectedCategory.name}:</strong> 이 품목은 일반통관 대상으로 <strong>자가사용 6병 제한</strong> 규정이 엄격히 적용됩니다.
                            </p>
                        )}
                    </div>

                    {/* 하단 버튼 세트 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode('input');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="nm-btn py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-700 hover:text-indigo-600 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <i className="fas fa-redo text-xs"></i>
                            <span>다른 물품/금액 계산하기</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleCopyResult}
                            className="nm-btn-accent py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <i className={`fas ${copied ? 'fa-check' : 'fa-share-nodes'} text-xs`}></i>
                            <span>{copied ? '결과가 복사되었습니다!' : '계산 결과 텍스트 복사'}</span>
                        </button>
                    </div>
                </div>

            </div>
        );
    }

    // ========================================================
    // 2. 입력 화면 (Input View)
    // ========================================================
    return (
        <div className="space-y-6 animate-fadeIn">
            
            {/* 1. 구매 국가 선택 칩 */}
            <div className="nm-card p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <i className="fas fa-plane-departure text-indigo-500"></i>
                        1. 직구 구매 국가 선택
                    </label>
                    <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                        {selectedCountry.code === 'US' ? '목록통관 최대 $200' : '일반국가 최대 $150'}
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {COUNTRIES.map((c) => {
                        const isSelected = selectedCountry.code === c.code;
                        return (
                            <button
                                key={c.code}
                                type="button"
                                onClick={() => handleCountryChange(c)}
                                className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer text-center ${
                                    isSelected 
                                        ? 'nm-inset bg-indigo-50/60 border border-indigo-200/80 text-indigo-900 font-extrabold shadow-inner' 
                                        : 'nm-btn text-slate-700 hover:text-indigo-600'
                                }`}
                            >
                                <span className="text-2xl">{c.flag}</span>
                                <span className="text-xs mt-0.5">{c.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                    면세 ${c.limitUSD}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <p className="text-[11px] text-slate-400">
                    * {selectedCountry.note}
                </p>
            </div>

            {/* 2. 물품 카테고리 선택 */}
            <div className="nm-card p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <i className="fas fa-boxes-stacked text-indigo-500"></i>
                        2. 직구 물품 카테고리
                    </label>
                    <span className="text-xs text-slate-500 font-mono">
                        관세율: <strong className="text-indigo-600">{selectedCategory.customsRate}%</strong> / 부가세: <strong>10%</strong>
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory.id === cat.id;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`p-2.5 rounded-xl text-left flex items-start gap-2 transition-all duration-200 cursor-pointer ${
                                    isSelected 
                                        ? 'nm-inset bg-indigo-50/60 border border-indigo-200 font-bold text-indigo-950' 
                                        : 'nm-btn text-slate-700 hover:text-indigo-600'
                                }`}
                            >
                                <i className={`${cat.icon} mt-0.5 text-xs ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}></i>
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs truncate">{cat.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                        관세 {cat.customsRate}% {cat.isGeneralClearance && '· 일반통관'}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* 일반통관 및 유의사항 경고 배너 */}
                {selectedCategory.warningNote && (
                    <div className="nm-inset p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 flex items-start gap-2 text-[11px] text-amber-900 mt-2">
                        <i className="fas fa-triangle-exclamation text-amber-500 mt-0.5 shrink-0"></i>
                        <div>
                            <strong>통관 주의사항:</strong> {selectedCategory.warningNote}
                            {selectedCategory.isGeneralClearance && (
                                <span className="block text-amber-700 mt-0.5 font-medium">
                                    ※ 이 품목은 목록통관 배제 대상(일반통관)으로, 미국 구매라도 <strong>$150 초과 시 전액 과세</strong>됩니다.
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. 결제 금액 입력 (오목 패널) */}
            <div className="nm-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <i className="fas fa-coins text-indigo-500"></i>
                        3. 결제 금액 입력
                    </label>
                    <span className="text-xs text-slate-500">
                        환율: 1 {currency} = {currentRateToKRW.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}원
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 nm-inset-white p-3 flex items-center justify-between">
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                setAmount(val);
                            }}
                            inputMode="decimal"
                            placeholder="0"
                            className="w-full bg-transparent text-right font-black stock-number text-2xl text-slate-900 outline-none pr-2"
                        />
                        <span className="text-sm font-bold text-slate-400 shrink-0">{currency}</span>
                    </div>

                    <div className="flex items-center">
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full nm-btn px-3 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 outline-none cursor-pointer border border-slate-200"
                        >
                            <option value="USD">🇺🇸 USD (달러)</option>
                            <option value="JPY">🇯🇵 JPY (엔화)</option>
                            <option value="EUR">🇪🇺 EUR (유로)</option>
                            <option value="CNY">🇨🇳 CNY (위안)</option>
                            <option value="GBP">🇬🇧 GBP (파운드)</option>
                            <option value="KRW">🇰🇷 KRW (원화)</option>
                        </select>
                    </div>
                </div>

                {/* 퀵 금액 프리셋 버튼 */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold pt-1">
                    <span className="text-[10px] text-slate-400 mr-1">빠른 추가:</span>
                    {[20, 50, 100, 200, 500].map((val) => (
                        <button
                            key={val}
                            type="button"
                            onClick={() => addPreset(val)}
                            className="nm-btn px-2.5 py-1 text-slate-600 hover:text-indigo-600 transition-all rounded-lg text-xs"
                        >
                            +{val}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => setAmount('')}
                        className="nm-btn px-2.5 py-1 text-red-500 hover:text-red-700 transition-all rounded-lg text-xs"
                    >
                        초기화
                    </button>
                </div>

                {/* 국제 배송비 옵션 토글 */}
                <div className="pt-2 border-t border-slate-200/60">
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includeShipping}
                            onChange={(e) => setIncludeShipping(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <span>현지 또는 국제 배송비 별도 추가 (과세가격 계산 시 반영)</span>
                    </label>

                    {includeShipping && (
                        <div className="mt-2.5 flex items-center gap-2 max-w-xs nm-inset-white p-2">
                            <span className="text-xs text-slate-500 pl-2">배송비:</span>
                            <input
                                type="text"
                                value={shippingUSD}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    setShippingUSD(val);
                                }}
                                inputMode="decimal"
                                placeholder="0"
                                className="flex-1 bg-transparent text-right font-bold stock-number text-sm text-slate-800 outline-none pr-1"
                            />
                            <span className="text-xs font-bold text-slate-400 pr-2">USD</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. 🚀 대형 계산하기 액션 버튼 */}
            <div className="pt-2">
                <button
                    type="button"
                    onClick={handleCalculate}
                    className="w-full nm-btn-accent py-4 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2.5 cursor-pointer shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.99]"
                >
                    <i className="fas fa-calculator"></i>
                    <span>예상 관·부가세 계산하기</span>
                </button>
            </div>

        </div>
    );
}

