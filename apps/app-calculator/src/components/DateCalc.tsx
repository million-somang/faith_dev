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
        <section id="calc-date" aria-label="날짜 계산기">
            <div className="nm-form-container">
                <h3 className="nm-form-title">
                    <i className="fas fa-calendar-alt" aria-hidden="true"></i>
                    날짜 계산기
                </h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="date-start" className="nm-label">시작 날짜</label>
                        <input id="date-start" type="date" value={start} onChange={e => setStart(e.target.value)} className="nm-input" aria-label="시작 날짜 입력" />
                    </div>
                    <div>
                        <label htmlFor="date-end" className="nm-label">종료 날짜</label>
                        <input id="date-end" type="date" value={end} onChange={e => setEnd(e.target.value)} className="nm-input" aria-label="종료 날짜 입력" />
                    </div>
                    <button onClick={calculateDiff} className="nm-submit-btn" aria-label="날짜 차이 계산하기">
                        <i className="fas fa-calculator" aria-hidden="true"></i>날짜 차이 계산
                    </button>
                    {diffResult && (
                        <div role="region" aria-label="날짜 차이 결과">
                            <div className="nm-result-card">
                                <h4 className="nm-result-title">계산 결과</h4>
                                <div className="space-y-1">
                                    <div className="nm-result-row">
                                        <span className="nm-result-label">총 일수:</span>
                                        <span className="nm-result-value nm-result-value-accent">{diffResult.days.toLocaleString()}일</span>
                                    </div>
                                    <div className="nm-result-row">
                                        <span className="nm-result-label">주 단위:</span>
                                        <span className="nm-result-value nm-result-value-dark">{diffResult.weeks.toLocaleString()}주</span>
                                    </div>
                                    <div className="nm-result-row">
                                        <span className="nm-result-label">월 단위:</span>
                                        <span className="nm-result-value nm-result-value-dark">{diffResult.months.toLocaleString()}개월</span>
                                    </div>
                                    <div className="nm-result-row">
                                        <span className="nm-result-label">년 단위:</span>
                                        <span className="nm-result-value nm-result-value-dark">{diffResult.years.toLocaleString()}년</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <hr className="nm-divider" />

                    <h4 className="nm-sub-title">날짜 더하기/빼기</h4>
                    <div>
                        <label htmlFor="date-base" className="nm-label">기준 날짜</label>
                        <input id="date-base" type="date" value={base} onChange={e => setBase(e.target.value)} className="nm-input" aria-label="기준 날짜 입력" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="date-days" className="nm-label">일수</label>
                            <input id="date-days" type="number" value={addDays} onChange={e => setAddDays(Number(e.target.value))} className="nm-input" aria-label="더하거나 뺄 일수 입력" />
                        </div>
                        <div>
                            <label htmlFor="date-op" className="nm-label">연산</label>
                            <select id="date-op" value={operation} onChange={e => setOperation(e.target.value)} className="nm-select" aria-label="연산 방식 선택">
                                <option value="add">더하기 (+)</option>
                                <option value="subtract">빼기 (-)</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={calculateAdd} className="nm-submit-btn nm-submit-btn-green" aria-label="날짜 더하기 빼기 계산하기">
                        <i className="fas fa-calculator" aria-hidden="true"></i>날짜 계산하기
                    </button>
                    {addResult && (
                        <div role="region" aria-label="날짜 더하기빼기 결과">
                            <div className="nm-result-card nm-result-card-green">
                                <h4 className="nm-result-title">결과 날짜</h4>
                                <div className="nm-result-big" style={{ color: 'var(--success)' }}>{addResult}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
