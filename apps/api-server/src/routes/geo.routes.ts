import { Hono } from 'hono';

export const geoRoutes = new Hono();

// ==================== Geo-Location API ====================

/**
 * GET /api/v1/geo/country
 * Detects visitor country based on Cloudflare / Proxy headers and Accept-Language.
 */
geoRoutes.get('/api/v1/geo/country', (c) => {
  try {
    // 1. Cloudflare IP Country Header
    const cfCountry = c.req.header('cf-ipcountry');
    
    // 2. Custom Proxy Country Header
    const customCountry = c.req.header('x-country-code');

    // 3. Client IP
    const clientIp = c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
                     c.req.header('x-real-ip') ||
                     '127.0.0.1';

    // 4. Accept-Language Header Hint
    const acceptLanguage = c.req.header('accept-language') || '';

    let countryCode = (cfCountry || customCountry || '').toUpperCase();

    // If country code is not present from Cloudflare/Proxy, infer from Accept-Language or IP
    if (!countryCode || countryCode === 'XX' || countryCode === 'UNKNOWN') {
      if (acceptLanguage.toLowerCase().includes('ko')) {
        countryCode = 'KR';
      } else {
        countryCode = 'US';
      }
    }

    const isKorea = countryCode === 'KR';
    const recommendedLang: 'ko' | 'en' = isKorea ? 'ko' : 'en';

    return c.json({
      success: true,
      country: countryCode,
      isKorea,
      recommendedLang,
      ip: clientIp === '127.0.0.1' ? undefined : clientIp,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GeoAPI] Country detection error:', message);
    return c.json({
      success: true,
      country: 'KR',
      isKorea: true,
      recommendedLang: 'ko'
    });
  }
});
