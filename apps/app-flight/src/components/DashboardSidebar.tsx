import React from 'react';
import { GameEngineState } from '../engine/types';
import { getDifficultyScale } from '../engine/gameLoop';
import {
  Trophy,
  Zap,
  RotateCw,
  Bomb,
  Crosshair,
  Shield,
  Layers,
  Keyboard,
  Info,
  ShieldAlert,
  Flame,
} from 'lucide-react';

interface DashboardSidebarProps {
  state: GameEngineState | null;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ state }) => {
  const score = state?.player.score || 0;
  const stage = state?.stage || 1;
  const hp = state?.player.hp ?? 100;
  const maxHp = state?.player.maxHp || 100;
  const kills = state?.player.kills || 0;
  const weaponLevel = state?.player.weaponLevel || 1;
  const missileLevel = state?.player.missileLevel || 0;
  const plasmaLevel = state?.player.plasmaLevel || 0;
  const upgradePoints = state?.player.upgradePoints || 0;
  const hasEscorts = state?.player.hasEscorts || false;
  const rolls = state?.player.rolls || 0;
  const bombs = state?.player.bombs || 0;
  const nextBossScore = state?.nextBossScore || 2200;

  const diff = getDifficultyScale(stage);
  const remainToBoss = Math.max(0, nextBossScore - score);

  const weaponTiers = [
    { level: 1, name: '단발 기관총', desc: '전방 단발 고속 탄환' },
    { level: 2, name: '트윈 캐논', desc: '좌우 2열 평행 사격' },
    { level: 3, name: '3-Way 스프레드', desc: '부채꼴 3방향 확산탄' },
    { level: 4, name: '헤비 발칸포', desc: '4열 초강력 집중 화력' },
  ];

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* 1. 비행 전황 종합 스코어보드 */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#EBE6DD] shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#7A756D] flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            비행 전황 스코어
          </span>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            실시간 연동
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-[#F7F4EE] border border-[#EBE6DD]">
            <span className="text-[10px] text-[#8A847A] block font-medium">현재 스테이지</span>
            <span className="text-lg font-black font-mono text-indigo-700 tracking-tight">
              {stage} <span className="text-xs text-[#8A847A]">/ 99</span>
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#F7F4EE] border border-[#EBE6DD]">
            <span className="text-[10px] text-[#8A847A] block font-medium">현재 점수</span>
            <span className="text-lg font-black font-mono text-sky-700 tracking-tight">
              {score.toLocaleString()}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#F7F4EE] border border-[#EBE6DD]">
            <span className="text-[10px] text-[#8A847A] block font-medium">기체 내구도(HP)</span>
            <span className="text-lg font-black font-mono text-emerald-600 tracking-tight">
              {hp} <span className="text-xs text-[#8A847A]">/ {maxHp}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 1.5. 실시간 스테이지 위험도 & 난이도 배율 (Stage 1 ~ 99) */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#EBE6DD] shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-[#2D2A26] flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            STAGE {stage}/99 난이도 배율
          </span>
          <span
            className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${
              diff.rank === 'HELL'
                ? 'bg-red-50 border-red-400 text-red-700 animate-pulse'
                : diff.rank === 'EXPERT'
                ? 'bg-orange-50 border-orange-300 text-orange-700'
                : diff.rank === 'HARD'
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : diff.rank === 'NORMAL+'
                ? 'bg-sky-50 border-sky-300 text-sky-700'
                : 'bg-emerald-50 border-emerald-300 text-emerald-700'
            }`}
          >
            RANK {diff.rankLevel} [{diff.rank}]
          </span>
        </div>

        {/* 4대 배율 매트릭스 */}
        <div className="grid grid-cols-2 gap-1.5 text-center mb-2">
          <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
            <span className="text-[10px] text-[#8A847A] block font-medium">적 스폰 빈도</span>
            <span className="text-sm font-black font-mono text-red-600">
              {diff.spawnRateMultiplier.toFixed(2)}x
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
            <span className="text-[10px] text-[#8A847A] block font-medium">적 탄환 속도</span>
            <span className="text-sm font-black font-mono text-orange-600">
              {diff.bulletSpeedMultiplier.toFixed(2)}x
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
            <span className="text-[10px] text-[#8A847A] block font-medium">적 사격 주기</span>
            <span className="text-sm font-black font-mono text-amber-600">
              {diff.shootRateMultiplier.toFixed(2)}x
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD]">
            <span className="text-[10px] text-[#8A847A] block font-medium">적 내구도(HP)</span>
            <span className="text-sm font-black font-mono text-indigo-600">
              {diff.enemyHpMultiplier.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* 스테이지 보스 출현 안내 */}
        <div className="p-2 rounded-xl bg-[#F7F4EE] border border-[#EBE6DD] flex items-center justify-between text-[11px]">
          <span className="text-[#7A756D] font-medium flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            {state?.bossActive
              ? `STAGE ${stage} 보스 교전 중! (격파 시 STAGE ${Math.min(99, stage + 1)} 진급)`
              : `STAGE ${stage} 보스 출현까지`}
          </span>
          {!state?.bossActive && (
            <span className="font-mono font-bold text-sky-700">
              {remainToBoss > 0 ? `+${remainToBoss.toLocaleString()}점 남음` : '곧 출현!'}
            </span>
          )}
        </div>
      </div>

      {/* 2. 주무기 업그레이드 트리 (4단계) */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#EBE6DD] shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-[#2D2A26] flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
            무기 업그레이드 트리 (P 아이템)
          </span>
          <span className="text-xs font-black text-amber-700 font-mono">
            LV.{weaponLevel} / 4
          </span>
        </div>

        <div className="space-y-1.5">
          {weaponTiers.map((tier) => {
            const isActive = weaponLevel === tier.level;
            const isUnlocked = weaponLevel >= tier.level;

            return (
              <div
                key={tier.level}
                className={`p-2 rounded-xl border transition flex items-center justify-between ${
                  isActive
                    ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                    : isUnlocked
                    ? 'bg-[#FAF8F5] border-[#EBE6DD]'
                    : 'bg-[#F7F4EE] border-[#ECE7DE] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                      isActive
                        ? 'bg-amber-500 text-white'
                        : isUnlocked
                        ? 'bg-stone-300 text-stone-700'
                        : 'bg-stone-200 text-stone-400'
                    }`}
                  >
                    {tier.level}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-[#2D2A26] block leading-tight">
                      {tier.name}
                    </span>
                    <span className="text-[10px] text-[#7A756D]">{tier.desc}</span>
                  </div>
                </div>
                {isActive && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white animate-pulse">
                    장착 중
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 호위기(L) 상태 표시 */}
        <div
          className={`mt-2 p-2 rounded-xl border flex items-center justify-between transition ${
            hasEscorts
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-[#F7F4EE] border-[#ECE7DE] text-[#8A847A]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-xs font-bold block leading-tight">호위기 편대 (L 아이템)</span>
              <span className="text-[10px] text-[#7A756D]">
                {hasEscorts ? '양 날개 2기 동반 비행 및 협공 중' : '미장착 (빨간 편대 전멸 시 획득)'}
              </span>
            </div>
          </div>
          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
              hasEscorts ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-500'
            }`}
          >
            {hasEscorts ? '활성' : '비활성'}
          </span>
        </div>

        {/* 보조 특수 무기 (M 유도 미사일 / W 플라즈마 캐논) */}
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <div
            className={`p-2 rounded-xl border flex items-center justify-between ${
              missileLevel > 0
                ? 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-900'
                : 'bg-[#F7F4EE] border-[#ECE7DE] text-[#8A847A]'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold block leading-tight">🚀 유도탄 (M)</span>
              <span className="text-[9px] text-[#7A756D]">
                {missileLevel > 0 ? '적기 자동 추적' : '미장착'}
              </span>
            </div>
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono ${
                missileLevel > 0 ? 'bg-fuchsia-600 text-white' : 'bg-stone-200 text-stone-500'
              }`}
            >
              LV.{missileLevel}/3
            </span>
          </div>

          <div
            className={`p-2 rounded-xl border flex items-center justify-between ${
              plasmaLevel > 0
                ? 'bg-sky-50 border-sky-300 text-sky-900'
                : 'bg-[#F7F4EE] border-[#ECE7DE] text-[#8A847A]'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold block leading-tight">⚡ 플라즈마 (W)</span>
              <span className="text-[9px] text-[#7A756D]">
                {plasmaLevel > 0 ? '고화력 에너지포' : '미장착'}
              </span>
            </div>
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono ${
                plasmaLevel > 0 ? 'bg-sky-600 text-white' : 'bg-stone-200 text-stone-500'
              }`}
            >
              LV.{plasmaLevel}/3
            </span>
          </div>
        </div>

        {/* 격추 포인트 (개조 포인트 KP) */}
        <div className="mt-2 p-2 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-900 block leading-tight">
              🔧 격납고 개조 포인트 (KP)
            </span>
            <span className="text-[9px] text-amber-700">보스 격파 시 기체·무기 개조에 사용</span>
          </div>
          <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-amber-500 text-white">
            {upgradePoints} KP
          </span>
        </div>
      </div>

      {/* 3. 특수 생존 기동 게이지 */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#EBE6DD] shadow-2xs">
        <span className="text-xs font-bold text-[#2D2A26] flex items-center gap-1.5 mb-2.5">
          <Shield className="w-4 h-4 text-sky-600" />
          특수 생존 기동 시스템
        </span>
        <div className="grid grid-cols-2 gap-2">
          {/* 360도 공중제비 롤 */}
          <div className="p-2.5 rounded-xl bg-[#F7F4EE] border border-[#EBE6DD]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#2D2A26] flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5 text-sky-600" />
                공중제비 (Z)
              </span>
              <span className="text-xs font-black text-sky-700 font-mono">{rolls} 회</span>
            </div>
            <p className="text-[10px] text-[#7A756D] leading-tight">
              1.5초 완전 무적 롤링으로 탄막 회피
            </p>
          </div>

          {/* 메가 폭탄 */}
          <div className="p-2.5 rounded-xl bg-[#F7F4EE] border border-[#EBE6DD]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#2D2A26] flex items-center gap-1">
                <Bomb className="w-3.5 h-3.5 text-amber-600" />
                메가 폭탄 (X)
              </span>
              <span className="text-xs font-black text-amber-700 font-mono">{bombs} 발</span>
            </div>
            <p className="text-[10px] text-[#7A756D] leading-tight">
              화면 전체 탄환 소거 및 400 데미지
            </p>
          </div>
        </div>

        {/* 적기 격추 수 */}
        <div className="mt-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD] text-xs">
          <span className="text-[#7A756D] font-medium flex items-center gap-1">
            <Crosshair className="w-3.5 h-3.5 text-red-500" />
            격추 킬 수
          </span>
          <span className="font-mono font-black text-red-600 text-sm">
            {kills.toLocaleString()} 기
          </span>
        </div>
      </div>

      {/* 4. 조작 가이드 & 1942 공략 팁 */}
      <div className="p-3 bg-white rounded-2xl border border-[#EBE6DD] shadow-2xs">
        <span className="text-xs font-bold text-[#2D2A26] flex items-center gap-1.5 mb-2">
          <Keyboard className="w-3.5 h-3.5 text-indigo-600" />
          단축키 & 1942 공략 비결
        </span>
        <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#5A554E] mb-2">
          <div className="flex items-center justify-between p-1.5 bg-[#FAF8F5] rounded-lg border border-[#EBE6DD]">
            <span>방향키 / WASD</span>
            <span className="font-semibold text-[#2D2A26]">8방향 이동</span>
          </div>
          <div className="flex items-center justify-between p-1.5 bg-[#FAF8F5] rounded-lg border border-[#EBE6DD]">
            <span>Space / 드래그</span>
            <span className="font-semibold text-[#2D2A26]">기관총 연사</span>
          </div>
          <div className="flex items-center justify-between p-1.5 bg-[#FAF8F5] rounded-lg border border-[#EBE6DD]">
            <span>Z / J 키</span>
            <span className="font-semibold text-sky-700">360° 공중제비</span>
          </div>
          <div className="flex items-center justify-between p-1.5 bg-[#FAF8F5] rounded-lg border border-[#EBE6DD]">
            <span>X / K 키</span>
            <span className="font-semibold text-amber-700">메가 폭탄</span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-sky-50/60 border border-sky-200 text-[10px] text-sky-900 leading-relaxed flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
          <span>
            <strong>빨간 편대 비행대(5기)</strong>를 남김없이 전원 격추하면 P, L, B 파워업 아이템이 확정 드롭됩니다!
          </span>
        </div>
      </div>
    </div>
  );
};
