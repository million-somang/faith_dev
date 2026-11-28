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
    clickModalButtonByText,
    closeOpenModal,
    extractErrorCode,
    findCampBattlefieldCanvasSelector,
    getAzitState,
    getCampBattlefieldContainerText,
    getCraftRecipeResultItemId,
    getOpenModalText,
    isMainModule,
    isRecord,
    jsonPost,
    openAuthedPage,
    openMercGuildModal,
    queryDb,
    runStandaloneTier,
    seedDish,
    seedItem,
    seedUser,
    setMercDead,
    setMercLevelAndXp,
    setTowerHighestFloor,
    waitForText,
    withDb,
    type TestCaseDefinition,
} from './harness.js';

function reconcilePointLedger(dbPath: string, userId: number, startPoints: number, actualPoints: number, label: string): void {
    const sumRow = queryDb(dbPath, (db) =>
        db.prepare(`SELECT COALESCE(SUM(delta_points), 0) AS total FROM azit_point_ledger WHERE user_id = ?`).get(userId)
    );
    assert.ok(isRecord(sumRow), `${label}: expected azit_point_ledger sum row`);
    const ledgerSum = asNumber(sumRow.total, `${label}.ledgerSum`);
    assert.equal(
        startPoints + ledgerSum,
        actualPoints,
        `${label}: ledger reconciliation failed (${startPoints} + ${ledgerSum} !== ${actualPoints})`
    );
}

