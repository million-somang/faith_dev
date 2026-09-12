import { Routes, Route, Navigate } from 'react-router-dom';

import FinancePage from './pages/FinancePage';
import StocksPage from './pages/StocksPage';
import ExchangePage from './pages/ExchangePage';
import BankingPage from './pages/BankingPage';
import StockDetailPage from './pages/StockDetailPage';
import FinanceUtilPage from './pages/FinanceUtilPage';
import { MobileTabBar } from './components/MobileTabBar';

function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<FinancePage />} />
                <Route path="/stocks" element={<StocksPage />} />
                <Route path="/exchange" element={<ExchangePage />} />
                <Route path="/banking" element={<BankingPage />} />
                <Route path="/insurance" element={<Navigate to="/" replace />} />
                <Route path="/util" element={<FinanceUtilPage />} />
                <Route path="/finance/util" element={<FinanceUtilPage />} />
                <Route path="/finance-util" element={<FinanceUtilPage />} />
                <Route path="/stock/:ticker" element={<StockDetailPage />} />
            </Routes>
            <MobileTabBar />
        </>
    );
}

export default App;
