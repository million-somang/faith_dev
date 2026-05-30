import { useState, useEffect, useRef } from 'react';
import { MiniAppLayout, MiniAppCommunity } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import { useTextStats } from './hooks/useTextStats';
import TextEditor from './components/TextEditor';
import StatsPanel from './components/StatsPanel';
import SpellChecker from './components/SpellChecker';
import MobileStatsBar from './components/MobileStatsBar';

declare global {
  interface Document {
    parentKeyboardCallback?: ((key: string) => void) | null;
  }
}

type TabType = 'checker' | 'howto' | 'community';

function App() {
  const { text, setText, platform, setPlatform, stats } = useTextStats('');
  const spellCheckerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('checker');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleGlobalMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'PARENT_KEYBOARD_EVENT') {
        const key = e.data.key;
        console.log('[TEXTGLOBAL] Forwarding key to document.parentKeyboardCallback:', key);
        if (typeof document.parentKeyboardCallback === 'function') {
          document.parentKeyboardCallback(key);
        }
      }
    };
    window.addEventListener('message', handleGlobalMessage);
    return () => window.removeEventListener('message', handleGlobalMessage);
  }, []);

  const handleMobileSpellCheck = () => {
    if (activeTab !== 'checker') {
      setActiveTab('checker');
      setTimeout(() => {
        spellCheckerRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      spellCheckerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <MiniAppLayout title="">
        <div className="loading-screen" role="status" aria-label="앱 로딩 중">
          <div className="loading-body">
            <div className="loading-icon-wrapper">
              <i className="fas fa-spell-check text-green-500 text-6xl" aria-hidden="true"></i>
            </div>

            <h1 className="loading-title">글자수 세기 &amp; 맞춤법 검사</h1>
            <p className="loading-subtitle">공백 제어 글자수 계산과 한국어 띄어쓰기 철자 교정을 안전하게</p>

            <div className="loading-spinner" aria-hidden="true">
              <div className="spinner-dot"></div>
              <div className="spinner-dot"></div>
              <div className="spinner-dot"></div>
            </div>

            <aside className="loading-ad-banner" aria-label="광고">
              <div className="ad-placeholder">
                <span className="ad-badge">AD</span>
                <span className="ad-text">광고 영역</span>
              </div>
            </aside>

            <div className="loading-info-banner" aria-label="안내">
              <div className="info-placeholder">
                <span className="info-badge">FAITHLINK</span>
                <span className="info-text">입력한 텍스트는 브라우저 내부 메모리에만 안전 보장됩니다.</span>
              </div>
            </div>
          </div>
        </div>
      </MiniAppLayout>
    );
  }

  return (
    <MiniAppLayout title="글자수/맞춤법">
      <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 py-4 sm:py-6 lg:py-8 pb-24 lg:pb-8 w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">

          {/* Top Navigation Tabs */}
          <nav className="flex w-full gap-2 p-1.5 bg-gray-100/80 backdrop-blur-xs rounded-2xl mb-8 max-w-lg mx-auto shadow-inner border border-gray-200" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'checker'}
              onClick={() => setActiveTab('checker')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'checker'
                  ? 'bg-white text-green-700 shadow-xs border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <i className="fas fa-spell-check"></i>
              글자수/맞춤법
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'howto'}
              onClick={() => setActiveTab('howto')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'howto'
                  ? 'bg-white text-green-700 shadow-xs border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <i className="fas fa-book-open"></i>
              사용방법
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'community'}
              onClick={() => setActiveTab('community')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'community'
                  ? 'bg-white text-green-700 shadow-xs border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <i className="fab fa-instagram"></i>
              자유토론
            </button>
          </nav>

          {/* Tab Contents */}
          {activeTab === 'checker' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <i className="fas fa-spell-check text-green-600"></i>
                    글자수 세기 &amp; 맞춤법 검사
                  </h1>
                  <p className="text-gray-600 mt-2 flex items-center gap-2 text-sm sm:text-base">
                    <i className="fas fa-lock text-green-500"></i>
                    입력하신 내용은 브라우저에만 저장되며 외부로 전송되지 않습니다.
                  </p>
                </div>
              </div>

              {/* Main Layout: 2 Column */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Zone A: Text Editor */}
                <TextEditor text={text} onTextChange={setText} />

                {/* Zone B: Dashboard (Stats & Spell Check) */}
                <div className="lg:w-[380px] space-y-6">
                  {/* Desktop Stats */}
                  <div className="hidden sm:block">
                    <StatsPanel stats={stats} platform={platform} setPlatform={setPlatform} />
                  </div>

                  {/* Spell Checker */}
                  <div ref={spellCheckerRef}>
                    <SpellChecker text={text} onApplyCorrections={setText} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'howto' && (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100 space-y-8 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <i className="fas fa-book-open text-green-600"></i>
                  글자수 세기 및 맞춤법 검사기 사용방법
                </h1>
                <p className="text-gray-600 text-sm">작성한 문장을 효율적으로 분석하고 최적화하기 위한 기능 해설서입니다.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-2">
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded">기능 01</span>
                  <h2 className="text-base font-bold text-gray-800">실시간 자수 계산 (공백 포함/제외)</h2>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    입력한 문장을 즉각 연산하여 실시간 통계를 표시합니다. 띄어쓰기와 엔터를 제외한 순수한 활자수(공백 제외)와 전체 글자수를 제공하여 대기업 및 공기관 자기소개서 표준 기준에 매끄럽게 부합시킵니다.
                  </p>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-2">
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded">기능 02</span>
                  <h2 className="text-base font-bold text-gray-800">한국어 띄어쓰기 및 철자 교정</h2>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    형태소 분석을 토대로 자주 오표기하는 맞춤법(예: ~돼서/~되서, 맞춤법/마춤법)과 띄어쓰기 오류를 실시간 추적하여 색상별 경고 카드로 제안하며, 단 한 번의 클릭으로 일괄 적용합니다.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-1.5">
                  <i className="fas fa-lightbulb text-amber-500"></i>
                  자주 틀리는 맞춤법 5선 핵심 요약
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-bold text-gray-600">자주 묻는 오표기</th>
                        <th className="px-4 py-2 text-left font-bold text-gray-600">올바른 표기법</th>
                        <th className="px-4 py-2 text-left font-bold text-gray-600">구분 원칙 및 사용 팁</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      <tr>
                        <td className="px-4 py-3 text-red-500 font-semibold">되서 / 안돼다</td>
                        <td className="px-4 py-3 text-green-600 font-semibold">돼서 / 안되다</td>
                        <td className="px-4 py-3 text-gray-600">"하/해"를 대입해보세요. "하"면 "되", "해"면 "돼"로 구분합니다. (안해서=안돼서)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-red-500 font-semibold">않하고 / 않다</td>
                        <td className="px-4 py-3 text-green-600 font-semibold">안 하고 / 않다</td>
                        <td className="px-4 py-3 text-gray-600">"안"은 부사 "아니"의 준말(안 먹다), "않"은 보조용언 "아니하다"의 준말(먹지 않았다)입니다.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-red-500 font-semibold">몇일 / 며칠</td>
                        <td className="px-4 py-3 text-green-600 font-semibold">며칠</td>
                        <td className="px-4 py-3 text-gray-600">한글 맞춤법상 "몇 일"이라는 표기는 존재하지 않으며, 무조건 "며칠"이 올바른 규정입니다.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-red-500 font-semibold">무난하다 / 문안하다</td>
                        <td className="px-4 py-3 text-green-600 font-semibold">무난하다</td>
                        <td className="px-4 py-3 text-gray-600">별다른 어려움이 없다는 뜻은 '없을 무(無)'에 '어려울 난(難)'을 쓰는 "무난"이 맞습니다.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-red-500 font-semibold">어떡해 / 어떻게</td>
                        <td className="px-4 py-3 text-green-600 font-semibold">어떡해 / 어떻게</td>
                        <td className="px-4 py-3 text-gray-600">"어떡해"는 '어떻게 해'의 준말(문장의 끝에 위치), "어떻게"는 수식어(어떻게 가나요)입니다.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'community' && (
            <div className="animate-fadeIn">
              <MiniAppCommunity appId="text-checker" />
            </div>
          )}

        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <MobileStatsBar stats={stats} onCheckSpelling={handleMobileSpellCheck} />
    </MiniAppLayout>
  );
}

export default App;
