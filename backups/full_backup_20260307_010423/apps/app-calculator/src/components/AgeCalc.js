import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function AgeCalc() {
    const [birthdate, setBirthdate] = useState('1990-01-01');
    const [targetDate, setTargetDate] = useState('');
    const [result, setResult] = useState(null);
    const calculate = () => {
        const bDay = new Date(birthdate);
        const tDay = targetDate ? new Date(targetDate) : new Date();
        if (!birthdate || isNaN(bDay.getTime())) {
            alert('생년월일을 입력해주세요');
            return;
        }
        let years = tDay.getFullYear() - bDay.getFullYear();
        let months = tDay.getMonth() - bDay.getMonth();
        let days = tDay.getDate() - bDay.getDate();
        if (days < 0) {
            months--;
            days += new Date(tDay.getFullYear(), tDay.getMonth(), 0).getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }
        const totalDays = Math.floor((tDay.getTime() - bDay.getTime()) / (1000 * 60 * 60 * 24));
        const nextBirthday = new Date(tDay.getFullYear(), bDay.getMonth(), bDay.getDate());
        if (nextBirthday < tDay) {
            nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
        }
        const daysToNextBirthday = Math.ceil((nextBirthday.getTime() - tDay.getTime()) / (1000 * 60 * 60 * 24));
        setResult({
            full: `${years}년 ${months}개월 ${days}일`,
            days: totalDays,
            nextBirthdayDays: daysToNextBirthday
        });
    };
    return (_jsx("div", { id: "calc-age", className: "calculator-container", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx("h3", { className: "text-xl font-bold mb-4 text-gray-800", children: "\uB098\uC774 \uACC4\uC0B0\uAE30" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC0DD\uB144\uC6D4\uC77C" }), _jsx("input", { type: "date", value: birthdate, onChange: e => setBirthdate(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uAE30\uC900 \uB0A0\uC9DC (\uC120\uD0DD\uC0AC\uD56D)" }), _jsx("input", { type: "date", value: targetDate, onChange: e => setTargetDate(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("button", { onClick: calculate, className: "w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition", children: [_jsx("i", { className: "fas fa-calculator mr-2" }), "\uACC4\uC0B0\uD558\uAE30"] }), result && (_jsx("div", { children: _jsxs("div", { className: "bg-blue-50 border-l-4 border-blue-500 p-4 rounded", children: [_jsx("h4", { className: "font-bold text-lg mb-3 text-gray-800", children: "\uACC4\uC0B0 \uACB0\uACFC" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "\uB9CC \uB098\uC774:" }), _jsx("span", { className: "font-bold text-blue-600", children: result.full })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "\uCD1D \uC77C\uC218:" }), _jsxs("span", { className: "font-bold text-gray-800", children: [result.days.toLocaleString(), "\uC77C"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "\uB2E4\uC74C \uC0DD\uC77C\uAE4C\uC9C0:" }), _jsxs("span", { className: "font-bold text-green-600", children: [result.nextBirthdayDays, "\uC77C \uD6C4"] })] })] })] }) }))] })] }) }));
}
