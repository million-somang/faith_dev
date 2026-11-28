import type {
    AzitCombatEvent,
    AzitCombatFrame,
    AzitCombatFrameUnit,
    AzitCombatRole,
    AzitCombatSimulationInput,
    AzitCombatSimulationResult,
    AzitCombatSkillEffectKind,
    AzitCombatSkillSpec,
    AzitCombatStatusKind,
    AzitCombatTargetScope,
    AzitCombatUnitAction,
    AzitCombatUnitOutcome,
    AzitCombatUnitTemplate,
    AzitCombatVfxEvent,
    AzitDishEffectiveBuffs,
    AzitMonsterDef,
} from '@/types/azit-game.types';

export type CombatRole = AzitCombatRole;
export type CombatStatusKind = AzitCombatStatusKind;
export type CombatSkillEffectKind = AzitCombatSkillEffectKind;
export type CombatTargetScope = AzitCombatTargetScope;
export type CombatSkillSpec = AzitCombatSkillSpec;
export type CombatUnitInput = AzitCombatUnitTemplate;
export type CombatUnitAction = AzitCombatUnitAction;
export type CombatFrameUnit = AzitCombatFrameUnit;
export type CombatVfxEvent = AzitCombatVfxEvent;
export type CombatFrame = AzitCombatFrame;
export type CombatEvent = AzitCombatEvent;
export type CombatSimulationInput = AzitCombatSimulationInput;
export type CombatUnitOutcome = AzitCombatUnitOutcome;

export interface CombatStatusInstance {
    kind: CombatStatusKind;
    remainingMs: number;
    value: number;
}

export interface CombatUnitState extends CombatUnitInput {
    spawnIndex: number;
    x: number;
    y: number;
    facing: 1 | -1;
    hp: number;
    alive: boolean;
    attackCooldownMs: number;
    mainSkillCooldownMs: number;
    subSkillCooldownMs: number;
    periodicTimerMs: number;
    statuses: CombatStatusInstance[];
    damageDealt: number;
    healingDone: number;
    kills: number;
    action: CombatUnitAction;
    activeSkillName?: string;
}

export type CombatVfxKind = AzitCombatVfxEvent['kind'];

export interface CombatSimulationResult extends Omit<AzitCombatSimulationResult, 'casualties' | 'mvpMercCode'> {
    casualties: string[];
    mvpMercCode: string | null;
}

export interface CombatState {
    mode: 'expedition' | 'tower';
    seed: number;
    rng: () => number;
    tick: number;
    timeMs: number;
    maxDurationMs: number;
    recordFrames: boolean;
    frameIntervalTicks: number;
    deathRiskPct: number;
    units: CombatUnitState[];
    frames: CombatFrame[];
    events: CombatEvent[];
    finished: boolean;
    winner: 'ally' | 'enemy' | null;
}

export interface CombatTickResult {
    finished: boolean;
    winner: 'ally' | 'enemy' | null;
    tick: number;
    timeMs: number;
}

export const ARENA_WIDTH = 800;
export const ARENA_HEIGHT = 360;
export const ARENA_BOUNDS = {
    minX: 44,
    maxX: 756,
    minY: 96,
    maxY: 312,
} as const;
export const COMBAT_TICK_MS = 100;
export const DEFAULT_MAX_DURATION_MS = 90_000;

