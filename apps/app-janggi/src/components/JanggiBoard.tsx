import React from 'react';
import { Piece, Position, Side } from '../types/janggi';
import { isPalace, isPalaceCenter } from '../logic/janggiRules';

interface JanggiBoardProps {
  board: (Piece | null)[][];
  cols: number;
  rows: number;
  selectedPos: Position | null;
  validMoves: Position[];
  lastMove: { from: Position; to: Position } | null;
  isCheckSide: Side | null;
  currentTurn: Side;
  onSelectPiece: (pos: Position) => void;
  onMakeMove: (to: Position) => void;
}

// 기물 한자 표기 매핑
const PIECE_SYMBOLS: Record<string, { cho: string; han: string; label: string }> = {
  king: { cho: '楚', han: '漢', label: '궁' },
  chariot: { cho: '車', han: '車', label: '차' },
  cannon: { cho: '包', han: '包', label: '포' },
  horse: { cho: '馬', han: '馬', label: '마' },
  elephant: { cho: '象', han: '象', label: '상' },
  guard: { cho: '士', han: '士', label: '사' },
  soldier: { cho: '卒', han: '兵', label: '졸' },
};

export function JanggiBoard({
  board,
  cols,
  rows,
  selectedPos,
  validMoves,
  lastMove,
  isCheckSide,
  currentTurn,
  onSelectPiece,
  onMakeMove,
}: JanggiBoardProps) {
  // SVG 보드 좌표 계산
  const paddingX = 24;
  const paddingY = 24;
  const boardWidth = 380;
  const stepX = (boardWidth - paddingX * 2) / (cols - 1);
  const stepY = stepX; // 정방형 격자
  const boardHeight = paddingY * 2 + stepY * (rows - 1);

  const getCoord = (x: number, y: number) => ({
    cx: paddingX + x * stepX,
    cy: paddingY + y * stepY,
  });

  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col items-center select-none">
      {/* 🌟 네온 사이버 오리엔탈 장기판 컨테이너 */}
      <div className="relative p-2.5 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 shadow-2xl border-2 border-slate-700/80">
        
        {/* 장기판 보드 SVG (격자선 + 궁성 X선) */}
        <svg
          width={boardWidth}
          height={boardHeight}
          className="overflow-visible block"
          style={{ touchAction: 'none' }}
        >
          <defs>
            {/* 그리드 은은한 네온 그라데이션 */}
            <linearGradient id="gridGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.4" />
            </linearGradient>

            {/* 마지막 착수 하이라이트 펄스 */}
            <radialGradient id="moveHighlight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 보드 바탕 */}
          <rect
            x={4}
            y={4}
            width={boardWidth - 8}
            height={boardHeight - 8}
            rx={16}
            fill="#0b1120"
            stroke="#1e293b"
            strokeWidth={2}
          />

          {/* 가로선 (Ranks) */}
          {Array.from({ length: rows }).map((_, r) => {
            const y = paddingY + r * stepY;
            return (
              <line
                key={`h_${r}`}
                x1={paddingX}
                y1={y}
                x2={paddingX + (cols - 1) * stepX}
                y2={y}
                stroke="url(#gridGlow)"
                strokeWidth={1.2}
              />
            );
          })}

          {/* 세로선 (Files) */}
          {Array.from({ length: cols }).map((_, c) => {
            const x = paddingX + c * stepX;
            return (
              <line
                key={`v_${c}`}
                x1={x}
                y1={paddingY}
                x2={x}
                y2={paddingY + (rows - 1) * stepY}
                stroke="url(#gridGlow)"
                strokeWidth={1.2}
              />
            );
          })}

          {/* 초나라 궁성(X선) 대각선 */}
          {cols === 9 ? (
            <g stroke="#38bdf8" strokeWidth={1.5} opacity={0.6}>
              {/* 초(위) (3,0)-(5,2) and (5,0)-(3,2) */}
              <line
                x1={getCoord(3, 0).cx}
                y1={getCoord(3, 0).cy}
                x2={getCoord(5, 2).cx}
                y2={getCoord(5, 2).cy}
              />
              <line
                x1={getCoord(5, 0).cx}
                y1={getCoord(5, 0).cy}
                x2={getCoord(3, 2).cx}
                y2={getCoord(3, 2).cy}
              />
              {/* 한(아래) (3,7)-(5,9) and (5,7)-(3,9) */}
              <line
                x1={getCoord(3, 7).cx}
                y1={getCoord(3, 7).cy}
                x2={getCoord(5, 9).cx}
                y2={getCoord(5, 9).cy}
              />
              <line
                x1={getCoord(5, 7).cx}
                y1={getCoord(5, 7).cy}
                x2={getCoord(3, 9).cx}
                y2={getCoord(3, 9).cy}
              />
            </g>
          ) : (
            <g stroke="#38bdf8" strokeWidth={1.5} opacity={0.6}>
              {/* 7×7 미니 궁성 대각선 */}
              <line
                x1={getCoord(2, 0).cx}
                y1={getCoord(2, 0).cy}
                x2={getCoord(4, 2).cx}
                y2={getCoord(4, 2).cy}
              />
              <line
                x1={getCoord(4, 0).cx}
                y1={getCoord(4, 0).cy}
                x2={getCoord(2, 2).cx}
                y2={getCoord(2, 2).cy}
              />
              <line
                x1={getCoord(2, 4).cx}
                y1={getCoord(2, 4).cy}
                x2={getCoord(4, 6).cx}
                y2={getCoord(4, 6).cy}
              />
              <line
                x1={getCoord(4, 4).cx}
                y1={getCoord(4, 4).cy}
                x2={getCoord(2, 6).cx}
                y2={getCoord(2, 6).cy}
              />
            </g>
          )}

          {/* 마지막 수 착수 궤적 하이라이트 */}
          {lastMove && (
            <g>
              <circle
                cx={getCoord(lastMove.from.x, lastMove.from.y).cx}
                cy={getCoord(lastMove.from.x, lastMove.from.y).cy}
                r={stepX * 0.45}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                opacity={0.7}
              />
              <circle
                cx={getCoord(lastMove.to.x, lastMove.to.y).cx}
                cy={getCoord(lastMove.to.x, lastMove.to.y).cy}
                r={stepX * 0.48}
                fill="url(#moveHighlight)"
                stroke="#38bdf8"
                strokeWidth={2}
              />
            </g>
          )}

          {/* 유효 착수 가능 위치 원형 인디케이터 (Valid Moves) */}
          {validMoves.map((m, idx) => {
            const { cx, cy } = getCoord(m.x, m.y);
            const isCapture = !!board[m.y][m.x];
            return (
              <g
                key={`valid_${idx}`}
                className="cursor-pointer"
                onClick={() => onMakeMove(m)}
              >
                {/* 투명 클릭 확장 영역 */}
                <circle cx={cx} cy={cy} r={stepX * 0.48} fill="transparent" />
                
                {isCapture ? (
                  // 적 기물 포획 위치: 붉은색 링 펄스
                  <circle
                    cx={cx}
                    cy={cy}
                    r={stepX * 0.44}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    className="animate-pulse"
                  />
                ) : (
                  // 빈칸 이동: 빛나는 시안 도트
                  <circle
                    cx={cx}
                    cy={cy}
                    r={stepX * 0.16}
                    fill="#38bdf8"
                    filter="drop-shadow(0 0 6px rgba(56, 189, 248, 0.8))"
                  />
                )}
              </g>
            );
          })}

          {/* 기물 렌더링 (인터랙티브 토큰) */}
          {board.map((row, r) =>
            row.map((piece, c) => {
              if (!piece) return null;
              const { cx, cy } = getCoord(c, r);
              const isSelected = selectedPos?.x === c && selectedPos?.y === r;
              const isCho = piece.side === 'cho';
              const isKingInCheck =
                piece.type === 'king' && isCheckSide === piece.side;

              const symbolInfo = PIECE_SYMBOLS[piece.type] || {
                cho: '卒',
                han: '兵',
                label: '졸',
              };
              const textSymbol = isCho ? symbolInfo.cho : symbolInfo.han;

              // 기물 크기 (궁/차는 조금 더 큼)
              const radius =
                piece.type === 'king'
                  ? stepX * 0.46
                  : piece.type === 'chariot' || piece.type === 'cannon'
                  ? stepX * 0.43
                  : stepX * 0.41;

              return (
                <g
                  key={piece.id}
                  className="cursor-pointer transition-transform duration-150"
                  onClick={() => {
                    // 유효한 이동 위치라면 착수
                    const isTargetMove = validMoves.some(
                      vm => vm.x === c && vm.y === r
                    );
                    if (isTargetMove) {
                      onMakeMove({ x: c, y: r });
                    } else if (piece.side === currentTurn) {
                      // 아군 기물 선택
                      onSelectPiece({ x: c, y: r });
                    }
                  }}
                >
                  {/* 기물 그림자 */}
                  <circle
                    cx={cx}
                    cy={cy + 3}
                    r={radius}
                    fill="#030712"
                    opacity={0.6}
                  />

                  {/* 장군 상태 경고 펄스 링 */}
                  {isKingInCheck && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius + 4}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      className="animate-ping opacity-75"
                    />
                  )}

                  {/* 선택된 기물 하이라이트 링 */}
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius + 3}
                      fill="none"
                      stroke={isCho ? '#06b6d4' : '#f43f5e'}
                      strokeWidth={2.5}
                      className="animate-pulse"
                    />
                  )}

                  {/* 기물 본체 베이스 (오리엔탈 사이버 원판) */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={isCho ? '#0c2233' : '#2b1118'}
                    stroke={isCho ? '#06b6d4' : '#f43f5e'}
                    strokeWidth={isSelected ? 2.5 : 1.8}
                    className={isCho ? 'piece-cho' : 'piece-han'}
                  />

                  {/* 기물 안쪽 림 (Double Rim) */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius - 3}
                    fill="none"
                    stroke={isCho ? '#0891b2' : '#e11d48'}
                    strokeWidth={0.8}
                    opacity={0.6}
                  />

                  {/* 기물 한자 레이블 */}
                  <text
                    x={cx}
                    y={cy + (radius * 0.35)}
                    textAnchor="middle"
                    fill={isCho ? '#67e8f9' : '#fda4af'}
                    fontSize={radius * 1.05}
                    fontWeight="900"
                    fontFamily="'Pretendard', sans-serif"
                    style={{
                      textShadow: isCho
                        ? '0 0 10px rgba(6, 182, 212, 0.7)'
                        : '0 0 10px rgba(244, 63, 94, 0.7)',
                    }}
                  >
                    {textSymbol}
                  </text>
                </g>
              );
            })
          )}
        </svg>

        {/* 보드 하단 모드 뱃지 */}
        <div className="flex items-center justify-between w-full px-2 pt-2 text-[10px] font-mono text-slate-400">
          <span className="text-cyan-400 font-bold">● 楚 (선공)</span>
          <span>{cols === 9 ? '정규 9×10 한국 장기' : '미니 7×7 장기'}</span>
          <span className="text-rose-400 font-bold">● 漢 (후공+1.5덤)</span>
        </div>
      </div>
    </div>
  );
}
