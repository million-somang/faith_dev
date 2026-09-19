import { useState, useEffect } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import CustomsCalc from './components/CustomsCalc';
import CustomsGuide from './components/CustomsGuide';
import FaqSection from './components/FaqSection';
import { sound } from './utils/sound';

type ActiveTab = 'calc' | 'guide' | 'faq';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calc');
  const [loadingProgress, setLoadingProgress] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>('');

  // ⏳ 4초(4,000ms) 동안 1%에서 100%까지 채워지는 실시간 프로그레스 훅
  useEffect(() => {
    const duration = 4000;
    const intervalTime = 40;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setLoadingProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsLoading(false), 200);
          return 100;
        }
        return Math.floor(next);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  const handleShare = () => {
    sound.playClick();
    if (navigator.share) {
      navigator.share({
        title: '2026 해외직구 관·부가세 계산기 | VeraNex',
        text: '미국 $200, 일반국가 $150 목록통관 면세 판별 및 품목별 실시간 세액 계산기',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('🔗 계산기 주소가 클립보드에 복사되었습니다.');
      });
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    sound.playClick();
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // [화면 1] 4초 프리미엄 스플래시 & 1~100% 프로그레스 로딩 화면
  if (isLoading) {
    return (
      <MiniAppLayout title="">
        <div className="min-h-screen w-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6 sm:p-8 select-none animate-fade-in">
          {/* 1. 상단 브랜딩 & 기준 배지 */}
          <div className="w-full max-w-sm flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-extrabold text-slate-500 tracking-wide uppercase">VERANEX</span>
            </div>
            <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full shadow-2xs">
              2026 관세청 기준 준수
            </span>
          </div>

          {/* 2. 중앙 메인 비주얼 & 1~100% 실시간 프로그레스 */}
          <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-6 text-center">
            <div className="relative mb-6">
              <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-indigo-500/20 animate-float border-2 border-white">
                <i className="fas fa-plane-arrival"></i>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-white text-indigo-600 rounded-full p-1.5 shadow-md border border-slate-100 text-xs">
                <i className="fas fa-calculator text-indigo-600"></i>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              해외직구 관·부가세 계산기
            </h1>
            <p className="text-sm font-bold text-slate-700 mb-1">
              미국($200) · 일반($150) 목록통관 기준 정밀 산출
            </p>
            <p className="text-xs text-slate-400 mb-6 max-w-xs leading-relaxed">
              2026년 최신 관세법 및 실시간 외환 환율 데이터를 동기화하고 있습니다
            </p>

            {/* 1~100% 실시간 프로그레스 바 & 숫자 퍼센트 게이지 */}
            <div className="w-full max-w-xs space-y-1.5 mb-3">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 px-1">
                <span>통관 규정 DB 및 환율 정보 연동</span>
                <span className="font-black text-indigo-600 text-xs tabular-nums">{loadingProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 border border-slate-200 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 rounded-full transition-all duration-75 ease-out shadow-xs"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-black text-indigo-600">
              <i className="fas fa-spinner fa-spin text-indigo-500 text-xs"></i>
              <span>보안 채널 연결 및 모듈 로딩 중... ({loadingProgress}%)</span>
            </div>
          </div>

          {/* 3. 하단 필수 광고 / 스폰서 배너 영역 (4초 로딩 중 의무 노출) */}
          <div className="w-full max-w-sm flex flex-col items-center gap-2.5 pb-2">
            <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <i className="fas fa-boxes-packing text-sm"></i>
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">AD</span>
                    <span className="text-xs font-bold text-slate-800 truncate">직구 배송대행 운임 할인 프로모션</span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate block mt-0.5">베라넥스 제휴 특송 쿠폰팩 받기</span>
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-black rounded-lg border border-indigo-200 transition-all cursor-pointer"
              >
                확인
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              본 유틸리티는 2026년 대한민국 관세법 및 관세청 통관 규정을 준수합니다.
            </p>
          </div>
        </div>
      </MiniAppLayout>
    );
  }

  // 로딩 완료 후 메인 앱 화면 (450px 모바일/팝업 최적화)
  return (
    <MiniAppLayout title="">
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-8">
        
        {/* 토스트 알림 메시지 */}
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg backdrop-blur-sm animate-fade-in flex items-center gap-2">
            <i className="fas fa-circle-check text-emerald-400"></i>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 상단 스티키 헤더 */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-xs">
                <i className="fas fa-plane-arrival text-xs"></i>
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900 leading-tight">해외직구 관·부가세 계산기</h1>
                <span className="text-[10px] text-slate-500">2026 관세청 공인 통관 규정 기준</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                FREE
              </span>
              <button
                type="button"
                onClick={handleShare}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs transition-all cursor-pointer"
                title="공유하기"
              >
                <i className="fas fa-share-alt"></i>
              </button>
            </div>
          </div>

          {/* 3단 알약 탭 (계산 도구, 통관 가이드, FAQ) */}
          <nav className="flex bg-slate-100/80 p-1 rounded-xl gap-1 text-xs font-black">
            <button
              type="button"
              onClick={() => handleTabChange('calc')}
              className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'calc'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fas fa-calculator text-[11px]"></i>
              <span>관·부가세 계산</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('guide')}
              className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fas fa-book-open text-[11px]"></i>
              <span>통관 가이드</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('faq')}
              className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'faq'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fas fa-question-circle text-[11px]"></i>
              <span>자주 묻는 질문</span>
            </button>
          </nav>
        </header>

        {/* 탭 본문 영역 (px-4 py-3) */}
        <main className="flex-1 p-4">
          {activeTab === 'calc' && <CustomsCalc showToast={showToast} />}
          {activeTab === 'guide' && <CustomsGuide />}
          {activeTab === 'faq' && <FaqSection />}
        </main>

        {/* 최하단 공식 저작권 푸터 */}
        <footer className="px-4 pt-2 text-center text-[10px] text-slate-400">
          <p>© 2026 VeraNex. All rights reserved.</p>
        </footer>

      </div>
    </MiniAppLayout>
  );
}
