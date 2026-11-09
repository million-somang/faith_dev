import React from 'react';
import { BattleLogItem } from '../types/submarine';

interface BattleLogProps {
  logs: BattleLogItem[];
}

export const BattleLog: React.FC<BattleLogProps> = ({ logs }) => {
  return (
    <div className="w-full bg-white rounded-2xl p-2.5 border border-[#EBE6DD] shadow-2xs space-y-1.5">
      <div className="flex items-center justify-between text-xs font-black text-[#2D2A26] pb-1 border-b border-[#F2EDE4]">
        <div className="flex items-center gap-1.5">
          <i className="fas fa-terminal text-indigo-600 text-xs"></i>
          <span>작전 교전 일지</span>
        </div>
        <span className="text-[10px] font-mono text-[#8C8479]">실시간 무전 기록</span>
      </div>

      <div className="h-28 overflow-y-auto space-y-1 pr-1 font-mono text-[11px] hide-scrollbar">
        {logs.map((log) => {
          const isPlayer = log.attacker === 'player';
          return (
            <div
              key={log.id}
              className={`p-1.5 rounded-lg flex items-center justify-between gap-1 transition-colors ${
                log.isSunk
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : log.isHit
                  ? 'bg-amber-50/80 text-amber-900 border border-amber-200/80'
                  : 'bg-[#FAF8F5] text-[#7A756D]'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                    isPlayer
                      ? 'bg-indigo-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {isPlayer ? '아군' : '적군'}
                </span>
                <span className="font-black text-[#2D2A26]">{log.coordLabel}</span>
                <span className="truncate">
                  {log.isSunk
                    ? `💥 [${log.sunkShipName}] 격침 침몰!`
                    : log.isHit
                    ? '🎯 직격 명중 (연속 턴)'
                    : '💧 빗나감 (물기둥)'}
                </span>
              </div>
              <span className="text-[9px] text-[#A39C90] shrink-0">{log.timestamp}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
