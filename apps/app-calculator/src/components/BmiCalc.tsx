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
            color = 'nm-result-value-accent';
        } else if (bmi < 23) {
            category = '정상';
            color = 'nm-result-value-success';
        } else if (bmi < 25) {
            category = '과체중';
            color = 'text-amber-500';
        } else {
            category = '비만';
            color = 'nm-result-value-danger';
        }

        setResult({ bmi, category, color });
    };

    return (
        <section id="calc-bmi" aria-label="BMI 체질량지수 계산기">
            <div className="nm-form-container">
                <h3 className="nm-form-title">
                    <i className="fas fa-weight" aria-hidden="true"></i>
                    BMI (체질량지수) 계산기
                </h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="bmi-height" className="nm-label">키 (cm)</label>
                        <input id="bmi-height" type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="nm-input" placeholder="예: 170" aria-label="키 입력 (cm)" />
                    </div>
                    <div>
                        <label htmlFor="bmi-weight" className="nm-label">몸무게 (kg)</label>
                        <input id="bmi-weight" type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="nm-input" placeholder="예: 70" step="0.1" aria-label="몸무게 입력 (kg)" />
                    </div>
                    <button onClick={calculate} className="nm-submit-btn" aria-label="BMI 계산하기">
                        <i className="fas fa-calculator" aria-hidden="true"></i>계산하기
                    </button>
                    {result && (
                        <div role="region" aria-label="BMI 계산 결과">
                            <div className="nm-result-card">
                                <h4 className="nm-result-title">계산 결과</h4>
                                <div>
                                    <div className="text-center py-2">
                                        <div className="nm-result-big">{result.bmi.toFixed(1)}</div>
                                        <div className={`text-lg font-semibold mt-1 ${result.color}`}>{result.category}</div>
                                    </div>
                                    <div className="nm-bmi-reference">
                                        <p>BMI 기준:</p>
                                        <ul>
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
        </section>
    );
}
