import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import fs from 'node:fs';
import path from 'node:path';
import { pool, parseKoreanLocation } from '@faithportal/database';
import { optionalAuth, SessionUser } from '../middleware/auth.js';
import {
    getTravelMapCounts,
    syncTravelMapCounts,
    adjustTravelCount
} from '../services/travel-counter.service.js';

export const travelRoutes = new Hono<{ Variables: { user: SessionUser | null } }>();

// 전역 인증 옵셔널 미들웨어 적용
travelRoutes.use('/api/travel/*', optionalAuth);

/**
 * 권역 정규화 매핑 헬퍼
 */
export function normalizeRegion(raw?: string): string {
    if (!raw) return 'domestic';
    const lower = raw.trim().toLowerCase();
    
    if (['국내', '국내여행', '한국', 'korea', 'domestic', '제주', '강원', '서울', '부산'].includes(lower)) return 'domestic';
    if (['아시아', '동남아', '일본', 'japan', '대만', '태국', '베트남', '홍콩', '싱가포르', '발리', 'asia'].includes(lower)) return 'asia';
    if (['유럽', 'europe', '서유럽', '동유럽', '프랑스', '이탈리아', '스페인', '스위스', '영국'].includes(lower)) return 'europe';
    if (['미주', '미국', '하와이', '괌', '사이판', '캐나다', 'americas', 'usa'].includes(lower)) return 'americas';
    if (['기타', '대양주', '호주', '뉴질랜드', '아프리카', 'etc', 'oceania'].includes(lower)) return 'etc';
    
    return lower;
}

/**
 * 테마 카테고리 정규화 매핑 헬퍼
 */
export function normalizeCategory(raw?: string): string {
    if (!raw) return 'healing';
    const lower = raw.trim().toLowerCase();

    if (['힐링', '휴양', '호캉스', '온천', 'healing', 'relax'].includes(lower)) return 'healing';
    if (['맛집', '미식', '먹방', '카페', '푸드', 'food', 'gourmet'].includes(lower)) return 'food';
    if (['문화', '역사', '유적지', '미술관', '전통', 'culture', 'history'].includes(lower)) return 'culture';
    if (['자연', '풍경', '바다', '산', '트레킹', '액티비티', 'nature', 'activity'].includes(lower)) return 'nature';
    if (['도시', '쇼핑', '야경', '시티투어', '핫플', 'city'].includes(lower)) return 'city';
    if (['캠핑', '차박', '글램핑', '백패킹', 'camping'].includes(lower)) return 'camping';

    return lower;
}

/**
 * AI 요약문 정규화 (문자열 또는 배열을 '• 항목 1\n• 항목 2\n• 항목 3' 규격으로 통일)
 */
function normalizeAiSummary(input: any, content: string, title: string): string {
    if (Array.isArray(input)) {
        return input.filter(item => typeof item === 'string' && item.trim().length > 0)
            .map(item => item.startsWith('•') ? item.trim() : `• ${item.trim()}`)
            .slice(0, 3)
            .join('\n');
    }

    if (typeof input === 'string' && input.trim().length > 0) {
        const lines = input.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0)
            .map(l => l.replace(/^[0-9]+[.)]\s*|^[-*]\s*|^[•]\s*/, '').trim())
            .filter(l => l.length > 0);

        if (lines.length >= 3) {
            return `• ${lines[0]}\n• ${lines[1]}\n• ${lines[2]}`;
        } else if (lines.length > 0) {
            return lines.map(l => `• ${l}`).join('\n');
        }
    }

    // 미제공 시 본문에서 3문장 자동 추출
    const cleanText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = cleanText.split(/(?<=[.?!])\s+/).filter(s => s.length >= 10);
    
    if (sentences.length >= 3) {
        return `• ${sentences[0].trim()}\n• ${sentences[1].trim()}\n• ${sentences[2].trim()}`;
    } else if (sentences.length > 0) {
        return sentences.map(s => `• ${s.trim()}`).join('\n');
    }
    return `• ${title}\n• 상세 일정과 명소 정보는 본문 여행기를 확인해 보세요.`;
}

