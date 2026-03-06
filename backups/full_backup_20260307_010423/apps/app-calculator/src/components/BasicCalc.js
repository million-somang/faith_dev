import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function BasicCalc() {
    const [expression, setExpression] = useState('');
    const append = (val) => setExpression(prev => prev + val);
    const clear = () => setExpression('');
    const backspace = () => setExpression(prev => prev.slice(0, -1));
    const calculate = () => {
        try {
            const result = eval(expression.replace(/×/g, '*').replace(/÷/g, '/'));
            setExpression(result.toString());
        }
        catch (e) {
            alert('올바른 수식을 입력해주세요');
        }
    };
    const formatExpression = (expr) => {
        return expr.split(/([+\-×÷%])/).map(part => {
            if (/^[\d.]+$/.test(part)) {
                const [intPart, decPart] = part.split('.');
                const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
            }
            return part;
        }).join('');
    };
    return (_jsx("div", { id: "calc-basic", className: "calculator-container", children: _jsxs("div", { className: "max-w-sm sm:max-w-md mx-auto bg-gray-200 p-2 sm:p-6 rounded-2xl shadow-2xl", style: { background: 'linear-gradient(145deg, #e5e7eb, #d1d5db)' }, children: [_jsx("div", { id: "basic-display", className: "calculator-display", style: { marginBottom: '1rem' }, children: formatExpression(expression) || '0' }), _jsxs("div", { className: "grid grid-cols-4 gap-1.5 sm:gap-3", children: [_jsx("button", { onClick: clear, className: "calculator-btn calculator-btn-clear", children: "C" }), _jsx("button", { onClick: backspace, className: "calculator-btn", children: _jsx("i", { className: "fas fa-backspace" }) }), _jsx("button", { onClick: () => append('%'), className: "calculator-btn calculator-btn-operator", children: "%" }), _jsx("button", { onClick: () => append('÷'), className: "calculator-btn calculator-btn-operator", children: "\u00F7" }), _jsx("button", { onClick: () => append('7'), className: "calculator-btn", children: "7" }), _jsx("button", { onClick: () => append('8'), className: "calculator-btn", children: "8" }), _jsx("button", { onClick: () => append('9'), className: "calculator-btn", children: "9" }), _jsx("button", { onClick: () => append('×'), className: "calculator-btn calculator-btn-operator", children: "\u00D7" }), _jsx("button", { onClick: () => append('4'), className: "calculator-btn", children: "4" }), _jsx("button", { onClick: () => append('5'), className: "calculator-btn", children: "5" }), _jsx("button", { onClick: () => append('6'), className: "calculator-btn", children: "6" }), _jsx("button", { onClick: () => append('-'), className: "calculator-btn calculator-btn-operator", children: "-" }), _jsx("button", { onClick: () => append('1'), className: "calculator-btn", children: "1" }), _jsx("button", { onClick: () => append('2'), className: "calculator-btn", children: "2" }), _jsx("button", { onClick: () => append('3'), className: "calculator-btn", children: "3" }), _jsx("button", { onClick: () => append('+'), className: "calculator-btn calculator-btn-operator", children: "+" }), _jsx("button", { onClick: () => append('0'), className: "calculator-btn", children: "0" }), _jsx("button", { onClick: () => append('00'), className: "calculator-btn", children: "00" }), _jsx("button", { onClick: () => append('.'), className: "calculator-btn", children: "." }), _jsx("button", { onClick: calculate, className: "calculator-btn calculator-btn-equal", children: "=" })] })] }) }));
}