export function createSeededRng(seed: number): () => number {
    let a = (Math.floor(seed) >>> 0) || 1;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

function distance(ax: number, ay: number, bx: number, by: number): number {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
}

function getShieldAmount(unit: CombatUnitState): number {
    let total = 0;
    for (const s of unit.statuses) {
        if (s.kind === 'shield' && s.remainingMs > 0) {
            total += Math.max(0, s.value);
        }
    }
    return Math.round(total);
}

function addOrRefreshStatus(
    unit: CombatUnitState,
    kind: CombatStatusKind,
    durationMs: number,
    value: number
): void {
    if (!unit.alive) return;
    if (kind === 'shield') {
        const existing = unit.statuses.find((s) => s.kind === 'shield');
        if (existing) {
            existing.remainingMs = Math.max(existing.remainingMs, durationMs);
            existing.value = Math.max(existing.value, value);
        } else {
            unit.statuses.push({ kind, remainingMs: durationMs, value });
        }
        return;
    }
    const existing = unit.statuses.find((s) => s.kind === kind);
    if (existing) {
        existing.remainingMs = Math.max(existing.remainingMs, durationMs);
        existing.value = Math.max(existing.value, value);
    } else {
        unit.statuses.push({ kind, remainingMs: durationMs, value });
    }
}

function getAtkMultiplier(unit: CombatUnitState): number {
    let bonusPct = 0;
    for (const s of unit.statuses) {
        if (s.kind === 'atkUp') {
            bonusPct += s.value;
        }
    }
    if (unit.combatRole === 'berserker' && unit.hp < unit.maxHp * 0.55) {
        bonusPct += 15;
    }
    return Math.max(0.5, 1 + bonusPct / 100);
}

function getDefMultiplier(unit: CombatUnitState): number {
    let deltaPct = 0;
    for (const s of unit.statuses) {
        if (s.kind === 'defUp') deltaPct += s.value;
        if (s.kind === 'defDown') deltaPct -= s.value;
    }
    return Math.max(0.3, 1 + deltaPct / 100);
}

function snapshotFrame(state: CombatState, effects: CombatVfxEvent[]): CombatFrame {
    const units: CombatFrameUnit[] = state.units.map((u) => {
        const uniqueStatuses: CombatStatusKind[] = [];
        for (const s of u.statuses) {
            if (s.remainingMs > 0 && !uniqueStatuses.includes(s.kind)) {
                uniqueStatuses.push(s.kind);
            }
        }
        return {
            unitId: u.unitId,
            side: u.side,
            code: u.code,
            name: u.name,
            emoji: u.emoji,
            x: Math.round(u.x * 10) / 10,
            y: Math.round(u.y * 10) / 10,
            hp: u.hp,
            maxHp: u.maxHp,
            shield: getShieldAmount(u),
            facing: u.facing,
            alive: u.alive,
            action: u.alive ? u.action : 'dead',
            activeSkillName: u.activeSkillName,
            statuses: uniqueStatuses,
        };
    });
    return {
        tick: state.tick,
        timeMs: state.timeMs,
        units,
        effects,
    };
}

function applyDamageToUnit(
    state: CombatState,
    attacker: CombatUnitState | null,
    target: CombatUnitState,
    rawAmount: number,
    effects: CombatVfxEvent[],
    isCrit: boolean,
    label?: string
): number {
    if (!target.alive) return 0;
    let remaining = Math.max(1, Math.round(rawAmount));

    for (let i = target.statuses.length - 1; i >= 0 && remaining > 0; i -= 1) {
        const st = target.statuses[i];
        if (st.kind === 'shield' && st.value > 0) {
            const absorbed = Math.min(st.value, remaining);
            st.value -= absorbed;
            remaining -= absorbed;
            if (st.value <= 0) {
                target.statuses.splice(i, 1);
            }
        }
    }

    const hpLost = Math.min(target.hp, remaining);
    target.hp = Math.max(0, target.hp - remaining);

    if (attacker) {
        attacker.damageDealt += Math.max(1, Math.round(rawAmount));
    }

    effects.push({
        kind: 'hit',
        fromX: attacker ? attacker.x : target.x,
        fromY: attacker ? attacker.y : target.y,
        toX: target.x,
        toY: target.y,
        color: isCrit ? '#facc15' : '#ef4444',
        value: Math.max(1, Math.round(rawAmount)),
        isCrit,
        label,
    });

    if (target.hp <= 0) {
        target.alive = false;
        target.action = 'dead';
        target.statuses = [];
        if (attacker) {
            attacker.kills += 1;
        }
        state.events.push({
            tick: state.tick,
            elapsedMs: state.timeMs,
            type: 'death',
            sourceId: attacker ? attacker.unitId : target.unitId,
            targetIds: [target.unitId],
            x: target.x,
            y: target.y,
            message: `💀 ${target.name}이(가) 쓰러졌습니다!`,
        });
    }

    return hpLost;
}

function applyHealToUnit(
    attacker: CombatUnitState,
    target: CombatUnitState,
    healAmount: number,
    effects: CombatVfxEvent[]
): number {
    if (!target.alive) return 0;
    const safeHeal = Math.max(1, Math.round(healAmount));
    const prevHp = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + safeHeal);
    const actual = target.hp - prevHp;
    attacker.healingDone += safeHeal;
    effects.push({
        kind: 'heal',
        fromX: attacker.x,
        fromY: attacker.y,
        toX: target.x,
        toY: target.y,
        color: '#22c55e',
        value: safeHeal,
        isHeal: true,
    });
    return actual;
}

function selectPrimaryEnemy(
    unit: CombatUnitState,
    enemies: CombatUnitState[]
): CombatUnitState | null {
    if (enemies.length === 0) return null;

    if (unit.combatRole === 'ranger') {
        let best = enemies[0];
        let bestDist = distance(unit.x, unit.y, best.x, best.y);
        for (let i = 1; i < enemies.length; i += 1) {
            const e = enemies[i];
            const d = distance(unit.x, unit.y, e.x, e.y);
            if (e.hp < best.hp || (e.hp === best.hp && d < bestDist)) {
                best = e;
                bestDist = d;
            }
        }
        return best;
    }

    if (unit.combatRole === 'mage') {
        let best = enemies[0];
        let bestNeighbors = -1;
        let bestDist = Number.POSITIVE_INFINITY;
        for (const e of enemies) {
            let neighbors = 0;
            for (const other of enemies) {
                if (distance(e.x, e.y, other.x, other.y) <= 135) {
                    neighbors += 1;
                }
            }
            const d = distance(unit.x, unit.y, e.x, e.y);
            if (neighbors > bestNeighbors || (neighbors === bestNeighbors && d < bestDist)) {
                best = e;
                bestNeighbors = neighbors;
                bestDist = d;
            }
        }
        return best;
    }

    if (unit.combatRole === 'allrounder' || unit.combatRole === 'enemy-boss') {
        let best = enemies[0];
        let bestScore = (best.isBoss ? 10000 : 0) + best.atk;
        let bestDist = distance(unit.x, unit.y, best.x, best.y);
        for (let i = 1; i < enemies.length; i += 1) {
            const e = enemies[i];
            const score = (e.isBoss ? 10000 : 0) + e.atk;
            const d = distance(unit.x, unit.y, e.x, e.y);
            if (score > bestScore || (score === bestScore && d < bestDist)) {
                best = e;
                bestScore = score;
                bestDist = d;
            }
        }
        return best;
    }

    let nearest = enemies[0];
    let nearestDist = distance(unit.x, unit.y, nearest.x, nearest.y);
    for (let i = 1; i < enemies.length; i += 1) {
        const e = enemies[i];
        const d = distance(unit.x, unit.y, e.x, e.y);
        if (d < nearestDist) {
            nearest = e;
            nearestDist = d;
        }
    }
    return nearest;
}

