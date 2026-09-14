import React from 'react';
import { Piece, Position, Side } from '../types/janggi';
import { isPalace } from '../logic/janggiRules';

interface JanggiBoardProps {
  board: (Piece | null)[][];
  cols: number;
  rows: number;
  selectedPos: Position | null;
  validMoves: Position[];
  lastMove: { from: Position; to: Position } | null;
  lastMoveIsCapture?: boolean;
  isCheckSide: Side | null;
  currentTurn: Side;
  onSelectPiece: (pos: Position) => void;
  onMakeMove: (to: Position) => void;
}

// 기물 한자 표기 매핑 (정통 한국 장기 서체)
const PIECE_SYMBOLS: Record<string, { cho: string; han: string; label: string }> = {
  king: { cho: '楚', han: '漢', label: '궁' },
  chariot: { cho: '車', han: '車', label: '차' },
  cannon: { cho: '包', han: '包', label: '포' },
  horse: { cho: '馬', han: '馬', label: '마' },
  elephant: { cho: '象', han: '象', label: '상' },
  guard: { cho: '士', han: '士', label: '사' },
  soldier: { cho: '卒', han: '兵', label: '졸' },
};

// 8각형 정점 좌표 계산 (한국 전통 장기알의 깎인 모서리)
function getOctagonPoints(cx: number, cy: number, r: number): string {
  const cut = r * 0.38; // 모서리 깎임 비율
  const p1 = `${cx - r + cut},${cy - r}`;
  const p2 = `${cx + r - cut},${cy - r}`;
  const p3 = `${cx + r},${cy - r + cut}`;
  const p4 = `${cx + r},${cy + r - cut}`;
  const p5 = `${cx + r - cut},${cy + r}`;
  const p6 = `${cx - r + cut},${cy + r}`;
  const p7 = `${cx - r},${cy + r - cut}`;
  const p8 = `${cx - r},${cy - r + cut}`;
  return `${p1} ${p2} ${p3} ${p4} ${p5} ${p6} ${p7} ${p8}`;
}

