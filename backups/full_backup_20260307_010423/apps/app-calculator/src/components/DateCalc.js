import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function DateCalc() {
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [diffResult, setDiffResult] = useState(null);
    const [base, setBase] = useState('');
    const [addDays, setAddDays] = useState(0);
    const [operation, setOperation] = useState('add');
    const [addResult, setAddResult] = useState(null);
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
        }
        else {
            resDate.setDate(resDate.getDate() - addDays);
        }
        const yy = resDate.getFullYear();
        const mm = String(resDate.getMonth() + 1).padStart(2, '0');
        const dd = String(resDate.getDate()).padStart(2, '0');
        setAddResult(`${yy}년 ${mm}월 ${dd}일`);
    };
    return (_jsx("div", { id: "calc-date", className: "calculator-container", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx("h3", { className: "text-xl font-bold mb-4 text-gray-800", children: "\uB0A0\uC9DC \uACC4\uC0B0\uAE30" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC2DC\uC791 \uB0A0\uC9DC" }), _jsx("input", { type: "date", value: start, onChange: e => setStart(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC885\uB8CC \uB0A0\uC9DC" }), _jsx("input", { type: "date", value: end, onChange: e => setEnd(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("button", { onClick: calculateDiff, className: "w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition", children: [_jsx("i", { className: "fas fa-calculator mr-2" }), "\uB0A0\uC9DC \uCC28\uC774 \uACC4\uC0B0"] }), diffResult && (_jsx("div", { children: _jsxs("div", { className: "bg-blue-50 border-l-4 border-blue-500 p-4 rounded", children: [_jsx("h4", { className: "font-bold text-lg mb-3 text-gray-800", children: "\uACC4\uC0B0 \uACB0\uACFC" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "\uCD1D \uC77C\uC218:" }), _jsxs("span", { className: "font-bold text-blue-600", children: [diffResult.days.toLocaleString(), "\uC77C"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "\uC8FC \uB2E8\uC704:" }), _jsxs("span", { className: "font-bold text-gray-800", children: [diffResult.weeks.toLocaleString(), "\uC8FC"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "\uC6D4 \uB2E8\uC704:" }), _jsxs("span", { className: "font-bold text-gray-800", children: [diffResult.months.toLocaleString(), "\uAC1C\uC6D4"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "\uB144 \uB2E8\uC704:" }), _jsxs("span", { className: "font-bold text-gray-800", children: [diffResult.years.toLocaleString(), "\uB144"] })] })] })] }) })), _jsx("hr", { className: "my-6" }), _jsx("h4", { className: "font-bold text-gray-800 mb-3", children: "\uB0A0\uC9DC \uB354\uD558\uAE30/\uBE7C\uAE30" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uAE30\uC900 \uB0A0\uC9DC" }), _jsx("input", { type: "date", value: base, onChange: e => setBase(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC77C\uC218" }), _jsx("input", { type: "number", value: addDays, onChange: e => setAddDays(Number(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC5F0\uC0B0" }), _jsxs("select", { value: operation, onChange: e => setOperation(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "add", children: "\uB354\uD558\uAE30 (+)" }), _jsx("option", { value: "subtract", children: "\uBE7C\uAE30 (-)" })] })] })] }), _jsxs("button", { onClick: calculateAdd, className: "w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition", children: [_jsx("i", { className: "fas fa-calculator mr-2" }), "\uB0A0\uC9DC \uACC4\uC0B0\uD558\uAE30"] }), addResult && (_jsx("div", { children: _jsxs("div", { className: "bg-green-50 border-l-4 border-green-500 p-4 rounded", children: [_jsx("h4", { className: "font-bold text-lg mb-2 text-gray-800", children: "\uACB0\uACFC \uB0A0\uC9DC" }), _jsx("div", { className: "text-2xl font-bold text-green-600", children: addResult })] }) }))] })] }) }));
}
