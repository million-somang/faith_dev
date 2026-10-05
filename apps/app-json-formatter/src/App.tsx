import React, { useState, useEffect, useCallback, useRef } from 'react';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import { useJsonEditor } from './hooks/useJsonEditor';
import { JsonFormatterTab } from './components/JsonFormatterTab';
import { JsonTreeTab } from './components/JsonTreeTab';
import { JsonConvertTab } from './components/JsonConvertTab';
import { JsonFaqTab } from './components/JsonFaqTab';
import { PolicyModal, PolicyTab } from './components/PolicyModal';

type ActiveTab = 'formatter' | 'tree' | 'convert' | 'faq';

export default function App() {
  // 1. 4-second Splash Progress Counter
  const [loadingProgress, setLoadingProgress] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Active Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('formatter');

  // 3. E-E-A-T Policy Modal State
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyInitialTab, setPolicyInitialTab] = useState<PolicyTab>('about');

  // 4. Editor Hook
  const {
    jsonText,
    setJsonText,
    parsedJson,
    statusType,
    statusMessage,
    stats,
    currentIndent,
    setCurrentIndent,
    formatJson,
    minifyJson,
    autoFixJson,
    loadPreset,
    convertToYaml,
    convertToXml,
    convertToCsv,
    convertToTypeScript,
    downloadJson,
    validateAndParse,
  } = useJsonEditor();

  const editorValueRef = useRef(jsonText);
  useEffect(() => {
    editorValueRef.current = jsonText;
  }, [jsonText]);

  // Initial validation
  useEffect(() => {
    validateAndParse(jsonText);
  }, []);

  // 4000ms Splash Timer
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

  const handleFormat = useCallback(() => {
    const res = formatJson();
    if (res) setJsonText(res);
  }, [formatJson, setJsonText]);

  const handleMinify = useCallback(() => {
    const res = minifyJson();
    if (res) setJsonText(res);
  }, [minifyJson, setJsonText]);

  const handleAutoFix = useCallback(() => {
    const res = autoFixJson(editorValueRef.current);
    if (res) setJsonText(res);
  }, [autoFixJson, setJsonText]);

  const openPolicy = (tab: PolicyTab) => {
    setPolicyInitialTab(tab);
    setPolicyModalOpen(true);
  };

  return (
    <div className="h-screen w-full bg-[#F5F2EB] flex justify-center items-center font-sans select-none overflow-hidden">
      <div 
        className="w-full max-w-[450px] h-full max-h-[850px] bg-[#FAF8F5] text-[#2D2A26] flex flex-col justify-between overflow-hidden shadow-2xl relative"
        data-screenshot-app="json-formatter"
      >
        {/* ========================================================= */}
        {/* [화면 1] 4초 불투명 스플래시 & 1~100% 프로그레스 + 하단 광고 */}
        {/* ========================================================= */}
        {isLoading && (
          <div 
            className="absolute inset-0 h-[850px] max-h-[850px] w-full flex flex-col justify-between items-center bg-[#FAF8F5] p-6 sm:p-7 select-none animate-fade-in overflow-hidden z-50"
            data-screenshot-splash="true"
          >
            {/* 1. 상단 브랜딩 & 기준 배지 */}
            <div className="w-full max-w-sm flex items-center justify-between pt-1 shrink-0">
              <a
                href="https://veranex.app"
                target="_top"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                title="VeraNex 포털 홈"
              >
                <img
                  src="https://veranex.app/logo-192.png"
                  alt="VERA Logo"
                  className="w-6 h-6 rounded-md object-contain"
                />
                <span className="text-xs font-black text-[#2D2A26] tracking-wider uppercase">
                  VERANEX
                </span>
              </a>
              <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                RFC 8259 표준 준수
              </span>
            </div>

            {/* 2. 중앙 메인 비주얼 & 1~100% 실시간 프로그레스 */}
            <div className="w-full max-w-sm flex flex-col items-center justify-center my-auto py-4 text-center shrink-0">
              <div className="relative mb-5">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 text-white flex items-center justify-center text-3xl shadow-xl shadow-amber-500/20 border-2 border-white">
                  <i className="fa-solid fa-code"></i>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white text-emerald-600 rounded-full p-1 shadow-md border border-[#EBE6DD] text-xs">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-[#2D2A26] tracking-tight mb-1.5">
                Pro JSON Studio
              </h1>
              <p className="text-xs font-bold text-amber-800 mb-1">
                초경량 고속 JSON 검증 • 정렬 • 자동 복구 & 변환기
              </p>
              <p className="text-[11px] text-[#7A7369] mb-5 max-w-xs leading-relaxed">
                100% 브라우저 메모리 로컬 파싱으로 민감한 데이터도 외부 유출 없이 안전하게 처리합니다
              </p>

              {/* 1~100% 실시간 프로그레스 바 & 숫자 퍼센트 게이지 */}
              <div className="w-full max-w-xs space-y-1.5 mb-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-[#7A7369] px-1">
                  <span>로컬 고속 파서 및 AST 엔진 초기화</span>
                  <span className="font-black text-amber-700 text-xs tabular-nums">
                    {loadingProgress}%
                  </span>
                </div>
                <div className="w-full bg-[#EBE6DD] h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-orange-500 rounded-full transition-all duration-75 ease-out shadow-xs"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-black text-amber-800">
                <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                <span>보안 격리 환경 구성 및 모듈 로딩 중... ({loadingProgress}%)</span>
              </div>
            </div>

            {/* 3. 하단 필수 광고 / 스폰서 배너 영역 (850px 뷰포트 내 상시 온전 노출) */}
            <div className="w-full max-w-sm flex flex-col items-center gap-2 pb-1 shrink-0">
              <div className="w-full bg-white border border-[#EBE6DD] rounded-2xl p-3 shadow-xs flex items-center justify-between hover:border-amber-300 transition-colors">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs text-sm">
                    <i className="fa-solid fa-bullhorn text-xs"></i>
                  </div>
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        AD
                      </span>
                      <span className="text-xs font-bold text-[#2D2A26] truncate">
                        2026 고성능 풀스택 개발자 허브
                      </span>
                    </div>
                    <span className="text-[10px] text-[#7A7369] truncate block mt-0.5">
                      VeraNex 클라우드 API 및 생산성 도구 모음
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => window.open('https://veranex.app', '_blank')}
                  className="shrink-0 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-black rounded-lg border border-amber-200 transition-all cursor-pointer"
                >
                  확인
                </button>
              </div>
              <p className="text-[9px] text-[#A39C90] text-center leading-relaxed">
                본 스튜디오는 RFC 8259 국제 JSON 웹 표준 및 프라이버시 보호 가이드라인을 준수합니다.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* [화면 2] 상단 스티키 헤더 (VeraNex 홈 + 미니앱 로고, 소리/도움말 제거) */}
        {/* ========================================================= */}
        <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EBE6DD] px-3.5 py-2 shadow-2xs shrink-0">
          <div className="flex items-center justify-between mb-2">
            {/* 좌측: VeraNex 포털 홈 복귀 링크 */}
            <a
              href="https://veranex.app"
              target="_top"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer group"
              title="VeraNex 포털 홈으로 이동"
            >
              <img
                src="https://veranex.app/logo-192.png"
                alt="VERA Logo"
                className="w-6 h-6 rounded-md object-contain drop-shadow-xs"
              />
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-wider text-[#2D2A26] leading-none group-hover:text-amber-700 transition-colors">
                  V<span className="text-amber-600">ERANEX</span>
                </span>
                <span className="text-[8px] font-bold text-[#A39C90] leading-tight">
                  PORTAL HOME
                </span>
              </div>
            </a>

            {/* 우측: 해당 미니앱의 고유 로고 / 타이틀 */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-black text-[#2D2A26] leading-tight">
                  Pro JSON Studio
                </div>
                <div className="text-[9px] font-bold text-amber-700 leading-none">
                  경량 개발자 도구
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shadow-xs text-sm">
                <i className="fa-solid fa-code text-xs"></i>
              </div>
            </div>
          </div>

          {/* 4단 알약 탭 (포맷터, 트리, 변환, 문법&FAQ) */}
          <nav className="flex bg-[#F5F2EB] p-1 rounded-xl gap-1 text-xs font-black">
            <button
              type="button"
              onClick={() => setActiveTab('formatter')}
              className={`flex-1 py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'formatter'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-[#7A7369] hover:text-[#2D2A26]'
              }`}
            >
              <i className="fa-solid fa-align-left text-[11px]"></i>
              <span>포맷터</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tree')}
              data-screenshot-click="result"
              className={`flex-1 py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'tree'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-[#7A7369] hover:text-[#2D2A26]'
              }`}
            >
              <i className="fa-solid fa-sitemap text-[11px]"></i>
              <span>트리 뷰</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('convert')}
              className={`flex-1 py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'convert'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-[#7A7369] hover:text-[#2D2A26]'
              }`}
            >
              <i className="fa-solid fa-arrows-repeat text-[11px]"></i>
              <span>변환</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className={`flex-1 py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'faq'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-[#7A7369] hover:text-[#2D2A26]'
              }`}
            >
              <i className="fa-solid fa-book-open text-[11px]"></i>
              <span>문법•FAQ</span>
            </button>
          </nav>
        </header>

        {/* ========================================================= */}
        {/* [메인 컨텐츠 영역] 680px 이내 Zero-Scroll 완결 구조 */}
        {/* ========================================================= */}
        <main className="flex-1 flex flex-col overflow-hidden relative" data-screenshot-content="true">
          {activeTab === 'formatter' && (
            <JsonFormatterTab
              jsonText={jsonText}
              setJsonText={setJsonText}
              statusType={statusType}
              statusMessage={statusMessage}
              stats={stats}
              currentIndent={currentIndent}
              setCurrentIndent={setCurrentIndent}
              onFormat={handleFormat}
              onMinify={handleMinify}
              onAutoFix={handleAutoFix}
              onLoadPreset={loadPreset}
              onDownload={downloadJson}
              onValidate={validateAndParse}
            />
          )}

          {activeTab === 'tree' && (
            <JsonTreeTab
              parsedData={parsedJson}
              isValid={statusType === 'success'}
              parseError={statusType === 'error' ? statusMessage : null}
              onGoToFormatter={() => setActiveTab('formatter')}
              onLoadPreset={loadPreset}
            />
          )}

          {activeTab === 'convert' && (
            <JsonConvertTab
              parsedData={parsedJson}
              isValid={statusType === 'success'}
              toTypeScript={convertToTypeScript}
              toYaml={convertToYaml}
              toXml={convertToXml}
              toCsv={convertToCsv}
              onGoToFormatter={() => setActiveTab('formatter')}
            />
          )}

          {activeTab === 'faq' && <JsonFaqTab />}
        </main>

        {/* ========================================================= */}
        {/* [하단 푸터 & E-E-A-T 정책 링크] */}
        {/* ========================================================= */}
        <footer className="bg-[#FAF8F5] border-t border-[#EBE6DD] px-3 py-1.5 flex items-center justify-between text-[10px] text-[#8C8479] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#635B50]">
              © VeraNex Studio
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">
              <i className="fa-solid fa-shield-halved mr-1"></i>100% 로컬 처리
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openPolicy('privacy')}
              className="hover:text-[#2D2A26] underline transition-colors cursor-pointer"
            >
              개인정보처리
            </button>
            <span>•</span>
            <button
              onClick={() => openPolicy('terms')}
              className="hover:text-[#2D2A26] underline transition-colors cursor-pointer"
            >
              이용약관
            </button>
            <span>•</span>
            <button
              onClick={() => openPolicy('about')}
              className="hover:text-[#2D2A26] underline transition-colors cursor-pointer"
            >
              서비스안내
            </button>
          </div>
        </footer>

        {/* E-E-A-T Policy Modal */}
        <PolicyModal
          isOpen={policyModalOpen}
          onClose={() => setPolicyModalOpen(false)}
          initialTab={policyInitialTab}
        />
      </div>
    </div>
  );
}
