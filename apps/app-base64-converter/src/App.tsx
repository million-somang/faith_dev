import { useState, useEffect } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import { useBase64 } from './hooks/useBase64';
import TextMode from './components/TextMode';
import ImageMode from './components/ImageMode';
import Base64Guide from './components/Base64Guide';

type ActiveTab = 'text' | 'image' | 'guide';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('text');
  const [loadingProgress, setLoadingProgress] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>('');

  const {
    input,
    setInput,
    output,
    realtimeEnabled,
    setRealtimeEnabled,
    urlSafe,
    setUrlSafe,
    jwtInfo,
    encode,
    decode,
    showJwtPayload,
    copyOutput,
    clearAll,
    loadSampleText,
    imageData,
    imageFileName,
    handleImageFile,
    getImageCopyText,
    loadSampleImage,
    clearImage,
  } = useBase64();

  // ⏳ miniapp.md 규격: 4초(4,000ms) 동안 1%에서 100%까지 채워지는 실시간 프로그레스
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
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 클립보드 안전 복사 (Clipboard API + textarea fallback)
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_e) {
        // 계속해서 레거시 폴백 시도
      }
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) return true;
    } catch (_e) {
      // 실패
    }

    return false;
  };

  // 공유 버튼 핸들러 (모바일 Native Share ➔ Clipboard API ➔ Fallback)
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: 'Base64 Studio - 텍스트 & 이미지 Base64 변환기 | VeraNex',
      text: '한글 UTF-8 완벽 지원, URL-Safe 및 이미지 Data URI 원클릭 변환기',
      url: shareUrl,
    };

    // 모바일 브라우저의 경우 네이티브 공유 다이얼로그 우선 시도
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (isMobile && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return; // 단순 닫기 시 중단
      }
    }

    // 데스크탑 및 Web Share 미지원/실패 시 즉시 클립보드 복사
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      showToast('🔗 변환기 주소가 클립보드에 복사되었습니다.');
    } else {
      showToast('주소 복사에 실패했습니다.');
    }
  };

  // [화면 1] 4초 실시간 1~100% 스플래시 프로그레스 화면
  if (isLoading) {
    return (
      <MiniAppLayout title="">
        <div
          className="min-h-screen w-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6 sm:p-8 select-none animate-fadeIn"
          data-screenshot-target="splash"
        >
          {/* 1. 상단 브랜딩 & 엔진 배지 */}
          <div className="w-full max-w-sm flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></span>
              <span className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">VERANEX</span>
            </div>
            <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full shadow-2xs">
              RFC 4648 표준 인코딩 엔진
            </span>
          </div>

          {/* 2. 중앙 메인 비주얼 & 1~100% 실시간 프로그레스 */}
          <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-6 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-indigo-500/20 border-2 border-white animate-pulse">
                <i className="fas fa-arrow-right-arrow-left"></i>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-white text-indigo-600 rounded-full p-1.5 shadow-md border border-slate-100 text-xs">
                <i className="fas fa-shield-halved text-indigo-600"></i>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              Base64 Studio
            </h1>
            <p className="text-sm font-bold text-slate-700 mb-1">
              텍스트 · 이미지 · 바이너리 실시간 양방향 변환
            </p>
            <p className="text-xs text-slate-500 mb-6 max-w-xs leading-relaxed">
              UTF-8 한글 완전 보존 · URL-Safe 지원 · 100% 클라이언트 로컬 보안
            </p>

            {/* 1~100% 실시간 프로그레스 바 & 숫자 퍼센트 게이지 */}
            <div className="w-full max-w-xs space-y-1.5 mb-3">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 px-1">
                <span>바이트 스트림 인코더 엔진 초기화</span>
                <span className="font-black text-indigo-600 text-xs tabular-nums">{loadingProgress}%</span>
              </div>
              <div className="w-full bg-slate-200/80 border border-slate-300/80 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 rounded-full transition-all duration-75 ease-out shadow-xs"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-black text-indigo-600">
              <i className="fas fa-spinner fa-spin text-indigo-500 text-xs"></i>
              <span>코덱 메모리 할당 중... ({loadingProgress}%)</span>
            </div>
          </div>

          {/* 3. 하단 필수 광고 / 스폰서 배너 영역 (4초 로딩 중 의무 노출) */}
          <div className="w-full max-w-sm flex flex-col items-center gap-2.5 pb-2">
            <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <i className="fas fa-cloud-bolt text-sm"></i>
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                      SPONSORED
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate">VeraNex Cloud API & SDK</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">웹앱 및 미니앱 고성능 백엔드 통합 솔루션</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shrink-0">
                알아보기
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
              <span>개인정보 저장 제로</span>
              <span>•</span>
              <span>RFC 4648 표준 준수</span>
              <span>•</span>
              <span>VeraNex Studio</span>
            </div>
          </div>
        </div>
      </MiniAppLayout>
    );
  }

  // [화면 2] 메인 대시보드 화면
  return (
    <MiniAppLayout title="Base64 Studio">
      <div
        className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center select-none"
        data-screenshot-target="main-dashboard"
      >
        <div className="w-full max-w-[480px] min-h-screen bg-slate-50 flex flex-col border-x border-slate-200/70 shadow-xl">
          {/* 1. 스티키 헤더 */}
          <header className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center text-sm shadow-sm font-bold">
                <i className="fas fa-cube"></i>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">Base64 Studio</h1>
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200/70 px-1.5 py-0.2 rounded">
                    v2.5
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">VeraNex Tool Suite</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleShare}
                className="px-2.5 py-1.5 rounded-xl neu-flat hover:neu-pressed flex items-center gap-1.5 text-slate-700 hover:text-indigo-600 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                title="페이지 주소 공유 / 복사"
              >
                <i className="fas fa-share-nodes text-indigo-600 text-xs"></i>
                <span className="text-[11px]">공유</span>
              </button>
            </div>
          </header>

          {/* 2. 3단 알약형 탭 메뉴 */}
          <div className="px-4 pt-3 pb-1">
            <div className="neu-inset p-1 rounded-2xl flex items-center gap-1 border border-slate-200/60 bg-slate-100/80">
              <button
                type="button"
                onClick={() => handleTabChange('text')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'text'
                    ? 'neu-flat bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fas fa-font text-[11px]"></i>
                <span>텍스트 변환</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('image')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'image'
                    ? 'neu-flat bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fas fa-image text-[11px]"></i>
                <span>이미지 변환</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('guide')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'guide'
                    ? 'neu-flat bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fas fa-circle-question text-[11px]"></i>
                <span>가이드 & FAQ</span>
              </button>
            </div>
          </div>

          {/* 3. 모드별 컨텐츠 */}
          <main className="flex-1 px-4 py-3 flex flex-col overflow-y-auto">
            {activeTab === 'text' && (
              <TextMode
                input={input}
                onInputChange={setInput}
                output={output}
                realtimeEnabled={realtimeEnabled}
                onRealtimeChange={setRealtimeEnabled}
                urlSafe={urlSafe}
                onUrlSafeChange={setUrlSafe}
                onEncode={() => encode()}
                onDecode={decode}
                onCopy={copyOutput}
                onClear={clearAll}
                onLoadSample={loadSampleText}
                showToast={showToast}
                jwtChip={
                  jwtInfo ? (
                    <div
                      onClick={showJwtPayload}
                      className="cursor-pointer px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 flex items-center gap-2 text-violet-700 text-xs font-semibold shadow-2xs transition-all active:scale-98"
                    >
                      <i className="fas fa-key text-violet-600 text-xs"></i>
                      <span>JWT 토큰 감지! 페이로드 보기</span>
                    </div>
                  ) : null
                }
              />
            )}

            {activeTab === 'image' && (
              <ImageMode
                imageData={imageData}
                imageFileName={imageFileName}
                onImageFile={handleImageFile}
                getImageCopyText={getImageCopyText}
                onLoadSample={loadSampleImage}
                onClear={clearImage}
              />
            )}

            {activeTab === 'guide' && <Base64Guide />}
          </main>

          {/* 4. 하단 보안 배지 & 푸터 */}
          <footer className="mt-auto px-4 py-2.5 border-t border-slate-200/70 bg-white/60 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-600">
              <i className="fas fa-shield-check text-xs"></i>
              <span>100% 클라이언트 로컬 변환 (서버 전송 없음)</span>
            </div>
            <span className="text-[10px] text-slate-400">VeraNex Platform</span>
          </footer>
        </div>

        {/* 플로팅 토스트 메시지 (상단 중앙 고정) */}
        {toastMessage && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2 border border-slate-700/80 animate-fadeIn">
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </MiniAppLayout>
  );
}
