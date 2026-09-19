import { useState, useEffect } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import { useSvgConverter } from './hooks/useSvgConverter';
import DropZone from './components/DropZone';
import CompareView from './components/CompareView';
import ControlPanel from './components/ControlPanel';
import SvgGuide from './components/SvgGuide';
import FaqSection from './components/FaqSection';
import { sound } from './utils/sound';

type ActiveTab = 'converter' | 'guide' | 'faq';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('converter');
  const [loadingProgress, setLoadingProgress] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>('');

  const {
    originalUrl,
    svgResult,
    isConverting,
    conversionProgress,
    conversionStepText,
    activePreset,
    colorCount,
    smoothness,
    setColorCount,
    setSmoothness,
    handleFile,
    convertWithPreset,
    convertWithCustom,
    copySvg,
    downloadSvg,
    loadSampleImage,
    resetConverter,
  } = useSvgConverter();

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
        title: 'Vector Studio - 이미지 to SVG 벡터 변환기 | VeraNex',
        text: 'PNG, JPG 이미지를 깨지지 않는 선명한 SVG 벡터 파일과 코드로 즉시 변환하세요.',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('🔗 변환기 주소가 클립보드에 복사되었습니다.');
      });
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    sound.playClick();
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBase64Link = () => {
    if (!svgResult) return;
    sound.playClick();
    const encoded = encodeURIComponent(svgResult.substring(0, 2000));
    window.open(`/app/base64-converter/?data=${encoded}`, '_blank');
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
              2026 공인 벡터 그래픽 엔진
            </span>
          </div>

          {/* 2. 중앙 메인 비주얼 & 1~100% 실시간 프로그레스 */}
          <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-6 text-center">
            <div className="relative mb-6">
              <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-indigo-500/20 animate-float border-2 border-white">
                <i className="fas fa-bezier-curve"></i>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-white text-indigo-600 rounded-full p-1.5 shadow-md border border-slate-100 text-xs">
                <i className="fas fa-vector-square text-indigo-600"></i>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              Vector Studio (SVG 변환기)
            </h1>
            <p className="text-sm font-bold text-slate-700 mb-1">
              래스터 비트맵 ➔ 무한 해상도 벡터 변환
            </p>
            <p className="text-xs text-slate-400 mb-6 max-w-xs leading-relaxed">
              100% 클라이언트 안전 처리 · 정밀 베지에 곡선 트레이싱 모듈을 준비 중입니다
            </p>

            {/* 1~100% 실시간 프로그레스 바 & 숫자 퍼센트 게이지 */}
            <div className="w-full max-w-xs space-y-1.5 mb-3">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 px-1">
                <span>벡터 렌더링 코어 및 폰트 엔진 로드</span>
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
              <span>가속 그래픽 채널 연결 중... ({loadingProgress}%)</span>
            </div>
          </div>

          {/* 3. 하단 필수 광고 / 스폰서 배너 영역 (4초 로딩 중 의무 노출) */}
          <div className="w-full max-w-sm flex flex-col items-center gap-2.5 pb-2">
            <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <i className="fas fa-palette text-sm"></i>
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">AD</span>
                    <span className="text-xs font-bold text-slate-800 truncate">웹 디자이너용 프리미엄 에셋 팩</span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate block mt-0.5">베라넥스 제휴 SVG 아이콘 라이브러리</span>
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
              본 유틸리티는 100% 클라이언트 브라우저에서 안전하게 실행됩니다.
            </p>
          </div>
        </div>
      </MiniAppLayout>
    );
  }

  // 메인 뷰포트 (450px 팝업 풀-스크린)
  return (
    <MiniAppLayout title="">
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-8">
        
        {/* 토스트 알림 */}
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
                <i className="fas fa-bezier-curve text-xs"></i>
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900 leading-tight">Vector Studio (SVG 변환기)</h1>
                <span className="text-[10px] text-slate-500">2026 고정밀 클라이언트 벡터 엔진</span>
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

          {/* 3단 알약 탭 (SVG 변환, 사용방법, FAQ) */}
          <nav className="flex bg-slate-100/80 p-1 rounded-xl gap-1 text-xs font-black">
            <button
              type="button"
              onClick={() => handleTabChange('converter')}
              className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'converter'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fas fa-vector-square text-[11px]"></i>
              <span>SVG 변환</span>
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
              <span>사용방법</span>
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

        {/* 메인 탭 콘텐츠 영역 */}
        <main className="flex-1 p-4">
          {activeTab === 'converter' && (
            <div className="min-h-[calc(850px-140px)] flex flex-col justify-between space-y-4 animate-fade-in">
              <div className="space-y-3.5">
                
                {/* 1. 상단 안내 배너 */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <i className="fas fa-lightbulb text-xs"></i>
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <p className="font-extrabold text-indigo-950 mb-0.5">무한 해상도 벡터 SVG 변환</p>
                    <p className="text-slate-600">
                      로고, 아이콘, 그래픽 이미지를 100% 브라우저에서 안전하게 깨지지 않는 벡터로 변환합니다.
                    </p>
                  </div>
                </div>

                {/* 2. 드롭존 또는 변환 컨트롤 */}
                {!originalUrl ? (
                  <DropZone onFile={handleFile} onLoadSample={loadSampleImage} />
                ) : (
                  <div className="space-y-3">
                    {/* 상단 파일 재선택 컴팩트 바 */}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={resetConverter}
                        className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <i className="fas fa-trash-can"></i>
                        <span>초기화하고 다른 이미지 선택</span>
                      </button>
                    </div>

                    {/* Before & After 비교 뷰 */}
                    <CompareView
                      originalUrl={originalUrl}
                      svgResult={svgResult}
                      isConverting={isConverting}
                      conversionProgress={conversionProgress}
                      conversionStepText={conversionStepText}
                    />

                    {/* 프리셋 및 세부 컨트롤 패널 */}
                    <ControlPanel
                      activePreset={activePreset}
                      colorCount={colorCount}
                      smoothness={smoothness}
                      svgResult={svgResult}
                      hasImage={!!originalUrl}
                      onPresetSelect={convertWithPreset}
                      onColorCountChange={setColorCount}
                      onSmoothnessChange={setSmoothness}
                      onCustomConvert={convertWithCustom}
                      onCopy={copySvg}
                      onDownload={downloadSvg}
                      onBase64Link={handleBase64Link}
                      showToast={showToast}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'guide' && <SvgGuide />}
          {activeTab === 'faq' && <FaqSection />}
        </main>

        {/* 하단 공식 저작권 푸터 */}
        <footer className="px-4 pt-2 text-center text-[10px] text-slate-400">
          <p>© 2026 VeraNex. All rights reserved.</p>
        </footer>

      </div>
    </MiniAppLayout>
  );
}
