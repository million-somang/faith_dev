import { useState } from 'react';

export default function BmiCalc() {
    const [height, setHeight] = useState(170);
    const [weight, setWeight] = useState(70);
    const [result, setResult] = useState<{ bmi: number; category: string; color: string } | null>(null);

    const calculate = () => {
        if (!height || !weight) {
            alert('키와 몸무게를 입력해주세요');
            return;
        }

        const hMeter = height / 100;
        const bmi = weight / (hMeter * hMeter);
        let category = '', color = '';

        if (bmi < 18.5) {
            category = '저체중';
            color = 'text-blue-600';
        } else if (bmi < 23) {
            category = '정상';
            color = 'text-green-600';
        } else if (bmi < 25) {
            category = '과체중';
            color = 'text-yellow-600';
        } else {
            category = '비만';
            color = 'text-red-600';
        }

        setResult({ bmi, category, color });
    };

    return (
        <div id="calc-bmi" className="calculator-container">
            <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-bold mb-4 text-gray-800">BMI (체질량지수) 계산기</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">키 (cm)</label>
                        <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="예: 170" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">몸무게 (kg)</label>
                        <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="예: 70" step="0.1" />
                    </div>
                    <button onClick={calculate} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition">
                        <i className="fas fa-calculator mr-2"></i>계산하기
                    </button>
                    {result && (
                        <div>
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                <h4 className="font-bold text-lg mb-3 text-gray-800">계산 결과</h4>
                                <div className="space-y-2">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-600">{result.bmi.toFixed(1)}</div>
                                        <div className={`text-lg font-medium mt-2 ${result.color}`}>{result.category}</div>
                                    </div>
                                    <div className="mt-4 text-sm text-gray-600">
                                        <p className="font-medium mb-2">BMI 기준:</p>
                                        <ul className="space-y-1">
                                            <li>• 저체중: 18.5 미만</li>
                                            <li>• 정상: 18.5 ~ 22.9</li>
                                            <li>• 과체중: 23.0 ~ 24.9</li>
                                            <li>• 비만: 25.0 이상</li>
                                        </ul>
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