function selectLowestHpAlly(allies: CombatUnitState[]): CombatUnitState | null {
    if (allies.length === 0) return null;
    let lowest = allies[0];
    let lowestRatio = lowest.hp / Math.max(1, lowest.maxHp);
    for (let i = 1; i < allies.length; i += 1) {
        const a = allies[i];
        const ratio = a.hp / Math.max(1, a.maxHp);
        if (ratio < lowestRatio) {
            lowest = a;
            lowestRatio = ratio;
        }
    }
    return lowest;
}

function getBasicAttackVfxKind(unit: CombatUnitState): { kind: CombatVfxKind; color: string } {
    if (unit.combatRole === 'ranger' || unit.combatRole === 'enemy-ranged') {
        return { kind: 'arrow', color: unit.side === 'ally' ? '#22c55e' : '#f59e0b' };
    }
    if (unit.combatRole === 'mage' || unit.combatRole === 'healer') {
        return { kind: 'fireball', color: unit.combatRole === 'healer' ? '#fde047' : '#f97316' };
    }
    return { kind: 'slash', color: unit.side === 'ally' ? '#38bdf8' : '#ef4444' };
}

function executeSkill(
    state: CombatState,
    caster: CombatUnitState,
    skill: CombatSkillSpec,
    skillLevel: number,
    primaryEnemy: CombatUnitState,
    allies: CombatUnitState[],
    enemies: CombatUnitState[],
    effects: CombatVfxEvent[]
): boolean {
    const atkMult = getAtkMultiplier(caster);
    const lvOffset = Math.max(0, skillLevel - 1);
    const effectivePowerPct = skill.powerPct + lvOffset * skill.perLevelPct;

    let effectiveScope = skill.targetScope;
    let effectiveEffect = skill.effectKind;
    let targetForCast: CombatUnitState = primaryEnemy;

    if (skill.id === 'skill-serena-mend' && effectiveScope === 'ally_lowest') {
        const lowest = selectLowestHpAlly(allies);
        if (lowest && lowest.hp / Math.max(1, lowest.maxHp) < 0.96) {
            targetForCast = lowest;
        } else {
            effectiveScope = 'enemy_single';
            effectiveEffect = 'damage';
            targetForCast = primaryEnemy;
        }
    } else if (effectiveScope === 'ally_lowest') {
        targetForCast = selectLowestHpAlly(allies) ?? caster;
    } else if (effectiveScope === 'ally_all' || effectiveScope === 'self') {
        targetForCast = caster;
    }

    if (
        effectiveScope !== 'ally_all' &&
        effectiveScope !== 'self' &&
        distance(caster.x, caster.y, targetForCast.x, targetForCast.y) > skill.range
    ) {
        return false;
    }

    caster.facing = targetForCast.x >= caster.x ? 1 : -1;
    caster.action = skill.slot === 'main' ? 'skill_main' : 'skill_sub';
    caster.activeSkillName = skill.name;

    if (skill.slot === 'main') {
        caster.mainSkillCooldownMs = skill.cooldownMs;
    } else {
        caster.subSkillCooldownMs = skill.cooldownMs;
    }

    const impactedIds: string[] = [];
    let totalAmount = 0;

    if (effectiveEffect === 'heal' || effectiveEffect === 'heal_all') {
        const targets = effectiveScope === 'ally_all' ? allies : [targetForCast];
        const healPower =
            caster.atk * atkMult * (effectivePowerPct / 100) * (0.95 + state.rng() * 0.1);
        for (const t of targets) {
            const healed = applyHealToUnit(caster, t, healPower, effects);
            totalAmount += Math.max(healed, Math.round(healPower));
            impactedIds.push(t.unitId);
            if (skill.statusEffect) {
                const scaledVal =
                    skill.statusEffect.kind === 'regen'
                        ? Math.round(caster.atk * ((28 + lvOffset * 4) / 100))
                        : skill.statusEffect.value + lvOffset * 2;
                addOrRefreshStatus(t, skill.statusEffect.kind, skill.statusEffect.durationMs, scaledVal);
            }
            if (skill.secondaryStatusEffect) {
                addOrRefreshStatus(
                    t,
                    skill.secondaryStatusEffect.kind,
                    skill.secondaryStatusEffect.durationMs,
                    skill.secondaryStatusEffect.value + lvOffset * 2
                );
            }
        }
        state.events.push({
            tick: state.tick,
            elapsedMs: state.timeMs,
            type: 'heal',
            sourceId: caster.unitId,
            targetIds: impactedIds,
            skillSlot: skill.slot,
            skillName: skill.name,
            amount: totalAmount,
            x: caster.x,
            y: caster.y,
            message: `${skill.emoji} ${caster.name}의 [${skill.name}] 발동! (회복 ${totalAmount})`,
        });
        return true;
    }

    if (effectiveEffect === 'buff' || effectiveEffect === 'shield') {
        const targets = effectiveScope === 'ally_all' ? allies : [caster];
        for (const t of targets) {
            impactedIds.push(t.unitId);
            if (skill.statusEffect) {
                const val =
                    skill.statusEffect.kind === 'shield'
                        ? Math.round(caster.maxHp * ((skill.statusEffect.value + lvOffset * 2) / 100))
                        : skill.statusEffect.value + lvOffset * 2;
                addOrRefreshStatus(t, skill.statusEffect.kind, skill.statusEffect.durationMs, val);
            }
            effects.push({
                kind: 'shield',
                fromX: caster.x,
                fromY: caster.y,
                toX: t.x,
                toY: t.y,
                color: '#38bdf8',
                radius: 30,
                label: skill.name,
            });
        }
        state.events.push({
            tick: state.tick,
            elapsedMs: state.timeMs,
            type: 'skill',
            sourceId: caster.unitId,
            targetIds: impactedIds,
            skillSlot: skill.slot,
            skillName: skill.name,
            x: caster.x,
            y: caster.y,
            message: `${skill.emoji} ${caster.name}의 [${skill.name}] 발동!`,
        });
        return true;
    }

    let hitTargets: CombatUnitState[];
    if (effectiveScope === 'enemy_aoe') {
        const origin = skill.range <= 120 ? caster : targetForCast;
        const radius = Math.max(50, skill.aoeRadius);
        const inRadius = enemies.filter(
            (e) => distance(origin.x, origin.y, e.x, e.y) <= radius
        );
        hitTargets = inRadius.length > 0 ? inRadius : [targetForCast];
        if (skill.id === 'skill-rina-volley' && hitTargets.length > 3) {
            hitTargets = hitTargets.slice(0, 3);
        }
    } else {
        hitTargets = [targetForCast];
    }

    const vfxKind: CombatVfxKind =
        skill.id.includes('meteor')
            ? 'meteor'
            : skill.id.includes('whirlwind')
              ? 'whirlwind'
              : skill.id.includes('valkyrie')
                ? 'dash'
                : skill.id.includes('volley') || skill.id.includes('pierce')
                  ? 'arrow'
                  : skill.id.includes('flame') || skill.id.includes('fire')
                    ? 'fireball'
                    : 'slash';

    const vfxOrigin = skill.range <= 120 && effectiveScope === 'enemy_aoe' ? caster : targetForCast;
    effects.push({
        kind: vfxKind,
        fromX: caster.x,
        fromY: caster.y,
        toX: vfxOrigin.x,
        toY: vfxOrigin.y,
        color:
            caster.side === 'ally'
                ? skill.slot === 'main'
                    ? '#f59e0b'
                    : '#38bdf8'
                : '#dc2626',
        radius: skill.aoeRadius > 0 ? skill.aoeRadius : 40,
        label: skill.name,
    });

    const critBonus = skill.critMult ?? 1;
    let totalDamage = 0;

    for (const enemyTarget of hitTargets) {
        const mitigation = 100 / (100 + Math.max(0, enemyTarget.def * getDefMultiplier(enemyTarget)));
        const variance = 0.94 + state.rng() * 0.12;
        const isCrit =
            critBonus > 1 || state.rng() * 100 < (caster.critPct ?? 8) + (skill.slot === 'main' ? 8 : 4);
        const critFactor = critBonus > 1 ? critBonus : isCrit ? 1.45 : 1;
        const dmg = Math.max(
            2,
            Math.round(caster.atk * atkMult * (effectivePowerPct / 100) * mitigation * variance * critFactor)
        );
        applyDamageToUnit(state, caster, enemyTarget, dmg, effects, isCrit, skill.name);
        totalDamage += dmg;
        impactedIds.push(enemyTarget.unitId);

        if (enemyTarget.alive && skill.statusEffect) {
            const chance = skill.statusEffect.chancePct ?? 100;
            if (chance >= 100 || state.rng() * 100 < chance) {
                const isHarmful =
                    skill.statusEffect.kind === 'burn' ||
                    skill.statusEffect.kind === 'defDown' ||
                    skill.statusEffect.kind === 'stun';
                if (isHarmful) {
                    const statusVal =
                        skill.statusEffect.kind === 'burn'
                            ? Math.round(caster.atk * ((30 + lvOffset * 4) / 100))
                            : skill.statusEffect.value + Math.round(lvOffset * 1.5);
                    addOrRefreshStatus(
                        enemyTarget,
                        skill.statusEffect.kind,
                        skill.statusEffect.durationMs,
                        statusVal
                    );
                }
            }
        }
    }

    if (skill.lifestealPct && skill.lifestealPct > 0 && totalDamage > 0) {
        const healAmt = Math.round(totalDamage * ((skill.lifestealPct + lvOffset * 2) / 100));
        applyHealToUnit(caster, caster, healAmt, effects);
    }

    if (skill.id === 'skill-leo-aegis') {
        const shieldHp = Math.round(caster.maxHp * ((30 + lvOffset * 2.5) / 100));
        addOrRefreshStatus(caster, 'shield', 4000, shieldHp);
        const lowest = selectLowestHpAlly(allies.filter((a) => a.unitId !== caster.unitId));
        if (lowest) {
            addOrRefreshStatus(lowest, 'shield', 4000, shieldHp);
        }
        effects.push({
            kind: 'shield',
            fromX: caster.x,
            fromY: caster.y,
            toX: caster.x,
            toY: caster.y,
            color: '#60a5fa',
            radius: 36,
            label: '배리어',
        });
    } else if (skill.id === 'skill-leo-provoke') {
        addOrRefreshStatus(caster, 'defUp', 3500, 28 + lvOffset * 3);
    } else if (skill.id === 'skill-garr-frenzy') {
        addOrRefreshStatus(caster, 'atkUp', 3500, 24 + lvOffset * 3);
    } else if (skill.id === 'skill-aria-valkyrie') {
        const atkBonus = 20 + lvOffset * 2;
        const shieldHp = Math.round(caster.maxHp * ((16 + lvOffset * 2) / 100));
        for (const a of allies) {
            addOrRefreshStatus(a, 'atkUp', 4000, atkBonus);
            addOrRefreshStatus(a, 'shield', 4000, shieldHp);
        }
    } else if (
        skill.statusEffect &&
        (skill.statusEffect.kind === 'defUp' ||
            skill.statusEffect.kind === 'atkUp' ||
            skill.statusEffect.kind === 'shield')
    ) {
        const val =
            skill.statusEffect.kind === 'shield'
                ? Math.round(caster.maxHp * ((skill.statusEffect.value + lvOffset * 2) / 100))
                : skill.statusEffect.value + lvOffset * 2;
        addOrRefreshStatus(caster, skill.statusEffect.kind, skill.statusEffect.durationMs, val);
    }

    state.events.push({
        tick: state.tick,
        elapsedMs: state.timeMs,
        type: 'skill',
        sourceId: caster.unitId,
        targetIds: impactedIds,
        skillSlot: skill.slot,
        skillName: skill.name,
        amount: totalDamage,
        x: vfxOrigin.x,
        y: vfxOrigin.y,
        message: `${skill.emoji} ${caster.name}의 [${skill.name}]! (피해 ${totalDamage})`,
    });

    return true;
}

