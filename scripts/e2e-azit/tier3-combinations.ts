import assert from 'node:assert/strict';
import {
    asArray,
    asNumber,
    asRecord,
    asString,
    assertCanvasAnimating,
    assertNoHorizontalOverflow,
    backdateExpedition,
    clickButtonByText,
    extractErrorCode,
    findCampBattlefieldCanvasSelector,
    getAzitState,
    getCampBattlefieldContainerText,
    getCraftRecipePointsCost,
    getCraftRecipeResultItemId,
    isMainModule,
    isRecord,
    jsonPost,
    openAuthedPage,
    queryDb,
    runStandaloneTier,
    seedCropHarvest,
    seedDish,
    seedItem,
    seedMaterial,
    seedUser,
    setMercDead,
    setMercLevelAndXp,
    setTowerHighestFloor,
    sleepMs,
    waitForText,
    withDb,
    type E2EContext,
    type TestCaseDefinition,
} from './harness.js';

async function hireMerc(ctx: E2EContext, sessionId: string, mercCode: string): Promise<void> {
    const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/hire', sessionId, { mercCode });
    assert.equal(res.status, 200, `Failed to hire ${mercCode}: ${res.rawText}`);
}

async function createGroup(
    ctx: E2EContext,
    sessionId: string,
    name: string,
    mercCodes: string[]
): Promise<number> {
    const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/save', sessionId, { name, mercCodes });
    assert.equal(res.status, 200, `POST /groups/save (${name}) failed: ${res.rawText}`);
    const st = await getAzitState(ctx, sessionId);
    const found = asArray(st.groups, 'groups').find((g) => isRecord(g) && g.name === name);
    assert.ok(isRecord(found));
    return asNumber(found.id, 'group.id');
}

