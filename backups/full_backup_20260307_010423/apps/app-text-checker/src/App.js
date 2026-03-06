import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';
import { useTextStats } from './hooks/useTextStats';
import TextEditor from './components/TextEditor';
import StatsPanel from './components/StatsPanel';
import SpellChecker from './components/SpellChecker';
import MobileStatsBar from './components/MobileStatsBar';
function App() {
    const { text, setText, platform, setPlatform, stats } = useTextStats('');
    const spellCheckerRef = useRef(null);
    const handleMobileSpellCheck = () => {
        // 모바일에서 맞춤법 검사 버튼 클릭 시, 해당 섹션으로 부드럽게 스크롤
        spellCheckerRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    return (_jsxs(MiniAppLayout, { title: "\uAE00\uC790\uC218/\uB9DE\uCDA4\uBC95", children: [_jsx("div", { className: "min-h-[calc(100vh-56px)] bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 py-4 sm:py-6 lg:py-8 pb-24 lg:pb-8 w-full", children: _jsxs("div", { className: "max-w-7xl mx-auto px-3 sm:px-4 lg:px-6", children: [_jsx("div", { className: "mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4", children: _jsxs("div", { children: [_jsxs("h1", { className: "text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2", children: [_jsx("i", { className: "fas fa-spell-check text-green-600" }), "\uAE00\uC790\uC218 \uC138\uAE30 & \uB9DE\uCDA4\uBC95 \uAC80\uC0AC"] }), _jsxs("p", { className: "text-gray-600 mt-2 flex items-center gap-2 text-sm sm:text-base", children: [_jsx("i", { className: "fas fa-lock text-green-500" }), "\uC785\uB825\uD558\uC2E0 \uB0B4\uC6A9\uC740 \uBE0C\uB77C\uC6B0\uC800\uC5D0\uB9CC \uC800\uC7A5\uB418\uBA70 \uC678\uBD80\uB85C \uC804\uC1A1\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."] })] }) }), _jsxs("div", { className: "flex flex-col lg:flex-row gap-6", children: [_jsx(TextEditor, { text: text, onTextChange: setText }), _jsxs("div", { className: "lg:w-[380px] space-y-6", children: [_jsx("div", { className: "hidden sm:block", children: _jsx(StatsPanel, { stats: stats, platform: platform, setPlatform: setPlatform }) }), _jsx("div", { ref: spellCheckerRef, children: _jsx(SpellChecker, { text: text, onApplyCorrections: setText }) })] })] })] }) }), _jsx(MobileStatsBar, { stats: stats, onCheckSpelling: handleMobileSpellCheck })] }));
}
export default App;