export function initCombatState(input: CombatSimulationInput): CombatState {
    const rng = createSeededRng(input.seed);
    const dishPowerPct = Math.max(0, input.dishBuffs?.powerBonusPct ?? 0);
    const elixirPct = Math.max(0, input.elixirBoostPct ?? 0);
    const allyStatScale = 1 + dishPowerPct / 200 + elixirPct / 100;

    const units: CombatUnitState[] = [];
    const allyCount = Math.max(1, input.allies.length);
    const enemyCount = Math.max(1, input.enemies.length);

    input.allies.forEach((u, idx) => {
        const scaledMaxHp = Math.max(1, Math.round(u.maxHp * allyStatScale));
        const scaledAtk = Math.max(1, Math.round(u.atk * allyStatScale));
        const x = clamp(128 + (idx % 2) * 38, ARENA_BOUNDS.minX, ARENA_BOUNDS.maxX);
        const y = clamp(204 + (idx - (allyCount - 1) / 2) * 62, ARENA_BOUNDS.minY, ARENA_BOUNDS.maxY);
        units.push({
            ...u,
            maxHp: scaledMaxHp,
            atk: scaledAtk,
            spawnIndex: idx,
            x,
            y,
            facing: 1,
            hp: scaledMaxHp,
            alive: true,
            attackCooldownMs: Math.round(u.attackIntervalMs * 0.15),
            mainSkillCooldownMs: Math.round(u.mainSkill.cooldownMs * 0.35),
            subSkillCooldownMs: Math.round(u.subSkill.cooldownMs * 0.2),
            periodicTimerMs: 0,
            statuses: [],
            damageDealt: 0,
            healingDone: 0,
            kills: 0,
            action: 'idle',
        });
    });

    input.enemies.forEach((u, idx) => {
        const x = clamp(672 - (idx % 2) * 38, ARENA_BOUNDS.minX, ARENA_BOUNDS.maxX);
        const y = clamp(204 + (idx - (enemyCount - 1) / 2) * 62, ARENA_BOUNDS.minY, ARENA_BOUNDS.maxY);
        units.push({
            ...u,
            spawnIndex: allyCount + idx,
            x,
            y,
            facing: -1,
            hp: Math.max(1, Math.round(u.maxHp)),
            alive: true,
            attackCooldownMs: Math.round(u.attackIntervalMs * 0.25),
            mainSkillCooldownMs: Math.round(u.mainSkill.cooldownMs * 0.45),
            subSkillCooldownMs: Math.round(u.subSkill.cooldownMs * 0.28),
            periodicTimerMs: 0,
            statuses: [],
            damageDealt: 0,
            healingDone: 0,
            kills: 0,
            action: 'idle',
        });
    });

    const recordFrames = input.recordFrames !== false;
    const state: CombatState = {
        mode: input.mode,
        seed: input.seed,
        rng,
        tick: 0,
        timeMs: 0,
        maxDurationMs: input.maxDurationMs ?? DEFAULT_MAX_DURATION_MS,
        recordFrames,
        frameIntervalTicks: Math.max(1, input.frameIntervalTicks ?? 1),
        deathRiskPct: clamp(input.deathRiskPct ?? 25, 0, 100),
        units,
        frames: [],
        events: [],
        finished: false,
        winner: null,
    };

    if (recordFrames) {
        state.frames.push(snapshotFrame(state, []));
    }

    return state;
}

