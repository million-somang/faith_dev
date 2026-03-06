import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { SpellCheck, Keyboard, ArrowRight, AlertTriangle, CheckCircle, AlertCircle, Wand2 } from 'lucide-react';
import { findSimpleErrors, applyAllCorrections } from '../utils/spellRules';
export default function SpellChecker({ text, onApplyCorrections }) {
    const [errors, setErrors] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const handleCheck = () => {
        if (!text.trim()) {
            alert('먼저 텍스트를 입력해주세요.');
            return;
        }
        setIsChecking(true);
        // 간단한 모의 지연 효과
        setTimeout(() => {
            const result = findSimpleErrors(text);
            setErrors(result);
            setIsChecking(false);
        }, 800);
    };
    const handleFixAll = () => {
        if (!errors || errors.length === 0)
            return;
        const newText = applyAllCorrections(text, errors);
        onApplyCorrections(newText);
        setErrors(null);
        alert('모든 맞춤법 오류가 수정되었습니다.');
    };
    return (_jsxs("div", { className: "bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("h3", { className: "font-bold text-gray-800 flex items-center gap-2", children: [_jsx(SpellCheck, { className: "text-green-600", size: 20 }), "\uB9DE\uCDA4\uBC95 \uAC80\uC0AC"] }), isChecking ? (_jsx("span", { className: "text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium animate-pulse", children: "\uAC80\uC0AC \uC911..." })) : errors ? (errors.length === 0 ? (_jsx("span", { className: "text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium", children: "\uC624\uB958 \uC5C6\uC74C" })) : (_jsxs("span", { className: "text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium", children: [errors.length, "\uAC1C \uBC1C\uACAC"] }))) : (_jsx("span", { className: "text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium", children: "\uB300\uAE30 \uC911" }))] }), _jsx("div", { className: "min-h-[160px]", children: !errors ? (_jsxs("div", { className: "text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg border-2 border-dashed border-gray-300", children: [_jsx(Keyboard, { size: 40, className: "mx-auto mb-3 text-gray-300" }), _jsxs("p", { children: ["\uAE00\uC744 \uC785\uB825\uD558\uACE0", _jsx("br", {}), "\uAC80\uC0AC \uBC84\uD2BC\uC744 \uB20C\uB7EC\uC8FC\uC138\uC694."] })] })) : errors.length === 0 ? (_jsxs("div", { className: "text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300", children: [_jsx(CheckCircle, { size: 48, className: "mx-auto text-green-500 mb-3" }), _jsx("p", { className: "text-green-700 font-semibold", children: "\uC624\uB958\uAC00 \uBC1C\uACAC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4!" }), _jsx("p", { className: "text-gray-500 text-sm mt-2", children: "\uB9DE\uCDA4\uBC95\uC774 \uC62C\uBC14\uB985\uB2C8\uB2E4." })] })) : (_jsxs("div", { className: "space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar", children: [errors.map((error, idx) => (_jsxs("div", { className: "flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200", children: [_jsx(AlertCircle, { className: "text-red-500 mt-1 flex-shrink-0", size: 16 }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "font-medium text-gray-800 text-sm break-keep", children: [_jsx("span", { className: "bg-red-100 border-b-2 border-red-400 px-1", children: error.wrong }), _jsx(ArrowRight, { className: "inline mx-2 text-gray-400", size: 14 }), _jsx("span", { className: "bg-green-100 px-1", children: error.correct })] }), _jsxs("div", { className: "text-xs text-gray-500 mt-1 flex flex-wrap gap-2", children: [_jsx("span", { className: "bg-red-100 text-red-600 px-1.5 py-0.5 rounded", children: error.type }), error.desc && _jsxs("span", { className: "text-gray-500", children: ["\u00B7 ", error.desc] })] })] })] }, idx))), _jsxs("button", { onClick: handleFixAll, className: "w-full mt-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm", children: [_jsx(Wand2, { size: 16 }), " \uBAA8\uB4E0 \uC624\uB958 \uC790\uB3D9 \uAD50\uC815"] })] })) }), _jsxs("button", { onClick: handleCheck, disabled: isChecking, className: "w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-bold transition flex justify-center items-center gap-2 shadow-lg disabled:opacity-50", children: [_jsx(Wand2, { size: 20 }), " \uB9DE\uCDA4\uBC95 \uAC80\uC0AC \uC2DC\uC791"] }), _jsxs("div", { className: "mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 flex items-start gap-2", children: [_jsx(AlertTriangle, { size: 16, className: "flex-shrink-0 mt-0.5" }), _jsxs("p", { children: [_jsx("strong", { children: "\uC548\uB0B4:" }), " \uC815\uADDC\uC2DD \uD328\uD134 \uAE30\uBC18 \uB9DE\uCDA4\uBC95 \uAC80\uC0AC\uAE30\uC774\uBBC0\uB85C \uC644\uBCBD\uD558\uC9C0 \uC54A\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uCD5C\uC885 \uC81C\uCD9C \uC804 \uB2E4\uC2DC \uD55C\uBC88 \uD655\uC778\uD558\uC138\uC694."] })] })] }));
}
