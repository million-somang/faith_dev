import { useState } from 'react';

export default function DateCalc() {
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [diffResult, setDiffResult] = useState<{ days: number; weeks: number; months: number; years: number } | null>(null);

    const [base, setBase] = useState('');
    const [addDays, setAddDays] = useState(0);
    const [operation, setOperation] = useState('add');
    const [addResult, setAddResult] = useState<string | null>(null);

    const calculateDiff = () => {
        const d1 = new Date(start);
        const d2 = new Date(end);
        if (!start || !end || isNaN(d1.getTime()) || isNaN(d2.getTime())) {
            alert('날짜를 올바르게 입력해주세요');
            return;
        }

        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setDiffResult({
            days: diffDays,
            weeks: Math.floor(diffDays / 7),
            months: Math.floor(diffDays / 30.44),
            years: Math.floor(diffDays / 365.25)
        });
    };

    const calculateAdd = () => {
        const dBase = new Date(base);
        if (!base || isNaN(dBase.getTime())) {
            alert('기준 날짜를 입력해주세요');
            return;
        }

        const resDate = new Date(dBase);
        if (operation === 'add') {
            resDate.setDate(resDate.getDate() + addDays);
        } else {
            resDate.setDate(resDate.getDate() - addDays);
        }

        const yy = resDate.getFullYear();
        const mm = String(resDate.getMonth() + 1).padStart(2, '0');
        const dd = String(resDate.getDate()).padStart(2, '0');

        setAddResult(`${yy}년 ${mm}월 ${dd}일`);
    };

    return (
        <div id="calc-date" className="calculator-container">
            <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-bold mb-4 text-gray-800">날짜 계산기</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">시작 날짜</label>
                        <input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">종료 날짜</label>
                        <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <button onClick={calculateDiff} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition">
                        <i className="fas fa-calculator mr-2"></i>날짜 차이 계산
                    </button>
                    {diffResult && (
                        <div>
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                <h4 className="font-bold text-lg mb-3 text-gray-800">계산 결과</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">총 일수:</span>
                                        <span className="font-bold text-blue-600">{diffResult.days.toLocaleString()}일</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">주 단위:</span>
                                        <span className="font-bold text-gray-800">{diffResult.weeks.toLocaleString()}주</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">월 단위:</span>
                                        <span className="font-bold text-gray-800">{diffResult.months.toLocaleString()}개월</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">년 단위:</span>
                                        <span className="font-bold text-gray-800">{diffResult.years.toLocaleString()}년</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <hr className="my-6" />

                    <h4 className="font-bold text-gray-800 mb-3">날짜 더하기/빼기</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">기준 날짜</label>
                        <input type="date" value={base} onChange={e => setBase(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">일수</label>
                            <input type="number" value={addDays} onChange={e => setAddDays(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">연산</label>
                            <select value={operation} onChange={e => setOperation(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="add">더하기 (+)</option>
                                <option value="subtract">빼기 (-)</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={calculateAdd} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition">
                        <i className="fas fa-calculator mr-2"></i>날짜 계산하기
                    </button>
                    {addResult && (
                        <div>
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                                <h4 className="font-bold text-lg mb-2 text-gray-800">결과 날짜</h4>
                                <div className="text-2xl font-bold text-green-600">{addResult}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
