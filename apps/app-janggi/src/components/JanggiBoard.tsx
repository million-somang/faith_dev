import React, { useEffect, useState } from 'react';
import { BoardTheme, Piece, Position, Side } from '../types/janggi';

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
  playerSide?: Side;
  boardTheme?: BoardTheme;
  showKoreanSubLabel?: boolean;
  shakeTrigger?: number;
  onSelectPiece: (pos: Position) => void;
  onMakeMove: (to: Position) => void;
}

interface ThemePalette {
  outerFrameClass: string;
  innerWrapClass: string;
  footerTextClass: string;
  footerMutedClass: string;
  boardStops: [string, string, string, string];
  grainStroke: string;
  gridLine: string;
  starFill: string;
  starStroke: string;
  pieceTopStops: [string, string, string, string];
  pieceRimStops: [string, string, string];
  pieceSideFill: string;
  pieceStroke: string;
  choInk: string;
  choStroke: string;
  hanInk: string;
  hanStroke: string;
  emptyMoveFill: string;
}

const BOARD_THEMES: Record<BoardTheme, ThemePalette> = {
  classic_wood: {
    outerFrameClass:
      'bg-gradient-to-br from-[#dfb984] via-[#cb9d66] to-[#b38249] border-[#e9cfab]',
    innerWrapClass: 'bg-[#f6ebda]',
    footerTextClass: 'text-[#5c3c1f]',
    footerMutedClass: 'text-[#785331]',
    boardStops: ['#faeedb', '#f4e4cb', '#ebd6b8', '#f3e2c6'],
    grainStroke: '#b98b55',
    gridLine: '#2c170d',
    starFill: '#422513',
    starStroke: '#faeedb',
    pieceTopStops: ['#ffffff', '#fcf8f0', '#f3ebd9', '#e7dcbe'],
    pieceRimStops: ['#d9c39f', '#ba9d73', '#8f734b'],
    pieceSideFill: '#866740',
    pieceStroke: '#8c683b',
    choInk: '#065f46',
    choStroke: '#044432',
    hanInk: '#991b1b',
    hanStroke: '#7f1d1d',
    emptyMoveFill: '#059669',
  },
  royal_ebony: {
    outerFrameClass:
      'bg-gradient-to-br from-[#4b2e1e] via-[#2e1b11] to-[#1a0f09] border-[#d4af37]',
    innerWrapClass: 'bg-[#261810]',
    footerTextClass: 'text-[#f3dec0]',
    footerMutedClass: 'text-[#d4af37]',
    boardStops: ['#382317', '#2f1d13', '#26170f', '#311f15'],
    grainStroke: '#573624',
    gridLine: '#d4af37',
    starFill: '#e6c665',
    starStroke: '#26170f',
    pieceTopStops: ['#fffdf8', '#f8efe0', '#eadbc0', '#d8c39f'],
    pieceRimStops: ['#e3c995', '#be9b5e', '#806233'],
    pieceSideFill: '#6b4e26',
    pieceStroke: '#7d5f32',
    choInk: '#047857',
    choStroke: '#064e3b',
    hanInk: '#b91c1c',
    hanStroke: '#7f1d1d',
    emptyMoveFill: '#10b981',
  },
  night_ink: {
    outerFrameClass:
      'bg-gradient-to-br from-[#334155] via-[#1e293b] to-[#0f172a] border-[#64748b]',
    innerWrapClass: 'bg-[#0f172a]',
    footerTextClass: 'text-slate-200',
    footerMutedClass: 'text-slate-400',
    boardStops: ['#1e293b', '#172234', '#0f172a', '#162033'],
    grainStroke: '#334155',
    gridLine: '#94a3b8',
    starFill: '#cbd5e1',
    starStroke: '#0f172a',
    pieceTopStops: ['#ffffff', '#f8fafc', '#e2e8f0', '#cbd5e1'],
    pieceRimStops: ['#cbd5e1', '#94a3b8', '#64748b'],
    pieceSideFill: '#475569',
    pieceStroke: '#64748b',
    choInk: '#059669',
    choStroke: '#065f46',
    hanInk: '#dc2626',
    hanStroke: '#991b1b',
    emptyMoveFill: '#34d399',
  },
};

