import assert from 'node:assert/strict';
import {
    asArray,
    asNumber,
    asRecord,
    asString,
    assertCanvasAnimating,
    assertNoHorizontalOverflow,
    assertZIndexAboveNav,
    backdateExpedition,
    clickButtonByText,
    closeOpenModal,
    extractErrorCode,
    findCampBattlefieldCanvasSelector,
    getAzitState,
    getOpenModalText,
    isMainModule,
    isRecord,
    jsonGet,
    jsonPost,
    openAuthedPage,
    openMercGuildModal,
    queryDb,
    rawPost,
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
    assert.equal(res.status, 200, `POST /groups/save failed: ${res.rawText}`);
    const st = await getAzitState(ctx, sessionId);
    const found = asArray(st.groups, 'groups').find((g) => isRecord(g) && g.name === name);
    assert.ok(isRecord(found));
    return asNumber(found.id, 'group.id');
}

async function findTowerOverlaySelector(page: import('puppeteer').Page): Promise<string> {
    const sel = await page.evaluate(() => {
        const direct = document.querySelector('[data-tower-fullscreen="true"]');
        if (direct) return '[data-tower-fullscreen="true"]';
        const divs = Array.from(document.querySelectorAll('div'));
        for (let i = 0; i < divs.length; i += 1) {
            const el = divs[i];
            const st = window.getComputedStyle(el);
            const z = Number.parseInt(st.zIndex || '0', 10);
            if (st.position === 'fixed' && z >= 70 && el.querySelector('canvas')) {
                el.setAttribute('data-e2e-tower-overlay', String(i));
                return `[data-e2e-tower-overlay="${i}"]`;
            }
        }
        return '';
    });
    assert.ok(sel.length > 0, 'Expected fixed z>=70 Tower fullscreen overlay with <canvas>');
    return sel;
}