export function stepCombatTick(state: CombatState, dtMs = COMBAT_TICK_MS): CombatTickResult {
    if (state.finished) {
        return {
            finished: true,
            winner: state.winner,
            tick: state.tick,
            timeMs: state.timeMs,
        };
    }

    const safeDtMs = Number.isFinite(dtMs) && dtMs > 0 ? dtMs : COMBAT_TICK_MS;
    state.tick += 1;
    state.timeMs += safeDtMs;
    const effects: CombatVfxEvent[] = [];

    for (const u of state.units) {
        if (!u.alive) continue;
        u.action = 'idle';
        u.activeSkillName = undefined;

        for (const st of u.statuses) {
            st.remainingMs -= safeDtMs;
        }

        u.periodicTimerMs += safeDtMs;
        if (u.periodicTimerMs >= 1000) {
            u.periodicTimerMs -= 1000;
            for (const st of [...u.statuses]) {
                if (!u.statuses.includes(st)) continue;
                if (st.remainingMs <= -safeDtMs) continue;
                if (st.kind === 'burn' && u.alive) {
                    const burnDmg = Math.max(2, Math.round(st.value));
                    applyDamageToUnit(state, null, u, burnDmg, effects, false, '화상');
                    state.events.push({
                        tick: state.tick,
                        elapsedMs: state.timeMs,
                        type: 'status',
                        sourceId: u.unitId,
                        targetIds: [u.unitId],
                        amount: burnDmg,
                        statusKind: 'burn',
                        x: u.x,
                        y: u.y,
                        message: `🔥 ${u.name} 화상 피해 ${burnDmg}`,
                    });
                } else if (st.kind === 'regen' && u.alive) {
                    const regenHeal = Math.max(2, Math.round(st.value));
                    const prev = u.hp;
                    u.hp = Math.min(u.maxHp, u.hp + regenHeal);
                    const actual = u.hp - prev;
                    if (actual > 0) {
                        effects.push({
                            kind: 'heal',
                            fromX: u.x,
                            fromY: u.y,
                            toX: u.x,
                            toY: u.y,
                            color: '#4ade80',
                            value: actual,
                            isHeal: true,
                        });
                    }
                }
            }
        }

        u.statuses = u.statuses.filter((st) => st.remainingMs > 0);
    }

    const activeOrder = state.units
        .filter((u) => u.alive)
        .sort((a, b) => b.moveSpeed - a.moveSpeed || a.spawnIndex - b.spawnIndex);

    for (const u of activeOrder) {
        if (!u.alive) continue;

        u.attackCooldownMs = Math.max(0, u.attackCooldownMs - safeDtMs);
        u.mainSkillCooldownMs = Math.max(0, u.mainSkillCooldownMs - safeDtMs);
        u.subSkillCooldownMs = Math.max(0, u.subSkillCooldownMs - safeDtMs);

        if (u.statuses.some((st) => st.kind === 'stun')) {
            u.action = 'stunned';
            continue;
        }

        const allies = state.units.filter((other) => other.alive && other.side === u.side);
        const enemies = state.units.filter((other) => other.alive && other.side !== u.side);
        if (enemies.length === 0) break;

        const primaryEnemy = selectPrimaryEnemy(u, enemies);
        if (!primaryEnemy) break;

        if (u.mainSkillCooldownMs <= 0) {
            const castMain = executeSkill(
                state,
                u,
                u.mainSkill,
                u.mainSkillLevel,
                primaryEnemy,
                allies,
                enemies,
                effects
            );
            if (castMain) continue;
        }

        if (u.subSkillCooldownMs <= 0) {
            const castSub = executeSkill(
                state,
                u,
                u.subSkill,
                u.subSkillLevel,
                primaryEnemy,
                allies,
                enemies,
                effects
            );
            if (castSub) continue;
        }

        const distToEnemy = distance(u.x, u.y, primaryEnemy.x, primaryEnemy.y);
        const lowestAlly = u.combatRole === 'healer' ? selectLowestHpAlly(allies) : null;
        const needsBasicHeal =
            lowestAlly !== null &&
            lowestAlly.hp / Math.max(1, lowestAlly.maxHp) < 0.72 &&
            distance(u.x, u.y, lowestAlly.x, lowestAlly.y) <= u.range;

        if (u.attackCooldownMs <= 0 && (needsBasicHeal || distToEnemy <= u.range)) {
            u.attackCooldownMs = u.attackIntervalMs;
            u.action = 'attack';
            if (needsBasicHeal && lowestAlly) {
                u.facing = lowestAlly.x >= u.x ? 1 : -1;
                const healVal = Math.max(2, Math.round(u.atk * getAtkMultiplier(u) * 0.72));
                applyHealToUnit(u, lowestAlly, healVal, effects);
                state.events.push({
                    tick: state.tick,
                    elapsedMs: state.timeMs,
                    type: 'heal',
                    sourceId: u.unitId,
                    targetIds: [lowestAlly.unitId],
                    amount: healVal,
                    x: lowestAlly.x,
                    y: lowestAlly.y,
                    message: `✨ ${u.name}의 기본 치유 (+${healVal})`,
                });
            } else {
                u.facing = primaryEnemy.x >= u.x ? 1 : -1;
                const isCrit = state.rng() * 100 < (u.critPct ?? 8);
                const variance = 0.92 + state.rng() * 0.16;
                const mitigation =
                    100 / (100 + Math.max(0, primaryEnemy.def * getDefMultiplier(primaryEnemy)));
                const dmg = Math.max(
                    1,
                    Math.round(u.atk * getAtkMultiplier(u) * mitigation * variance * (isCrit ? 1.5 : 1))
                );
                const vfx = getBasicAttackVfxKind(u);
                effects.push({
                    kind: vfx.kind,
                    fromX: u.x,
                    fromY: u.y,
                    toX: primaryEnemy.x,
                    toY: primaryEnemy.y,
                    color: vfx.color,
                    isCrit,
                });
                applyDamageToUnit(state, u, primaryEnemy, dmg, effects, isCrit);
                state.events.push({
                    tick: state.tick,
                    elapsedMs: state.timeMs,
                    type: 'attack',
                    sourceId: u.unitId,
                    targetIds: [primaryEnemy.unitId],
                    amount: dmg,
                    isCrit,
                    x: primaryEnemy.x,
                    y: primaryEnemy.y,
                    message: `⚔️ ${u.name} → ${primaryEnemy.name} (${dmg}${isCrit ? ' 치명타!' : ''})`,
                });
            }
            continue;
        }

        const stepPx = u.moveSpeed * (safeDtMs / 1000);
        let moveDx = 0;
        let moveDy = 0;

        let nearestEnemy = primaryEnemy;
        let nearestEnemyDist = distToEnemy;
        for (const e of enemies) {
            const d = distance(u.x, u.y, e.x, e.y);
            if (d < nearestEnemyDist) {
                nearestEnemy = e;
                nearestEnemyDist = d;
            }
        }

        if (u.combatRole === 'ranger' && nearestEnemyDist < 85) {
            const awayX = u.x - nearestEnemy.x;
            const awayY = u.y - nearestEnemy.y;
            const len = Math.max(1, Math.hypot(awayX, awayY));
            moveDx = (awayX / len) * stepPx;
            moveDy = (awayY / len) * stepPx;
            u.facing = primaryEnemy.x >= u.x ? 1 : -1;
        } else {
            const desiredRange = Math.max(36, u.range - 8);
            if (distToEnemy > desiredRange) {
                const toX = primaryEnemy.x - u.x;
                const toY = primaryEnemy.y - u.y;
                const len = Math.max(1, Math.hypot(toX, toY));
                moveDx = (toX / len) * stepPx;
                moveDy = (toY / len) * stepPx;
                u.facing = primaryEnemy.x >= u.x ? 1 : -1;
            }
        }

        for (const ally of allies) {
            if (ally.unitId === u.unitId) continue;
            const sepDist = distance(u.x, u.y, ally.x, ally.y);
            if (sepDist > 0 && sepDist < 32) {
                const push = ((32 - sepDist) / 32) * (stepPx * 0.45);
                moveDx += ((u.x - ally.x) / sepDist) * push;
                moveDy += ((u.y - ally.y) / sepDist) * push;
            }
        }

        if (Math.abs(moveDx) > 0.05 || Math.abs(moveDy) > 0.05) {
            u.x = clamp(u.x + moveDx, ARENA_BOUNDS.minX, ARENA_BOUNDS.maxX);
            u.y = clamp(u.y + moveDy, ARENA_BOUNDS.minY, ARENA_BOUNDS.maxY);
            u.action = 'move';
        }
    }

    const aliveAllies = state.units.filter((u) => u.side === 'ally' && u.alive).length;
    const aliveEnemies = state.units.filter((u) => u.side === 'enemy' && u.alive).length;

    if (aliveEnemies === 0) {
        state.finished = true;
        state.winner = 'ally';
    } else if (aliveAllies === 0 || state.timeMs >= state.maxDurationMs) {
        state.finished = true;
        state.winner = 'enemy';
    }

    if (state.recordFrames && (state.finished || state.tick % state.frameIntervalTicks === 0)) {
        state.frames.push(snapshotFrame(state, effects));
    }

    return {
        finished: state.finished,
        winner: state.winner,
        tick: state.tick,
        timeMs: state.timeMs,
    };
}

