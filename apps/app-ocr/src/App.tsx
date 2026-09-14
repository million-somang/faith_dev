import React, { useState, useEffect } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import OcrExtractor from './components/OcrExtractor';
import OcrGuide from './components/OcrGuide';
import OcrFaq from './components/OcrFaq';

type PageTab = 'extractor' | 'guide' | 'faq';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PageTab>('extractor');

  // ⏳ 3초 필수 로딩 스크린 타이머 (정확히 3000ms - miniapp.md 표준)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // 3초 로딩 스크린 화면
  if (isLoading) {
    return (
      <MiniAppLayout title="">
        <div className="loading-screen" role="status" aria-label="앱 로딩 중">
          {/* 상단 헤더 */}
          <div className="loading-header">
            <div className="loading-header-title">
              <i className="fas fa-file-lines"></i>
              <span>브라우저 OCR (이미지 글자 추출기)</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-xs">
              <i className="fas fa-eye"></i>
            </div>
          </div>

          {/* 로딩 본체 */}
          <div className="loading-body">
            {/* 중앙 로고 아이콘 서클 */}
            <div className="loading-icon-wrapper">
              <div className="loading-icon-inner">
                <i className="fas fa-file-waveform"></i>
              </div>
            </div>

            {/* 타이틀 및 서브타이틀 */}
            <h1 className="loading-title">브라우저 OCR 글자 추출기</h1>
            <p className="loading-subtitle">
              서버 전송 없는 100% 브라우저 로컬 구동 • 사진 및 캡처 텍스트 변환
            </p>

            {/* 3개 점 바운스 스피너 */}
            <div className="loading-spinner" aria-hidden="true">
              <div className="spinner-dot"></div>
              <div className="spinner-dot"></div>
              <div className="spinner-dot"></div>
            </div>

            {/* 하단 안내 배너 */}
            <aside className="loading-ad-banner" aria-label="안내">
              <div className="ad-placeholder">
                <span className="ad-badge">VERA</span>
                <span className="ad-text">Tesseract.js WebAssembly 초고속 엔진 준비 중...</span>
              </div>
            </aside>
          </div>
        </div>
      </MiniAppLayout>
    );
  }

  // 3초 로딩 완료 후 메인 유틸리티 뷰
  return (
    <MiniAppLayout title="">
      <main className="min-h-screen bg-slate-100/70 p-3 sm:p-5 flex flex-col items-center antialiased">
        <div className="w-full max-w-md flex-1 flex flex-col justify-between space-y-4">
          
          {/* 최상단 페이지 탭 (Clean Neumorphism 알약 트랙) */}
          <nav className="flex w-full p-1 nm-inset rounded-2xl gap-1 bg-slate-200/60 shrink-0" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'extractor'}
              onClick={() => setActiveTab('extractor')}
              className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                activeTab === 'extractor'
                  ? 'nm-btn bg-white text-blue-700 font-extrabold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fas fa-file-lines text-xs"></i>
              <span>글자 추출</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'guide'}
              onClick={() => setActiveTab('guide')}
              className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                activeTab === 'guide'
                  ? 'nm-btn bg-white text-blue-700 font-extrabold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fas fa-lightbulb text-xs"></i>
              <span>인식률 팁</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'faq'}
              onClick={() => setActiveTab('faq')}
              className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                activeTab === 'faq'
                  ? 'nm-btn bg-white text-blue-700 font-extrabold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fas fa-circle-question text-xs"></i>
              <span>FAQ & 보안</span>
            </button>
          </nav>

          {/* 선택된 탭 컨텐츠 */}
          <div className="flex-1 flex flex-col justify-between">
            {activeTab === 'extractor' && <OcrExtractor />}
            {activeTab === 'guide' && <OcrGuide />}
            {activeTab === 'faq' && <OcrFaq />}
          </div>
        </div>
      </main>
    </MiniAppLayout>
  );
}
