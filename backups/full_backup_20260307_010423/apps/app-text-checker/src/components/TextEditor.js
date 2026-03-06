import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Copy, Trash2, Eraser, Smile } from 'lucide-react';
export default function TextEditor({ text, onTextChange }) {
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        alert('클립보드에 복사되었습니다!'); // 간단한 임시 토스트 효과
    };
    const handleClear = () => {
        if (window.confirm('정말로 모든 내용을 삭제하시겠습니까?')) {
            onTextChange('');
        }
    };
    const handleRemoveSpecialChars = () => {
        const cleaned = text.replace(/<[^>]*>/g, '').replace(/[^가-힣a-zA-Z0-9\s.,!?;:\-()]/g, '');
        onTextChange(cleaned);
    };
    const handleRemoveEmojis = () => {
        const cleaned = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
        onTextChange(cleaned);
    };
    return (_jsxs("div", { className: "flex-1 bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden flex flex-col", children: [_jsxs("div", { className: "bg-gradient-to-br from-gray-50 to-gray-100 p-3 border-b border-gray-300 flex flex-wrap gap-2", children: [_jsxs("button", { onClick: handleCopy, className: "flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300", children: [_jsx(Copy, { size: 16 }), " \uBCF5\uC0AC"] }), _jsxs("button", { onClick: handleClear, className: "flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 rounded-md transition border border-gray-300", children: [_jsx(Trash2, { size: 16 }), " \uC0AD\uC81C"] }), _jsxs("button", { onClick: handleRemoveSpecialChars, className: "flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 hidden sm:flex", children: [_jsx(Eraser, { size: 16 }), " \uD2B9\uC218\uBB38\uC790 \uC81C\uAC70"] }), _jsxs("button", { onClick: handleRemoveEmojis, className: "flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 sm:ml-auto", children: [_jsx(Smile, { size: 16 }), " \uC774\uBAA8\uC9C0 \uC81C\uAC70"] })] }), _jsx("textarea", { value: text, onChange: (e) => onTextChange(e.target.value), placeholder: "\uC5EC\uAE30\uC5D0 \uB0B4\uC6A9\uC744 \uC785\uB825\uD558\uAC70\uB098 \uBD99\uC5EC\uB123\uC73C\uC138\uC694...\n\n\uC790\uC18C\uC11C, \uB808\uD3EC\uD2B8, \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD305 \uB4F1 \uC5B4\uB5A4 \uAE00\uC774\uB4E0 \uC785\uB825\uD574\uBCF4\uC138\uC694.\n\uC2E4\uC2DC\uAC04\uC73C\uB85C \uAE00\uC790 \uC218\uB97C \uC138\uACE0, \uB9DE\uCDA4\uBC95\uC744 \uAC80\uC0AC\uD574\uB4DC\uB9BD\uB2C8\uB2E4.", className: "w-full h-[350px] sm:h-[450px] lg:h-[500px] p-4 sm:p-6 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base lg:text-lg leading-relaxed text-gray-800" })] }));
}