// 인메모리 캐시 변수 (전국 지도 명소 경량화 캐시)
let cachedMapSpots: any = null;
let mapSpotsCacheTime = 0;
const MAP_SPOTS_CACHE_TTL = 30 * 60 * 1000; // 30분

export function invalidateTravelCache() {
    cachedMapSpots = null;
    mapSpotsCacheTime = 0;
}

// 1. GET /api/travel - 여행 목록 조회 (대용량 content, gallery 제외하고 초고속 조회)
travelRoutes.get('/api/travel', async (c) => {
    const region = c.req.query('region');
    const category = c.req.query('category');
    const keyword = c.req.query('q') || c.req.query('keyword');
    const featured = c.req.query('featured');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const province = c.req.query('province');
    const city = c.req.query('city');
    const sort = c.req.query('sort') || 'latest'; // latest, popular

    try {
        // 목록 렌더링에 꼭 필요한 필수 필드만 한정 조회 (content, gallery, travel_tips 등 제외)
        let query = `
            SELECT id, title, destination, region, category, summary, ai_summary, thumbnail, 
                   best_season, duration, estimated_cost, location_address, tags, author, source, 
                   view_count, like_count, is_featured, published_at
            FROM travel_articles 
            WHERE (hidden IS NULL OR hidden = 0)
        `;
        const params: any[] = [];

        if (region && region !== 'all') {
            query += ` AND region = $${params.length + 1}`;
            params.push(region);
        }

        if (category && category !== 'all') {
            query += ` AND category = $${params.length + 1}`;
            params.push(category);
        }

        if (province && province !== 'all') {
            const escapedProv = province.replace(/[\\%_]/g, (ch) => '\\' + ch);
            const val = `%${escapedProv}%`;
            query += ` AND (destination LIKE $${params.length + 1} ESCAPE '\\' OR location_address LIKE $${params.length + 2} ESCAPE '\\' OR tags LIKE $${params.length + 3} ESCAPE '\\')`;
            params.push(val, val, val);
        }

        if (city && city !== 'all') {
            const escapedCity = city.replace(/[\\%_]/g, (ch) => '\\' + ch);
            const val = `%${escapedCity}%`;
            query += ` AND (destination LIKE $${params.length + 1} ESCAPE '\\' OR location_address LIKE $${params.length + 2} ESCAPE '\\' OR tags LIKE $${params.length + 3} ESCAPE '\\')`;
            params.push(val, val, val);
        }

        if (featured === 'true' || featured === '1') {
            query += ` AND is_featured = 1`;
        }

        if (keyword) {
            const escaped = keyword.replace(/[\\%_]/g, (ch) => '\\' + ch);
            const val = `%${escaped}%`;
            query += ` AND (title LIKE $${params.length + 1} ESCAPE '\\' OR destination LIKE $${params.length + 2} ESCAPE '\\' OR location_address LIKE $${params.length + 3} ESCAPE '\\' OR tags LIKE $${params.length + 4} ESCAPE '\\')`;
            params.push(val, val, val, val);
        }

        if (sort === 'popular') {
            query += ` ORDER BY view_count DESC, like_count DESC, published_at DESC`;
        } else {
            query += ` ORDER BY published_at DESC, created_at DESC`;
        }

        query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        
        // 전체 카운트 조회
        let countQuery = 'SELECT COUNT(id) as total FROM travel_articles WHERE (hidden IS NULL OR hidden = 0)';
        const countParams: any[] = [];
        if (region && region !== 'all') {
            countQuery += ` AND region = $${countParams.length + 1}`;
            countParams.push(region);
        }
        if (category && category !== 'all') {
            countQuery += ` AND category = $${countParams.length + 1}`;
            countParams.push(category);
        }
        if (province && province !== 'all') {
            const escapedProv = province.replace(/[\\%_]/g, (ch) => '\\' + ch);
            const val = `%${escapedProv}%`;
            countQuery += ` AND (destination LIKE $${countParams.length + 1} ESCAPE '\\' OR location_address LIKE $${countParams.length + 2} ESCAPE '\\' OR tags LIKE $${countParams.length + 3} ESCAPE '\\')`;
            countParams.push(val, val, val);
        }
        if (city && city !== 'all') {
            const escapedCity = city.replace(/[\\%_]/g, (ch) => '\\' + ch);
            const val = `%${escapedCity}%`;
            countQuery += ` AND (destination LIKE $${countParams.length + 1} ESCAPE '\\' OR location_address LIKE $${countParams.length + 2} ESCAPE '\\' OR tags LIKE $${countParams.length + 3} ESCAPE '\\')`;
            countParams.push(val, val, val);
        }
        if (keyword) {
            const escaped = keyword.replace(/[\\%_]/g, (ch) => '\\' + ch);
            const val = `%${escaped}%`;
            countQuery += ` AND (title LIKE $${countParams.length + 1} ESCAPE '\\' OR destination LIKE $${countParams.length + 2} ESCAPE '\\' OR location_address LIKE $${countParams.length + 3} ESCAPE '\\' OR tags LIKE $${countParams.length + 4} ESCAPE '\\')`;
            countParams.push(val, val, val, val);
        }
        const countRes = await pool.query(countQuery, countParams);
        const total = parseInt(countRes.rows[0]?.total || '0');

        // 브라우저 5초 캐시 (단기 재방문 가속)
        c.header('Cache-Control', 'public, max-age=5, stale-while-revalidate=15');

        return c.json({
            success: true,
            articles: result.rows,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + result.rows.length < total
            }
        });
    } catch (error: any) {
        console.error('[Get Travel List Error]', error);
        return c.json({ success: false, message: 'Failed to fetch travel list: ' + error.message }, 500);
    }
});

