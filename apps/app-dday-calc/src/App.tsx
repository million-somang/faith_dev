import React, { useState, useEffect } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import DdayCalc from './components/DdayCalc';
import HowToGuide from './components/HowToGuide';
import FaqSection from './components/FaqSection';

type ActiveTab = 'calc' | 'howto' | 'faq';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calc');
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

  const handleShareApp = () => {
    const shareData = {
      title: '감성 D-Day & 기념일 계산기',
      text: '수능, 시험, 커플 기념일까지 남은 날짜를 계산하고 공유해보세요!',
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('링크가 클립보드에 복사되었습니다! 🔗');
      });
    }
  };

  // ── [화면 1] 3초 프리미엄 클린 라이트 스플래시 & 로딩 화면 ──
  if (isLoading) {
    return (
      <MiniAppLayout title="">
        <div className="min-h-screen w-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6 sm:p-8 select-none animate-fade-in">
          {/* 1. 상단 브랜딩 & 기준 배지 */}
          <div className="w-full max-w-sm flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse"></span>
              <span className="text-xs font-extrabold text-slate-500 tracking-wide uppercase">FAITH PORTAL</span>
            </div>
            <span className="text-[11px] font-black text-pink-700 bg-pink-50 border border-pink-200/80 px-3 py-1 rounded-full shadow-2xs">
              2026 공인 기준 준수
            </span>
          </div>

          {/* 2. 중앙 메인 비주얼 & 타이틀 */}
          <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-6 text-center">
            <div className="relative mb-6">
              <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-pink-500/20 animate-float border-2 border-white">
                <i className="fas fa-calendar-heart"></i>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-white text-pink-600 rounded-full p-1.5 shadow-md border border-slate-100 text-xs">
                <i className="fas fa-check-circle text-emerald-500"></i>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              감성 D-Day & 기념일 매니저
            </h1>
            <p className="text-sm font-bold text-slate-700 mb-1">
              목표 카운트다운 및 소중한 기념일 정밀 산정
            </p>
            <p className="text-xs text-slate-400 mb-8 max-w-xs leading-relaxed">
              설레는 기다림과 지나간 소중한 시간들을 가장 아름답게 시각화합니다
            </p>

            {/* 프로그레스 바 */}
            <div className="w-full max-w-xs bg-slate-100 border border-slate-200 h-3 rounded-full overflow-hidden p-0.5 shadow-inner mb-3">
              <div className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 rounded-full animate-pulse-glow" style={{ width: '100%' }}></div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-black text-pink-600">
              <i className="fas fa-spinner fa-spin text-pink-500 text-xs"></i>
              <span>일정 데이터 동기화 및 캘린더 초기화 중...</span>
            </div>
          </div>

          {/* 3. 하단 스폰서 / 제휴 광고 영역 & 안내 푸터 */}
          <div className="w-full max-w-sm flex flex-col items-center gap-3 pb-2">
            <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-extrabold text-pink-600 uppercase tracking-wider block mb-0.5">SPONSORED</span>
                <span className="text-xs font-bold text-slate-800">설레는 30일 성경 통독 챌린지 신청 가이드</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 border border-pink-100">
                <i className="fas fa-book-bible text-xs"></i>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              기념일 데이터는 브라우저 격리 로컬 세션에 안전하게 보관됩니다.
            </p>
          </div>
        </div>
      </MiniAppLayout>
    );
  }

  // ── 메인 뷰포트 (450px × 850px 팝업에 최적화된 max-w-md 라이트 뷰) ──
  return (
    <MiniAppLayout title="">
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-10 select-none">
        {/* ── [화면 2] 상단 스티키 헤더 & 3단 알약 탭 바 ── */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                <i className="fas fa-calendar-heart text-xs"></i>
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900 leading-tight">감성 D-Day 매니저</h1>
                <span className="text-[10px] text-slate-500">2026 표준 양력·기념일 기준</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                FREE
              </span>
              <button
                type="button"
                onClick={handleShareApp}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs transition-all cursor-pointer"
                title="공유하기"
              >
                <i className="fas fa-share-alt"></i>
              </button>
            </div>
          </div>

          {/* 3단 알약 탭 */}
          <nav className="flex bg-slate-100/80 p-1 rounded-xl gap-1 text-xs font-black">
            <button
              type="button"
              onClick={() => setActiveTab('calc')}
              className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'calc'
                  ? 'bg-white text-pink-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fas fa-heart text-[10px]"></i>
              <span>D-Day 관리</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('howto')}
              className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'howto'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fas fa-book-open text-[10px]"></i>
              <span>사용방법</span>
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
              <i className="fas fa-question-circle text-[10px]"></i>
              <span>FAQ</span>
            </button>
          </nav>
        </header>

        {/* ── 탭 본문 영역 ── */}
        <main className="p-4 flex-1">
          {activeTab === 'calc' && <DdayCalc onShowToast={showToast} />}
          {activeTab === 'howto' && <HowToGuide />}
          {activeTab === 'faq' && <FaqSection />}

          {/* 하단 광고 배너 슬롯 */}
          <aside className="mt-6 bg-white border border-slate-200/90 rounded-2xl p-3 text-center shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 tracking-wider block mb-1">SPONSORED</span>
            <div className="h-12 flex items-center justify-center text-xs text-slate-600 font-medium">
              <i className="fas fa-gift text-pink-500 mr-1.5"></i>
              <span>특별한 기념일을 위한 선물 & 꽃 배달 큐레이션</span>
            </div>
          </aside>
        </main>

        {/* 푸터 */}
        <footer className="px-4 py-3 text-center border-t border-slate-200/60 text-[11px] text-slate-400">
          <p>© 2026 FaithLink Portal. 표준 시간·기념일 규정 준수.</p>
        </footer>

        {/* 토스트 알림 팝업 */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 z-50 animate-fade-in border border-white/10">
            <i className="fas fa-check-circle text-pink-400"></i>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </MiniAppLayout>
  );
}
