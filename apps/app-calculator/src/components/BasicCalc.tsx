import { useState, useEffect, useRef } from 'react';

declare global {
    interface Document {
        parentKeyboardCallback?: ((key: string) => void) | null;
    }
}

export default function BasicCalc() {
    const [expression, setExpression] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // 최신 상태를 담아둘 Ref 정의 (클로저 현상 원천 차단)
    const stateRef = useRef({ expression, append: (val: string) => {}, calculate: () => {}, backspace: () => {}, clear: () => {} });

    const append = (val: string) => setExpression(prev => prev + val);
    const clear = () => setExpression('');
    const backspace = () => setExpression(prev => prev.slice(0, -1));
    const calculate = () => {
        console.log('[CHILD] BasicCalc calculate executing. current expression:', stateRef.current.expression);
        try {
            const rawExpr = stateRef.current.expression.replace(/×/g, '*').replace(/÷/g, '/');
            console.log('[CHILD] BasicCalc calculate raw eval expression:', rawExpr);
            const result = eval(rawExpr);
            console.log('[CHILD] BasicCalc calculate success result:', result);
            setExpression(result.toString());
        } catch (e) {
            console.error('[CHILD] BasicCalc calculate error:', e);
            alert('올바른 수식을 입력해주세요');
        }
    };

    // 매 렌더링 시마다 최신 상태 및 함수를 Ref에 동기화
    stateRef.current = { expression, append, calculate, backspace, clear };

    useEffect(() => {
        const focusContainer = () => {
            window.focus();
            if (containerRef.current) {
                containerRef.current.focus();
            }
            window.parent.postMessage({ type: 'CALCULATOR_READY' }, '*');
        };

        // DOM 페인팅 타이밍 꼬임을 방지하기 위해 setTimeout 지연 포커스 기동
        const timer = setTimeout(focusContainer, 50);

        // 사용자가 계산기 화면을 클릭할 때마다 언제든 포커스를 강제로 다시 주입하여 물리 키패드 응답성 영구 유지
        window.addEventListener('click', focusContainer);

        const handleKeyDown = (e: KeyboardEvent) => {
            console.log('[CHILD] BasicCalc handleKeyDown received key:', e.key);
            // 다른 입력 필드(input, textarea 등)에 포커스가 잡힌 경우 키보드 입력을 무시합니다.
            const activeEl = document.activeElement;
            if (activeEl && (
                activeEl.tagName === 'INPUT' || 
                activeEl.tagName === 'SELECT' || 
                activeEl.tagName === 'TEXTAREA' ||
                activeEl.getAttribute('contenteditable') === 'true'
            )) {
                return;
            }

            const key = e.key;
            const current = stateRef.current;

            if (key >= '0' && key <= '9') {
                e.preventDefault();
                current.append(key);
            } else if (key === '.') {
                e.preventDefault();
                current.append('.');
            } else if (key === '+') {
                e.preventDefault();
                current.append('+');
            } else if (key === '-') {
                e.preventDefault();
                current.append('-');
            } else if (key === '*') {
                e.preventDefault();
                current.append('×');
            } else if (key === '/') {
                e.preventDefault();
                current.append('÷');
            } else if (key === '%') {
                e.preventDefault();
                current.append('%');
            } else if (key === 'Enter' || key === '=') {
                e.preventDefault();
                current.calculate();
            } else if (key === 'Backspace') {
                e.preventDefault();
                current.backspace();
            } else if (key === 'Escape' || key === 'Delete') {
                e.preventDefault();
                current.clear();
            }
        };

        // 전역 물리 키보드 릴레이 콜백 등록 (document 레벨 싱글톤 공유)
        const myCallback = (key: string) => {
            console.log('[CHILD CALLBACK] BasicCalc parentKeyboardCallback executing key:', key);
            const current = stateRef.current;
            if (key >= '0' && key <= '9') {
                current.append(key);
            } else if (key === '.') {
                current.append('.');
            } else if (key === '+') {
                current.append('+');
            } else if (key === '-') {
                current.append('-');
            } else if (key === '*') {
                current.append('×');
            } else if (key === '/') {
                current.append('÷');
            } else if (key === '%') {
                current.append('%');
            } else if (key === 'Enter' || key === '=') {
                current.calculate();
            } else if (key === 'Backspace') {
                current.backspace();
            } else if (key === 'Escape' || key === 'Delete') {
                current.clear();
            }
        };

        document.parentKeyboardCallback = myCallback;
        console.log('[CHILD] BasicCalc parentKeyboardCallback successfully bound to document. Current callback is function:', typeof document.parentKeyboardCallback === 'function');

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            clearTimeout(timer);
            if (document.parentKeyboardCallback === myCallback) {
                document.parentKeyboardCallback = null;
            }
            window.removeEventListener('click', focusContainer);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []); // 의존성 배열을 완전히 비워 1회만 등록되게 조치

    const formatExpression = (expr: string) => {
        return expr.split(/([+\-×÷%])/).map(part => {
            if (/^[\d.]+$/.test(part)) {
                const [intPart, decPart] = part.split('.');
                const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
            }
            return part;
        }).join('');
    };

    return (
        <div id="calc-basic" ref={containerRef} tabIndex={0} style={{ outline: 'none' }} className="calculator-container">
            <div className="max-w-sm sm:max-w-md mx-auto bg-gray-200 p-2 sm:p-6 rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(145deg, #e5e7eb, #d1d5db)' }}>
                <div id="basic-display" className="calculator-display" style={{ marginBottom: '1rem' }}>
                    {formatExpression(expression) || '0'}
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                    <button onClick={clear} className="calculator-btn calculator-btn-clear">C</button>
                    <button onClick={backspace} className="calculator-btn"><i className="fas fa-backspace"></i></button>
                    <button onClick={() => append('%')} className="calculator-btn calculator-btn-operator">%</button>
                    <button onClick={() => append('÷')} className="calculator-btn calculator-btn-operator">÷</button>

                    <button onClick={() => append('7')} className="calculator-btn">7</button>
                    <button onClick={() => append('8')} className="calculator-btn">8</button>
                    <button onClick={() => append('9')} className="calculator-btn">9</button>
                    <button onClick={() => append('×')} className="calculator-btn calculator-btn-operator">×</button>

                    <button onClick={() => append('4')} className="calculator-btn">4</button>
                    <button onClick={() => append('5')} className="calculator-btn">5</button>
                    <button onClick={() => append('6')} className="calculator-btn">6</button>
                    <button onClick={() => append('-')} className="calculator-btn calculator-btn-operator">-</button>

                    <button onClick={() => append('1')} className="calculator-btn">1</button>
                    <button onClick={() => append('2')} className="calculator-btn">2</button>
                    <button onClick={() => append('3')} className="calculator-btn">3</button>
                    <button onClick={() => append('+')} className="calculator-btn calculator-btn-operator">+</button>

                    <button onClick={() => append('0')} className="calculator-btn">0</button>
                    <button onClick={() => append('00')} className="calculator-btn">00</button>
                    <button onClick={() => append('.')} className="calculator-btn">.</button>
                    <button onClick={calculate} className="calculator-btn calculator-btn-equal">=</button>
                </div>
            </div>
        </div>
    );
}
