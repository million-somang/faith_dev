import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LeaderboardEntry } from '../types/submarine';

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, fleetName: '동해 제1기동전대', rating: 2890, wins: 42, losses: 3, bestTurns: 21, title: '해군 원수' },
  { rank: 2, fleetName: '네온 서브마리너', rating: 2740, wins: 38, losses: 5, bestTurns: 23, title: '작전사령관' },
  { rank: 3, fleetName: '블루호크 잠수전대', rating: 2610, wins: 33, losses: 7, bestTurns: 25, title: '기동제독' },
  { rank: 4, fleetName: '베라 타이탄즈', rating: 2490, wins: 29, losses: 8, bestTurns: 27, title: '주력함장' },
  { rank: 5, fleetName: '태평양 섀도우', rating: 2380, wins: 25, losses: 10, bestTurns: 28, title: '초계전대장' },
  { rank: 6, fleetName: '심해 크라켄', rating: 2260, wins: 22, losses: 11, bestTurns: 30, title: '작전장교' },
  { rank: 7, fleetName: '북극성 사냥꾼', rating: 2150, wins: 19, losses: 12, bestTurns: 32, title: '전술장교' },
  { rank: 8, fleetName: '골드 살보함', rating: 2040, wins: 17, losses: 14, bestTurns: 34, title: '항해장교' },
];

export const SubmarineLeaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get<{ success: boolean; leaderboard: LeaderboardEntry[] }>(
          '/api/games/submarine/leaderboard'
        );
        if (res.data.success && res.data.leaderboard && res.data.leaderboard.length > 0) {
          setLeaders(res.data.leaderboard);
        }
      } catch (_err) {
        // 백엔드 미구동 또는 게스트 환경 시 기본 목데이터 활용
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="w-full max-w-[450px] md:max-w-2xl mx-auto space-y-3 p-1">
      {/* 상단 랭킹전 소개 배너 */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black tracking-widest text-cyan-300 uppercase">
              Naval Hall of Fame
            </span>
            <h3 className="text-base font-black mt-0.5">베라 서브마린 제독 랭킹</h3>
            <p className="text-xs text-slate-300 mt-1">
              최소 턴수 격침 및 연속 살보 승률로 산정된 최정예 제독 명단입니다.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl text-amber-400">
            <i className="fas fa-trophy"></i>
          </div>
        </div>
      </div>

      {/* 랭킹 리스트 */}
      <div className="bg-white rounded-2xl p-3 border border-[#EBE6DD] shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs font-black text-[#8C8479] px-2 pb-1 border-b border-[#F2EDE4]">
          <span className="w-8 text-center">순위</span>
          <span className="flex-1 px-2">함대명 / 전술 직책</span>
          <span className="w-14 text-center">최소 턴</span>
          <span className="w-16 text-right">전술 점수</span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs font-bold text-[#8C8479]">
            제독 명부를 불러오는 중입니다...
          </div>
        ) : (
          leaders.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-colors ${
                entry.rank === 1
                  ? 'bg-amber-50/70 text-amber-950 border border-amber-200'
                  : entry.rank === 2
                  ? 'bg-slate-50 text-slate-900 border border-slate-200'
                  : entry.rank === 3
                  ? 'bg-amber-50/30 text-[#2D2A26] border border-amber-100'
                  : 'bg-[#FAF8F5] text-[#2D2A26]'
              }`}
            >
              <div className="w-8 flex items-center justify-center font-black">
                {entry.rank === 1 ? (
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-xs">
                    1
                  </span>
                ) : entry.rank === 2 ? (
                  <span className="w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-xs">
                    2
                  </span>
                ) : entry.rank === 3 ? (
                  <span className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center shadow-xs">
                    3
                  </span>
                ) : (
                  entry.rank
                )}
              </div>

              <div className="flex-1 px-2 min-w-0">
                <div className="font-black text-[#2D2A26] truncate">{entry.fleetName}</div>
                <div className="text-[10px] text-[#8C8479] flex items-center gap-1.5">
                  <span className="text-indigo-600 font-extrabold">{entry.title}</span>
                  <span>·</span>
                  <span>{entry.wins}승 {entry.losses}패</span>
                </div>
              </div>

              <div className="w-14 text-center font-mono font-black text-indigo-700">
                {entry.bestTurns}턴
              </div>

              <div className="w-16 text-right font-mono font-black text-amber-600">
                {entry.rating.toLocaleString()}P
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