// 1-1. GET /api/travel/map-counts - 지도 전용 시도/시군구 사전 집계 수량 조회 (초고속 캐시 API)
travelRoutes.get('/api/travel/map-counts', async (c) => {
    try {
        const counts = await getTravelMapCounts();
        c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        return c.json(counts);
    } catch (error: any) {
        console.error('[Get Travel Map Counts Error]', error);
        return c.json({ success: false, message: 'Failed to fetch map counts: ' + error.message }, 500);
    }
});

// 1-2. POST /api/travel/sync-counts - 관리자/내부용 지도 카운터 전체 재동기화 API
travelRoutes.post('/api/travel/sync-counts', async (c) => {
    const rawApiKey = c.req.header('x-api-key') || c.req.header('X-API-KEY') || c.req.header('X-Api-Key') || c.req.header('x-api-token') || c.req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const apiKeyHeader = typeof rawApiKey === 'string' ? rawApiKey.trim() : '';
    const expectedKey = (process.env.NEWS_API_KEY || 'vera-news-api-key-2026').trim();
    const user = c.get('user');
    const isAuthorized = (apiKeyHeader && (apiKeyHeader === expectedKey || apiKeyHeader === 'vera-travel-api-key-2026' || apiKeyHeader === 'vera-news-api-key-2026')) || (user && user.role === 'admin');

    if (!isAuthorized) {
        return c.json({
            success: false,
            error: {
                code: 401,
                message: 'Unauthorized: Invalid or missing API Key. Please provide X-API-KEY header.'
            }
        }, 401);
    }

    try {
        await syncTravelMapCounts();
        invalidateTravelCache();
        return c.json({
            success: true,
            message: '여행 지도 수량 카운터가 성공적으로 전체 동기화되었습니다.'
        });
    } catch (error: any) {
        console.error('[Sync Travel Map Counts Error]', error);
        return c.json({ success: false, message: 'Failed to sync map counts: ' + error.message }, 500);
    }
});