export const tier4Cases: TestCaseDefinition[] = [
    {
        id: 'T4-01',
        tier: 4,
        area: 'Scenario-Camp-DualExpedition',
        description: 'New adventurer onboarding -> empty states -> hire 2 mercs -> 2 groups -> 2 simultaneous expeditions -> live canvas -> claim',
        requiresBrowser: true,
        run: async (ctx) => {
            const startPoints = 10_000;
            const user = await seedUser(ctx, { label: 't4-01', points: startPoints, azitLevel: 5 });
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 2);

            const stEmpty = await getAzitState(ctx, user.sessionId);
            assert.equal(stEmpty.mercenaries.length, 0, 'Fresh user must start with 0 mercenaries');
            assert.equal(stEmpty.groups?.length ?? 0, 0, 'Fresh user must start with 0 groups');
            assert.equal(stEmpty.activeExpeditions.length, 0, 'Fresh user must start with 0 active expeditions');
            assert.equal(
                (stEmpty.items ?? []).reduce((sum, it) => sum + it.qty, 0),
                0,
                'Fresh user must start with 0 total item quantity'
            );
            assert.equal(stEmpty.tower?.highestClearedFloor ?? 0, 0, 'Fresh user must start at Tower floor 0');

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '출정 중인 원정대가 없습니다', 20_000);
                    assert.equal(
                        await findCampBattlefieldCanvasSelector(page),
                        null,
                        'Camp battlefield canvas must NOT render when 0 expeditions are active'
                    );

                    // 1. Hire 2 mercs via UI
                    await openMercGuildModal(page);
                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                const txt = m.textContent ?? '';
                                return txt.includes('용병 길드') && txt.includes('레오');
                            }),
                        { timeout: 10_000 }
                    );
                    const hired1 = await clickModalButtonByText(page, '영입하기', '용병 길드');
                    assert.ok(hired1, 'Expected first "영입하기" button inside Mercenary Guild modal');
                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) =>
                                (m.textContent ?? '').includes('용병 1/')
                            ),
                        { timeout: 10_000 }
                    );
                    const hired2 = await clickModalButtonByText(page, '영입하기', '용병 길드');
                    assert.ok(hired2, 'Expected second "영입하기" button inside Mercenary Guild modal');
                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) =>
                                (m.textContent ?? '').includes('용병 2/')
                            ),
                        { timeout: 10_000 }
                    );

                    // 2. Create 2 groups via UI Group tab
                    const clickedGroupsTab = await clickModalButtonByText(page, '용병 그룹 편성', '용병 길드');
                    assert.ok(clickedGroupsTab, 'Expected "용병 그룹 편성" tab in Mercenary Guild modal');
                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) =>
                                (m.textContent ?? '').includes('새 용병 그룹 만들기')
                            ),
                        { timeout: 10_000 }
                    );

                    const createGroupInUi = async (groupName: string, mercDisplayName: string) => {
                        const inputSel = 'input[placeholder*="예:"]';
                        await page.waitForSelector(inputSel, { timeout: 5_000 });
                        await page.click(inputSel, { clickCount: 3 });
                        await page.keyboard.press('Backspace');
                        await page.type(inputSel, groupName);

                        const pickedMerc = await clickModalButtonByText(page, mercDisplayName, '용병 길드');
                        assert.ok(pickedMerc, `Expected merc button "${mercDisplayName}" in group builder`);
                        const saved = await clickModalButtonByText(page, '그룹 저장', '용병 길드');
                        assert.ok(saved, `Expected enabled "그룹 저장" button for "${groupName}"`);
                        await page.waitForFunction(
                            (gName: string) =>
                                Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                    const txt = m.textContent ?? '';
                                    return txt.includes('용병 길드') && txt.includes(gName);
                                }),
                            { timeout: 10_000 },
                            groupName
                        );
                    };

                    await createGroupInUi('선발1조', '레오');
                    await createGroupInUi('선발2조', '리나');
                    assert.ok(await closeOpenModal(page, '용병 길드'), 'Expected close button on Mercenary Guild modal');
                    await page.waitForFunction(
                        () =>
                            !Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) =>
                                (m.textContent ?? '').includes('용병 길드')
                            ),
                        { timeout: 10_000 }
                    );

                    const stG = await getAzitState(ctx, user.sessionId);
                    const groups = asArray(stG.groups, 'state.groups');
                    assert.equal(groups.length, 2, 'Expected 2 saved groups after UI creation');
                    const g1 = groups.find((g) => isRecord(g) && g.name === '선발1조');
                    const g2 = groups.find((g) => isRecord(g) && g.name === '선발2조');
                    assert.ok(isRecord(g1) && isRecord(g2), 'Expected both 선발1조 and 선발2조 groups');
                    const g1Id = asNumber(g1.id, 'g1.id');
                    const g2Id = asNumber(g2.id, 'g2.id');

                    // 3. Dispatch 2 simultaneous expeditions via UI Expedition modal
                    const dispatchViaUi = async (zoneName: string, groupName: string) => {
                        const opened = await clickButtonByText(page, '몬스터 원정 출정');
                        assert.ok(opened, `Expected "몬스터 원정 출정" button for ${zoneName}`);
                        await page.waitForFunction(
                            () =>
                                Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) =>
                                    (m.textContent ?? '').includes('몬스터 토벌 원정 편성')
                                ),
                            { timeout: 10_000 }
                        );
                        assert.ok(
                            await clickModalButtonByText(page, zoneName, '몬스터 토벌 원정 편성'),
                            `Expected zone "${zoneName}" button in expedition modal`
                        );
                        assert.ok(
                            await clickModalButtonByText(page, groupName, '몬스터 토벌 원정 편성'),
                            `Expected saved group "${groupName}" button in expedition modal`
                        );
                        assert.ok(
                            await clickModalButtonByText(page, '원정 출정 확정', '몬스터 토벌 원정 편성'),
                            `Expected enabled "원정 출정 확정" button for ${zoneName}`
                        );
                        await page.waitForFunction(
                            (zName: string) =>
                                !Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) =>
                                    (m.textContent ?? '').includes('몬스터 토벌 원정 편성')
                                ) && (document.body?.innerText ?? '').includes(zName),
                            { timeout: 10_000 },
                            zoneName
                        );
                    };

                    await dispatchViaUi('슬라임 습지대', '선발1조');
                    await dispatchViaUi('고블린 약탈 캠프', '선발2조');

                    // 4. Verify persisted durations (1h/2h), groupIds, and DB rows before backdating
                    const stActive = await getAzitState(ctx, user.sessionId);
                    assert.equal(stActive.activeExpeditions.length, 2, 'Expected 2 active expeditions');
                    const expSlime = stActive.activeExpeditions.find((e) => e.zoneId === 'zone-slime');
                    const expGoblin = stActive.activeExpeditions.find((e) => e.zoneId === 'zone-goblin');
                    assert.ok(expSlime && expGoblin, 'Expected both zone-slime and zone-goblin active expeditions');
                    assert.equal(expSlime.durationSec, 3600, 'Expected zone-slime durationSec === 3600 (1h)');
                    assert.equal(expSlime.groupId, g1Id, 'Expected zone-slime groupId === g1Id');
                    assert.equal(expGoblin.durationSec, 7200, 'Expected zone-goblin durationSec === 7200 (2h)');
                    assert.equal(expGoblin.groupId, g2Id, 'Expected zone-goblin groupId === g2Id');

                    const dbExpRows = queryDb(ctx.dbPath, (db) =>
                        db
                            .prepare(
                                `SELECT id, zone_id, group_id, duration_sec, status
                                 FROM azit_expeditions
                                 WHERE user_id = ? AND status = 'running' AND is_deleted = 0
                                 ORDER BY id ASC`
                            )
                            .all(user.userId)
                    );
                    assert.equal(dbExpRows.length, 2, 'Expected 2 running rows in azit_expeditions');

                    await page.reload({ waitUntil: 'networkidle2' });
                    await waitForText(page, '슬라임 습지대', 20_000);
                    await waitForText(page, '고블린 약탈 캠프', 10_000);

                    const canvasSel = await findCampBattlefieldCanvasSelector(page);
                    assert.ok(canvasSel !== null, 'Expected live Camp bottom battlefield canvas after reload');
                    await assertCanvasAnimating(page, canvasSel, 500);

                    // Test multi-expedition switcher inside [data-camp-battlefield="true"]
                    const beforeSwitchText = await getCampBattlefieldContainerText(page, canvasSel);
                    const switchedToSecond = await clickButtonByText(
                        page,
                        '고블린 약탈 캠프',
                        '[data-camp-battlefield="true"]'
                    );
                    assert.ok(switchedToSecond, 'Expected multi-expedition switcher button for 고블린 약탈 캠프');
                    await page.waitForFunction(
                        () => {
                            const hud = document.querySelector('[data-camp-battlefield="true"] .relative > div');
                            return (hud?.textContent ?? '').includes('고블린 약탈 캠프');
                        },
                        { timeout: 5_000 }
                    );
                    assert.ok(beforeSwitchText.length > 0);

                    // 5. Backdate & claim both expeditions via UI, verifying Battle Report modal contents
                    for (const exp of stActive.activeExpeditions) {
                        backdateExpedition(ctx.dbPath, exp.id, Date.now() - 2000);
                    }
                    await page.reload({ waitUntil: 'networkidle2' });
                    await waitForText(page, '전리품 정산', 20_000);

                    const claimAndVerifyReport = async () => {
                        const clickedClaim = await clickButtonByText(page, '전리품 정산');
                        assert.ok(clickedClaim, 'Expected "전리품 정산" button');
                        await page.waitForFunction(
                            () =>
                                Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                    const txt = m.textContent ?? '';
                                    return txt.includes('토벌 대성공') || txt.includes('원정 토벌 실패');
                                }),
                            { timeout: 15_000 }
                        );
                        const reportText = await getOpenModalText(page, '용병 EXP');
                        assert.ok(
                            reportText.includes('골드 포인트') &&
                                reportText.includes('아지트 EXP') &&
                                reportText.includes('용병 EXP'),
                            `Expected itemized Battle Report contents, got: ${reportText.slice(0, 200)}`
                        );
                        const confirmed = await clickModalButtonByText(page, '확인 완료', '용병 EXP');
                        assert.ok(confirmed, 'Expected "확인 완료" button in Battle Report modal');
                        await page.waitForFunction(
                            () =>
                                !Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                    const txt = m.textContent ?? '';
                                    return txt.includes('토벌 대성공') || txt.includes('원정 토벌 실패');
                                }),
                            { timeout: 10_000 }
                        );
                    };

                    await claimAndVerifyReport();
                    await claimAndVerifyReport();
                    await waitForText(page, '출정 중인 원정대가 없습니다', 15_000);
                    assert.equal(
                        await findCampBattlefieldCanvasSelector(page),
                        null,
                        'Camp battlefield canvas must unmount after claiming all expeditions'
                    );

                    const stFinal = await getAzitState(ctx, user.sessionId);
                    assert.equal(stFinal.activeExpeditions.length, 0);
                    const totalXp = stFinal.mercenaries.reduce((s, m) => s + m.xp + (m.level - 1) * 60, 0);
                    assert.ok(totalXp > 0, 'Expected mercs to gain combat EXP from claimed expeditions');
                    reconcilePointLedger(ctx.dbPath, user.userId, startPoints, stFinal.veraPoints, 'T4-01');
                }
            );
        },
    },
    {
        id: 'T4-02',
        tier: 4,
        area: 'Scenario-Casualty-ItemRevival',
        description: 'Dead mercenary visual -> shop & craft item acquisition -> item revival in UI -> 3h forest redeploy',
        requiresBrowser: true,
        run: async (ctx) => {
            const startPoints = 10_000;
            const user = await seedUser(ctx, { label: 't4-02', points: startPoints, azitLevel: 5 });
            const hireRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/hire', user.sessionId, {
                mercCode: 'merc-leo',
            });
            assert.equal(hireRes.status, 200, `Hire merc-leo failed: ${hireRes.rawText}`);
            setMercDead(ctx.dbPath, user.userId, 'merc-leo', 'zone-forest');
            seedDish(ctx.dbPath, user.userId, 'dish-tomato-stew', 1);

            const st0 = await getAzitState(ctx, user.sessionId);
            const herbRecipe = asArray(st0.catalog.craftRecipes, 'catalog.craftRecipes').find(
                (r) => isRecord(r) && getCraftRecipeResultItemId(r) === 'item-revival-herb'
            );
            assert.ok(isRecord(herbRecipe), 'Expected revival herb craft recipe in catalog.craftRecipes');
            const herbRecipeName = asString(herbRecipe.name, 'herbRecipe.name');
            const herbCraftCost = asNumber(herbRecipe.pointsCost, 'herbRecipe.pointsCost');
            const herbCatalogItem = asArray(st0.catalog.items, 'catalog.items').find(
                (it) => isRecord(it) && it.itemId === 'item-revival-herb'
            );
            assert.ok(isRecord(herbCatalogItem), 'Expected item-revival-herb in catalog.items');
            const herbShopPrice = asNumber(herbCatalogItem.shopPrice, 'herbCatalogItem.shopPrice');

            for (const ingRaw of asArray(herbRecipe.ingredients, 'herbRecipe.ingredients')) {
                const ing = asRecord(ingRaw);
                const id = asString(ing.id);
                const qty = asNumber(ing.qty);
                if (ing.kind === 'crop') {
                    withDb(ctx.dbPath, (db) => {
                        db.prepare(
                            `INSERT INTO azit_crop_inventory (user_id, crop_id, seed_qty, harvest_qty)
                             VALUES (?, ?, 0, ?)
                             ON CONFLICT(user_id, crop_id) DO UPDATE SET harvest_qty = excluded.harvest_qty`
                        ).run(user.userId, id, qty);
                    });
                } else if (ing.kind === 'material') {
                    withDb(ctx.dbPath, (db) => {
                        db.prepare(
                            `INSERT INTO azit_material_inventory (user_id, material_id, qty)
                             VALUES (?, ?, ?)
                             ON CONFLICT(user_id, material_id) DO UPDATE SET qty = excluded.qty`
                        ).run(user.userId, id, qty);
                    });
                } else if (ing.kind === 'item') {
                    seedItem(ctx.dbPath, user.userId, id, qty);
                }
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
                                return txt.includes('용병 길드') && txt.includes('레오');
                            }),
                        { timeout: 10_000 }
                    );

                    const modalText = await getOpenModalText(page, '용병 길드');
                    assert.ok(
                        modalText.includes('전투불능') && modalText.includes('골드 부활 불가'),
                        `Expected "전투불능" and "골드 부활 불가" in dead mercenary card, got: ${modalText.slice(0, 300)}`
                    );
                    const hasGoldReviveBtn = await page.evaluate(() => {
                        const modals = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0'));
                        const modal = modals.find((m) => (m.textContent ?? '').includes('용병 길드')) ?? modals[modals.length - 1];
                        if (!modal) return true;
                        return Array.from(modal.querySelectorAll('button')).some((b) => {
                            const t = b.textContent ?? '';
                            return t.includes('부활') && /\d[\d,]*\s*P/.test(t);
                        });
                    });
                    assert.equal(hasGoldReviveBtn, false, 'Dead mercenary must NOT offer gold-based revival button');

                    // Acquire item via BOTH Craft and Shop in UI ('상점 · 연금 제작' tab)
                    const stBeforeAcquire = await getAzitState(ctx, user.sessionId);
                    assert.ok(
                        await clickModalButtonByText(page, '상점 · 연금 제작', '용병 길드'),
                        'Expected "상점 · 연금 제작" tab button'
                    );
                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                const txt = m.textContent ?? '';
                                return txt.includes('아지트 보급 상점') && txt.includes('아지트 연금 제작');
                            }),
                        { timeout: 10_000 }
                    );

                    const clickedCraft = await page.evaluate((recipeName: string) => {
                        const modals = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0'));
                        const modal = modals.find((m) => (m.textContent ?? '').includes('용병 길드'));
                        if (!modal) return false;
                        const cards = Array.from(modal.querySelectorAll('div'));
                        const card = cards
                            .filter((d) => {
                                const t = d.textContent ?? '';
                                return (
                                    t.includes(recipeName) &&
                                    t.includes('제작하기') &&
                                    !t.includes('투지의 비약') &&
                                    !t.includes('아지트 보급 상점')
                                );
                            })
                            .pop();
                        const btn = card
                            ? Array.from(card.querySelectorAll('button')).find(
                                  (b) => (b.textContent ?? '').includes('제작하기') && !b.disabled
                              )
                            : null;
                        if (!btn) return false;
                        btn.click();
                        return true;
                    }, herbRecipeName);
                    assert.ok(clickedCraft, `Expected enabled Craft button for "${herbRecipeName}" in UI`);

                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                const txt = m.textContent ?? '';
                                return txt.includes('용병 길드') && txt.includes('약초 1');
                            }),
                        { timeout: 10_000 }
                    );

                    const clickedShopBuy = await page.evaluate(() => {
                        const modals = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0'));
                        const modal = modals.find((m) => (m.textContent ?? '').includes('용병 길드'));
                        if (!modal) return false;
                        const cards = Array.from(modal.querySelectorAll('div'));
                        const shopCard = cards
                            .filter((d) => {
                                const t = d.textContent ?? '';
                                return (
                                    t.includes('생명의 약초') &&
                                    t.includes('1개 구매') &&
                                    !t.includes('불사조의 깃털') &&
                                    !t.includes('아지트 연금 제작')
                                );
                            })
                            .pop();
                        const btn = shopCard
                            ? Array.from(shopCard.querySelectorAll('button')).find(
                                  (b) => (b.textContent ?? '').includes('1개 구매') && !b.disabled
                              )
                            : null;
                        if (!btn) return false;
                        btn.click();
                        return true;
                    });
                    assert.ok(clickedShopBuy, 'Expected enabled Shop "1개 구매" button for 생명의 약초');

                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                const txt = m.textContent ?? '';
                                return txt.includes('용병 길드') && txt.includes('약초 2');
                            }),
                        { timeout: 10_000 }
                    );

                    const stItems = await getAzitState(ctx, user.sessionId);
                    const herbQtyBefore = stItems.items?.find((i) => i.itemId === 'item-revival-herb')?.qty ?? 0;
                    assert.ok(herbQtyBefore >= 2, `Expected >=2 item-revival-herb from Craft + Shop, got ${herbQtyBefore}`);
                    assert.equal(
                        stItems.veraPoints,
                        stBeforeAcquire.veraPoints - herbCraftCost - herbShopPrice,
                        'Expected veraPoints to deduct exact craft + shop costs'
                    );

                    // Switch back to Roster tab & revive via UI
                    assert.ok(
                        await clickModalButtonByText(page, '용병 · 스킬 · 부활', '용병 길드'),
                        'Expected "용병 · 스킬 · 부활" tab button'
                    );
                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                const txt = m.textContent ?? '';
                                return txt.includes('용병 길드') && txt.includes('생명의 약초로 부활');
                            }),
                        { timeout: 10_000 }
                    );
                    const revived = await clickModalButtonByText(page, '생명의 약초로 부활', '용병 길드');
                    assert.ok(revived, 'Expected "생명의 약초로 부활" action button for dead mercenary in UI');

                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                const txt = m.textContent ?? '';
                                return txt.includes('용병 길드') && txt.includes('대기 중') && !txt.includes('전투불능');
                            }),
                        { timeout: 10_000 }
                    );

                    const stRevived = await getAzitState(ctx, user.sessionId);
                    const leoRevived = stRevived.mercenaries.find((m) => m.mercCode === 'merc-leo');
                    assert.equal(leoRevived?.status, 'idle');
                    assert.equal(leoRevived?.diedAt ?? null, null, 'Expected diedAt cleared to null after revival');
                    assert.equal(leoRevived?.deathZoneId ?? null, null, 'Expected deathZoneId cleared to null after revival');
                    assert.equal(
                        stRevived.items?.find((i) => i.itemId === 'item-revival-herb')?.qty ?? 0,
                        herbQtyBefore - 1,
                        'UI revival must consume exactly 1 item-revival-herb'
                    );

                    const redeployRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                        zoneId: 'zone-forest',
                        partyMercCodes: ['merc-leo'],
                        dishRecipeId: 'dish-tomato-stew',
                    });
                    assert.equal(redeployRes.status, 200, `Redeploy to zone-forest failed: ${redeployRes.rawText}`);

                    const stRedeploy = await getAzitState(ctx, user.sessionId);
                    assert.equal(stRedeploy.activeExpeditions.length, 1);
                    assert.equal(stRedeploy.activeExpeditions[0]?.zoneId, 'zone-forest');
                    assert.equal(
                        stRedeploy.activeExpeditions[0]?.durationSec,
                        10368,
                        'Expected 3h (10800s) zone-forest duration adjusted by dish-tomato-stew (-4% = 10368s)'
                    );
                    reconcilePointLedger(ctx.dbPath, user.userId, startPoints, stRedeploy.veraPoints, 'T4-02');
                }
            );
        },
    },
    {
        id: 'T4-03',
        tier: 4,
        area: 'Scenario-CombatLeveling-Skills',
        description: 'Verify no gold-level-up UI & 403 -> earn combat EXP Lv1->Lv2 -> upgrade Main/Sub skills -> Tower run',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't4-03', points: 30_000, azitLevel: 7 });
            const hire1 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/hire', user.sessionId, {
                mercCode: 'merc-leo',
            });
            const hire2 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/hire', user.sessionId, {
                mercCode: 'merc-rina',
            });
            assert.equal(hire1.status, 200, `Hire merc-leo failed: ${hire1.rawText}`);
            assert.equal(hire2.status, 200, `Hire merc-rina failed: ${hire2.rawText}`);
            seedItem(ctx.dbPath, user.userId, 'item-skill-tome', 1);
            seedItem(ctx.dbPath, user.userId, 'item-skill-stone', 1);
            seedDish(ctx.dbPath, user.userId, 'dish-carrot-soup', 1);

            // Verify 403 GOLD_UPGRADE_DISABLED & upgradeCost: null
            const upBlock = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/upgrade', user.sessionId, {
                mercCode: 'merc-leo',
            });
            assert.equal(upBlock.status, 403);
            assert.equal(extractErrorCode(upBlock), 'GOLD_UPGRADE_DISABLED');

            // Earn combat EXP from BOTH expedition & 1F/2F Tower clears
            const expStart = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo', 'merc-rina'],
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.equal(expStart.status, 200, `Expedition start failed: ${expStart.rawText}`);
            const stExpRun = await getAzitState(ctx, user.sessionId);
            backdateExpedition(ctx.dbPath, stExpRun.activeExpeditions[0].id, Date.now() - 2000);
            const expClaim = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, {
                expeditionId: stExpRun.activeExpeditions[0].id,
            });
            assert.equal(expClaim.status, 200, `Expedition claim failed: ${expClaim.rawText}`);
            const expReport = asRecord(asRecord(expClaim.json.data).report, 'expClaim.report');
            assert.ok(asNumber(expReport.rewardMercXp, 'rewardMercXp') > 0, 'Expected expedition combat EXP > 0');

            const t1Res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(t1Res.status, 200, `Tower 1F failed: ${t1Res.rawText}`);
            assert.equal(asRecord(t1Res.json.data, 't1').won, true, 'Expected Tower 1F victory');

            const t2Res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 2,
                partyMercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(t2Res.status, 200, `Tower 2F failed: ${t2Res.rawText}`);
            assert.equal(asRecord(t2Res.json.data, 't2').won, true, 'Expected Tower 2F victory');

            const stAfterExp = await getAzitState(ctx, user.sessionId);
            const leoExp = stAfterExp.mercenaries.find((m) => m.mercCode === 'merc-leo');
            assert.ok((leoExp?.level ?? 1) >= 2, 'Expected combat EXP level-up to Lv2+');
            assert.equal(leoExp?.upgradeCost ?? null, null, 'Expected upgradeCost === null');
            const tomesBeforeUpgrade = stAfterExp.items?.find((i) => i.itemId === 'item-skill-tome')?.qty ?? 0;
            const stonesBeforeUpgrade = stAfterExp.items?.find((i) => i.itemId === 'item-skill-stone')?.qty ?? 0;
            assert.ok(tomesBeforeUpgrade >= 1 && stonesBeforeUpgrade >= 1, 'Expected >=1 tome & stone before UI upgrade');

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
                                return txt.includes('용병 길드') && txt.includes('레오') && txt.includes('Lv.2');
                            }),
                        { timeout: 10_000 }
                    );

                    const hasGoldTrainBtn = await page.evaluate(() => {
                        const modals = Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0'));
                        const modal = modals.find((m) => (m.textContent ?? '').includes('용병 길드')) ?? modals[modals.length - 1];
                        if (!modal) return true;
                        return Array.from(modal.querySelectorAll('button')).some((b) => {
                            const txt = b.textContent ?? '';
                            return txt.includes('훈련 강화') || (txt.includes('레벨업') && /\d[\d,]*\s*P/.test(txt));
                        });
                    });
                    assert.equal(hasGoldTrainBtn, false, 'Gold level-up button must not exist in UI');

                    // Upgrade Main Skill & Sub Skill via Mercenary UI buttons
                    const upgradedMain = await clickModalButtonByText(page, '교본으로 강화', '용병 길드');
                    assert.ok(upgradedMain, 'Expected "교본으로 강화" Main Skill upgrade button in Mercenary UI');
                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                const txt = m.textContent ?? '';
                                return (
                                    txt.includes('용병 길드') &&
                                    txt.includes('Lv.2/10') &&
                                    Array.from(m.querySelectorAll('button')).some(
                                        (b) => (b.textContent ?? '').includes('연마석으로 강화') && !b.disabled
                                    )
                                );
                            }),
                        { timeout: 10_000 }
                    );

                    const upgradedSub = await clickModalButtonByText(page, '연마석으로 강화', '용병 길드');
                    assert.ok(upgradedSub, 'Expected "연마석으로 강화" Sub Skill upgrade button in Mercenary UI');
                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                const txt = m.textContent ?? '';
                                const matches = txt.match(/Lv\.2\/10/g) ?? [];
                                return txt.includes('용병 길드') && matches.length >= 2;
                            }),
                        { timeout: 10_000 }
                    );

                    const stSkills = await getAzitState(ctx, user.sessionId);
                    const leo = stSkills.mercenaries.find((m) => m.mercCode === 'merc-leo');
                    assert.equal(leo?.mainSkill?.level, 2, 'Expected Main Skill level 2 after UI upgrade');
                    assert.equal(leo?.subSkill?.level, 2, 'Expected Sub Skill level 2 after UI upgrade');
                    assert.equal(leo?.upgradeCost ?? null, null);
                    assert.equal(
                        stSkills.items?.find((i) => i.itemId === 'item-skill-tome')?.qty ?? 0,
                        tomesBeforeUpgrade - 1,
                        'Expected item-skill-tome decremented by 1'
                    );
                    assert.equal(
                        stSkills.items?.find((i) => i.itemId === 'item-skill-stone')?.qty ?? 0,
                        stonesBeforeUpgrade - 1,
                        'Expected item-skill-stone decremented by 1'
                    );

                    // Observe upgraded Main & Sub skill activations in Tower 3F combat
                    const towerRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                        floor: 3,
                        partyMercCodes: ['merc-leo', 'merc-rina'],
                    });
                    assert.equal(towerRes.status, 200, `Tower 3F with upgraded skills failed: ${towerRes.rawText}`);
                    const towerData = asRecord(towerRes.json.data, 'tower 3F data');
                    assert.equal(towerData.won, true);
                    const frames = asArray(towerData.frames, 'tower 3F frames');
                    assert.ok(frames.length >= 2);
                    const hasMainSkillAction = frames.some((f) =>
                        asArray(asRecord(f).units).some((u) => asRecord(u).action === 'skill_main')
                    );
                    const hasSubSkillAction = frames.some((f) =>
                        asArray(asRecord(f).units).some((u) => asRecord(u).action === 'skill_sub')
                    );
                    assert.ok(hasMainSkillAction, 'Expected autonomous skill_main activation in Tower 3F frames');
                    assert.ok(hasSubSkillAction, 'Expected autonomous skill_sub activation in Tower 3F frames');
                    const battleLog = asArray(towerData.battleLog, 'tower 3F battleLog');
                    assert.ok(battleLog.length > 0, 'Expected non-empty Tower 3F battleLog');
                }
            );
        },
    },
    {
        id: 'T4-04',
        tier: 4,
        area: 'Scenario-VeraTower-Fullscreen-Retry',
        description: 'Vera Tower Lobby 1-200F -> z-[70] fullscreen autonomous combat -> defeat penalty-free retry -> boss clear',
        requiresBrowser: true,
        run: async (ctx) => {
            const startPoints = 20_000;
            const user = await seedUser(ctx, { label: 't4-04', points: startPoints, azitLevel: 7 });
            const h1 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/hire', user.sessionId, {
                mercCode: 'merc-leo',
            });
            const h2 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/hire', user.sessionId, {
                mercCode: 'merc-rina',
            });
            assert.equal(h1.status, 200, `Hire merc-leo failed: ${h1.rawText}`);
            assert.equal(h2.status, 200, `Hire merc-rina failed: ${h2.rawText}`);
            const pointsBefore1F = (await getAzitState(ctx, user.sessionId)).veraPoints;

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    // 1. Open Tower Lobby & browse all 5 1-200F themes + boss filter
                    await waitForText(page, '베라의 탑', 20_000);
                    const openedTower = await clickButtonByText(page, '베라의 탑');
                    assert.ok(openedTower, 'Expected "베라의 탑" button to open Tower Lobby');
                    await page.waitForSelector('[data-tower-lobby="true"] [data-tower-floor="1"]', { timeout: 15_000 });

                    for (const tabLabel of ['41~80', '81~120', '121~160', '161~200']) {
                        assert.ok(
                            await clickButtonByText(page, tabLabel, '[data-tower-lobby="true"]'),
                            `Expected theme tab "${tabLabel}" in Tower Lobby`
                        );
                    }
                    await page.waitForSelector('[data-tower-lobby="true"] [data-tower-floor="200"]', { timeout: 5_000 });

                    assert.ok(
                        await clickButtonByText(page, '보스층만', '[data-tower-lobby="true"]'),
                        'Expected "보스층만" filter button in Tower Lobby'
                    );
                    await page.waitForFunction(
                        () =>
                            Boolean(document.querySelector('[data-tower-lobby="true"] [data-tower-floor="200"]')) &&
                            !document.querySelector('[data-tower-lobby="true"] [data-tower-floor="199"]'),
                        { timeout: 5_000 }
                    );
                    assert.ok(await clickButtonByText(page, '보스층만', '[data-tower-lobby="true"]'));
                    assert.ok(await clickButtonByText(page, '1~40', '[data-tower-lobby="true"]'));
                    await page.waitForSelector('[data-tower-lobby="true"] [data-tower-floor="1"]', { timeout: 5_000 });

                    // 2. Enter 1F z-[70] fullscreen battle, verify desktop + mobile z-index, and claim 1F
                    const started1F = await page.evaluate(() => {
                        const btn = document.querySelector('[data-tower-lobby="true"] [data-testid="azit-tower-start-battle"]');
                        if (!(btn instanceof HTMLButtonElement) || btn.disabled) return false;
                        btn.click();
                        return true;
                    });
                    assert.ok(started1F, 'Expected enabled Tower 1F start button inside Tower Lobby');
                    await page.waitForSelector('[data-tower-fullscreen="true"]', { timeout: 15_000 });

                    await assertZIndexAboveNav(page, '[data-tower-fullscreen="true"]');
                    await page.setViewport({ width: 375, height: 812 });
                    await assertZIndexAboveNav(page, '[data-tower-fullscreen="true"]');
                    await page.setViewport({ width: 1280, height: 800 });

                    await assertCanvasAnimating(page, '[data-tower-fullscreen="true"] canvas', 500);

                    assert.ok(
                        await clickButtonByText(page, '2x', '[data-tower-fullscreen="true"]'),
                        'Expected 2x speed toggle inside Tower fullscreen overlay'
                    );
                    await page.waitForSelector('[data-tower-fullscreen="true"] [data-tower-result="won"]', {
                        timeout: 25_000,
                    });
                    const closed1F = await clickButtonByText(page, '탑 로비로', '[data-tower-fullscreen="true"]');
                    assert.ok(closed1F, 'Expected "탑 로비로" button to close 1F Tower victory overlay');
                    await page.waitForFunction(
                        () => !document.querySelector('[data-tower-fullscreen="true"]'),
                        { timeout: 10_000 }
                    );

                    const st1F = await getAzitState(ctx, user.sessionId);
                    assert.equal(st1F.tower?.highestClearedFloor, 1, 'Expected 1F clear persisted');
                    assert.ok(st1F.veraPoints > pointsBefore1F, 'Expected 1F first-clear gold reward');

                    // 3. Challenge tough unlocked floor (30F boss) with Lv1 duo -> defeat -> penalty-free Retry
                    setTowerHighestFloor(ctx.dbPath, user.userId, 29);
                    seedItem(ctx.dbPath, user.userId, 'item-revival-herb', 1);
                    await page.reload({ waitUntil: 'networkidle2' });
                    await waitForText(page, '베라의 탑', 20_000);
                    assert.ok(await clickButtonByText(page, '베라의 탑'));
                    await page.waitForSelector('[data-tower-lobby="true"] [data-tower-floor="30"]', { timeout: 10_000 });
                    await page.click('[data-tower-lobby="true"] [data-tower-floor="30"]');
                    const started30FLose = await page.evaluate(() => {
                        const btn = document.querySelector('[data-tower-lobby="true"] [data-testid="azit-tower-start-battle"]');
                        if (!(btn instanceof HTMLButtonElement) || btn.disabled) return false;
                        btn.click();
                        return true;
                    });
                    assert.ok(started30FLose, 'Expected 30F battle start button for defeat test');
                    await page.waitForSelector('[data-tower-fullscreen="true"]', { timeout: 15_000 });
                    await clickButtonByText(page, '2x', '[data-tower-fullscreen="true"]');
                    await page.waitForSelector('[data-tower-fullscreen="true"] [data-tower-result="lost"]', {
                        timeout: 25_000,
                    });

                    const stBeforeRetry = await getAzitState(ctx, user.sessionId);
                    const attemptsBeforeRetry = stBeforeRetry.tower?.totalAttempts ?? 0;

                    const retried = await page.evaluate(() => {
                        const btn = document.querySelector('[data-tower-fullscreen="true"] [data-testid="azit-tower-retry-btn"]');
                        if (!(btn instanceof HTMLButtonElement) || btn.disabled) return false;
                        btn.click();
                        return true;
                    });
                    assert.ok(retried, 'Expected penalty-free retry button on 30F defeat');

                    // Wait for the retry battle API call to complete and start/finish new playback before querying state/reloading
                    await page.waitForFunction(
                        () => !document.querySelector('[data-tower-fullscreen="true"] [data-tower-result="lost"]'),
                        { timeout: 15_000 }
                    );
                    await page.waitForSelector('[data-tower-fullscreen="true"] [data-tower-result]', {
                        timeout: 25_000,
                    });

                    const stRetry = await getAzitState(ctx, user.sessionId);
                    assert.ok(
                        (stRetry.tower?.totalAttempts ?? 0) >= attemptsBeforeRetry + 1,
                        `Expected totalAttempts to increment after retry (${attemptsBeforeRetry} -> ${stRetry.tower?.totalAttempts})`
                    );
                    assert.equal(
                        stRetry.mercenaries.every((m) => m.status === 'idle'),
                        true,
                        'Tower defeat retry must leave all mercenaries idle (0 death penalty)'
                    );
                    assert.equal(
                        stRetry.items?.find((i) => i.itemId === 'item-revival-herb')?.qty,
                        1,
                        'Tower defeat retry must consume 0 revival items'
                    );

                    // 4. Reinforce party & clear 30F Boss -> reload persistence + DB verification
                    const hireAria = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/hire', user.sessionId, {
                        mercCode: 'merc-aria',
                    });
                    assert.equal(hireAria.status, 200, `Hire merc-aria failed: ${hireAria.rawText}`);
                    const pointsBefore30FWin = (await getAzitState(ctx, user.sessionId)).veraPoints;
                    setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-leo', 10, 0);
                    setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-rina', 10, 0);
                    setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-aria', 10, 0);

                    await page.reload({ waitUntil: 'networkidle2' });
                    await waitForText(page, '베라의 탑', 20_000);
                    assert.ok(await clickButtonByText(page, '베라의 탑'));
                    await page.waitForSelector('[data-tower-lobby="true"] [data-tower-floor="30"]', { timeout: 10_000 });
                    await page.click('[data-tower-lobby="true"] [data-tower-floor="30"]');
                    const started30FWin = await page.evaluate(() => {
                        const btn = document.querySelector('[data-tower-lobby="true"] [data-testid="azit-tower-start-battle"]');
                        if (!(btn instanceof HTMLButtonElement) || btn.disabled) return false;
                        btn.click();
                        return true;
                    });
                    assert.ok(started30FWin, 'Expected 30F battle start button for boss clear');
                    await page.waitForSelector('[data-tower-fullscreen="true"]', { timeout: 15_000 });
                    await clickButtonByText(page, '2x', '[data-tower-fullscreen="true"]');
                    await page.waitForSelector('[data-tower-fullscreen="true"] [data-tower-result="won"]', {
                        timeout: 25_000,
                    });

                    const bossResultText = await page.evaluate(
                        () => document.querySelector('[data-tower-fullscreen="true"] [data-tower-result="won"]')?.textContent ?? ''
                    );
                    assert.ok(
                        bossResultText.includes('30층 공략 성공') && bossResultText.includes('아지트 골드'),
                        `Expected 30F boss reward summary, got: ${bossResultText.slice(0, 200)}`
                    );

                    const closed30F = await clickButtonByText(page, '탑 로비로', '[data-tower-fullscreen="true"]');
                    assert.ok(closed30F, 'Expected "탑 로비로" button to close 30F boss victory overlay');
                    await page.waitForFunction(
                        () => !document.querySelector('[data-tower-fullscreen="true"]'),
                        { timeout: 10_000 }
                    );

                    await page.reload({ waitUntil: 'networkidle2' });
                    const stFinal = await getAzitState(ctx, user.sessionId);
                    assert.equal(stFinal.tower?.highestClearedFloor, 30, 'Expected 30F boss clear === 30 after reload');
                    assert.ok(stFinal.veraPoints > pointsBefore30FWin, 'Expected 30F boss gold reward credited');

                    const towerRuns = queryDb(ctx.dbPath, (db) =>
                        db
                            .prepare(`SELECT floor, won, is_first_clear, reward_points FROM azit_tower_runs WHERE user_id = ? ORDER BY id ASC`)
                            .all(user.userId)
                    );
                    assert.ok(
                        towerRuns.some((r) => isRecord(r) && r.floor === 1 && r.won === 1 && r.is_first_clear === 1),
                        'Expected persisted 1F win row in azit_tower_runs'
                    );
                    assert.ok(
                        towerRuns.some((r) => isRecord(r) && r.floor === 30 && r.won === 0),
                        'Expected persisted 30F defeat row in azit_tower_runs'
                    );
                    assert.ok(
                        towerRuns.some((r) => isRecord(r) && r.floor === 30 && r.won === 1 && r.is_first_clear === 1 && asNumber(r.reward_points) > 0),
                        'Expected persisted 30F boss clear row in azit_tower_runs'
                    );
                    reconcilePointLedger(ctx.dbPath, user.userId, startPoints, stFinal.veraPoints, 'T4-04');
                }
            );
        },
    },
    {
        id: 'T4-05',
        tier: 4,
        area: 'Scenario-Concurrent-Mobile-Minihome',
        description: 'Simultaneous 8h dragon expedition + Tower clear + /minihome/me 375x812 mobile parity check',
        requiresBrowser: true,
        run: async (ctx) => {
            const user = await seedUser(ctx, { label: 't4-05', points: 30_000, azitLevel: 10 });
            const h1 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/hire', user.sessionId, {
                mercCode: 'merc-leo',
            });
            const h2 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/hire', user.sessionId, {
                mercCode: 'merc-rina',
            });
            assert.equal(h1.status, 200, `Hire merc-leo failed: ${h1.rawText}`);
            assert.equal(h2.status, 200, `Hire merc-rina failed: ${h2.rawText}`);
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-leo', 10, 0);
            setMercLevelAndXp(ctx.dbPath, user.userId, 'merc-rina', 10, 0);
            seedDish(ctx.dbPath, user.userId, 'dish-dragon-elixir', 1);

            const gARes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/save', user.sessionId, {
                name: '드래곤원정대',
                mercCodes: ['merc-leo'],
            });
            const gBRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/groups/save', user.sessionId, {
                name: '탑공략대',
                mercCodes: ['merc-rina'],
            });
            assert.equal(gARes.status, 200, `Group A save failed: ${gARes.rawText}`);
            assert.equal(gBRes.status, 200, `Group B save failed: ${gBRes.rawText}`);

            const stGroups = await getAzitState(ctx, user.sessionId);
            const groupA = stGroups.groups?.find((g) => g.name === '드래곤원정대');
            const groupB = stGroups.groups?.find((g) => g.name === '탑공략대');
            assert.ok(groupA && groupB, 'Expected both Group A and Group B');

            const expRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-dragon',
                groupId: groupA.id,
                dishRecipeId: 'dish-dragon-elixir',
            });
            assert.equal(expRes.status, 200, `Dragon expedition start failed: ${expRes.rawText}`);

            const stExp = await getAzitState(ctx, user.sessionId);
            assert.equal(stExp.activeExpeditions.length, 1);
            assert.equal(
                stExp.activeExpeditions[0]?.durationSec,
                24192,
                'Expected 8h (28800s) zone-dragon duration adjusted by dish-dragon-elixir (-16% = 24192s)'
            );
            assert.equal(stExp.activeExpeditions[0]?.groupId, groupA.id);

            const towerRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                groupId: groupB.id,
            });
            assert.equal(towerRes.status, 200, `Tower 1F with Group B failed: ${towerRes.rawText}`);
            assert.equal(asRecord(towerRes.json.data, 'towerRes.data').won, true, 'Expected Group B Tower 1F victory');

            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 375, height: 812 },
                '/minihome/me',
                async (page) => {
                    await waitForText(page, '용병 캠프', 20_000);
                    const clickedCamp = await clickButtonByText(page, '용병 캠프');
                    assert.ok(clickedCamp, 'Expected "용병 캠프" tab on /minihome/me');
                    await waitForText(page, '용병 토벌 캠프', 15_000);
                    await page.waitForSelector('canvas[data-testid="azit-battlefield-canvas"]', { timeout: 15_000 });

                    await assertNoHorizontalOverflow(page, '/minihome/me Camp 375x812');
                    const canvasSel = await findCampBattlefieldCanvasSelector(page, 150, 80);
                    assert.ok(canvasSel !== null, 'Expected active 8h expedition battlefield canvas on /minihome/me');
                    await assertCanvasAnimating(page, canvasSel, 500);

                    const bfText = await getCampBattlefieldContainerText(page, canvasSel);
                    assert.ok(
                        bfText.includes('적염 고대 용의 심연') && /\d{1,2}:\d{2}:\d{2}/.test(bfText),
                        `Expected dragon zone & live countdown in battlefield container, got: ${bfText.slice(0, 200)}`
                    );

                    const pageText = await page.evaluate(() => document.body.innerText);
                    assert.ok(pageText.includes('1/200F'), 'Expected synchronized "1/200F" Tower badge on /minihome/me');
                }
            );
        },
    },
    {
        id: 'T4-06',
        tier: 4,
        area: 'Scenario-FullEconomy-LedgerAudit',
        description: 'Full economy cycle: Garden -> Kitchen & Craft -> Camp Expedition -> Tower -> Ledger & DB audit',
        requiresBrowser: true,
        run: async (ctx) => {
            const startPoints = 15_000;
            const user = await seedUser(ctx, { label: 't4-06', points: startPoints, azitLevel: 7 });
            const h1 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/hire', user.sessionId, {
                mercCode: 'merc-leo',
            });
            const h2 = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/mercenaries/hire', user.sessionId, {
                mercCode: 'merc-rina',
            });
            assert.equal(h1.status, 200, `Hire merc-leo failed: ${h1.rawText}`);
            assert.equal(h2.status, 200, `Hire merc-rina failed: ${h2.rawText}`);

            // 1. Garden: find empty unlocked plot (plotIndex 4), buy carrot seed, plant, water x2, harvest carrots
            const emptyPlotRow = queryDb(ctx.dbPath, (db) =>
                db
                    .prepare(
                        `SELECT plot_index FROM azit_garden_plots
                         WHERE user_id = ? AND is_unlocked = 1 AND is_deleted = 0 AND (crop_id IS NULL OR stage = 0)
                         ORDER BY plot_index ASC LIMIT 1`
                    )
                    .get(user.userId)
            );
            assert.ok(isRecord(emptyPlotRow), 'Expected an empty unlocked garden plot');
            const emptyPlotIndex = asNumber(emptyPlotRow.plot_index, 'emptyPlotIndex');

            const buySeedRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/garden/buy-seed', user.sessionId, {
                cropId: 'crop-carrot',
                quantity: 2,
            });
            assert.equal(buySeedRes.status, 200, `garden/buy-seed failed: ${buySeedRes.rawText}`);

            const plantRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/garden/plant', user.sessionId, {
                plotIndex: emptyPlotIndex,
                cropId: 'crop-carrot',
            });
            assert.equal(plantRes.status, 200, `garden/plant failed: ${plantRes.rawText}`);

            // Wait cooldowns only (never overwrite crop stage!) and execute real garden/water x2
            for (let w = 0; w < 2; w += 1) {
                withDb(ctx.dbPath, (db) => {
                    db.prepare(`UPDATE azit_garden_plots SET next_water_at_ms = ? WHERE user_id = ? AND plot_index = ?`).run(
                        Date.now() - 1000,
                        user.userId,
                        emptyPlotIndex
                    );
                });
                const waterRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/garden/water', user.sessionId, {
                    plotIndex: emptyPlotIndex,
                });
                assert.equal(waterRes.status, 200, `garden/water #${w + 1} failed: ${waterRes.rawText}`);
            }

            const harvestCarrotRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/garden/harvest', user.sessionId, {
                plotIndex: emptyPlotIndex,
            });
            assert.equal(harvestCarrotRes.status, 200, `garden/harvest carrot failed: ${harvestCarrotRes.rawText}`);

            // Also water & harvest starter lettuce plot (plotIndex 3, stage 2) for real crafting ingredient
            const waterLettuceRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/garden/water', user.sessionId, {
                plotIndex: 3,
            });
            assert.equal(waterLettuceRes.status, 200, `garden/water lettuce failed: ${waterLettuceRes.rawText}`);
            const harvestLettuceRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/garden/harvest', user.sessionId, {
                plotIndex: 3,
            });
            assert.equal(harvestLettuceRes.status, 200, `garden/harvest lettuce failed: ${harvestLettuceRes.rawText}`);

            const stAfterHarvest = await getAzitState(ctx, user.sessionId);
            assert.ok(
                (stAfterHarvest.garden.harvestCounts['crop-carrot'] ?? 0) >= 2,
                'Expected >= 2 harvested carrots from real garden loop'
            );
            assert.ok(
                (stAfterHarvest.garden.harvestCounts['crop-lettuce'] ?? 0) >= 2,
                'Expected >= 2 harvested lettuce from real garden loop'
            );

            // 2. Kitchen: cook dish-carrot-soup using harvested carrots & claim
            const cookStartRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/kitchen/start', user.sessionId, {
                slotIndex: 0,
                recipeId: 'dish-carrot-soup',
            });
            assert.equal(cookStartRes.status, 200, `kitchen/start failed: ${cookStartRes.rawText}`);
            withDb(ctx.dbPath, (db) => {
                db.prepare(`UPDATE azit_kitchen_slots SET ends_at_ms = ? WHERE user_id = ? AND slot_index = 0`).run(
                    Date.now() - 2000,
                    user.userId
                );
            });
            const cookClaimRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/kitchen/claim', user.sessionId, {
                slotIndex: 0,
            });
            assert.equal(cookClaimRes.status, 200, `kitchen/claim failed: ${cookClaimRes.rawText}`);

            // 3. Shop buy + Expedition (produces mat-slime-jelly) + Craft (uses harvested lettuce + slime jelly)
            const shopBuyRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/shop/buy', user.sessionId, {
                itemId: 'item-revival-herb',
                qty: 1,
            });
            assert.equal(shopBuyRes.status, 200, `shop/buy failed: ${shopBuyRes.rawText}`);

            const expStartRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/start', user.sessionId, {
                zoneId: 'zone-slime',
                partyMercCodes: ['merc-leo', 'merc-rina'],
                dishRecipeId: 'dish-carrot-soup',
            });
            assert.equal(expStartRes.status, 200, `expeditions/start failed: ${expStartRes.rawText}`);
            const stMid = await getAzitState(ctx, user.sessionId);
            backdateExpedition(ctx.dbPath, stMid.activeExpeditions[0].id, Date.now() - 2000);
            const expClaimRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/expeditions/claim', user.sessionId, {
                expeditionId: stMid.activeExpeditions[0].id,
            });
            assert.equal(expClaimRes.status, 200, `expeditions/claim failed: ${expClaimRes.rawText}`);
            const expReport = asRecord(asRecord(expClaimRes.json.data).report, 'expClaim.report');
            assert.equal(expReport.won, true, 'Expected zone-slime expedition victory');

            const stAfterExp = await getAzitState(ctx, user.sessionId);
            const slimeJellyQty = stAfterExp.materials['mat-slime-jelly'] ?? 0;
            assert.ok(slimeJellyQty >= 2, `Expected >=2 mat-slime-jelly dropped from zone-slime, got ${slimeJellyQty}`);

            const craftRes = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/craft', user.sessionId, {
                recipeId: 'craft-revival-herb',
                qty: 1,
            });
            assert.equal(craftRes.status, 200, `craft failed: ${craftRes.rawText}`);

            const stAfterCraft = await getAzitState(ctx, user.sessionId);
            assert.equal(
                stAfterCraft.items?.find((i) => i.itemId === 'item-revival-herb')?.qty ?? 0,
                (stAfterExp.items?.find((i) => i.itemId === 'item-revival-herb')?.qty ?? 1) + 1,
                'Expected item-revival-herb incremented by craft'
            );
            assert.equal(
                stAfterCraft.materials['mat-slime-jelly'] ?? 0,
                slimeJellyQty - 2,
                'Expected craft to deduct 2 mat-slime-jelly'
            );
            assert.equal(
                stAfterCraft.garden.harvestCounts['crop-lettuce'] ?? 0,
                (stAfterHarvest.garden.harvestCounts['crop-lettuce'] ?? 0) - 2,
                'Expected craft to deduct 2 crop-lettuce'
            );

            // 4. Tower 1F First-Clear & Repeat-Clear
            const tower1Res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(tower1Res.status, 200, `tower 1F #1 failed: ${tower1Res.rawText}`);
            const tower1Data = asRecord(tower1Res.json.data, 'tower1Data');
            assert.equal(tower1Data.won, true);
            assert.equal(tower1Data.isFirstClear, true, 'Expected first Tower 1F clear to be isFirstClear === true');

            const tower2Res = await jsonPost(ctx.apiBaseUrl, '/api/azit-game/tower/battle', user.sessionId, {
                floor: 1,
                partyMercCodes: ['merc-leo', 'merc-rina'],
            });
            assert.equal(tower2Res.status, 200, `tower 1F #2 failed: ${tower2Res.rawText}`);
            const tower2Data = asRecord(tower2Res.json.data, 'tower2Data');
            assert.equal(tower2Data.won, true);
            assert.equal(tower2Data.isFirstClear, false, 'Expected second Tower 1F clear to be isFirstClear === false');

            const stFinal = await getAzitState(ctx, user.sessionId);
            assert.equal(stFinal.tower?.highestClearedFloor, 1);
            assert.equal(stFinal.tower?.totalClears, 2, 'Expected tower.totalClears === 2');
            assert.ok(stFinal.veraPoints > stAfterCraft.veraPoints, 'Expected Tower 1F clears to award gold');

            // 5. Audit in Browser (points parity + Market Ledger tab) & DB Ledger + Inventory tables
            const { nextBaseUrl, browser } = await ctx.ensureNextAndBrowser();
            await openAuthedPage(
                browser,
                nextBaseUrl,
                user.sessionId,
                { width: 1280, height: 800 },
                '/mypage?section=dashboard&zone=camp',
                async (page) => {
                    await waitForText(page, '용병 토벌 캠프', 20_000);
                    const text = await page.evaluate(() => document.body.innerText);
                    assert.ok(!text.includes('NaN') && !text.includes('undefined'));
                    assert.ok(
                        text.includes(stFinal.veraPoints.toLocaleString()),
                        `Expected UI to display synced points ${stFinal.veraPoints.toLocaleString()}`
                    );

                    assert.ok(await clickButtonByText(page, '장터'), 'Expected Market "장터" button');
                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) =>
                                (m.textContent ?? '').includes('아지트 작물·요리 장터')
                            ),
                        { timeout: 10_000 }
                    );
                    assert.ok(
                        await clickModalButtonByText(page, '포인트 거래 내역', '장터'),
                        'Expected "포인트 거래 내역" tab in Market modal'
                    );
                    await page.waitForFunction(
                        () =>
                            Array.from(document.querySelectorAll('[role="dialog"], .fixed.inset-0')).some((m) => {
                                const txt = m.textContent ?? '';
                                return txt.includes('장터') && txt.includes('베라의 탑 1층');
                            }),
                        { timeout: 10_000 }
                    );
                    const marketText = await getOpenModalText(page, '장터');
                    assert.ok(!marketText.includes('NaN') && !marketText.includes('undefined'));
                }
            );

            reconcilePointLedger(ctx.dbPath, user.userId, startPoints, stFinal.veraPoints, 'T4-06');

            const ledgerTxRows = queryDb(ctx.dbPath, (db) =>
                db
                    .prepare(`SELECT DISTINCT tx_type FROM azit_point_ledger WHERE user_id = ?`)
                    .all(user.userId)
            );
            const txTypes = new Set(ledgerTxRows.map((r) => (isRecord(r) ? String(r.tx_type ?? '') : '')));
            for (const expectedTx of [
                'merc_hire',
                'item_buy',
                'item_craft',
                'expedition_entry',
                'expedition_reward',
                'tower_first_clear',
                'tower_repeat_clear',
            ]) {
                assert.ok(txTypes.has(expectedTx), `Expected "${expectedTx}" in azit_point_ledger`);
            }

            const dbItemRow = queryDb(ctx.dbPath, (db) =>
                db
                    .prepare(`SELECT qty FROM azit_item_inventory WHERE user_id = ? AND item_id = 'item-revival-herb' AND is_deleted = 0`)
                    .get(user.userId)
            );
            assert.ok(isRecord(dbItemRow) && asNumber(dbItemRow.qty) >= 2, 'Expected persisted revival herbs in azit_item_inventory');

            const dbDishRow = queryDb(ctx.dbPath, (db) =>
                db
                    .prepare(`SELECT qty FROM azit_dish_inventory WHERE user_id = ? AND recipe_id = 'dish-carrot-soup' AND is_deleted = 0`)
                    .get(user.userId)
            );
            assert.ok(isRecord(dbDishRow) && asNumber(dbDishRow.qty) === 0, 'Expected dish-carrot-soup consumed (0 left)');
        },
    },
];

if (isMainModule(import.meta.url)) {
    runStandaloneTier('Tier 4 Scenarios', tier4Cases).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
