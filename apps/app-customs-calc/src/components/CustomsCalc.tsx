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
    const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(COUNTRIES[0]);
    const [selectedCategory, setSelectedCategory] = useState<CustomsCategory>(CATEGORIES[1]); // 기본 의류
    const [currency, setCurrency] = useState<string>('USD');
    const [amount, setAmount] = useState<string>('180');
    const [includeShipping, setIncludeShipping] = useState<boolean>(false);
    const [shippingUSD, setShippingUSD] = useState<string>('15');
    const [rates, setRates] = useState<ExchangeRateMap>(DEFAULT_RATES);
    const [ratesLoading, setRatesLoading] = useState<boolean>(true);

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
    // - 카테고리가 일반통관(영양제, 식품 등)인 경우: 무조건 $150
    // - 미국 + 목록통관: $200
    // - 일반국가: $150
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
    // 물품가격(USD)이 면세한도 이하인지 판정
    const isDutyFree = amountInUSD <= applicableLimitUSD;

    // 4. 과세가격(원화 CIF) 산출
    // 총 결제 원화 = (물품가 + 국제배송비) 환산 원화
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
        // 부가세 = (과세가격 + 관세) * 10%
        return Math.round(((totalCIF_KRW + customsAmount) * selectedCategory.vatRate) / 100);
    }, [isDutyFree, totalCIF_KRW, customsAmount, selectedCategory.vatRate]);

    const totalTax = customsAmount + vatAmount;
    const totalPayment = totalCIF_KRW + totalTax;

    return (
        <div className="space-y-6 sm:space-y-8">
            
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
                        <i className="fas fa-receipt text-indigo-500"></i>
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
                            onChange={(e) => setAmount(e.target.value)}
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
                        onClick={() => setAmount('0')}
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
                                onChange={(e) => setShippingUSD(e.target.value)}
                                inputMode="decimal"
                                className="flex-1 bg-transparent text-right font-bold stock-number text-sm text-slate-800 outline-none pr-1"
                            />
                            <span className="text-xs font-bold text-slate-400 pr-2">USD</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. 🚦 통관 판정 신호등 배너 (Status Banner) */}
            <div className={`nm-card p-5 sm:p-6 transition-all duration-500 border-2 ${
                isDutyFree 
                    ? 'border-emerald-400/80 bg-gradient-to-r from-emerald-50/50 to-teal-50/20' 
                    : 'border-red-400/80 bg-gradient-to-r from-red-50/50 to-rose-50/20'
            }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm ${
                            isDutyFree ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                            <i className={`fas ${isDutyFree ? 'fa-check' : 'fa-triangle-exclamation'}`}></i>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    isDutyFree ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {isDutyFree ? '면세 통과 (TAX-FREE)' : '관·부가세 과세 대상'}
                                </span>
                                <span className="text-xs text-slate-500 font-mono">
                                    결제액: 약 ${amountInUSD.toFixed(2)} (면세 한도: ${applicableLimitUSD})
                                </span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                                {isDutyFree 
                                    ? '예상 관세 및 부가세가 0원입니다!' 
                                    : `면세 한도($${applicableLimitUSD})를 초과하여 관·부가세가 부과됩니다.`}
                            </h3>
                        </div>
                    </div>

                    <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
                        <div className="text-xs text-slate-400">총 예상 납부세액</div>
                        <div className={`stock-number text-2xl sm:text-3xl font-black ${
                            isDutyFree ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                            ₩{totalTax.toLocaleString('ko-KR')}
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. 🧾 예상 세액 상세 영수증 (Neumorphic Inset Receipt) */}
            <div className="nm-card p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <i className="fas fa-file-invoice-dollar text-indigo-500"></i>
                        상세 예상 세액 내역서
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                        실시간 환율 기준 산출
                    </span>
                </div>

                <div className="nm-inset p-4 sm:p-5 rounded-2xl space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between items-center text-slate-600">
                        <span>물품 결제 금액</span>
                        <span className="font-bold stock-number text-slate-900">
                            {parsedAmount.toLocaleString('ko-KR')} {currency} (약 ₩{itemKRW.toLocaleString('ko-KR')})
                        </span>
                    </div>

                    {includeShipping && parsedShipping > 0 && (
                        <div className="flex justify-between items-center text-slate-600">
                            <span>국제 배송비 (운임)</span>
                            <span className="font-bold stock-number text-slate-900">
                                ${parsedShipping} (약 ₩{shippingKRW.toLocaleString('ko-KR')})
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-200/50">
                        <span>과세가격 (CIF 원화 환산액)</span>
                        <span className="font-extrabold stock-number text-slate-900">
                            ₩{totalCIF_KRW.toLocaleString('ko-KR')}
                        </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                        <span className="flex items-center gap-1">
                            예상 관세
                            <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-1.5 rounded">
                                {isDutyFree ? '면세' : `${selectedCategory.customsRate}%`}
                            </span>
                        </span>
                        <span className={`font-bold stock-number ${customsAmount > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                            {isDutyFree ? '0원 (면세)' : `₩${customsAmount.toLocaleString('ko-KR')}`}
                        </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                        <span className="flex items-center gap-1">
                            예상 부가세
                            <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-1.5 rounded">
                                {isDutyFree ? '면세' : '10%'}
                            </span>
                        </span>
                        <span className={`font-bold stock-number ${vatAmount > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                            {isDutyFree ? '0원 (면세)' : `₩${vatAmount.toLocaleString('ko-KR')}`}
                        </span>
                    </div>

                    <div className="pt-3 border-t-2 border-dashed border-slate-300 flex justify-between items-center text-sm sm:text-base">
                        <span className="font-extrabold text-slate-900">총 예상 납부 세액</span>
                        <span className={`font-black stock-number text-lg sm:text-xl ${
                            isDutyFree ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                            ₩{totalTax.toLocaleString('ko-KR')}
                        </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                        <span>직구 총 예상 지출액 (물품대금 + 관부가세)</span>
                        <span className="font-bold stock-number text-slate-700">
                            약 ₩{totalPayment.toLocaleString('ko-KR')}
                        </span>
                    </div>
                </div>

                <div className="bg-slate-100/60 p-3.5 rounded-xl text-[11px] text-slate-500 space-y-1">
                    <p>💡 <strong>합산과세 주의:</strong> 같은 날짜에 국내 공항/항만에 둘 이상의 해외직구 화물이 동시에 도착(입항)하는 경우, 두 물품의 결제금액이 합산되어 면세 한도를 초과하면 세금이 부과될 수 있습니다. (출고일을 2~3일 간격으로 조절하세요.)</p>
                    <p>※ 본 계산 결과는 관세청 통관 기준에 기반한 예상 세액이며, 실제 통관 시 적용되는 고시환율 변동 및 관세청 감정가격에 따라 약간의 차이가 발생할 수 있습니다.</p>
                </div>
            </div>

        </div>
    );
}