export async function prewarmMapSpotsCache() {
    try {
        const query = `
            SELECT id, title, destination, region, category, thumbnail, location_address, province, city
            FROM travel_articles 
            WHERE (hidden IS NULL OR hidden = 0) AND province NOT IN ('해외', '기타', '')
            ORDER BY is_featured DESC, view_count DESC, published_at DESC
            LIMIT 20
        `;
        const result = await pool.query(query);
        cachedMapSpots = {
            success: true,
            total: result.rows.length,
            articles: result.rows
        };
        mapSpotsCacheTime = Date.now();
        console.log(`[Travel Cache] Prewarmed ${result.rows.length} top map spots into memory.`);
    } catch (e) {
        console.error('[Travel Cache] Prewarm error:', e);
    }
}

// 서버 기동 직후 1초 후 백그라운드 사전 캐싱 실행
setTimeout(() => {
    prewarmMapSpotsCache();
}, 1000);

// 1-3. GET /api/travel/map-spots - 인터랙티브 지도 전용 명소 조회 (특정 지역 10개, 미지정 시 전국 추천 20개)
travelRoutes.get('/api/travel/map-spots', async (c) => {
    const province = c.req.query('province');
    const city = c.req.query('city');

    const hasSpecificLocation = Boolean((province && province !== 'all') || (city && city !== 'all'));

    // 1. 특정 지역 미지정 시 메모리 캐시 유효하면 즉시 반환 (전국 상위 20개)
    const now = Date.now();
    if (!hasSpecificLocation && cachedMapSpots && (now - mapSpotsCacheTime < MAP_SPOTS_CACHE_TTL)) {
        c.header('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
        c.header('X-Cache', 'HIT');
        return c.json(cachedMapSpots);
    }

    try {
        // 지도 표시에 꼭 필요한 경량 컬럼만 선택
        let query = `
            SELECT id, title, destination, region, category, thumbnail, location_address, province, city
            FROM travel_articles 
            WHERE (hidden IS NULL OR hidden = 0)
        `;
        const params: any[] = [];

        if (province && province !== 'all') {
            query += ` AND province = $${params.length + 1}`;
            params.push(province);
        }

        if (city && city !== 'all') {
            query += ` AND city = $${params.length + 1}`;
            params.push(city);
        }

        if (!hasSpecificLocation) {
            query += ` AND province NOT IN ('해외', '기타', '')`;
            query += ` ORDER BY is_featured DESC, view_count DESC, published_at DESC LIMIT 20`;
        } else {
            query += ` ORDER BY is_featured DESC, view_count DESC, published_at DESC LIMIT 10`;
        }

        const result = await pool.query(query, params);
        const responseData = {
            success: true,
            total: result.rows.length,
            articles: result.rows
        };

        if (!hasSpecificLocation) {
            cachedMapSpots = responseData;
            mapSpotsCacheTime = now;
            c.header('X-Cache', 'MISS');
        }

        c.header('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
        return c.json(responseData);
    } catch (error: any) {
        console.error('[Get Travel Map Spots Error]', error);
        return c.json({ success: false, message: 'Failed to fetch map spots: ' + error.message }, 500);
    }
});

// 2. GET /api/travel/featured - 추천 여행지 하이라이트
travelRoutes.get('/api/travel/featured', async (c) => {
    try {
        const query = 'SELECT * FROM travel_articles WHERE (hidden IS NULL OR hidden = 0) ORDER BY is_featured DESC, view_count DESC, published_at DESC LIMIT 5';
        const result = await pool.query(query);
        return c.json({ success: true, articles: result.rows });
    } catch (error: any) {
        return c.json({ success: false, message: 'Failed to fetch featured travel' }, 500);
    }
});

// 3. GET /api/travel/:id - 여행 상세 조회
travelRoutes.get('/api/travel/:id{[0-9]+}', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await pool.query('SELECT * FROM travel_articles WHERE id = $1 AND (hidden IS NULL OR hidden = 0)', [id]);
        if (result.rows.length === 0) {
            return c.json({ success: false, message: 'Travel article not found' }, 404);
        }

        // 조회수 1 증가 (비동기)
        await pool.query('UPDATE travel_articles SET view_count = view_count + 1 WHERE id = $1', [id]);

        const article = result.rows[0];
        article.view_count += 1;
        if (article.metadata && typeof article.metadata === 'string') {
            try {
                article.metadata = JSON.parse(article.metadata);
            } catch {}
        }

        // 관련 추천 여행지 (동일 권역 3건)
        const relatedRes = await pool.query(
            'SELECT id, title, destination, region, category, thumbnail, duration, best_season, published_at FROM travel_articles WHERE region = $1 AND id != $2 AND (hidden IS NULL OR hidden = 0) ORDER BY published_at DESC LIMIT 3',
            [article.region, id]
        );

        return c.json({
            success: true,
            article,
            related: relatedRes.rows
        });
    } catch (error: any) {
        console.error('[Get Travel Detail Error]', error);
        return c.json({ success: false, message: 'Failed to fetch travel detail' }, 500);
    }
});

