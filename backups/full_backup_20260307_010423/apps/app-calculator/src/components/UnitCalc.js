import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const UNIT_TYPES = {
    length: { title: '길이', units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, inch: 0.0254, ft: 0.3048, yard: 0.9144, mile: 1609.34 } },
    weight: { title: '무게', units: { kg: 1, g: 0.001, mg: 0.000001, ton: 1000, oz: 0.0283495, lb: 0.453592 } },
    area: { title: '넓이', units: { sqM: 1, sqKm: 1000000, pyeong: 3.305785, acre: 4046.856, hectare: 10000 } },
    volume: { title: '부피', units: { liter: 1, ml: 0.001, cubicM: 1000, gal: 3.78541, cup: 0.2 } },
    temperature: { title: '온도', special: true, units: { C: '섭씨', F: '화씨', K: '켈빈' } }
};
export default function UnitCalc() {
    const [unitType, setUnitType] = useState('length');
    const [value, setValue] = useState(1);
    const [fromUnit, setFromUnit] = useState('m');
    const [toUnit, setToUnit] = useState('km');
    const [result, setResult] = useState(null);
    const typeConfig = UNIT_TYPES[unitType];
    useEffect(() => {
        const keys = Object.keys(typeConfig.units);
        setFromUnit(keys[0]);
        setToUnit(keys[1] || keys[0]);
        setResult(null);
    }, [unitType]);
    const calculate = () => {
        if (unitType === 'temperature') {
            let inC = value;
            if (fromUnit === 'F')
                inC = (value - 32) * 5 / 9;
            else if (fromUnit === 'K')
                inC = value - 273.15;
            let out = inC;
            if (toUnit === 'F')
                out = inC * 9 / 5 + 32;
            else if (toUnit === 'K')
                out = inC + 273.15;
            setResult(`${out.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toUnit}`);
        }
        else {
            const types = typeConfig.units;
            const inBase = value * types[fromUnit];
            const out = inBase / types[toUnit];
            setResult(`${out.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toUnit}`);
        }
    };
    return (_jsx("div", { id: "calc-unit", className: "calculator-container", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx("h3", { className: "text-xl font-bold mb-4 text-gray-800", children: "\uB2E8\uC704 \uBCC0\uD658 \uACC4\uC0B0\uAE30" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uBCC0\uD658 \uC885\uB958" }), _jsx("select", { value: unitType, onChange: e => setUnitType(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: Object.entries(UNIT_TYPES).map(([key, val]) => (_jsx("option", { value: key, children: val.title }, key))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uBCC0\uD658\uD560 \uAC12" }), _jsx("input", { type: "number", value: value, onChange: e => setValue(Number(e.target.value)), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", step: "0.01" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uC6D0\uB798 \uB2E8\uC704" }), _jsx("select", { value: fromUnit, onChange: e => setFromUnit(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: Object.keys(typeConfig.units).map(k => (_jsx("option", { value: k, children: k }, k))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\uBCC0\uD658\uD560 \uB2E8\uC704" }), _jsx("select", { value: toUnit, onChange: e => setToUnit(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: Object.keys(typeConfig.units).map(k => (_jsx("option", { value: k, children: k }, k))) })] })] }), _jsxs("button", { onClick: calculate, className: "w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition", children: [_jsx("i", { className: "fas fa-calculator mr-2" }), "\uBCC0\uD658\uD558\uAE30"] }), result && (_jsx("div", { children: _jsxs("div", { className: "bg-blue-50 border-l-4 border-blue-500 p-4 rounded", children: [_jsx("h4", { className: "font-bold text-lg mb-2 text-gray-800", children: "\uBCC0\uD658 \uACB0\uACFC" }), _jsx("div", { className: "text-2xl font-bold text-blue-600", children: result })] }) }))] })] }) }));
}
