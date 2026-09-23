'use client';

import React, { useState } from 'react';
import { ToolItem } from '@/data/toolsData';
import { GameItem } from '@/data/gamesData';

interface ToolViewerProps {
  item: ToolItem | GameItem;
  isStandalone?: boolean;
}

export function ToolViewer({ item, isStandalone = false }: ToolViewerProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'howto' | 'faq'>('main');

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3탭 내비게이션 바 (MINI_APP_MODAL_SEO_GUIDE 표준) */}
      <nav
        className="flex w-full max-w-md gap-1.5 p-1 bg-gray-200/80 rounded-2xl mb-5 shadow-inner border border-gray-200"
        role="tablist"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'main'}
          onClick={() => setActiveTab('main')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'main'
              ? 'bg-white text-blue-700 shadow-xs border border-gray-200/50'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <i className="fas fa-tools"></i>
          핵심 기능
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'howto'}
          onClick={() => setActiveTab('howto')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'howto'
              ? 'bg-white text-blue-700 shadow-xs border border-gray-200/50'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <i className="fas fa-book-open"></i>
          사용방법
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'faq'}
          onClick={() => setActiveTab('faq')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'faq'
              ? 'bg-white text-blue-700 shadow-xs border border-gray-200/50'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <i className="fas fa-question-circle"></i>
          자주 묻는 질문
        </button>
      </nav>

      {/* 1. 핵심 기능 탭 */}
      {activeTab === 'main' && (
        <div className="w-full flex flex-col items-center">
          <div
            className={`w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 ${
              isStandalone ? 'max-w-xl h-[680px]' : 'h-[620px]'
            }`}
          >
            <iframe
              src={item.legacyAppUrl}
              title={item.name}
              className="mini-app-modal-iframe w-full h-full border-0"
              loading="lazy"
              allow="clipboard-write; clipboard-read"
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            * 키보드 타건 및 모바일 터치를 완벽히 지원하며, 모든 연산은 사용자 기기 내에서만 처리됩니다.
          </p>
        </div>
      )}

      {/* 2. 사용방법 탭 (구글 크롤러 및 AEO 필수) */}
      {activeTab === 'howto' && (
        <div className="w-full max-w-2xl bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-100 space-y-6 text-left">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
              <i className="fas fa-book-open text-blue-600"></i>
              {item.name} 공식 이용 가이드
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              {item.summary}
            </p>
          </div>

          <div className="space-y-4">
            {item.howToSteps.map((step, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-4 rounded-xl border border-gray-100 flex gap-3.5 items-start"
              >
                <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-800">{step.name}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. 자주 묻는 질문(FAQ) 탭 */}
      {activeTab === 'faq' && (
        <div className="w-full max-w-2xl bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-100 space-y-6 text-left">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
              <i className="fas fa-lightbulb text-amber-500"></i>
              자주 묻는 질문 (FAQ)
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm">
              이용 중 궁금한 점과 핵심 기준을 정리했습니다.
            </p>
          </div>

          <div className="space-y-3">
            {item.faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group bg-gray-50 border border-gray-100 rounded-xl p-4 open:bg-blue-50/40 transition-colors"
              >
                <summary className="font-bold text-xs sm:text-sm text-gray-800 cursor-pointer flex items-center justify-between list-none">
                  <span className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold">Q.</span>
                    {faq.question}
                  </span>
                  <i className="fas fa-chevron-down text-xs text-gray-400 group-open:rotate-180 transition-transform"></i>
                </summary>
                <p className="mt-2.5 text-xs text-gray-600 leading-relaxed pl-5 border-t border-gray-100 pt-2.5">
                  <strong className="text-gray-700">A. </strong> {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