function buildCombatBattleLog(
    state: CombatState,
    won: boolean,
    casualties: string[],
    mvpMercCode: string | null
): string[] {
    const allies = state.units.filter((u) => u.side === 'ally');
    const enemies = state.units.filter((u) => u.side === 'enemy');
    const allyNames = allies.map((u) => u.name).join(', ');
    const enemyNames = enemies.map((u) => u.name).join(', ');
    const log: string[] = [];

    log.push(`⚔️ [${allyNames}] 용병대가 [${enemyNames}] 진영과 교전을 시작했습니다.`);

    const skillEvents = state.events.filter((e) => e.type === 'skill' || e.type === 'heal');
    const maxHighlights = 4;
    if (skillEvents.length > 0) {
        const stride = Math.max(1, Math.floor(skillEvents.length / maxHighlights));
        let picked = 0;
        for (let i = 0; i < skillEvents.length && picked < maxHighlights; i += stride) {
            log.push(skillEvents[i].message);
            picked += 1;
        }
    }

    const durationSec = (state.timeMs / 1000).toFixed(1);
    const mvpUnit = mvpMercCode ? allies.find((a) => a.code === mvpMercCode) : null;
    if (won) {
        log.push(
            `🏆 ${durationSec}초 만에 전투 승리!${mvpUnit ? ` (MVP: ${mvpUnit.name} · 피해 ${mvpUnit.damageDealt.toLocaleString()})` : ''}`
        );
    } else {
        log.push(`⚠️ ${durationSec}초 교전 끝에 전열이 무너져 패배했습니다.`);
        if (casualties.length > 0) {
            const fallenNames = allies
                .filter((a) => casualties.includes(a.code))
                .map((a) => a.name)
                .join(', ');
            log.push(`💀 원정 중 전사자 발생: ${fallenNames} (부활 아이템으로만 회복 가능)`);
        } else if (state.mode === 'tower') {
            log.push(`🛡️ 베라의 탑 수호 결계로 용병들이 부상 없이 전원 회복되었습니다.`);
        }
    }

    return log;
}

