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
        <div id="calc-age" className="calculator-container">
            <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-bold mb-4 text-gray-800">나이 계산기</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                        <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">기준 날짜 (선택사항)</label>
                        <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
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
                                        <span className="text-gray-600">만 나이:</span>
                                        <span className="font-bold text-blue-600">{result.full}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">총 일수:</span>
                                        <span className="font-bold text-gray-800">{result.days.toLocaleString()}일</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">다음 생일까지:</span>
                                        <span className="font-bold text-green-600">{result.nextBirthdayDays}일 후</span>
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
