import { Routes, Route } from 'react-router-dom';

import FinancePage from './pages/FinancePage';
import StocksPage from './pages/StocksPage';
import ExchangePage from './pages/ExchangePage';
import BankingPage from './pages/BankingPage';
import InsurancePage from './pages/InsurancePage';
import StockDetailPage from './pages/StockDetailPage';
import { MobileTabBar } from './components/MobileTabBar';

function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<FinancePage />} />
                <Route path="/stocks" element={<StocksPage />} />
                <Route path="/exchange" element={<ExchangePage />} />
                <Route path="/banking" element={<BankingPage />} />
                <Route path="/insurance" element={<InsurancePage />} />
                <Route path="/stock/:ticker" element={<StockDetailPage />} />
            </Routes>
            <MobileTabBar />
        </>
    );
}

export default App;
