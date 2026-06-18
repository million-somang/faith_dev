import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer, Card } from '@faithportal/ui';
import FinanceSubMenu from '../components/FinanceSubMenu';

const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

type ProductType = '예금' | '적금';
type InterestType = '단리' | '복리';

// 참고용 대표 금리 (실제 금리는 각 은행에서 확인). 정보 안내 목적의 예시 데이터.
const REFERENCE_RATES = [
    { bank: 'KB국민', product: 'KB Star 정기예금', base: 3.0, top: 3.5 },
    { bank: '신한', product: '쏠편한 정기예금', base: 3.1, top: 3.6 },
    { bank: '우리', product: 'WON 정기예금', base: 3.0, top: 3.55 },
    { bank: '하나', product: '하나의정기예금', base: 3.05, top: 3.5 },
    { bank: 'NH농협', product: 'NH올원e예금', base: 2.95, top: 3.45 },
    { bank: '카카오뱅크', product: '정기예금', base: 3.2, top: 3.7 },
];

interface CalcResult {
    principal: number;     // 원금
    grossInterest: number; // 세전 이자
    tax: number;           // 이자과세
    netInterest: number;   // 세후 이자
    total: number;         // 만기 수령액
}

function calculate(amount: number, annualRate: number, months: number, type: ProductType, interest: InterestType, taxRate: number): CalcResult {
    const r = annualRate / 100;
    const mr = r / 12; // 월이율
    let principal: number;
    let grossInterest: number;

    if (type === '예금') {
        // 일시납
        principal = amount;
        if (interest === '단리') {
            grossInterest = principal * r * (months / 12);
        } else {
            const maturity = principal * Math.pow(1 + mr, months);
            grossInterest = maturity - principal;
        }
    } else {
        // 적금 (매월 amount 납입)
        principal = amount * months;
        if (interest === '단리') {
            // 각 회차가 남은 개월수만큼 단리 → 1+2+...+months = months(months+1)/2
            grossInterest = amount * mr * (months * (months + 1) / 2);
        } else if (mr === 0) {
            grossInterest = 0;
        } else {
            // 월복리, 매월말 납입(ordinary annuity)
            const maturity = amount * ((Math.pow(1 + mr, months) - 1) / mr);
            grossInterest = maturity - principal;
        }
    }

    const tax = grossInterest * (taxRate / 100);
    const netInterest = grossInterest - tax;
    const total = principal + netInterest;
    return { principal, grossInterest, tax, netInterest, total };
}

const won = (n: number) => '₩' + Math.round(n).toLocaleString('ko-KR');

