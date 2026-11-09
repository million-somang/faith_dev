import { useState, useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  BattleLogItem,
  CellStatus,
  DifficultyLevel,
  FLEET_DEFINITIONS,
  GamePhase,
  GridCell,
  PlacedShip,
  ShipType,
  TurnOwner,
} from '../types/submarine';
import { navalSound } from '../utils/sound';

const GRID_SIZE = 10;
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

function coordToLabel(x: number, y: number): string {
  const row = ROW_LABELS[y] || '?';
  const col = x + 1;
  return `${row}-${col}`;
}

function createEmptyGrid(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ x, y, status: 'empty' });
    }
    grid.push(row);
  }
  return grid;
}

/**
 * 10x10 격자 내에 5척의 함대를 겹치지 않게 무작위 배치
 */
function generateRandomFleet(): { fleet: PlacedShip[]; grid: GridCell[][] } {
  const grid = createEmptyGrid();
  const fleet: PlacedShip[] = [];

  for (const def of FLEET_DEFINITIONS) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 200) {
      attempts++;
      const isHorizontal = Math.random() < 0.5;
      const x = Math.floor(Math.random() * (isHorizontal ? GRID_SIZE - def.size + 1 : GRID_SIZE));
      const y = Math.floor(Math.random() * (isHorizontal ? GRID_SIZE : GRID_SIZE - def.size + 1));

      const cells: { x: number; y: number }[] = [];
      let canPlace = true;

      for (let i = 0; i < def.size; i++) {
        const cx = isHorizontal ? x + i : x;
        const cy = isHorizontal ? y : y + i;

        if (grid[cy][cx].status !== 'empty') {
          canPlace = false;
          break;
        }
        cells.push({ x: cx, y: cy });
      }

      if (canPlace) {
        const shipId = `${def.type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        cells.forEach((c) => {
          grid[c.y][c.x] = {
            ...grid[c.y][c.x],
            status: 'ship',
            shipId,
          };
        });

        fleet.push({
          id: shipId,
          type: def.type,
          name: def.name,
          size: def.size,
          cells,
          hits: 0,
          isSunk: false,
          direction: isHorizontal ? 'horizontal' : 'vertical',
        });
        placed = true;
      }
    }
  }

  return { fleet, grid };
}

export function useSubmarineGame() {
  const [playerGrid, setPlayerGrid] = useState<GridCell[][]>(() => createEmptyGrid());
  const [aiGrid, setAiGrid] = useState<GridCell[][]>(() => createEmptyGrid());
  const [playerFleet, setPlayerFleet] = useState<PlacedShip[]>([]);
  const [aiFleet, setAiFleet] = useState<PlacedShip[]>([]);

  const [turn, setTurn] = useState<TurnOwner>('player');
  const [gamePhase, setGamePhase] = useState<GamePhase>('battle');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('captain');
  const [turnCount, setTurnCount] = useState<number>(1);

  const [playerHits, setPlayerHits] = useState<number>(0);
  const [playerMisses, setPlayerMisses] = useState<number>(0);
  const [aiHits, setAiHits] = useState<number>(0);
  const [aiMisses, setAiMisses] = useState<number>(0);

  const [sonarCharges, setSonarCharges] = useState<number>(1);
  const [isSonarActive, setIsSonarActive] = useState<boolean>(false);
  const [consecutiveHits, setConsecutiveHits] = useState<number>(0);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [battleLogs, setBattleLogs] = useState<BattleLogItem[]>([]);
  const [isResultModalOpen, setIsResultModalOpen] = useState<boolean>(false);

  // 사운드 음소거 상태
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      navalSound.setMuted(next);
      return next;
    });
  }, []);

  // 게임 초기화
  const initGame = useCallback(() => {
    const pSetup = generateRandomFleet();
    const aSetup = generateRandomFleet();

    setPlayerFleet(pSetup.fleet);
    setPlayerGrid(pSetup.grid);

    setAiFleet(aSetup.fleet);
    setAiGrid(aSetup.grid);

    setTurn('player');
    setGamePhase('battle');
    setTurnCount(1);
    setPlayerHits(0);
    setPlayerMisses(0);
    setAiHits(0);
    setAiMisses(0);
    setSonarCharges(1);
    setIsSonarActive(false);
    setConsecutiveHits(0);
    setIsAiThinking(false);
    setIsResultModalOpen(false);

    setBattleLogs([
      {
        id: 'start',
        turnNumber: 1,
        attacker: 'player',
        coordLabel: 'HQ',
        x: -1,
        y: -1,
        isHit: false,
        isSunk: false,
        isBonusTurn: false,
        sunkShipName: '전투 개시',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
    ]);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // 소나 스캔 모드 토글
  const toggleSonarMode = useCallback(() => {
    if (sonarCharges <= 0 || turn !== 'player' || gamePhase !== 'battle') return;
    setIsSonarActive((prev) => !prev);
  }, [sonarCharges, turn, gamePhase]);

  // AI 사격 턴 핸들러
  const handleAiTurnRef = useRef<() => void>(() => {});

  handleAiTurnRef.current = () => {
    if (gamePhase !== 'battle') return;

    setIsAiThinking(true);

    window.setTimeout(() => {
      // AI 사격 타겟 후보 선정
      let targetX = -1;
      let targetY = -1;

      // 1) 부상당했으나 아직 격침되지 않은 아군 함선 추적 (Target Mode)
      const woundedShip = playerFleet.find((ship) => !ship.isSunk && ship.hits > 0);

      if (woundedShip && (difficulty === 'captain' || difficulty === 'admiral')) {
        const hitCells = woundedShip.cells.filter(
          (c) => playerGrid[c.y][c.x].status === 'hit'
        );

        if (hitCells.length >= 2) {
          // 선형 방향 추론 (가로 or 세로)
          const isHorizontal = hitCells[0].y === hitCells[1].y;
          const xs = hitCells.map((c) => c.x).sort((a, b) => a - b);
          const ys = hitCells.map((c) => c.y).sort((a, b) => a - b);

          const candidates: { x: number; y: number }[] = [];
          if (isHorizontal) {
            const fixedY = hitCells[0].y;
            if (xs[0] - 1 >= 0) candidates.push({ x: xs[0] - 1, y: fixedY });
            if (xs[xs.length - 1] + 1 < GRID_SIZE) candidates.push({ x: xs[xs.length - 1] + 1, y: fixedY });
          } else {
            const fixedX = hitCells[0].x;
            if (ys[0] - 1 >= 0) candidates.push({ x: fixedX, y: ys[0] - 1 });
            if (ys[ys.length - 1] + 1 < GRID_SIZE) candidates.push({ x: fixedX, y: ys[ys.length - 1] + 1 });
          }

          const valid = candidates.filter(
            (c) => playerGrid[c.y][c.x].status !== 'hit' && playerGrid[c.y][c.x].status !== 'miss'
          );
          if (valid.length > 0) {
            const pick = valid[Math.floor(Math.random() * valid.length)];
            targetX = pick.x;
            targetY = pick.y;
          }
        }

        if (targetX === -1 && hitCells.length === 1) {
          // 단일 피격 주변 4방향 탐색
          const base = hitCells[0];
          const adj = [
            { x: base.x + 1, y: base.y },
            { x: base.x - 1, y: base.y },
            { x: base.x, y: base.y + 1 },
            { x: base.x, y: base.y - 1 },
          ].filter(
            (c) =>
              c.x >= 0 &&
              c.x < GRID_SIZE &&
              c.y >= 0 &&
              c.y < GRID_SIZE &&
              playerGrid[c.y][c.x].status !== 'hit' &&
              playerGrid[c.y][c.x].status !== 'miss'
          );

          if (adj.length > 0) {
            const pick = adj[Math.floor(Math.random() * adj.length)];
            targetX = pick.x;
            targetY = pick.y;
          }
        }
      }

      // 2) 격자 탐색 (Hunt Mode / Parity Scan)
      if (targetX === -1) {
        const available: { x: number; y: number }[] = [];
        const parityAvailable: { x: number; y: number }[] = [];

        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            if (playerGrid[y][x].status !== 'hit' && playerGrid[y][x].status !== 'miss') {
              available.push({ x, y });
              if ((x + y) % 2 === 0) {
                parityAvailable.push({ x, y });
              }
            }
          }
        }

        if (difficulty !== 'recruit' && parityAvailable.length > 0) {
          const pick = parityAvailable[Math.floor(Math.random() * parityAvailable.length)];
          targetX = pick.x;
          targetY = pick.y;
        } else if (available.length > 0) {
          const pick = available[Math.floor(Math.random() * available.length)];
          targetX = pick.x;
          targetY = pick.y;
        }
      }

      setIsAiThinking(false);

      if (targetX === -1 || targetY === -1) return;

      // AI 사격 실행
      navalSound.playFire();

      const targetCell = playerGrid[targetY][targetX];
      const isHit = targetCell.status === 'ship' || Boolean(targetCell.shipId);
      const nextStatus: CellStatus = isHit ? 'hit' : 'miss';

      let sunkName: string | undefined;
      let isSunk = false;

      // 아군 함선 상태 갱신
      if (isHit && targetCell.shipId) {
        navalSound.playExplosion();
        setAiHits((prev) => prev + 1);

        setPlayerFleet((prevFleet) => {
          return prevFleet.map((ship) => {
            if (ship.id === targetCell.shipId) {
              const hits = ship.hits + 1;
              const sunk = hits >= ship.size;
              if (sunk) {
                sunkName = ship.name;
                isSunk = true;
                navalSound.playSunk();
              }
              return { ...ship, hits, isSunk: sunk };
            }
            return ship;
          });
        });
      } else {
        navalSound.playSplash();
        setAiMisses((prev) => prev + 1);
      }

      // 아군 격자 업데이트
      setPlayerGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[targetY][targetX] = {
          ...next[targetY][targetX],
          status: nextStatus,
          isRecentTarget: true,
        };
        return next;
      });

      // 전투 일지 기록
      setBattleLogs((prev) => [
        {
          id: `log_ai_${Date.now()}`,
          turnNumber: turnCount,
          attacker: 'ai',
          coordLabel: coordToLabel(targetX, targetY),
          x: targetX,
          y: targetY,
          isHit,
          isSunk,
          sunkShipName: sunkName,
          isBonusTurn: isHit,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev.slice(0, 49),
      ]);

      // 패배 판정 체크
      const remainingShips = playerFleet.filter((s) => (s.id === targetCell.shipId ? s.hits + 1 < s.size : !s.isSunk));
      if (isHit && remainingShips.length === 0) {
        setGamePhase('defeat');
        navalSound.playDefeat();
        setIsResultModalOpen(true);
        return;
      }

      // 살보 연속 공격 룰: 적(AI)이 명중 시 연속 사격, 빗나갈 경우 플레이어 턴으로 전환
      if (isHit) {
        window.setTimeout(() => {
          handleAiTurnRef.current();
        }, 800);
      } else {
        setTurn('player');
        setTurnCount((prev) => prev + 1);
      }
    }, 700);
  };

  // 플레이어 사격 액션
  const fireTorpedo = useCallback(
    (x: number, y: number) => {
      if (turn !== 'player' || gamePhase !== 'battle' || isAiThinking) return;

      const cell = aiGrid[y][x];

      // 1) 소나 스캔 모드 실행
      if (isSonarActive) {
        navalSound.playSonar();
        setIsSonarActive(false);
        setSonarCharges((prev) => Math.max(0, prev - 1));

        let detected = false;
        setAiGrid((prev) => {
          const next = prev.map((row) => [...row]);
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                const target = next[ny][nx];
                const hasShip = target.status === 'ship' || Boolean(target.shipId);
                if (hasShip) detected = true;
                next[ny][nx] = {
                  ...target,
                  isSonarScanned: true,
                  hasSonarDetected: hasShip,
                };
              }
            }
          }
          return next;
        });

        setBattleLogs((prev) => [
          {
            id: `sonar_${Date.now()}`,
            turnNumber: turnCount,
            attacker: 'player',
            coordLabel: `📡 ${coordToLabel(x, y)}`,
            x,
            y,
            isHit: detected,
            isSunk: false,
            sunkShipName: detected ? '소나 탐지 성공 (반경 3x3 적함 포착)' : '소나 정찰 (적함 신호 없음)',
            isBonusTurn: true,
            timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
          ...prev.slice(0, 49),
        ]);
        return;
      }

      // 이미 사격한 좌표인 경우 무시
      if (cell.status === 'hit' || cell.status === 'miss') return;

      // 발사음
      navalSound.playFire();

      const isHit = cell.status === 'ship' || Boolean(cell.shipId);
      const nextStatus: CellStatus = isHit ? 'hit' : 'miss';

      let sunkName: string | undefined;
      let isSunk = false;

      if (isHit && cell.shipId) {
        navalSound.playExplosion();
        setPlayerHits((prev) => prev + 1);
        setConsecutiveHits((prev) => prev + 1);

        setAiFleet((prevFleet) => {
          return prevFleet.map((ship) => {
            if (ship.id === cell.shipId) {
              const hits = ship.hits + 1;
              const sunk = hits >= ship.size;
              if (sunk) {
                sunkName = ship.name;
                isSunk = true;
                navalSound.playSunk();
              }
              return { ...ship, hits, isSunk: sunk };
            }
            return ship;
          });
        });
      } else {
        navalSound.playSplash();
        setPlayerMisses((prev) => prev + 1);
        setConsecutiveHits(0);
      }

      // 적군 격자 사격 결과 반영
      setAiGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[y][x] = {
          ...next[y][x],
          status: nextStatus,
          isRecentTarget: true,
        };
        return next;
      });

      // 전투 일지 기록
      setBattleLogs((prev) => [
        {
          id: `log_p_${Date.now()}`,
          turnNumber: turnCount,
          attacker: 'player',
          coordLabel: coordToLabel(x, y),
          x,
          y,
          isHit,
          isSunk,
          sunkShipName: sunkName,
          isBonusTurn: isHit,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev.slice(0, 49),
      ]);

      // 승리 판정 체크
      const remainingAiShips = aiFleet.filter((s) => (s.id === cell.shipId ? s.hits + 1 < s.size : !s.isSunk));
      if (isHit && remainingAiShips.length === 0) {
        setGamePhase('victory');
        navalSound.playVictory();
        setIsResultModalOpen(true);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (_e) {}
        return;
      }

      // 살보 룰: 명중 시 플레이어 연속 공격 기회 부여, 빗나갈 경우 AI 턴으로 전환
      if (!isHit) {
        setTurn('ai');
        window.setTimeout(() => {
          handleAiTurnRef.current();
        }, 500);
      }
    },
    [turn, gamePhase, isAiThinking, isSonarActive, aiGrid, turnCount, aiFleet]
  );

  return {
    playerGrid,
    aiGrid,
    playerFleet,
    aiFleet,
    turn,
    gamePhase,
    difficulty,
    setDifficulty,
    turnCount,
    playerHits,
    playerMisses,
    aiHits,
    aiMisses,
    sonarCharges,
    isSonarActive,
    consecutiveHits,
    isAiThinking,
    battleLogs,
    isResultModalOpen,
    setIsResultModalOpen,
    isMuted,
    toggleMute,
    initGame,
    toggleSonarMode,
    fireTorpedo,
  };
}
