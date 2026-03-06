import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const MiniAppLayout = ({ title, children, headerRight }) => {
    const handleClose = () => {
        if (!window.opener || window.opener === window) {
            // Direct URL entry, redirect to portal
            window.location.href = '/';
            return;
        }
        window.close();
    };
    return (_jsxs("div", { className: "w-full h-[100dvh] max-w-5xl mx-auto bg-gray-50 flex flex-col relative overflow-hidden pb-[env(safe-area-bottom)]", children: [_jsxs("header", { className: "h-14 flex items-center justify-between px-4 bg-white border-b border-gray-100 flex-shrink-0 z-10 sticky top-0", children: [_jsx("div", { className: "flex-1" }), _jsx("h1", { className: "text-lg font-bold text-gray-800 flex-1 text-center truncate", children: title }), _jsxs("div", { className: "flex-1 flex justify-end items-center gap-2", children: [headerRight, _jsx("button", { onClick: handleClose, className: "p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors", "aria-label": "\uB2EB\uAE30", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "w-5 h-5 text-gray-600", children: [_jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), _jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })] }) })] })] }), _jsx("main", { className: "flex-1 w-full mini-app-content relative bg-gray-50 overflow-y-auto", children: children })] }));
};
