import { useState } from 'react';

export default function PercentCalc() {
    const [valA1, setValA1] = useState(25);
    const [valB1, setValB1] = useState(100);
    const [res1, setRes1] = useState<string | null>(null);

    const [valA2, setValA2] = useState(100);
    const [valB2, setValB2] = useState(25);
    const [res2, setRes2] = useState<string | null>(null);

    const [valOrig, setValOrig] = useState(100);
    const [valNew, setValNew] = useState(150);
    const [res3, setRes3] = useState<{ value: string; desc: string } | null>(null);

    const calc1 = () => {
        if (!valA1 || !valB1) return alert('값을 입력해주세요');
        setRes1(`${((valA1 / valB1) * 100).toFixed(2)}%`);
    };

    const calc2 = () => {
        if (!valA2 || !valB2) return alert('값을 입력해주세요');
        setRes2(`${((valA2 * valB2) / 100).toFixed(2)}`);
    };

    const calc3 = () => {
        if (!valOrig || !valNew) return alert('값을 입력해주세요');
        const diff = valNew - valOrig;
        const pct = (Math.abs(diff) / valOrig) * 100;
        setRes3({
            value: `${pct.toFixed(2)}%`,
            desc: diff > 0 ? `${Math.abs(diff).toLocaleString()} 증가했습니다.` : diff < 0 ? `${Math.abs(diff).toLocaleString()} 감소했습니다.` : '변화가 없습니다.'
        });
    };

    return (
        <div id="calc-percentage" className="calculator-container">
            <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-bold mb-4 text-gray-800">백분율 계산기</h3>

                {/* 1. A는 B의 몇 % */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-bold text-gray-800 mb-3">A는 B의 몇 %?</h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <input type="number" value={valA1} onChange={e => setValA1(Number(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="A 값" />
                        <input type="number" value={valB1} onChange={e => setValB1(Number(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="B 값" />
                    </div>
                    <button onClick={calc1} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition">계산하기</button>
                    {res1 && (
                        <div className="mt-3 bg-blue-100 p-3 rounded text-center">
                            <span className="text-2xl font-bold text-blue-600">{res1}</span>
                        </div>
                    )}
                </div>

                {/* 2. A의 B%는? */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-bold text-gray-800 mb-3">A의 B%는?</h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <input type="number" value={valA2} onChange={e => setValA2(Number(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="A 값" />
                        <input type="number" value={valB2} onChange={e => setValB2(Number(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="B %" />
                    </div>
                    <button onClick={calc2} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition">계산하기</button>
                    {res2 && (
                        <div className="mt-3 bg-blue-100 p-3 rounded text-center">
                            <span className="text-2xl font-bold text-blue-600">{res2}</span>
                        </div>
                    )}
                </div>

                {/* 3. 증감률 기 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-3">증가/감소율 구하기</h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">원래 값</label>
                            <input type="number" value={valOrig} onChange={e => setValOrig(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="원래 값" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">바뀐 값</label>
                            <input type="number" value={valNew} onChange={e => setValNew(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="바뀐 값" />
                        </div>
                    </div>
                    <button onClick={calc3} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition">계산하기</button>
                    {res3 && (
                        <div className="mt-3 bg-blue-100 p-3 rounded">
                            <div className="text-center">
                                <span className="text-2xl font-bold text-blue-600">{res3.value}</span>
                            </div>
                            <div className="text-sm text-gray-600 text-center mt-2">{res3.desc}</div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