export function JanggiBoard({
  board,
  cols,
  rows,
  selectedPos,
  validMoves,
  lastMove,
  lastMoveIsCapture = false,
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

  // 화점(Star points) 좌표 정의 (한국 정통 장기 규격: 졸/병 5개 위치 및 포 2개 위치)
  const starPoints =
    cols === 9
      ? [
          // 초나라 진영 (상단)
          { x: 1, y: 2 }, // 좌 포
          { x: 7, y: 2 }, // 우 포
          { x: 0, y: 3 }, // 졸 1
          { x: 2, y: 3 }, // 졸 2
          { x: 4, y: 3 }, // 졸 3 (중앙)
          { x: 6, y: 3 }, // 졸 4
          { x: 8, y: 3 }, // 졸 5
          // 한나라 진영 (하단)
          { x: 1, y: 7 }, // 좌 포
          { x: 7, y: 7 }, // 우 포
          { x: 0, y: 6 }, // 병 1
          { x: 2, y: 6 }, // 병 2
          { x: 4, y: 6 }, // 병 3 (중앙)
          { x: 6, y: 6 }, // 병 4
          { x: 8, y: 6 }, // 병 5
        ]
      : [
          { x: 1, y: 1 },
          { x: 5, y: 1 },
          { x: 1, y: 5 },
          { x: 5, y: 5 },
        ];

  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col items-center select-none">
      {/* 🪵 최고급 천연 비자목(원목) 장기판 컨테이너 (밝은 뉴모피즘 + 우드 몰딩) */}
      <div className="relative p-2 sm:p-2.5 rounded-3xl bg-gradient-to-br from-[#dfb984] via-[#cb9d66] to-[#b38249] shadow-xl border-4 border-[#e9cfab]">
        
        {/* 장기판 원목 내부 음영 및 실선 보드 */}
        <div className="rounded-2xl overflow-hidden shadow-inner bg-[#f6ebda]">
          <svg
            width={boardWidth}
            height={boardHeight}
            className="overflow-visible block"
            style={{ touchAction: 'none' }}
          >
            <defs>
              {/* 천연 비자목 황금빛 나뭇결 그라데이션 */}
              <linearGradient id="boardWoodGrain" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#faeedb" />
                <stop offset="40%" stopColor="#f4e4cb" />
                <stop offset="75%" stopColor="#ebd6b8" />
                <stop offset="100%" stopColor="#f3e2c6" />
              </linearGradient>

              {/* 보드 테두리 베벨 그림자 */}
              <linearGradient id="boardBorderShade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8d6032" stopOpacity="0.4" />
                <stop offset="5%" stopColor="#8d6032" stopOpacity="0.05" />
                <stop offset="95%" stopColor="#8d6032" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#8d6032" stopOpacity="0.4" />
              </linearGradient>

              {/* 장기알 공통 우드 질감 (밝은 회백색 천연 원목) */}
              <linearGradient id="pieceWoodTop" x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#fcf8f0" />
                <stop offset="80%" stopColor="#f3ebd9" />
                <stop offset="100%" stopColor="#e7dcbe" />
              </linearGradient>

              {/* 장기알 외곽 베벨 테두리 */}
              <linearGradient id="pieceRimBevel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d9c39f" />
                <stop offset="50%" stopColor="#ba9d73" />
                <stop offset="100%" stopColor="#8f734b" />
              </linearGradient>

              {/* 기물 바닥 투하 그림자 필터 */}
              <filter id="pieceDropShadow" x="-30%" y="-30%" width="160%" height="170%">
                <feDropShadow dx="1" dy="3.5" stdDeviation="2.5" floodColor="#5c3c1f" floodOpacity="0.35" />
              </filter>

              {/* 마지막 착수 하이라이트 펄스 */}
              <radialGradient id="lastMoveGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* 1. 보드 바탕 목판 */}
            <rect
              x={0}
              y={0}
              width={boardWidth}
              height={boardHeight}
              fill="url(#boardWoodGrain)"
            />
            {/* 보드 가장자리 안쪽 음영 */}
            <rect
              x={0}
              y={0}
              width={boardWidth}
              height={boardHeight}
              fill="url(#boardBorderShade)"
            />

            {/* 2. 외곽 테두리 굵은 먹선 (외곽선 2.4px) */}
            <rect
              x={paddingX}
              y={paddingY}
              width={(cols - 1) * stepX}
              height={(rows - 1) * stepY}
              fill="none"
              stroke="#2c170d"
              strokeWidth={2.4}
              strokeLinecap="square"
            />

            {/* 3. 가로선 (Ranks) - 선명한 흑갈색 먹물선 1.8px */}
            {Array.from({ length: rows }).map((_, r) => {
              const y = paddingY + r * stepY;
              return (
                <line
                  key={`h_${r}`}
                  x1={paddingX}
                  y1={y}
                  x2={paddingX + (cols - 1) * stepX}
                  y2={y}
                  stroke="#2c170d"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              );
            })}

            {/* 4. 세로선 (Files) - 선명한 흑갈색 먹물선 1.8px */}
            {Array.from({ length: cols }).map((_, c) => {
              const x = paddingX + c * stepX;
              return (
                <line
                  key={`v_${c}`}
                  x1={x}
                  y1={paddingY}
                  x2={x}
                  y2={paddingY + (rows - 1) * stepY}
                  stroke="#2c170d"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              );
            })}

            {/* 5. 궁성(X선) 대각선 - 선명한 흑갈색 먹물선 1.8px */}
            {cols === 9 ? (
              <g stroke="#2c170d" strokeWidth={1.8} strokeLinecap="round">
                {/* 초나라 궁성 (위) (3,0)-(5,2) and (5,0)-(3,2) */}
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
                {/* 한나라 궁성 (아래) (3,7)-(5,9) and (5,7)-(3,9) */}
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
              // 7×7 미니 장기 궁성
              <g stroke="#2c170d" strokeWidth={1.8} strokeLinecap="round">
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

            {/* 6. 화점(花點, Star points) 마커 (한국 정통 장기판 표시점) */}
            {starPoints.map((pt, idx) => {
              const { cx, cy } = getCoord(pt.x, pt.y);
              return (
                <circle
                  key={`star_${idx}`}
                  cx={cx}
                  cy={cy}
                  r={3.2}
                  fill="#422513"
                  stroke="#faeedb"
                  strokeWidth={0.8}
                />
              );
            })}

            {/* 7. 마지막 수 착수 궤적 & 쇼크웨이브 & 포획 애니메이션 */}
            {lastMove && (
              <g key={`move_${lastMove.from.x}_${lastMove.from.y}_${lastMove.to.x}_${lastMove.to.y}`}>
                {/* 출발지 잔상 원 */}
                <circle
                  cx={getCoord(lastMove.from.x, lastMove.from.y).cx}
                  cy={getCoord(lastMove.from.x, lastMove.from.y).cy}
                  r={stepX * 0.42}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth={1.8}
                  strokeDasharray="4 3"
                  opacity={0.7}
                />

                {/* 이동 궤적 애니메이션 흐름 점선 */}
                <line
                  x1={getCoord(lastMove.from.x, lastMove.from.y).cx}
                  y1={getCoord(lastMove.from.x, lastMove.from.y).cy}
                  x2={getCoord(lastMove.to.x, lastMove.to.y).cx}
                  y2={getCoord(lastMove.to.x, lastMove.to.y).cy}
                  stroke="#d97706"
                  strokeWidth={2.4}
                  strokeDasharray="6 4"
                  className="animate-trail-flow"
                  opacity={0.8}
                />

                {/* 착수점 황금빛 충격파 리플 */}
                <circle
                  cx={getCoord(lastMove.to.x, lastMove.to.y).cx}
                  cy={getCoord(lastMove.to.x, lastMove.to.y).cy}
                  className="animate-shockwave pointer-events-none"
                  fill="none"
                  stroke={lastMoveIsCapture ? '#dc2626' : '#f59e0b'}
                />

                {/* 적 기물 포획 시 격파 버스트 이펙트 */}
                {lastMoveIsCapture && (
                  <g className="animate-capture-burst pointer-events-none">
                    <circle
                      cx={getCoord(lastMove.to.x, lastMove.to.y).cx}
                      cy={getCoord(lastMove.to.x, lastMove.to.y).cy}
                      r={stepX * 0.58}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      strokeDasharray="5 3"
                    />
                    <polygon
                      points={getOctagonPoints(
                        getCoord(lastMove.to.x, lastMove.to.y).cx,
                        getCoord(lastMove.to.x, lastMove.to.y).cy,
                        stepX * 0.42
                      )}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={1.8}
                      opacity={0.85}
                    />
                  </g>
                )}

                {/* 도착점 하이라이트 글로우 링 */}
                <circle
                  cx={getCoord(lastMove.to.x, lastMove.to.y).cx}
                  cy={getCoord(lastMove.to.x, lastMove.to.y).cy}
                  r={stepX * 0.48}
                  fill="url(#lastMoveGlow)"
                  stroke={lastMoveIsCapture ? '#dc2626' : '#f59e0b'}
                  strokeWidth={2.2}
                />
              </g>
            )}

            {/* 8. 유효 착수 가능 위치 원형 인디케이터 (Valid Moves) */}
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
                    // 적 기물 포획 위치: 강렬한 루비 레드 링 펄스
                    <circle
                      cx={cx}
                      cy={cy}
                      r={stepX * 0.46}
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth={3}
                      className="animate-pulse"
                    />
                  ) : (
                    // 빈칸 이동: 부드러운 에메랄드/그린 도트
                    <circle
                      cx={cx}
                      cy={cy}
                      r={stepX * 0.18}
                      fill="#059669"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  )}
                </g>
              );
            })}

            {/* 9. 정통 3D 8각 장기알 렌더링 (전통 한국 목기물) */}
            {board.map((row, r) =>
              row.map((piece, c) => {
                if (!piece) return null;
                const { cx, cy } = getCoord(c, r);
                const isSelected = selectedPos?.x === c && selectedPos?.y === r;
                const isCho = piece.side === 'cho';
                const isKingInCheck = piece.type === 'king' && isCheckSide === piece.side;

                const symbolInfo = PIECE_SYMBOLS[piece.type] || {
                  cho: '卒',
                  han: '兵',
                  label: '졸',
                };
                const textSymbol = isCho ? symbolInfo.cho : symbolInfo.han;

                // 기물 크기 위계 (궁 > 차/포 > 마/상 > 사/졸/병)
                const radius =
                  piece.type === 'king'
                    ? stepX * 0.47 // 궁: 가장 큰 대형 알
                    : piece.type === 'chariot' || piece.type === 'cannon'
                    ? stepX * 0.43 // 차/포: 중대형
                    : piece.type === 'horse' || piece.type === 'elephant'
                    ? stepX * 0.41 // 마/상: 중형
                    : stepX * 0.38; // 사/졸/병: 소형

                // 8각형 외형 정점 문자열
                const octagonPoints = getOctagonPoints(cx, cy, radius);
                const innerOctagonPoints = getOctagonPoints(cx, cy, radius - 2.5);

                const isJustDropped = lastMove?.to.x === c && lastMove?.to.y === r;
                let pieceGroupClass = 'cursor-pointer select-none';
                if (isJustDropped) {
                  pieceGroupClass += ' animate-piece-drop';
                }
                if (isSelected) {
                  pieceGroupClass += ' piece-lifted';
                }

                return (
                  <g
                    key={piece.id}
                    className={pieceGroupClass}
                    style={{
                      transformOrigin: `${cx}px ${cy}px`,
                    }}
                    onClick={() => {
                      const isTargetMove = validMoves.some(
                        vm => vm.x === c && vm.y === r
                      );
                      if (isTargetMove) {
                        onMakeMove({ x: c, y: r });
                      } else if (piece.side === currentTurn) {
                        onSelectPiece({ x: c, y: r });
                      }
                    }}
                  >
                    {/* A. 장군(Check) 상태 위험 소나 비콘 및 뱃지 */}
                    {isKingInCheck && (
                      <g className="pointer-events-none">
                        {/* 외부 확장 소나 비콘 */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius * 1.38}
                          fill="none"
                          stroke="#dc2626"
                          strokeWidth={3}
                          className="animate-beacon-sonar"
                        />
                        {/* 내부 적색 펄스 링 */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius + 4}
                          fill="rgba(220, 38, 38, 0.25)"
                          stroke="#b91c1c"
                          strokeWidth={2.5}
                          className="animate-ping"
                        />
                        {/* 왕 머리 위 경고 뱃지 */}
                        <g transform={`translate(${cx}, ${cy - radius - 14})`}>
                          <rect
                            x={-20}
                            y={-9}
                            width={40}
                            height={18}
                            rx={9}
                            fill="#dc2626"
                            stroke="#ffffff"
                            strokeWidth={1.2}
                            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.35))"
                          />
                          <text
                            x={0}
                            y={4}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={10}
                            fontWeight="900"
                            fontFamily="sans-serif"
                          >
                            장군!
                          </text>
                        </g>
                      </g>
                    )}

                    {/* B. 선택된 기물 골든 엠보스 링 */}
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 4}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        className="animate-pulse"
                      />
                    )}

                    {/* C. 3D 8각 장기알 본체 (지면 그림자 포함) */}
                    <g filter="url(#pieceDropShadow)">
                      {/* 외곽 8각 베벨 림 (원목 깎임 측면) */}
                      <polygon
                        points={octagonPoints}
                        fill="url(#pieceRimBevel)"
                        stroke="#8c683b"
                        strokeWidth={1}
                        strokeLinejoin="round"
                      />

                      {/* 상단 8각 원목 표면 (밝은 아이보리 원목) */}
                      <polygon
                        points={innerOctagonPoints}
                        fill="url(#pieceWoodTop)"
                        stroke="#dfcdb0"
                        strokeWidth={0.8}
                        strokeLinejoin="round"
                      />
                    </g>

                    {/* D. 안쪽 얇은 원목 각인 테두리선 */}
                    <polygon
                      points={getOctagonPoints(cx, cy, radius - 4.5)}
                      fill="none"
                      stroke={isCho ? '#0d7a5b' : '#c2410c'}
                      strokeWidth={0.8}
                      opacity={0.35}
                    />

                    {/* E. 정통 붓글씨 서예 옻칠 각인 한자 (초: 짙은 청록 비취색, 한: 짙은 주사 진홍색) */}
                    <text
                      x={cx}
                      y={cy + radius * 0.36}
                      textAnchor="middle"
                      fill={isCho ? '#065f46' : '#991b1b'}
                      fontSize={radius * 1.06}
                      fontWeight="900"
                      fontFamily="'Pretendard Variable', 'Batang', 'Song Myung', serif"
                      style={{
                        letterSpacing: '-0.02em',
                        paintOrder: 'stroke fill',
                        stroke: isCho ? '#044432' : '#7f1d1d',
                        strokeWidth: 0.3,
                        filter: isCho
                          ? 'drop-shadow(0 1px 0.5px rgba(255,255,255,0.7))'
                          : 'drop-shadow(0 1px 0.5px rgba(255,255,255,0.7))',
                      }}
                    >
                      {textSymbol}
                    </text>
                  </g>
                );
              })
            )}
          </svg>
        </div>

        {/* 하단 진영 안내 바 (밝은 우드톤) */}
        <div className="flex items-center justify-between pt-2 px-1 text-[11px] font-bold text-[#5c3c1f]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shadow-xs" />
            <span className="text-[#065f46] font-black">내 진영: 楚 (하단 선공)</span>
          </div>
          <div className="text-[10px] text-[#785331] font-mono tracking-tight">
            {cols === 9 ? '정규 9×10 한국 장기' : '7×7 미니 장기'}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#991b1b] font-black">컴퓨터: 漢 (상단 후공 +1.5점)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] shadow-xs" />
          </div>
        </div>
      </div>
    </div>
  );
}
