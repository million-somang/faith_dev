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
      a: '로비에서 [방 만들기] 시 "비공개 방" 옵션을 선택하면 4자리 입장 코드가 발급됩니다. 친구에게 해당 코드를 공유하여 [코드 입장]을 통해 참여할 수 있습니다.',
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
    <div className="flex-1 overflow-y-auto p-3.5 space-y-3 animate-fade-in text-[#2d261e] text-xs leading-relaxed bg-[#f7f4ed]">
      {/* 타이틀 배너 */}
      <div className="bg-gradient-to-r from-[#b45309] to-[#78350f] text-white rounded-2xl p-3.5 shadow-sm">
        <div className="flex items-center gap-2 mb-0.5">
          <HelpCircle className="w-4 h-4 text-amber-200" />
          <h2 className="text-xs font-black tracking-tight">자주 묻는 질문 (FAQ) & 티어 안내</h2>
        </div>
        <p className="text-[11px] text-amber-100">
          베라오목 온라인의 경기 진행 및 시스템에 대해 자주 묻는 질문들을 모았습니다.
        </p>
      </div>

      {/* 티어 체계 요약 카드 */}
      <div className="bg-white rounded-2xl p-3.5 border border-[#e8e1d5] shadow-2xs space-y-2">
        <h3 className="text-xs font-black text-[#2d261e] flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>시즌 랭킹 티어 체계 (LP 기준)</span>
        </h3>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="bg-[#fdfbf7] p-2 rounded-xl border border-[#f0ebe1] flex items-center justify-between">
            <span className="font-extrabold text-amber-700">🥉 브론즈</span>
            <span className="text-[#786e63]">1,000 LP 미만</span>
          </div>
          <div className="bg-[#fdfbf7] p-2 rounded-xl border border-[#f0ebe1] flex items-center justify-between">
            <span className="font-extrabold text-slate-500">🥈 실버</span>
            <span className="text-[#786e63]">1,000 ~ 1,199 LP</span>
          </div>
          <div className="bg-[#fdfbf7] p-2 rounded-xl border border-[#f0ebe1] flex items-center justify-between">
            <span className="font-extrabold text-amber-500">🥇 골드</span>
            <span className="text-[#786e63]">1,200 ~ 1,499 LP</span>
          </div>
          <div className="bg-[#fdfbf7] p-2 rounded-xl border border-[#f0ebe1] flex items-center justify-between">
            <span className="font-extrabold text-cyan-600">💎 다이아몬드</span>
            <span className="text-[#786e63]">1,500 LP 이상</span>
          </div>
        </div>
      </div>

      {/* FAQ 목록 */}
      <div className="space-y-2">
        {faqs.map((faq, idx) => {
          return (
            <div key={idx} className="bg-white rounded-2xl p-3 border border-[#e8e1d5] shadow-2xs space-y-1">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center font-black shrink-0 text-[10px] mt-0.5 border border-amber-200">
                  Q
                </span>
                <h4 className="font-extrabold text-[11px] text-[#2d261e] leading-snug">{faq.q}</h4>
              </div>
              <div className="pl-6 text-[#5c5245] text-[11px]">
                {faq.a}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
