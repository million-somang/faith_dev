import { Routes, Route } from 'react-router-dom';

import FinancePage from './pages/FinancePage';
import StockDetailPage from './pages/StockDetailPage';
import { MobileTabBar } from './components/MobileTabBar';

function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<FinancePage />} />
                <Route path="/stock/:ticker" element={<StockDetailPage />} />
            </Routes>
            <MobileTabBar />
        </>
    );
}

export default App;
