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
        <section id="calc-loan" aria-label="대출 상환 계산기">
            <div className="nm-form-container">
                <h3 className="nm-form-title">
                    <i className="fas fa-money-bill-wave" aria-hidden="true"></i>
                    대출 상환 계산기
                </h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="loan-amount" className="nm-label">대출 금액 (원)</label>
                        <input id="loan-amount" type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="nm-input" placeholder="예: 100000000" aria-label="대출 금액 입력 (원)" />
                    </div>
                    <div>
                        <label htmlFor="loan-rate" className="nm-label">연 이자율 (%)</label>
                        <input id="loan-rate" type="number" value={rate} onChange={e => setRate(Number(e.target.value))} className="nm-input" placeholder="예: 3.5" step="0.1" aria-label="연 이자율 입력 (%)" />
                    </div>
                    <div>
                        <label htmlFor="loan-years" className="nm-label">대출 기간 (년)</label>
                        <input id="loan-years" type="number" value={years} onChange={e => setYears(Number(e.target.value))} className="nm-input" placeholder="예: 20" aria-label="대출 기간 입력 (년)" />
                    </div>
                    <button onClick={calculate} className="nm-submit-btn" aria-label="대출 상환액 계산하기">
                        <i className="fas fa-calculator" aria-hidden="true"></i>계산하기
                    </button>
                    {result && (
                        <div role="region" aria-label="대출 계산 결과">
                            <div className="nm-result-card">
                                <h4 className="nm-result-title">계산 결과</h4>
                                <div className="space-y-1">
                                    <div className="nm-result-row">
                                        <span className="nm-result-label">월 상환액:</span>
                                        <span className="nm-result-value nm-result-value-accent">{Math.round(result.monthly).toLocaleString()}원</span>
                                    </div>
                                    <div className="nm-result-row">
                                        <span className="nm-result-label">총 상환액:</span>
                                        <span className="nm-result-value nm-result-value-dark">{Math.round(result.total).toLocaleString()}원</span>
                                    </div>
                                    <div className="nm-result-row">
                                        <span className="nm-result-label">총 이자:</span>
                                        <span className="nm-result-value nm-result-value-danger">{Math.round(result.interest).toLocaleString()}원</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