export function runCombatSimulation(input: CombatSimulationInput): CombatSimulationResult {
    const state = initCombatState(input);
    while (!state.finished) {
        stepCombatTick(state, COMBAT_TICK_MS);
    }

    const won = state.winner === 'ally';
    const allies = state.units.filter((u) => u.side === 'ally');
    const enemies = state.units.filter((u) => u.side === 'enemy');

    const casualties: string[] = [];
    if (state.mode === 'expedition') {
        for (const ally of allies) {
            if (!ally.alive) {
                if (state.rng() * 100 < state.deathRiskPct) {
                    casualties.push(ally.code);
                }
            } else if (!won) {
                if (state.rng() * 100 < Math.round(state.deathRiskPct * 0.5)) {
                    casualties.push(ally.code);
                }
            }
        }
    }

    let mvpUnit: CombatUnitState | null = null;
    let bestScore = -1;
    let totalDamageDealt = 0;
    let totalHealingDone = 0;

    for (const ally of allies) {
        totalDamageDealt += ally.damageDealt;
        totalHealingDone += ally.healingDone;
        const score = ally.damageDealt + ally.healingDone;
        if (score > bestScore) {
            bestScore = score;
            mvpUnit = ally;
        }
    }

    const mvpMercCode = mvpUnit ? mvpUnit.code : null;
    const battleLog = buildCombatBattleLog(state, won, casualties, mvpMercCode);

    const unitOutcomes: CombatUnitOutcome[] = state.units.map((u) => ({
        unitId: u.unitId,
        code: u.code,
        name: u.name,
        side: u.side,
        hp: u.hp,
        maxHp: u.maxHp,
        alive: u.alive,
        damageDealt: u.damageDealt,
        healingDone: u.healingDone,
        kills: u.kills,
    }));

    return {
        won,
        durationMs: state.timeMs,
        seed: state.seed,
        frames: state.frames,
        events: state.events,
        battleLog,
        casualties,
        mvpMercCode,
        totalDamageDealt,
        totalHealingDone,
        survivingAllies: allies.filter((u) => u.alive).length,
        survivingEnemies: enemies.filter((u) => u.alive).length,
        unitOutcomes,
    };
}

