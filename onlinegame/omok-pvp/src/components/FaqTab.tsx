import React from 'react';
import { HelpCircle, Trophy, Clock, Wifi, Sparkles } from 'lucide-react';

export const FaqTab: React.FC = () => {
  const faqs = [
    {
      q: '한 턴당 착수 제한 시간은 얼마인가요?',
      a: '1:1 실시간 대전의 1턴당 제한 시간은 30초입니다. 30초 내에 돌을 놓지 못하면 시간패(타임아웃)로 처리됩니다.',
      icon: Clock
    },
    {
      q: '레이팅 점수(LP)와 티어는 어떻게 결정되나요?',
      a: '초기 1,200 LP에서 시작하며, 승리 시 +20 LP, 패배 시 -15 LP가 반영됩니다. 브론즈, 실버, 골드, 플래티넘, 다이아몬드 티어로 승급할 수 있습니다.',
      icon: Trophy
    },
    {
      q: '비공개 방으로 친구와 1:1 대결을 하려면 어떻게 하나요?',
      a: '로비에서 [방 만들기] 시 "비공개 방" 옵션을 선택하면 4자리 입장 코드가 발급됩니다. 친구에게 해당 코드를 공유하여 [비공개 코드 입장]을 통해 참여할 수 있습니다.',
      icon: Sparkles
    },
    {
      q: '인터넷 연결이 불안정하여 튕기면 어떻게 되나요?',
      a: '재접속 대기 시간(약 15초) 내에 복구되지 않으면 기권패 처리됩니다. 안정적인 Wi-Fi 또는 유선 인터넷 환경에서 플레이하시길 권장합니다.',
      icon: Wifi
    },
    {
      q: '스마트폰 모바일 브라우저에서도 플레이 가능한가요?',
      a: '네, 베라오목 온라인은 모바일 뷰포트(430px~450px) 터치 인터페이스에 100% 최적화되어 있어 별도 앱 설치 없이 스마트폰에서도 쾌적하게 동작합니다.',
      icon: HelpCircle
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-fade-in text-slate-800 text-xs leading-relaxed">
      {/* 타이틀 배너 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle className="w-4 h-4 text-purple-200" />
          <h2 className="text-sm font-black tracking-tight">자주 묻는 질문 (FAQ) & 시스템 안내</h2>
        </div>
        <p className="text-[11px] text-purple-100">
          베라오목 온라인의 경기 진행 및 시스템에 대해 자주 묻는 질문들을 모았습니다.
        </p>
      </div>

      {/* 티어 체계 요약 카드 */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
        <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>시즌 랭킹 티어 체계 (LP 기준)</span>
        </h3>
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="font-extrabold text-amber-700">🥉 브론즈</span>
            <span className="text-slate-500">1,000 LP 미만</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="font-extrabold text-slate-500">🥈 실버</span>
            <span className="text-slate-500">1,000 ~ 1,199 LP</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="font-extrabold text-amber-500">🥇 골드</span>
            <span className="text-slate-500">1,200 ~ 1,499 LP</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="font-extrabold text-cyan-600">💎 다이아몬드</span>
            <span className="text-slate-500">1,500 LP 이상</span>
          </div>
        </div>
      </div>

      {/* FAQ 아코디언/카드 목록 */}
      <div className="space-y-2.5">
        {faqs.map((faq, idx) => {
          const Icon = faq.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0 text-[11px] mt-0.5">
                  Q
                </span>
                <h4 className="font-extrabold text-xs text-slate-900 leading-snug">{faq.q}</h4>
              </div>
              <div className="pl-7 text-slate-600 text-[11px]">
                {faq.a}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