export default function BankingPage() {
    const [type, setType] = useState<ProductType>('예금');
    const [interest, setInterest] = useState<InterestType>('단리');
    const [taxFree, setTaxFree] = useState(false);
    const [amount, setAmount] = useState('10000000');
    const [rate, setRate] = useState('3.5');
    const [months, setMonths] = useState('12');

    const result = useMemo(() => {
        const a = parseFloat(amount.replace(/,/g, ''));
        const r = parseFloat(rate);
        const m = parseInt(months, 10);
        if (isNaN(a) || isNaN(r) || isNaN(m) || a <= 0 || m <= 0) return null;
        return calculate(a, r, m, type, interest, taxFree ? 0 : 15.4);
    }, [amount, rate, months, type, interest, taxFree]);

    // 세그먼트 버튼 한 쌍
    const Segment = <T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) => (
        <div className="flex rounded-lg bg-gray-100 p-1">
            {options.map((o) => (
                <button
                    key={o.v}
                    type="button"
                    onClick={() => onChange(o.v)}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap ${
                        value === o.v ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:text-green-700'
                    }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen">
            <Header baseUrl={MAIN_PORTAL_URL} />
            <FinanceSubMenu />

            {/* 브레드크럼 */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link to="/" className="hover:text-green-600 transition-colors">홈</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <Link to="/" className="hover:text-green-600 transition-colors">금융</Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <span className="text-gray-900 font-medium">은행</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
                {/* 예·적금 이자 계산기 */}
                <section className="mb-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        <i className="fas fa-piggy-bank text-green-600 mr-2"></i>예·적금 이자 계산기
                    </h2>
                    <Card className="p-6">
                        {/* 옵션 토글 */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">상품 유형</label>
                                <Segment value={type} onChange={setType} options={[{ v: '예금', label: '예금(일시납)' }, { v: '적금', label: '적금(매월)' }]} />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">이자 방식</label>
                                <Segment value={interest} onChange={setInterest} options={[{ v: '단리', label: '단리' }, { v: '복리', label: '월복리' }]} />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">과세 방식</label>
                                <Segment
                                    value={taxFree ? 'free' : 'tax'}
                                    onChange={(v) => setTaxFree(v === 'free')}
                                    options={[{ v: 'tax', label: '일반(15.4%)' }, { v: 'free', label: '비과세' }]}
                                />
                            </div>
                        </div>

                        {/* 입력 */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">{type === '예금' ? '예치 금액' : '월 납입액'}</label>
                                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 focus-within:border-green-500">
                                    <input
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        inputMode="numeric"
                                        className="stock-number flex-1 min-w-0 py-3 text-right text-lg focus:outline-none bg-transparent"
                                    />
                                    <span className="shrink-0 text-gray-400 text-sm">원</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">연 이자율</label>
                                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 focus-within:border-green-500">
                                    <input
                                        value={rate}
                                        onChange={(e) => setRate(e.target.value)}
                                        inputMode="decimal"
                                        className="stock-number flex-1 min-w-0 py-3 text-right text-lg focus:outline-none bg-transparent"
                                    />
                                    <span className="shrink-0 text-gray-400 text-sm">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">기간</label>
                                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 focus-within:border-green-500">
                                    <input
                                        value={months}
                                        onChange={(e) => setMonths(e.target.value)}
                                        inputMode="numeric"
                                        className="stock-number flex-1 min-w-0 py-3 text-right text-lg focus:outline-none bg-transparent"
                                    />
                                    <span className="shrink-0 text-gray-400 text-sm">개월</span>
                                </div>
                            </div>
                        </div>

                        {/* 결과 */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5">
                            {result === null ? (
                                <p className="text-center text-gray-400 py-4">금액·이자율·기간을 입력하세요.</p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                        <span className="text-gray-600">원금 합계</span>
                                        <span className="stock-number text-right text-gray-900">{won(result.principal)}</span>
                                        <span className="text-gray-600">세전 이자</span>
                                        <span className="stock-number text-right text-gray-900">{won(result.grossInterest)}</span>
                                        <span className="text-gray-600">이자과세 {taxFree ? '(비과세)' : '(15.4%)'}</span>
                                        <span className="stock-number text-right text-red-500">-{won(result.tax)}</span>
                                        <span className="text-gray-600">세후 이자</span>
                                        <span className="stock-number text-right text-blue-600 font-medium">{won(result.netInterest)}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-green-200">
                                        <span className="font-bold text-gray-900">만기 수령액</span>
                                        <span className="stock-number text-2xl font-extrabold text-green-700">{won(result.total)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                </section>

                {/* 대표 예·적금 금리 (참고용) */}
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            <i className="fas fa-percent text-green-600 mr-2"></i>대표 예·적금 금리
                        </h2>
                        <span className="text-xs text-gray-400">참고용 예시</span>
                    </div>
                    <Card className="p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs">
                                        <th className="text-left font-medium px-4 py-3">은행</th>
                                        <th className="text-left font-medium px-4 py-3">상품</th>
                                        <th className="text-right font-medium px-4 py-3 whitespace-nowrap">기본금리</th>
                                        <th className="text-right font-medium px-4 py-3 whitespace-nowrap">최고금리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {REFERENCE_RATES.map((r) => (
                                        <tr key={r.bank} className="border-t border-gray-100">
                                            <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{r.bank}</td>
                                            <td className="px-4 py-3 text-gray-600">{r.product}</td>
                                            <td className="stock-number px-4 py-3 text-right text-gray-700">{r.base.toFixed(2)}%</td>
                                            <td className="stock-number px-4 py-3 text-right text-green-700 font-bold">{r.top.toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                    <p className="text-xs text-gray-400 mt-3">
                        * 실제 금리·우대조건은 수시로 바뀌므로 가입 전 각 은행에서 반드시 확인하세요.
                    </p>
                </section>
            </main>

            <Footer baseUrl={MAIN_PORTAL_URL} />
        </div>
    );
}
