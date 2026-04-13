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
        <section id="calc-percentage" aria-label="백분율 계산기">
            <div className="nm-form-container">
                <h3 className="nm-form-title">
                    <i className="fas fa-percent" aria-hidden="true"></i>
                    백분율 계산기
                </h3>

                {/* 1. A는 B의 몇 % */}
                <div className="nm-sub-card">
                    <h4 className="nm-sub-title">A는 B의 몇 %?</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input type="number" value={valA1} onChange={e => setValA1(Number(e.target.value))} className="nm-input" placeholder="A 값" aria-label="A 값 입력" />
                        <input type="number" value={valB1} onChange={e => setValB1(Number(e.target.value))} className="nm-input" placeholder="B 값" aria-label="B 값 입력" />
                    </div>
                    <button onClick={calc1} className="nm-submit-btn" aria-label="A는 B의 몇 퍼센트인지 계산">계산하기</button>
                    {res1 && (
                        <div className="nm-inline-result" role="status" aria-label="백분율 결과">
                            <span className="nm-result-value nm-result-value-accent text-xl font-bold">{res1}</span>
                        </div>
                    )}
                </div>

                {/* 2. A의 B%는? */}
                <div className="nm-sub-card">
                    <h4 className="nm-sub-title">A의 B%는?</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input type="number" value={valA2} onChange={e => setValA2(Number(e.target.value))} className="nm-input" placeholder="A 값" aria-label="A 값 입력" />
                        <input type="number" value={valB2} onChange={e => setValB2(Number(e.target.value))} className="nm-input" placeholder="B %" aria-label="B 퍼센트 입력" />
                    </div>
                    <button onClick={calc2} className="nm-submit-btn" aria-label="A의 B퍼센트 값 계산">계산하기</button>
                    {res2 && (
                        <div className="nm-inline-result" role="status" aria-label="백분율 값 결과">
                            <span className="nm-result-value nm-result-value-accent text-xl font-bold">{res2}</span>
                        </div>
                    )}
                </div>

                {/* 3. 증감률 계산 */}
                <div className="nm-sub-card">
                    <h4 className="nm-sub-title">증가/감소율 구하기</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label htmlFor="pct-orig" className="nm-label">원래 값</label>
                            <input id="pct-orig" type="number" value={valOrig} onChange={e => setValOrig(Number(e.target.value))} className="nm-input" placeholder="원래 값" aria-label="원래 값 입력" />
                        </div>
                        <div>
                            <label htmlFor="pct-new" className="nm-label">바뀐 값</label>
                            <input id="pct-new" type="number" value={valNew} onChange={e => setValNew(Number(e.target.value))} className="nm-input" placeholder="바뀐 값" aria-label="바뀐 값 입력" />
                        </div>
                    </div>
                    <button onClick={calc3} className="nm-submit-btn" aria-label="증감률 계산하기">계산하기</button>
                    {res3 && (
                        <div className="nm-inline-result" role="status" aria-label="증감률 결과">
                            <div className="text-center">
                                <span className="nm-result-value nm-result-value-accent text-xl font-bold">{res3.value}</span>
                            </div>
                            <div className="text-sm text-center mt-1" style={{ color: 'var(--text-muted)' }}>{res3.desc}</div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
