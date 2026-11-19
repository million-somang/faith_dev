import { useCallback, useEffect, useRef, useState } from 'react';
import type { LegalModalType, PageTab } from './types/calculator';
import { useCalculator } from './hooks/useCalculator';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import CalculatorDisplay from './components/CalculatorDisplay';
import BasicCalc from './components/BasicCalc';
import ScientificCalc from './components/ScientificCalc';
import HistoryPanel from './components/HistoryPanel';
import HowToGuide from './components/HowToGuide';
import FaqSection from './components/FaqSection';
import LegalModal from './components/LegalModal';

async function copyTextSafely(text: string): Promise<boolean> {
  if (!text) return false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // iframe 권한 제한 시 폴백 시도
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.className = 'fixed -left-[9999px] -top-[9999px] opacity-0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function CalculatorWorkspace() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<PageTab>('calc');
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);
  const [toast, setToast] = useState<string>('');
  const toastTimerRef = useRef<number | null>(null);

  const calc = useCalculator(!showSplash && activeTab === 'calc');

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast('');
      toastTimerRef.current = null;
    }, 2200);
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleTabChange = useCallback((tab: PageTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCopyValue = useCallback(
    async (value: string) => {
      const ok = await copyTextSafely(value);
      showToast(ok ? `📋 '${value}' 복사 완료` : '복사에 실패했습니다.');
    },
    [showToast]
  );

  const handleShare = useCallback(async () => {
    const isInIframe = window.self !== window.top;
    let shareUrl: string;
    try {
      const origin = isInIframe
        ? document.referrer
          ? new URL(document.referrer).origin
          : window.location.origin
        : window.location.origin;
      shareUrl = `${origin}/app/calculator/`;
    } catch {
      shareUrl = window.location.href;
    }

    if (!isInIframe && navigator.share) {
      try {
        await navigator.share({
          title: '스마트 계산기 (일반 · 공학) | VeraNex',
          text: '일반 사칙연산부터 공학용 삼각함수·로그·거듭제곱까지 무료 웹 계산기',
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    const ok = await copyTextSafely(shareUrl);
    showToast(ok ? '🔗 계산기 링크가 복사되었습니다!' : '링크 복사에 실패했습니다.');
  }, [showToast]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D2A26] flex flex-col">
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#2D2A26] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in whitespace-nowrap"
        >
          <span>{toast}</span>
        </div>
      )}

      <div className="w-full max-w-[450px] md:max-w-3xl lg:max-w-5xl mx-auto px-3 sm:px-5 py-2 sm:py-5 flex-1 flex flex-col min-h-0">
        <Header
          activeTab={activeTab}
          onChangeTab={handleTabChange}
          onShare={handleShare}
        />

        <main className="flex-1 flex flex-col min-h-0">
          {activeTab === 'calc' && (
            <div className="flex-1 flex flex-col md:grid md:grid-cols-12 md:gap-5 gap-2 min-h-0 animate-fade-in">
              {/* 좌측: 모드 전환 스위치 + LCD 디스플레이 + 키패드 */}
              <section
                aria-label="계산기 본체"
                className="md:col-span-7 flex flex-col gap-2 min-h-0"
              >
                {/* 일반 / 공학 2모드 세그먼트 토글 */}
                <div
                  className="bg-[#EFECE6] p-1 rounded-2xl border border-[#DFD9CE] grid grid-cols-2 gap-1 shrink-0"
                  role="tablist"
                  aria-label="계산기 모드 선택"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={calc.mode === 'basic'}
                    onClick={() => calc.setMode('basic')}
                    className={`h-8 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      calc.mode === 'basic'
                        ? 'bg-white text-indigo-700 shadow-2xs border border-[#DFD9CE]'
                        : 'text-stone-500 hover:text-[#2D2A26]'
                    }`}
                  >
                    <i className="fas fa-calculator text-[11px]" aria-hidden="true"></i>
                    <span>일반 계산기</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={calc.mode === 'scientific'}
                    data-screenshot-click="action"
                    onClick={() => calc.setMode('scientific')}
                    className={`h-8 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      calc.mode === 'scientific'
                        ? 'bg-white text-indigo-700 shadow-2xs border border-[#DFD9CE]'
                        : 'text-stone-500 hover:text-[#2D2A26]'
                    }`}
                  >
                    <i className="fas fa-square-root-variable text-[11px]" aria-hidden="true"></i>
                    <span>공학 계산기</span>
                  </button>
                </div>

                {/* 본체 카드 (웜 베이지 클린 뉴모피즘) */}
                <div className="bg-white rounded-3xl border border-[#EBE6DD] p-2.5 sm:p-4 nm-warm-card space-y-2.5 shrink-0">
                  <CalculatorDisplay
                    mode={calc.mode}
                    angleUnit={calc.angleUnit}
                    hasMemory={calc.hasMemory}
                    formattedMemory={calc.formattedMemory}
                    lastFormula={calc.lastFormula}
                    formattedDisplay={calc.formattedDisplay}
                    previewResult={calc.previewResult}
                    errorMessage={calc.errorMessage}
                    onCopyResult={() => handleCopyValue(calc.copyableResult)}
                  />

                  {calc.mode === 'basic' ? (
                    <BasicCalc
                      hasMemory={calc.hasMemory}
                      hasLastAnswer={Boolean(calc.lastAnswer)}
                      onDigit={calc.appendDigit}
                      onOperator={calc.appendOperator}
                      onUnaryNegate={() => calc.applyUnary('negate')}
                      onBackspace={calc.backspace}
                      onClearAll={calc.clearAll}
                      onCalculate={calc.calculate}
                      onUseLastAnswer={calc.useLastAnswer}
                      onMemoryClear={calc.memoryClear}
                      onMemoryRecall={calc.memoryRecall}
                      onMemoryAdd={calc.memoryAdd}
                      onMemorySubtract={calc.memorySubtract}
                    />
                  ) : (
                    <ScientificCalc
                      angleUnit={calc.angleUnit}
                      isSecondFunc={calc.isSecondFunc}
                      hasMemory={calc.hasMemory}
                      hasLastAnswer={Boolean(calc.lastAnswer)}
                      onToggleAngleUnit={() =>
                        calc.setAngleUnit((prev) => (prev === 'DEG' ? 'RAD' : 'DEG'))
                      }
                      onToggleSecondFunc={() => calc.setIsSecondFunc((prev) => !prev)}
                      onDigit={calc.appendDigit}
                      onOperator={calc.appendOperator}
                      onConstant={calc.appendConstant}
                      onParen={calc.appendParen}
                      onFunction={calc.appendFunction}
                      onUnary={calc.applyUnary}
                      onBackspace={calc.backspace}
                      onClearAll={calc.clearAll}
                      onCalculate={calc.calculate}
                      onUseLastAnswer={calc.useLastAnswer}
                      onMemoryClear={calc.memoryClear}
                      onMemoryRecall={calc.memoryRecall}
                      onMemoryAdd={calc.memoryAdd}
                    />
                  )}
                </div>

                {/* 모바일 전용 고정 높이 최근 기록 스트립 */}
                <HistoryPanel
                  variant="mobile"
                  history={calc.history}
                  onLoadItem={calc.loadHistoryItem}
                  onCopyValue={handleCopyValue}
                  onDeleteItem={calc.deleteHistoryItem}
                  onClearHistory={calc.clearHistory}
                />
              </section>

              {/* 태블릿 · PC 우측 계산 히스토리 & 단축키 보드 */}
              <div className="md:col-span-5 min-h-0">
                <HistoryPanel
                  variant="desktop"
                  history={calc.history}
                  onLoadItem={calc.loadHistoryItem}
                  onCopyValue={handleCopyValue}
                  onDeleteItem={calc.deleteHistoryItem}
                  onClearHistory={calc.clearHistory}
                />
              </div>
            </div>
          )}

          {activeTab === 'howto' && <HowToGuide />}
          {activeTab === 'faq' && <FaqSection />}
        </main>

        {/* 하단 도킹 E-E-A-T 푸터 */}
        <footer className="mt-2 sm:mt-4 pt-2 border-t border-[#E6E0D5] flex flex-wrap items-center justify-between gap-2 text-[10px] text-stone-400 shrink-0">
          <span>© 2026 VeraNex. All rights reserved. · 100% 브라우저 로컬 정밀 연산</span>
          <div className="flex items-center gap-2 font-bold text-stone-500">
            <button
              type="button"
              onClick={() => setLegalModal('about')}
              className="hover:text-indigo-600 cursor-pointer"
            >
              소개
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setLegalModal('privacy')}
              className="hover:text-indigo-600 cursor-pointer"
            >
              개인정보처리방침
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setLegalModal('terms')}
              className="hover:text-indigo-600 cursor-pointer"
            >
              이용약관
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setLegalModal('contact')}
              className="hover:text-indigo-600 cursor-pointer"
            >
              문의
            </button>
          </div>
        </footer>
      </div>

      <LegalModal modalType={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <CalculatorWorkspace />
    </ErrorBoundary>
  );
}

export default App;
