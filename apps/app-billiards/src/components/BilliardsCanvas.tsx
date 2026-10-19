import React, { useEffect, useRef, useCallback } from 'react';
import {
  AimPrediction,
  BallId,
  BallState,
  ImpactEffect,
  MatchType,
  ShotResult,
  SpinOffset,
} from '../types/billiards';
import { BALL_RADIUS, TABLE_HEIGHT, TABLE_WIDTH } from '../engine/physicsEngine';
import { ClothTheme } from '../hooks/useBilliardsGame';

interface BilliardsCanvasProps {
  balls: BallState[];
  activeCueBallId: BallId;
  matchType: MatchType;
  isSimulating: boolean;
  currentPlayer: 1 | 2;
  aimAngleDeg: number;
  power: number;
  spin: SpinOffset;
  clothTheme: ClothTheme;
  aimPrediction: AimPrediction | null;
  impactEffects: ImpactEffect[];
  lastShotResult: ShotResult | null;
  aiComment: string;
  onChangeAimAngle: (deg: number) => void;
}

const FRAME_BORDER = 26;
const CANVAS_W = TABLE_WIDTH + FRAME_BORDER * 2; // 652
const CANVAS_H = TABLE_HEIGHT + FRAME_BORDER * 2; // 352

export const BilliardsCanvas: React.FC<BilliardsCanvasProps> = ({
  balls,
  activeCueBallId,
  matchType,
  isSimulating,
  currentPlayer,
  aimAngleDeg,
  power,
  spin,
  clothTheme,
  aimPrediction,
  impactEffects,
  lastShotResult,
  aiComment,
  onChangeAimAngle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // 마우스/터치 위치에서 수구를 기준으로 조준각 계산
  const updateAimFromClientPos = useCallback(
    (clientX: number, clientY: number) => {
      if (isSimulating || (matchType === 'ai' && currentPlayer === 2)) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cueBall = balls.find((b) => b.id === activeCueBallId);
      if (!cueBall) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;

      const tableX = (clientX - rect.left) * scaleX - FRAME_BORDER;
      const tableY = (clientY - rect.top) * scaleY - FRAME_BORDER;

      const dx = tableX - cueBall.x;
      const dy = tableY - cueBall.y;
      if (Math.hypot(dx, dy) > 4) {
        const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
        onChangeAimAngle(Number(deg.toFixed(1)));
      }
    },
    [balls, activeCueBallId, matchType, isSimulating, currentPlayer, onChangeAimAngle]
  );

  // Canvas 2D 고해상도 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // 1. 외곽 하드 메이플 원목 프레임 (밝고 따뜻한 고급 우드 톤)
    const woodGrad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
    woodGrad.addColorStop(0, '#D9A76A');
    woodGrad.addColorStop(0.5, '#C48B4E');
    woodGrad.addColorStop(1, '#A97138');
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, CANVAS_W, CANVAS_H, 18);
    ctx.fill();

    // 프레임 외곽 하이글로시 베젤 테두리
    ctx.strokeStyle = '#8C5825';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 4개 모서리 브라스(황동) 코너 캐스팅 장식
    const corners = [
      [10, 10],
      [CANVAS_W - 10, 10],
      [10, CANVAS_H - 10],
      [CANVAS_W - 10, CANVAS_H - 10],
    ];
    corners.forEach(([cx, cy]) => {
      const brassGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 14);
      brassGrad.addColorStop(0, '#FEF08A');
      brassGrad.addColorStop(1, '#CA8A04');
      ctx.fillStyle = brassGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. 다이아몬드 포인트 (Five & Half 시스템 조준점: 장축 9개, 단축 5개)
    const drawDiamond = (dx: number, dy: number) => {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#FFFBEB';
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1;
      ctx.fillRect(-3.2, -3.2, 6.4, 6.4);
      ctx.strokeRect(-3.2, -3.2, 6.4, 6.4);
      ctx.restore();
    };

    for (let i = 1; i <= 7; i++) {
      const x = FRAME_BORDER + (TABLE_WIDTH / 8) * i;
      drawDiamond(x, FRAME_BORDER * 0.48);
      drawDiamond(x, CANVAS_H - FRAME_BORDER * 0.48);
    }
    for (let j = 1; j <= 3; j++) {
      const y = FRAME_BORDER + (TABLE_HEIGHT / 4) * j;
      drawDiamond(FRAME_BORDER * 0.48, y);
      drawDiamond(CANVAS_W - FRAME_BORDER * 0.48, y);
    }

    // 3. 쿠션 고무 레일 베젤 & 당구대 라사지(천)
    ctx.save();
    ctx.translate(FRAME_BORDER, FRAME_BORDER);

    const clothGrad = ctx.createRadialGradient(
      TABLE_WIDTH * 0.5,
      TABLE_HEIGHT * 0.5,
      30,
      TABLE_WIDTH * 0.5,
      TABLE_HEIGHT * 0.5,
      TABLE_WIDTH * 0.65
    );
    if (clothTheme === 'royal-blue') {
      clothGrad.addColorStop(0, '#2563EB');
      clothGrad.addColorStop(0.7, '#1D4ED8');
      clothGrad.addColorStop(1, '#1E3A8A');
    } else {
      clothGrad.addColorStop(0, '#10B981');
      clothGrad.addColorStop(0.7, '#059669');
      clothGrad.addColorStop(1, '#065F46');
    }

    ctx.fillStyle = clothGrad;
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    // 쿠션 턱 그림자 (입체감 부여)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, TABLE_WIDTH - 6, TABLE_HEIGHT - 6);

    // 헤드라인 & 스팟 마크 (정통 캐럼 당구대 초구 포인트)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(150, 0);
    ctx.lineTo(150, TABLE_HEIGHT);
    ctx.stroke();

    const spots = [
      [150, 150],
      [150, 105],
      [150, 195],
      [450, 150],
    ];
    spots.forEach(([sx, sy]) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. 실시간 고스트볼(Ghost Ball) & 당점 분리각 가이드라인 렌더링
    if (!isSimulating && aimPrediction) {
      const { cueStart, impactPoint, hitBallId, cueDeflectEnd, targetBallEnd } = aimPrediction;

      // (1) 수구 -> 1차 충돌점 점선
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(cueStart.x, cueStart.y);
      ctx.lineTo(impactPoint.x, impactPoint.y);
      ctx.stroke();

      // (2) 고스트볼 원형 마커
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = hitBallId ? '#FDE047' : '#38BDF8';
      ctx.fillStyle = hitBallId ? 'rgba(253, 224, 71, 0.18)' : 'rgba(56, 189, 248, 0.18)';
      ctx.beginPath();
      ctx.arc(impactPoint.x, impactPoint.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // (3) 충돌 후 수구 예상 진로 (밀어치기/끌어치기/스핀 반영 - 에메랄드/시안 라인)
      ctx.setLineDash([]);
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(impactPoint.x, impactPoint.y);
      ctx.lineTo(cueDeflectEnd.x, cueDeflectEnd.y);
      ctx.stroke();

      // (4) 피격 적구 예상 진로 (오렌지/골드 라인)
      if (targetBallEnd && hitBallId) {
        const hitObj = balls.find((b) => b.id === hitBallId);
        if (hitObj) {
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(hitObj.x, hitObj.y);
          ctx.lineTo(targetBallEnd.x, targetBallEnd.y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 5. 충돌/쿠션 파티클 이펙트 렌더링
    impactEffects.forEach((ef) => {
      ctx.save();
      ctx.strokeStyle = ef.color;
      ctx.globalAlpha = Math.max(0, ef.alpha);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 6. 3D 페놀 수지 당구공 + 6점 회전 도트(Pro-Cup Dots) 렌더링
    balls.forEach((b) => {
      const r = b.radius;

      // (1) 라사지 바닥 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(b.x + 2.5, b.y + 3.5, r * 0.98, r * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();

      // (2) 구체 3D 방사형 셰이딩
      const ballGrad = ctx.createRadialGradient(
        b.x - r * 0.35,
        b.y - r * 0.35,
        r * 0.1,
        b.x,
        b.y,
        r
      );
      if (b.color === 'white') {
        ballGrad.addColorStop(0, '#FFFFFF');
        ballGrad.addColorStop(0.65, '#F8F5EE');
        ballGrad.addColorStop(1, '#CBD5E1');
      } else if (b.color === 'yellow') {
        ballGrad.addColorStop(0, '#FEF08A');
        ballGrad.addColorStop(0.6, '#FACC15');
        ballGrad.addColorStop(1, '#CA8A04');
      } else {
        ballGrad.addColorStop(0, '#FCA5A5');
        ballGrad.addColorStop(0.45, '#EF4444');
        ballGrad.addColorStop(1, '#991B1B');
      }

      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();

      // (3) 6점 회전 스팟 (공이 굴러갈 때 3D 위상에 따라 도트가 실제로 회전)
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, r - 0.5, 0, Math.PI * 2);
      ctx.clip();

      const dotColor = b.color === 'red' ? 'rgba(255,255,255,0.75)' : '#DC2626';
      const dotPhases = [
        [0, 0],
        [Math.PI / 2, 0],
        [-Math.PI / 2, 0],
        [0, Math.PI / 2],
      ];
      dotPhases.forEach(([px, py]) => {
        const ax = b.rollAngleX + px;
        const ay = b.rollAngleY + py;
        const sx = Math.sin(ax) * Math.cos(ay);
        const sy = Math.sin(ay);
        const sz = Math.cos(ax) * Math.cos(ay);
        if (sz > 0.15) {
          ctx.fillStyle = dotColor;
          ctx.beginPath();
          ctx.arc(b.x + sx * (r * 0.65), b.y + sy * (r * 0.65), 1.9 * sz, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // (4) 상단 하이글로시 광택 하이라이트
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(b.x - r * 0.32, b.y - r * 0.34, r * 0.32, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // (5) 현재 턴의 수구 외곽 포커스 링 표시
      if (!isSimulating && b.id === activeCueBallId) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r + 3.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // 7. 캐럼 큐대(Cue Stick) 렌더링 (조준 중일 때 파워에 비례해 뒤로 당겨짐)
    if (!isSimulating) {
      const cueBall = balls.find((b) => b.id === activeCueBallId);
      if (cueBall) {
        const rad = (aimAngleDeg * Math.PI) / 180;
        const pullBack = 16 + (power / 100) * 28;
        const cueLength = 155;

        ctx.save();
        ctx.translate(cueBall.x, cueBall.y);
        ctx.rotate(rad + Math.PI); // 수구 반대편에 큐대 위치

        // 당점(좌우 스핀)에 따른 미세 수평 오프셋 시각화
        const tipOffsetY = spin.x * 4.5;

        // 큐대 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.roundRect(pullBack, tipOffsetY + 2, cueLength, 5, 2);
        ctx.fill();

        // 큐대 본체 (메이플 상하대 + 흑단 인레이 하대)
        const cueGrad = ctx.createLinearGradient(pullBack, 0, pullBack + cueLength, 0);
        cueGrad.addColorStop(0, '#38BDF8'); // 블루 초크 팁
        cueGrad.addColorStop(0.025, '#FFFFFF'); // 흰색 선골(Ferrule)
        cueGrad.addColorStop(0.03, '#FDE68A'); // 버드아이 메이플 상대
        cueGrad.addColorStop(0.55, '#D97706');
        cueGrad.addColorStop(0.6, '#451A03'); // 흑단/로즈우드 하대
        cueGrad.addColorStop(1, '#1C1917');

        ctx.fillStyle = cueGrad;
        ctx.beginPath();
        ctx.moveTo(pullBack, tipOffsetY - 2.2);
        ctx.lineTo(pullBack + cueLength, tipOffsetY - 4.5);
        ctx.lineTo(pullBack + cueLength, tipOffsetY + 4.5);
        ctx.lineTo(pullBack, tipOffsetY + 2.2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }

    ctx.restore();
  }, [
    balls,
    activeCueBallId,
    isSimulating,
    aimAngleDeg,
    power,
    spin,
    clothTheme,
    aimPrediction,
    impactEffects,
  ]);

  return (
    <div className="bg-white rounded-2xl p-2 border border-[#EBE6DD] shadow-2xs space-y-1.5 shrink-0">
      {/* 당구대 캔버스 래퍼 */}
      <div className="relative w-full overflow-hidden rounded-xl shadow-inner">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={(e) => {
            isDraggingRef.current = true;
            updateAimFromClientPos(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (isDraggingRef.current) {
              updateAimFromClientPos(e.clientX, e.clientY);
            }
          }}
          onPointerUp={() => {
            isDraggingRef.current = false;
          }}
          onPointerLeave={() => {
            isDraggingRef.current = false;
          }}
          className="w-full h-auto block touch-none cursor-crosshair"
        />

        {/* 당구대 우측 상단 라사지 컬러 스위치 & 조준 각도 배지 */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-[#EBE6DD] text-[10px] font-bold text-[#2D2A26] shadow-2xs pointer-events-none">
          <span>조준각 {aimAngleDeg.toFixed(1)}°</span>
          <span>•</span>
          <span className="text-indigo-600">파워 {power}%</span>
        </div>
      </div>

      {/* 원라인 실시간 해설 / 판정 피드백 배너 */}
      <div
        className={`px-3 py-1.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors ${
          lastShotResult?.scored
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : lastShotResult?.foul
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-[#FAF8F5] border-[#EBE6DD] text-[#2D2A26]'
        }`}
      >
        <div className="truncate font-extrabold">
          {lastShotResult ? lastShotResult.headline : aiComment}
        </div>
        <span className="text-[10px] font-bold text-[#7A756D] shrink-0">
          드래그 조준
        </span>
      </div>
    </div>
  );
};
