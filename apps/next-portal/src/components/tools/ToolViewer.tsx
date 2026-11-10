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

  const handleNavClick = (tab: 'main' | 'howto' | 'faq', sectionId: string) => {
    setActiveTab(tab);
    if (isStandalone && typeof document !== 'undefined') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-8">
      {/* 상단 빠른 이동 내비게이션 바 */}
      <nav
        aria-label="도구 섹션 바로가기"
        className="flex w-full max-w-md gap-1.5 p-1 bg-gray-200/80 rounded-2xl shadow-inner border border-gray-200"
      >
        <button
          type="button"
          onClick={() => handleNavClick('main', 'tool-section-main')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'main'
              ? 'bg-white text-blue-700 shadow-xs border border-gray-200/50'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <i className="fas fa-tools"></i>
          도구 실행
        </button>
        <button
          type="button"
          onClick={() => handleNavClick('howto', 'tool-section-howto')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'howto'
              ? 'bg-white text-blue-700 shadow-xs border border-gray-200/50'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <i className="fas fa-book-open"></i>
          공식 · 사용법
        </button>
        <button
          type="button"
          onClick={() => handleNavClick('faq', 'tool-section-faq')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'faq'
              ? 'bg-white text-blue-700 shadow-xs border border-gray-200/50'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <i className="fas fa-question-circle"></i>
          자주 묻는 질문
        </button>
      </nav>

      {/* 1. 핵심 기능 실행 영역 */}
      <section
        id="tool-section-main"
        className={
          isStandalone || activeTab === 'main'
            ? 'w-full flex flex-col items-center scroll-mt-20'
            : 'hidden'
        }
      >
        <div
          className={`w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 ${
            isStandalone ? 'max-w-xl h-[680px]' : 'h-[620px]'
          }`}
        >
          <iframe
            src={item.legacyAppUrl || ('appUrl' in item ? item.appUrl : '')}
            title={item.name}
            className="mini-app-modal-iframe w-full h-full border-0"
            loading="eager"
            allow="clipboard-write; clipboard-read"
          />
        </div>
        <p className="text-[11px] text-gray-500 mt-2 text-center">
          * 키보드 입력 및 모바일 터치를 완벽히 지원하며, 모든 연산은 서버 전송 없이 사용자 기기 내에서 안전하게 처리됩니다.
        </p>
      </section>

      {/* 2. 핵심 요약(AEO) · 산출 공식 · 실전 사례 · 단계별 사용방법 (원페이지 상시 노출로 구글 SEO 가중치 극대화) */}
      <article
        id="tool-section-howto"
        className={
          isStandalone || activeTab === 'howto'
            ? 'w-full max-w-6xl bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-100 space-y-6 text-left scroll-mt-20'
            : 'hidden'
        }
      >
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2 mb-2">
            <i className="fas fa-book-open text-blue-600"></i>
            {item.name} 핵심 원리 및 공식 이용 가이드
          </h2>
          <p className="text-gray-700 text-xs sm:text-sm leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-200/70">
            {'directAnswer' in item && item.directAnswer ? item.directAnswer : item.description}
          </p>
        </div>

        {'formula' in item && item.formula && (
          <div className="bg-blue-50/60 p-4 sm:p-5 rounded-xl border border-blue-100 space-y-3">
            <h3 className="text-sm sm:text-base font-extrabold text-blue-900">
              {item.formula.title} (핵심 산출 공식)
            </h3>
            <p className="text-xs sm:text-sm font-mono font-bold text-blue-800 bg-white px-3.5 py-2.5 rounded-lg border border-blue-100">
              {item.formula.expression}
            </p>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {item.formula.explanation}
            </p>
            {Array.isArray(item.formula.variables) && item.formula.variables.length > 0 && (
              <div className="pt-2 border-t border-blue-100/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {item.formula.variables.map((v, idx) => (
                  <div key={idx} className="bg-white/90 p-3 rounded-lg border border-blue-100/60">
                    <div className="text-xs font-extrabold text-blue-900 mb-0.5">{v.name}</div>
                    <div className="text-[11px] sm:text-xs text-gray-600 leading-snug">{v.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {'example' in item && item.example && (
          <div className="bg-emerald-50/60 p-4 sm:p-5 rounded-xl border border-emerald-100 space-y-2">
            <h3 className="text-sm sm:text-base font-extrabold text-emerald-900">
              실전 계산 및 적용 시뮬레이션 예시
            </h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              <strong className="text-emerald-950">적용 조건:</strong> {item.example.scenario}
            </p>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              <strong className="text-emerald-950">산출 과정:</strong> {item.example.calculation}
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-emerald-800 bg-white/80 px-3 py-2 rounded-lg border border-emerald-200/60">
              <strong>최종 결과:</strong> {item.example.result}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
            단계별 사용 방법 (How-To)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {item.howToSteps.map((step, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-900">{step.name}</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* 3. 자주 묻는 질문(FAQ) 섹션 (기본 펼침 상태로 크롤러 가시성 100% 보장) */}
      <section
        id="tool-section-faq"
        className={
          isStandalone || activeTab === 'faq'
            ? 'w-full max-w-6xl bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-100 space-y-5 text-left scroll-mt-20'
            : 'hidden'
        }
      >
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2 mb-1">
            <i className="fas fa-lightbulb text-amber-500"></i>
            {item.name} 자주 묻는 질문 (FAQ)
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm">
            실제 사용자들이 가장 자주 검색하고 문의하는 핵심 기준과 해답을 정리했습니다.
          </p>
        </div>

        <div className="space-y-3">
          {item.faqs.map((faq, idx) => (
            <details
              key={idx}
              open
              className="group bg-gray-50 border border-gray-100 rounded-xl p-4 open:bg-blue-50/30 transition-colors"
            >
              <summary className="font-bold text-xs sm:text-sm text-gray-900 cursor-pointer flex items-center justify-between list-none">
                <span className="flex items-center gap-2">
                  <span className="text-blue-600 font-extrabold">Q{idx + 1}.</span>
                  {faq.question}
                </span>
                <i className="fas fa-chevron-down text-xs text-gray-400 group-open:rotate-180 transition-transform"></i>
              </summary>
              <p className="mt-2.5 text-xs sm:text-sm text-gray-700 leading-relaxed pl-6 border-t border-gray-200/60 pt-2.5">
                <strong className="text-blue-700">A. </strong> {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
