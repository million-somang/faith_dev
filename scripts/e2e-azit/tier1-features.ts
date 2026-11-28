import assert from 'node:assert/strict';
import {
    asArray,
    asNumber,
    asRecord,
    asString,
    assertCanvasAnimating,
    assertZIndexAboveNav,
    backdateExpedition,
    clickButtonByText,
    clickModalButtonByText,
    extractErrorCode,
    findCampBattlefieldCanvasSelector,
    getAzitState,
    getCampBattlefieldContainerText,
    getCraftRecipePointsCost,
    getCraftRecipeResultItemId,
    getCraftRecipeResultQty,
    getOpenModalText,
    isMainModule,
    isRecord,
    jsonGet,
    jsonPost,
    openAuthedPage,
    openMercGuildModal,
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
    type E2EContext,
    type JsonRecord,
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
): Promise<{ id: number; name: string; mercCodes: string[]; slotIndex: number }> {
    const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/save', sessionId, { name, mercCodes });
    assert.equal(res.status, 200, `POST /groups/save (${name}) failed: ${res.rawText}`);
    const state = await getAzitState(ctx, sessionId);
    const groups = asArray(state.groups, 'state.groups');
    const created = groups.find((g) => isRecord(g) && g.name === name);
    assert.ok(isRecord(created), `Created group "${name}" not found in state.groups`);
    return {
        id: asNumber(created.id, 'group.id'),
        name: asString(created.name, 'group.name'),
        mercCodes: asArray(created.mercCodes, 'group.mercCodes').map((m) => asString(m, 'mercCode')),
        slotIndex: typeof created.slotIndex === 'number' ? created.slotIndex : 0,
    };
}

async function startExpedition(
    ctx: E2EContext,
    sessionId: string,
    payload: JsonRecord
): Promise<number> {
    const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', sessionId, payload);
    assert.equal(res.status, 200, `POST /expeditions/start failed: ${res.rawText}`);
    const state = await getAzitState(ctx, sessionId);
    const zoneId = asString(payload.zoneId, 'zoneId');
    const matching = state.activeExpeditions.filter((e) => e.zoneId === zoneId);
    assert.ok(matching.length > 0, `Started expedition for ${zoneId} not present in activeExpeditions`);
    return matching[matching.length - 1].id;
}