export const tier3Cases: TestCaseDefinition[] = [
    {
        id: 'T3-01',
        tier: 3,
        area: 'Pairwise-Craft-Revive-Redeploy',
        description: 'Garden Crops + Expedition Materials -> Craft Revival -> Revive Dead Merc -> Redeploy 8h Zone',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't3-01', points: 25_000, azitLevel: 10 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            const groupId = await createGroup(ctx, user.sessionId, '불사조조', ['merc-leo']);

            // 1. Harvest crop-carrot cleanly via Garden API on an empty plot (plotIndex: 4)
            const stPrePlant = await getAzitState(ctx, user.sessionId);
            const beforeCarrotHarvest = stPrePlant.garden.harvestCounts['crop-carrot'] ?? 0;
            const plot4Before = queryDb(ctx.dbPath, (db) =>
                db
                    .prepare(`SELECT crop_id, stage, is_unlocked FROM azit_garden_plots WHERE user_id = ? AND plot_index = 4`)
                    .get(user.userId) as { crop_id: string | null; stage: number; is_unlocked: number } | undefined
            );
            assert.ok(plot4Before && plot4Before.is_unlocked === 1 && plot4Before.crop_id === null, 'Expected plot 4 to be unlocked and empty');

            const buySeedRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/garden/buy-seed', user.sessionId, {
                cropId: 'crop-carrot',
                quantity: 1,
            });
            assert.equal(buySeedRes.status, 200, `Garden buy-seed failed: ${buySeedRes.rawText}`);

            const plantRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/garden/plant', user.sessionId, {
                plotIndex: 4,
                cropId: 'crop-carrot',
            });
            assert.equal(plantRes.status, 200, `Garden plant on plot 4 failed: ${plantRes.rawText}`);

            withDb(ctx.dbPath, (db) => {
                const pastIso = new Date(Date.now() - 60_000).toISOString();
                const info = db
                    .prepare(
                        `UPDATE azit_garden_plots
                         SET stage = 3, water_count = 3, planted_at = ?, last_watered_at = ?, next_water_at_ms = NULL
                         WHERE user_id = ? AND plot_index = 4`
                    )
                    .run(pastIso, pastIso, user.userId);
                assert.equal(info.changes, 1, 'Expected plot 4 update to affect 1 row');
            });
            const harvestRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/garden/harvest', user.sessionId, {
                plotIndex: 4,
            });
            assert.equal(harvestRes.status, 200, `Garden harvest failed: ${harvestRes.rawText}`);

            // 2. Verify carrot harvest increase, discover revival herb recipe & seed required ingredients
            const st0 = await getAzitState(ctx, user.sessionId);
            const afterCarrotHarvest = st0.garden.harvestCounts['crop-carrot'] ?? 0;
            assert.ok(
                afterCarrotHarvest - beforeCarrotHarvest >= 2,
                `Expected harvestCounts['crop-carrot'] to increase by >= 2, got ${beforeCarrotHarvest} -> ${afterCarrotHarvest}`
            );

            const recipeRaw = asArray(st0.catalog.craftRecipes, 'craftRecipes').find(
                (r) => isRecord(r) && getCraftRecipeResultItemId(r) === 'item-revival-herb'
            );
            assert.ok(isRecord(recipeRaw), 'Expected revival herb recipe in craftRecipes');
            const recipeId = asString(recipeRaw.recipeId, 'recipeId');
            const craftPointsCost = getCraftRecipePointsCost(recipeRaw);
            const seededIngredients: Array<{ kind: string; id: string; qty: number }> = [];
            for (const ingRaw of asArray(recipeRaw.ingredients, 'ingredients')) {
                const ing = asRecord(ingRaw);
                const kind = asString(ing.kind);
                const id = asString(ing.id);
                const qty = asNumber(ing.qty);
                seededIngredients.push({ kind, id, qty });
                if (kind === 'crop') seedCropHarvest(ctx.dbPath, user.userId, id, qty);
                else if (kind === 'material') seedMaterial(ctx.dbPath, user.userId, id, qty);
                else if (kind === 'item') seedItem(ctx.dbPath, user.userId, id, qty);
            }
            const stPreCraft = await getAzitState(ctx, user.sessionId);

            // 3. Craft revival herb & verify ingredient/point deduction + item credit
            const craftRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/craft', user.sessionId, { recipeId, qty: 1 });
            assert.equal(craftRes.status, 200, `Craft failed: ${craftRes.rawText}`);
            const stPostCraft = await getAzitState(ctx, user.sessionId);
            assert.equal(stPostCraft.items?.find((i) => i.itemId === 'item-revival-herb')?.qty ?? 0, 1);
            assert.equal(
                stPostCraft.veraPoints,
                stPreCraft.veraPoints - craftPointsCost,
                `Expected veraPoints to decrease by craft pointsCost (${craftPointsCost})`
            );
            for (const ing of seededIngredients) {
                if (ing.kind === 'crop') {
                    const beforeQty = stPreCraft.garden.harvestCounts[ing.id] ?? 0;
                    const afterQty = stPostCraft.garden.harvestCounts[ing.id] ?? 0;
                    assert.equal(afterQty, beforeQty - ing.qty, `Expected crop ${ing.id} deducted by ${ing.qty}`);
                } else if (ing.kind === 'material') {
                    const beforeQty = stPreCraft.materials[ing.id] ?? 0;
                    const afterQty = stPostCraft.materials[ing.id] ?? 0;
                    assert.equal(afterQty, beforeQty - ing.qty, `Expected material ${ing.id} deducted by ${ing.qty}`);
                } else if (ing.kind === 'item') {
                    const beforeQty = stPreCraft.items?.find((i) => i.itemId === ing.id)?.qty ?? 0;
                    const afterQty = stPostCraft.items?.find((i) => i.itemId === ing.id)?.qty ?? 0;
                    assert.equal(afterQty, beforeQty - ing.qty, `Expected item ${ing.id} deducted by ${ing.qty}`);
                }
            }

            // 4. Dead merc-leo -> revive via crafted herb & verify item decrement + death metadata cleared
            setMercDead(ctx.dbPath, user.userId, 'merc-leo', 'zone-dragon');
            const revRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/revive', user.sessionId, {
                mercCode: 'merc-leo',
                itemId: 'item-revival-herb',
            });
            assert.equal(revRes.status, 200, `Revive failed: ${revRes.rawText}`);
            const stPostRevive = await getAzitState(ctx, user.sessionId);
            assert.equal(stPostRevive.items?.find((i) => i.itemId === 'item-revival-herb')?.qty ?? 0, 0);
            const revivedLeo = stPostRevive.mercenaries.find((m) => m.mercCode === 'merc-leo');
            assert.equal(revivedLeo?.status, 'idle');
            assert.equal(revivedLeo?.diedAt ?? null, null);
            assert.equal(revivedLeo?.deathZoneId ?? null, null);

            // 5. Redeploy merc-leo's group to 8h zone-dragon & verify ledger consistency
            seedDish(ctx.dbPath, user.userId, 'dish-dragon-elixir', 1);
            const expRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-dragon',
                groupId,
                dishRecipeId: 'dish-dragon-elixir',
            });
            assert.equal(expRes.status, 200, `8h zone-dragon redeploy failed: ${expRes.rawText}`);

            const stAfter = await getAzitState(ctx, user.sessionId);
            assert.equal(stAfter.mercenaries[0]?.status, 'expedition');
            const exp = stAfter.activeExpeditions[0];
            assert.equal(exp.zoneId, 'zone-dragon');
            assert.equal(exp.groupId, groupId, 'Redeployed expedition must carry groupId');
            const sec = Math.round((exp.endsAtMs - exp.startedAtMs) / 1000);
            assert.ok(sec >= 3600 && sec <= 28800, `Redeployed 8h expedition duration invalid: ${sec}s`);

            const ledgerSummary = queryDb(ctx.dbPath, (db) => {
                const row = db
                    .prepare(
                        `SELECT COALESCE(SUM(delta_points), 0) AS totalDelta, COUNT(*) AS cnt
                         FROM azit_point_ledger WHERE user_id = ?`
                    )
                    .get(user.userId) as { totalDelta: number; cnt: number };
                const latest = db
                    .prepare(`SELECT balance_after FROM azit_point_ledger WHERE user_id = ? ORDER BY id DESC LIMIT 1`)
                    .get(user.userId) as { balance_after: number } | undefined;
                return {
                    totalDelta: Number(row.totalDelta),
                    cnt: Number(row.cnt),
                    latestBalance: latest?.balance_after,
                };
            });
            assert.ok(ledgerSummary.cnt >= 3, 'Expected azit_point_ledger rows for hire, craft, and expedition');
            assert.equal(25_000 + ledgerSummary.totalDelta, stAfter.veraPoints, 'veraPoints must reconcile with ledger sum');
            assert.equal(ledgerSummary.latestBalance, stAfter.veraPoints, 'Latest ledger balance_after must equal veraPoints');
        },
    },
    {
        id: 'T3-02',
        tier: 3,
        area: 'Pairwise-EXP-Skill-Tower',
        description: 'Combat EXP Level-Up + Skill Tome/Stone Upgrade -> Vera Tower 5F Boss Clear -> First-Clear Rewards',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't3-02', points: 25_000, azitLevel: 7 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            await hireMerc(ctx, user.sessionId, 'merc-kael');

            // 1. Level up mercs via safe 2h zone-goblin expedition combat EXP (130 MercXP, 0% casualty risk)
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1, 1);
            const startRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-goblin',
                partyMercCodes: ['merc-leo', 'merc-rina', 'merc-kael'],
                dishRecipeId: 'dish-carrot-soup',
                dishQuality: 'special',
                useSpecialDish: true,
            });
            assert.equal(startRes.status, 200);
            const stMid = await getAzitState(ctx, user.sessionId);
            backdateExpedition(ctx.dbPath, stMid.activeExpeditions[0].id, Date.now() - 2000);
            const claimRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, {
                expeditionId: stMid.activeExpeditions[0].id,
            });
            assert.equal(claimRes.status, 200);
            const stPostExp = await getAzitState(ctx, user.sessionId);
            assert.equal(
                stPostExp.mercenaries.every((m) => m.status === 'idle' && m.level >= 2),
                true,
                'Expected all 3 mercenaries to survive safe zone-goblin and reach Lv2+'
            );

            // 2. Upgrade Main & Sub skills via item-skill-tome & item-skill-stone
            seedItem(ctx.dbPath, user.userId, 'item-skill-tome', 2);
            seedItem(ctx.dbPath, user.userId, 'item-skill-stone', 2);
            const upMain = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/skills/upgrade', user.sessionId, {
                mercCode: 'merc-leo',
                skillSlot: 'main',
            });
            const upSub = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/skills/upgrade', user.sessionId, {
                mercCode: 'merc-leo',
                skillSlot: 'sub',
            });
            assert.equal(upMain.status, 200);
            assert.equal(upSub.status, 200);
            const stPostSkill = await getAzitState(ctx, user.sessionId);
            assert.equal(stPostSkill.items?.find((i) => i.itemId === 'item-skill-tome')?.qty ?? 0, 1);
            assert.equal(stPostSkill.items?.find((i) => i.itemId === 'item-skill-stone')?.qty ?? 0, 1);
            const pointsBeforeTower = stPostSkill.veraPoints;

            // 3. Clear Tower 1F..5F (5F Mini-Boss)
            let lastData: Record<string, unknown> = {};
            for (let f = 1; f <= 5; f += 1) {
                const bRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                    floor: f,
                    partyMercCodes: ['merc-leo', 'merc-rina', 'merc-kael'],
                });
                assert.equal(bRes.status, 200, `Tower ${f}F failed: ${bRes.rawText}`);
                lastData = asRecord(bRes.json.data);
                assert.equal(lastData.won, true, `Expected upgraded party to clear ${f}F`);
            }
            assert.equal(lastData.isFirstClear, true);
            assert.ok(asArray(lastData.frames, 'lastData.frames').length > 0, 'Expected non-empty combat frames on 5F clear');
            assert.ok(asArray(lastData.battleLog, 'lastData.battleLog').length > 0, 'Expected non-empty battleLog on 5F clear');

            const rewards5F = asRecord(lastData.rewards, '5F rewards');
            assert.ok(asNumber(rewards5F.veraPoints, 'rewards.veraPoints') > 0);
            assert.ok(asNumber(rewards5F.mercXp, 'rewards.mercXp') > 0);
            assert.ok(asNumber(rewards5F.azitXp, 'rewards.azitXp') > 0);
            const mats5F = asRecord(rewards5F.materials, '5F materials');
            assert.ok(asNumber(mats5F['mat-slime-jelly'], 'mat-slime-jelly') > 0);
            const items5F = asRecord(rewards5F.items, '5F items');
            assert.ok(asNumber(items5F['item-skill-stone'], 'item-skill-stone') >= 1);
            assert.ok(asNumber(items5F['item-revival-herb'], 'item-revival-herb') >= 1);

            const stFinal = await getAzitState(ctx, user.sessionId);
            assert.equal(stFinal.tower?.highestClearedFloor, 5);
            assert.equal(stFinal.tower?.totalClears, 5);
            const leoFinal = stFinal.mercenaries.find((m) => m.mercCode === 'merc-leo');
            assert.equal(leoFinal?.mainSkill?.level, 2);
            assert.equal(leoFinal?.subSkill?.level, 2);
            assert.ok(stFinal.veraPoints > pointsBeforeTower, 'Expected veraPoints to increase after 1F..5F clears');
        },
    },
    {
        id: 'T3-03',
        tier: 3,
        area: 'Pairwise-Concurrent-Camp-Tower',
        description: 'Simultaneous Camp Bottom Expedition (Group A) + Vera Tower Run (Group B)',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't3-03', points: 15_000, azitLevel: 7 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            await hireMerc(ctx, user.sessionId, 'merc-kael');
            const groupA = await createGroup(ctx, user.sessionId, 'A원정대', ['merc-leo']);
            const groupB = await createGroup(ctx, user.sessionId, 'B등반대', ['merc-rina', 'merc-kael']);

            seedDish(ctx.dbPath, user.userId, 'dish-strawberry-tart', 1);
            const startRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-golem',
                groupId: groupA,
                dishRecipeId: 'dish-strawberry-tart',
            });
            assert.equal(startRes.status, 200);

            // Group A's busy merc-leo / groupA must be rejected in Tower
            const conflictTower = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-leo'],
            });
            assert.ok(conflictTower.status === 400 || conflictTower.status === 409);

            const conflictTowerGroup = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                groupId: groupA,
            });
            assert.ok(
                conflictTowerGroup.status === 400 || conflictTowerGroup.status === 409,
                `Tower battle with busy groupA must be rejected, got ${conflictTowerGroup.status}`
            );

            // Group B clears Tower 1F concurrently
            const okTower = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                groupId: groupB,
            });
            assert.equal(okTower.status, 200, `Tower with Group B failed: ${okTower.rawText}`);
            assert.equal(asRecord(okTower.json.data).won, true, 'Expected Group B to win Tower 1F');

            const stPostTower = await getAzitState(ctx, user.sessionId);
            assert.equal(stPostTower.tower?.highestClearedFloor, 1);
            assert.equal(stPostTower.mercenaries.find((m) => m.mercCode === 'merc-leo')?.status, 'expedition');
            assert.equal(stPostTower.mercenaries.find((m) => m.mercCode === 'merc-rina')?.status, 'idle');
            assert.equal(stPostTower.mercenaries.find((m) => m.mercCode === 'merc-kael')?.status, 'idle');

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '골렘', 20_000);
                    await sleepMs(600);
                    const canvasSel = await findCampBattlefieldCanvasSelector(page);
                    assert.ok(canvasSel !== null, 'Camp bottom battlefield must stay active during/after Tower run');
                    await assertCanvasAnimating(page, canvasSel, 450);
                    const containerText = await getCampBattlefieldContainerText(page, canvasSel);
                    assert.ok(containerText.includes('골렘'), `Expected battlefield text to include "골렘", got: ${containerText}`);
                    assert.ok(containerText.includes('A원정대'), `Expected battlefield text to include "A원정대", got: ${containerText}`);
                    await assertNoHorizontalOverflow(page, 'T3-03');
                }
            );
        },
    },
    {
        id: 'T3-04',
        tier: 3,
        area: 'Pairwise-Dish-Elixir-Synergy',
        description: 'Kitchen Dish Buff + Battle Elixir (item-battle-elixir) synergy on Expedition & Tower',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't3-04', points: 10_000, azitLevel: 5 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');

            // 1. Cook dish-carrot-soup in Kitchen
            seedCropHarvest(ctx.dbPath, user.userId, 'crop-carrot', 3);
            const cookStart = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/kitchen/start', user.sessionId, {
                slotIndex: 0,
                recipeId: 'dish-carrot-soup',
            });
            assert.equal(cookStart.status, 200);
            withDb(ctx.dbPath, (db) => {
                db.prepare(`UPDATE azit_kitchen_slots SET ends_at_ms = ? WHERE user_id = ? AND slot_index = 0`).run(
                    Date.now() - 2000,
                    user.userId
                );
            });
            const cookClaim = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/kitchen/claim', user.sessionId, {
                slotIndex: 0,
            });
            assert.equal(cookClaim.status, 200);

            const stPreBuy = await getAzitState(ctx, user.sessionId);
            const pointsBeforeBuy = stPreBuy.veraPoints;
            const slimeEntryCost =
                stPreBuy.catalog.zones.find((z) => z.zoneId === 'zone-slime')?.entryCost ?? 15;

            // 2. Buy 2 item-battle-elixir in Shop (120P * 2 = 240P)
            const buyElixir = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/shop/buy', user.sessionId, {
                itemId: 'item-battle-elixir',
                qty: 2,
            });
            assert.equal(buyElixir.status, 200, `Shop buy elixir failed: ${buyElixir.rawText}`);

            // 3. Start expedition with dish + elixir & verify intermediate state
            const expStart = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
                elixirItemId: 'item-battle-elixir',
            });
            assert.equal(expStart.status, 200, `Expedition with elixir failed: ${expStart.rawText}`);

            const stAfterExpStart = await getAzitState(ctx, user.sessionId);
            assert.equal(stAfterExpStart.items?.find((i) => i.itemId === 'item-battle-elixir')?.qty ?? 0, 1);
            assert.equal(stAfterExpStart.dishes['dish-carrot-soup'] ?? 0, 0);
            assert.equal(
                stAfterExpStart.veraPoints,
                pointsBeforeBuy - 240 - slimeEntryCost,
                `Expected veraPoints to decrease by 240 + ${slimeEntryCost} = ${240 + slimeEntryCost}P`
            );

            // 4. Tower battle with 2nd elixir
            const towerRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-rina'],
                elixirItemId: 'item-battle-elixir',
            });
            assert.equal(towerRes.status, 200, `Tower with elixir failed: ${towerRes.rawText}`);
            const towerData = asRecord(towerRes.json.data);
            assert.equal(towerData.won, true, 'Expected Tower 1F battle with elixir to win');
            const towerRewards = asRecord(towerData.rewards, 'tower 1F rewards');

            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.items?.find((i) => i.itemId === 'item-battle-elixir')?.qty ?? 0, 0);
            assert.equal(st.veraPoints, stAfterExpStart.veraPoints + asNumber(towerRewards.veraPoints));
            const exp = st.activeExpeditions[0];
            assert.ok(Math.round((exp.endsAtMs - exp.startedAtMs) / 1000) >= 3600);

            const dbElixirs = queryDb(ctx.dbPath, (db) => {
                const expRow = db
                    .prepare(`SELECT elixir_item_id FROM azit_expeditions WHERE id = ?`)
                    .get(exp.id) as { elixir_item_id: string | null } | undefined;
                const towerRow = db
                    .prepare(`SELECT elixir_item_id FROM azit_tower_runs WHERE user_id = ? ORDER BY id DESC LIMIT 1`)
                    .get(user.userId) as { elixir_item_id: string | null } | undefined;
                return {
                    expElixir: expRow?.elixir_item_id ?? null,
                    towerElixir: towerRow?.elixir_item_id ?? null,
                };
            });
            assert.equal(dbElixirs.expElixir, 'item-battle-elixir');
            assert.equal(dbElixirs.towerElixir, 'item-battle-elixir');
        },
    },
    {
        id: 'T3-05',
        tier: 3,
        area: 'Pairwise-GoldBlock-Shop-FeatherRevive',
        description: 'Gold-Upgrade 403 -> Buy item-phoenix-feather in Shop -> Revive Dead Merc with bonus EXP',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't3-05', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            const stAfterHire = await getAzitState(ctx, user.sessionId);
            const pointsAfterHire = stAfterHire.veraPoints;

            const upRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/upgrade', user.sessionId, {
                mercCode: 'merc-leo',
            });
            assert.equal(upRes.status, 403);
            assert.equal(extractErrorCode(upRes), 'GOLD_UPGRADE_DISABLED');

            const buyRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/shop/buy', user.sessionId, {
                itemId: 'item-phoenix-feather',
                qty: 1,
            });
            assert.equal(buyRes.status, 200);
            const stPostBuy = await getAzitState(ctx, user.sessionId);
            assert.equal(stPostBuy.items?.find((i) => i.itemId === 'item-phoenix-feather')?.qty ?? 0, 1);
            assert.equal(stPostBuy.veraPoints, pointsAfterHire - 420);

            setMercDead(ctx.dbPath, user.userId, 'merc-leo');
            const revRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/revive', user.sessionId, {
                mercCode: 'merc-leo',
                itemId: 'item-phoenix-feather',
            });
            assert.equal(revRes.status, 200);

            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.items?.find((i) => i.itemId === 'item-phoenix-feather')?.qty ?? 0, 0);
            const leo = st.mercenaries.find((m) => m.mercCode === 'merc-leo');
            assert.equal(leo?.status, 'idle');
            assert.equal(leo?.level, 1);
            assert.equal(leo?.xp, 30);
            assert.equal(leo?.diedAt ?? null, null);
            assert.equal(leo?.deathZoneId ?? null, null);
            assert.equal(st.veraPoints, pointsAfterHire - 420);
        },
    },
    {
        id: 'T3-06',
        tier: 3,
        area: 'Pairwise-TowerDefeat-SkillUpgrade-RetryWin',
        description: 'Tower Defeat Penalty-Free Recovery -> Skill/Party Upgrade -> Immediate Retry Victory',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't3-06', points: 10_000, azitLevel: 7 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            setTowerHighestFloor(ctx.dbPath, user.userId, 9);
            seedItem(ctx.dbPath, user.userId, 'item-revival-herb', 1);
            const stBeforeLoss = await getAzitState(ctx, user.sessionId);
            const pointsBeforeLoss = stBeforeLoss.veraPoints;
            const attemptsBeforeLoss = stBeforeLoss.tower?.totalAttempts ?? 0;

            // 1. Challenge 10F boss solo Lv1 -> lose
            const loseRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 10,
                partyMercCodes: ['merc-leo'],
            });
            assert.equal(loseRes.status, 200);
            assert.equal(asRecord(loseRes.json.data).won, false);

            const stAfterLoss = await getAzitState(ctx, user.sessionId);
            assert.equal(stAfterLoss.mercenaries[0]?.status, 'idle', 'Defeat must incur 0 death penalty');
            assert.equal(
                stAfterLoss.items?.find((i) => i.itemId === 'item-revival-herb')?.qty ?? 0,
                1,
                'Defeat must not consume revival items'
            );
            assert.equal(stAfterLoss.veraPoints, pointsBeforeLoss, 'Defeat must preserve veraPoints');
            assert.equal(stAfterLoss.tower?.highestClearedFloor, 9, 'Defeat must leave highestClearedFloor at 9');
            assert.equal(
                stAfterLoss.tower?.totalAttempts,
                attemptsBeforeLoss + 1,
                'Defeat must increment totalAttempts'
            );

            // 2. Reinforce party + upgrade skills with item-skill-tome & item-skill-stone
            await hireMerc(ctx, user.sessionId, 'merc-garr');
            await hireMerc(ctx, user.sessionId, 'merc-aria');
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-leo', 8, 0);
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-garr', 8, 0);
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-aria', 8, 0);
            seedItem(ctx.dbPath, user.userId, 'item-skill-stone', 2);
            seedItem(ctx.dbPath, user.userId, 'item-skill-tome', 2);
            const upGarr = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/skills/upgrade', user.sessionId, {
                mercCode: 'merc-garr',
                skillSlot: 'main',
            });
            assert.equal(upGarr.status, 200, `Skill upgrade (merc-garr main) failed: ${upGarr.rawText}`);
            const upAria = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/skills/upgrade', user.sessionId, {
                mercCode: 'merc-aria',
                skillSlot: 'sub',
            });
            assert.equal(upAria.status, 200, `Skill upgrade (merc-aria sub) failed: ${upAria.rawText}`);

            const stPreWin = await getAzitState(ctx, user.sessionId);
            const pointsPreWin = stPreWin.veraPoints;

            // 3. Immediate retry 10F -> win!
            const winRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 10,
                partyMercCodes: ['merc-leo', 'merc-garr', 'merc-aria'],
            });
            assert.equal(winRes.status, 200);
            const winData = asRecord(winRes.json.data);
            assert.equal(winData.won, true);
            assert.equal(winData.isFirstClear, true);

            const rewards10F = asRecord(winData.rewards, '10F boss rewards');
            assert.ok(asNumber(rewards10F.veraPoints, '10F veraPoints') > 0);
            assert.ok(asNumber(rewards10F.mercXp, '10F mercXp') > 0);
            assert.ok(asNumber(rewards10F.azitXp, '10F azitXp') > 0);
            assert.ok(asNumber(asRecord(rewards10F.materials)['mat-slime-jelly']) > 0);
            const items10F = asRecord(rewards10F.items, '10F items');
            assert.ok(asNumber(items10F['item-skill-stone']) >= 2);
            assert.ok(asNumber(items10F['item-skill-tome']) >= 1);
            assert.ok(asNumber(items10F['item-revival-herb']) >= 2);

            const stFinal = await getAzitState(ctx, user.sessionId);
            assert.equal(stFinal.tower?.highestClearedFloor, 10);
            assert.equal(stFinal.mercenaries.find((m) => m.mercCode === 'merc-garr')?.mainSkill?.level, 2);
            assert.equal(stFinal.mercenaries.find((m) => m.mercCode === 'merc-aria')?.subSkill?.level, 2);
            assert.ok(stFinal.veraPoints > pointsPreWin, 'Expected 10F boss win to increase veraPoints');
        },
    },
    {
        id: 'T3-07',
        tier: 3,
        area: 'Pairwise-MultiGroup-Rotation',
        description: '2 Simultaneous Expeditions + 1 Standby Group (active delete/edit blocked, standby delete allowed)',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't3-07', points: 20_000, azitLevel: 7 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            await hireMerc(ctx, user.sessionId, 'merc-kael');
            await hireMerc(ctx, user.sessionId, 'merc-serena');
            const g1 = await createGroup(ctx, user.sessionId, '1팀', ['merc-leo']);
            const g2 = await createGroup(ctx, user.sessionId, '2팀', ['merc-rina']);
            const g3 = await createGroup(ctx, user.sessionId, '대기팀', ['merc-kael', 'merc-serena']);

            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 2);
            const start1 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-slime',
                groupId: g1,
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.equal(start1.status, 200, `Expedition 1 start failed: ${start1.rawText}`);
            const start2 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-goblin',
                groupId: g2,
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.equal(start2.status, 200, `Expedition 2 start failed: ${start2.rawText}`);

            // Active group 1 cannot be deleted or edited
            const delActive = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/delete', user.sessionId, { groupId: g1 });
            assert.equal(delActive.status, 409, `Deleting active group must return 409, got ${delActive.status}: ${delActive.rawText}`);
            assert.equal(extractErrorCode(delActive), 'GROUP_ON_EXPEDITION');

            const editActive = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/save', user.sessionId, {
                id: g1,
                name: '출정중수정불가',
                mercCodes: ['merc-leo'],
            });
            assert.equal(editActive.status, 409, `Editing active group must return 409, got ${editActive.status}: ${editActive.rawText}`);
            assert.equal(extractErrorCode(editActive), 'GROUP_ON_EXPEDITION');

            // Standby group 3 can be edited and deleted
            const editStandby = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/save', user.sessionId, {
                id: g3,
                name: '수정된 대기팀',
                mercCodes: ['merc-kael'],
            });
            assert.equal(editStandby.status, 200);
            const delStandby = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/delete', user.sessionId, { groupId: g3 });
            assert.equal(delStandby.status, 200);

            const st = await getAzitState(ctx, user.sessionId);
            const groupIds = asArray(st.groups).map((g) => asNumber(asRecord(g).id));
            assert.equal(groupIds.length, 2);
            assert.ok(groupIds.includes(g1) && groupIds.includes(g2), 'Expected g1 and g2 to remain');
            assert.ok(!groupIds.includes(g3), 'Expected deleted standby group g3 to be absent');
            assert.equal(st.activeExpeditions.length, 2);
            assert.equal(st.mercenaries.find((m) => m.mercCode === 'merc-leo')?.status, 'expedition');
            assert.equal(st.mercenaries.find((m) => m.mercCode === 'merc-rina')?.status, 'expedition');
            assert.equal(st.mercenaries.find((m) => m.mercCode === 'merc-kael')?.status, 'idle');
            assert.equal(st.mercenaries.find((m) => m.mercCode === 'merc-serena')?.status, 'idle');
        },
    },
    {
        id: 'T3-08',
        tier: 3,
        area: 'Pairwise-CrossSurface-Sync',
        description: 'Cross-surface sync across /mypage Camp, /minihome/me Camp, and API state',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't3-08', points: 10_000, azitLevel: 5 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            await createGroup(ctx, user.sessionId, '동기화조', ['merc-leo', 'merc-rina']);
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);
            const expStartRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.equal(expStartRes.status, 200, `Expedition start failed: ${expStartRes.rawText}`);
            const towerRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-rina'],
            });
            assert.equal(towerRes.status, 200, `Tower 1F battle failed: ${towerRes.rawText}`);
            assert.equal(asRecord(towerRes.json.data).won, true, 'Expected Tower 1F clear in T3-08');

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '슬라임', 20_000);
                    await waitForText(page, '1/200F', 15_000);
                    await sleepMs(400);
                    const canvasSel = await findCampBattlefieldCanvasSelector(page);
                    assert.ok(canvasSel !== null, 'Expected active Camp battlefield canvas on /mypage');
                    await assertCanvasAnimating(page, canvasSel, 450);
                    const bfText = await getCampBattlefieldContainerText(page, canvasSel);
                    assert.ok(bfText.includes('슬라임'), `Expected /mypage battlefield container to include "슬라임", got: ${bfText}`);
                    await assertNoHorizontalOverflow(page, 'T3-08 /mypage');
                }
            );
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/minihome/me',
                async (page) => {
                    await waitForText(page, '용병 캠프', 20_000);
                    const clickedCamp = await clickButtonByText(page, '용병 캠프');
                    assert.ok(clickedCamp, 'Expected "용병 캠프" tab on /minihome/me');
                    await waitForText(page, '슬라임', 15_000);
                    await waitForText(page, '1/200F', 15_000);
                    await sleepMs(400);
                    const canvasSel = await findCampBattlefieldCanvasSelector(page);
                    assert.ok(canvasSel !== null, 'Expected active Camp battlefield canvas on /minihome/me');
                    await assertCanvasAnimating(page, canvasSel, 450);
                    const bfText = await getCampBattlefieldContainerText(page, canvasSel);
                    assert.ok(bfText.includes('슬라임'), `Expected /minihome/me battlefield container to include "슬라임", got: ${bfText}`);
                    await assertNoHorizontalOverflow(page, 'T3-08 /minihome/me');
                }
            );
        },
    },
];

if (isMainModule(import.meta.url)) {
    runStandaloneTier('Tier 3 Combinations', tier3Cases).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
