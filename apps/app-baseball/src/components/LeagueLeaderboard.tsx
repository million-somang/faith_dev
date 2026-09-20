import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award, LogIn, RefreshCw, Star } from 'lucide-react';
import axios from 'axios';
import { LeaderboardItem, TeamProfile } from '../types/baseball';

interface LeagueLeaderboardProps {
  isMember: boolean;
  profile: TeamProfile;
  onOpenTeamModal?: () => void;
}

export const LeagueLeaderboard: React.FC<LeagueLeaderboardProps> = ({ isMember, profile, onOpenTeamModal }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ success: boolean; data: LeaderboardItem[] }>('/api/games/baseball/leaderboard');
      if (res.data.success) {
        setLeaderboard(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="w-full flex flex-col gap-3 py-1">
      {/* 랭킹전 시즌 배너 */}
      <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-300/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold shadow-sm">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              2026 베라 숫자야구 정규 시즌
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500 text-white font-bold">LIVE</span>
            </h3>
            <p className="text-[10px] text-slate-500">
              산정 기준: 승률(%) &gt; 다승 &gt; 평균 소모 이닝(낮을수록 우위)
            </p>
          </div>
        </div>

        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="p-2 rounded-xl bg-white/80 text-slate-500 hover:text-slate-800 shadow-[2px_2px_5px_#cbd5e1] active:scale-95 transition-all cursor-pointer"
          title="새로고침"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 비회원 락인(Lock-in) 넛지 알림 */}
      {!isMember && (
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/70 shadow-sm flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500 text-white mt-0.5">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-indigo-900">
                🔒 현재 [게스트 연습 모드]로 진행 중입니다
              </div>
              <div className="text-[11px] text-indigo-700 leading-snug mt-0.5">
                정식 구단명을 등록하고 주간 랭킹 TOP 10 리워드 포인트에 도전하세요!
              </div>
            </div>
          </div>
          <a
            href="/app/auth/login?redirect=/app/baseball/"
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>로그인하고 구단 창단하기</span>
          </a>
        </div>
      )}

      {/* 내 구단 요약 카드 (회원인 경우) */}
      {isMember && (
        <div className="p-2.5 bg-white/90 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">내 구단 성적</div>
            <div className="font-black text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
              <span>{profile.teamName}</span>
              {onOpenTeamModal && (
                <button
                  type="button"
                  onClick={onOpenTeamModal}
                  className="px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 transition-all cursor-pointer"
                >
                  구단명 변경 ✏️
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div>
              <div className="text-[10px] text-slate-400">전적</div>
              <div className="font-bold text-slate-700">{profile.wins}승 {profile.losses}패</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">승률</div>
              <div className="font-black text-amber-600">{profile.winRate.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">완봉</div>
              <div className="font-bold text-emerald-600">{profile.shutouts}회</div>
            </div>
          </div>
        </div>
      )}

      {/* 리더보드 테이블 */}
      <div className="bg-[#f0f4f8] rounded-2xl p-2.5 shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_#ffffff] border border-white/60">
        <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-500 border-b border-slate-200/80 mb-1">
          <div className="w-10">순위</div>
          <div className="flex-1">구단명 (구단주)</div>
          <div className="w-16 text-right">승률</div>
          <div className="w-16 text-right">전적(승/패)</div>
          <div className="w-12 text-right">평균이닝</div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            전광판 랭킹 데이터를 불러오는 중입니다...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            아직 이번 시즌 등록된 구단 기록이 없습니다.<br />
            첫 번째 승리로 전광판 1위에 등극하세요!
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {leaderboard.map((item) => {
              const isTop1 = item.rank === 1;
              const isTop2 = item.rank === 2;
              const isTop3 = item.rank === 3;

              return (
                <div
                  key={item.userId}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all ${
                    isTop1
                      ? 'bg-amber-100/90 border border-amber-300 shadow-sm font-bold'
                      : isTop2
                      ? 'bg-slate-200/80 border border-slate-300'
                      : isTop3
                      ? 'bg-orange-100/70 border border-orange-200'
                      : 'bg-white/80 border border-slate-100'
                  }`}
                >
                  {/* 순위 마크 */}
                  <div className="w-10 flex items-center">
                    {isTop1 ? (
                      <span className="flex items-center gap-1 text-amber-600 font-black">
                        <Medal className="w-4 h-4 fill-amber-500 text-amber-600" />
                        1
                      </span>
                    ) : isTop2 ? (
                      <span className="flex items-center gap-1 text-slate-600 font-black">
                        <Medal className="w-4 h-4 fill-slate-400 text-slate-600" />
                        2
                      </span>
                    ) : isTop3 ? (
                      <span className="flex items-center gap-1 text-amber-700 font-black">
                        <Award className="w-4 h-4 text-amber-700" />
                        3
                      </span>
                    ) : (
                      <span className="font-bold text-slate-500 pl-1">{item.rank}</span>
                    )}
                  </div>

                  {/* 구단명 */}
                  <div className="flex-1 truncate pr-2">
                    <span className="font-bold text-slate-800">{item.teamName}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({item.playerName})</span>
                    {item.shutouts > 0 && (
                      <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-700 border border-emerald-300">
                        완봉 {item.shutouts}
                      </span>
                    )}
                  </div>

                  {/* 승률 */}
                  <div className="w-16 text-right font-mono font-bold text-amber-600">
                    {Number(item.winRate || 0).toFixed(1)}%
                  </div>

                  {/* 전적 */}
                  <div className="w-16 text-right font-mono text-slate-600">
                    {item.wins}승 {item.losses}패
                  </div>

                  {/* 평균이닝 */}
                  <div className="w-12 text-right font-mono text-slate-500 text-[11px]">
                    {Number(item.avgInnings || 0).toFixed(1)}회
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