export const tier1Cases: TestCaseDefinition[] = [
    // =========================================================================
    // Area R1: Camp Bottom Battlefield Canvas (6 Cases)
    // =========================================================================
    {
        id: 'T1-R1-01',
        tier: 1,
        area: 'R1',
        description: 'Camp bottom battlefield canvas is hidden/inactive when activeExpeditions === 0',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r1-01', points: 1000 });
            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '용병 토벌 캠프', 20_000);
                    await sleepMs(500);
                    const canvasSel = await findCampBattlefieldCanvasSelector(page);
                    assert.equal(
                        canvasSel,
                        null,
                        `Expected NO active battlefield canvas when 0 expeditions running, found ${canvasSel}`
                    );
                    const text = await page.evaluate(() => document.body.innerText);
                    assert.ok(
                        text.includes('출정 중인 원정대가 없습니다'),
                        'Expected honest empty-expedition message on Camp panel'
                    );
                }
            );
        },
    },
    {
        id: 'T1-R1-02',
        tier: 1,
        area: 'R1',
        description: 'Camp bottom battlefield canvas renders & animates when 1 active expedition exists',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r1-02', points: 3000, azitLevel: 5 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);
            await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '슬라임', 20_000);
                    await sleepMs(1000);
                    const canvasSel = await findCampBattlefieldCanvasSelector(page);
                    assert.ok(canvasSel, 'Expected active Camp bottom battlefield <canvas> when expedition is active');
                    await assertCanvasAnimating(page, canvasSel, 600);
                }
            );
        },
    },
    {
        id: 'T1-R1-03',
        tier: 1,
        area: 'R1',
        description: 'Camp bottom battlefield displays zone theme, monster, party & countdown HUD',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r1-03', points: 5000, azitLevel: 5 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);
            await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-goblin',
                partyMercCodes: ['merc-leo', 'merc-rina'],
                dishRecipeId: 'dish-carrot-soup',
            });

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '고블린', 20_000);
                    const canvasSel = await findCampBattlefieldCanvasSelector(page);
                    assert.ok(canvasSel, 'Expected battlefield canvas for zone-goblin');
                    const hudText = await getCampBattlefieldContainerText(page, canvasSel);
                    assert.ok(
                        hudText.includes('고블린'),
                        `Zone/monster label "고블린" missing inside Camp battlefield container: "${hudText.slice(0, 200)}"`
                    );
                    assert.ok(
                        /\d{1,2}:\d{2}:\d{2}/.test(hudText),
                        `Expected H:MM:SS countdown timer inside Camp battlefield container, got: "${hudText.slice(0, 200)}"`
                    );
                }
            );
        },
    },
    {
        id: 'T1-R1-04',
        tier: 1,
        area: 'R1',
        description: 'Camp bottom battlefield supports switching between 2 simultaneous active expeditions',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r1-04', points: 8000, azitLevel: 7 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            const g1 = await createGroup(ctx, user.sessionId, 'Alpha', ['merc-leo']);
            const g2 = await createGroup(ctx, user.sessionId, 'Beta', ['merc-rina']);
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 2);
            await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-slime',
                groupId: g1.id,
                dishRecipeId: 'dish-carrot-soup',
            });
            await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-goblin',
                groupId: g2.id,
                dishRecipeId: 'dish-carrot-soup',
            });

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '슬라임', 20_000);
                    await waitForText(page, '고블린', 10_000);
                    const canvasSel = await findCampBattlefieldCanvasSelector(page);
                    assert.ok(canvasSel, 'Expected Camp battlefield canvas with 2 simultaneous expeditions');

                    const getActiveHudHeader = (): Promise<string> =>
                        page.evaluate((sel) => {
                            const canvas = document.querySelector(sel);
                            const headerRow = canvas?.previousElementSibling;
                            if (headerRow instanceof HTMLElement && (headerRow.innerText ?? '').includes('실시간 전장')) {
                                return headerRow.innerText.replace(/\s+/g, ' ').trim();
                            }
                            const container = document.querySelector('[data-camp-battlefield="true"]');
                            if (!container) return '';
                            const spans = Array.from(container.querySelectorAll('span'));
                            const badge = spans.find((s) => (s.textContent ?? '').includes('실시간 전장'));
                            const row = badge?.parentElement?.parentElement ?? badge?.parentElement;
                            return row ? (row.textContent ?? '').replace(/\s+/g, ' ').trim() : '';
                        }, canvasSel);

                    const hudBefore = await getActiveHudHeader();
                    assert.ok(
                        hudBefore.includes('고블린') && !hudBefore.includes('슬라임'),
                        `Expected active HUD header to initially show newest expedition "고블린" (not "슬라임"), got: "${hudBefore}"`
                    );

                    const switchedToSlime = await clickButtonByText(page, '슬라임', '[data-camp-battlefield="true"]');
                    assert.ok(switchedToSlime, 'Expected expedition switch button for "슬라임" in Camp battlefield HUD');
                    await sleepMs(350);
                    const hudAfterSlime = await getActiveHudHeader();
                    assert.ok(
                        hudAfterSlime.includes('슬라임') && !hudAfterSlime.includes('고블린'),
                        `Expected active HUD header to switch to "슬라임", got: "${hudAfterSlime}"`
                    );

                    const switchedBackToGoblin = await clickButtonByText(page, '고블린', '[data-camp-battlefield="true"]');
                    assert.ok(switchedBackToGoblin, 'Expected expedition switch button for "고블린" in Camp battlefield HUD');
                    await sleepMs(350);
                    const hudAfterGoblin = await getActiveHudHeader();
                    assert.ok(
                        hudAfterGoblin.includes('고블린') && !hudAfterGoblin.includes('슬라임'),
                        `Expected active HUD header to switch back to "고블린", got: "${hudAfterGoblin}"`
                    );
                    await assertCanvasAnimating(page, canvasSel, 450);
                }
            );
        },
    },
    {
        id: 'T1-R1-05',
        tier: 1,
        area: 'R1',
        description: 'Camp bottom battlefield canvas hides cleanly after claiming final active expedition',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r1-05', points: 3000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);
            const expId = await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });
            backdateExpedition(ctx.dbPath, expId, Date.now() - 2000);

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '전리품 정산', 20_000);
                    const clicked = await clickButtonByText(page, '전리품 정산');
                    assert.ok(clicked, 'Expected claim button "전리품 정산" to be clickable');
                    await waitForText(page, '출정 중인 원정대가 없습니다', 15_000);
                    await sleepMs(400);
                    const canvasSel = await findCampBattlefieldCanvasSelector(page);
                    assert.equal(canvasSel, null, 'Battlefield canvas must hide once activeExpeditions becomes 0');
                }
            );
        },
    },
    {
        id: 'T1-R1-06',
        tier: 1,
        area: 'R1',
        description: 'Camp bottom battlefield renders on /minihome/me Camp zone',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r1-06', points: 3000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);
            await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/minihome/me',
                async (page) => {
                    await waitForText(page, '용병 캠프', 20_000);
                    const clickedCamp = await clickButtonByText(page, '용병 캠프');
                    assert.ok(clickedCamp, 'Expected "용병 캠프" zone tab on /minihome/me');
                    await waitForText(page, '용병 토벌 캠프', 15_000);
                    await sleepMs(800);
                    const canvasSel = await findCampBattlefieldCanvasSelector(page);
                    assert.ok(canvasSel, 'Expected active Camp battlefield canvas on /minihome/me');
                    await assertCanvasAnimating(page, canvasSel, 500);
                }
            );
        },
    },

    // =========================================================================
    // Area R2a: Mercenary Group CRUD & Assignment (6 Cases)
    // =========================================================================
    {
        id: 'T1-R2a-01',
        tier: 1,
        area: 'R2a',
        description: 'Fresh user has empty groups [] and can create a mercenary group',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2a-01', points: 3000, azitLevel: 4 });
            const initial = await getAzitState(ctx, user.sessionId);
            const initialGroups = asArray(initial.groups, 'initial state.groups');
            assert.equal(initialGroups.length, 0, 'Fresh user must have 0 mock groups');

            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');

            const saveRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/save', user.sessionId, {
                name: '선발대',
                mercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(saveRes.status, 200, `POST /groups/save failed: ${saveRes.rawText}`);
            assert.equal(saveRes.json.success, true);

            const after = await getAzitState(ctx, user.sessionId);
            const groups = asArray(after.groups, 'state.groups');
            assert.equal(groups.length, 1);
            const g = asRecord(groups[0], 'group[0]');
            assert.ok(asNumber(g.id, 'group.id') > 0);
            assert.equal(g.name, '선발대');
            assert.deepEqual(g.mercCodes, ['merc-leo', 'merc-rina']);
        },
    },
    {
        id: 'T1-R2a-02',
        tier: 1,
        area: 'R2a',
        description: 'Create multiple independent mercenary groups persisted in SQLite',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2a-02', points: 10_000, azitLevel: 7 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            await hireMerc(ctx, user.sessionId, 'merc-kael');
            await hireMerc(ctx, user.sessionId, 'merc-serena');

            const gA = await createGroup(ctx, user.sessionId, '1조 돌격대', ['merc-leo', 'merc-rina']);
            const gB = await createGroup(ctx, user.sessionId, '2조 지원대', ['merc-kael', 'merc-serena']);
            assert.notEqual(gA.id, gB.id, 'Distinct groups must have distinct IDs');

            const dbRows = queryDb(ctx.dbPath, (db) =>
                db
                    .prepare(
                        `SELECT id, name, is_deleted FROM azit_mercenary_groups WHERE user_id = ? AND is_deleted = 0`
                    )
                    .all(user.userId)
            );
            assert.equal(dbRows.length, 2, 'Expected 2 active rows in azit_mercenary_groups');
        },
    },
    {
        id: 'T1-R2a-03',
        tier: 1,
        area: 'R2a',
        description: 'Update existing mercenary group name and members in-place',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2a-03', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');

            const gA = await createGroup(ctx, user.sessionId, '임시조', ['merc-leo']);
            const updateRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/save', user.sessionId, {
                id: gA.id,
                name: '정예 1조',
                mercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(updateRes.status, 200, `Update group failed: ${updateRes.rawText}`);

            const state = await getAzitState(ctx, user.sessionId);
            const groups = asArray(state.groups, 'state.groups');
            assert.equal(groups.length, 1, 'In-place update must not duplicate group row');
            const updated = asRecord(groups[0], 'group[0]');
            assert.equal(updated.id, gA.id);
            assert.equal(updated.name, '정예 1조');
            assert.deepEqual(updated.mercCodes, ['merc-leo', 'merc-rina']);
        },
    },
    {
        id: 'T1-R2a-04',
        tier: 1,
        area: 'R2a',
        description: 'Soft-delete mercenary group sets is_deleted = 1 and hides from state',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2a-04', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            const gA = await createGroup(ctx, user.sessionId, '해산 예정조', ['merc-leo']);

            const delRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/delete', user.sessionId, {
                groupId: gA.id,
            });
            assert.equal(delRes.status, 200, `Delete group failed: ${delRes.rawText}`);

            const state = await getAzitState(ctx, user.sessionId);
            assert.equal(asArray(state.groups, 'state.groups').length, 0);

            const row = queryDb(ctx.dbPath, (db) =>
                db
                    .prepare(`SELECT is_deleted, deleted_at FROM azit_mercenary_groups WHERE id = ?`)
                    .get(gA.id)
            );
            assert.ok(isRecord(row), 'Deleted group row should remain for soft-delete audit');
            assert.equal(row.is_deleted, 1);
            assert.ok(row.deleted_at !== null && row.deleted_at !== undefined, 'deleted_at must be populated');
        },
    },
    {
        id: 'T1-R2a-05',
        tier: 1,
        area: 'R2a',
        description: 'Camp UI Group builder creates and persists mercenary group across reload',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2a-05', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '용병 토벌 캠프', 20_000);
                    // Open Mercenary Guild modal -> '용병 그룹 편성' tab
                    await openMercGuildModal(page, '용병 그룹 편성');

                    const nameInput = await page.$(
                        'input[placeholder*="토벌대"], input[placeholder*="1군"], input[placeholder*="그룹"], input[name*="group"], input[data-group-name], [role="dialog"] input[type="text"], .fixed.inset-0 input[type="text"]'
                    );
                    assert.ok(nameInput, 'Expected group name input in Group builder UI');
                    await nameInput.click({ clickCount: 3 });
                    await nameInput.type('UI선발대');

                    const pickedLeo = await clickModalButtonByText(page, '레오', '용병 길드');
                    const pickedRina = await clickModalButtonByText(page, '리나', '용병 길드');
                    assert.ok(pickedLeo && pickedRina, 'Expected mercenary selection buttons ("레오", "리나") inside Group builder UI');

                    const saved =
                        (await clickModalButtonByText(page, '그룹 저장', '용병 길드')) ||
                        (await clickModalButtonByText(page, '저장', '용병 길드'));
                    assert.ok(saved, 'Expected Save button in Group builder UI');
                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) =>
                                (m.textContent ?? '').includes('UI선발대')
                            ),
                        { timeout: 10_000 }
                    );

                    await page.reload({ waitUntil: 'networkidle2' });
                    await waitForText(page, '용병 토벌 캠프', 20_000);
                    const state = await getAzitState(ctx, user.sessionId);
                    const savedGroup = asArray(state.groups, 'groups').find(
                        (g): g is JsonRecord => isRecord(g) && g.name === 'UI선발대'
                    );
                    assert.ok(savedGroup, 'Group "UI선발대" created in UI must persist in backend DB across reload');
                    const savedMercs = asArray(savedGroup.mercCodes, 'savedGroup.mercCodes').map((m) =>
                        asString(m, 'mercCode')
                    );
                    assert.deepEqual(
                        [...savedMercs].sort(),
                        ['merc-leo', 'merc-rina'],
                        `Expected saved group "UI선발대" mercCodes to match ["merc-leo", "merc-rina"], got ${JSON.stringify(savedMercs)}`
                    );
                }
            );
        },
    },
    {
        id: 'T1-R2a-06',
        tier: 1,
        area: 'R2a',
        description: 'Expedition dispatch modal allows selecting saved Group A or Group B',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2a-06', points: 6000, azitLevel: 7 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            await createGroup(ctx, user.sessionId, '그린팀', ['merc-leo']);
            await createGroup(ctx, user.sessionId, '블루팀', ['merc-rina']);
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 2);

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '몬스터 원정 출정', 20_000);
                    await clickButtonByText(page, '몬스터 원정 출정');
                    await waitForText(page, '그린팀', 10_000);
                    await waitForText(page, '블루팀', 10_000);
                    const clickedBlue = await clickButtonByText(page, '블루팀');
                    assert.ok(clickedBlue, 'Expected group selector button "블루팀" in Expedition modal');
                    await sleepMs(250);
                    const modalText = await page.evaluate(() => {
                        const modals = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0'));
                        const expModal = modals.find((m) => (m.textContent ?? '').includes('몬스터 토벌 원정'));
                        return expModal instanceof HTMLElement ? expModal.innerText : '';
                    });
                    assert.ok(modalText.length > 0, 'Expected open Expedition modal container');
                    assert.ok(modalText.includes('리나'), `Expected "리나" inside Expedition modal after selecting 블루팀, got: "${modalText.slice(0, 200)}"`);
                }
            );
        },
    },

    // =========================================================================
    // Area R2b: Multi-Zone Simultaneous Expeditions & 1–8h Persistence (6 Cases)
    // =========================================================================
    {
        id: 'T1-R2b-01',
        tier: 1,
        area: 'R2b',
        description: 'Simultaneously dispatch 2 expeditions to distinct zones with separate groups',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2b-01', points: 5000, azitLevel: 1 });
            const st0 = await getAzitState(ctx, user.sessionId);
            assert.ok(
                st0.profile.limits.maxActiveExpeditions >= 2,
                `Expected maxActiveExpeditions >= 2 from Lv1, got ${st0.profile.limits.maxActiveExpeditions}`
            );

            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            const g1 = await createGroup(ctx, user.sessionId, '원정1조', ['merc-leo']);
            const g2 = await createGroup(ctx, user.sessionId, '원정2조', ['merc-rina']);
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 2);

            await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-slime',
                groupId: g1.id,
                dishRecipeId: 'dish-carrot-soup',
            });
            await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-goblin',
                groupId: g2.id,
                dishRecipeId: 'dish-carrot-soup',
            });

            const state = await getAzitState(ctx, user.sessionId);
            assert.equal(state.activeExpeditions.length, 2, 'Expected 2 simultaneous active expeditions');
            const zones = new Set(state.activeExpeditions.map((e) => e.zoneId));
            assert.deepEqual(zones, new Set(['zone-slime', 'zone-goblin']));
            assert.equal(state.mercenaries.find((m) => m.mercCode === 'merc-leo')?.status, 'expedition');
            assert.equal(state.mercenaries.find((m) => m.mercCode === 'merc-rina')?.status, 'expedition');
        },
    },
    {
        id: 'T1-R2b-02',
        tier: 1,
        area: 'R2b',
        description: 'All 6 expedition zones scale strictly between 1h (3600s) and 8h (28800s)',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2b-02', points: 50_000, azitLevel: 15 });
            const state = await getAzitState(ctx, user.sessionId);
            const expectedDurations: Record<string, number> = {
                'zone-slime': 3600,
                'zone-goblin': 7200,
                'zone-forest': 10800,
                'zone-golem': 14400,
                'zone-wyvern': 21600,
                'zone-dragon': 28800,
            };
            for (const [zoneId, expectedSec] of Object.entries(expectedDurations)) {
                const z = state.catalog.zones.find((item) => item.zoneId === zoneId);
                assert.ok(z, `Zone ${zoneId} missing from catalog`);
                assert.equal(
                    z.durationSec,
                    expectedSec,
                    `Zone ${zoneId} catalog durationSec expected ${expectedSec}, got ${z.durationSec}`
                );
                assert.ok(z.durationSec >= 3600 && z.durationSec <= 28800);
            }

            // Also verify actual dispatched start/end timestamps in SQLite for min (1h) & max (8h)
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);
            seedDish(ctx.dbPath, user.userId, 'dish-dragon-elixir', 1);

            const expMin = await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });
            const expMax = await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-dragon',
                partyMercCodes: ['merc-rina'],
                dishRecipeId: 'dish-dragon-elixir',
            });

            const after = await getAzitState(ctx, user.sessionId);
            const rMin = after.activeExpeditions.find((e) => e.id === expMin);
            const rMax = after.activeExpeditions.find((e) => e.id === expMax);
            assert.ok(rMin && rMax);
            const minSec = Math.round((rMin.endsAtMs - rMin.startedAtMs) / 1000);
            const maxSec = Math.round((rMax.endsAtMs - rMax.startedAtMs) / 1000);
            assert.ok(minSec >= 3600 && minSec <= 28800, `Min zone duration out of 1h-8h bounds: ${minSec}s`);
            assert.ok(
                maxSec >= 20_000 && maxSec <= 28800 && maxSec > minSec,
                `Max zone duration must scale strictly > minSec (${minSec}s) within 8h bounds: ${maxSec}s`
            );
        },
    },
    {
        id: 'T1-R2b-03',
        tier: 1,
        area: 'R2b',
        description: 'Active 8h expedition state persists across isolated API server restart',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2b-03', points: 20_000, azitLevel: 10 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            const g1 = await createGroup(ctx, user.sessionId, '심연조', ['merc-leo']);
            seedDish(ctx.dbPath, user.userId, 'dish-dragon-elixir', 1);

            const expId = await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-dragon',
                groupId: g1.id,
                dishRecipeId: 'dish-dragon-elixir',
            });

            const before = await getAzitState(ctx, user.sessionId);
            const expBefore = before.activeExpeditions.find((e) => e.id === expId);
            assert.ok(expBefore);

            await ctx.restartApiServer();

            const after = await getAzitState(ctx, user.sessionId);
            const expAfter = after.activeExpeditions.find((e) => e.id === expId);
            assert.ok(expAfter, 'Active expedition lost after server restart');
            assert.equal(expAfter.zoneId, 'zone-dragon');
            assert.equal(expAfter.startedAtMs, expBefore.startedAtMs);
            assert.equal(expAfter.endsAtMs, expBefore.endsAtMs);
            assert.equal(expAfter.groupId, g1.id);
        },
    },
    {
        id: 'T1-R2b-04',
        tier: 1,
        area: 'R2b',
        description: 'Expedition start atomically deducts dish, entryCost & binds groupId/groupName',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2b-04', points: 5000, azitLevel: 5 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            const g1 = await createGroup(ctx, user.sessionId, '도시락조', ['merc-leo']);
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 2, 1);

            const before = await getAzitState(ctx, user.sessionId);
            const zone = before.catalog.zones.find((z) => z.zoneId === 'zone-goblin');
            assert.ok(zone);

            await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-goblin',
                groupId: g1.id,
                dishRecipeId: 'dish-carrot-soup',
                dishQuality: 'special',
                useSpecialDish: true,
            });

            const after = await getAzitState(ctx, user.sessionId);
            assert.equal(after.veraPoints, before.veraPoints - zone.entryCost);
            assert.equal(after.specialDishes?.['dish-carrot-soup'] ?? 0, 0);
            assert.equal(after.activeExpeditions[0].groupId, g1.id);
            assert.equal(after.activeExpeditions[0].groupName, '도시락조');
        },
    },
    {
        id: 'T1-R2b-05',
        tier: 1,
        area: 'R2b',
        description: 'Staggered claim settles finished expedition while other simultaneous expedition keeps running',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2b-05', points: 10_000, azitLevel: 7 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 2);

            const exp1 = await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });
            const exp2 = await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-goblin',
                partyMercCodes: ['merc-rina'],
                dishRecipeId: 'dish-carrot-soup',
            });

            backdateExpedition(ctx.dbPath, exp1, Date.now() - 2000);
            const claimRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, {
                expeditionId: exp1,
            });
            assert.equal(claimRes.status, 200, `Claim exp1 failed: ${claimRes.rawText}`);

            const state = await getAzitState(ctx, user.sessionId);
            assert.equal(state.activeExpeditions.length, 1);
            assert.equal(state.activeExpeditions[0].id, exp2);
            assert.equal(state.mercenaries.find((m) => m.mercCode === 'merc-rina')?.status, 'expedition');
        },
    },
    {
        id: 'T1-R2b-06',
        tier: 1,
        area: 'R2b',
        description: 'Lv5+ user with 3 groups can dispatch 3 expeditions simultaneously',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2b-06', points: 20_000, azitLevel: 7 });
            const state0 = await getAzitState(ctx, user.sessionId);
            assert.ok(state0.profile.limits.maxActiveExpeditions >= 3, 'Expected maxActiveExpeditions >= 3 at Lv7');

            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            await hireMerc(ctx, user.sessionId, 'merc-kael');
            const g1 = await createGroup(ctx, user.sessionId, '1대', ['merc-leo']);
            const g2 = await createGroup(ctx, user.sessionId, '2대', ['merc-rina']);
            const g3 = await createGroup(ctx, user.sessionId, '3대', ['merc-kael']);
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 2);
            seedDish(ctx.dbPath, user.userId, 'dish-tomato-stew', 2);

            await startExpedition(ctx, user.sessionId, { zoneId: 'zone-slime', groupId: g1.id, dishRecipeId: 'dish-carrot-soup' });
            await startExpedition(ctx, user.sessionId, { zoneId: 'zone-goblin', groupId: g2.id, dishRecipeId: 'dish-carrot-soup' });
            await startExpedition(ctx, user.sessionId, { zoneId: 'zone-forest', groupId: g3.id, dishRecipeId: 'dish-tomato-stew' });

            const state = await getAzitState(ctx, user.sessionId);
            assert.equal(state.activeExpeditions.length, 3);
        },
    },

    // =========================================================================
    // Area R2c: Mercenary Death, Item-Only Revival & Item Acquisition (7 Cases)
    // =========================================================================
    {
        id: 'T1-R2c-01',
        tier: 1,
        area: 'R2c',
        description: 'High-risk underpowered expedition loss can cause mercenary death (status = dead)',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2c-01', points: 100_000, azitLevel: 10 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');

            let died = false;
            for (let attempt = 0; attempt < 25; attempt += 1) {
                seedDish(ctx.dbPath, user.userId, 'dish-dragon-elixir', 1);
                const expId = await startExpedition(ctx, user.sessionId, {
                    zoneId: 'zone-dragon',
                    partyMercCodes: ['merc-leo'],
                    dishRecipeId: 'dish-dragon-elixir',
                });
                backdateExpedition(ctx.dbPath, expId, Date.now() - 2000);
                const claimRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, {
                    expeditionId: expId,
                });
                assert.equal(claimRes.status, 200, `Claim failed on attempt ${attempt}: ${claimRes.rawText}`);
                const st = await getAzitState(ctx, user.sessionId);
                const leo = st.mercenaries.find((m) => m.mercCode === 'merc-leo');
                assert.ok(leo);
                if (leo.status === 'dead') {
                    assert.ok(leo.diedAt, 'diedAt must be populated when status === dead');
                    assert.equal(leo.deathZoneId, 'zone-dragon');
                    const dbRow = queryDb(ctx.dbPath, (db) =>
                        db
                            .prepare(`SELECT status, died_at FROM azit_mercenaries WHERE user_id = ? AND merc_code = 'merc-leo'`)
                            .get(user.userId)
                    );
                    assert.ok(isRecord(dbRow) && dbRow.status === 'dead');
                    died = true;
                    break;
                }
            }
            assert.ok(died, 'Expected solo Lv1 merc-leo in zone-dragon to suffer casualty within 25 runs');
        },
    },
    {
        id: 'T1-R2c-02',
        tier: 1,
        area: 'R2c',
        description: 'Dead mercenary CANNOT be revived using gold / points',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2c-02', points: 25_000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            setMercDead(ctx.dbPath, user.userId, 'merc-leo');

            for (const badPayload of [
                { mercCode: 'merc-leo', useGold: true },
                { mercCode: 'merc-leo', itemId: 'gold' },
                { mercCode: 'merc-leo' },
            ]) {
                const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/revive', user.sessionId, badPayload);
                assert.ok(
                    res.status === 400 || res.status === 403,
                    `Gold/empty revival must be rejected (400/403), got ${res.status}: ${res.rawText}`
                );
            }

            const state = await getAzitState(ctx, user.sessionId);
            assert.equal(state.mercenaries.find((m) => m.mercCode === 'merc-leo')?.status, 'dead');
            assert.equal(state.veraPoints, 25_000 - 60); // only hireCost deducted
        },
    },
    {
        id: 'T1-R2c-03',
        tier: 1,
        area: 'R2c',
        description: 'Revive dead mercenary by consuming item-revival-herb (zero gold spent)',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2c-03', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            setMercDead(ctx.dbPath, user.userId, 'merc-leo');
            seedItem(ctx.dbPath, user.userId, 'item-revival-herb', 2);

            const before = await getAzitState(ctx, user.sessionId);
            const revRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/revive', user.sessionId, {
                mercCode: 'merc-leo',
                itemId: 'item-revival-herb',
            });
            assert.equal(revRes.status, 200, `Revive with herb failed: ${revRes.rawText}`);

            const after = await getAzitState(ctx, user.sessionId);
            const leo = after.mercenaries.find((m) => m.mercCode === 'merc-leo');
            assert.equal(leo?.status, 'idle');
            assert.equal(leo?.diedAt ?? null, null);
            assert.equal(after.veraPoints, before.veraPoints, 'Item revival must spend 0 gold');
            assert.equal(after.items?.find((i) => i.itemId === 'item-revival-herb')?.qty, 1);
        },
    },
    {
        id: 'T1-R2c-04',
        tier: 1,
        area: 'R2c',
        description: 'Revive dead mercenary with item-phoenix-feather grants idle + bonus merc XP',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2c-04', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            setMercDead(ctx.dbPath, user.userId, 'merc-rina');
            seedItem(ctx.dbPath, user.userId, 'item-phoenix-feather', 1);

            const revRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/revive', user.sessionId, {
                mercCode: 'merc-rina',
                itemId: 'item-phoenix-feather',
            });
            assert.equal(revRes.status, 200, `Revive with phoenix feather failed: ${revRes.rawText}`);

            const after = await getAzitState(ctx, user.sessionId);
            const rina = after.mercenaries.find((m) => m.mercCode === 'merc-rina');
            assert.equal(rina?.status, 'idle');
            assert.ok((rina?.xp ?? 0) >= 30 || (rina?.level ?? 1) > 1, 'Phoenix feather revival must grant bonus merc XP');
            assert.equal(after.items?.find((i) => i.itemId === 'item-phoenix-feather')?.qty ?? 0, 0);
        },
    },
    {
        id: 'T1-R2c-05',
        tier: 1,
        area: 'R2c',
        description: 'Acquire revival & battle items from Azit Shop (POST /shop/buy)',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2c-05', points: 2000, azitLevel: 3 });
            const before = await getAzitState(ctx, user.sessionId);
            const itemsCat = asArray(before.catalog.items, 'catalog.items');
            const herbDef = itemsCat.find((i) => isRecord(i) && i.itemId === 'item-revival-herb');
            const featherDef = itemsCat.find((i) => isRecord(i) && i.itemId === 'item-phoenix-feather');
            assert.ok(isRecord(herbDef) && isRecord(featherDef), 'Revival items missing from catalog.items');

            const herbPrice = asNumber(herbDef.shopPrice, 'herb.shopPrice');
            const featherPrice = asNumber(featherDef.shopPrice, 'feather.shopPrice');

            const buy1 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/shop/buy', user.sessionId, {
                itemId: 'item-revival-herb',
                qty: 2,
            });
            assert.equal(buy1.status, 200, `Shop buy herb failed: ${buy1.rawText}`);

            const buy2 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/shop/buy', user.sessionId, {
                itemId: 'item-phoenix-feather',
                qty: 1,
            });
            assert.equal(buy2.status, 200, `Shop buy feather failed: ${buy2.rawText}`);

            const after = await getAzitState(ctx, user.sessionId);
            assert.equal(after.veraPoints, 2000 - (herbPrice * 2 + featherPrice));
            assert.equal(after.items?.find((i) => i.itemId === 'item-revival-herb')?.qty, 2);
            assert.equal(after.items?.find((i) => i.itemId === 'item-phoenix-feather')?.qty, 1);
        },
    },
    {
        id: 'T1-R2c-06',
        tier: 1,
        area: 'R2c',
        description: 'Acquire revival item via Azit Craft (POST /craft) consuming crops + monster materials',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2c-06', points: 5000, azitLevel: 5 });
            const before = await getAzitState(ctx, user.sessionId);
            const recipes = asArray(before.catalog.craftRecipes, 'catalog.craftRecipes');
            const herbRecipeRaw = recipes.find(
                (r) => isRecord(r) && getCraftRecipeResultItemId(r) === 'item-revival-herb'
            );
            assert.ok(isRecord(herbRecipeRaw), 'Expected revival herb craft recipe in catalog.craftRecipes');

            const recipeId = asString(herbRecipeRaw.recipeId, 'recipe.recipeId');
            const pointsCost = getCraftRecipePointsCost(herbRecipeRaw);
            const resultQty = getCraftRecipeResultQty(herbRecipeRaw);
            const ingredients = asArray(herbRecipeRaw.ingredients, 'recipe.ingredients');
            assert.ok(ingredients.length > 0, 'Craft recipe must require ingredients');

            for (const ingRaw of ingredients) {
                const ing = asRecord(ingRaw, 'ingredient');
                const kind = asString(ing.kind, 'ing.kind');
                const id = asString(ing.id, 'ing.id');
                const qty = asNumber(ing.qty, 'ing.qty');
                if (kind === 'crop') seedCropHarvest(ctx.dbPath, user.userId, id, qty + 1);
                else if (kind === 'material') seedMaterial(ctx.dbPath, user.userId, id, qty + 1);
                else if (kind === 'item') seedItem(ctx.dbPath, user.userId, id, qty + 1);
            }

            const craftRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/craft', user.sessionId, {
                recipeId,
                qty: 1,
            });
            assert.equal(craftRes.status, 200, `POST /craft failed: ${craftRes.rawText}`);

            const after = await getAzitState(ctx, user.sessionId);
            assert.equal(after.veraPoints, before.veraPoints - pointsCost);
            assert.equal(after.items?.find((i) => i.itemId === 'item-revival-herb')?.qty, resultQty);
            for (const ingRaw of ingredients) {
                const ing = asRecord(ingRaw, 'ingredient');
                const kind = asString(ing.kind, 'ing.kind');
                const id = asString(ing.id, 'ing.id');
                if (kind === 'crop') assert.equal(after.garden.harvestCounts[id], 1);
                else if (kind === 'material') assert.equal(after.materials[id], 1);
            }
        },
    },
    {
        id: 'T1-R2c-07',
        tier: 1,
        area: 'R2c',
        description: 'Acquire revival & skill items as drops from high-tier expedition & Vera Tower milestone',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r2c-07', points: 50_000, azitLevel: 15 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            await hireMerc(ctx, user.sessionId, 'merc-aria');
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-leo', 15, 0);
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-rina', 15, 0);
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-aria', 15, 0);
            seedDish(ctx.dbPath, user.userId, 'dish-dragon-elixir', 1, 1);

            const expId = await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-dragon',
                partyMercCodes: ['merc-leo', 'merc-rina', 'merc-aria'],
                dishRecipeId: 'dish-dragon-elixir',
                dishQuality: 'special',
                useSpecialDish: true,
            });
            backdateExpedition(ctx.dbPath, expId, Date.now() - 2000);
            const claimRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, {
                expeditionId: expId,
            });
            assert.equal(claimRes.status, 200, `Claim zone-dragon failed: ${claimRes.rawText}`);
            const claimData = asRecord(claimRes.json.data, 'zone-dragon claim data');
            const claimReport = isRecord(claimData.report) ? claimData.report : claimData;
            assert.equal(claimReport.won, true, `Expected Lv15 3-merc party to win zone-dragon: ${claimRes.rawText}`);

            const afterExpState = await getAzitState(ctx, user.sessionId);
            const expItemMap = new Map((afterExpState.items ?? []).map((it) => [it.itemId, it.qty]));
            assert.ok(
                (expItemMap.get('item-phoenix-feather') ?? 0) >= 1,
                `Expected zone-dragon win to drop revival item (item-phoenix-feather), got items=${JSON.stringify(afterExpState.items)}`
            );
            assert.ok(
                (expItemMap.get('item-skill-tome') ?? 0) >= 1,
                `Expected zone-dragon win to drop skill item (item-skill-tome), got items=${JSON.stringify(afterExpState.items)}`
            );

            // Also run Tower 1F..5F to verify milestone drop independently
            let fifthFloorDrops: JsonRecord = {};
            for (let f = 1; f <= 5; f += 1) {
                const tRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                    floor: f,
                    partyMercCodes: ['merc-leo', 'merc-rina', 'merc-aria'],
                });
                assert.equal(tRes.status, 200, `Tower ${f}F failed: ${tRes.rawText}`);
                const tData = asRecord(tRes.json.data, `tower ${f}F data`);
                assert.equal(tData.won, true, `Expected Lv15 party to clear Tower ${f}F`);
                if (f === 5) {
                    const rewards = asRecord(tData.rewards, 'tower 5F rewards');
                    fifthFloorDrops = isRecord(rewards.items) ? rewards.items : {};
                }
            }

            assert.ok(
                typeof fifthFloorDrops['item-revival-herb'] === 'number' && fifthFloorDrops['item-revival-herb'] >= 1,
                `Expected Tower 5F mini-boss drop of item-revival-herb, got ${JSON.stringify(fifthFloorDrops)}`
            );
            assert.ok(
                typeof fifthFloorDrops['item-skill-stone'] === 'number' && fifthFloorDrops['item-skill-stone'] >= 1,
                `Expected Tower 5F drop of item-skill-stone, got ${JSON.stringify(fifthFloorDrops)}`
            );

            const state = await getAzitState(ctx, user.sessionId);
            const catalogItems = new Map(
                (state.catalog.items ?? []).map((ci) => [ci.itemId, ci.category])
            );
            assert.equal(catalogItems.get('item-phoenix-feather'), 'revival');
            assert.equal(catalogItems.get('item-revival-herb'), 'revival');
            assert.equal(catalogItems.get('item-skill-tome'), 'skill_mat');
            assert.equal(catalogItems.get('item-skill-stone'), 'skill_mat');
            const totalItems = (state.items ?? []).reduce((acc, it) => acc + it.qty, 0);
            assert.ok(totalItems >= 4, `Expected combined item drops from zone-dragon & Tower 1F..5F, got items=${JSON.stringify(state.items)}`);
        },
    },

    // =========================================================================
    // Area R3a: Gold Level-Up Disabled & Combat-Only EXP Leveling (5 Cases)
    // =========================================================================
    {
        id: 'T1-R3a-01',
        tier: 1,
        area: 'R3a',
        description: 'POST /api/azit-game/mercenaries/upgrade is disabled and returns 403 GOLD_UPGRADE_DISABLED',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r3a-01', points: 50_000, azitLevel: 5 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');

            const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/upgrade', user.sessionId, {
                mercCode: 'merc-leo',
            });
            assert.equal(res.status, 403, `Expected 403 GOLD_UPGRADE_DISABLED, got ${res.status}: ${res.rawText}`);
            assert.equal(extractErrorCode(res), 'GOLD_UPGRADE_DISABLED');

            const state = await getAzitState(ctx, user.sessionId);
            const leo = state.mercenaries.find((m) => m.mercCode === 'merc-leo');
            assert.equal(leo?.level, 1);
            assert.equal(leo?.xp, 0);
        },
    },
    {
        id: 'T1-R3a-02',
        tier: 1,
        area: 'R3a',
        description: 'All mercenaries in GET /state expose upgradeCost: null',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r3a-02', points: 50_000, azitLevel: 10 });
            for (const code of ['merc-leo', 'merc-rina', 'merc-kael', 'merc-serena', 'merc-garr', 'merc-aria']) {
                await hireMerc(ctx, user.sessionId, code);
            }
            const state = await getAzitState(ctx, user.sessionId);
            assert.equal(state.mercenaries.length, 6);
            for (const m of state.mercenaries) {
                assert.equal(m.upgradeCost, null, `${m.mercCode} must have upgradeCost: null`);
            }
        },
    },
    {
        id: 'T1-R3a-03',
        tier: 1,
        area: 'R3a',
        description: 'Mercenary Roster UI removes gold level-up buttons and shows EXP combat-only leveling',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r3a-03', points: 50_000, azitLevel: 5 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '용병 토벌 캠프', 20_000);
                    await openMercGuildModal(page);
                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                const txt = m.textContent ?? '';
                                return txt.includes('용병 길드') && txt.includes('레오');
                            }),
                        { timeout: 10_000 }
                    );

                    const modalText = await getOpenModalText(page, '용병 길드');
                    assert.ok(modalText.includes('레오'), `Expected mercenary card "레오" inside Mercenary Guild modal, got: "${modalText.slice(0, 180)}"`);
                    assert.ok(
                        modalText.includes('전투 경험치') ||
                            modalText.includes('전투로만 레벨업') ||
                            modalText.includes('전투로 성장'),
                        `Expected combat-only EXP label inside Mercenary Guild modal, got: "${modalText.slice(0, 250)}"`
                    );

                    const goldBtnPresent = await page.evaluate(() => {
                        const modals = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0'));
                        const modal = modals.find((m) => (m.textContent ?? '').includes('용병 길드')) ?? modals[modals.length - 1];
                        if (!modal) return true;
                        const btns = Array.from(modal.querySelectorAll('button'));
                        return btns.some((b) => {
                            const txt = b.textContent ?? '';
                            return txt.includes('훈련 강화') || (txt.includes('레벨업') && /\d[\d,]*\s*P/.test(txt));
                        });
                    });
                    assert.equal(goldBtnPresent, false, 'Gold level-up button must NOT exist in Mercenary UI');
                }
            );
        },
    },
    {
        id: 'T1-R3a-04',
        tier: 1,
        area: 'R3a',
        description: 'Expedition combat EXP levels up mercenary and increases combat stats',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r3a-04', points: 20_000, azitLevel: 10 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            await hireMerc(ctx, user.sessionId, 'merc-kael');
            const before = await getAzitState(ctx, user.sessionId);
            const leoBefore = before.mercenaries.find((m) => m.mercCode === 'merc-leo');
            assert.ok(leoBefore);

            // Clear 2h zone-goblin (awards 130 MercEXP, far exceeding Lv1->Lv2 60XP, with 0% death risk for 3-merc party)
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1, 1);
            const expId = await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-goblin',
                partyMercCodes: ['merc-leo', 'merc-rina', 'merc-kael'],
                dishRecipeId: 'dish-carrot-soup',
                dishQuality: 'special',
                useSpecialDish: true,
            });
            backdateExpedition(ctx.dbPath, expId, Date.now() - 2000);
            const claimRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, {
                expeditionId: expId,
            });
            assert.equal(claimRes.status, 200, `Claim failed: ${claimRes.rawText}`);

            const after = await getAzitState(ctx, user.sessionId);
            const leoAfter = after.mercenaries.find((m) => m.mercCode === 'merc-leo');
            assert.ok(leoAfter);
            assert.equal(leoAfter.status, 'idle', 'Expected safe zone-goblin party to survive with status === idle');
            assert.ok(
                leoAfter.level > leoBefore.level,
                `Expected merc-leo level-up from expedition combat EXP, got Lv${leoAfter.level} XP${leoAfter.xp}`
            );
            assert.ok(leoAfter.power > leoBefore.power, 'Level-up must increase mercenary power');
        },
    },
    {
        id: 'T1-R3a-05',
        tier: 1,
        area: 'R3a',
        description: 'Vera Tower combat EXP accumulates and levels up mercenaries without spending gold',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r3a-05', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            const before = await getAzitState(ctx, user.sessionId);

            // Clear 1F and 2F so EXP > 60 triggers Lv1 -> Lv2+
            const b1 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(b1.status, 200, `Tower 1F failed: ${b1.rawText}`);
            const b2 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 2,
                partyMercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(b2.status, 200, `Tower 2F failed: ${b2.rawText}`);

            const after = await getAzitState(ctx, user.sessionId);
            const rina = after.mercenaries.find((m) => m.mercCode === 'merc-rina');
            assert.ok(rina);
            assert.ok(rina.level >= 2, `Expected merc-rina to reach Lv2+ from Tower combat EXP, got Lv${rina.level} (xp=${rina.xp})`);
            assert.ok(after.veraPoints > before.veraPoints, 'Tower clears should grant gold, never spend gold to level up');
        },
    },

    // =========================================================================
    // Area R3b: Main/Sub Skills & Autonomous Auto-Combat (6 Cases)
    // =========================================================================
    {
        id: 'T1-R3b-01',
        tier: 1,
        area: 'R3b',
        description: 'Every mercenary (merc-leo..merc-aria) has combat stats and unique Main & Sub skills',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r3b-01', points: 20_000, azitLevel: 10 });
            for (const code of ['merc-leo', 'merc-rina', 'merc-kael', 'merc-serena', 'merc-garr', 'merc-aria']) {
                await hireMerc(ctx, user.sessionId, code);
            }
            const state = await getAzitState(ctx, user.sessionId);
            const skillIds = new Set<string>();
            for (const m of state.mercenaries) {
                assert.ok((m.maxHp ?? 0) > 0 && (m.atk ?? 0) > 0 && (m.spd ?? 0) > 0, `${m.mercCode} missing combat stats`);
                assert.ok(m.mainSkill && m.subSkill, `${m.mercCode} missing mainSkill or subSkill`);
                assert.notEqual(m.mainSkill.id, m.subSkill.id, `${m.mercCode} main and sub skill IDs must differ`);
                assert.equal(m.mainSkill.level, 1);
                assert.equal(m.subSkill.level, 1);
                assert.ok(m.mainSkill.cooldownMs > 0 && m.subSkill.cooldownMs > 0);
                skillIds.add(m.mainSkill.id);
                skillIds.add(m.subSkill.id);
            }
            assert.equal(skillIds.size, 12, 'Expected 12 unique skills across all 6 mercenaries');
        },
    },
    {
        id: 'T1-R3b-02',
        tier: 1,
        area: 'R3b',
        description: 'Upgrade mercenary Main Skill via item-skill-tome',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r3b-02', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedItem(ctx.dbPath, user.userId, 'item-skill-tome', 2);

            const before = await getAzitState(ctx, user.sessionId);
            const leoBefore = before.mercenaries.find((m) => m.mercCode === 'merc-leo');
            assert.ok(leoBefore?.mainSkill);

            const upRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/skills/upgrade', user.sessionId, {
                mercCode: 'merc-leo',
                skillSlot: 'main',
            });
            assert.equal(upRes.status, 200, `Main skill upgrade failed: ${upRes.rawText}`);

            const after = await getAzitState(ctx, user.sessionId);
            const leoAfter = after.mercenaries.find((m) => m.mercCode === 'merc-leo');
            assert.equal(leoAfter?.mainSkill?.level, 2);
            assert.equal(leoAfter?.subSkill?.level, 1);
            assert.ok((leoAfter?.mainSkill?.powerPct ?? 0) > leoBefore.mainSkill.powerPct);
            assert.equal(after.items?.find((i) => i.itemId === 'item-skill-tome')?.qty, 1);
        },
    },
    {
        id: 'T1-R3b-03',
        tier: 1,
        area: 'R3b',
        description: 'Upgrade mercenary Sub Skill via item-skill-stone',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r3b-03', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedItem(ctx.dbPath, user.userId, 'item-skill-stone', 2);

            const upRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/skills/upgrade', user.sessionId, {
                mercCode: 'merc-leo',
                skillSlot: 'sub',
            });
            assert.equal(upRes.status, 200, `Sub skill upgrade failed: ${upRes.rawText}`);

            const after = await getAzitState(ctx, user.sessionId);
            const leoAfter = after.mercenaries.find((m) => m.mercCode === 'merc-leo');
            assert.equal(leoAfter?.subSkill?.level, 2);
            assert.equal(leoAfter?.mainSkill?.level, 1);
            assert.equal(after.items?.find((i) => i.itemId === 'item-skill-stone')?.qty, 1);
        },
    },
    {
        id: 'T1-R3b-04',
        tier: 1,
        area: 'R3b',
        description: 'Autonomous auto-combat simulation moves units, attacks, and casts Main & Sub skills without input',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r3b-04', points: 10_000, azitLevel: 5 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            await hireMerc(ctx, user.sessionId, 'merc-serena');
            // Unlock 5F mini-boss so combat lasts long enough for BOTH Main and Sub skill cooldowns to fire
            setTowerHighestFloor(ctx.dbPath, user.userId, 4);

            const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 5,
                partyMercCodes: ['merc-leo', 'merc-rina', 'merc-serena'],
            });
            assert.equal(res.status, 200, `Tower 5F battle failed: ${res.rawText}`);
            const data = asRecord(res.json.data, 'tower.battle data');
            const frames = asArray(data.frames, 'tower.battle frames');
            assert.ok(frames.length >= 2, `Expected >= 2 simulation frames, got ${frames.length}`);

            const isAllyUnit = (u: JsonRecord): boolean =>
                u.side === 'ally' ||
                (typeof u.unitId === 'string' && u.unitId.startsWith('merc-')) ||
                (typeof u.id === 'string' && u.id.startsWith('merc-'));

            // Verify autonomous ally position changes across frames using unitId
            const f0 = asRecord(frames[0], 'frames[0]');
            const fLast = asRecord(frames[Math.min(frames.length - 1, 10)], 'frames[k]');
            const units0 = asArray(f0.units, 'frames[0].units');
            const unitsK = asArray(fLast.units, 'frames[k].units');
            let allyMoved = false;
            for (const u0Raw of units0) {
                if (!isRecord(u0Raw) || !isAllyUnit(u0Raw)) continue;
                const u0Id =
                    typeof u0Raw.unitId === 'string'
                        ? u0Raw.unitId
                        : typeof u0Raw.id === 'string'
                          ? u0Raw.id
                          : '';
                assert.ok(u0Id.length > 0, `Expected unitId string on ally frame unit: ${JSON.stringify(u0Raw)}`);
                const uKRaw = unitsK.find((x) => {
                    if (!isRecord(x)) return false;
                    const xId = typeof x.unitId === 'string' ? x.unitId : typeof x.id === 'string' ? x.id : '';
                    return xId === u0Id;
                });
                if (isRecord(uKRaw) && (u0Raw.x !== uKRaw.x || u0Raw.y !== uKRaw.y)) {
                    allyMoved = true;
                    break;
                }
            }
            assert.ok(allyMoved, 'Expected autonomous ally unit movement (x, y delta) across combat frames');

            // Verify ally basic attack, Main Skill, AND Sub Skill activations appear in frames
            let sawAllyBasicAttack = false;
            let sawAllyMainSkill = false;
            let sawAllySubSkill = false;
            for (const frRaw of frames) {
                if (!isRecord(frRaw) || !Array.isArray(frRaw.units)) continue;
                for (const uRaw of frRaw.units) {
                    if (!isRecord(uRaw) || !isAllyUnit(uRaw)) continue;
                    if (uRaw.action === 'attack') sawAllyBasicAttack = true;
                    if (uRaw.action === 'skill_main') sawAllyMainSkill = true;
                    if (uRaw.action === 'skill_sub') sawAllySubSkill = true;
                }
            }
            assert.ok(sawAllyBasicAttack, 'Expected autonomous ally normal basic attack (action === "attack") in frames');
            assert.ok(sawAllyMainSkill, 'Expected autonomous ally Main Skill activation (action === "skill_main") in frames');
            assert.ok(sawAllySubSkill, 'Expected autonomous ally Sub Skill activation (action === "skill_sub") in frames');
        },
    },
    {
        id: 'T1-R3b-05',
        tier: 1,
        area: 'R3b',
        description: 'Camp Mercenary Roster UI renders Main/Sub skills and allows item skill upgrade',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r3b-05', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedItem(ctx.dbPath, user.userId, 'item-skill-stone', 2);

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '용병 토벌 캠프', 20_000);
                    await openMercGuildModal(page);
                    const stateBefore = await getAzitState(ctx, user.sessionId);
                    const subName = stateBefore.mercenaries[0]?.subSkill?.name ?? '서브';
                    await page.waitForFunction(
                        (sName: string) =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                const txt = m.textContent ?? '';
                                return txt.includes('용병 길드') && txt.includes('레오') && txt.includes(sName);
                            }),
                        { timeout: 10_000 },
                        subName
                    );

                    const clickedUpgrade =
                        (await clickModalButtonByText(page, '연마석으로 강화', '용병 길드')) ||
                        (await clickModalButtonByText(page, '서브 스킬 강화', '용병 길드')) ||
                        (await clickModalButtonByText(page, '스킬 강화', '용병 길드'));
                    assert.ok(clickedUpgrade, 'Expected Sub Skill upgrade button in Mercenary UI');
                    await sleepMs(700);
                    const stateAfter = await getAzitState(ctx, user.sessionId);
                    assert.equal(stateAfter.mercenaries[0]?.subSkill?.level, 2);
                }
            );
        },
    },
    {
        id: 'T1-R3b-06',
        tier: 1,
        area: 'R3b',
        description: 'Expedition claim returns combat simulation battleLog reflecting autonomous skills/outcome',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r3b-06', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);
            const expId = await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });
            backdateExpedition(ctx.dbPath, expId, Date.now() - 2000);
            const claimRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, {
                expeditionId: expId,
            });
            assert.equal(claimRes.status, 200, `Claim failed: ${claimRes.rawText}`);
            const data = asRecord(claimRes.json.data, 'claim data');
            const report = isRecord(data.report) ? data.report : data;
            const battleLog = asArray(report.battleLog, 'claim.report.battleLog');
            assert.ok(battleLog.length >= 2, 'Expected simulation battleLog entries on expedition claim');
            const logEntries = battleLog.map((entry, idx) => {
                const text = asString(entry, `battleLog[${idx}]`).trim();
                assert.ok(text.length > 0 && /[가-힣]/.test(text), `Expected non-empty Korean text in battleLog[${idx}], got "${text}"`);
                return text;
            });
            assert.ok(
                logEntries.some((line) => /교전|공격|피해|치유|보호|발동|승리|패배|격파|전투/.test(line)),
                `Expected meaningful Korean combat/skill/attack descriptions in battleLog, got: ${JSON.stringify(logEntries)}`
            );
        },
    },

    // =========================================================================
    // Area R4: Vera's Tower 1–200F, Fullscreen UI & Penalty-Free Retry (7 Cases)
    // =========================================================================
    {
        id: 'T1-R4-01',
        tier: 1,
        area: 'R4',
        description: 'GET /api/azit-game/tower/floors serves 200 floors across 5 themes with 5F/10F bosses',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r4-01', points: 1000 });
            const res = await jsonGet(ctx.apiBaseUrl, '/api/azit-game/tower/floors?from=1&to=200', user.sessionId);
            assert.equal(res.status, 200, `GET /tower/floors failed: ${res.rawText}`);
            const data = asRecord(res.json.data, 'tower/floors data');
            const floors = asArray(data.floors, 'floors');
            assert.equal(floors.length, 200, `Expected 200 tower floors, got ${floors.length}`);

            const themes = new Set<string>();
            for (let idx = 0; idx < floors.length; idx += 1) {
                const f = asRecord(floors[idx], `floors[${idx}]`);
                const num = asNumber(f.floor, 'floor.floor');
                assert.equal(num, idx + 1, `Expected sequential floor ${idx + 1}, got ${num}`);
                if (typeof f.theme === 'string') themes.add(f.theme);
                else if (typeof f.themeName === 'string') themes.add(f.themeName);
                if (num % 10 === 0) {
                    assert.equal(f.isBoss, true, `Floor ${num} must have isBoss === true`);
                    assert.equal(f.floorType, 'major_boss', `Floor ${num} must have floorType === 'major_boss'`);
                } else if (num % 5 === 0) {
                    assert.equal(f.isBoss, true, `Floor ${num} must have isBoss === true`);
                    assert.equal(f.floorType, 'mini_boss', `Floor ${num} must have floorType === 'mini_boss'`);
                } else {
                    assert.equal(f.isBoss, false, `Non-boss floor ${num} must have isBoss === false`);
                    assert.equal(f.floorType, 'normal', `Non-boss floor ${num} must have floorType === 'normal'`);
                }
            }
            assert.equal(themes.size, 5, `Expected 5 Tower themes across 200 floors, got ${themes.size}`);
        },
    },
    {
        id: 'T1-R4-02',
        tier: 1,
        area: 'R4',
        description: 'Clearing Vera Tower 1F advances highestClearedFloor to 1 and returns replay frames + rewards',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r4-02', points: 5000, azitLevel: 3 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');

            const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(res.status, 200, `POST /tower/battle 1F failed: ${res.rawText}`);
            const data = asRecord(res.json.data, 'tower/battle data');
            assert.equal(data.won, true);
            assert.equal(data.floor, 1);
            assert.equal(data.isFirstClear, true);
            assert.ok(asArray(data.frames, 'frames').length > 0);

            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.tower?.highestClearedFloor, 1);
            assert.equal(st.tower?.maxFloor, 200);
        },
    },
    {
        id: 'T1-R4-03',
        tier: 1,
        area: 'R4',
        description: 'Sequential Floor 2 clear advances progress; replaying Floor 1 marks isFirstClear: false',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r4-03', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');

            const b1 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(b1.status, 200);
            const b2 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 2,
                partyMercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(b2.status, 200);
            assert.equal(asRecord(b2.json.data).isFirstClear, true);

            const replay1 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(replay1.status, 200);
            assert.equal(asRecord(replay1.json.data).isFirstClear, false);

            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.tower?.highestClearedFloor, 2);
        },
    },
    {
        id: 'T1-R4-04',
        tier: 1,
        area: 'R4',
        description: 'Vera Tower defeat incurs ZERO death penalty, ZERO item loss, and allows instant retry',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r4-04', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedItem(ctx.dbPath, user.userId, 'item-revival-herb', 2);
            setTowerHighestFloor(ctx.dbPath, user.userId, 59);

            const loseRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 60,
                partyMercCodes: ['merc-leo'],
            });
            assert.equal(loseRes.status, 200, `Tower 60F battle failed: ${loseRes.rawText}`);
            const data = asRecord(loseRes.json.data, 'tower defeat data');
            assert.equal(data.won, false, 'Solo Lv1 merc-leo must lose against 60F');

            const st = await getAzitState(ctx, user.sessionId);
            const leo = st.mercenaries.find((m) => m.mercCode === 'merc-leo');
            assert.equal(leo?.status, 'idle', 'Tower defeat MUST leave mercenary status === idle (zero death penalty)');
            assert.equal(leo?.diedAt ?? null, null);
            assert.equal(st.items?.find((i) => i.itemId === 'item-revival-herb')?.qty, 2, 'Zero revival items consumed');

            // Immediate retry must be accepted
            const retryRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 60,
                partyMercCodes: ['merc-leo'],
            });
            assert.equal(retryRes.status, 200, 'Immediate penalty-free retry must succeed');
        },
    },
    {
        id: 'T1-R4-05',
        tier: 1,
        area: 'R4',
        description: 'Camp UI opens Vera Tower Lobby Modal displaying 1–200F themes & floor progression',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r4-05', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '베라의 탑', 20_000);
                    const clicked = await clickButtonByText(page, '베라의 탑');
                    assert.ok(clicked, 'Expected "베라의 탑" entry button in Camp UI');
                    await waitForText(page, '1F', 10_000);
                    const text = await page.evaluate(() => document.body.innerText);
                    assert.ok(text.includes('베라의 탑'), 'Tower lobby header missing');
                    assert.ok(text.includes('200') || text.includes('잊혀진'), 'Expected 200F range / theme labels');
                }
            );
        },
    },
    {
        id: 'T1-R4-06',
        tier: 1,
        area: 'R4',
        description: 'Starting Vera Tower battle transitions to z-[70] fullscreen real-time autonomous canvas',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r4-06', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '베라의 탑', 20_000);
                    const openedTower = await clickButtonByText(page, '베라의 탑');
                    assert.ok(openedTower, 'Expected "베라의 탑" button');
                    await waitForText(page, '1F', 10_000);
                    const startedBattle =
                        (await clickButtonByText(page, '도전')) || (await clickButtonByText(page, '전투 시작'));
                    assert.ok(startedBattle, 'Expected Tower battle start button ("도전" or "전투 시작")');

                    await page.waitForSelector('[data-tower-fullscreen="true"], .z-\\[70\\]', { timeout: 10_000 });
                    await assertZIndexAboveNav(page, '[data-tower-fullscreen="true"], .z-\\[70\\]');
                    await assertCanvasAnimating(page, '[data-tower-fullscreen="true"] canvas, .z-\\[70\\] canvas', 500);
                }
            );
        },
    },
    {
        id: 'T1-R4-07',
        tier: 1,
        area: 'R4',
        description: 'Vera Tower fullscreen defeat UI offers penalty-free retry without revival modal redirect',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r4-07', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedItem(ctx.dbPath, user.userId, 'item-revival-herb', 2);
            setTowerHighestFloor(ctx.dbPath, user.userId, 59);
            const beforeState = await getAzitState(ctx, user.sessionId);
            const beforeAttempts = beforeState.tower?.totalAttempts ?? 0;

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '베라의 탑', 20_000);
                    const openedTower = await clickButtonByText(page, '베라의 탑');
                    assert.ok(openedTower, 'Expected "베라의 탑" button');

                    await page.waitForSelector('[data-tower-theme-tab="tower-2-spirit"]', { timeout: 10_000 });
                    await page.click('[data-tower-theme-tab="tower-2-spirit"]');
                    await page.waitForSelector('[data-tower-floor="60"]', { timeout: 10_000 });
                    await page.click('[data-tower-floor="60"]');

                    await page.waitForFunction(
                        () => {
                            const btn = document.querySelector('[data-testid="azit-tower-start-battle"]');
                            return (
                                btn instanceof HTMLButtonElement &&
                                !btn.disabled &&
                                (btn.textContent ?? '').includes('60층 도전')
                            );
                        },
                        { timeout: 10_000 }
                    );
                    await page.click('[data-testid="azit-tower-start-battle"]');

                    await page.waitForSelector('[data-tower-fullscreen="true"], .z-\\[70\\]', { timeout: 10_000 });
                    // Speed up playback if 2x toggle exists
                    await clickButtonByText(page, '2x');
                    await page.waitForSelector('[data-testid="azit-tower-result"]', { timeout: 25_000 });
                    const resultText = await page.$eval(
                        '[data-testid="azit-tower-result"]',
                        (el) => (el instanceof HTMLElement ? el.innerText : '')
                    );
                    assert.ok(
                        resultText.includes('공략 실패') && resultText.includes('사망 패널티'),
                        `Expected defeat overlay explaining penalty-free recovery, got: "${resultText.slice(0, 200)}"`
                    );

                    const retryBtn = await page.waitForSelector('[data-testid="azit-tower-retry-btn"]', {
                        timeout: 10_000,
                    });
                    assert.ok(retryBtn, 'Expected retry button [data-testid="azit-tower-retry-btn"] on defeat overlay');

                    const retryResponsePromise = page.waitForResponse(
                        (res) =>
                            res.url().includes('/api/azit-game/tower/battle') && res.request().method() === 'POST',
                        { timeout: 15_000 }
                    );
                    await page.click('[data-testid="azit-tower-retry-btn"]');
                    const retryRes = await retryResponsePromise;
                    assert.equal(retryRes.status(), 200, `Expected retry POST /tower/battle HTTP 200, got ${retryRes.status()}`);

                    await page.waitForFunction(
                        () => !document.querySelector('[data-testid="azit-tower-result"]'),
                        { timeout: 10_000 }
                    );

                    const afterState = await getAzitState(ctx, user.sessionId);
                    assert.ok(
                        (afterState.tower?.totalAttempts ?? 0) >= beforeAttempts + 2,
                        `Expected totalAttempts >= ${beforeAttempts + 2} (initial defeat + retry), got ${afterState.tower?.totalAttempts}`
                    );
                    assert.equal(
                        afterState.mercenaries[0]?.status,
                        'idle',
                        'Mercenary must remain idle after UI Tower defeat retry'
                    );
                    assert.equal(
                        afterState.items?.find((i) => i.itemId === 'item-revival-herb')?.qty,
                        2,
                        'Zero revival items must be consumed on Tower defeat and retry'
                    );
                }
            );
        },
    },

    // =========================================================================
    // Area R5: Rewards Payout Verification (6 Cases)
    // =========================================================================
    {
        id: 'T1-R5-01',
        tier: 1,
        area: 'R5',
        description: '1h zone-slime win credits veraPoints (+ ledger), AzitXP, MercXP, mat-slime-jelly & drops',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r5-01', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);

            const before = await getAzitState(ctx, user.sessionId);
            const beforeLedgerMaxId = queryDb(ctx.dbPath, (db) => {
                const row = db
                    .prepare(`SELECT COALESCE(MAX(id), 0) AS maxId FROM azit_point_ledger WHERE user_id = ?`)
                    .get(user.userId) as { maxId: number };
                return row.maxId;
            });

            const expId = await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo', 'merc-rina'],
                dishRecipeId: 'dish-carrot-soup',
            });
            backdateExpedition(ctx.dbPath, expId, Date.now() - 2000);

            const claimRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, {
                expeditionId: expId,
            });
            assert.equal(claimRes.status, 200, `Claim zone-slime failed: ${claimRes.rawText}`);

            const claimData = asRecord(claimRes.json.data, 'claim data');
            const report = isRecord(claimData.report) ? claimData.report : claimData;
            assert.equal(report.won, true, `Expected zone-slime claim win, got report.won=${String(report.won)}`);
            const rewardPoints = asNumber(report.rewardPoints, 'report.rewardPoints');
            assert.ok(rewardPoints > 0, `Expected positive rewardPoints on zone-slime win, got ${rewardPoints}`);

            const after = await getAzitState(ctx, user.sessionId);
            assert.ok(
                after.veraPoints > before.veraPoints,
                `Expected veraPoints increase, before=${before.veraPoints}, after=${after.veraPoints}`
            );

            const ledgerRows = queryDb(ctx.dbPath, (db) =>
                db
                    .prepare(
                        `SELECT delta_points, balance_after, tx_type FROM azit_point_ledger WHERE user_id = ? AND id > ? ORDER BY id ASC`
                    )
                    .all(user.userId, beforeLedgerMaxId) as Array<{
                    delta_points: number;
                    balance_after: number;
                    tx_type: string;
                }>
            );
            assert.ok(ledgerRows.length >= 1, 'Expected at least 1 azit_point_ledger entry for zone-slime expedition');
            const ledgerDeltaSum = ledgerRows.reduce((acc, row) => acc + row.delta_points, 0);
            assert.equal(
                after.veraPoints - before.veraPoints,
                ledgerDeltaSum,
                `veraPoints delta (${after.veraPoints - before.veraPoints}) must reconcile with azit_point_ledger sum (${ledgerDeltaSum})`
            );
            assert.ok(
                ledgerRows.some((row) => row.delta_points === rewardPoints),
                `Expected azit_point_ledger row with delta_points === ${rewardPoints}, got ${JSON.stringify(ledgerRows)}`
            );
            assert.equal(
                ledgerRows[ledgerRows.length - 1].balance_after,
                after.veraPoints,
                'Latest azit_point_ledger balance_after must equal after.veraPoints'
            );

            assert.ok(after.profile.azitXp > before.profile.azitXp, 'Expected AzitXP gain');
            assert.ok((after.materials['mat-slime-jelly'] ?? 0) >= 2, 'Expected mat-slime-jelly drops on zone-slime win');
            const totalMercXp = after.mercenaries.reduce((s, m) => s + m.xp + (m.level - 1) * 60, 0);
            assert.ok(totalMercXp > 0, 'Expected MercXP payout');
        },
    },
    {
        id: 'T1-R5-02',
        tier: 1,
        area: 'R5',
        description: '8h zone-dragon win grants high gold, AzitXP, MercXP, materials & guaranteed items',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r5-02', points: 20_000, azitLevel: 15 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-garr');
            await hireMerc(ctx, user.sessionId, 'merc-aria');
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-leo', 15, 0);
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-garr', 15, 0);
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-aria', 15, 0);
            seedDish(ctx.dbPath, user.userId, 'dish-dragon-elixir', 1, 1);

            const before = await getAzitState(ctx, user.sessionId);
            const expId = await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-dragon',
                partyMercCodes: ['merc-leo', 'merc-garr', 'merc-aria'],
                dishRecipeId: 'dish-dragon-elixir',
                dishQuality: 'special',
                useSpecialDish: true,
            });
            backdateExpedition(ctx.dbPath, expId, Date.now() - 2000);
            const claimRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, {
                expeditionId: expId,
            });
            assert.equal(claimRes.status, 200, `Claim zone-dragon failed: ${claimRes.rawText}`);

            const after = await getAzitState(ctx, user.sessionId);
            const data = asRecord(claimRes.json.data, 'claim data');
            const report = isRecord(data.report) ? data.report : data;
            const won = report.won === true || report.result === 'won';
            assert.equal(won, true, `Expected Lv15 3-merc party with special dish to win zone-dragon: ${claimRes.rawText}`);
            assert.ok(after.veraPoints - before.veraPoints >= 1000, 'Expected >=1000P payout from 8h zone-dragon win');
            assert.ok(
                (after.items?.find((i) => i.itemId === 'item-phoenix-feather')?.qty ?? 0) >= 1,
                'Expected guaranteed item-phoenix-feather on zone-dragon win'
            );
            assert.ok(
                (after.items?.find((i) => i.itemId === 'item-skill-tome')?.qty ?? 0) >= 1,
                'Expected guaranteed item-skill-tome on zone-dragon win'
            );
        },
    },
    {
        id: 'T1-R5-03',
        tier: 1,
        area: 'R5',
        description: 'Expedition defeat awards 0 gold jackpot and grants partial survival MercEXP (if alive)',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r5-03', points: 50_000, azitLevel: 10 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');

            let verifiedLossWithSurvivor = false;
            for (let i = 0; i < 15; i += 1) {
                seedDish(ctx.dbPath, user.userId, 'dish-dragon-elixir', 1);
                const beforeState = await getAzitState(ctx, user.sessionId);
                for (const m of beforeState.mercenaries) {
                    if (m.status === 'dead') {
                        seedItem(ctx.dbPath, user.userId, 'item-revival-herb', 1);
                        const revRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/revive', user.sessionId, {
                            mercCode: m.mercCode,
                            itemId: 'item-revival-herb',
                        });
                        assert.equal(revRes.status, 200, `Revive failed before attempt ${i}: ${revRes.rawText}`);
                    }
                }
                const beforeClean = await getAzitState(ctx, user.sessionId);
                const expId = await startExpedition(ctx, user.sessionId, {
                    zoneId: 'zone-dragon',
                    partyMercCodes: ['merc-leo', 'merc-rina'],
                    dishRecipeId: 'dish-dragon-elixir',
                });
                backdateExpedition(ctx.dbPath, expId, Date.now() - 2000);
                const claimRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, {
                    expeditionId: expId,
                });
                assert.equal(claimRes.status, 200);
                const data = asRecord(claimRes.json.data, 'claim data');
                const report = isRecord(data.report) ? data.report : data;
                if (report.won === false) {
                    assert.equal(report.rewardPoints ?? 0, 0, 'Loss must pay 0 gold rewardPoints');
                    const after = await getAzitState(ctx, user.sessionId);
                    const survivors = after.mercenaries.filter((m) => m.status === 'idle');
                    if (survivors.length > 0) {
                        for (const surv of survivors) {
                            const prev = beforeClean.mercenaries.find((x) => x.mercCode === surv.mercCode);
                            assert.ok(prev);
                            assert.ok(
                                surv.xp > prev.xp || surv.level > prev.level,
                                `Surviving merc ${surv.mercCode} on loss must receive partial survival EXP`
                            );
                        }
                        verifiedLossWithSurvivor = true;
                        break;
                    }
                }
            }
            assert.ok(
                verifiedLossWithSurvivor,
                'Expected at least 1 zone-dragon loss with >=1 surviving idle merc to verify partial survival EXP'
            );
        },
    },
    {
        id: 'T1-R5-04',
        tier: 1,
        area: 'R5',
        description: 'Vera Tower First-Clear rewards scale monotonically across 1F, 5F mini-boss, and 10F major boss',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r5-04', points: 20_000, azitLevel: 10 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            await hireMerc(ctx, user.sessionId, 'merc-aria');
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-leo', 10, 0);
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-rina', 10, 0);
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-aria', 10, 0);

            const goldByFloor: Record<number, number> = {};
            for (let f = 1; f <= 10; f += 1) {
                const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                    floor: f,
                    partyMercCodes: ['merc-leo', 'merc-rina', 'merc-aria'],
                });
                assert.equal(res.status, 200, `Tower ${f}F failed: ${res.rawText}`);
                const data = asRecord(res.json.data, `tower ${f}F data`);
                assert.equal(data.won, true, `Expected Lv10 party to clear ${f}F`);
                assert.equal(data.isFirstClear, true);
                const rewards = asRecord(data.rewards, `tower ${f}F rewards`);
                goldByFloor[f] = asNumber(rewards.points ?? rewards.veraPoints ?? 0, `gold ${f}F`);
            }
            assert.ok(goldByFloor[5] > goldByFloor[1] * 2, `5F mini-boss gold (${goldByFloor[5]}) should scale > 2x 1F (${goldByFloor[1]})`);
            assert.ok(goldByFloor[10] > goldByFloor[5], `10F major boss gold (${goldByFloor[10]}) should exceed 5F (${goldByFloor[5]})`);
        },
    },
    {
        id: 'T1-R5-05',
        tier: 1,
        area: 'R5',
        description: 'Vera Tower Repeat-Clear pays >0 gold & MercEXP, strictly less than First-Clear jackpot',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r5-05', points: 10_000, azitLevel: 5 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');

            const firstRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(firstRes.status, 200);
            const firstRewards = asRecord(asRecord(firstRes.json.data).rewards, 'first rewards');
            const firstGold = asNumber(firstRewards.points ?? firstRewards.veraPoints ?? 0, 'firstGold');

            const repeatRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(repeatRes.status, 200);
            const repeatData = asRecord(repeatRes.json.data, 'repeat data');
            assert.equal(repeatData.isFirstClear, false);
            const repeatRewards = asRecord(repeatData.rewards, 'repeat rewards');
            const repeatGold = asNumber(repeatRewards.points ?? repeatRewards.veraPoints ?? 0, 'repeatGold');
            const repeatMercXp = asNumber(repeatRewards.mercXp ?? 0, 'repeatMercXp');

            assert.ok(repeatGold > 0 && repeatGold < firstGold, `Repeat gold (${repeatGold}) must be > 0 and < First-Clear (${firstGold})`);
            assert.ok(repeatMercXp > 0, 'Repeat clear must award > 0 MercEXP');
        },
    },
    {
        id: 'T1-R5-06',
        tier: 1,
        area: 'R5',
        description: 'Camp & Tower UI display accurate reward summary chips without NaN or undefined',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't1-r5-06', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);
            const expId = await startExpedition(ctx, user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo', 'merc-rina'],
                dishRecipeId: 'dish-carrot-soup',
            });
            backdateExpedition(ctx.dbPath, expId, Date.now() - 2000);

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '전리품 정산', 20_000);
                    const claimed = await clickButtonByText(page, '전리품 정산');
                    assert.ok(claimed, 'Expected claim button "전리품 정산"');
                    await waitForText(page, '확인 완료', 15_000);
                    const reportText = await page.evaluate(() => {
                        const modals = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0'));
                        const rep = modals.find((m) => (m.textContent ?? '').includes('확인 완료'));
                        return rep instanceof HTMLElement ? rep.innerText : '';
                    });
                    assert.ok(reportText.length > 0, 'Expected Battle Report modal to render after claim');
                    assert.ok(
                        /\+\s*\d[\d,]*\s*P/.test(reportText) && reportText.includes('EXP'),
                        `Expected Battle Report modal to display actual reward points & EXP, got: "${reportText.slice(0, 250)}"`
                    );
                    const fullText = await page.evaluate(() => document.body.innerText);
                    assert.ok(!fullText.includes('NaN') && !fullText.includes('undefined'), 'UI must never render NaN or undefined');
                }
            );
        },
    },
];

if (isMainModule(import.meta.url)) {
    runStandaloneTier('Tier 1 Features', tier1Cases).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
