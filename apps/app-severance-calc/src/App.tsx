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
        <div className="min-h-screen w-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6 sm:p-8 select-none animate-fade-in">
          {/* 1. 상단 브랜딩 & 기준 배지 영역 */}
          <div className="w-full max-w-sm flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-extrabold text-slate-500 tracking-wide uppercase">FAITH PORTAL</span>
            </div>
            <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full shadow-2xs">
              2026 고용노동부 기준
            </span>
          </div>

          {/* 2. 중앙 메인 비주얼 & 타이틀 & 로딩 프로그레스 영역 */}
          <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-6 text-center">
            {/* 대형 입체 아이콘 */}
            <div className="relative mb-6">
              <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-indigo-500/20 animate-float border-2 border-white">
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-white text-emerald-600 rounded-full p-1.5 shadow-md border border-slate-100 text-xs">
                <i className="fas fa-check-circle"></i>
              </div>
            </div>

            {/* 선명한 고대비 타이틀 및 설명 */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              퇴직금 & 실업급여 계산기
            </h1>
            <p className="text-sm font-bold text-slate-700 mb-1">
              법정 산식 및 세후 실수령액 정밀 산정
            </p>
            <p className="text-xs text-slate-400 mb-8 max-w-xs leading-relaxed">
              2026년 최신 고용보험 및 퇴직소득세 개정 데이터를 실시간으로 동기화하고 있습니다
            </p>

            {/* 부드러운 프로그레스 바 */}
            <div className="w-full max-w-xs bg-slate-100 border border-slate-200 h-3 rounded-full overflow-hidden p-0.5 shadow-inner mb-3">
              <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 rounded-full animate-pulse-glow" style={{ width: '100%' }}></div>
            </div>

            {/* 로딩 상태 텍스트 & 도트 */}
            <div className="flex items-center justify-center gap-2 text-xs font-black text-indigo-600">
              <i className="fas fa-spinner fa-spin text-indigo-500 text-xs"></i>
              <span>데이터 로딩 및 산식 연동 중...</span>
            </div>
          </div>

          {/* 3. 하단 스폰서 & 안내 푸터 영역 */}
          <div className="w-full max-w-sm flex flex-col items-center gap-3 pb-2">
            <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block mb-0.5">SPONSORED</span>
                <span className="text-xs font-bold text-slate-800">실시간 이직 · 재취업 맞춤 컨설팅 매칭</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <i className="fas fa-briefcase text-xs"></i>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              본 도구는 2026년 고용노동부 및 국세청 공식 세법 개정안을 준수합니다.
            </p>
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
