import { Routes, Route } from 'react-router-dom';

import FinancePage from './pages/FinancePage';
import StockDetailPage from './pages/StockDetailPage';

function App() {
    return (
        <Routes>
            <Route path="/" element={<FinancePage />} />
            <Route path="/stock/:ticker" element={<StockDetailPage />} />
        </Routes>
    );
}

export default App;
