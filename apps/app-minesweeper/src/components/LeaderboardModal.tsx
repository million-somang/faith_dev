import { useState, useEffect } from 'react';
import { type Difficulty, DIFFICULTY_CONFIG } from '../hooks/useMinesweeper';
import axios from 'axios';

interface LeaderboardEntry {
  id: number;
  time: number;
  created_at: string;
  email?: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  difficulty: Difficulty;
  onClose: () => void;
}

export default function LeaderboardModal({ isOpen, difficulty, onClose }: LeaderboardModalProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Difficulty>(difficulty);

  const tabs: Difficulty[] = ['beginner', 'intermediate', 'expert'];

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(difficulty);
  }, [isOpen, difficulty]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/games/minesweeper/leaderboard');
        if (res.data.success) {
          const allEntries = (res.data.leaderboard || []).map((e: any, idx: number) => {
            let time = 0;
            let diff = 'beginner';
            if (e.metadata) {
              try {
                const meta = typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata;
                time = meta.time || 0;
                diff = meta.difficulty || 'beginner';
              } catch {}
            }
            return { id: idx, time, difficulty: diff, created_at: e.created_at, email: e.email, score: e.score };
          });
          // 현재 탭 난이도로 필터
          const filtered = allEntries.filter((e: any) => e.difficulty === activeTab);
          setEntries(filtered.sort((a: any, b: any) => a.time - b.time).slice(0, 10));
        }
      } catch (err) {
        console.error('리더보드 로딩 실패:', err);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const formatTime = (time: number) => {
    return time.toFixed(1) + '초';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card bg-white rounded-2xl p-5 max-w-md w-[92%] mx-4 shadow-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            🏆 명예의 전당
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 난이도 탭 */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all cursor-pointer ${
                activeTab === t
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {DIFFICULTY_CONFIG[t].label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* 리스트 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-spin text-2xl mb-2">⏳</div>
              로딩 중...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">📭</div>
              아직 기록이 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {entries.slice(0, 10).map((entry, idx) => {
                const username = entry.email ? entry.email.split('@')[0] : '익명';
                const date = new Date(entry.created_at);
                const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                      idx < 3 ? 'bg-amber-50' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold w-8 text-center">{getMedal(idx)}</span>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{username}</div>
                        <div className="text-xs text-gray-400">{dateStr}</div>
                      </div>
                    </div>
                    <div className="font-bold text-red-600">{formatTime(entry.time)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
