'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { GAMES_DATA, GameItem } from '@/data/gamesData';
import { useAppLauncher } from '@/hooks/useAppLauncher';
import { recordAppUsage } from '@/hooks/useFrequentApps';

const FEATURED_GAME_SLUGS = [
  'flight',
  'janggi',
  'billiards',
  'omok',
  'sudoku',
  '2048',
  'freecell',
  'submarine',
] as const;

const GAME_ACCENT_MAP: Record<string, string> = {
  flight: 'from-rose-500 to-orange-500',
  janggi: 'from-amber-500 to-yellow-600',
  billiards: 'from-sky-500 to-blue-600',
  omok: 'from-slate-500 to-zinc-700',
  sudoku: 'from-emerald-500 to-teal-600',
  '2048': 'from-amber-400 to-orange-500',
  freecell: 'from-green-500 to-emerald-600',
  submarine: 'from-indigo-500 to-cyan-600',
};

type LeaderboardGameId = 'flight' | 'sudoku' | '2048' | 'janggi' | 'vera-pop';

const LEADERBOARD_TABS: { id: LeaderboardGameId; label: string }[] = [
  { id: 'flight', label: '베라 플라이트' },
  { id: 'sudoku', label: '스도쿠' },
  { id: '2048', label: '2048' },
  { id: 'janggi', label: '베라 장기' },
  { id: 'vera-pop', label: '베라 팝' },
];

interface LeaderboardRow {
  email?: string | null;
  score: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  created_at?: string;
}

function maskEmail(email?: string | null): string {
  if (!email) return '익명 유저';
  const local = email.split('@')[0] || '';
  if (local.length <= 2) return `${local || 'u'}***`;
  return `${local.slice(0, 2)}***`;
}

export const GameArcadeShowcase: React.FC = () => {
  const { launchApp } = useAppLauncher();
  const [activeBoard, setActiveBoard] = useState<LeaderboardGameId>('flight');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const cacheRef = useRef<Partial<Record<LeaderboardGameId, LeaderboardRow[]>>>({});

  const featuredGames: GameItem[] = FEATURED_GAME_SLUGS
    .map((slug) => GAMES_DATA[slug])
    .filter((g): g is GameItem => Boolean(g));

  const loadLeaderboard = useCallback(async (gameId: LeaderboardGameId, force = false) => {
    if (!force && cacheRef.current[gameId]) {
      setRows(cacheRef.current[gameId] ?? []);
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/games/${gameId}/leaderboard`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: LeaderboardRow[] =
        data?.success && Array.isArray(data.leaderboard) ? data.leaderboard.slice(0, 5) : [];
      cacheRef.current[gameId] = list;
      setRows(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard(activeBoard);
  }, [activeBoard, loadLeaderboard]);

  const handlePlay = (game: GameItem) => {
    recordAppUsage(game.slug);
    launchApp(game.legacyAppUrl, game.slug);
  };

  return (
    <section
      aria-label="VERA 무료 게임 아케이드 존"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-7 border border-indigo-500/25 shadow-lg"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white shadow-md shrink-0">
            <i className="fas fa-gamepad text-base sm:text-lg"></i>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                VERA 게임 아케이드
              </h2>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full font-extrabold">
                무설치 · 즉시 플레이
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-300 mt-0.5">
              카드 클릭 시 공략·규칙 보기, 플레이 버튼 클릭 시 브라우저에서 바로 실행
            </p>
          </div>
        </div>
        <Link
          href="/game"
          className="text-xs sm:text-sm font-bold text-indigo-200 hover:text-white flex items-center gap-1 transition-colors shrink-0"
        >
          <span>게임 전체보기</span>
          <i className="fas fa-chevron-right text-[10px]"></i>
        </Link>
      </div>

      {/* 대표 게임 8종 그리드 (모바일 2열 · 데스크탑 4열) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {featuredGames.map((game) => {
          const accent = GAME_ACCENT_MAP[game.slug] || 'from-indigo-500 to-blue-600';
          return (
            <article
              key={game.slug}
              className="group rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/50 p-3 flex flex-col justify-between transition-all min-w-0"
            >
              <Link href={`/game/${game.slug}`} className="block min-w-0 mb-3">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-sm shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <i className={`${game.icon} text-base`}></i>
                  </span>
                  <span className="text-[10px] font-bold text-indigo-200/90 bg-white/10 px-2 py-0.5 rounded-full truncate">
                    {game.categoryLabel}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white group-hover:text-indigo-200 line-clamp-1 mb-1">
                  {game.name.split(' (')[0]}
                </h3>
                <p className="text-[11px] text-slate-300/90 line-clamp-2 leading-relaxed">
                  {game.summary}
                </p>
              </Link>

              <button
                type="button"
                onClick={() => handlePlay(game)}
                aria-label={`${game.name} 즉시 플레이`}
                className="w-full py-1.5 px-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <i className="fas fa-play text-[9px]"></i>
                <span>즉시 플레이</span>
              </button>
            </article>
          );
        })}
      </div>

      {/* 실시간 게임별 미니 랭킹 패널 */}
      <div className="rounded-2xl bg-black/30 border border-white/10 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2">
            <i className="fas fa-trophy text-amber-400 text-sm"></i>
            <h3 className="text-xs sm:text-sm font-black text-white">실시간 명예의 전당 TOP 5</h3>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            {LEADERBOARD_TABS.map((tab) => {
              const isActive = activeBoard === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveBoard(tab.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2" aria-busy="true">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-12 rounded-xl bg-white/10 animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="py-4 text-center">
            <p className="text-xs text-slate-300 mb-2">랭킹 정보를 불러오지 못했습니다.</p>
            <button
              type="button"
              onClick={() => loadLeaderboard(activeBoard, true)}
              className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-300">
            아직 등록된 기록이 없습니다. 첫 번째 랭커에 도전해 보세요!
          </div>
        ) : (
          <ol className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {rows.map((row, index) => {
              const rank = index + 1;
              const scoreLabel =
                activeBoard === 'janggi' && typeof row.wins === 'number'
                  ? `${row.wins}승 · ${row.winRate ?? 0}%`
                  : `${Number(row.score || 0).toLocaleString()}점`;

              return (
                <li
                  key={`${activeBoard}-${rank}-${row.created_at || index}`}
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 flex sm:flex-col items-center sm:items-start justify-between gap-1 min-w-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                        rank === 1
                          ? 'bg-amber-400 text-slate-950'
                          : rank === 2
                          ? 'bg-slate-300 text-slate-900'
                          : rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-white/15 text-slate-200'
                      }`}
                    >
                      {rank}
                    </span>
                    <span className="text-xs font-bold text-slate-100 truncate">
                      {maskEmail(row.email)}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-300 tabular-nums shrink-0">
                    {scoreLabel}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
};

export default GameArcadeShowcase;
