import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function ScientificCalc() {
    const [expression, setExpression] = useState('');
    const append = (val) => setExpression(prev => prev + val);
    const clear = () => setExpression('');
    const backspace = () => setExpression(prev => prev.slice(0, -1));
    const scientificOp = (op) => {
        const current = parseFloat(expression) || 0;
        let result = '';
        switch (op) {
            case 'sin':
                result = Math.sin(current * Math.PI / 180);
                break;
            case 'cos':
                result = Math.cos(current * Math.PI / 180);
                break;
            case 'tan':
                result = Math.tan(current * Math.PI / 180);
                break;
            case 'sqrt':
                result = Math.sqrt(current);
                break;
            case 'pow2':
                result = Math.pow(current, 2);
                break;
            case 'log':
                result = Math.log10(current);
                break;
            case 'ln':
                result = Math.log(current);
                break;
            case 'pow':
                setExpression(prev => prev + '^');
                return;
        }
        setExpression(result.toString());
    };
    const constant = (c) => {
        if (c === 'pi')
            setExpression(prev => prev + Math.PI.toString());
        else if (c === 'e')
            setExpression(prev => prev + Math.E.toString());
    };
    const calculate = () => {
        try {
            const expr = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**');
            const result = eval(expr);
            setExpression(result.toString());
        }
        catch (e) {
            alert('올바른 수식을 입력해주세요');
        }
    };
    return (_jsx("div", { id: "calc-scientific", className: "calculator-container", children: _jsxs("div", { className: "max-w-md sm:max-w-lg lg:max-w-xl mx-auto bg-gray-200 p-2 sm:p-6 rounded-2xl shadow-2xl", style: { background: 'linear-gradient(145deg, #e5e7eb, #d1d5db)' }, children: [_jsx("div", { id: "scientific-display", className: "calculator-display", style: { marginBottom: '2rem' }, children: expression || '0' }), _jsxs("div", { className: "grid grid-cols-5 gap-1.5 sm:gap-3", children: [_jsx("button", { onClick: clear, className: "calculator-btn calculator-btn-clear", children: "C" }), _jsx("button", { onClick: () => scientificOp('sin'), className: "calculator-btn", children: "sin" }), _jsx("button", { onClick: () => scientificOp('cos'), className: "calculator-btn", children: "cos" }), _jsx("button", { onClick: () => scientificOp('tan'), className: "calculator-btn", children: "tan" }), _jsx("button", { onClick: backspace, className: "calculator-btn", children: _jsx("i", { className: "fas fa-backspace" }) }), _jsx("button", { onClick: () => scientificOp('sqrt'), className: "calculator-btn", children: "\u221A" }), _jsx("button", { onClick: () => scientificOp('pow2'), className: "calculator-btn", children: "x\u00B2" }), _jsx("button", { onClick: () => scientificOp('pow'), className: "calculator-btn", children: "x\u02B8" }), _jsx("button", { onClick: () => scientificOp('log'), className: "calculator-btn", children: "log" }), _jsx("button", { onClick: () => scientificOp('ln'), className: "calculator-btn", children: "ln" }), _jsx("button", { onClick: () => append('7'), className: "calculator-btn", children: "7" }), _jsx("button", { onClick: () => append('8'), className: "calculator-btn", children: "8" }), _jsx("button", { onClick: () => append('9'), className: "calculator-btn", children: "9" }), _jsx("button", { onClick: () => append('÷'), className: "calculator-btn calculator-btn-operator", children: "\u00F7" }), _jsx("button", { onClick: () => append('('), className: "calculator-btn", children: "(" }), _jsx("button", { onClick: () => append('4'), className: "calculator-btn", children: "4" }), _jsx("button", { onClick: () => append('5'), className: "calculator-btn", children: "5" }), _jsx("button", { onClick: () => append('6'), className: "calculator-btn", children: "6" }), _jsx("button", { onClick: () => append('×'), className: "calculator-btn calculator-btn-operator", children: "\u00D7" }), _jsx("button", { onClick: () => append(')'), className: "calculator-btn", children: ")" }), _jsx("button", { onClick: () => append('1'), className: "calculator-btn", children: "1" }), _jsx("button", { onClick: () => append('2'), className: "calculator-btn", children: "2" }), _jsx("button", { onClick: () => append('3'), className: "calculator-btn", children: "3" }), _jsx("button", { onClick: () => append('-'), className: "calculator-btn calculator-btn-operator", children: "-" }), _jsx("button", { onClick: () => constant('pi'), className: "calculator-btn", children: "\u03C0" }), _jsx("button", { onClick: () => append('0'), className: "calculator-btn", children: "0" }), _jsx("button", { onClick: () => append('00'), className: "calculator-btn", children: "00" }), _jsx("button", { onClick: () => append('.'), className: "calculator-btn", children: "." }), _jsx("button", { onClick: () => append('+'), className: "calculator-btn calculator-btn-operator", children: "+" }), _jsx("button", { onClick: calculate, className: "calculator-btn calculator-btn-equal", children: "=" })] })] }) }));
}
