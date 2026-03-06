import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';
import TabBar from './components/TabBar';
import BasicCalc from './components/BasicCalc';
import ScientificCalc from './components/ScientificCalc';
import LoanCalc from './components/LoanCalc';
import BmiCalc from './components/BmiCalc';
import AgeCalc from './components/AgeCalc';
import DateCalc from './components/DateCalc';
import UnitCalc from './components/UnitCalc';
import PercentCalc from './components/PercentCalc';
function App() {
    const [activeTab, setActiveTab] = useState('basic');
    return (_jsx(MiniAppLayout, { title: "", children: _jsx("div", { className: "flex items-center justify-center min-h-[calc(100vh-56px)] p-2 sm:p-8 w-full", children: _jsxs("div", { className: "bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-10 w-full max-w-5xl flex flex-col lg:flex-row gap-6 lg:gap-10 items-center justify-center", children: [_jsxs("div", { className: "hidden lg:flex flex-1 flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-inner border border-blue-100 text-center", children: [_jsx("div", { className: "w-56 h-56 bg-white rounded-[40px] shadow-lg flex items-center justify-center mb-8 transform -rotate-3 transition-transform duration-300 hover:rotate-0 hover:scale-105", children: _jsx("i", { className: "fas fa-calculator text-8xl text-blue-400" }) }), _jsx("h2", { className: "text-3xl font-extrabold text-slate-800 tracking-tight leading-tight", children: "\uC2A4\uB9C8\uD2B8 \uB2E4\uAE30\uB2A5 \uACC4\uC0B0\uAE30" }), _jsxs("p", { className: "text-slate-500 mt-4 text-lg", children: ["\uAE30\uBCF8 \uC5F0\uC0B0\uBD80\uD130 \uB300\uCD9C, BMI, \uB2E8\uC704 \uBCC0\uD658\uAE4C\uC9C0", _jsx("br", {}), "\uC77C\uC0C1\uC758 \uBAA8\uB4E0 \uACC4\uC0B0\uC744 \uBE60\uB974\uACE0 \uC815\uD655\uD558\uAC8C."] })] }), _jsxs("div", { className: "flex-1 w-full max-w-md mx-auto", children: [_jsx(TabBar, { activeTab: activeTab, onTabChange: setActiveTab }), _jsxs("div", { className: "calculator-content min-h-[500px] mt-6", children: [activeTab === 'basic' && _jsx(BasicCalc, {}), activeTab === 'scientific' && _jsx(ScientificCalc, {}), activeTab === 'loan' && _jsx(LoanCalc, {}), activeTab === 'bmi' && _jsx(BmiCalc, {}), activeTab === 'age' && _jsx(AgeCalc, {}), activeTab === 'date' && _jsx(DateCalc, {}), activeTab === 'unit' && _jsx(UnitCalc, {}), activeTab === 'percent' && _jsx(PercentCalc, {})] })] })] }) }) }));
}
export default App;