export const tier2Cases: TestCaseDefinition[] = [
    // =========================================================================
    // Area R1 Boundaries: UI, Viewport & Empty States (5 Cases)
    // =========================================================================
    {
        id: 'T2-R1-01',
        tier: 2,
        area: 'R1',
        description: 'Mobile 375x812 Camp + active battlefield has zero horizontal overflow',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r1-01', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);
            const startRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.equal(startRes.status, 200);

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 375, height: 812 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '용병 토벌 캠프', 20_000);
                    await sleepMs(600);
                    await assertNoHorizontalOverflow(page, 'Camp mobile 375x812');
                    const canvasSel = await findCampBattlefieldCanvasSelector(page, 100, 80);
                    assert.ok(canvasSel !== null, 'Expected active Camp battlefield <canvas> on 375x812 mobile viewport');
                    const rect = await page.evaluate((sel) => {
                        const c = document.querySelector(sel);
                        if (!c) return null;
                        const r = c.getBoundingClientRect();
                        return { width: r.width, height: r.height, right: r.right, innerWidth: window.innerWidth };
                    }, canvasSel);
                    assert.ok(
                        rect !== null && rect.width > 100 && rect.height > 80,
                        `Camp battlefield canvas must render with valid dimensions (>100x80), got ${JSON.stringify(rect)}`
                    );
                    assert.ok(
                        rect.right <= Math.min(375, rect.innerWidth) + 1,
                        `Camp battlefield canvas right edge (${rect.right}) exceeded mobile viewport (${rect.innerWidth})`
                    );
                }
            );
        },
    },
    {
        id: 'T2-R1-02',
        tier: 2,
        area: 'R1',
        description: 'Desktop 1280x800 preserves max-w-6xl mx-auto px-3 sm:px-4 layout & zero overflow',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r1-02', points: 1000 });
            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '용병 토벌 캠프', 20_000);
                    await assertNoHorizontalOverflow(page, 'Camp desktop 1280x800');
                    const hasStandardWidth = await page.evaluate(() => {
                        const candidates = Array.from(document.querySelectorAll('.max-w-6xl.mx-auto.px-3'));
                        return candidates.some(
                            (el) =>
                                !el.closest('header') &&
                                el.classList.contains('sm:px-4') &&
                                el.classList.contains('w-full')
                        );
                    });
                    assert.ok(
                        hasStandardWidth,
                        'Expected page content root container outside <header> to preserve max-w-6xl mx-auto px-3 sm:px-4 w-full'
                    );
                }
            );
        },
    },
    {
        id: 'T2-R1-03',
        tier: 2,
        area: 'R1',
        description: 'Fresh account empty state renders zero mock/dummy mercenaries, groups, or battles',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r1-03', points: 0 });
            const state = await getAzitState(ctx, user.sessionId);
            assert.equal(state.mercenaries.length, 0);
            assert.equal(asArray(state.groups, 'groups').length, 0);
            assert.equal(state.activeExpeditions.length, 0);

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '용병 토벌 캠프', 20_000);
                    await waitForText(page, '출정 중인 원정대가 없습니다', 10_000);
                    const hasCanvas = await page.evaluate(() => {
                        return Array.from(document.querySelectorAll('canvas')).some((c) => {
                            const r = c.getBoundingClientRect();
                            return r.width > 100 && r.height > 60;
                        });
                    });
                    assert.equal(hasCanvas, false, 'Empty DB must render zero mock battlefield canvas');
                }
            );
        },
    },
    {
        id: 'T2-R1-04',
        tier: 2,
        area: 'R1',
        description: 'Camp battlefield renders cleanly with both 1-merc solo and 3-merc full party',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r1-04', points: 10_000, azitLevel: 7 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            await hireMerc(ctx, user.sessionId, 'merc-kael');
            await hireMerc(ctx, user.sessionId, 'merc-serena');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 2);

            const exp1Res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.equal(exp1Res.status, 200, `1-merc zone-slime expedition start failed: ${exp1Res.rawText}`);
            const exp2Res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-goblin',
                partyMercCodes: ['merc-rina', 'merc-kael', 'merc-serena'],
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.equal(exp2Res.status, 200, `3-merc zone-goblin expedition start failed: ${exp2Res.rawText}`);

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '고블린', 20_000);
                    await waitForText(page, '슬라임', 20_000);
                    await sleepMs(400);
                    const canvasSel = await findCampBattlefieldCanvasSelector(page, 150, 80);
                    assert.ok(canvasSel !== null, 'Expected battlefield canvas to render cleanly for 1-merc & 3-merc expeditions');

                    const getHudText = async (): Promise<string> =>
                        page.evaluate((sel) => {
                            const canvas = document.querySelector(sel);
                            const hud = canvas?.previousElementSibling;
                            return hud instanceof HTMLElement ? hud.innerText : '';
                        }, canvasSel);

                    const initialHud = await getHudText();
                    assert.ok(
                        initialHud.includes('고블린') && initialHud.includes('3인 원정대'),
                        `Expected initial active HUD header to show 3-merc 고블린 expedition, got: "${initialHud}"`
                    );
                    await assertCanvasAnimating(page, canvasSel);

                    const clickedSlimeSwitch = await page.evaluate((sel) => {
                        const canvas = document.querySelector(sel);
                        const root = canvas?.closest('[data-camp-battlefield="true"]');
                        if (!root) return false;
                        const buttons = Array.from(root.querySelectorAll('button'));
                        const switcherBtn = buttons.find((b) => {
                            const txt = (b.innerText ?? '').trim();
                            return txt.includes('슬라임') && !txt.includes('정산 가능') && !b.disabled;
                        });
                        if (!switcherBtn) return false;
                        switcherBtn.click();
                        return true;
                    }, canvasSel);
                    assert.ok(clickedSlimeSwitch, 'Expected scoped "슬라임" switcher button inside battlefield switcher area');

                    await page.waitForFunction(
                        (sel) => {
                            const canvas = document.querySelector(sel);
                            const hud = canvas?.previousElementSibling;
                            return hud instanceof HTMLElement && hud.innerText.includes('슬라임');
                        },
                        { timeout: 10_000 },
                        canvasSel
                    );

                    const switchedHud = await getHudText();
                    assert.ok(
                        switchedHud.includes('슬라임') && switchedHud.includes('1인 원정대'),
                        `Expected switched HUD header to show 1-merc 슬라임 expedition, got: "${switchedHud}"`
                    );
                    await assertCanvasAnimating(page, canvasSel);
                }
            );
        },
    },
    {
        id: 'T2-R1-05',
        tier: 2,
        area: 'R1',
        description: 'Rapid zone tab switching during active expedition causes zero runtime/RAF errors',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r1-05', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);
            await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
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
                    await waitForText(page, '용병 토벌 캠프', 20_000);
                    const initialCanvas = await findCampBattlefieldCanvasSelector(page);
                    assert.ok(initialCanvas !== null, 'Expected active Camp battlefield <canvas> before tab switching');
                    for (const tab of ['실내', '텃밭', '주방', '용병 캠프', '주방', '용병 캠프']) {
                        const clicked = await clickButtonByText(page, tab);
                        assert.ok(clicked, `Expected zone tab button "${tab}" during rapid switching`);
                        await sleepMs(180);
                    }
                    await waitForText(page, '용병 토벌 캠프', 10_000);
                    await waitForText(page, '슬라임', 10_000);
                    await sleepMs(350);
                    const remountedCanvas = await findCampBattlefieldCanvasSelector(page);
                    assert.ok(
                        remountedCanvas !== null,
                        'Expected Camp battlefield <canvas> to remount cleanly after rapid tab switching'
                    );
                    await assertCanvasAnimating(page, remountedCanvas, 450);
                }
            );
        },
    },

    // =========================================================================
    // Area R2a Boundaries: Group Formation Limits & Validation (5 Cases)
    // =========================================================================
    {
        id: 'T2-R2a-01',
        tier: 2,
        area: 'R2a',
        description: 'Deleting active expedition group, reusing active groupId, and mismatched groupId+partyMercCodes are rejected',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2a-01', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            const groupId = await createGroup(ctx, user.sessionId, '출정중조', ['merc-leo']);
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 2);

            for (const mismatchedParty of [['merc-rina'], ['merc-leo', 'merc-rina']]) {
                const mismatchExpRes = await jsonPost(
                    ctx.apiBaseUrl,
                    '/api/azit-game/expeditions/start',
                    user.sessionId,
                    {
                        zoneId: 'zone-slime',
                        groupId,
                        partyMercCodes: mismatchedParty,
                        dishRecipeId: 'dish-carrot-soup',
                    }
                );
                assert.equal(
                    mismatchExpRes.status,
                    400,
                    `Mismatched groupId + partyMercCodes ${JSON.stringify(mismatchedParty)} on expeditions/start must return 400, got ${mismatchExpRes.status}: ${mismatchExpRes.rawText}`
                );
                assert.equal(
                    extractErrorCode(mismatchExpRes),
                    'GROUP_PARTY_MISMATCH',
                    `Expected GROUP_PARTY_MISMATCH on expeditions/start, got: ${mismatchExpRes.rawText}`
                );

                const mismatchTowerRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                    floor: 1,
                    groupId,
                    partyMercCodes: mismatchedParty,
                });
                assert.equal(
                    mismatchTowerRes.status,
                    400,
                    `Mismatched groupId + partyMercCodes ${JSON.stringify(mismatchedParty)} on tower/battle must return 400, got ${mismatchTowerRes.status}: ${mismatchTowerRes.rawText}`
                );
                assert.equal(
                    extractErrorCode(mismatchTowerRes),
                    'GROUP_PARTY_MISMATCH',
                    `Expected GROUP_PARTY_MISMATCH on tower/battle, got: ${mismatchTowerRes.rawText}`
                );
            }

            const preStartState = await getAzitState(ctx, user.sessionId);
            assert.equal(preStartState.activeExpeditions.length, 0, 'Mismatched start must not create an expedition');
            assert.equal(preStartState.dishes['dish-carrot-soup'], 2, 'Mismatched start must not deduct dish');
            assert.equal(preStartState.tower?.totalAttempts ?? 0, 0, 'Mismatched tower battle must not record a run');

            const startRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-slime',
                groupId,
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.equal(startRes.status, 200);

            const reuseGroupRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-goblin',
                groupId,
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.equal(
                reuseGroupRes.status,
                409,
                `Reusing active groupId on second expedition must return 409, got ${reuseGroupRes.status}: ${reuseGroupRes.rawText}`
            );
            assert.equal(
                extractErrorCode(reuseGroupRes),
                'GROUP_ALREADY_ON_EXPEDITION',
                `Expected GROUP_ALREADY_ON_EXPEDITION, got: ${reuseGroupRes.rawText}`
            );

            const delRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/delete', user.sessionId, { groupId });
            assert.ok(
                delRes.status === 400 || delRes.status === 409,
                `Deleting active expedition group must fail (400/409), got ${delRes.status}: ${delRes.rawText}`
            );

            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.activeExpeditions.length, 1);
            assert.ok(asArray(st.groups).some((g) => isRecord(g) && g.id === groupId));
        },
    },
    {
        id: 'T2-R2a-02',
        tier: 2,
        area: 'R2a',
        description: 'Saving a group exceeding limits.maxPartySize or MAX_MERC_GROUPS (6) is rejected with 400',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2a-02', points: 20_000, azitLevel: 7 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            await hireMerc(ctx, user.sessionId, 'merc-kael');
            await hireMerc(ctx, user.sessionId, 'merc-serena');

            const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/save', user.sessionId, {
                name: '초과파티',
                mercCodes: ['merc-leo', 'merc-rina', 'merc-kael', 'merc-serena'],
            });
            assert.equal(res.status, 400, `Group exceeding maxPartySize must return 400, got ${res.status}: ${res.rawText}`);

            const createdGroupIds: number[] = [];
            for (let i = 1; i <= 6; i += 1) {
                const gid = await createGroup(ctx, user.sessionId, `정규조_${i}`, ['merc-leo']);
                createdGroupIds.push(gid);
            }

            const overMaxGroupsRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/save', user.sessionId, {
                name: '그룹7_초과',
                mercCodes: ['merc-rina'],
            });
            assert.equal(
                overMaxGroupsRes.status,
                400,
                `Saving 7th group (> MAX_MERC_GROUPS = 6) must return 400, got ${overMaxGroupsRes.status}: ${overMaxGroupsRes.rawText}`
            );

            const updateExistingRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/save', user.sessionId, {
                id: createdGroupIds[0],
                name: '정규조_1_수정',
                mercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(
                updateExistingRes.status,
                200,
                `Updating existing group while at 6/6 must return 200, got ${updateExistingRes.status}: ${updateExistingRes.rawText}`
            );

            const stAfter = await getAzitState(ctx, user.sessionId);
            assert.equal(asArray(stAfter.groups).length, 6, 'Total saved groups must remain capped at 6');
        },
    },
    {
        id: 'T2-R2a-03',
        tier: 2,
        area: 'R2a',
        description: 'Group save rejects empty, unowned, or invalid mercCodes',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2a-03', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');

            for (const badMercs of [[], ['merc-aria'], ['merc-not-real']]) {
                const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/save', user.sessionId, {
                    name: '잘못된조',
                    mercCodes: badMercs,
                });
                assert.equal(res.status, 400, `Invalid mercCodes ${JSON.stringify(badMercs)} must return 400, got ${res.status}`);
            }

            // Duplicate mercCodes either rejected 400 or strictly deduplicated
            const dupRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/save', user.sessionId, {
                name: '중복조',
                mercCodes: ['merc-leo', 'merc-leo'],
            });
            if (dupRes.status === 200) {
                const st = await getAzitState(ctx, user.sessionId);
                const g = asArray(st.groups).find((x) => isRecord(x) && x.name === '중복조');
                assert.ok(isRecord(g));
                assert.deepEqual(g.mercCodes, ['merc-leo']);
            } else {
                assert.equal(dupRes.status, 400);
            }
        },
    },
    {
        id: 'T2-R2a-04',
        tier: 2,
        area: 'R2a',
        description: 'Group save rejects empty/whitespace group name',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2a-04', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');

            for (const badName of ['', '   ']) {
                const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/save', user.sessionId, {
                    name: badName,
                    mercCodes: ['merc-leo'],
                });
                assert.equal(res.status, 400, `Empty group name ${JSON.stringify(badName)} must return 400, got ${res.status}`);
            }
        },
    },
    {
        id: 'T2-R2a-05',
        tier: 2,
        area: 'R2a',
        description: 'Deleting non-existent or another user group is rejected without mutating victim group',
        requiresBrowser: false,
        run: async (ctx) => {
            const userA = await seedUser(ctx, { label: 't2-r2a-05a', points: 5000, azitLevel: 4 });
            const userB = await seedUser(ctx, { label: 't2-r2a-05b', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, userA.sessionId, 'merc-leo');
            const groupA = await createGroup(ctx, userA.sessionId, 'A그룹', ['merc-leo']);

            const crossDel = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/delete', userB.sessionId, {
                groupId: groupA,
            });
            assert.ok(crossDel.status === 400 || crossDel.status === 404, `Cross-user delete must fail, got ${crossDel.status}`);

            const missingDel = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/delete', userA.sessionId, {
                groupId: 999_999,
            });
            assert.ok(missingDel.status === 400 || missingDel.status === 404);

            const stA = await getAzitState(ctx, userA.sessionId);
            assert.equal(asArray(stA.groups).length, 1);
        },
    },

    // =========================================================================
    // Area R2b Boundaries: Expedition Dispatch & Duration Clamps (6 Cases)
    // =========================================================================
    {
        id: 'T2-R2b-01',
        tier: 2,
        area: 'R2b',
        description: 'Dispatching a dead mercenary on expedition is rejected without deducting dish/gold',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2b-01', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            setMercDead(ctx.dbPath, user.userId, 'merc-leo');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);
            const before = await getAzitState(ctx, user.sessionId);

            const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.ok(res.status === 400 || res.status === 409, `Dead merc dispatch must fail, got ${res.status}`);

            const after = await getAzitState(ctx, user.sessionId);
            assert.equal(after.activeExpeditions.length, 0);
            assert.equal(after.veraPoints, before.veraPoints);
            assert.equal(after.dishes['dish-carrot-soup'], 1);
        },
    },
    {
        id: 'T2-R2b-02',
        tier: 2,
        area: 'R2b',
        description: 'Dispatching a mercenary already on an expedition is rejected',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2b-02', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 2);

            const r1 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.equal(r1.status, 200);

            const r2 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-goblin',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.ok(r2.status === 400 || r2.status === 409, `Busy merc double-dispatch must fail, got ${r2.status}`);
            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.activeExpeditions.length, 1);
        },
    },
    {
        id: 'T2-R2b-03',
        tier: 2,
        area: 'R2b',
        description: 'Exceeding limits.maxActiveExpeditions is rejected',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2b-03', points: 20_000, azitLevel: 5 });
            const codes = ['merc-leo', 'merc-rina', 'merc-kael', 'merc-serena', 'merc-garr'];
            for (const c of codes) {
                await hireMerc(ctx, user.sessionId, c);
            }
            const st0 = await getAzitState(ctx, user.sessionId);
            const limit = st0.profile.limits.maxActiveExpeditions;
            assert.ok(limit >= 2 && limit < codes.length, `Expected 2 <= maxActiveExpeditions < ${codes.length}, got ${limit}`);
            seedDish(ctx.dbPath, user.userId, 'dish-dragon-elixir', limit + 2);

            const zones = ['zone-slime', 'zone-goblin', 'zone-forest', 'zone-golem', 'zone-wyvern'];
            for (let i = 0; i < limit; i += 1) {
                const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                    zoneId: zones[i],
                    partyMercCodes: [codes[i]],
                    dishRecipeId: 'dish-dragon-elixir',
                });
                assert.equal(res.status, 200, `Dispatch #${i + 1} within limit ${limit} failed: ${res.rawText}`);
            }

            const overRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: zones[limit],
                partyMercCodes: [codes[limit]],
                dishRecipeId: 'dish-dragon-elixir',
            });
            assert.ok(
                overRes.status === 400 || overRes.status === 409,
                `Expedition exceeding limit (${limit}) must fail, got ${overRes.status}`
            );
        },
    },
    {
        id: 'T2-R2b-04',
        tier: 2,
        area: 'R2b',
        description: 'Expedition duration clamps strictly >= 3600s (1h) even with Tier 4 speed-buff dish',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2b-04', points: 10_000, azitLevel: 7 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedDish(ctx.dbPath, user.userId, 'dish-dragon-elixir', 0, 1);

            const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-dragon-elixir',
                dishQuality: 'special',
                useSpecialDish: true,
            });
            assert.equal(res.status, 200, `Start failed: ${res.rawText}`);
            const st = await getAzitState(ctx, user.sessionId);
            const exp = st.activeExpeditions[0];
            const sec = Math.round((exp.endsAtMs - exp.startedAtMs) / 1000);
            assert.ok(sec >= 3600, `Duration must never drop below 1h (3600s) even with special dish, got ${sec}s`);
        },
    },
    {
        id: 'T2-R2b-05',
        tier: 2,
        area: 'R2b',
        description: 'Maximum 8h zone-dragon duration never exceeds 28800s',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2b-05', points: 20_000, azitLevel: 10 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedDish(ctx.dbPath, user.userId, 'dish-dragon-elixir', 1);

            const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-dragon',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-dragon-elixir',
            });
            assert.equal(res.status, 200);
            const st = await getAzitState(ctx, user.sessionId);
            const sec = Math.round((st.activeExpeditions[0].endsAtMs - st.activeExpeditions[0].startedAtMs) / 1000);
            assert.ok(sec >= 3600 && sec <= 28800, `zone-dragon duration out of 1h-8h bounds: ${sec}s`);
        },
    },
    {
        id: 'T2-R2b-06',
        tier: 2,
        area: 'R2b',
        description: 'Premature expedition claim rejected and concurrent double-claim pays exactly once',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2b-06', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);

            const startRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.equal(startRes.status, 200, `Expedition start failed: ${startRes.rawText}`);
            const st = await getAzitState(ctx, user.sessionId);
            const expId = st.activeExpeditions[0].id;
            const pointsBeforeClaim = st.veraPoints;

            const early = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, {
                expeditionId: expId,
            });
            assert.ok(early.status === 400 || early.status === 409, `Premature claim must fail, got ${early.status}`);

            backdateExpedition(ctx.dbPath, expId, Date.now() - 2000);
            const burst = await Promise.all([
                jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, { expeditionId: expId }),
                jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, { expeditionId: expId }),
            ]);
            const successes = burst.filter((r) => r.status === 200);
            const losers = burst.filter((r) => r.status !== 200);
            assert.equal(successes.length, 1, `Concurrent double-claim must succeed exactly once, got ${burst.map((r) => r.status)}`);
            assert.equal(losers.length, 1);
            assert.ok(
                losers[0].status === 400 || losers[0].status === 409,
                `Losing concurrent claim must return 400 or 409 (< 500), got ${losers[0].status}: ${losers[0].rawText}`
            );

            const afterSt = await getAzitState(ctx, user.sessionId);
            assert.equal(afterSt.activeExpeditions.length, 0, 'Expected activeExpeditions.length === 0 after claim');
            const claimData = asRecord(successes[0].json.data, 'claim data');
            const report = asRecord(claimData.report, 'claim report');
            const rewardPoints = asNumber(report.rewardPoints, 'rewardPoints');
            assert.equal(
                afterSt.veraPoints,
                pointsBeforeClaim + rewardPoints,
                `Expected veraPoints to reflect single payout (${pointsBeforeClaim} + ${rewardPoints}), got ${afterSt.veraPoints}`
            );
            const ledgerRow = queryDb(ctx.dbPath, (db) =>
                db
                    .prepare(
                        `SELECT COUNT(*) AS cnt, COALESCE(SUM(delta_points), 0) AS total
                         FROM azit_point_ledger
                         WHERE user_id = ? AND tx_type = 'expedition_reward' AND ref_id = ?`
                    )
                    .get(user.userId, String(expId))
            );
            assert.ok(isRecord(ledgerRow));
            if (report.won === true) {
                assert.equal(asNumber(ledgerRow.cnt, 'ledger cnt'), 1, 'Expected exactly 1 expedition_reward ledger row');
                assert.equal(asNumber(ledgerRow.total, 'ledger total'), rewardPoints, 'Expected ledger total to match single payout');
            } else {
                assert.equal(asNumber(ledgerRow.cnt, 'ledger cnt'), 0);
                assert.equal(rewardPoints, 0);
            }
        },
    },

    // =========================================================================
    // Area R2c Boundaries: Revival, Shop & Crafting Validation (7 Cases)
    // =========================================================================
    {
        id: 'T2-R2c-01',
        tier: 2,
        area: 'R2c',
        description: 'Reviving a living (idle) mercenary is rejected without consuming revival item',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2c-01', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedItem(ctx.dbPath, user.userId, 'item-revival-herb', 1);

            const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/revive', user.sessionId, {
                mercCode: 'merc-leo',
                itemId: 'item-revival-herb',
            });
            assert.ok(res.status === 400 || res.status === 409, `Reviving living merc must fail, got ${res.status}`);
            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.items?.find((i) => i.itemId === 'item-revival-herb')?.qty, 1);
        },
    },
    {
        id: 'T2-R2c-02',
        tier: 2,
        area: 'R2c',
        description: 'Reviving dead mercenary with non-revival item (item-skill-stone) is rejected',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2c-02', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            setMercDead(ctx.dbPath, user.userId, 'merc-leo');
            seedItem(ctx.dbPath, user.userId, 'item-skill-stone', 2);

            const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/revive', user.sessionId, {
                mercCode: 'merc-leo',
                itemId: 'item-skill-stone',
            });
            assert.equal(res.status, 400);
            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.mercenaries[0]?.status, 'dead');
            assert.equal(st.items?.find((i) => i.itemId === 'item-skill-stone')?.qty, 2);
        },
    },
    {
        id: 'T2-R2c-03',
        tier: 2,
        area: 'R2c',
        description: 'Reviving dead mercenary when revival item qty === 0 fails without negative qty',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2c-03', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            setMercDead(ctx.dbPath, user.userId, 'merc-leo');

            const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/revive', user.sessionId, {
                mercCode: 'merc-leo',
                itemId: 'item-revival-herb',
            });
            assert.ok(res.status === 400 || res.status === 409);
            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.mercenaries[0]?.status, 'dead');
            assert.ok((st.items?.find((i) => i.itemId === 'item-revival-herb')?.qty ?? 0) >= 0);
        },
    },
    {
        id: 'T2-R2c-04',
        tier: 2,
        area: 'R2c',
        description: 'Gold revival fallback attempt on dead mercenary is rejected with points untouched',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2c-04', points: 99_999, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            setMercDead(ctx.dbPath, user.userId, 'merc-leo');
            seedItem(ctx.dbPath, user.userId, 'item-revival-herb', 1);
            const before = await getAzitState(ctx, user.sessionId);

            const resNoItem = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/revive', user.sessionId, {
                mercCode: 'merc-leo',
                paymentMethod: 'gold',
            });
            assert.ok(
                resNoItem.status === 400 || resNoItem.status === 403,
                `Gold revival fallback without itemId must fail with 400/403, got ${resNoItem.status}`
            );

            const resUseGold = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/revive', user.sessionId, {
                mercCode: 'merc-leo',
                itemId: 'item-revival-herb',
                useGold: true,
            });
            assert.ok(
                resUseGold.status === 400 || resUseGold.status === 403,
                `useGold revival attempt must fail with 400/403, got ${resUseGold.status}`
            );
            assert.equal(
                extractErrorCode(resUseGold),
                'GOLD_REVIVAL_DISABLED',
                `Expected GOLD_REVIVAL_DISABLED code, got: ${resUseGold.rawText}`
            );

            const after = await getAzitState(ctx, user.sessionId);
            assert.equal(after.veraPoints, before.veraPoints);
            assert.equal(after.mercenaries[0]?.status, 'dead');
            assert.equal(
                after.items?.find((i) => i.itemId === 'item-revival-herb')?.qty,
                1,
                'Rejected useGold revival must not consume item-revival-herb'
            );
        },
    },
    {
        id: 'T2-R2c-05',
        tier: 2,
        area: 'R2c',
        description: 'Shop buy rejects qty <= 0, unknown itemId, and insufficient gold',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2c-05', points: 50, azitLevel: 2 });
            for (const payload of [
                { itemId: 'item-revival-herb', qty: 0 },
                { itemId: 'item-revival-herb', qty: -1 },
                { itemId: 'item-fake', qty: 1 },
                { itemId: 'item-revival-herb', qty: 1 }, // 50P < 150P
            ]) {
                const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/shop/buy', user.sessionId, payload);
                assert.ok(
                    res.status === 400 || res.status === 404 || res.status === 409,
                    `Shop buy ${JSON.stringify(payload)} must fail, got ${res.status}`
                );
            }
            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.veraPoints, 50);
        },
    },
    {
        id: 'T2-R2c-06',
        tier: 2,
        area: 'R2c',
        description: 'Craft rejects missing ingredients or invalid qty atomically with zero partial deduction',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2c-06', points: 5000, azitLevel: 5 });
            const st0 = await getAzitState(ctx, user.sessionId);
            const recipe = asArray(st0.catalog.craftRecipes, 'craftRecipes').find((r) => isRecord(r));
            assert.ok(isRecord(recipe));
            const recipeId = asString(recipe.recipeId, 'recipeId');
            const ingredients = asArray(recipe.ingredients, 'ingredients');

            // Seed ONLY the first ingredient so the second is missing
            const firstIng = asRecord(ingredients[0], 'firstIng');
            if (firstIng.kind === 'crop') seedCropHarvest(ctx.dbPath, user.userId, asString(firstIng.id), 5);
            else if (firstIng.kind === 'material') seedMaterial(ctx.dbPath, user.userId, asString(firstIng.id), 5);
            else if (firstIng.kind === 'item') seedItem(ctx.dbPath, user.userId, asString(firstIng.id), 5);

            const before = await getAzitState(ctx, user.sessionId);
            const failCraft = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/craft', user.sessionId, {
                recipeId,
                qty: 1,
            });
            assert.ok(failCraft.status === 400 || failCraft.status === 409);

            const invalidQty = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/craft', user.sessionId, {
                recipeId,
                qty: 0,
            });
            assert.equal(invalidQty.status, 400);

            const after = await getAzitState(ctx, user.sessionId);
            assert.equal(after.veraPoints, before.veraPoints, 'Failed craft must deduct 0 gold');
            assert.deepEqual(after.garden.harvestCounts, before.garden.harvestCounts, 'Failed craft must deduct 0 crops');
            assert.deepEqual(after.materials, before.materials, 'Failed craft must deduct 0 materials');
        },
    },
    {
        id: 'T2-R2c-07',
        tier: 2,
        area: 'R2c',
        description: 'Shop/Craft/Inventory UI renders 0 counts honestly without mock items',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r2c-07', points: 0 });
            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '용병 토벌 캠프', 20_000);
                    await openMercGuildModal(page, '상점 · 연금 제작');
                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                const txt = m.textContent ?? '';
                                return txt.includes('용병 길드') && (txt.includes('생명의 약초') || txt.includes('아지트 보급 상점'));
                            }),
                        { timeout: 10_000 }
                    );

                    const modalText = await getOpenModalText(page, '용병 길드');
                    assert.ok(modalText.length > 0, 'Expected Shop/Craft modal to open visibly in DOM');
                    assert.ok(
                        modalText.includes('생명의 약초') &&
                            modalText.includes('투지의 비약') &&
                            modalText.includes('전술 연마석'),
                        `Expected M3 Azit Item Shop/Craft content inside modal, got: "${modalText.slice(0, 250)}"`
                    );
                    assert.ok(
                        modalText.includes('0개') || /\b0\b/.test(modalText),
                        `Expected honest 0 inventory count in fresh Shop/Craft UI, got: "${modalText.slice(0, 250)}"`
                    );
                    const fullText = await page.evaluate(() => document.body.innerText);
                    assert.ok(!fullText.includes('NaN') && !fullText.includes('undefined'), 'Shop/Craft UI must not render NaN or undefined');
                }
            );
        },
    },

    // =========================================================================
    // Area R3 Boundaries: Skills, Gold-Upgrade Block & Leveling Caps (6 Cases)
    // =========================================================================
    {
        id: 'T2-R3-01',
        tier: 2,
        area: 'R3',
        description: 'POST /mercenaries/upgrade always returns 403 GOLD_UPGRADE_DISABLED regardless of high gold',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r3-01', points: 100_000, azitLevel: 5 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/upgrade', user.sessionId, {
                mercCode: 'merc-leo',
            });
            assert.equal(res.status, 403);
            assert.equal(extractErrorCode(res), 'GOLD_UPGRADE_DISABLED');
            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.veraPoints, 100_000 - 60);
            assert.equal(st.mercenaries[0]?.level, 1);
        },
    },
    {
        id: 'T2-R3-02',
        tier: 2,
        area: 'R3',
        description: 'Skill upgrade rejects invalid skillSlot and mismatched upgrade material',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r3-02', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedItem(ctx.dbPath, user.userId, 'item-skill-stone', 2);

            const badSlot = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/skills/upgrade', user.sessionId, {
                mercCode: 'merc-leo',
                skillSlot: 'ultimate',
            });
            assert.equal(badSlot.status, 400);

            // Attempt main skill upgrade with 0 item-skill-tome (only has item-skill-stone)
            const noTome = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/skills/upgrade', user.sessionId, {
                mercCode: 'merc-leo',
                skillSlot: 'main',
            });
            assert.ok(noTome.status === 400 || noTome.status === 409);

            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.mercenaries[0]?.mainSkill?.level, 1);
            assert.equal(st.items?.find((i) => i.itemId === 'item-skill-stone')?.qty, 2);
        },
    },
    {
        id: 'T2-R3-03',
        tier: 2,
        area: 'R3',
        description: 'Skill upgrade rejects beyond maxLevel (10) without consuming extra tome',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r3-03', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            seedItem(ctx.dbPath, user.userId, 'item-skill-tome', 12);

            for (let i = 0; i < 9; i += 1) {
                const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/skills/upgrade', user.sessionId, {
                    mercCode: 'merc-leo',
                    skillSlot: 'main',
                });
                assert.equal(res.status, 200, `Upgrade #${i + 1} failed: ${res.rawText}`);
            }

            const overCap = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/skills/upgrade', user.sessionId, {
                mercCode: 'merc-leo',
                skillSlot: 'main',
            });
            assert.ok(overCap.status === 400 || overCap.status === 409, `Upgrade past maxLevel must fail, got ${overCap.status}`);

            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.mercenaries[0]?.mainSkill?.level, 10);
            assert.equal(st.items?.find((i) => i.itemId === 'item-skill-tome')?.qty, 3);
        },
    },
    {
        id: 'T2-R3-04',
        tier: 2,
        area: 'R3',
        description: 'Skill upgrade rejects unowned mercenary without consuming skill mats',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r3-04', points: 5000, azitLevel: 10 });
            seedItem(ctx.dbPath, user.userId, 'item-skill-tome', 2);

            const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/skills/upgrade', user.sessionId, {
                mercCode: 'merc-aria',
                skillSlot: 'main',
            });
            assert.ok(res.status === 400 || res.status === 404);
            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.items?.find((i) => i.itemId === 'item-skill-tome')?.qty, 2);
        },
    },
    {
        id: 'T2-R3-05',
        tier: 2,
        area: 'R3',
        description: 'Combat EXP caps cleanly at mercenary maxLevel (15) without overflow or NaN',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r3-05', points: 10_000, azitLevel: 10 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-leo', 15, 0);

            const b1 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-leo'],
            });
            assert.equal(b1.status, 200);
            const st = await getAzitState(ctx, user.sessionId);
            const leo = st.mercenaries.find((m) => m.mercCode === 'merc-leo');
            assert.ok(leo);
            assert.equal(leo.level, 15, 'Mercenary level must cap at 15');
            assert.ok(Number.isFinite(leo.power) && Number.isFinite(leo.xp));
        },
    },
    {
        id: 'T2-R3-06',
        tier: 2,
        area: 'R3',
        description: 'Mercenary Roster UI shows zero gold-upgrade buttons across all 6 hired mercs',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r3-06', points: 100_000, azitLevel: 10 });
            for (const c of ['merc-leo', 'merc-rina', 'merc-kael', 'merc-serena', 'merc-garr', 'merc-aria']) {
                await hireMerc(ctx, user.sessionId, c);
            }

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
                                return txt.includes('용병 길드') && txt.includes('레오') && txt.includes('아리아');
                            }),
                        { timeout: 10_000 }
                    );
                    const hasGoldBtn = await page.evaluate(() => {
                        const modals = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0'));
                        const modal = modals.find((m) => (m.textContent ?? '').includes('용병 길드')) ?? modals[modals.length - 1];
                        if (!modal) return true;
                        return Array.from(modal.querySelectorAll('button')).some((b) => {
                            const t = b.textContent ?? '';
                            return t.includes('훈련 강화') || (t.includes('레벨업') && /\d[\d,]*\s*P/.test(t));
                        });
                    });
                    assert.equal(hasGoldBtn, false, 'Expected 0 gold-upgrade buttons across all 6 mercenaries');
                }
            );
        },
    },

    // =========================================================================
    // Area R4 Boundaries: Vera's Tower Bounds, Party Validation & z-[70] (7 Cases)
    // =========================================================================
    {
        id: 'T2-R4-01',
        tier: 2,
        area: 'R4',
        description: 'Vera Tower rejects out-of-range floors (0, -1, 201, 1.5, string)',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r4-01', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');

            for (const badFloor of [0, -1, 201, 1.5, 'abc']) {
                const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                    floor: badFloor,
                    partyMercCodes: ['merc-leo'],
                });
                assert.equal(res.status, 400, `Floor ${String(badFloor)} must return 400, got ${res.status}`);
            }
        },
    },
    {
        id: 'T2-R4-02',
        tier: 2,
        area: 'R4',
        description: 'Vera Tower rejects locked floors > highestClearedFloor + 1',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r4-02', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');

            for (const lockedFloor of [2, 50, 200]) {
                const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                    floor: lockedFloor,
                    partyMercCodes: ['merc-leo'],
                });
                assert.ok(
                    res.status === 400 || res.status === 403 || res.status === 409,
                    `Locked floor ${lockedFloor} must be rejected, got ${res.status}`
                );
            }
            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.tower?.highestClearedFloor, 0);
        },
    },
    {
        id: 'T2-R4-03',
        tier: 2,
        area: 'R4',
        description: 'Vera Tower rejects dead or expedition-busy mercenaries',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r4-03', points: 5000, azitLevel: 5 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            setMercDead(ctx.dbPath, user.userId, 'merc-leo');
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);
            await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-rina'],
                dishRecipeId: 'dish-carrot-soup',
            });

            const deadRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-leo'],
            });
            assert.ok(deadRes.status === 400 || deadRes.status === 409);

            const busyRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-rina'],
            });
            assert.ok(busyRes.status === 400 || busyRes.status === 409);
        },
    },
    {
        id: 'T2-R4-04',
        tier: 2,
        area: 'R4',
        description: 'Vera Tower rejects empty party, duplicate mercs, or oversized party',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r4-04', points: 20_000, azitLevel: 7 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-rina');
            await hireMerc(ctx, user.sessionId, 'merc-kael');
            await hireMerc(ctx, user.sessionId, 'merc-serena');

            for (const badParty of [[], ['merc-leo', 'merc-rina', 'merc-kael', 'merc-serena']]) {
                const res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                    floor: 1,
                    partyMercCodes: badParty,
                });
                assert.equal(res.status, 400, `Party ${JSON.stringify(badParty)} must return 400, got ${res.status}`);
            }

            // Duplicate partyMercCodes: either rejected 400 OR deduplicated to strictly 1 ally unit
            const dupRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-leo', 'merc-leo'],
            });
            if (dupRes.status === 200) {
                const dupData = asRecord(dupRes.json.data, 'tower/battle duplicate party response');
                const frames = asArray(dupData.frames, 'tower/battle duplicate party frames');
                assert.ok(frames.length >= 1, 'Expected at least 1 combat frame for deduplicated party');
                const frame0 = asRecord(frames[0], 'frames[0]');
                const units0 = asArray(frame0.units, 'frames[0].units');
                const allies = units0.filter((u) => isRecord(u) && u.side === 'ally');
                assert.equal(
                    allies.length,
                    1,
                    `Duplicate party ["merc-leo","merc-leo"] must deduplicate to strictly 1 ally unit, got ${allies.length}`
                );
            } else {
                assert.equal(
                    dupRes.status,
                    400,
                    `Duplicate party ["merc-leo","merc-leo"] must return 400 or deduplicate to 1 ally, got ${dupRes.status}`
                );
            }
        },
    },
    {
        id: 'T2-R4-05',
        tier: 2,
        area: 'R4',
        description: 'Vera Tower z-[70] fullscreen overlay covers z-50 PortalNavbar & MobileTabBar at 375x812 and 1280x800',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r4-05', points: 5000, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            for (const vp of [
                { width: 375, height: 812 },
                { width: 1280, height: 800 },
            ]) {
                await openAuthedPage(
                    browser,
                    nextBaseUrl,
                    user.sessionId,
                    vp,
                    '/mypage?section=dashboard&zone=camp',
                    async (page) => {
                        await waitForText(page, '베라의 탑', 20_000);
                        const openedTower = await clickButtonByText(page, '베라의 탑');
                        assert.ok(openedTower, 'Expected "베라의 탑" button to open Tower Lobby');
                        await waitForText(page, '1F', 10_000);
                        const started =
                            (await clickButtonByText(page, '도전')) ||
                            (await clickButtonByText(page, '전투 시작'));
                        assert.ok(started, 'Expected Tower battle start button ("도전" or "전투 시작")');
                        await page.waitForSelector('[data-tower-fullscreen="true"]', { timeout: 10_000 });
                        const sel = await findTowerOverlaySelector(page);
                        await assertZIndexAboveNav(page, sel);
                        await assertNoHorizontalOverflow(page, `Tower fullscreen ${vp.width}x${vp.height}`);
                        await assertCanvasAnimating(page, '[data-testid="azit-tower-canvas"]', 450);
                    }
                );
            }
        },
    },
    {
        id: 'T2-R4-06',
        tier: 2,
        area: 'R4',
        description: 'Fresh user Vera Tower Lobby shows 0 cleared floors and zero fake history',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r4-06', points: 1000 });
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
                    assert.ok(openedTower, 'Expected "베라의 탑" button to open Tower Lobby');
                    await waitForText(page, '1F', 10_000);
                    const modalText = await page.evaluate(() => {
                        const modals = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0'));
                        const topModal = modals[modals.length - 1];
                        return topModal instanceof HTMLElement ? topModal.innerText : document.body.innerText;
                    });
                    assert.ok(
                        /0\s*\/\s*200|최고\s*[:：]?\s*0\s*층/.test(modalText),
                        `Expected exact 0/200 or 최고 0층 empty progress state in Tower Lobby, got: "${modalText.slice(0, 200)}"`
                    );
                }
            );
        },
    },
    {
        id: 'T2-R4-07',
        tier: 2,
        area: 'R4',
        description: 'Floor 200 victory caps highestClearedFloor at 200 and floor 201 remains rejected',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r4-07', points: 50_000, azitLevel: 20 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            await hireMerc(ctx, user.sessionId, 'merc-garr');
            await hireMerc(ctx, user.sessionId, 'merc-aria');
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-leo', 15, 0);
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-garr', 15, 0);
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-aria', 15, 0);
            seedItem(ctx.dbPath, user.userId, 'item-battle-elixir', 1);
            setTowerHighestFloor(ctx.dbPath, user.userId, 199);

            const b200 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 200,
                partyMercCodes: ['merc-leo', 'merc-garr', 'merc-aria'],
                elixirItemId: 'item-battle-elixir',
            });
            assert.equal(b200.status, 200, `Tower 200F battle failed: ${b200.rawText}`);
            const b200Data = asRecord(b200.json.data, 'tower 200F data');
            assert.equal(b200Data.won, true, `Expected Lv15 3-merc party with elixir to clear 200F: ${b200.rawText}`);

            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.tower?.highestClearedFloor, 200, 'highestClearedFloor must equal 200 after 200F victory');

            const b201 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 201,
                partyMercCodes: ['merc-leo'],
            });
            assert.equal(b201.status, 400);
        },
    },

    // =========================================================================
    // Area R5 Boundaries: Auth, Input Fuzzing, Concurrency & Ledger (5 Cases)
    // =========================================================================
    {
        id: 'T2-R5-01',
        tier: 2,
        area: 'R5',
        description: 'Unauthenticated requests to all /api/azit-game/* endpoints return 401',
        requiresBrowser: false,
        run: async (ctx) => {
            const getState = await jsonGet(ctx.apiBaseUrl, '/api/azit-game/state');
            assert.equal(getState.status, 401);

            const getFloors = await jsonGet(ctx.apiBaseUrl, '/api/azit-game/tower/floors');
            assert.equal(getFloors.status, 401);

            for (const endpoint of [
                '/api/azit-game/groups/save',
                '/api/azit-game/groups/delete',
                '/api/azit-game/expeditions/start',
                '/api/azit-game/expeditions/claim',
                '/api/azit-game/mercenaries/upgrade',
                '/api/azit-game/mercenaries/revive',
                '/api/azit-game/mercenaries/skills/upgrade',
                '/api/azit-game/shop/buy',
                '/api/azit-game/craft',
                '/api/azit-game/tower/battle',
            ]) {
                const res = await jsonPost(ctx.apiBaseUrl, endpoint, undefined, {});
                assert.equal(res.status, 401, `Unauthenticated POST ${endpoint} must return 401, got ${res.status}`);
            }
        },
    },
    {
        id: 'T2-R5-02',
        tier: 2,
        area: 'R5',
        description: 'Malformed/non-object JSON payloads on all new POST endpoints return 400 (never 500)',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r5-02', points: 5000, azitLevel: 4 });
            const endpoints = [
                '/api/azit-game/groups/save',
                '/api/azit-game/groups/delete',
                '/api/azit-game/mercenaries/revive',
                '/api/azit-game/mercenaries/skills/upgrade',
                '/api/azit-game/shop/buy',
                '/api/azit-game/craft',
                '/api/azit-game/tower/battle',
            ];
            for (const endpoint of endpoints) {
                for (const badBody of ['{bad-json', '[]', 'null', '"str"']) {
                    const res = await rawPost(ctx.apiBaseUrl, endpoint, user.sessionId, badBody);
                    assert.equal(res.status, 400, `${endpoint} with ${badBody} must return 400, got ${res.status}`);
                    const code = extractErrorCode(res);
                    assert.ok(
                        code === 'INVALID_JSON' || code === 'INVALID_BODY',
                        `${endpoint} expected INVALID_JSON/INVALID_BODY, got ${res.rawText}`
                    );
                }
            }
        },
    },
    {
        id: 'T2-R5-03',
        tier: 2,
        area: 'R5',
        description: 'Concurrent burst requests serialize cleanly without double-spend or negative balances',
        requiresBrowser: false,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r5-03', points: 150, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo'); // costs 60 -> leaves 90, or seed exact 150 after hire
            queryDb(ctx.dbPath, (db) =>
                db.prepare(`UPDATE user_points SET points = 150 WHERE user_id = ?`).run(user.userId)
            );

            // 3 concurrent shop/buy for 150P item when user only has 150P
            const shopBurst = await Promise.all([
                jsonPost(ctx.apiBaseUrl, '/api/azit-game/shop/buy', user.sessionId, { itemId: 'item-revival-herb', qty: 1 }),
                jsonPost(ctx.apiBaseUrl, '/api/azit-game/shop/buy', user.sessionId, { itemId: 'item-revival-herb', qty: 1 }),
                jsonPost(ctx.apiBaseUrl, '/api/azit-game/shop/buy', user.sessionId, { itemId: 'item-revival-herb', qty: 1 }),
            ]);
            const shopSuccesses = shopBurst.filter((r) => r.status === 200);
            const shopRejected = shopBurst.filter((r) => r.status !== 200);
            assert.equal(shopSuccesses.length, 1, 'Exactly 1 concurrent shop/buy may succeed');
            assert.equal(shopRejected.length, 2);
            for (const r of shopRejected) {
                assert.ok(
                    r.status === 400 || r.status === 409,
                    `Rejected concurrent shop/buy must return 400 or 409 (< 500), got ${r.status}: ${r.rawText}`
                );
            }

            // 3 concurrent revive requests with 1 herb
            setMercDead(ctx.dbPath, user.userId, 'merc-leo');
            const reviveBurst = await Promise.all([
                jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/revive', user.sessionId, {
                    mercCode: 'merc-leo',
                    itemId: 'item-revival-herb',
                }),
                jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/revive', user.sessionId, {
                    mercCode: 'merc-leo',
                    itemId: 'item-revival-herb',
                }),
                jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/revive', user.sessionId, {
                    mercCode: 'merc-leo',
                    itemId: 'item-revival-herb',
                }),
            ]);
            const reviveSuccesses = reviveBurst.filter((r) => r.status === 200);
            const reviveRejected = reviveBurst.filter((r) => r.status !== 200);
            assert.equal(reviveSuccesses.length, 1, 'Exactly 1 concurrent revive may succeed');
            assert.equal(reviveRejected.length, 2);
            for (const r of reviveRejected) {
                assert.ok(
                    r.status === 400 || r.status === 409,
                    `Rejected concurrent revive must return 400 or 409 (< 500), got ${r.status}: ${r.rawText}`
                );
            }

            const st = await getAzitState(ctx, user.sessionId);
            assert.equal(st.veraPoints, 0, `Exact 150P shop burst must leave veraPoints === 0, got ${st.veraPoints}`);
            assert.equal(
                st.items?.find((i) => i.itemId === 'item-revival-herb')?.qty ?? 0,
                0,
                'Exact 1 herb revive burst must leave item-revival-herb qty === 0'
            );
            assert.equal(
                st.mercenaries.find((m) => m.mercCode === 'merc-leo')?.status,
                'idle',
                'merc-leo must be idle after concurrent revive burst'
            );
        },
    },
    {
        id: 'T2-R5-04',
        tier: 2,
        area: 'R5',
        description: 'Point ledger deltas reconcile 1:1 with user_points.points across shop, expedition & tower',
        requiresBrowser: false,
        run: async (ctx) => {
            const startPoints = 5000;
            const user = await seedUser(ctx, { label: 't2-r5-04', points: startPoints, azitLevel: 4 });
            await hireMerc(ctx, user.sessionId, 'merc-leo');
            const shopRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/shop/buy', user.sessionId, {
                itemId: 'item-revival-herb',
                qty: 1,
            });
            assert.equal(shopRes.status, 200, `Shop buy setup failed: ${shopRes.rawText}`);

            const towerRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-leo'],
            });
            assert.equal(towerRes.status, 200, `Tower battle setup failed: ${towerRes.rawText}`);
            const towerData = asRecord(towerRes.json.data, 'tower/battle data');

            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);
            const expStartRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo'],
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.equal(expStartRes.status, 200, `Expedition start setup failed: ${expStartRes.rawText}`);
            const stExp = await getAzitState(ctx, user.sessionId);
            const expId = stExp.activeExpeditions[0].id;
            backdateExpedition(ctx.dbPath, expId, Date.now() - 2000);
            const expClaimRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, {
                expeditionId: expId,
            });
            assert.equal(expClaimRes.status, 200, `Expedition claim setup failed: ${expClaimRes.rawText}`);
            const claimData = asRecord(expClaimRes.json.data, 'expedition claim data');
            const claimReport = asRecord(claimData.report, 'expedition claim report');

            const st = await getAzitState(ctx, user.sessionId);
            const sumRow = queryDb(ctx.dbPath, (db) =>
                db
                    .prepare(`SELECT COALESCE(SUM(delta_points), 0) AS total FROM azit_point_ledger WHERE user_id = ?`)
                    .get(user.userId)
            );
            assert.ok(isRecord(sumRow));
            const ledgerSum = asNumber(sumRow.total, 'ledgerSum');
            assert.equal(
                startPoints + ledgerSum,
                st.veraPoints,
                `Ledger sum (${startPoints} + ${ledgerSum}) must equal final veraPoints (${st.veraPoints})`
            );

            const ledgerRows = queryDb(ctx.dbPath, (db) =>
                db.prepare(`SELECT DISTINCT tx_type FROM azit_point_ledger WHERE user_id = ?`).all(user.userId)
            ) as Array<{ tx_type: string }>;
            const txTypes = new Set(ledgerRows.map((r) => r.tx_type));
            assert.ok(txTypes.has('merc_hire'), `Expected merc_hire in ledger, got ${Array.from(txTypes)}`);
            assert.ok(txTypes.has('item_buy'), `Expected item_buy in ledger, got ${Array.from(txTypes)}`);
            if (towerData.won === true) {
                assert.ok(txTypes.has('tower_first_clear'), `Expected tower_first_clear in ledger, got ${Array.from(txTypes)}`);
            }
            if (claimReport.won === true) {
                assert.ok(txTypes.has('expedition_reward'), `Expected expedition_reward in ledger, got ${Array.from(txTypes)}`);
            }
        },
    },
    {
        id: 'T2-R5-05',
        tier: 2,
        area: 'R5',
        description: 'Zeroed stats render cleanly in Camp & Tower UI with zero NaN, undefined, or negative counts',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't2-r5-05', points: 0 });
            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '용병 토벌 캠프', 20_000);
                    const campText = await page.evaluate(() => document.body.innerText);
                    assert.ok(campText.includes('0승') && campText.includes('0패'), 'Expected zeroed 0승 0패 stats on Camp UI');
                    assert.ok(!campText.includes('NaN') && !campText.includes('undefined'), 'Zeroed Camp UI must not display NaN or undefined');

                    // Open Mercenary UI & verify zeroed counts
                    await openMercGuildModal(page);
                    await sleepMs(250);
                    const mercModalText = await getOpenModalText(page, '용병 길드');
                    assert.ok(mercModalText.includes('0/'), `Expected 0/N hired merc count in Mercenary modal, got: "${mercModalText.slice(0, 150)}"`);
                    assert.ok(!mercModalText.includes('NaN') && !mercModalText.includes('undefined'), 'Mercenary modal must not display NaN or undefined');
                    await closeOpenModal(page, '용병 길드');
                    await sleepMs(250);

                    // Open Vera's Tower UI & verify zeroed 0/200 / 0층 state
                    const openedTower = await clickButtonByText(page, '베라의 탑');
                    assert.ok(openedTower, 'Expected "베라의 탑" button to open Tower UI');
                    await waitForText(page, '1F', 10_000);
                    const towerModalText = await page.evaluate(() => {
                        const modals = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0'));
                        const topModal = modals[modals.length - 1];
                        return topModal instanceof HTMLElement ? topModal.innerText : '';
                    });
                    assert.ok(
                        /0\s*\/\s*200|최고\s*[:：]?\s*0\s*층/.test(towerModalText),
                        `Expected zeroed Tower progress (0/200 or 최고 0층) in Tower UI, got: "${towerModalText.slice(0, 200)}"`
                    );
                    assert.ok(
                        !towerModalText.includes('NaN') && !towerModalText.includes('undefined'),
                        'Zeroed Tower UI must not display NaN or undefined'
                    );
                }
            );
        },
    },
];

if (isMainModule(import.meta.url)) {
    runStandaloneTier('Tier 2 Boundaries', tier2Cases).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
