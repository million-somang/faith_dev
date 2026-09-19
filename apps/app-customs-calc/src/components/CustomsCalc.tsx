import { useState, useEffect, useMemo } from 'react';
import { COUNTRIES, CATEGORIES, CountryInfo, CustomsCategory } from '../data/customsData';
import { sound } from '../utils/sound';

const API_BASE = import.meta.env.DEV ? 'http://localhost:4200' : '';

interface ExchangeRateMap {
    [code: string]: number; // 1단위당 원화 환율
}

// 기본 환율 폴백
const DEFAULT_RATES: ExchangeRateMap = {
    USD: 1357.24,
    JPY: 8.804,
    EUR: 1574.5,
    CNY: 182.6,
    GBP: 1655.8,
    KRW: 1,
};

interface CustomsCalcProps {
    showToast: (msg: string) => void;
}

export default function CustomsCalc({ showToast }: CustomsCalcProps) {
    const [viewMode, setViewMode] = useState<'input' | 'result'>('input');
    const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(COUNTRIES[0]); // 기본 미국
    const [selectedCategory, setSelectedCategory] = useState<CustomsCategory>(CATEGORIES[1]); // 기본 의류
    const [currency, setCurrency] = useState<string>('USD');
    const [amount, setAmount] = useState<string>('180');
    const [includeShipping, setIncludeShipping] = useState<boolean>(false);
    const [shippingUSD, setShippingUSD] = useState<string>('');
    const [rates, setRates] = useState<ExchangeRateMap>(DEFAULT_RATES);
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
            .catch(() => {});
    }, []);

    // 국가 변경 시 기본 통화 세팅
    const handleCountryChange = (country: CountryInfo) => {
        sound.playClick();
        setSelectedCountry(country);
        setCurrency(country.defaultCurrency);
    };

    const handleCategoryChange = (category: CustomsCategory) => {
        sound.playClick();
        setSelectedCategory(category);
    };

    // 빠른 금액 추가 프리셋
    const addPreset = (val: number) => {
        sound.playClick();
        const cur = parseFloat(amount.replace(/,/g, '')) || 0;
        setAmount(String(Math.round(cur + val)));
    };

    const resetAmount = () => {
        sound.playReset();
        setAmount('');
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
        sound.playSuccess();
        setViewMode('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 결과 복사 기능
    const handleCopyResult = () => {
        sound.playClick();
        const text = `[해외직구 관·부가세 계산 결과 | VeraNex]
구매처: ${selectedCountry.flag} ${selectedCountry.name}
품목: ${selectedCategory.name}
결제금액: ${parsedAmount.toLocaleString('ko-KR')} ${currency} (약 ₩${itemKRW.toLocaleString('ko-KR')})
통관판정: ${isDutyFree ? '면세 통과 ($0)' : `과세 대상 (예상 세액 ₩${totalTax.toLocaleString('ko-KR')})`}
총 예상 지출액: 약 ₩${totalPayment.toLocaleString('ko-KR')}
* 2026 관세청 통관 규정 기준`;

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            showToast('📋 계산 결과가 클립보드에 복사되었습니다.');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // ========================================================
    // [화면 4] 100% 밝은 프리미엄 풀-스크린 결과 리포트 (하단 빈칸 제로)
    // ========================================================
    if (viewMode === 'result') {
        return (
            <div
                data-screenshot-point="result"
                className="min-h-[calc(850px-140px)] flex flex-col justify-between space-y-4 animate-fade-in"
            >
                {/* 상단 및 중간 종합 리포트 영역 */}
                <div className="space-y-3.5">
                    {/* 1. 메인 결과 리포트 카드 */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 space-y-4">
                        {/* 상단 헤더: 뒤로가기 + 타이틀 + 결과 복사 */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        sound.playReset();
                                        setViewMode('input');
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                                    title="입력 화면으로 돌아가기"
                                >
                                    <i className="fas fa-arrow-left text-xs"></i>
                                </button>
                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">CUSTOMS REPORT</span>
                                    <h2 className="text-base font-black text-slate-900 leading-tight">통관 세액 산출 결과</h2>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCopyResult}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                            >
                                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} text-xs`}></i>
                                <span>{copied ? '복사됨' : '결과 복사'}</span>
                            </button>
                        </div>

                        {/* 메인 결과값: 거대 히어로 메트릭 카드 */}
                        <div className={`rounded-2xl p-5 border text-center space-y-1.5 shadow-inner transition-colors ${
                            isDutyFree
                                ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border-emerald-200'
                                : 'bg-gradient-to-br from-rose-50/90 via-red-50/40 to-white border-rose-200'
                        }`}>
                            <div className="flex items-center justify-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                                    isDutyFree ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                    <i className={`fas ${isDutyFree ? 'fa-check-circle' : 'fa-triangle-exclamation'}`}></i>
                                    {isDutyFree ? '면세 통과 (TAX-FREE)' : '관·부가세 과세 대상'}
                                </span>
                            </div>

                            <div className="pt-1">
                                <span className="text-xs text-slate-500 font-bold">총 예상 납부 세액</span>
                                <div className={`text-3xl sm:text-4xl font-black tracking-tight ${
                                    isDutyFree ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                    {isDutyFree ? '0' : totalTax.toLocaleString('ko-KR')}
                                    <span className="text-lg font-bold text-slate-600 ml-1">원</span>
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-500 font-medium">
                                {isDutyFree
                                    ? `결제액 약 $${amountInUSD.toFixed(1)}로 면세 한도($${applicableLimitUSD}) 이내입니다.`
                                    : `면세 한도($${applicableLimitUSD}) 초과로 관세청 입항 시 세액 납부 필요`}
                            </p>
                        </div>

                        {/* 세부 항목 2분할 카드 (소프트 패널) */}
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">
                                    예상 관세 ({selectedCategory.customsRate}%)
                                </span>
                                <span className={`text-sm font-black ${customsAmount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {isDutyFree ? '0원' : `₩${customsAmount.toLocaleString('ko-KR')}`}
                                </span>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">
                                    예상 부가세 (10%)
                                </span>
                                <span className={`text-sm font-black ${vatAmount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {isDutyFree ? '0원' : `₩${vatAmount.toLocaleString('ko-KR')}`}
                                </span>
                            </div>
                        </div>

                        {/* 상세 내역 영수증 */}
                        <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
                            <div className="flex justify-between items-center text-slate-600">
                                <span>구매처 및 통관 유형</span>
                                <span className="font-bold text-slate-900">
                                    {selectedCountry.flag} {selectedCountry.name} · {selectedCategory.isGeneralClearance ? '일반통관' : '목록통관'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                                <span>물품 결제 금액</span>
                                <span className="font-bold stock-number text-slate-900">
                                    {parsedAmount.toLocaleString('ko-KR')} {currency} (약 ₩{itemKRW.toLocaleString('ko-KR')})
                                </span>
                            </div>
                            {includeShipping && parsedShipping > 0 && (
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>국제 배송비</span>
                                    <span className="font-bold stock-number text-slate-900">
                                        ${parsedShipping} USD (약 ₩{shippingKRW.toLocaleString('ko-KR')})
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-slate-700 pt-2 border-t border-slate-200">
                                <span className="font-bold">과세가격 (CIF 원화 환산액)</span>
                                <span className="font-extrabold stock-number text-slate-900">
                                    ₩{totalCIF_KRW.toLocaleString('ko-KR')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-slate-800 pt-1 border-t border-dashed border-slate-300">
                                <span className="font-black text-indigo-950">총 예상 지출액 (물품가 + 세액)</span>
                                <span className="font-black text-indigo-700 text-sm">
                                    약 ₩{totalPayment.toLocaleString('ko-KR')}
                                </span>
                            </div>
                        </div>

                        {/* 3대 면세 기준 비교 카드 */}
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                            <span className="text-[11px] font-extrabold text-slate-700 block">면세 기준 유형별 한도 비교</span>
                            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                                <div className={`p-2 rounded-xl border ${
                                    selectedCountry.code === 'US' && !selectedCategory.isGeneralClearance
                                        ? 'bg-indigo-50/80 border-indigo-300 shadow-2xs'
                                        : 'bg-slate-50 border-slate-200'
                                }`}>
                                    <span className="text-slate-500 font-bold block">미국 목록통관</span>
                                    <span className="font-black text-slate-900 mt-0.5 block">$200 이하</span>
                                </div>
                                <div className={`p-2 rounded-xl border ${
                                    selectedCountry.code !== 'US' && !selectedCategory.isGeneralClearance
                                        ? 'bg-indigo-50/80 border-indigo-300 shadow-2xs'
                                        : 'bg-slate-50 border-slate-200'
                                }`}>
                                    <span className="text-slate-500 font-bold block">기타국가 목록</span>
                                    <span className="font-black text-slate-900 mt-0.5 block">$150 이하</span>
                                </div>
                                <div className={`p-2 rounded-xl border ${
                                    selectedCategory.isGeneralClearance
                                        ? 'bg-amber-50 border-amber-300 shadow-2xs'
                                        : 'bg-slate-50 border-slate-200'
                                }`}>
                                    <span className="text-amber-700 font-bold block">일반통관(영양제등)</span>
                                    <span className="font-black text-amber-900 mt-0.5 block">$150 한도 ✨</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. 하단 공백 방지용 실시간 통관 인사이트 팁 패널 */}
                    <div className="bg-gradient-to-br from-indigo-50/70 to-white rounded-2xl p-4 border border-indigo-200/80 shadow-xs text-xs space-y-1.5">
                        <div className="flex items-center gap-2 text-indigo-900 font-extrabold">
                            <i className="fas fa-shield-halved text-indigo-600"></i>
                            <span>2026 직구 세금 폭탄 방지 가이드</span>
                        </div>
                        <ul className="text-slate-600 text-[11px] leading-relaxed space-y-1 list-disc pl-4">
                            <li>
                                <strong>합산과세 주의:</strong> 서로 다른 주문이라도 <strong>같은 날 국내 입항(도착)</strong>하면 금액이 합산되어 과세될 수 있습니다.
                            </li>
                            {selectedCategory.isGeneralClearance && (
                                <li className="text-amber-900 font-semibold">
                                    <strong>{selectedCategory.name}:</strong> 1인당 자가사용 <strong>최대 6병 제한</strong> 규정이 적용되며, 초과 수량은 전량 폐기됩니다.
                                </li>
                            )}
                            <li>
                                <strong>관세청 고시환율:</strong> 세관 통관 시에는 매주 관세청이 고시하는 주간 과세환율이 적용됩니다.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* 하단 밀착형 공유 & 재계산 액션 버튼 독 */}
                <div className="pt-2 flex gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            sound.playReset();
                            setViewMode('input');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                        다시 계산하기
                    </button>
                    <button
                        type="button"
                        onClick={handleCopyResult}
                        className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer active:scale-98"
                    >
                        결과 복사하기 📋
                    </button>
                </div>
            </div>
        );
    }

    // ========================================================
    // [화면 3] 메인 입력 카드 (넓고 쾌적한 풀-뷰포트 구성)
    // ========================================================
    return (
        <div className="min-h-[calc(850px-140px)] flex flex-col justify-between space-y-4 animate-fade-in">
            {/* 상단 섹션: 안내 배너 + 폼 */}
            <div className="space-y-3.5">
                
                {/* 1. 상단 안내 배너 */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <i className="fas fa-lightbulb text-xs"></i>
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed">
                        <p className="font-extrabold text-indigo-950 mb-0.5">2026 관세청 최신 통관 규정 실시간 적용</p>
                        <p className="text-slate-600">
                            미국($200) 및 일반국가($150) 목록통관 면세 여부와 품목별 예상 세액을 원클릭으로 산출합니다.
                        </p>
                    </div>
                </div>

                {/* 2. 직구 구매 국가 선택 */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <i className="fas fa-plane-departure text-indigo-600 text-xs"></i>
                            <span>1. 구매 국가 선택</span>
                        </label>
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                            {selectedCountry.code === 'US' ? '목록통관 최대 $200' : '일반국가 최대 $150'}
                        </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                        {COUNTRIES.map((c) => {
                            const isSelected = selectedCountry.code === c.code;
                            return (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => handleCountryChange(c)}
                                    data-screenshot-click="action"
                                    className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer text-center ${
                                        isSelected
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <span className="text-lg">{c.flag}</span>
                                    <span className="text-[11px] font-extrabold mt-0.5">{c.name.split('/')[0]}</span>
                                    <span className={`text-[9px] font-bold ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                        ${c.limitUSD}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                        * {selectedCountry.note}
                    </p>
                </div>

                {/* 3. 직구 물품 카테고리 선택 */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <i className="fas fa-boxes-stacked text-indigo-600 text-xs"></i>
                            <span>2. 직구 물품 품목</span>
                        </label>
                        <span className="text-[11px] text-slate-600 font-bold">
                            관세율: <strong className="text-indigo-600">{selectedCategory.customsRate}%</strong> / 부가세: <strong>10%</strong>
                        </span>
                    </div>

                    {/* 카테고리 칩 목록 */}
                    <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1 hide-scrollbar">
                        {CATEGORIES.map((cat) => {
                            const isSelected = selectedCategory.id === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`p-2 rounded-xl text-left flex items-start gap-2 border transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-black shadow-2xs'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                                    }`}
                                >
                                    <i className={`${cat.icon} mt-0.5 text-xs ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}></i>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[11px] truncate leading-tight">{cat.name.split('·')[0]}</div>
                                        <div className="text-[9px] text-slate-400 mt-0.5">
                                            관세 {cat.customsRate}% {cat.isGeneralClearance && '· 일반통관'}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* 일반통관 경고 배너 */}
                    {selectedCategory.warningNote && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2 text-[11px] text-amber-900">
                            <i className="fas fa-triangle-exclamation text-amber-500 mt-0.5 shrink-0"></i>
                            <div className="leading-snug">
                                <strong>주의:</strong> {selectedCategory.warningNote}
                                {selectedCategory.isGeneralClearance && (
                                    <span className="block text-amber-800 mt-0.5 font-bold">
                                        ※ 미국 직구라도 $150 초과 시 전액 과세 대상입니다.
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. 결제 금액 입력 & 통화 선택 & 퀵 칩 */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <i className="fas fa-coins text-indigo-600 text-xs"></i>
                            <span>3. 결제 금액 및 통화</span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-bold">
                            기준환율: 1 {currency} = {currentRateToKRW.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}원
                        </span>
                    </div>

                    {/* 통화 선택 + 금액 입력 */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                            <select
                                value={currency}
                                onChange={(e) => {
                                    sound.playClick();
                                    setCurrency(e.target.value);
                                }}
                                className="w-full h-full px-2.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none cursor-pointer"
                            >
                                <option value="USD">🇺🇸 USD (달러)</option>
                                <option value="JPY">🇯🇵 JPY (엔화)</option>
                                <option value="EUR">🇪🇺 EUR (유로)</option>
                                <option value="CNY">🇨🇳 CNY (위안)</option>
                                <option value="GBP">🇬🇧 GBP (파운드)</option>
                                <option value="KRW">🇰🇷 KRW (원화)</option>
                            </select>
                        </div>

                        <div className="col-span-2 relative">
                            <input
                                type="text"
                                value={amount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    setAmount(val);
                                }}
                                inputMode="decimal"
                                data-screenshot-input="180"
                                placeholder="0"
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:bg-white focus:border-indigo-600 outline-none text-right pr-12 stock-number"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                {currency}
                            </span>
                        </div>
                    </div>

                    {/* 금액 퀵 프리셋 칩 */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 hide-scrollbar">
                        {[20, 50, 100, 150, 200, 500].map((val) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => addPreset(val)}
                                className="px-2 py-1 text-[10px] font-bold rounded-lg border bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300 shrink-0 transition-all cursor-pointer"
                            >
                                +{val}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={resetAmount}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg border bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 shrink-0 transition-all cursor-pointer"
                        >
                            초기화
                        </button>
                    </div>

                    {/* 국제 배송비 토글 */}
                    <div className="pt-2 border-t border-slate-100">
                        <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeShipping}
                                onChange={(e) => {
                                    sound.playClick();
                                    setIncludeShipping(e.target.checked);
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span>국제 배송비 별도 추가 (과세가격 산출 시 합산)</span>
                        </label>

                        {includeShipping && (
                            <div className="mt-2 flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                <span className="text-xs text-slate-500 pl-1">배송운임:</span>
                                <input
                                    type="text"
                                    value={shippingUSD}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9.]/g, '');
                                        setShippingUSD(val);
                                    }}
                                    inputMode="decimal"
                                    placeholder="0"
                                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-right font-bold text-xs text-slate-900 outline-none"
                                />
                                <span className="text-xs font-bold text-slate-400 pr-1">USD</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* 하단 고정형 대형 CTA 버튼 */}
            <div className="pt-3">
                <button
                    type="button"
                    onClick={handleCalculate}
                    data-screenshot-click="result"
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                    <i className="fas fa-calculator text-amber-300 text-base"></i>
                    <span>결과 리포트 산출하기</span>
                </button>
            </div>
        </div>
    );
}
