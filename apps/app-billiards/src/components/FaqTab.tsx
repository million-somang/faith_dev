import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { HelpCircle, MessageSquare, Trophy } from 'lucide-react';
import { MiniAppCommunity } from '@faithportal/mini-app-sdk';

interface LeaderboardRow {
  score: number;
  email: string | null;
  created_at: string;
}

export const FaqTab: React.FC = () => {
  const [leaders, setLeaders] = useState<LeaderboardRow[]>([]);
  const [loadingRanks, setLoadingRanks] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    axios
      .get<{ success: boolean; leaderboard?: LeaderboardRow[] }>('/api/games/billiards/leaderboard')
      .then((res) => {
        if (!cancelled && res.data?.leaderboard) {
          setLeaders(res.data.leaderboard);
        }
      })
      .catch(() => {
        // 오프라인/로컬 폴백
      })
      .finally(() => {
        if (!cancelled) setLoadingRanks(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const faqs = [
    {
      q: '4구 모드에서 노란공(상대 수구)을 맞히면 왜 감점되나요?',
      a: '한국 당구장 정통 4구 룰에서는 내 수구(흰공)로 두 개의 빨간 적구만 맞혀야 득점(+10점)이 되며, 상대방의 수구(노란공)를 건드리면 파울(Foul)이 선언되어 10점이 감점되고 즉시 공격 턴이 넘어갑니다.',
    },
    {
      q: '3구(3쿠션)에서 두 공을 맞혔는데 왜 노카운트가 되나요?',
      a: '3쿠션 규칙상 수구가 두 번째 적구에 닿기 전까지 고무 레일(쿠션)에 최소 3번 이상 부딪혀야 합니다. 예를 들어 1적구 충돌 후 2쿠션만 맞고 2적구에 닿으면 총 2쿠션이므로 득점으로 인정되지 않습니다.',
    },
    {
      q: '초크(Chalk)를 안 바르면 실제로 미스큐(삑사리)가 나나요?',
      a: '네! 스트로크를 거듭해 초크 잔량이 25% 미만으로 떨어진 상태에서 다이얼 가장자리의 극단적인 당점(강한 끌어치기나 최대 회전)을 주면, 큐 팁이 미끄러지는 미스큐 사운드와 함께 회전이 풀리는 리얼 디테일이 반영되어 있습니다.',
    },
    {
      q: '고스트볼 가이드라인의 초록색 선과 노란색 선은 무엇인가요?',
      a: '하얀 점선 끝의 원은 수구가 제1적구와 부딪히는 순간의 위치(Ghost Ball)이며, 노란색 실선은 피격된 적구의 진행 방향, 초록색 실선은 현재 설정한 당점(밀어치기/끌어치기/회전)이 반영된 수구의 분리 진행 궤적입니다.',
    },
  ];

  return (
    <div className="w-full max-w-[450px] md:max-w-3xl lg:max-w-5xl mx-auto space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* 좌측: 명예의 전당 랭킹 카드 */}
        <section className="bg-white rounded-3xl p-5 border border-[#EBE6DD] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#2D2A26] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>베라 당구 클럽 명예의 전당 TOP 10</span>
            </h2>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              실시간 랭킹
            </span>
          </div>

          {loadingRanks ? (
            <div className="py-8 text-center text-xs text-[#8A847A]">
              랭킹 데이터를 불러오는 중...
            </div>
          ) : leaders.length === 0 ? (
            <div className="py-6 px-4 text-center text-xs text-[#7A756D] bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E0D9CD]">
              아직 등록된 시즌 기록이 없습니다.<br />
              지금 승리하여 첫 번째 당구 챔피언에 등극하세요!
            </div>
          ) : (
            <div className="space-y-2">
              {leaders.slice(0, 6).map((row, idx) => {
                const masked = row.email
                  ? `${row.email.split('@')[0].slice(0, 3)}***`
                  : 'ProPlayer';
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-mono font-black text-[11px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-extrabold text-[#2D2A26]">{masked}</span>
                    </div>
                    <span className="font-mono font-black text-blue-700">
                      {row.score.toLocaleString()} PTS
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 우측: 자주 묻는 질문(FAQ) 아코디언 */}
        <section className="bg-white rounded-3xl p-5 border border-[#EBE6DD] shadow-2xs space-y-3">
          <h2 className="text-sm font-black text-[#2D2A26] flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>자주 묻는 질문 (FAQ)</span>
          </h2>
          <div className="space-y-2 text-xs">
            {faqs.map((item, idx) => (
              <details
                key={idx}
                open={idx === 0}
                className="group border border-[#EBE6DD] bg-[#FAF8F5] rounded-xl p-3 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer font-extrabold text-[#2D2A26]">
                  <span>Q. {item.q}</span>
                  <span className="text-xs text-[#8A847A] group-open:rotate-180 transition-transform ml-2">
                    ▼
                  </span>
                </summary>
                <p className="mt-2 pt-2 border-t border-[#EBE6DD] text-[#5C564E] leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* 하단: 당구 클럽 동호인 자유토론 피드 (`MINI_APP_MODAL_SEO_GUIDE.md` 5.C) */}
      <section className="bg-white rounded-3xl p-5 border border-[#EBE6DD] shadow-2xs space-y-3">
        <h2 className="text-sm font-black text-[#2D2A26] flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <span>당구 클럽 동호인 라운지 (다마수 & 3쿠션 팁 공유)</span>
        </h2>
        <MiniAppCommunity appId="billiards" />
      </section>
    </div>
  );
};
