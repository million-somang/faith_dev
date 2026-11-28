import type { Context } from 'hono';
import type { SessionUser } from '../middleware/auth.js';
import { DEFAULT_FERTILIZER_ID, MAX_GARDEN_PLOTS, MAX_TOWER_FLOOR } from '../services/azit-game.catalog.js';
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
            err.statusCode as 400 | 403 | 404 | 409
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
            throw new AzitGameError(
                '용병은 전투 경험치로만 레벨업할 수 있습니다.',
                403,
                'GOLD_UPGRADE_DISABLED'
            );
        } catch (err) {
            return handleControllerError(c, err, '용병 훈련에 실패했습니다.');
        }
    }

    static async saveGroup(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{
                id?: unknown;
                name?: unknown;
                slotIndex?: unknown;
                mercCodes?: unknown;
            }>(c);
            let id: number | undefined;
            if (body.id !== undefined && body.id !== null) {
                const parsedId = parseIntegerField(body.id);
                if (!Number.isInteger(parsedId) || parsedId <= 0) {
                    return c.json({ success: false, error: { code: 400, message: '올바른 그룹 ID가 아닙니다.' } }, 400);
                }
                id = parsedId;
            }
            const name = typeof body.name === 'string' ? body.name.trim() : '';
            if (name.length < 1 || name.length > 24) {
                return c.json({ success: false, error: { code: 400, message: '그룹 이름은 1~24자여야 합니다.' } }, 400);
            }
            let slotIndex: number | undefined;
            if (body.slotIndex !== undefined && body.slotIndex !== null) {
                const parsedSlot = parseIntegerField(body.slotIndex);
                if (!Number.isInteger(parsedSlot) || parsedSlot < 0 || parsedSlot > 9) {
                    return c.json({ success: false, error: { code: 400, message: '올바른 슬롯 번호(0~9)가 아닙니다.' } }, 400);
                }
                slotIndex = parsedSlot;
            }
            if (!Array.isArray(body.mercCodes) || body.mercCodes.length === 0) {
                return c.json({ success: false, error: { code: 400, message: '그룹에 편성할 용병 목록이 필요합니다.' } }, 400);
            }
            const mercCodes: string[] = [];
            for (const item of body.mercCodes) {
                if (typeof item !== 'string' || item.trim().length === 0) {
                    return c.json({ success: false, error: { code: 400, message: '올바른 용병 코드 목록이 필요합니다.' } }, 400);
                }
                mercCodes.push(item.trim());
            }
            const result = await AzitGameService.saveGroup(userId, { id, name, slotIndex, mercCodes });
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '용병 그룹 저장에 실패했습니다.');
        }
    }

    static async deleteGroup(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ groupId?: unknown }>(c);
            const groupId = parseIntegerField(body.groupId);
            if (!Number.isInteger(groupId) || groupId <= 0) {
                return c.json({ success: false, error: { code: 400, message: '올바른 그룹 ID가 필요합니다.' } }, 400);
            }
            const result = await AzitGameService.deleteGroup(userId, groupId);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '용병 그룹 삭제에 실패했습니다.');
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
                groupId?: unknown;
                partyMercCodes?: unknown;
                dishRecipeId?: unknown;
                dishQuality?: unknown;
                useSpecialDish?: unknown;
                elixirItemId?: unknown;
            }>(c);
            const zoneId = typeof body.zoneId === 'string' ? body.zoneId.trim() : '';
            const dishRecipeId = typeof body.dishRecipeId === 'string' ? body.dishRecipeId.trim() : '';

            let groupId: number | undefined;
            if (body.groupId !== undefined && body.groupId !== null) {
                const parsedGroupId = parseIntegerField(body.groupId);
                if (!Number.isInteger(parsedGroupId) || parsedGroupId <= 0) {
                    return c.json({ success: false, error: { code: 400, message: '올바른 용병 그룹 ID가 아닙니다.' } }, 400);
                }
                groupId = parsedGroupId;
            }

            if (body.useSpecialDish !== undefined && typeof body.useSpecialDish !== 'boolean') {
                return c.json(
                    { success: false, error: { code: 400, message: 'useSpecialDish는 boolean이어야 합니다.' } },
                    400
                );
            }

            let dishQuality: 'normal' | 'special' = body.useSpecialDish ? 'special' : 'normal';
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
                if (
                    (body.dishQuality === 'normal' && body.useSpecialDish === true) ||
                    (body.dishQuality === 'special' && body.useSpecialDish === false)
                ) {
                    return c.json(
                        {
                            success: false,
                            code: 'INVALID_BODY',
                            error: {
                                code: 'INVALID_BODY',
                                message: 'dishQuality와 useSpecialDish 값이 서로 모순됩니다.',
                            },
                        },
                        400
                    );
                }
                dishQuality = body.dishQuality;
            }

            let partyMercCodes: string[] = [];
            if (body.partyMercCodes !== undefined && body.partyMercCodes !== null) {
                if (!Array.isArray(body.partyMercCodes)) {
                    return c.json({ success: false, error: { code: 400, message: 'partyMercCodes는 배열이어야 합니다.' } }, 400);
                }
                for (const item of body.partyMercCodes) {
                    if (typeof item !== 'string' || item.trim().length === 0) {
                        return c.json({ success: false, error: { code: 400, message: '올바른 출전 용병 코드가 필요합니다.' } }, 400);
                    }
                    partyMercCodes.push(item.trim());
                }
            }

            let elixirItemId: string | undefined;
            if (body.elixirItemId !== undefined && body.elixirItemId !== null) {
                if (typeof body.elixirItemId !== 'string') {
                    return c.json({ success: false, error: { code: 400, message: '올바른 비약 아이템 ID가 아닙니다.' } }, 400);
                }
                const trimmedElixir = body.elixirItemId.trim();
                if (trimmedElixir.length > 0) {
                    elixirItemId = trimmedElixir;
                }
            }

            if (!zoneId || !dishRecipeId || (groupId === undefined && partyMercCodes.length === 0)) {
                return c.json(
                    {
                        success: false,
                        error: { code: 400, message: '원정 지역, 출전 용병(또는 그룹), 보급 도시락을 모두 선택해 주세요.' },
                    },
                    400
                );
            }
            const result = await AzitGameService.startExpedition({
                userId,
                zoneId,
                groupId,
                partyMercCodes,
                dishRecipeId,
                dishQuality,
                elixirItemId,
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

    static async reviveMercenary(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{
                mercCode?: unknown;
                itemId?: unknown;
                useGold?: unknown;
                payGold?: unknown;
                points?: unknown;
                gold?: unknown;
            }>(c);
            if (
                Boolean(body.useGold) ||
                Boolean(body.payGold) ||
                (body.points !== undefined && body.points !== null && body.points !== false && body.points !== 0) ||
                (body.gold !== undefined && body.gold !== null && body.gold !== false && body.gold !== 0)
            ) {
                throw new AzitGameError(
                    '골드로 용병을 부활시킬 수 없습니다. 부활 아이템을 사용해 주세요.',
                    400,
                    'GOLD_REVIVAL_DISABLED'
                );
            }
            const mercCode = typeof body.mercCode === 'string' ? body.mercCode.trim() : '';
            const itemId = typeof body.itemId === 'string' ? body.itemId.trim() : '';
            if (!mercCode || !itemId) {
                return c.json({ success: false, error: { code: 400, message: '부활시킬 용병과 부활 아이템을 선택해 주세요.' } }, 400);
            }
            const result = await AzitGameService.reviveMercenary(userId, mercCode, itemId);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '용병 부활에 실패했습니다.');
        }
    }

    static async upgradeMercSkill(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ mercCode?: unknown; skillSlot?: unknown }>(c);
            const mercCode = typeof body.mercCode === 'string' ? body.mercCode.trim() : '';
            const skillSlot = body.skillSlot;
            if (!mercCode || (skillSlot !== 'main' && skillSlot !== 'sub')) {
                return c.json(
                    { success: false, error: { code: 400, message: '용병 코드와 스킬 슬롯(main 또는 sub)을 확인해 주세요.' } },
                    400
                );
            }
            const result = await AzitGameService.upgradeMercSkill(userId, mercCode, skillSlot);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '용병 스킬 강화에 실패했습니다.');
        }
    }

    static async buyShopItem(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ itemId?: unknown; qty?: unknown; quantity?: unknown }>(c);
            const itemId = typeof body.itemId === 'string' ? body.itemId.trim() : '';
            const rawQty = body.qty !== undefined ? body.qty : (body.quantity ?? 1);
            const qty = parseIntegerField(rawQty);
            if (!itemId || !Number.isInteger(qty) || qty < 1 || qty > 99) {
                return c.json(
                    { success: false, error: { code: 400, message: '구매할 아이템과 수량(1~99)을 확인해 주세요.' } },
                    400
                );
            }
            const result = await AzitGameService.buyShopItem(userId, itemId, qty);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '아이템 구매에 실패했습니다.');
        }
    }

    static async craftItem(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{ recipeId?: unknown; qty?: unknown; quantity?: unknown }>(c);
            const recipeId = typeof body.recipeId === 'string' ? body.recipeId.trim() : '';
            const rawQty = body.qty !== undefined ? body.qty : (body.quantity ?? 1);
            const qty = parseIntegerField(rawQty);
            if (!recipeId || !Number.isInteger(qty) || qty < 1 || qty > 50) {
                return c.json(
                    { success: false, error: { code: 400, message: '제작 레시피와 수량(1~50)을 확인해 주세요.' } },
                    400
                );
            }
            const result = await AzitGameService.craftItem(userId, recipeId, qty);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '아이템 제작에 실패했습니다.');
        }
    }

    static async getTowerFloors(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const rawFrom = c.req.query('from');
            const rawTo = c.req.query('to');
            const from = rawFrom === undefined ? 1 : parseIntegerField(rawFrom);
            const to = rawTo === undefined ? MAX_TOWER_FLOOR : parseIntegerField(rawTo);
            if (
                !Number.isInteger(from) ||
                !Number.isInteger(to) ||
                from < 1 ||
                to > MAX_TOWER_FLOOR ||
                from > to
            ) {
                return c.json(
                    { success: false, error: { code: 400, message: `유효한 층 범위(1~${MAX_TOWER_FLOOR})를 지정해 주세요.` } },
                    400
                );
            }
            const result = await AzitGameService.getTowerFloors(userId, from, to);
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '베라의 탑 층 정보를 불러오지 못했습니다.');
        }
    }

    static async battleTowerFloor(c: Context) {
        try {
            const userId = getAuthUserId(c);
            if (!userId) {
                return c.json({ success: false, error: { code: 401, message: '로그인이 필요합니다.' } }, 401);
            }
            const body = await readJsonBody<{
                floor?: unknown;
                groupId?: unknown;
                partyMercCodes?: unknown;
                elixirItemId?: unknown;
            }>(c);
            const floor = parseIntegerField(body.floor);
            if (!Number.isInteger(floor) || floor < 1 || floor > MAX_TOWER_FLOOR) {
                return c.json(
                    { success: false, error: { code: 400, message: `도전 층수는 1~${MAX_TOWER_FLOOR}층이어야 합니다.` } },
                    400
                );
            }

            let groupId: number | undefined;
            if (body.groupId !== undefined && body.groupId !== null) {
                const parsedGroupId = parseIntegerField(body.groupId);
                if (!Number.isInteger(parsedGroupId) || parsedGroupId <= 0) {
                    return c.json({ success: false, error: { code: 400, message: '올바른 용병 그룹 ID가 아닙니다.' } }, 400);
                }
                groupId = parsedGroupId;
            }

            let partyMercCodes: string[] = [];
            if (body.partyMercCodes !== undefined && body.partyMercCodes !== null) {
                if (!Array.isArray(body.partyMercCodes)) {
                    return c.json({ success: false, error: { code: 400, message: 'partyMercCodes는 배열이어야 합니다.' } }, 400);
                }
                for (const item of body.partyMercCodes) {
                    if (typeof item !== 'string' || item.trim().length === 0) {
                        return c.json({ success: false, error: { code: 400, message: '올바른 출전 용병 코드가 필요합니다.' } }, 400);
                    }
                    partyMercCodes.push(item.trim());
                }
            }

            if (groupId === undefined && partyMercCodes.length === 0) {
                return c.json(
                    { success: false, error: { code: 400, message: '출전할 용병(또는 그룹)을 선택해 주세요.' } },
                    400
                );
            }

            let elixirItemId: string | undefined;
            if (body.elixirItemId !== undefined && body.elixirItemId !== null) {
                if (typeof body.elixirItemId !== 'string') {
                    return c.json({ success: false, error: { code: 400, message: '올바른 비약 아이템 ID가 아닙니다.' } }, 400);
                }
                const trimmedElixir = body.elixirItemId.trim();
                if (trimmedElixir.length > 0) {
                    elixirItemId = trimmedElixir;
                }
            }

            const result = await AzitGameService.battleTowerFloor({
                userId,
                floor,
                groupId,
                partyMercCodes,
                elixirItemId,
            });
            return c.json({ success: true, data: result });
        } catch (err) {
            return handleControllerError(c, err, '베라의 탑 전투 진행에 실패했습니다.');
        }
    }
}
