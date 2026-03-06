import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function LoanCalc() {
    const [amount, setAmount] = useState(100000000);
    const [rate, setRate] = useState(3.5);
    const [years, setYears] = useState(20);
    const [result, setResult] = useState(null);
    const calculate = () => {
        if (!amount || !rate || !years) {
            alert('모든 값을 입력해주세요');
            return;
        }
        const monthlyRate = rate / 100 / 12;
        const months = years * 12;
        let monthlyPayment = 0;
        let totalPayment = 0;
        let totalInterest = 0;
        if (monthlyRate === 0) {
            monthlyPayment = amount / months;
            totalPayment = amount;
            totalInterest = 0;
        }
        else {
            monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
            totalPayment = monthlyPayment * months;
            totalInterest = totalPayment - amount;
        }
        setResult({ monthly: monthlyPayment, total: totalPayment, interest: totalInterest });
    };
    return (_jsx("div", { id: "calc-loan", className: "calculator-container", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx("h3", { className: "text-xl font-bold mb-4 text-gray-800", children: "\uB300\uCD9C \uC0C1\uD658 \uACC4\uC0B0\uAE30" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uB300\uCD9C \uAE08\uC561 (\uC6D0)" }), _jsx("input", { type: "number", value: amount, onChange: e => setAmount(Number(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "\uC608: 100000000" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC5F0 \uC774\uC790\uC728 (%)" }), _jsx("input", { type: "number", value: rate, onChange: e => setRate(Number(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "\uC608: 3.5", step: "0.1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uB300\uCD9C \uAE30\uAC04 (\uB144)" }), _jsx("input", { type: "number", value: years, onChange: e => setYears(Number(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "\uC608: 20" })] }), _jsxs("button", { onClick: calculate, className: "w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition", children: [_jsx("i", { className: "fas fa-calculator mr-2" }), "\uACC4\uC0B0\uD558\uAE30"] }), result && (_jsx("div", { children: _jsxs("div", { className: "bg-blue-50 border-l-4 border-blue-500 p-4 rounded", children: [_jsx("h4", { className: "font-bold text-lg mb-3 text-gray-800", children: "\uACC4\uC0B0 \uACB0\uACFC" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "\uC6D4 \uC0C1\uD658\uC561:" }), _jsxs("span", { className: "font-bold text-blue-600", children: [Math.round(result.monthly).toLocaleString(), "\uC6D0"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "\uCD1D \uC0C1\uD658\uC561:" }), _jsxs("span", { className: "font-bold text-gray-800", children: [Math.round(result.total).toLocaleString(), "\uC6D0"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "\uCD1D \uC774\uC790:" }), _jsxs("span", { className: "font-bold text-red-600", children: [Math.round(result.interest).toLocaleString(), "\uC6D0"] })] })] })] }) }))] })] }) }));
}
