import { useState } from 'react';

export default function LoanCalc() {
    const [amount, setAmount] = useState(100000000);
    const [rate, setRate] = useState(3.5);
    const [years, setYears] = useState(20);
    const [result, setResult] = useState<{ monthly: number; total: number; interest: number } | null>(null);

    const calculate = () => {
        if (!amount || !rate || !years) {
            alert('모든 값을 입력해주세요');
            return;
        }

        const monthlyRate = rate / 100 / 12;
        const months = years * 12;

        let monthlyPayment = 0;
        let totalPayment = 0;
        let totalInterest = 0;

        if (monthlyRate === 0) {
            monthlyPayment = amount / months;
            totalPayment = amount;
            totalInterest = 0;
        } else {
            monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
            totalPayment = monthlyPayment * months;
            totalInterest = totalPayment - amount;
        }

        setResult({ monthly: monthlyPayment, total: totalPayment, interest: totalInterest });
    };

    return (
        <div id="calc-loan" className="calculator-container">
            <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-bold mb-4 text-gray-800">대출 상환 계산기</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">대출 금액 (원)</label>
                        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="예: 100000000" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">연 이자율 (%)</label>
                        <input type="number" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="예: 3.5" step="0.1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">대출 기간 (년)</label>
                        <input type="number" value={years} onChange={e => setYears(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="예: 20" />
                    </div>
                    <button onClick={calculate} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition">
                        <i className="fas fa-calculator mr-2"></i>계산하기
                    </button>
                    {result && (
                        <div>
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                <h4 className="font-bold text-lg mb-3 text-gray-800">계산 결과</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">월 상환액:</span>
                                        <span className="font-bold text-blue-600">{Math.round(result.monthly).toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">총 상환액:</span>
                                        <span className="font-bold text-gray-800">{Math.round(result.total).toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">총 이자:</span>
                                        <span className="font-bold text-red-600">{Math.round(result.interest).toLocaleString()}원</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
