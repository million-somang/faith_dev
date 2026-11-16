'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@faithportal/ui';
import FinanceSubMenu from '@/components/finance/FinanceSubMenu';

type ProductType = '예금' | '적금';
type InterestType = '단리' | '복리';

interface CalcResult {
    principal: number;
    grossInterest: number;
    tax: number;
    netInterest: number;
    total: number;
}

function calculate(
    amount: number,
    annualRate: number,
    months: number,
    type: ProductType,
    interest: InterestType,
    taxRate: number
): CalcResult {
    const r = annualRate / 100;
    const mr = r / 12;
    let principal: number;
    let grossInterest: number;

    if (type === '예금') {
        principal = amount;
        if (interest === '단리') {
            grossInterest = principal * r * (months / 12);
        } else {
            const maturity = principal * Math.pow(1 + mr, months);
            grossInterest = maturity - principal;
        }
    } else {
        principal = amount * months;
        if (interest === '단리') {
            grossInterest = amount * mr * ((months * (months + 1)) / 2);
        } else if (mr === 0) {
            grossInterest = 0;
        } else {
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

    const Segment = <T extends string>({
        value,
        options,
        onChange,
    }: {
        value: T;
        options: { v: T; label: string }[];
        onChange: (v: T) => void;
    }) => (
        <div className="flex rounded-xl bg-gray-100 p-1">
            {options.map((o) => (
                <button
                    key={o.v}
                    type="button"
                    onClick={() => onChange(o.v)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                        value === o.v
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'text-gray-600 hover:text-green-700'
                    }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col flex-1">
            <FinanceSubMenu />

            <div className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 w-full">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-green-600 transition-colors">
                            홈
                        </Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <Link href="/finance" className="hover:text-green-600 transition-colors">
                            금융
                        </Link>
                        <i className="fas fa-chevron-right text-xs text-gray-300"></i>
                        <span className="text-gray-900 font-medium">은행 · 예적금 계산기</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 py-8 sm:py-10 w-full space-y-8">
                <section>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 flex items-center gap-2">
                        <i className="fas fa-piggy-bank text-green-600"></i>
                        <span>예·적금 단리/복리 &amp; 비과세 이자 계산기</span>
                    </h1>
                    <Card className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">상품 유형</label>
                                <Segment
                                    value={type}
                                    onChange={setType}
                                    options={[
                                        { v: '예금', label: '예금(일시납)' },
                                        { v: '적금', label: '적금(매월)' },
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">이자 방식</label>
                                <Segment
                                    value={interest}
                                    onChange={setInterest}
                                    options={[
                                        { v: '단리', label: '단리' },
                                        { v: '복리', label: '월복리' },
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">과세 방식</label>
                                <Segment
                                    value={taxFree ? 'free' : 'tax'}
                                    onChange={(v) => setTaxFree(v === 'free')}
                                    options={[
                                        { v: 'tax', label: '일반(15.4%)' },
                                        { v: 'free', label: '비과세(0%)' },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    {type === '예금' ? '예치 금액' : '월 납입액'}
                                </label>
                                <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 focus-within:border-green-500 bg-white">
                                    <input
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        inputMode="numeric"
                                        className="font-mono flex-1 min-w-0 py-3 text-right text-lg focus:outline-none bg-transparent"
                                    />
                                    <span className="shrink-0 text-gray-400 text-sm">원</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">연 이자율</label>
                                <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 focus-within:border-green-500 bg-white">
                                    <input
                                        value={rate}
                                        onChange={(e) => setRate(e.target.value)}
                                        inputMode="decimal"
                                        className="font-mono flex-1 min-w-0 py-3 text-right text-lg focus:outline-none bg-transparent"
                                    />
                                    <span className="shrink-0 text-gray-400 text-sm">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">기간</label>
                                <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 focus-within:border-green-500 bg-white">
                                    <input
                                        value={months}
                                        onChange={(e) => setMonths(e.target.value)}
                                        inputMode="numeric"
                                        className="font-mono flex-1 min-w-0 py-3 text-right text-lg focus:outline-none bg-transparent"
                                    />
                                    <span className="shrink-0 text-gray-400 text-sm">개월</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-5">
                            {result === null ? (
                                <p className="text-center text-gray-400 py-4">
                                    금액·이자율·기간을 입력하세요.
                                </p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                        <span className="text-gray-600">원금 합계</span>
                                        <span className="font-mono text-right text-gray-900 font-semibold">
                                            {won(result.principal)}
                                        </span>
                                        <span className="text-gray-600">세전 이자</span>
                                        <span className="font-mono text-right text-gray-900 font-semibold">
                                            {won(result.grossInterest)}
                                        </span>
                                        <span className="text-gray-600">
                                            이자과세 {taxFree ? '(비과세)' : '(15.4%)'}
                                        </span>
                                        <span className="font-mono text-right text-red-500 font-semibold">
                                            -{won(result.tax)}
                                        </span>
                                        <span className="text-gray-600">세후 이자</span>
                                        <span className="font-mono text-right text-blue-600 font-bold">
                                            {won(result.netInterest)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-green-200">
                                        <span className="font-bold text-gray-900">만기 수령액</span>
                                        <span className="font-mono text-2xl font-extrabold text-green-700">
                                            {won(result.total)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                </section>
            </main>
        </div>
    );
}