export const runAzitCombatSimulation = runCombatSimulation;

/**
 * 60fps Canvas 재생용 프레임 보간기: 인접한 100ms 키프레임 사이의 유닛 좌표를 선형 보간하고
 * 해당 시간 구간에 발생한 VFX 이벤트를 수집합니다.
 */
export function interpolateCombatFrame(
    frames: CombatFrame[],
    elapsedMs: number
): CombatFrame | null {
    if (frames.length === 0) return null;
    if (!Number.isFinite(elapsedMs)) {
        return elapsedMs === Infinity ? frames[frames.length - 1] : frames[0];
    }
    if (elapsedMs <= frames[0].timeMs) {
        return frames[0];
    }
    const last = frames[frames.length - 1];
    if (elapsedMs >= last.timeMs) {
        return last;
    }

    let lo = 0;
    let hi = frames.length - 1;
    while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (frames[mid].timeMs <= elapsedMs) {
            lo = mid;
        } else {
            hi = mid;
        }
    }

    const prev = frames[lo];
    const next = frames[hi];
    const span = Math.max(1, next.timeMs - prev.timeMs);
    const t = clamp((elapsedMs - prev.timeMs) / span, 0, 1);

    const nextMap = new Map<string, CombatFrameUnit>();
    for (const u of next.units) {
        nextMap.set(u.unitId, u);
    }

    const interpolatedUnits: CombatFrameUnit[] = prev.units.map((pu) => {
        const nu = nextMap.get(pu.unitId);
        if (!nu) return pu;
        return {
            ...nu,
            x: pu.x + (nu.x - pu.x) * t,
            y: pu.y + (nu.y - pu.y) * t,
            hp: t < 0.5 ? pu.hp : nu.hp,
            shield: t < 0.5 ? pu.shield : nu.shield,
        };
    });

    const effects = t < 0.85 ? next.effects : [];

    return {
        tick: next.tick,
        timeMs: Math.round(elapsedMs),
        units: interpolatedUnits,
        effects,
    };
}

export interface CampPreviewBuildParams {
    seed: number;
    allies: AzitCombatUnitTemplate[];
    monsters: AzitMonsterDef[];
    dishBuffs?: Partial<AzitDishEffectiveBuffs>;
}

/**
 * 용병캠프 하단 출정 전장터 Canvas용 실시간 스커미시 시뮬레이션 생성기
 */
export function buildCampPreviewSimulation(
    params: CampPreviewBuildParams
): CombatSimulationResult {
    const enemies: AzitCombatUnitTemplate[] = params.monsters.map((m, idx) => ({
        unitId: `preview-enemy-${idx}-${m.monsterId}`,
        side: 'enemy',
        code: m.monsterId,
        name: m.name,
        emoji: m.emoji,
        combatRole: m.combatRole,
        level: 1,
        maxHp: m.maxHp,
        atk: m.atk,
        def: m.def,
        moveSpeed: m.moveSpeed,
        attackIntervalMs: m.attackIntervalMs,
        range: m.range,
        isBoss: m.isBoss,
        mainSkill: m.mainSkill,
        subSkill: m.subSkill,
        mainSkillLevel: 1,
        subSkillLevel: 1,
    }));

    return runCombatSimulation({
        mode: 'expedition',
        seed: params.seed,
        allies: params.allies,
        enemies,
        dishBuffs: params.dishBuffs,
        deathRiskPct: 0,
        maxDurationMs: 45_000,
        recordFrames: true,
        frameIntervalTicks: 1,
    });
}
