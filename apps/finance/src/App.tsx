import { Routes, Route } from 'react-router-dom';

import FinancePage from './pages/FinancePage';
import StocksPage from './pages/StocksPage';
import ExchangePage from './pages/ExchangePage';
import StockDetailPage from './pages/StockDetailPage';
import { MobileTabBar } from './components/MobileTabBar';

function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<FinancePage />} />
                <Route path="/stocks" element={<StocksPage />} />
                <Route path="/exchange" element={<ExchangePage />} />
                <Route path="/stock/:ticker" element={<StockDetailPage />} />
            </Routes>
            <MobileTabBar />
        </>
    );
}

export default App;
