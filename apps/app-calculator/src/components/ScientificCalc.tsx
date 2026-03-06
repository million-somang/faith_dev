import { useState } from 'react';

export default function ScientificCalc() {
    const [expression, setExpression] = useState('');

    const append = (val: string) => setExpression(prev => prev + val);
    const clear = () => setExpression('');
    const backspace = () => setExpression(prev => prev.slice(0, -1));

    const scientificOp = (op: string) => {
        const current = parseFloat(expression) || 0;
        let result: number | string = '';

        switch (op) {
            case 'sin': result = Math.sin(current * Math.PI / 180); break;
            case 'cos': result = Math.cos(current * Math.PI / 180); break;
            case 'tan': result = Math.tan(current * Math.PI / 180); break;
            case 'sqrt': result = Math.sqrt(current); break;
            case 'pow2': result = Math.pow(current, 2); break;
            case 'log': result = Math.log10(current); break;
            case 'ln': result = Math.log(current); break;
            case 'pow': setExpression(prev => prev + '^'); return;
        }
        setExpression(result.toString());
    };

    const constant = (c: string) => {
        if (c === 'pi') setExpression(prev => prev + Math.PI.toString());
        else if (c === 'e') setExpression(prev => prev + Math.E.toString());
    };

    const calculate = () => {
        try {
            const expr = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**');
            const result = eval(expr);
            setExpression(result.toString());
        } catch (e) {
            alert('올바른 수식을 입력해주세요');
        }
    };

    return (
        <div id="calc-scientific" className="calculator-container">
            <div className="max-w-md sm:max-w-lg lg:max-w-xl mx-auto bg-gray-200 p-2 sm:p-6 rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(145deg, #e5e7eb, #d1d5db)' }}>
                <div id="scientific-display" className="calculator-display" style={{ marginBottom: '2rem' }}>
                    {expression || '0'}
                </div>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                    <button onClick={clear} className="calculator-btn calculator-btn-clear">C</button>
                    <button onClick={() => scientificOp('sin')} className="calculator-btn">sin</button>
                    <button onClick={() => scientificOp('cos')} className="calculator-btn">cos</button>
                    <button onClick={() => scientificOp('tan')} className="calculator-btn">tan</button>
                    <button onClick={backspace} className="calculator-btn"><i className="fas fa-backspace"></i></button>

                    <button onClick={() => scientificOp('sqrt')} className="calculator-btn">√</button>
                    <button onClick={() => scientificOp('pow2')} className="calculator-btn">x²</button>
                    <button onClick={() => scientificOp('pow')} className="calculator-btn">xʸ</button>
                    <button onClick={() => scientificOp('log')} className="calculator-btn">log</button>
                    <button onClick={() => scientificOp('ln')} className="calculator-btn">ln</button>

                    <button onClick={() => append('7')} className="calculator-btn">7</button>
                    <button onClick={() => append('8')} className="calculator-btn">8</button>
                    <button onClick={() => append('9')} className="calculator-btn">9</button>
                    <button onClick={() => append('÷')} className="calculator-btn calculator-btn-operator">÷</button>
                    <button onClick={() => append('(')} className="calculator-btn">(</button>

                    <button onClick={() => append('4')} className="calculator-btn">4</button>
                    <button onClick={() => append('5')} className="calculator-btn">5</button>
                    <button onClick={() => append('6')} className="calculator-btn">6</button>
                    <button onClick={() => append('×')} className="calculator-btn calculator-btn-operator">×</button>
                    <button onClick={() => append(')')} className="calculator-btn">)</button>

                    <button onClick={() => append('1')} className="calculator-btn">1</button>
                    <button onClick={() => append('2')} className="calculator-btn">2</button>
                    <button onClick={() => append('3')} className="calculator-btn">3</button>
                    <button onClick={() => append('-')} className="calculator-btn calculator-btn-operator">-</button>
                    <button onClick={() => constant('pi')} className="calculator-btn">π</button>

                    <button onClick={() => append('0')} className="calculator-btn">0</button>
                    <button onClick={() => append('00')} className="calculator-btn">00</button>
                    <button onClick={() => append('.')} className="calculator-btn">.</button>
                    <button onClick={() => append('+')} className="calculator-btn calculator-btn-operator">+</button>
                    <button onClick={calculate} className="calculator-btn calculator-btn-equal">=</button>
                </div>
            </div>
        </div>
    );
}
