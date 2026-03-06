import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function BmiCalc() {
    const [height, setHeight] = useState(170);
    const [weight, setWeight] = useState(70);
    const [result, setResult] = useState(null);
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
        }
        else if (bmi < 23) {
            category = '정상';
            color = 'text-green-600';
        }
        else if (bmi < 25) {
            category = '과체중';
            color = 'text-yellow-600';
        }
        else {
            category = '비만';
            color = 'text-red-600';
        }
        setResult({ bmi, category, color });
    };
    return (_jsx("div", { id: "calc-bmi", className: "calculator-container", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx("h3", { className: "text-xl font-bold mb-4 text-gray-800", children: "BMI (\uCCB4\uC9C8\uB7C9\uC9C0\uC218) \uACC4\uC0B0\uAE30" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uD0A4 (cm)" }), _jsx("input", { type: "number", value: height, onChange: e => setHeight(Number(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "\uC608: 170" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uBAB8\uBB34\uAC8C (kg)" }), _jsx("input", { type: "number", value: weight, onChange: e => setWeight(Number(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "\uC608: 70", step: "0.1" })] }), _jsxs("button", { onClick: calculate, className: "w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition", children: [_jsx("i", { className: "fas fa-calculator mr-2" }), "\uACC4\uC0B0\uD558\uAE30"] }), result && (_jsx("div", { children: _jsxs("div", { className: "bg-blue-50 border-l-4 border-blue-500 p-4 rounded", children: [_jsx("h4", { className: "font-bold text-lg mb-3 text-gray-800", children: "\uACC4\uC0B0 \uACB0\uACFC" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold text-blue-600", children: result.bmi.toFixed(1) }), _jsx("div", { className: `text-lg font-medium mt-2 ${result.color}`, children: result.category })] }), _jsxs("div", { className: "mt-4 text-sm text-gray-600", children: [_jsx("p", { className: "font-medium mb-2", children: "BMI \uAE30\uC900:" }), _jsxs("ul", { className: "space-y-1", children: [_jsx("li", { children: "\u2022 \uC800\uCCB4\uC911: 18.5 \uBBF8\uB9CC" }), _jsx("li", { children: "\u2022 \uC815\uC0C1: 18.5 ~ 22.9" }), _jsx("li", { children: "\u2022 \uACFC\uCCB4\uC911: 23.0 ~ 24.9" }), _jsx("li", { children: "\u2022 \uBE44\uB9CC: 25.0 \uC774\uC0C1" })] })] })] })] }) }))] })] }) }));
}
