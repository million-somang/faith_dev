import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function PercentCalc() {
    const [valA1, setValA1] = useState(25);
    const [valB1, setValB1] = useState(100);
    const [res1, setRes1] = useState(null);
    const [valA2, setValA2] = useState(100);
    const [valB2, setValB2] = useState(25);
    const [res2, setRes2] = useState(null);
    const [valOrig, setValOrig] = useState(100);
    const [valNew, setValNew] = useState(150);
    const [res3, setRes3] = useState(null);
    const calc1 = () => {
        if (!valA1 || !valB1)
            return alert('값을 입력해주세요');
        setRes1(`${((valA1 / valB1) * 100).toFixed(2)}%`);
    };
    const calc2 = () => {
        if (!valA2 || !valB2)
            return alert('값을 입력해주세요');
        setRes2(`${((valA2 * valB2) / 100).toFixed(2)}`);
    };
    const calc3 = () => {
        if (!valOrig || !valNew)
            return alert('값을 입력해주세요');
        const diff = valNew - valOrig;
        const pct = (Math.abs(diff) / valOrig) * 100;
        setRes3({
            value: `${pct.toFixed(2)}%`,
            desc: diff > 0 ? `${Math.abs(diff).toLocaleString()} 증가했습니다.` : diff < 0 ? `${Math.abs(diff).toLocaleString()} 감소했습니다.` : '변화가 없습니다.'
        });
    };
    return (_jsx("div", { id: "calc-percentage", className: "calculator-container", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx("h3", { className: "text-xl font-bold mb-4 text-gray-800", children: "\uBC31\uBD84\uC728 \uACC4\uC0B0\uAE30" }), _jsxs("div", { className: "bg-gray-50 p-4 rounded-lg mb-4", children: [_jsx("h4", { className: "font-bold text-gray-800 mb-3", children: "A\uB294 B\uC758 \uBA87 %?" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-3", children: [_jsx("input", { type: "number", value: valA1, onChange: e => setValA1(Number(e.target.value)), className: "px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", placeholder: "A \uAC12" }), _jsx("input", { type: "number", value: valB1, onChange: e => setValB1(Number(e.target.value)), className: "px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", placeholder: "B \uAC12" })] }), _jsx("button", { onClick: calc1, className: "w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition", children: "\uACC4\uC0B0\uD558\uAE30" }), res1 && (_jsx("div", { className: "mt-3 bg-blue-100 p-3 rounded text-center", children: _jsx("span", { className: "text-2xl font-bold text-blue-600", children: res1 }) }))] }), _jsxs("div", { className: "bg-gray-50 p-4 rounded-lg mb-4", children: [_jsx("h4", { className: "font-bold text-gray-800 mb-3", children: "A\uC758 B%\uB294?" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-3", children: [_jsx("input", { type: "number", value: valA2, onChange: e => setValA2(Number(e.target.value)), className: "px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", placeholder: "A \uAC12" }), _jsx("input", { type: "number", value: valB2, onChange: e => setValB2(Number(e.target.value)), className: "px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", placeholder: "B %" })] }), _jsx("button", { onClick: calc2, className: "w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition", children: "\uACC4\uC0B0\uD558\uAE30" }), res2 && (_jsx("div", { className: "mt-3 bg-blue-100 p-3 rounded text-center", children: _jsx("span", { className: "text-2xl font-bold text-blue-600", children: res2 }) }))] }), _jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-bold text-gray-800 mb-3", children: "\uC99D\uAC00/\uAC10\uC18C\uC728 \uAD6C\uD558\uAE30" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs text-gray-600 mb-1", children: "\uC6D0\uB798 \uAC12" }), _jsx("input", { type: "number", value: valOrig, onChange: e => setValOrig(Number(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", placeholder: "\uC6D0\uB798 \uAC12" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs text-gray-600 mb-1", children: "\uBC14\uB010 \uAC12" }), _jsx("input", { type: "number", value: valNew, onChange: e => setValNew(Number(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", placeholder: "\uBC14\uB010 \uAC12" })] })] }), _jsx("button", { onClick: calc3, className: "w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition", children: "\uACC4\uC0B0\uD558\uAE30" }), res3 && (_jsxs("div", { className: "mt-3 bg-blue-100 p-3 rounded", children: [_jsx("div", { className: "text-center", children: _jsx("span", { className: "text-2xl font-bold text-blue-600", children: res3.value }) }), _jsx("div", { className: "text-sm text-gray-600 text-center mt-2", children: res3.desc })] }))] })] }) }));
}
