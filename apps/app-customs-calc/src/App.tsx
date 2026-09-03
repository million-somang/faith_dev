import { useState, useEffect } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import CustomsCalc from './components/CustomsCalc';
import CustomsGuide from './components/CustomsGuide';
import FaqSection from './components/FaqSection';

type PageTab = 'calculator' | 'guide' | 'faq';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PageTab>('calculator');

  // ⏳ 3초 필수 로딩 스크린 타이머 (정확히 3000ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // 3초 로딩 스크린 화면
  if (isLoading) {
    return (
      <MiniAppLayout title="">
        <div className="loading-screen" role="status" aria-label="앱 로딩 중">
          {/* 상단 헤더 */}
          <div className="loading-header">
            <div className="loading-header-title">
              <i className="fas fa-plane-arrival"></i>
              <span>해외직구 관·부가세 계산기</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-xs">
              <i className="fas fa-calculator"></i>
            </div>
          </div>

          {/* 로딩 본체 */}
          <div className="loading-body">
            {/* 중앙 로고 아이콘 서클 */}
            <div className="loading-icon-wrapper">
              <div className="loading-icon-inner">
                <i className="fas fa-plane-arrival"></i>
              </div>
            </div>

            {/* 타이틀 및 서브타이틀 */}
            <h1 className="loading-title">해외직구 관·부가세 계산기</h1>
            <p className="loading-subtitle">
              미국($200) · 일반($150) 목록통관 기준 및 실시간 환율 기반 세액 계산
            </p>

            {/* 3개 점 바운스 스피너 */}
            <div className="loading-spinner" aria-hidden="true">
              <div className="spinner-dot"></div>
              <div className="spinner-dot"></div>
              <div className="spinner-dot"></div>
            </div>

            {/* 하단 안내 배너 */}
            <aside className="loading-ad-banner" aria-label="안내">
              <div className="ad-placeholder">
                <span className="ad-badge">VERA</span>
                <span className="ad-text">관세청 최신 통관 규정 및 실시간 환율 연동 중...</span>
              </div>
            </aside>
          </div>
        </div>
      </MiniAppLayout>
    );
  }

  // 3초 로딩 완료 후 메인 계산기 뷰
  return (
    <MiniAppLayout title="">
      <main className="min-h-screen nm-bg-main p-3 sm:p-6 flex flex-col items-center antialiased">
        <div className="w-full max-w-4xl space-y-5">
          
          {/* 최상단 페이지 탭 (Clean Neumorphism 알약 트랙) */}
          <nav className="flex w-full p-1.5 nm-inset rounded-2xl gap-1.5" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'calculator'}
              onClick={() => setActiveTab('calculator')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                activeTab === 'calculator'
                  ? 'nm-btn text-indigo-700 font-extrabold shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fas fa-calculator text-xs"></i>
              <span>관·부가세 계산</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'guide'}
              onClick={() => setActiveTab('guide')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                activeTab === 'guide'
                  ? 'nm-btn text-indigo-700 font-extrabold shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fas fa-book-open text-xs"></i>
              <span>통관 가이드</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'faq'}
              onClick={() => setActiveTab('faq')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                activeTab === 'faq'
                  ? 'nm-btn text-indigo-700 font-extrabold shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fas fa-question-circle text-xs"></i>
              <span>자주 묻는 질문</span>
            </button>
          </nav>

          {/* 탭 콘텐츠 */}
          {activeTab === 'calculator' && <CustomsCalc />}
          {activeTab === 'guide' && <CustomsGuide />}
          {activeTab === 'faq' && <FaqSection />}

        </div>
      </main>
    </MiniAppLayout>
  );
}