// 기물 한자 및 한글 보조 표기 매핑 (정통 한국 장기 서체)
const PIECE_SYMBOLS: Record<
  string,
  { cho: string; han: string; koCho: string; koHan: string }
> = {
  king: { cho: '楚', han: '漢', koCho: '궁', koHan: '궁' },
  chariot: { cho: '車', han: '車', koCho: '차', koHan: '차' },
  cannon: { cho: '包', han: '包', koCho: '포', koHan: '포' },
  horse: { cho: '馬', han: '馬', koCho: '마', koHan: '마' },
  elephant: { cho: '象', han: '象', koCho: '상', koHan: '상' },
  guard: { cho: '士', han: '士', koCho: '사', koHan: '사' },
  soldier: { cho: '卒', han: '兵', koCho: '졸', koHan: '병' },
};

const SPARK_DIRECTIONS = [
  { tx: '0px', ty: '-26px', color: '#f59e0b' },
  { tx: '19px', ty: '-19px', color: '#ef4444' },
  { tx: '26px', ty: '0px', color: '#fbbf24' },
  { tx: '19px', ty: '19px', color: '#dc2626' },
  { tx: '0px', ty: '26px', color: '#f59e0b' },
  { tx: '-19px', ty: '19px', color: '#ef4444' },
  { tx: '-26px', ty: '0px', color: '#fbbf24' },
  { tx: '-19px', ty: '-19px', color: '#dc2626' },
];

