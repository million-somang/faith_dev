import type { Context } from 'hono';
import type { SessionUser } from '../middleware/auth.js';
import { DEFAULT_FERTILIZER_ID, MAX_GARDEN_PLOTS } from '../services/azit-game.catalog.js';
import { AzitGameError, AzitGameService } from '../services/azit-game.service.js';

function parseIntegerField(raw: unknown): number {
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string' && raw.trim().length > 0) return Number(raw);
    return Number.NaN;
}

function getAuthUserId(c: Context): number | null {
    const user = c.get('user') as SessionUser | undefined;
    if (!user || typeof user.id !== 'number') return null;
    return user.id;
}

async function readJsonBody<T extends Record<string, unknown>>(
    c: Context,
    options?: { allowEmpty?: boolean }
): Promise<T> {
    let rawText = '';
    try {
        rawText = await c.req.text();
    } catch (_) {
        throw new AzitGameError('요청 본문을 읽을 수 없습니다.', 400, 'INVALID_BODY');
    }
    if (rawText.trim().length === 0) {
        if (options?.allowEmpty) {
            return {} as T;
        }
        throw new AzitGameError('올바른 JSON 객체 요청 본문이 필요합니다.', 400, 'INVALID_BODY');
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(rawText);
    } catch (_) {
        throw new AzitGameError('올바른 JSON 형식이 아닙니다.', 400, 'INVALID_JSON');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new AzitGameError('요청 본문은 JSON 객체여야 합니다.', 400, 'INVALID_BODY');
    }
    return parsed as T;
}

