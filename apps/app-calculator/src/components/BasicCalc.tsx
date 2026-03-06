import { useState } from 'react';

export default function BasicCalc() {
    const [expression, setExpression] = useState('');

    const append = (val: string) => setExpression(prev => prev + val);
    const clear = () => setExpression('');
    const backspace = () => setExpression(prev => prev.slice(0, -1));
    const calculate = () => {
        try {
            const result = eval(expression.replace(/×/g, '*').replace(/÷/g, '/'));
            setExpression(result.toString());
        } catch (e) {
            alert('올바른 수식을 입력해주세요');
        }
    };

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
        <div id="calc-basic" className="calculator-container">
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
