import React, { useState } from 'react';
import { MiniAppCommunity } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/components/MiniAppCommunity.css';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [showCommunity, setShowCommunity] = useState<boolean>(false);

  const faqs = [
    {
      q: 'D-Day 카운트다운에서 당일과 하루 전은 어떻게 표기되나요?',
      a: '목표일 당일은 정확히 D-Day로 표시됩니다. 목표일 하루 전은 D-1로 표기되며, 목표일이 지난 후에는 D+1, D+2와 같이 경과 일수가 계산되어 지속적인 기록 관리가 가능합니다.'
    },
    {
      q: '커플 기념일 계산 시 첫날을 1일로 세는 방법은 무엇인가요?',
      a: '새 D-Day 만들기에서 모드를 [기념일]로 선택하신 후, [기준일을 1일로 포함] 체크박스를 활성화하시면 당일부터 1일째로 정확하게 가산되어 100일, 200일 기념일을 오차 없이 계산할 수 있습니다.'
    },
    {
      q: '등록한 D-Day 데이터는 서버에 저장되거나 유출되지 않나요?',
      a: '로그인하지 않은 상태에서는 브라우저의 독립된 로컬 스토리지에만 보관되어 타인에게 절대 유출되지 않습니다. 계정으로 로그인하시면 기기 변경 시에도 일정이 안전하게 클라우드 동기화됩니다.'
    },
    {
      q: '가장 임박한 D-Day는 어디서 확인하나요?',
      a: 'D-Day를 여러 개 등록하시면, 남은 일수가 가장 적은 대표 목표가 상단의 [Hero D-Day 리포트 카드]에 자동으로 하이라이트되어 진행률 바와 함께 표시됩니다.'
    },
    {
      q: '만 나이 통일법 시행 후 D-Day 계산 방식이 바뀌었나요?',
      a: '바뀌지 않았습니다. 만 나이 통일법은 공적 행정 서류상의 나이 표기에만 적용되며, 일상적인 커플 기념일이나 수능 D-Day 등 사적 일수 적산 방식은 기존 전통 그대로 유지됩니다.'
    }
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* FAQ 카드 */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <i className="fas fa-question-circle text-pink-600"></i>
          <span>D-Day 계산기 자주 묻는 질문 (FAQ)</span>
        </h3>
        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-800 hover:text-pink-600 cursor-pointer"
                >
                  <span>Q. {faq.q}</span>
                  <i className={`fas fa-chevron-down text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-pink-600' : ''}`}></i>
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 pt-1 text-[11px] text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 자유토론 커뮤니티 토글 섹션 */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <i className="fas fa-comments text-purple-600"></i>
              <span>목표 나눔 & 자유 토론 커뮤니티</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              다른 이용자들과 설레는 목표와 기념일 꿀팁을 공유해보세요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCommunity(!showCommunity)}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 transition-all cursor-pointer"
          >
            {showCommunity ? '접기' : '토론방 열기'}
          </button>
        </div>

        {showCommunity && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <MiniAppCommunity appId="dday-calc" />
          </div>
        )}
      </div>
    </div>
  );
}
