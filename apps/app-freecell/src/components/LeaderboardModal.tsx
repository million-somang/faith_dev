import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, X, Clock, Award } from 'lucide-react';

interface LeaderboardItem {
  id: number;
  user_id: number;
  user_name?: string;
  score: number;
  moves: number;
  time_seconds: number;
  created_at: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [rankings, setRankings] = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      axios.get<{ success: boolean; rankings: LeaderboardItem[] }>('/api/games/freecell/leaderboard')
        .then((res) => {
          if (res.data && res.data.success) {
            setRankings(res.data.rankings || []);
          }
        })
        .catch((err) => console.error('[FreeCell Leaderboard Error]', err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">프리셀 명예의 전당</h3>
            <p className="text-xs text-emerald-400">최고 스코어 및 최단 클리어 기록</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            아직 등록된 랭킹 기록이 없습니다. 첫 번째 클리어 주인공이 되어보세요!
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
            {rankings.map((item, index) => (
              <div
                key={item.id || index}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  index === 0
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : index === 1
                    ? 'bg-slate-400/10 border-slate-400/40 text-slate-300'
                    : index === 2
                    ? 'bg-orange-500/10 border-orange-500/40 text-orange-300'
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                    index === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-bold text-sm text-white">{item.user_name || '플레이어'}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span><Award className="w-3 h-3 inline mr-0.5" />{item.moves} 이동</span>
                      <span><Clock className="w-3 h-3 inline mr-0.5" />{formatTime(item.time_seconds)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-base text-emerald-400">{item.score.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500 block">점</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