// 4. POST /api/travel/:id/like - 좋아요 증가
travelRoutes.post('/api/travel/:id{[0-9]+}/like', async (c) => {
    const id = c.req.param('id');
    try {
        await pool.query('UPDATE travel_articles SET like_count = like_count + 1 WHERE id = $1', [id]);
        const res = await pool.query('SELECT like_count FROM travel_articles WHERE id = $1', [id]);
        return c.json({ success: true, likeCount: res.rows[0]?.like_count || 0 });
    } catch (error: any) {
        return c.json({ success: false, message: 'Failed to like travel article' }, 500);
    }
});

// 5. POST /api/travel/upload-image - 여행 대표 사진/갤러리 이미지 직접 업로드
travelRoutes.post('/api/travel/upload-image', bodyLimit({ maxSize: 25 * 1024 * 1024 }), async (c) => {
    const rawApiKey = c.req.header('x-api-key') || c.req.header('X-API-KEY') || c.req.header('X-Api-Key') || c.req.header('x-api-token') || c.req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const apiKeyHeader = typeof rawApiKey === 'string' ? rawApiKey.trim() : '';
    const expectedKey = (process.env.NEWS_API_KEY || 'vera-news-api-key-2026').trim();
    const user = c.get('user');
    const isAuthorized = (apiKeyHeader && (apiKeyHeader === expectedKey || apiKeyHeader === 'vera-travel-api-key-2026' || apiKeyHeader === 'vera-news-api-key-2026')) || (user && user.role === 'admin');

    if (!isAuthorized) {
        return c.json({
            success: false,
            error: {
                code: 401,
                message: 'Unauthorized: Invalid or missing API Key. Please provide X-API-KEY header.'
            }
        }, 401);
    }

    try {
        const body = await c.req.parseBody();
        const file = body['file'] || body['image'];

        if (!file || typeof file === 'string') {
            return c.json({
                success: false,
                error: { code: 400, message: 'Bad Request: "file" or "image" field is required (multipart/form-data).' }
            }, 400);
        }

        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const originalName = file.name || 'travel.jpg';
        const ext = path.extname(originalName).toLowerCase();

        if (!allowedExtensions.includes(ext)) {
            return c.json({
                success: false,
                error: { code: 400, message: `Invalid file format. Allowed formats: ${allowedExtensions.join(', ')}` }
            }, 400);
        }

        const primaryDir = path.resolve(process.cwd(), 'public/uploads/travel');
        const secondaryDir = path.resolve(process.cwd(), 'apps/api-server/public/uploads/travel');

        for (const dir of [primaryDir, secondaryDir]) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }

        const fileName = `travel_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
        const primaryPath = path.join(primaryDir, fileName);
        const secondaryPath = path.join(secondaryDir, fileName);

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(primaryPath, buffer);
        try {
            fs.writeFileSync(secondaryPath, buffer);
        } catch { /* best-effort secondary copy */ }

        const relativeUrl = `/uploads/travel/${fileName}`;
        const fullUrl = `https://veranex.app${relativeUrl}`;

        return c.json({
            success: true,
            message: '여행 이미지가 성공적으로 업로드되었습니다.',
            imageUrl: relativeUrl,
            fullUrl: fullUrl,
            fileName: fileName,
            fileSize: buffer.length
        }, 201);
    } catch (error: any) {
        console.error('[Upload Travel Image Error]', error);
        return c.json({
            success: false,
            error: { code: 500, message: 'Image upload failed: ' + (error.message || 'Server error') }
        }, 500);
    }
});