function handleControllerError(c: Context, err: unknown, fallbackMsg: string) {
    if (err instanceof AzitGameError) {
        return c.json(
            {
                success: false,
                ...(err.errorCode ? { code: err.errorCode } : {}),
                message: err.message,
                error: {
                    code: err.statusCode,
                    ...(err.errorCode ? { errorCode: err.errorCode } : {}),
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
            const quantity = body.quantity === undefined ? 1 : parseIntegerField(body.quantity);
            if (!cropId || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
                return c.json({ success: false, error: { code: 400, message: '씨앗 정보와 구매 수량(1~50)을 확인해 주세요.' } }, 400);
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
            const plotIndex = parseIntegerField(body.plotIndex);
            const cropId = typeof body.cropId === 'string' ? body.cropId.trim() : '';
            if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= MAX_GARDEN_PLOTS || !cropId) {
                return c.json({ success: false, error: { code: 400, message: '올바른 텃밭 번호(0~15)와 작물 ID가 필요합니다.' } }, 400);
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
            const plotIndex = parseIntegerField(body.plotIndex);
            if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= MAX_GARDEN_PLOTS) {
                return c.json({ success: false, error: { code: 400, message: '올바른 텃밭 번호(0~15)가 필요합니다.' } }, 400);
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
            const plotIndex = parseIntegerField(body.plotIndex);
            if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= MAX_GARDEN_PLOTS) {
                return c.json({ success: false, error: { code: 400, message: '올바른 텃밭 번호(0~15)가 필요합니다.' } }, 400);
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
            const plotIndex = parseIntegerField(body.plotIndex);
            if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= MAX_GARDEN_PLOTS) {
                return c.json({ success: false, error: { code: 400, message: '올바른 텃밭 번호(0~15)가 필요합니다.' } }, 400);
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
            const quantity = body.quantity === undefined ? 1 : parseIntegerField(body.quantity);
            if (!cropId || !Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
                return c.json({ success: false, error: { code: 400, message: '판매할 작물과 수량(1~999)을 확인해 주세요.' } }, 400);
            }
            const result = await AzitGameService.sellCrop(userId, cropId, quantity);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '작물 판매에 실패했습니다.');
        }
    }

    static async unlockPlot(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ plotIndex?: unknown }>(c);
            const plotIndex = parseIntegerField(body.plotIndex);
            if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= MAX_GARDEN_PLOTS) {
                return c.json({ success: false, error: { code: 400, message: '올바른 텃밭 번호(0~15)가 필요합니다.' } }, 400);
            }
            const result = await AzitGameService.unlockPlot(userId, plotIndex);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '텃밭 확장에 실패했습니다.');
        }
    }

    static async buyFertilizer(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ fertilizerId?: unknown; quantity?: unknown }>(c, { allowEmpty: true });
            let fertilizerId: string = DEFAULT_FERTILIZER_ID;
            if (body.fertilizerId !== undefined) {
                if (typeof body.fertilizerId !== 'string' || body.fertilizerId.trim().length === 0) {
                    return c.json({ success: false, error: { code: 400, message: '올바른 비료 ID를 지정해 주세요.' } }, 400);
                }
                fertilizerId = body.fertilizerId.trim();
            }
            const quantity = body.quantity === undefined ? 1 : parseIntegerField(body.quantity);
            if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
                return c.json({ success: false, error: { code: 400, message: '비료 구매 수량은 1~50 사이의 정수여야 합니다.' } }, 400);
            }
            const result = await AzitGameService.buyFertilizer(userId, fertilizerId, quantity);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '비료 구매에 실패했습니다.');
        }
    }

    static async fertilizePlot(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ plotIndex?: unknown; fertilizerId?: unknown }>(c);
            const plotIndex = parseIntegerField(body.plotIndex);
            if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= MAX_GARDEN_PLOTS) {
                return c.json({ success: false, error: { code: 400, message: '올바른 텃밭 번호(0~15)가 필요합니다.' } }, 400);
            }
            let fertilizerId: string = DEFAULT_FERTILIZER_ID;
            if (body.fertilizerId !== undefined) {
                if (typeof body.fertilizerId !== 'string' || body.fertilizerId.trim().length === 0) {
                    return c.json({ success: false, error: { code: 400, message: '올바른 비료 ID를 지정해 주세요.' } }, 400);
                }
                fertilizerId = body.fertilizerId.trim();
            }
            const result = await AzitGameService.fertilizePlot(userId, plotIndex, fertilizerId);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '비료 사용에 실패했습니다.');
        }
    }

    static async upgradeSoil(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ plotIndex?: unknown }>(c);
            const plotIndex = parseIntegerField(body.plotIndex);
            if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= MAX_GARDEN_PLOTS) {
                return c.json({ success: false, error: { code: 400, message: '올바른 텃밭 번호(0~15)가 필요합니다.' } }, 400);
            }
            const result = await AzitGameService.upgradeSoil(userId, plotIndex);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '토양 강화에 실패했습니다.');
        }
    }

    static async waterAll(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            await readJsonBody(c, { allowEmpty: true });
            const result = await AzitGameService.waterAll(userId);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '전체 물주기에 실패했습니다.');
        }
    }

    static async harvestAll(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            await readJsonBody(c, { allowEmpty: true });
            const result = await AzitGameService.harvestAll(userId);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '일괄 수확에 실패했습니다.');
        }
    }

    static async plantAll(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ cropId?: unknown }>(c);
            const cropId = typeof body.cropId === 'string' ? body.cropId.trim() : '';
            if (!cropId) {
                return c.json({ success: false, error: { code: 400, message: '일괄 심기에 사용할 작물 ID가 필요합니다.' } }, 400);
            }
            const result = await AzitGameService.plantAll(userId, cropId);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '일괄 심기에 실패했습니다.');
        }
    }

    static async hireFarmer(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ farmerCode?: unknown }>(c);
            const farmerCode = typeof body.farmerCode === 'string' ? body.farmerCode.trim() : '';
            if (!farmerCode) {
                return c.json({ success: false, error: { code: 400, message: '고용할 농부를 선택해 주세요.' } }, 400);
            }
            const result = await AzitGameService.hireFarmer(userId, farmerCode);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '농부 고용에 실패했습니다.');
        }
    }

    static async upgradeFarmer(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ farmerCode?: unknown }>(c);
            const farmerCode = typeof body.farmerCode === 'string' ? body.farmerCode.trim() : '';
            if (!farmerCode) {
                return c.json({ success: false, error: { code: 400, message: '육성할 농부를 선택해 주세요.' } }, 400);
            }
            const result = await AzitGameService.upgradeFarmer(userId, farmerCode);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '농부 육성에 실패했습니다.');
        }
    }

    static async configureFarmer(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{
                farmerCode?: unknown;
                autoEnabled?: unknown;
                preferredCropId?: unknown;
                autoFertilize?: unknown;
            }>(c);
            const farmerCode = typeof body.farmerCode === 'string' ? body.farmerCode.trim() : '';
            if (!farmerCode) {
                return c.json({ success: false, error: { code: 400, message: '설정할 농부를 선택해 주세요.' } }, 400);
            }

            let autoEnabled: boolean | undefined;
            if (body.autoEnabled !== undefined) {
                if (typeof body.autoEnabled !== 'boolean') {
                    return c.json({ success: false, error: { code: 400, message: '자동화 활성화 여부(autoEnabled)는 boolean이어야 합니다.' } }, 400);
                }
                autoEnabled = body.autoEnabled;
            }

            let autoFertilize: boolean | undefined;
            if (body.autoFertilize !== undefined) {
                if (typeof body.autoFertilize !== 'boolean') {
                    return c.json({ success: false, error: { code: 400, message: '자동 비료 여부(autoFertilize)는 boolean이어야 합니다.' } }, 400);
                }
                autoFertilize = body.autoFertilize;
            }

            let preferredCropId: string | null | undefined;
            if (body.preferredCropId !== undefined) {
                if (body.preferredCropId === null) {
                    preferredCropId = null;
                } else if (typeof body.preferredCropId === 'string' && body.preferredCropId.trim().length > 0) {
                    preferredCropId = body.preferredCropId.trim();
                } else {
                    return c.json({ success: false, error: { code: 400, message: '올바른 선호 작물 ID(또는 null)가 필요합니다.' } }, 400);
                }
            }

            if (autoEnabled === undefined && autoFertilize === undefined && preferredCropId === undefined) {
                return c.json({ success: false, error: { code: 400, message: '변경할 농부 설정 항목을 하나 이상 지정해 주세요.' } }, 400);
            }

            const result = await AzitGameService.configureFarmer(userId, {
                farmerCode,
                autoEnabled,
                preferredCropId,
                autoFertilize,
            });
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '농부 설정 변경에 실패했습니다.');
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
            const slotIndex = parseIntegerField(body.slotIndex);
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
            const slotIndex = parseIntegerField(body.slotIndex);
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
            const body = await readJsonBody<{ recipeId?: unknown; quantity?: unknown; quality?: unknown }>(c);
            const recipeId = typeof body.recipeId === 'string' ? body.recipeId.trim() : '';
            const quantity = body.quantity === undefined ? 1 : parseIntegerField(body.quantity);
            let quality: 'normal' | 'special' = 'normal';
            if (body.quality !== undefined) {
                if (body.quality !== 'normal' && body.quality !== 'special') {
                    return c.json(
                        { success: false, error: { code: 400, message: '올바른 요리 등급(normal 또는 special)이 아닙니다.' } },
                        400
                    );
                }
                quality = body.quality;
            }
            if (!recipeId || !Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
                return c.json({ success: false, error: { code: 400, message: '판매할 요리와 수량(1~999)을 확인해 주세요.' } }, 400);
            }
            const result = await AzitGameService.sellDish(userId, recipeId, quantity, quality);
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
                dishQuality?: unknown;
            }>(c);
            const zoneId = typeof body.zoneId === 'string' ? body.zoneId.trim() : '';
            const dishRecipeId = typeof body.dishRecipeId === 'string' ? body.dishRecipeId.trim() : '';
            let dishQuality: 'normal' | 'special' = 'normal';
            if (body.dishQuality !== undefined) {
                if (body.dishQuality !== 'normal' && body.dishQuality !== 'special') {
                    return c.json(
                        {
                            success: false,
                            error: { code: 400, message: '올바른 도시락 등급(normal 또는 special)이 아닙니다.' },
                        },
                        400
                    );
                }
                dishQuality = body.dishQuality;
            }
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
                dishQuality,
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
            const expeditionId = parseIntegerField(body.expeditionId);
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
