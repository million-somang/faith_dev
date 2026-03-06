import { Routes, Route } from 'react-router-dom';

// Import Pages
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';

function App() {
    return (
        <Routes>
            <Route path="/" element={<NewsPage />} />
            <Route path="/:id" element={<NewsDetailPage />} />
        </Routes>
    );
}

export default App;
