import assert from 'node:assert/strict';
import * as serverEngine from '../apps/api-server/src/services/azit-combat.engine.js';
import * as catalog from '../apps/api-server/src/services/azit-game.catalog.js';
import * as clientEngine from '../apps/next-portal/src/utils/azitCombatEngine.js';

let passed = 0;
function step(label: string): void {
    passed += 1;
    console.log(`✅ [${passed}] ${label}`);
}

function main(): void {
    // =========================================================================
    // T1: Deterministic Engine & Server-Client Parity (F1)
    // =========================================================================
    const allMercCodes = catalog.AZIT_MERCENARIES.map((m) => m.mercCode);
    for (let i = 0; i < 12; i += 1) {
        const seed = 10007 + i * 7919;
        const zone = catalog.AZIT_EXPEDITION_ZONES[i % catalog.AZIT_EXPEDITION_ZONES.length];
        const partySize = (i % 3) + 1;
        const allies: serverEngine.CombatUnitInput[] = [];
        for (let p = 0; p < partySize; p += 1) {
            const mercCode = allMercCodes[(i + p) % allMercCodes.length];
            allies.push(
                catalog.buildMercCombatUnit({
                    mercCode,
                    level: Math.min(15, 1 + i),
                    mainSkillLevel: Math.min(10, 1 + (i % 10)),
                    subSkillLevel: Math.min(10, 1 + ((i + 2) % 10)),
                    unitId: `ally-${p}-${mercCode}`,
                })
            );
        }
        const enemies = catalog.buildZoneEnemyUnits(zone);
        const mode: 'expedition' | 'tower' = i % 2 === 0 ? 'expedition' : 'tower';

        const input: serverEngine.CombatSimulationInput = {
            mode,
            seed,
            allies,
            enemies,
            deathRiskPct: zone.deathRiskPct,
            elixirBoostPct: i % 3 === 0 ? 12 : 0,
            dishBuffs: { powerBonusPct: (i % 4) * 20 },
        };

        const sRes1 = serverEngine.runCombatSimulation(input);
        const sRes2 = serverEngine.runCombatSimulation(input);
        const cRes = clientEngine.runCombatSimulation(
            input as unknown as clientEngine.CombatSimulationInput
        );

        assert.equal(sRes1.won, sRes2.won, `Server determinism won mismatch on case ${i}`);
        assert.equal(sRes1.durationMs, sRes2.durationMs);
        assert.deepEqual(sRes1.battleLog, sRes2.battleLog);

        assert.equal(sRes1.won, cRes.won, `Server-client won mismatch on case ${i}`);
        assert.equal(sRes1.durationMs, cRes.durationMs, `Server-client durationMs mismatch on case ${i}`);
        assert.equal(sRes1.frames.length, cRes.frames.length, `Server-client frames length mismatch on case ${i}`);
        assert.deepEqual(
            sRes1.unitOutcomes.map((u) => ({ id: u.unitId, hp: u.hp, dmg: u.damageDealt, heal: u.healingDone })),
            cRes.unitOutcomes.map((u) => ({ id: u.unitId, hp: u.hp, dmg: u.damageDealt, heal: u.healingDone })),
            `Server-client unitOutcomes mismatch on case ${i}`
        );
        assert.deepEqual(sRes1.casualties, cRes.casualties, `Server-client casualties mismatch on case ${i}`);
        assert.deepEqual(sRes1.battleLog, cRes.battleLog, `Server-client battleLog mismatch on case ${i}`);

        if (mode === 'tower') {
            assert.deepEqual(sRes1.casualties, [], 'Tower mode must never trigger casualties');
        }
    }

    // Verify different seeds produce varied damage rolls
    const varianceInputBase: serverEngine.CombatSimulationInput = {
        mode: 'tower',
        seed: 101,
        allies: [
            catalog.buildMercCombatUnit({ mercCode: 'merc-leo', level: 3, mainSkillLevel: 2, subSkillLevel: 2 }),
            catalog.buildMercCombatUnit({ mercCode: 'merc-rina', level: 3, mainSkillLevel: 2, subSkillLevel: 2 }),
        ],
        enemies: catalog.buildZoneEnemyUnits(catalog.getZoneDef('zone-goblin')!),
    };
    const seedSet = new Set<number>();
    for (let s = 1; s <= 6; s += 1) {
        const res = serverEngine.runCombatSimulation({ ...varianceInputBase, seed: s * 31337 });
        seedSet.add(res.totalDamageDealt);
    }
    assert.ok(seedSet.size >= 2, 'Different seeds should produce varied damage rolls');

    // Verify client interpolation & camp preview helpers
    const previewRes = clientEngine.buildCampPreviewSimulation({
        seed: 555,
        allies: [
            catalog.buildMercCombatUnit({ mercCode: 'merc-leo', level: 2 }) as unknown as clientEngine.CombatUnitInput,
            catalog.buildMercCombatUnit({ mercCode: 'merc-rina', level: 2 }) as unknown as clientEngine.CombatUnitInput,
        ],
        monsters: catalog.getZoneDef('zone-slime')!.monsters as unknown as Parameters<
            typeof clientEngine.buildCampPreviewSimulation
        >[0]['monsters'],
    });
    assert.ok(previewRes.frames.length >= 2, 'Camp preview simulation must generate frames');
    const midTime = Math.floor(previewRes.durationMs / 2);
    const interp = clientEngine.interpolateCombatFrame(previewRes.frames, midTime);
    assert.ok(interp !== null && interp.units.length > 0, 'interpolateCombatFrame must return interpolated frame');

    step('T1: Deterministic server-client engine parity across 12 scenarios + interpolation');

    // =========================================================================
    // T2: Autonomous Movement, Attack & Main/Sub Skills for All 6 Mercs (F1, F2)
    // =========================================================================
    const toughDummyEnemy = (): serverEngine.CombatUnitInput => ({
        unitId: 'dummy-boss',
        side: 'enemy',
        code: 'mon-golem',
        name: '훈련용 골렘',
        emoji: '🗿',
        combatRole: 'enemy-melee',
        level: 5,
        maxHp: 2200,
        atk: 25,
        def: 15,
        moveSpeed: 70,
        attackIntervalMs: 1400,
        range: 60,
        mainSkill: {
            id: 'dummy-main',
            name: '바위 치기',
            emoji: '🗿',
            slot: 'main',
            effectKind: 'damage',
            targetScope: 'enemy_single',
            cooldownMs: 9000,
            powerPct: 110,
            perLevelPct: 5,
            range: 70,
            aoeRadius: 0,
            description: '훈련용 공격',
        },
        subSkill: {
            id: 'dummy-sub',
            name: '돌방패',
            emoji: '🛡️',
            slot: 'sub',
            effectKind: 'buff',
            targetScope: 'self',
            cooldownMs: 9000,
            powerPct: 100,
            perLevelPct: 5,
            range: 70,
            aoeRadius: 0,
            description: '방어',
            statusEffect: { kind: 'defUp', durationMs: 2000, value: 10 },
        },
        mainSkillLevel: 1,
        subSkillLevel: 1,
    });

    for (const mercDef of catalog.AZIT_MERCENARIES) {
        const ally = catalog.buildMercCombatUnit({
            mercCode: mercDef.mercCode,
            level: 6,
            mainSkillLevel: 3,
            subSkillLevel: 3,
        });
        const sim = serverEngine.runCombatSimulation({
            mode: 'tower',
            seed: 4242,
            allies: [ally],
            enemies: [toughDummyEnemy()],
            maxDurationMs: 25_000,
        });

        // Position change check (movement)
        const firstPos = sim.frames[0].units.find((u) => u.unitId === ally.unitId)!;
        const moved = sim.frames.some((f) => {
            const u = f.units.find((unit) => unit.unitId === ally.unitId);
            return u ? Math.abs(u.x - firstPos.x) > 1 || Math.abs(u.y - firstPos.y) > 1 : false;
        });
        assert.ok(moved, `${mercDef.mercCode} must move autonomously`);

        const basicAttacks = sim.events.filter((e) => e.sourceId === ally.unitId && e.type === 'attack');
        const mainCasts = sim.events.filter((e) => e.sourceId === ally.unitId && e.skillSlot === 'main');
        const subCasts = sim.events.filter((e) => e.sourceId === ally.unitId && e.skillSlot === 'sub');
        assert.ok(basicAttacks.length >= 1, `${mercDef.mercCode} must execute basic attacks`);
        assert.ok(mainCasts.length >= 1, `${mercDef.mercCode} must auto-cast Main Skill`);
        assert.ok(subCasts.length >= 1, `${mercDef.mercCode} must auto-cast Sub Skill`);
    }

    // Verify specific role & status mechanics: Serena heal, Leo shield+stun, Kael burn, Rina/Aria defDown
    const squadState = serverEngine.initCombatState({
        mode: 'tower',
        seed: 7777,
        allies: [
            catalog.buildMercCombatUnit({ mercCode: 'merc-leo', level: 5, mainSkillLevel: 3, subSkillLevel: 3 }),
            catalog.buildMercCombatUnit({ mercCode: 'merc-rina', level: 5, mainSkillLevel: 3, subSkillLevel: 3 }),
            catalog.buildMercCombatUnit({ mercCode: 'merc-kael', level: 5, mainSkillLevel: 3, subSkillLevel: 3 }),
            catalog.buildMercCombatUnit({ mercCode: 'merc-serena', level: 5, mainSkillLevel: 3, subSkillLevel: 3 }),
            catalog.buildMercCombatUnit({ mercCode: 'merc-aria', level: 5, mainSkillLevel: 3, subSkillLevel: 3 }),
        ],
        enemies: [
            { ...toughDummyEnemy(), unitId: 'boss-target-1', maxHp: 6000, atk: 60 },
            { ...toughDummyEnemy(), unitId: 'boss-target-2', maxHp: 6000, atk: 60 },
        ],
        maxDurationMs: 22_000,
    });
    // Injure Leo so Serena's heal clearly triggers on an injured ally
    squadState.units[0].hp = Math.round(squadState.units[0].maxHp * 0.45);
    let sawShield = false;
    let sawStun = false;
    let sawBurn = false;
    let sawDefDown = false;
    while (!squadState.finished) {
        serverEngine.stepCombatTick(squadState, serverEngine.COMBAT_TICK_MS);
        for (const u of squadState.units) {
            if (u.statuses.some((s) => s.kind === 'shield')) sawShield = true;
            if (u.statuses.some((s) => s.kind === 'stun')) sawStun = true;
            if (u.statuses.some((s) => s.kind === 'burn')) sawBurn = true;
            if (u.statuses.some((s) => s.kind === 'defDown')) sawDefDown = true;
        }
    }
    const serenaOutcome = squadState.units.find((u) => u.code === 'merc-serena')!;
    assert.ok(serenaOutcome.healingDone > 0, 'Serena must heal injured ally');
    assert.ok(sawShield, 'Leo/Aria must apply shield status');
    assert.ok(sawStun, 'Leo must apply stun status');
    assert.ok(sawBurn, 'Kael must apply burn status');
    assert.ok(sawDefDown, 'Rina/Aria must apply defDown status');

    step('T2: Autonomous movement, basic attacks, Main/Sub skills & all status effects for 6 mercs');

    // =========================================================================
    // T3: Skill Lv 1 vs Lv 10 Scaling & Combat-Only Leveling (F2)
    // =========================================================================
    assert.equal(catalog.MERC_GOLD_UPGRADE_ENABLED, false, 'Gold merc upgrade must be disabled');
    for (let lv = 1; lv <= 14; lv += 1) {
        assert.ok(catalog.getMercNextXp(lv) > 0, `getMercNextXp(${lv}) must be positive`);
    }

    const lv1KaelSim = serverEngine.runCombatSimulation({
        mode: 'tower',
        seed: 9001,
        allies: [catalog.buildMercCombatUnit({ mercCode: 'merc-kael', level: 5, mainSkillLevel: 1, subSkillLevel: 1 })],
        enemies: [{ ...toughDummyEnemy(), maxHp: 4500 }],
        maxDurationMs: 20_000,
    });
    const lv10KaelSim = serverEngine.runCombatSimulation({
        mode: 'tower',
        seed: 9001,
        allies: [catalog.buildMercCombatUnit({ mercCode: 'merc-kael', level: 5, mainSkillLevel: 10, subSkillLevel: 10 })],
        enemies: [{ ...toughDummyEnemy(), maxHp: 4500 }],
        maxDurationMs: 20_000,
    });
    assert.ok(
        lv10KaelSim.totalDamageDealt > lv1KaelSim.totalDamageDealt,
        `Skill Lv 10 (${lv10KaelSim.totalDamageDealt}) must deal strictly more damage than Lv 1 (${lv1KaelSim.totalDamageDealt})`
    );

    const serenaLv1State = serverEngine.initCombatState({
        mode: 'tower',
        seed: 9002,
        allies: [
            catalog.buildMercCombatUnit({ mercCode: 'merc-leo', level: 5 }),
            catalog.buildMercCombatUnit({ mercCode: 'merc-serena', level: 5, mainSkillLevel: 1, subSkillLevel: 1 }),
        ],
        enemies: [{ ...toughDummyEnemy(), maxHp: 5000 }],
        maxDurationMs: 12_000,
    });
    serenaLv1State.units[0].hp = Math.round(serenaLv1State.units[0].maxHp * 0.35);
    while (!serenaLv1State.finished) serverEngine.stepCombatTick(serenaLv1State);

    const serenaLv10State = serverEngine.initCombatState({
        mode: 'tower',
        seed: 9002,
        allies: [
            catalog.buildMercCombatUnit({ mercCode: 'merc-leo', level: 5 }),
            catalog.buildMercCombatUnit({ mercCode: 'merc-serena', level: 5, mainSkillLevel: 10, subSkillLevel: 10 }),
        ],
        enemies: [{ ...toughDummyEnemy(), maxHp: 5000 }],
        maxDurationMs: 12_000,
    });
    serenaLv10State.units[0].hp = Math.round(serenaLv10State.units[0].maxHp * 0.35);
    while (!serenaLv10State.finished) serverEngine.stepCombatTick(serenaLv10State);

    const healLv1 = serenaLv1State.units.find((u) => u.code === 'merc-serena')!.healingDone;
    const healLv10 = serenaLv10State.units.find((u) => u.code === 'merc-serena')!.healingDone;
    assert.ok(healLv10 > healLv1, `Serena Lv10 heal (${healLv10}) must exceed Lv1 (${healLv1})`);

    // XP multi-level rollover & cap
    const rollover = catalog.applyMercenaryCombatXp(1, 0, 200); // Lv1 needs 60, Lv2 needs 120 -> Lv3 + 20 XP
    assert.equal(rollover.level, 3);
    assert.equal(rollover.xp, 20);
    assert.equal(rollover.levelsGained, 2);
    const capped = catalog.applyMercenaryCombatXp(14, 100, 99999);
    assert.equal(capped.level, 15);
    assert.equal(capped.xp, 0);

    step('T3: Skill Lv 1 vs Lv 10 scaling & combat-only XP rollover/cap');

    // =========================================================================
    // T4: 1–8h Expedition Zones, Multi-Expedition Limits & Casualties (F3)
    // =========================================================================
    assert.equal(catalog.AZIT_EXPEDITION_ZONES.length, 6);
    const expectedDurations = [3600, 7200, 10800, 14400, 21600, 28800];
    const validCropIds = new Set(catalog.AZIT_CROPS.map((c) => c.cropId));
    const validItemIds = new Set(catalog.AZIT_ITEMS.map((it) => it.itemId));

    for (let i = 0; i < catalog.AZIT_EXPEDITION_ZONES.length; i += 1) {
        const z = catalog.AZIT_EXPEDITION_ZONES[i];
        assert.equal(z.durationSec, expectedDurations[i], `Zone ${z.zoneId} durationSec mismatch`);
        assert.ok(z.durationSec >= 3600 && z.durationSec <= 28800);
        assert.ok(z.monsters.length >= 2, `Zone ${z.zoneId} must have monster roster`);
        for (const cropId of z.cropDropPool) {
            assert.ok(validCropIds.has(cropId), `Invalid cropDropPool ID ${cropId} in ${z.zoneId}`);
        }
        for (const drop of z.itemDrops) {
            assert.ok(validItemIds.has(drop.itemId), `Invalid itemDrop ID ${drop.itemId} in ${z.zoneId}`);
        }
        if (i > 0) {
            const prev = catalog.AZIT_EXPEDITION_ZONES[i - 1];
            assert.ok(z.recommendedPower > prev.recommendedPower);
            assert.ok(z.rewardPoints > prev.rewardPoints);
            assert.ok(z.rewardMercXp > prev.rewardMercXp);
        }
    }

    assert.equal(catalog.AZIT_LEVEL_TABLE.length, 50);
    assert.ok(catalog.AZIT_LEVEL_TABLE[0].maxActiveExpeditions >= 2, 'Lv1 must allow 2+ active expeditions');
    assert.ok(catalog.AZIT_LEVEL_TABLE[0].maxMercs >= 3, 'Lv1 must allow 3+ mercs');
    assert.ok(catalog.AZIT_LEVEL_TABLE[3].maxMercs >= 6, 'Lv4 must allow 6+ mercs');
    const lv1To10Xp = [0, 80, 220, 460, 820, 1350, 2100, 3100, 4400, 6200];
    for (let i = 0; i < 10; i += 1) {
        assert.equal(catalog.AZIT_LEVEL_TABLE[i].requiredXp, lv1To10Xp[i]);
    }

    // Weak party on zone-dragon must lose and trigger casualties
    const dragonZone = catalog.getZoneDef('zone-dragon')!;
    let casualtyTriggered = false;
    for (let seed = 1; seed <= 20; seed += 1) {
        const res = serverEngine.runCombatSimulation({
            mode: 'expedition',
            seed: seed * 101,
            allies: [
                catalog.buildMercCombatUnit({ mercCode: 'merc-leo', level: 1 }),
                catalog.buildMercCombatUnit({ mercCode: 'merc-rina', level: 1 }),
            ],
            enemies: catalog.buildZoneEnemyUnits(dragonZone),
            deathRiskPct: dragonZone.deathRiskPct,
        });
        assert.equal(res.won, false, 'Lv1 party must lose against zone-dragon');
        if (res.casualties.length >= 1) {
            casualtyTriggered = true;
            break;
        }
    }
    assert.ok(casualtyTriggered, 'Underpowered party losing zone-dragon must trigger casualty');

    step('T4: 1–8h expedition zones, AZIT_LEVEL_TABLE limits & expedition casualty evaluation');

    // =========================================================================
    // T5: Azit Items, Shop & Craft Catalog Integrity (F4)
    // =========================================================================
    const requiredItems: catalog.AzitItemId[] = [
        'item-revival-herb',
        'item-phoenix-feather',
        'item-skill-stone',
        'item-skill-tome',
        'item-battle-elixir',
    ];
    for (const itemId of requiredItems) {
        const item = catalog.getItemDef(itemId);
        assert.ok(item !== undefined, `Missing AzitItem ${itemId}`);
        if (item.shopPrice !== null) {
            assert.ok(item.shopPrice > 0, `Shop price for ${itemId} must be positive`);
        }
    }
    assert.equal(catalog.getItemDef('item-revival-herb')!.category, 'revival');
    assert.equal(catalog.getItemDef('item-phoenix-feather')!.category, 'revival');

    const validMaterialIds = new Set(catalog.AZIT_MATERIALS.map((m) => m.materialId));
    assert.ok(catalog.AZIT_CRAFT_RECIPES.length >= 5);
    for (const recipe of catalog.AZIT_CRAFT_RECIPES) {
        assert.ok(validItemIds.has(recipe.resultItemId), `Craft recipe ${recipe.recipeId} invalid output`);
        assert.ok(recipe.ingredients.length >= 2);
        for (const ing of recipe.ingredients) {
            assert.ok(ing.qty >= 1);
            if (ing.kind === 'crop') {
                assert.ok(validCropIds.has(ing.id as catalog.AzitCropId), `Invalid crop ingredient ${ing.id}`);
            } else if (ing.kind === 'material') {
                assert.ok(validMaterialIds.has(ing.id as catalog.AzitMaterialId), `Invalid material ingredient ${ing.id}`);
            } else {
                assert.ok(validItemIds.has(ing.id as catalog.AzitItemId), `Invalid item ingredient ${ing.id}`);
            }
        }
    }

    step('T5: Azit items, shop pricing & craft recipe ingredient integrity');

    // =========================================================================
    // T6: Vera's Tower 1–200F Catalog & Solvability (F5)
    // =========================================================================
    assert.equal(catalog.MAX_TOWER_FLOOR, 200);
    assert.equal(catalog.AZIT_TOWER_THEMES.length, 5);
    assert.equal(catalog.AZIT_TOWER_FLOORS.length, 200);
    assert.equal(catalog.getTowerFloorDef(0), undefined);
    assert.equal(catalog.getTowerFloorDef(201), undefined);

    const themeFloorCounts = new Map<catalog.AzitTowerThemeId, number>();
    for (let f = 1; f <= 200; f += 1) {
        const floorDef = catalog.getTowerFloorDef(f);
        assert.ok(floorDef !== undefined, `Floor ${f} missing`);
        assert.equal(floorDef.floor, f);
        themeFloorCounts.set(floorDef.themeId, (themeFloorCounts.get(floorDef.themeId) ?? 0) + 1);

        if (f % 10 === 0) {
            assert.equal(floorDef.floorType, 'major_boss');
            assert.equal(floorDef.isBoss, true);
        } else if (f % 5 === 0) {
            assert.equal(floorDef.floorType, 'mini_boss');
            assert.equal(floorDef.isBoss, true);
        } else {
            assert.equal(floorDef.floorType, 'normal');
            assert.equal(floorDef.isBoss, false);
        }

        assert.ok(floorDef.firstClearReward.veraPoints > floorDef.repeatReward.veraPoints);
        assert.ok(floorDef.repeatReward.veraPoints > 0);
        assert.ok(floorDef.firstClearReward.mercXp > floorDef.repeatReward.mercXp);
        assert.ok(floorDef.repeatReward.mercXp > 0);
        assert.ok(floorDef.monsters.length >= 2);
    }

    for (const theme of catalog.AZIT_TOWER_THEMES) {
        assert.equal(themeFloorCounts.get(theme.themeId), 40, `Theme ${theme.themeId} must cover 40 floors`);
    }

    const summaries = catalog.getTowerFloorSummaries(1, 50);
    assert.equal(summaries.length, 50);
    assert.equal(summaries[0].floor, 1);
    assert.equal(summaries[49].floor, 50);

    // 1F clearable by Lv 1 starter squad
    const floor1 = catalog.getTowerFloorDef(1)!;
    const sim1F = serverEngine.runCombatSimulation({
        mode: 'tower',
        seed: 1001,
        allies: [
            catalog.buildMercCombatUnit({ mercCode: 'merc-leo', level: 1 }),
            catalog.buildMercCombatUnit({ mercCode: 'merc-rina', level: 1 }),
        ],
        enemies: catalog.buildTowerEnemyUnits(floor1),
    });
    assert.equal(sim1F.won, true, 'Lv 1 starter squad (leo+rina) must clear Tower 1F');
    assert.deepEqual(sim1F.casualties, []);

    // 100F defeats Lv 1 starter squad with ZERO casualties
    const floor100 = catalog.getTowerFloorDef(100)!;
    const sim100F = serverEngine.runCombatSimulation({
        mode: 'tower',
        seed: 10100,
        allies: [
            catalog.buildMercCombatUnit({ mercCode: 'merc-leo', level: 1 }),
            catalog.buildMercCombatUnit({ mercCode: 'merc-rina', level: 1 }),
        ],
        enemies: catalog.buildTowerEnemyUnits(floor100),
        deathRiskPct: 100,
    });
    assert.equal(sim100F.won, false, 'Lv 1 starter squad must lose Tower 100F');
    assert.deepEqual(sim100F.casualties, [], 'Tower defeat must NEVER cause casualties');

    // 200F clearable by Lv 15 maxed squad (aria+garr+serena, skills Lv 10)
    const floor200 = catalog.getTowerFloorDef(200)!;
    const sim200F = serverEngine.runCombatSimulation({
        mode: 'tower',
        seed: 20200,
        allies: [
            catalog.buildMercCombatUnit({ mercCode: 'merc-aria', level: 15, mainSkillLevel: 10, subSkillLevel: 10 }),
            catalog.buildMercCombatUnit({ mercCode: 'merc-garr', level: 15, mainSkillLevel: 10, subSkillLevel: 10 }),
            catalog.buildMercCombatUnit({ mercCode: 'merc-serena', level: 15, mainSkillLevel: 10, subSkillLevel: 10 }),
        ],
        enemies: catalog.buildTowerEnemyUnits(floor200),
    });
    assert.equal(sim200F.won, true, 'Lv 15 maxed squad (aria+garr+serena, skills Lv 10) must clear Tower 200F');
    assert.deepEqual(sim200F.casualties, []);

    step('T6: Vera\'s Tower 1–200F catalog, rewards & 1F/100F/200F simulations');

    // =========================================================================
    // T7: NaN / Non-Finite Input & dtMs <= 0 Defensive Guards (Iteration 2)
    // =========================================================================
    // 1. applyMercenaryCombatXp NaN guards
    assert.deepEqual(
        catalog.applyMercenaryCombatXp(1, Number.NaN, 0),
        { level: 1, xp: 0, levelsGained: 0, nextXp: 60 },
        'applyMercenaryCombatXp(1, NaN, 0) must not promote to Lv15'
    );
    assert.deepEqual(
        catalog.applyMercenaryCombatXp(1, 0, Number.NaN),
        { level: 1, xp: 0, levelsGained: 0, nextXp: 60 },
        'applyMercenaryCombatXp(1, 0, NaN) must not promote to Lv15'
    );
    assert.deepEqual(
        catalog.applyMercenaryCombatXp(Number.NaN, 0, 10),
        { level: 1, xp: 10, levelsGained: 0, nextXp: 60 },
        'applyMercenaryCombatXp(NaN, 0, 10) must default level to 1'
    );
    assert.deepEqual(
        catalog.applyMercenaryCombatXp(1, 0, 10, Number.NaN),
        { level: 1, xp: 10, levelsGained: 0, nextXp: 60 },
        'applyMercenaryCombatXp(1, 0, 10, NaN) must default maxLevel to 15'
    );

    // 2. getMercenaryCombatStats NaN guards
    const lv1Leo = catalog.getMercenaryCombatStats('merc-leo', 1, 1, 1);
    const nanLeo = catalog.getMercenaryCombatStats('merc-leo', Number.NaN, Number.NaN, Number.NaN);
    assert.deepEqual(nanLeo, lv1Leo, 'getMercenaryCombatStats with NaN inputs must fallback to Lv1 stats');
    assert.ok(Number.isFinite(nanLeo.hp) && Number.isFinite(nanLeo.atk) && Number.isFinite(nanLeo.def));
    assert.ok(Number.isFinite(nanLeo.mainSkillPowerPct) && Number.isFinite(nanLeo.subSkillPowerPct));

    // 3. interpolateCombatFrame NaN / Infinity guards
    const nanFrame = clientEngine.interpolateCombatFrame(previewRes.frames, Number.NaN);
    assert.ok(nanFrame !== null, 'interpolateCombatFrame(frames, NaN) must not return null');
    assert.equal(nanFrame.timeMs, previewRes.frames[0].timeMs);
    for (const u of nanFrame.units) {
        assert.ok(Number.isFinite(u.x) && Number.isFinite(u.y), 'interpolated NaN frame units must have finite coordinates');
    }
    const negInfFrame = clientEngine.interpolateCombatFrame(previewRes.frames, -Infinity);
    assert.equal(negInfFrame?.timeMs, previewRes.frames[0].timeMs);
    const posInfFrame = clientEngine.interpolateCombatFrame(previewRes.frames, Infinity);
    assert.equal(posInfFrame?.timeMs, previewRes.frames[previewRes.frames.length - 1].timeMs);

    // 4. stepCombatTick dtMs <= 0 / NaN guards (server & client parity)
    const dtServerState = serverEngine.initCombatState(varianceInputBase);
    const dtClientState = clientEngine.initCombatState(
        varianceInputBase as unknown as clientEngine.CombatSimulationInput
    );
    const sTickZero = serverEngine.stepCombatTick(dtServerState, 0);
    const cTickZero = clientEngine.stepCombatTick(dtClientState, 0);
    assert.equal(sTickZero.timeMs, serverEngine.COMBAT_TICK_MS, 'stepCombatTick(state, 0) must advance by COMBAT_TICK_MS');
    assert.equal(cTickZero.timeMs, clientEngine.COMBAT_TICK_MS, 'client stepCombatTick(state, 0) must advance by COMBAT_TICK_MS');

    const sTickNan = serverEngine.stepCombatTick(dtServerState, Number.NaN);
    const cTickNan = clientEngine.stepCombatTick(dtClientState, Number.NaN);
    assert.equal(sTickNan.timeMs, serverEngine.COMBAT_TICK_MS * 2, 'stepCombatTick(state, NaN) must advance by COMBAT_TICK_MS');
    assert.equal(cTickNan.timeMs, clientEngine.COMBAT_TICK_MS * 2, 'client stepCombatTick(state, NaN) must advance by COMBAT_TICK_MS');

    const sTickNeg = serverEngine.stepCombatTick(dtServerState, -50);
    const cTickNeg = clientEngine.stepCombatTick(dtClientState, -50);
    assert.equal(sTickNeg.timeMs, serverEngine.COMBAT_TICK_MS * 3, 'stepCombatTick(state, -50) must advance by COMBAT_TICK_MS');
    assert.equal(cTickNeg.timeMs, clientEngine.COMBAT_TICK_MS * 3, 'client stepCombatTick(state, -50) must advance by COMBAT_TICK_MS');

    step('T7: NaN / non-finite input & dtMs <= 0 defensive guards');
    console.log(`\n🎉 ALL ${passed} AZIT M1 SIMULATION & CATALOG SUITES PASSED!`);
}

main();