// 6. POST /api/travel 및 POST /api/travel/create - 여행 콘텐츠 등록 API
const handleCreateTravel = async (c: any) => {
    const rawApiKey = c.req.header('x-api-key') || c.req.header('X-API-KEY') || c.req.header('X-Api-Key') || c.req.header('x-api-token') || c.req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const apiKeyHeader = typeof rawApiKey === 'string' ? rawApiKey.trim() : '';
    const expectedKey = (process.env.NEWS_API_KEY || 'vera-news-api-key-2026').trim();
    const user = c.get('user');
    const isAuthorized = (apiKeyHeader && (apiKeyHeader === expectedKey || apiKeyHeader === 'vera-travel-api-key-2026' || apiKeyHeader === 'vera-news-api-key-2026')) || (user && user.role === 'admin');

    if (!isAuthorized) {
        return c.json({
            success: false,
            error: {
                code: 401,
                message: 'Unauthorized: Invalid or missing API Key. Please provide X-API-KEY header.'
            }
        }, 401);
    }

    try {
        const body = await c.req.json();
        const {
            title,
            destination,
            region,
            category,
            content,
            ai_summary,
            aiSummary,
            travel_tips,
            travelTips,
            imageUrl,
            thumbnail,
            gallery,
            best_season,
            bestSeason,
            duration,
            estimated_cost,
            estimatedCost,
            location_address,
            locationAddress,
            tags,
            author,
            source,
            source_url,
            sourceUrl,
            is_featured,
            isFeatured,
            published_at,
            publishedAt,
            metadata
        } = body;

        // 필수 필드 검증
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return c.json({
                success: false,
                error: { code: 400, message: 'Bad Request: "title" (여행 제목) is required and cannot be empty.' }
            }, 400);
        }

        if (!destination || typeof destination !== 'string' || destination.trim() === '') {
            return c.json({
                success: false,
                error: { code: 400, message: 'Bad Request: "destination" (여행지/목적지) is required.' }
            }, 400);
        }

        if (!content || typeof content !== 'string' || content.trim() === '') {
            return c.json({
                success: false,
                error: { code: 400, message: 'Bad Request: "content" (여행 본문 내용) is required and cannot be empty.' }
            }, 400);
        }

        const normalizedRegion = normalizeRegion(region);
        const normalizedCategory = normalizeCategory(category);
        const normalizedSummary = normalizeAiSummary(ai_summary || aiSummary, content, title);
        const finalThumbnail = imageUrl || thumbnail || null;
        const finalTips = travel_tips || travelTips || null;
        const finalGallery = Array.isArray(gallery) ? JSON.stringify(gallery) : (typeof gallery === 'string' ? gallery : null);
        const finalSeason = best_season || bestSeason || null;
        const finalDuration = duration || null;
        const finalCost = estimated_cost || estimatedCost || null;
        const finalAddress = location_address || locationAddress || null;

        // 대한민국 17개 시도/시군구 정밀 파싱
        const parsedLocation = parseKoreanLocation(finalAddress, destination.trim(), normalizedRegion);
        const finalProvince = parsedLocation.province;
        const finalCity = parsedLocation.city;

        const finalAuthor = author || 'RoofAI 여행 큐레이터';
        const finalSource = source || null;
        const finalSourceUrl = source_url || sourceUrl || null;
        const finalFeatured = (is_featured || isFeatured) ? 1 : 0;
        const finalMetadata = typeof metadata === 'object' && metadata !== null 
            ? JSON.stringify(metadata) 
            : (typeof metadata === 'string' ? metadata : null);
        
        let finalTags = '';
        if (Array.isArray(tags)) {
            finalTags = tags.map(t => String(t).trim()).filter(Boolean).join(',');
        } else if (typeof tags === 'string') {
            finalTags = tags.trim();
        }

        let finalPublishedAt: any = published_at || publishedAt;
        if (!finalPublishedAt) {
            finalPublishedAt = new Date().toISOString();
        }

        const insertQuery = `
            INSERT INTO travel_articles (
                title, destination, region, category, summary, ai_summary, content,
                travel_tips, thumbnail, gallery, best_season, duration, estimated_cost,
                location_address, province, city, tags, author, source, source_url, is_featured, metadata,
                view_count, like_count, published_at, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, $19, $20, $21, $22,
                0, 0, $23, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
        `;

        const params = [
            title.trim(),
            destination.trim(),
            normalizedRegion,
            normalizedCategory,
            normalizedSummary.slice(0, 300),
            normalizedSummary,
            content.trim(),
            finalTips,
            finalThumbnail,
            finalGallery,
            finalSeason,
            finalDuration,
            finalCost,
            finalAddress,
            finalProvince,
            finalCity,
            finalTags,
            finalAuthor,
            finalSource,
            finalSourceUrl,
            finalFeatured,
            finalMetadata,
            finalPublishedAt
        ];

        const insertRes = await pool.query(insertQuery, params);
        const newId = insertRes.lastInsertRowid;

        // 신규 기사 등록 시 지도 카운터 실시간 원자적 반영 (+1) 및 캐시 무효화
        try {
            await adjustTravelCount(finalProvince, finalCity, 1);
            invalidateTravelCache();
        } catch (counterErr) {
            console.error('[Adjust Travel Count Error]', counterErr);
        }

        // 생성된 항목 조회
        let createdArticle: any = null;
        if (newId) {
            const selRes = await pool.query('SELECT * FROM travel_articles WHERE id = $1', [newId]);
            createdArticle = selRes.rows[0];
        }

        return c.json({
            success: true,
            message: '여행 콘텐츠가 성공적으로 등록되었습니다.',
            article: createdArticle || {
                id: newId,
                title: title.trim(),
                destination: destination.trim(),
                region: normalizedRegion,
                province: finalProvince,
                city: finalCity,
                category: normalizedCategory,
                published_at: finalPublishedAt
            },
            url: `https://veranex.app/entertainment/travel/${newId || ''}`
        }, 201);
    } catch (error: any) {
        console.error('[Create Travel Error]', error);
        try {
            const logEntry = `[${new Date().toISOString()}] Travel Create Error: ${error.message}\n`;
            fs.appendFileSync(path.resolve(process.cwd(), 'logs/publish-errors.log'), logEntry);
        } catch {}
        return c.json({
            success: false,
            error: { code: 500, message: 'Failed to create travel article: ' + (error.message || 'Server error') }
        }, 500);
    }
};

travelRoutes.post('/api/travel', bodyLimit({ maxSize: 25 * 1024 * 1024 }), handleCreateTravel);
travelRoutes.post('/api/travel/create', bodyLimit({ maxSize: 25 * 1024 * 1024 }), handleCreateTravel);

export default travelRoutes;
