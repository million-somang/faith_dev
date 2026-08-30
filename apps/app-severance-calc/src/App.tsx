import React, { useState, useEffect } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import SeveranceCalc from './components/SeveranceCalc';
import UnemploymentCalc from './components/UnemploymentCalc';
import HowToGuide from './components/HowToGuide';
import FaqSection from './components/FaqSection';

type ActiveTab = 'severance' | 'unemployment' | 'howto' | 'faq';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('severance');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  if (isLoading) {
    return (
      <MiniAppLayout title="">
        <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg mb-4 animate-pulse-glow">
            <i className="fas fa-file-invoice-dollar"></i>
          </div>
          <h1 className="text-lg font-black text-slate-900 mb-1">퇴직금 & 실업급여 계산기</h1>
          <p className="text-xs text-slate-500 mb-6">2026 고용노동부 최신 기준 데이터 로딩 중...</p>
          
          <div className="flex items-center gap-1.5 mb-8">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>

          <div className="w-full max-w-xs bg-slate-100 border border-slate-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">SPONSORED</span>
            <div className="text-xs text-slate-600 font-medium">실시간 이직·재취업 컨설팅 매칭</div>
          </div>
        </div>
      </MiniAppLayout>
    );
  }

  return (
    <MiniAppLayout title="">
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-10">
        {/* 상단 앱 헤더 */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <i className="fas fa-file-invoice-dollar text-xs"></i>
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900 leading-tight">퇴직금 & 실업급여 계산기</h1>
                <span className="text-[10px] text-slate-500">2026 고용노동부 최신 법정 산식</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              FREE
            </span>
          </div>

          {/* 4단 탭 바 */}
          <nav className="flex bg-slate-100/80 p-1 rounded-xl gap-1 text-xs font-black">
            <button
              type="button"
              onClick={() => setActiveTab('severance')}
              className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'severance'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fas fa-briefcase text-[10px]"></i>
              <span>퇴직금</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('unemployment')}
              className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'unemployment'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fas fa-shield-alt text-[10px]"></i>
              <span>실업급여</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('howto')}
              className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'howto'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fas fa-book-open text-[10px]"></i>
              <span>산정법</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'faq'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fas fa-question text-[10px]"></i>
              <span>FAQ</span>
            </button>
          </nav>
        </header>

        {/* 탭 본문 영역 */}
        <main className="p-4 flex-1">
          {activeTab === 'severance' && <SeveranceCalc onShowToast={showToast} />}
          {activeTab === 'unemployment' && <UnemploymentCalc onShowToast={showToast} />}
          {activeTab === 'howto' && <HowToGuide />}
          {activeTab === 'faq' && <FaqSection />}

          {/* 광고 배너 슬롯 */}
          <aside className="mt-8 bg-slate-100 border border-slate-200 rounded-2xl p-3 text-center">
            <span className="text-[9px] font-bold text-slate-400 tracking-wider block mb-1">ADVERTISEMENT</span>
            <div className="h-14 flex items-center justify-center text-xs text-slate-500 font-medium">
              <i className="fas fa-chart-line text-blue-500 mr-1.5"></i>
              <span>2026 연봉 실수령액 및 IRP 절세 포트폴리오</span>
            </div>
          </aside>
        </main>

        {/* 푸터 */}
        <footer className="px-4 py-3 text-center border-t border-slate-200/60 text-[11px] text-slate-400">
          <p>© 2026 VERA Portal. 근로기준법 및 고용보험법 준수.</p>
        </footer>

        {/* 토스트 알림 팝업 */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 z-50 animate-fade-in border border-white/10">
            <i className="fas fa-check-circle text-emerald-400"></i>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </MiniAppLayout>
  );
}
