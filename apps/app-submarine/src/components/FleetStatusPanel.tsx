import React from 'react';
import { PlacedShip } from '../types/submarine';

interface FleetStatusPanelProps {
  playerFleet: PlacedShip[];
  aiFleet: PlacedShip[];
}

export const FleetStatusPanel: React.FC<FleetStatusPanelProps> = ({
  playerFleet,
  aiFleet,
}) => {
  const playerSurviving = playerFleet.filter((s) => !s.isSunk).length;
  const aiSurviving = aiFleet.filter((s) => !s.isSunk).length;

  return (
    <div className="w-full bg-white rounded-2xl p-2.5 border border-[#EBE6DD] shadow-2xs space-y-2">
      <div className="flex items-center justify-between text-xs font-black text-[#2D2A26] pb-1 border-b border-[#F2EDE4]">
        <div className="flex items-center gap-1.5">
          <i className="fas fa-shield text-indigo-600"></i>
          <span>아군 함대 잔존 ({playerSurviving}/5)</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-600">
          <i className="fas fa-crosshairs"></i>
          <span>적 함대 격침 ({5 - aiSurviving}/5)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {/* 아군 함대 현황 */}
        <div className="space-y-1 bg-[#FAF8F5] p-2 rounded-xl border border-[#EBE6DD]">
          <span className="text-[10px] font-black text-[#7A756D] uppercase block">
            아군 기동 전대
          </span>
          {playerFleet.map((ship) => (
            <div key={ship.id} className="flex items-center justify-between gap-1">
              <span className={`truncate max-w-[70px] ${ship.isSunk ? 'text-slate-400 line-through' : 'font-bold text-[#2D2A26]'}`}>
                {ship.name.replace('핵추진 ', '').replace('중장갑 ', '').replace('유도탄 ', '').replace('공격 ', '').replace('고속 ', '')}
              </span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: ship.size }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-sm ${
                      idx < ship.hits
                        ? 'bg-rose-500 shadow-2xs'
                        : ship.isSunk
                        ? 'bg-slate-300'
                        : 'bg-indigo-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 적 함대 현황 */}
        <div className="space-y-1 bg-[#FAF8F5] p-2 rounded-xl border border-[#EBE6DD]">
          <span className="text-[10px] font-black text-[#7A756D] uppercase block">
            적군 미확인 편대
          </span>
          {aiFleet.map((ship) => (
            <div key={ship.id} className="flex items-center justify-between gap-1">
              <span className={`truncate max-w-[70px] ${ship.isSunk ? 'text-rose-500 font-black line-through' : 'font-bold text-[#2D2A26]'}`}>
                {ship.name.replace('핵추진 ', '').replace('중장갑 ', '').replace('유도탄 ', '').replace('공격 ', '').replace('고속 ', '')}
              </span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: ship.size }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-sm ${
                      ship.isSunk
                        ? 'bg-rose-600 shadow-2xs'
                        : idx < ship.hits
                        ? 'bg-amber-500'
                        : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
