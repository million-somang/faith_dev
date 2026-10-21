import React, { useState } from 'react';
import { BarChart3, Sparkles, Volume2, VolumeX, Zap } from 'lucide-react';
import { MatchType, SkillDama, SpinOffset, TrickShotPreset } from '../types/billiards';
import { getSkillProfile, TRICK_SHOT_PRESETS } from '../engine/physicsEngine';
import { assetManager } from '../engine/assets';
import { sound } from '../utils/sound';
import { ClothTheme } from '../hooks/useBilliardsGame';

interface CompactShotControlsProps {
  isSimulating: boolean;
  matchType: MatchType;
  currentPlayer: 1 | 2;
  playerDama: SkillDama;
  aimAngleDeg: number;
  power: number;
  spin: SpinOffset;
  chalkLevel: number;
  clothTheme: ClothTheme;
  activePresetId: string | null;
  onChangeAimAngle: (deg: number) => void;
  onChangePower: (pwr: number) => void;
  onChangeSpin: (spin: SpinOffset) => void;
  onApplyChalk: () => void;
  onApplyPreset: (preset?: TrickShotPreset) => void;
  onExecuteStroke: () => void;
  onOpenReportModal: () => void;
  onToggleClothTheme: () => void;
}

export const CompactShotControls: React.FC<CompactShotControlsProps> = ({
  isSimulating,
  matchType,
  currentPlayer,
  playerDama,
  aimAngleDeg,
  power,
  spin,
  chalkLevel,
  clothTheme,
  activePresetId,
  onChangeAimAngle,
  onChangePower,
  onChangeSpin,
  onApplyChalk,
  onApplyPreset,
  onExecuteStroke,
  onOpenReportModal,
  onToggleClothTheme,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted());
  const chalkSrc = assetManager.getAssetUrl('/assets/sprites/chalk_cube.png');
  const disabled = isSimulating || (matchType === 'ai' && currentPlayer === 2);
  const skillProfile = getSkillProfile(playerDama);

  const handleDialInteraction = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    const mag = Math.hypot(nx, ny);
    const limit = skillProfile.maxTipOffset;
    const clampedX = mag > limit ? (nx / mag) * limit : nx;
    const clampedY = mag > limit ? (ny / mag) * limit : ny;
    onChangeSpin({
      x: Number(clampedX.toFixed(2)),
      y: Number(clampedY.toFixed(2)),
    });
  };

  const adjustAngle = (delta: number) => {
    if (disabled) return;
    let next = aimAngleDeg + delta;
    if (next > 180) next -= 360;
    if (next < -180) next += 360;
    onChangeAimAngle(Number(next.toFixed(1)));
  };

  const getSpinDescription = (): string => {
    const vLabel =
      spin.y > 0.25 ? '밀어치기(상단)' : spin.y < -0.25 ? '끌어치기(하단)' : '중단';
    const hLabel =
      spin.x > 0.25 ? '우회전' : spin.x < -0.25 ? '좌회전' : '무회전';
    return `${vLabel} · ${hLabel}`;
  };

  return (
    <div className="bg-white rounded-2xl p-2.5 border border-[#EBE6DD] shadow-2xs space-y-2 shrink-0">
      {/* 1행: 묘수 프리셋 칩 바 + 초크 바르기 + 음소거/라사지 */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            data-screenshot-click="action"
            onClick={() => onApplyPreset()}
            disabled={disabled}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-black flex items-center gap-1 cursor-pointer transition active:scale-95 disabled:opacity-40"
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>🎯 묘수 시타 조준</span>
          </button>

          {TRICK_SHOT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset)}
              disabled={disabled}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition cursor-pointer shrink-0 ${
                activePresetId === preset.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-[#FAF8F5] text-[#7A756D] border-[#EBE6DD] hover:text-[#2D2A26]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleClothTheme}
            title="당구대 라사지 색상 전환"
            className="px-2 py-1 rounded-lg bg-[#F7F4EE] hover:bg-[#EBE6DD] border border-[#E0D9CD] text-[10px] font-bold text-[#2D2A26] cursor-pointer"
          >
            {clothTheme === 'royal-blue' ? '🟦 블루' : '🟩 그린'}
          </button>

          <button
            type="button"
            onClick={() => {
              const next = sound.toggleMute();
              setIsMuted(next);
            }}
            aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
            className="p-1.5 rounded-lg bg-[#F7F4EE] hover:bg-[#EBE6DD] border border-[#E0D9CD] text-[#2D2A26] cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
          </button>
        </div>
      </div>

      {/* 2행: 좌측 당점(English) 다이얼 & 초크 + 우측 각도 미세조절 & 파워 슬라이더 */}
      <div className="grid grid-cols-12 gap-2.5 items-center bg-[#FAF8F5] p-2 rounded-xl border border-[#EBE6DD]">
        {/* 좌측 5컬럼: 3D 당점(Spin) 다이얼 + 초크 큐브 버튼 */}
        <div className="col-span-5 flex items-center gap-2 border-r border-[#EBE6DD] pr-2">
          <div className="relative shrink-0">
            <svg
              viewBox="0 0 76 76"
              onPointerDown={handleDialInteraction}
              onPointerMove={(e) => {
                if (e.buttons === 1) handleDialInteraction(e);
              }}
              className="w-16 h-16 rounded-full cursor-pointer touch-none shadow-sm border border-[#E0D9CD] bg-white"
              aria-label="당점 조절 다이얼"
            >
              <defs>
                <radialGradient id="spinBallGrad" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="70%" stopColor="#F5F2EB" />
                  <stop offset="100%" stopColor="#CBD5E1" />
                </radialGradient>
              </defs>
              <circle cx="38" cy="38" r="35" fill="url(#spinBallGrad)" />
              {/* 십자 기준선 & 다마수별 유효 당점 한계원 */}
              <line x1="38" y1="6" x2="38" y2="70" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="6" y1="38" x2="70" y2="38" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2 2" />
              <circle
                cx="38"
                cy="38"
                r={Math.round(25 * skillProfile.maxTipOffset)}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="1"
                strokeDasharray="3 2"
                opacity="0.7"
              />

              {/* 선택된 당점 타겟 포인트 */}
              <circle
                cx={38 + spin.x * 24}
                cy={38 - spin.y * 24}
                r="5.5"
                fill="#2563EB"
                stroke="#FFFFFF"
                strokeWidth="1.8"
              />
            </svg>
          </div>

          <div className="flex flex-col justify-between min-w-0 flex-1 space-y-1">
            <div>
              <div className="text-[10px] font-black text-[#2D2A26] truncate">
                {getSpinDescription()}
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-extrabold text-blue-700">
                  구질 {Math.round(skillProfile.spinScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => onChangeSpin({ x: 0, y: 0 })}
                  className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  초기화
                </button>
              </div>
            </div>

            {/* 나노바나나 초크 바르기 버튼 */}
            <button
              type="button"
              onClick={onApplyChalk}
              title="초크를 발라 미스큐(삑사리)를 방지합니다"
              className={`w-full px-1.5 py-1 rounded-lg border text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 ${
                chalkLevel < 35
                  ? 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
                  : 'bg-white border-[#E0D9CD] text-[#2D2A26] hover:bg-blue-50'
              }`}
            >
              <img src={chalkSrc} alt="초크" className="w-3.5 h-3.5 object-contain" />
              <span>초크 {chalkLevel}%</span>
            </button>
          </div>
        </div>

        {/* 우측 7컬럼: 정밀 각도 조절 버튼 + 스트로크 파워 슬라이더 */}
        <div className="col-span-7 space-y-2">
          {/* 미세 각도 조절 */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-extrabold text-[#7A756D] shrink-0">미세각도</span>
            <div className="flex items-center gap-1">
              {[
                { label: '-2°', val: -2 },
                { label: '-0.3°', val: -0.3 },
                { label: '+0.3°', val: 0.3 },
                { label: '+2°', val: 2 },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  disabled={disabled}
                  onClick={() => adjustAngle(btn.val)}
                  className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 border border-[#E0D9CD] text-[10px] font-mono font-bold text-[#2D2A26] cursor-pointer active:scale-95 disabled:opacity-40"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* 파워 게이지 슬라이더 */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px] font-extrabold">
              <span className="text-[#7A756D]">스트로크 파워</span>
              <span className="text-blue-700 font-mono">{power}%</span>
            </div>
            <input
              type="range"
              min={15}
              max={100}
              value={power}
              disabled={disabled}
              data-screenshot-input="75"
              aria-label="스트로크 파워 조절"
              onChange={(e) => onChangePower(Number(e.target.value))}
              className="w-full h-2 bg-[#E5DEC9] rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>

      {/* 3행: 메인 스트로크 타격 CTA + 경기 분석 리포트 버튼 (`data-screenshot-click="result"`) */}
      <div className="grid grid-cols-12 gap-2">
        <button
          type="button"
          onClick={() => onExecuteStroke()}
          disabled={disabled}
          className="col-span-8 h-9.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-98 disabled:opacity-50"
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>
            {isSimulating
              ? '공 구르는 중...'
              : matchType === 'ai' && currentPlayer === 2
              ? 'AI 스트로크 준비 중...'
              : '🎱 큐 스트로크 샷! (SHOT)'}
          </span>
        </button>

        <button
          type="button"
          data-screenshot-click="result"
          onClick={onOpenReportModal}
          className="col-span-4 h-9.5 rounded-xl bg-[#F7F4EE] hover:bg-[#EBE6DD] border border-[#E0D9CD] text-[#2D2A26] font-black text-xs flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          <span>스코어 리포트</span>
        </button>
      </div>
    </div>
  );
};
