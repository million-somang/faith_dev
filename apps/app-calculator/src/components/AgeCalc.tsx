import { useState } from 'react';

export default function AgeCalc() {
    const [birthdate, setBirthdate] = useState('1990-01-01');
    const [targetDate, setTargetDate] = useState('');
    const [result, setResult] = useState<{ full: string; days: number; nextBirthdayDays: number } | null>(null);

    const calculate = () => {
        const bDay = new Date(birthdate);
        const tDay = targetDate ? new Date(targetDate) : new Date();

        if (!birthdate || isNaN(bDay.getTime())) {
            alert('생년월일을 입력해주세요');
            return;
        }

        let years = tDay.getFullYear() - bDay.getFullYear();
        let months = tDay.getMonth() - bDay.getMonth();
        let days = tDay.getDate() - bDay.getDate();

        if (days < 0) {
            months--;
            days += new Date(tDay.getFullYear(), tDay.getMonth(), 0).getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        const totalDays = Math.floor((tDay.getTime() - bDay.getTime()) / (1000 * 60 * 60 * 24));

        const nextBirthday = new Date(tDay.getFullYear(), bDay.getMonth(), bDay.getDate());
        if (nextBirthday < tDay) {
            nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
        }
        const daysToNextBirthday = Math.ceil((nextBirthday.getTime() - tDay.getTime()) / (1000 * 60 * 60 * 24));

        setResult({
            full: `${years}년 ${months}개월 ${days}일`,
            days: totalDays,
            nextBirthdayDays: daysToNextBirthday
        });
    };

    return (
        <section id="calc-age" aria-label="나이 계산기">
            <div className="nm-form-container">
                <h3 className="nm-form-title">
                    <i className="fas fa-birthday-cake" aria-hidden="true"></i>
                    나이 계산기
                </h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="age-birthdate" className="nm-label">생년월일</label>
                        <input id="age-birthdate" type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="nm-input" aria-label="생년월일 입력" />
                    </div>
                    <div>
                        <label htmlFor="age-target" className="nm-label">기준 날짜 (선택사항)</label>
                        <input id="age-target" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="nm-input" aria-label="기준 날짜 입력 (선택사항)" />
                    </div>
                    <button onClick={calculate} className="nm-submit-btn" aria-label="나이 계산하기">
                        <i className="fas fa-calculator" aria-hidden="true"></i>계산하기
                    </button>
                    {result && (
                        <div role="region" aria-label="나이 계산 결과">
                            <div className="nm-result-card">
                                <h4 className="nm-result-title">계산 결과</h4>
                                <div className="space-y-1">
                                    <div className="nm-result-row">
                                        <span className="nm-result-label">만 나이:</span>
                                        <span className="nm-result-value nm-result-value-accent">{result.full}</span>
                                    </div>
                                    <div className="nm-result-row">
                                        <span className="nm-result-label">총 일수:</span>
                                        <span className="nm-result-value nm-result-value-dark">{result.days.toLocaleString()}일</span>
                                    </div>
                                    <div className="nm-result-row">
                                        <span className="nm-result-label">다음 생일까지:</span>
                                        <span className="nm-result-value nm-result-value-success">{result.nextBirthdayDays}일 후</span>
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
