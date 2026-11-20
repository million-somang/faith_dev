import type { Context } from 'hono';
import type { SessionUser } from '../middleware/auth.js';
import { AzitGameError, AzitGameService } from '../services/azit-game.service.js';

function getAuthUserId(c: Context): number | null {
    const user = c.get('user') as SessionUser | undefined;
    if (!user || typeof user.id !== 'number') return null;
    return user.id;
}

async function readJsonBody<T extends Record<string, unknown>>(c: Context): Promise<T> {
    try {
        const parsed: unknown = await c.req.json();
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as T;
        }
        return {} as T;
    } catch (_) {
        return {} as T;
    }
}

function handleControllerError(c: Context, err: unknown, fallbackMsg: string) {
    if (err instanceof AzitGameError) {
        return c.json(
            {
                success: false,
                error: {
                    code: err.statusCode,
                    message: err.message,
                },
            },
            err.statusCode as 400 | 404 | 409
        );
    }
    const message = err instanceof Error ? err.message : fallbackMsg;
    console.error('[AzitGameController] Unexpected error:', err);
    return c.json(
        {
            success: false,
            error: {
                code: 500,
                message,
            },
        },
        500
    );
}

export class AzitGameController {
    static async getState(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const state = await AzitGameService.getState(userId);
            return c.json({ success: true, data: state });
        } catch (err) {
            return handleControllerError(c, err, '아지트 게임 상태를 불러오지 못했습니다.');
        }
    }

    static async buySeed(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ cropId?: unknown; quantity?: unknown }>(c);
            const cropId = typeof body.cropId === 'string' ? body.cropId.trim() : '';
            const quantity = typeof body.quantity === 'number' ? body.quantity : Number(body.quantity ?? 1);
            if (!cropId || !Number.isFinite(quantity)) {
                return c.json({ success: false, error: { code: 400, message: '씨앗 정보와 수량을 확인해 주세요.' } }, 400);
            }
            const result = await AzitGameService.buySeed(userId, cropId, quantity);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '씨앗 구매에 실패했습니다.');
        }
    }

    static async plantCrop(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ plotIndex?: unknown; cropId?: unknown }>(c);
            const plotIndex = typeof body.plotIndex === 'number' ? body.plotIndex : Number(body.plotIndex);
            const cropId = typeof body.cropId === 'string' ? body.cropId.trim() : '';
            if (!Number.isInteger(plotIndex) || !cropId) {
                return c.json({ success: false, error: { code: 400, message: '텃밭 번호와 작물 ID가 필요합니다.' } }, 400);
            }
            const result = await AzitGameService.plantCrop(userId, plotIndex, cropId);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '씨앗 심기에 실패했습니다.');
        }
    }

    static async waterPlot(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ plotIndex?: unknown }>(c);
            const plotIndex = typeof body.plotIndex === 'number' ? body.plotIndex : Number(body.plotIndex);
            if (!Number.isInteger(plotIndex)) {
                return c.json({ success: false, error: { code: 400, message: '올바른 텃밭 번호가 필요합니다.' } }, 400);
            }
            const result = await AzitGameService.waterPlot(userId, plotIndex);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '물주기에 실패했습니다.');
        }
    }

    static async harvestPlot(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ plotIndex?: unknown }>(c);
            const plotIndex = typeof body.plotIndex === 'number' ? body.plotIndex : Number(body.plotIndex);
            if (!Number.isInteger(plotIndex)) {
                return c.json({ success: false, error: { code: 400, message: '올바른 텃밭 번호가 필요합니다.' } }, 400);
            }
            const result = await AzitGameService.harvestPlot(userId, plotIndex);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '작물 수확에 실패했습니다.');
        }
    }

    static async clearPlot(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ plotIndex?: unknown }>(c);
            const plotIndex = typeof body.plotIndex === 'number' ? body.plotIndex : Number(body.plotIndex);
            if (!Number.isInteger(plotIndex)) {
                return c.json({ success: false, error: { code: 400, message: '올바른 텃밭 번호가 필요합니다.' } }, 400);
            }
            const result = await AzitGameService.clearPlot(userId, plotIndex);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '이랑 정리에 실패했습니다.');
        }
    }

    static async sellCrop(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ cropId?: unknown; quantity?: unknown }>(c);
            const cropId = typeof body.cropId === 'string' ? body.cropId.trim() : '';
            const quantity = typeof body.quantity === 'number' ? body.quantity : Number(body.quantity ?? 1);
            if (!cropId || !Number.isFinite(quantity)) {
                return c.json({ success: false, error: { code: 400, message: '판매할 작물과 수량을 확인해 주세요.' } }, 400);
            }
            const result = await AzitGameService.sellCrop(userId, cropId, quantity);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '작물 판매에 실패했습니다.');
        }
    }

    static async hireChef(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ chefCode?: unknown }>(c);
            const chefCode = typeof body.chefCode === 'string' ? body.chefCode.trim() : '';
            if (!chefCode) {
                return c.json({ success: false, error: { code: 400, message: '고용할 요리사를 선택해 주세요.' } }, 400);
            }
            const result = await AzitGameService.hireChef(userId, chefCode);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '요리사 고용에 실패했습니다.');
        }
    }

    static async upgradeChef(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ chefCode?: unknown }>(c);
            const chefCode = typeof body.chefCode === 'string' ? body.chefCode.trim() : '';
            if (!chefCode) {
                return c.json({ success: false, error: { code: 400, message: '강화할 요리사를 선택해 주세요.' } }, 400);
            }
            const result = await AzitGameService.upgradeChef(userId, chefCode);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '요리사 승급에 실패했습니다.');
        }
    }

    static async startCooking(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ slotIndex?: unknown; recipeId?: unknown; chefCode?: unknown }>(c);
            const slotIndex = typeof body.slotIndex === 'number' ? body.slotIndex : Number(body.slotIndex);
            const recipeId = typeof body.recipeId === 'string' ? body.recipeId.trim() : '';
            const chefCode = typeof body.chefCode === 'string' && body.chefCode.trim() ? body.chefCode.trim() : null;
            if (!Number.isInteger(slotIndex) || !recipeId) {
                return c.json({ success: false, error: { code: 400, message: '화구 번호와 레시피를 선택해 주세요.' } }, 400);
            }
            const result = await AzitGameService.startCooking(userId, slotIndex, recipeId, chefCode);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '요리 시작에 실패했습니다.');
        }
    }

    static async claimCooking(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ slotIndex?: unknown }>(c);
            const slotIndex = typeof body.slotIndex === 'number' ? body.slotIndex : Number(body.slotIndex);
            if (!Number.isInteger(slotIndex)) {
                return c.json({ success: false, error: { code: 400, message: '올바른 화구 번호가 필요합니다.' } }, 400);
            }
            const result = await AzitGameService.claimCooking(userId, slotIndex);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '요리 수령에 실패했습니다.');
        }
    }

    static async sellDish(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ recipeId?: unknown; quantity?: unknown }>(c);
            const recipeId = typeof body.recipeId === 'string' ? body.recipeId.trim() : '';
            const quantity = typeof body.quantity === 'number' ? body.quantity : Number(body.quantity ?? 1);
            if (!recipeId || !Number.isFinite(quantity)) {
                return c.json({ success: false, error: { code: 400, message: '판매할 요리와 수량을 확인해 주세요.' } }, 400);
            }
            const result = await AzitGameService.sellDish(userId, recipeId, quantity);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '요리 판매에 실패했습니다.');
        }
    }

    static async hireMercenary(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ mercCode?: unknown }>(c);
            const mercCode = typeof body.mercCode === 'string' ? body.mercCode.trim() : '';
            if (!mercCode) {
                return c.json({ success: false, error: { code: 400, message: '영입할 용병을 선택해 주세요.' } }, 400);
            }
            const result = await AzitGameService.hireMercenary(userId, mercCode);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '용병 영입에 실패했습니다.');
        }
    }

    static async upgradeMercenary(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ mercCode?: unknown }>(c);
            const mercCode = typeof body.mercCode === 'string' ? body.mercCode.trim() : '';
            if (!mercCode) {
                return c.json({ success: false, error: { code: 400, message: '훈련할 용병을 선택해 주세요.' } }, 400);
            }
            const result = await AzitGameService.upgradeMercenary(userId, mercCode);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '용병 훈련에 실패했습니다.');
        }
    }

    static async startExpedition(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{
                zoneId?: unknown;
                partyMercCodes?: unknown;
                dishRecipeId?: unknown;
            }>(c);
            const zoneId = typeof body.zoneId === 'string' ? body.zoneId.trim() : '';
            const dishRecipeId = typeof body.dishRecipeId === 'string' ? body.dishRecipeId.trim() : '';
            const partyMercCodes = Array.isArray(body.partyMercCodes)
                ? body.partyMercCodes.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
                : [];
            if (!zoneId || !dishRecipeId || partyMercCodes.length === 0) {
                return c.json(
                    {
                        success: false,
                        error: { code: 400, message: '원정 지역, 출전 용병, 보급 도시락을 모두 선택해 주세요.' },
                    },
                    400
                );
            }
            const result = await AzitGameService.startExpedition({
                userId,
                zoneId,
                partyMercCodes,
                dishRecipeId,
            });
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '원정 출정에 실패했습니다.');
        }
    }

    static async claimExpedition(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ expeditionId?: unknown }>(c);
            const expeditionId =
                typeof body.expeditionId === 'number' ? body.expeditionId : Number(body.expeditionId);
            if (!Number.isInteger(expeditionId) || expeditionId <= 0) {
                return c.json({ success: false, error: { code: 400, message: '올바른 원정 ID가 아닙니다.' } }, 400);
            }
            const result = await AzitGameService.claimExpedition(userId, expeditionId);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '원정 정산에 실패했습니다.');
        }
    }
}
