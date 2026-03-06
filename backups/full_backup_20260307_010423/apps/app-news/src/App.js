import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from 'react-router-dom';
// Import Pages
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(NewsPage, {}) }), _jsx(Route, { path: "/:id", element: _jsx(NewsDetailPage, {}) })] }));
}
export default App;
