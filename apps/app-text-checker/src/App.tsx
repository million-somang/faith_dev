import { useRef } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import { useTextStats } from './hooks/useTextStats';
import TextEditor from './components/TextEditor';
import StatsPanel from './components/StatsPanel';
import SpellChecker from './components/SpellChecker';
import MobileStatsBar from './components/MobileStatsBar';

function App() {
  const { text, setText, platform, setPlatform, stats } = useTextStats('');
  const spellCheckerRef = useRef<HTMLDivElement>(null);

  const handleMobileSpellCheck = () => {
    // 모바일에서 맞춤법 검사 버튼 클릭 시, 해당 섹션으로 부드럽게 스크롤
    spellCheckerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <MiniAppLayout title="글자수/맞춤법">
      <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 py-4 sm:py-6 lg:py-8 pb-24 lg:pb-8 w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">

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

              {/* Desktop Stats (hidden on extremely small mobile, but usually stacks on mobile) */}
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
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <MobileStatsBar stats={stats} onCheckSpelling={handleMobileSpellCheck} />
    </MiniAppLayout>
  );
}

export default App;