// 8각형 정점 좌표 계산 (한국 전통 장기알의 깎인 모서리)
function getOctagonPoints(cx: number, cy: number, r: number): string {
  const cut = r * 0.38;
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
  playerSide = 'cho',
  boardTheme = 'classic_wood',
  showKoreanSubLabel = false,
  shakeTrigger = 0,
  onSelectPiece,
  onMakeMove,
}: JanggiBoardProps) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (shakeTrigger <= 0) return;
    setIsShaking(true);
    const timer = window.setTimeout(() => setIsShaking(false), 290);
    return () => window.clearTimeout(timer);
  }, [shakeTrigger]);

  const theme = BOARD_THEMES[boardTheme] || BOARD_THEMES.classic_wood;
  const isFlipped = playerSide === 'han';

  // SVG 보드 좌표 계산
  const paddingX = 24;
  const paddingY = 24;
  const boardWidth = 380;
  const stepX = (boardWidth - paddingX * 2) / (cols - 1);
  const stepY = stepX;
  const boardHeight = paddingY * 2 + stepY * (rows - 1);

  const getCoord = (x: number, y: number) => {
    const rx = isFlipped ? cols - 1 - x : x;
    const ry = isFlipped ? rows - 1 - y : y;
    return {
      cx: paddingX + rx * stepX,
      cy: paddingY + ry * stepY,
    };
  };

  // 화점(Star points) 좌표 정의
  const starPoints =
    cols === 9
      ? [
          { x: 1, y: 2 },
          { x: 7, y: 2 },
          { x: 0, y: 3 },
          { x: 2, y: 3 },
          { x: 4, y: 3 },
          { x: 6, y: 3 },
          { x: 8, y: 3 },
          { x: 1, y: 7 },
          { x: 7, y: 7 },
          { x: 0, y: 6 },
          { x: 2, y: 6 },
          { x: 4, y: 6 },
          { x: 6, y: 6 },
          { x: 8, y: 6 },
        ]
      : [
          { x: 1, y: 1 },
          { x: 5, y: 1 },
          { x: 1, y: 5 },
          { x: 5, y: 5 },
        ];

  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col items-center select-none">
      {/* 테마별 원목·흑단·야간 대국실 장기판 프레임 */}
      <div
        className={`relative p-2 sm:p-2.5 rounded-3xl shadow-xl border-4 transition-colors duration-300 ${
          theme.outerFrameClass
        } ${isShaking ? 'animate-board-shake' : ''}`}
      >
        {/* 장기판 내부 실선 보드 */}
        <div className={`rounded-2xl overflow-hidden shadow-inner ${theme.innerWrapClass}`}>
          <svg
            width={boardWidth}
            height={boardHeight}
            className="overflow-visible block"
            style={{ touchAction: 'none' }}
          >
            <defs>
              {/* 테마 바탕 그라데이션 */}
              <linearGradient id="boardWoodGrain" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={theme.boardStops[0]} />
                <stop offset="40%" stopColor={theme.boardStops[1]} />
                <stop offset="75%" stopColor={theme.boardStops[2]} />
                <stop offset="100%" stopColor={theme.boardStops[3]} />
              </linearGradient>

              {/* 은은한 나뭇결 패턴 */}
              <pattern
                id="woodGrainPattern"
                width="120"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M0 6 Q30 3 60 6 T120 6"
                  fill="none"
                  stroke={theme.grainStroke}
                  strokeWidth="0.7"
                  opacity="0.14"
                />
                <path
                  d="M0 16 Q40 19 80 15 T120 17"
                  fill="none"
                  stroke={theme.grainStroke}
                  strokeWidth="0.6"
                  opacity="0.11"
                />
              </pattern>

              {/* 보드 테두리 베벨 그림자 */}
              <linearGradient id="boardBorderShade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.22" />
                <stop offset="6%" stopColor="#000000" stopOpacity="0.03" />
                <stop offset="94%" stopColor="#000000" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.24" />
              </linearGradient>

              {/* 장기알 상단 천연 원목 질감 */}
              <linearGradient id="pieceWoodTop" x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0%" stopColor={theme.pieceTopStops[0]} />
                <stop offset="35%" stopColor={theme.pieceTopStops[1]} />
                <stop offset="80%" stopColor={theme.pieceTopStops[2]} />
                <stop offset="100%" stopColor={theme.pieceTopStops[3]} />
              </linearGradient>

              {/* 장기알 외곽 베벨 테두리 */}
              <linearGradient id="pieceRimBevel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={theme.pieceRimStops[0]} />
                <stop offset="50%" stopColor={theme.pieceRimStops[1]} />
                <stop offset="100%" stopColor={theme.pieceRimStops[2]} />
              </linearGradient>

              {/* 장기알 옻칠 상단 광택 하이라이트 */}
              <linearGradient id="pieceLacquerGloss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
                <stop offset="55%" stopColor="#ffffff" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              {/* 기물 바닥 투하 그림자 필터 */}
              <filter id="pieceDropShadow" x="-30%" y="-30%" width="160%" height="180%">
                <feDropShadow
                  dx="1"
                  dy="4"
                  stdDeviation="2.6"
                  floodColor="#1a0f08"
                  floodOpacity="0.38"
                />
              </filter>

              {/* 마지막 착수 하이라이트 펄스 */}
              <radialGradient id="lastMoveGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* 1. 보드 바탕 목판 + 나뭇결 */}
            <rect x={0} y={0} width={boardWidth} height={boardHeight} fill="url(#boardWoodGrain)" />
            <rect x={0} y={0} width={boardWidth} height={boardHeight} fill="url(#woodGrainPattern)" />
            <rect x={0} y={0} width={boardWidth} height={boardHeight} fill="url(#boardBorderShade)" />

            {/* 2. 외곽 테두리 굵은 선 */}
            <rect
              x={paddingX}
              y={paddingY}
              width={(cols - 1) * stepX}
              height={(rows - 1) * stepY}
              fill="none"
              stroke={theme.gridLine}
              strokeWidth={2.4}
              strokeLinecap="square"
            />

            {/* 3. 가로선 (Ranks) */}
            {Array.from({ length: rows }).map((_, r) => {
              const y = paddingY + r * stepY;
              return (
                <line
                  key={`h_${r}`}
                  x1={paddingX}
                  y1={y}
                  x2={paddingX + (cols - 1) * stepX}
                  y2={y}
                  stroke={theme.gridLine}
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  opacity={0.92}
                />
              );
            })}

            {/* 4. 세로선 (Files) */}
            {Array.from({ length: cols }).map((_, c) => {
              const x = paddingX + c * stepX;
              return (
                <line
                  key={`v_${c}`}
                  x1={x}
                  y1={paddingY}
                  x2={x}
                  y2={paddingY + (rows - 1) * stepY}
                  stroke={theme.gridLine}
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  opacity={0.92}
                />
              );
            })}

            {/* 5. 궁성(X선) 대각선 */}
            {cols === 9 ? (
              <g stroke={theme.gridLine} strokeWidth={1.75} strokeLinecap="round" opacity={0.92}>
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
              <g stroke={theme.gridLine} strokeWidth={1.75} strokeLinecap="round" opacity={0.92}>
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

            {/* 6. 화점(花點) 마커 */}
            {starPoints.map((pt, idx) => {
              const { cx, cy } = getCoord(pt.x, pt.y);
              return (
                <circle
                  key={`star_${idx}`}
                  cx={cx}
                  cy={cy}
                  r={3.2}
                  fill={theme.starFill}
                  stroke={theme.starStroke}
                  strokeWidth={0.8}
                />
              );
            })}

            {/* 7. 마지막 수 착수 궤적 & 쇼크웨이브 & 포획 파편 파티클 */}
            {lastMove && (() => {
              const movedPiece = board[lastMove.to.y][lastMove.to.x];
              const p1 = getCoord(lastMove.from.x, lastMove.from.y);
              const p2 = getCoord(lastMove.to.x, lastMove.to.y);
              const isCannon = movedPiece?.type === 'cannon';
              const isChariot = movedPiece?.type === 'chariot';
              const isKnightLike = movedPiece?.type === 'horse' || movedPiece?.type === 'elephant';
              const midX = (p1.cx + p2.cx) / 2;
              const midY = (p1.cy + p2.cy) / 2 - 28;
              const windMidY = (p1.cy + p2.cy) / 2 - 14;

              return (
                <g key={`move_${lastMove.from.x}_${lastMove.from.y}_${lastMove.to.x}_${lastMove.to.y}`}>
                  {/* 출발지 잔상 원 */}
                  <circle
                    cx={p1.cx}
                    cy={p1.cy}
                    r={stepX * 0.42}
                    fill="none"
                    stroke={isCannon ? '#e11d48' : '#d97706'}
                    strokeWidth={1.8}
                    strokeDasharray="4 3"
                    opacity={0.75}
                  />

                  {/* 기물별 이동 궤적 */}
                  {isCannon ? (
                    <path
                      d={`M ${p1.cx} ${p1.cy} Q ${midX} ${midY} ${p2.cx} ${p2.cy}`}
                      fill="none"
                      stroke="#e11d48"
                      strokeWidth={3}
                      strokeDasharray="6 3"
                      className="animate-trail-flow"
                      opacity={0.92}
                    />
                  ) : isChariot ? (
                    <g>
                      <line
                        x1={p1.cx}
                        y1={p1.cy}
                        x2={p2.cx}
                        y2={p2.cy}
                        stroke="#f59e0b"
                        strokeWidth={4.5}
                        strokeLinecap="round"
                        opacity={0.38}
                      />
                      <line
                        x1={p1.cx}
                        y1={p1.cy}
                        x2={p2.cx}
                        y2={p2.cy}
                        stroke="#fbbf24"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeDasharray="8 4"
                        className="animate-trail-flow"
                        opacity={0.95}
                      />
                    </g>
                  ) : isKnightLike ? (
                    <path
                      d={`M ${p1.cx} ${p1.cy} Q ${midX} ${windMidY} ${p2.cx} ${p2.cy}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      strokeDasharray="5 4"
                      className="animate-trail-flow"
                      opacity={0.85}
                    />
                  ) : (
                    <line
                      x1={p1.cx}
                      y1={p1.cy}
                      x2={p2.cx}
                      y2={p2.cy}
                      stroke="#d97706"
                      strokeWidth={2.4}
                      strokeDasharray="6 4"
                      className="animate-trail-flow"
                      opacity={0.82}
                    />
                  )}

                  {/* 착수점 충격파 리플 */}
                  <circle
                    cx={p2.cx}
                    cy={p2.cy}
                    className="animate-shockwave pointer-events-none"
                    fill="none"
                    stroke={lastMoveIsCapture ? '#dc2626' : isCannon ? '#e11d48' : '#f59e0b'}
                  />

                  {/* 적 기물 포획 시 격파 버스트 + 8방향 파편 파티클 */}
                  {lastMoveIsCapture && (
                    <g className="pointer-events-none">
                      <g className="animate-capture-burst">
                        <circle
                          cx={p2.cx}
                          cy={p2.cy}
                          r={stepX * 0.58}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth={2.5}
                          strokeDasharray="5 3"
                        />
                        <polygon
                          points={getOctagonPoints(p2.cx, p2.cy, stepX * 0.42)}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth={1.8}
                          opacity={0.85}
                        />
                      </g>
                      {SPARK_DIRECTIONS.map((spark, sIdx) => (
                        <circle
                          key={`spark_${sIdx}`}
                          cx={p2.cx}
                          cy={p2.cy}
                          r={3.2}
                          fill={spark.color}
                          className="animate-spark-out"
                          style={{
                            ['--tx' as string]: spark.tx,
                            ['--ty' as string]: spark.ty,
                          }}
                        />
                      ))}
                    </g>
                  )}

                  {/* 도착점 하이라이트 글로우 링 */}
                  <circle
                    cx={p2.cx}
                    cy={p2.cy}
                    r={stepX * 0.48}
                    fill="url(#lastMoveGlow)"
                    stroke={lastMoveIsCapture ? '#dc2626' : isCannon ? '#e11d48' : '#f59e0b'}
                    strokeWidth={2.2}
                  />
                </g>
              );
            })()}

            {/* 8. 유효 착수 가능 위치 인디케이터 */}
            {validMoves.map((m, idx) => {
              const { cx, cy } = getCoord(m.x, m.y);
              const isCapture = !!board[m.y][m.x];
              return (
                <g
                  key={`valid_${idx}`}
                  className="cursor-pointer"
                  onClick={() => onMakeMove(m)}
                >
                  <circle cx={cx} cy={cy} r={stepX * 0.48} fill="transparent" />
                  {isCapture ? (
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
                    <circle
                      cx={cx}
                      cy={cy}
                      r={stepX * 0.18}
                      fill={theme.emptyMoveFill}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  )}
                </g>
              );
            })}

            {/* 9. 3D 옻칠 8각 원목 장기알 렌더링 */}
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
                  koCho: '졸',
                  koHan: '병',
                };
                const textSymbol = isCho ? symbolInfo.cho : symbolInfo.han;
                const koSubLabel = isCho ? symbolInfo.koCho : symbolInfo.koHan;

                const radius =
                  piece.type === 'king'
                    ? stepX * 0.47
                    : piece.type === 'chariot' || piece.type === 'cannon'
                    ? stepX * 0.43
                    : piece.type === 'horse' || piece.type === 'elephant'
                    ? stepX * 0.41
                    : stepX * 0.38;

                const sideOctagonPoints = getOctagonPoints(cx, cy + 3.2, radius);
                const octagonPoints = getOctagonPoints(cx, cy, radius);
                const innerOctagonPoints = getOctagonPoints(cx, cy, radius - 2.4);

                const isJustDropped = lastMove?.to.x === c && lastMove?.to.y === r;
                let pieceGroupClass = 'cursor-pointer select-none';
                let pieceInlineStyle: React.CSSProperties = {
                  transformOrigin: `${cx}px ${cy}px`,
                };

                if (isJustDropped && lastMove) {
                  const fromCoord = getCoord(lastMove.from.x, lastMove.from.y);
                  const deltaX = fromCoord.cx - cx;
                  const deltaY = fromCoord.cy - cy;
                  pieceGroupClass += ' animate-piece-glide-drop';
                  pieceInlineStyle = {
                    ...pieceInlineStyle,
                    ['--from-dx' as string]: `${deltaX}px`,
                    ['--from-dy' as string]: `${deltaY}px`,
                  };
                } else if (isSelected) {
                  pieceGroupClass += ' piece-lifted';
                }

                return (
                  <g
                    key={piece.id}
                    className={pieceGroupClass}
                    style={pieceInlineStyle}
                    onClick={() => {
                      const isTargetMove = validMoves.some(
                        (vm) => vm.x === c && vm.y === r
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
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius * 1.38}
                          fill="none"
                          stroke="#dc2626"
                          strokeWidth={3}
                          className="animate-beacon-sonar"
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius + 4}
                          fill="rgba(220, 38, 38, 0.25)"
                          stroke="#b91c1c"
                          strokeWidth={2.5}
                          className="animate-ping"
                        />
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
                        r={radius + 4.5}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        className="animate-pulse"
                      />
                    )}

                    {/* C. 3D 8각 장기알 본체 (입체 두께 측면 + 베벨 + 옻칠 표면) */}
                    <g filter="url(#pieceDropShadow)">
                      {/* 3D 하단 입체 두께 측면 */}
                      <polygon
                        points={sideOctagonPoints}
                        fill={theme.pieceSideFill}
                        stroke={theme.pieceStroke}
                        strokeWidth={0.8}
                        strokeLinejoin="round"
                      />
                      {/* 외곽 8각 베벨 림 */}
                      <polygon
                        points={octagonPoints}
                        fill="url(#pieceRimBevel)"
                        stroke={theme.pieceStroke}
                        strokeWidth={1}
                        strokeLinejoin="round"
                      />
                      {/* 상단 8각 원목 표면 */}
                      <polygon
                        points={innerOctagonPoints}
                        fill="url(#pieceWoodTop)"
                        stroke="#dfcdb0"
                        strokeWidth={0.8}
                        strokeLinejoin="round"
                      />
                      {/* 상단 옻칠 광택 하이라이트 */}
                      <ellipse
                        cx={cx}
                        cy={cy - radius * 0.28}
                        rx={radius * 0.56}
                        ry={radius * 0.26}
                        fill="url(#pieceLacquerGloss)"
                      />
                    </g>

                    {/* D. 안쪽 얇은 원목 각인 테두리선 */}
                    <polygon
                      points={getOctagonPoints(cx, cy, radius - 4.4)}
                      fill="none"
                      stroke={isCho ? theme.choInk : theme.hanInk}
                      strokeWidth={0.85}
                      opacity={0.38}
                    />

                    {/* E. 정통 붓글씨 서예 옻칠 각인 한자 */}
                    <text
                      x={cx}
                      y={showKoreanSubLabel ? cy + radius * 0.16 : cy + radius * 0.36}
                      textAnchor="middle"
                      fill={isCho ? theme.choInk : theme.hanInk}
                      fontSize={showKoreanSubLabel ? radius * 0.88 : radius * 1.06}
                      fontWeight="900"
                      fontFamily="'Pretendard Variable', 'Batang', 'Song Myung', serif"
                      style={{
                        letterSpacing: '-0.02em',
                        paintOrder: 'stroke fill',
                        stroke: isCho ? theme.choStroke : theme.hanStroke,
                        strokeWidth: 0.3,
                        filter: 'drop-shadow(0 1px 0.5px rgba(255,255,255,0.7))',
                      }}
                    >
                      {textSymbol}
                    </text>

                    {/* F. 옵션: 한글 보조 표기 */}
                    {showKoreanSubLabel && (
                      <text
                        x={cx}
                        y={cy + radius * 0.64}
                        textAnchor="middle"
                        fill={isCho ? theme.choInk : theme.hanInk}
                        fontSize={Math.max(7.2, radius * 0.36)}
                        fontWeight="800"
                        opacity={0.85}
                      >
                        {koSubLabel}
                      </text>
                    )}
                  </g>
                );
              })
            )}
          </svg>
        </div>

        {/* 하단 진영 안내 바 (테마에 동적 적응) */}
        <div
          className={`flex items-center justify-between pt-2 px-1 text-[11px] font-bold ${theme.footerTextClass}`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                playerSide === 'cho' ? 'bg-emerald-500' : 'bg-rose-500'
              } shadow-xs`}
            />
            <span className="font-black">
              내 진영: {playerSide === 'cho' ? '楚 (하단 선공)' : '漢 (하단 후공 +1.5점)'}
            </span>
          </div>
          <div className={`text-[10px] font-mono tracking-tight ${theme.footerMutedClass}`}>
            {cols === 9 ? '정규 9×10 한국 장기' : '7×7 미니 장기'}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-black">
              컴퓨터: {playerSide === 'cho' ? '漢 (상단 후공 +1.5점)' : '楚 (상단 선공)'}
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                playerSide === 'cho' ? 'bg-rose-500' : 'bg-emerald-500'
              } shadow-xs`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
