import { useState, useEffect } from 'react';

const UNIT_TYPES = {
    length: { title: '길이', units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, inch: 0.0254, ft: 0.3048, yard: 0.9144, mile: 1609.34 } },
    weight: { title: '무게', units: { kg: 1, g: 0.001, mg: 0.000001, ton: 1000, oz: 0.0283495, lb: 0.453592 } },
    area: { title: '넓이', units: { sqM: 1, sqKm: 1000000, pyeong: 3.305785, acre: 4046.856, hectare: 10000 } },
    volume: { title: '부피', units: { liter: 1, ml: 0.001, cubicM: 1000, gal: 3.78541, cup: 0.2 } },
    temperature: { title: '온도', special: true, units: { C: '섭씨', F: '화씨', K: '켈빈' } }
};

export default function UnitCalc() {
    const [unitType, setUnitType] = useState<keyof typeof UNIT_TYPES>('length');
    const [value, setValue] = useState(1);
    const [fromUnit, setFromUnit] = useState('m');
    const [toUnit, setToUnit] = useState('km');
    const [result, setResult] = useState<string | null>(null);

    const typeConfig = UNIT_TYPES[unitType];

    useEffect(() => {
        const keys = Object.keys(typeConfig.units);
        setFromUnit(keys[0]);
        setToUnit(keys[1] || keys[0]);
        setResult(null);
    }, [unitType]);

    const calculate = () => {
        if (unitType === 'temperature') {
            let inC = value;
            if (fromUnit === 'F') inC = (value - 32) * 5 / 9;
            else if (fromUnit === 'K') inC = value - 273.15;

            let out = inC;
            if (toUnit === 'F') out = inC * 9 / 5 + 32;
            else if (toUnit === 'K') out = inC + 273.15;

            setResult(`${out.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toUnit}`);
        } else {
            const types = typeConfig.units as any;
            const inBase = value * types[fromUnit];
            const out = inBase / types[toUnit];
            setResult(`${out.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toUnit}`);
        }
    };

    return (
        <section id="calc-unit" aria-label="단위 변환 계산기">
            <div className="nm-form-container">
                <h3 className="nm-form-title">
                    <i className="fas fa-exchange-alt" aria-hidden="true"></i>
                    단위 변환 계산기
                </h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="unit-type" className="nm-label">변환 종류</label>
                        <select id="unit-type" value={unitType} onChange={e => setUnitType(e.target.value as keyof typeof UNIT_TYPES)} className="nm-select" aria-label="변환 종류 선택">
                            {Object.entries(UNIT_TYPES).map(([key, val]) => (
                                <option key={key} value={key}>{val.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="unit-value" className="nm-label">변환할 값</label>
                        <input id="unit-value" type="number" value={value} onChange={e => setValue(Number(e.target.value))} className="nm-input" step="0.01" aria-label="변환할 값 입력" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="unit-from" className="nm-label">원래 단위</label>
                            <select id="unit-from" value={fromUnit} onChange={e => setFromUnit(e.target.value)} className="nm-select" aria-label="원래 단위 선택">
                                {Object.keys(typeConfig.units).map(k => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="unit-to" className="nm-label">변환할 단위</label>
                            <select id="unit-to" value={toUnit} onChange={e => setToUnit(e.target.value)} className="nm-select" aria-label="변환할 단위 선택">
                                {Object.keys(typeConfig.units).map(k => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button onClick={calculate} className="nm-submit-btn" aria-label="단위 변환하기">
                        <i className="fas fa-calculator" aria-hidden="true"></i>변환하기
                    </button>
                    {result && (
                        <div role="region" aria-label="단위 변환 결과">
                            <div className="nm-result-card">
                                <h4 className="nm-result-title">변환 결과</h4>
                                <div className="nm-result-big">{result}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
