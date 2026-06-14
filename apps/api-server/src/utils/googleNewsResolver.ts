/**
 * 구글 뉴스 RSS 링크 해독 + 원문 og:image 추출 유틸
 *
 * 구글 뉴스 RSS의 기사 링크(news.google.com/rss/articles/...)는 JS 리다이렉트 페이지라
 * 단순 fetch로는 원문에 접근할 수 없다. 구글 내부 batchexecute API를 통해
 * 원문 URL을 해독한 뒤, 원문 페이지의 og:image를 가져온다.
 *
 * 비공식 방식이므로 실패할 수 있으며, 모든 함수는 실패 시 null을 반환한다 (best-effort).
 */

const FETCH_TIMEOUT = 7000
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response | null> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
    try {
        const res = await fetch(url, {
            redirect: 'follow',
            ...options,
            signal: controller.signal,
            headers: { 'User-Agent': UA, ...(options.headers || {}) },
        })
        return res
    } catch {
        return null
    } finally {
        clearTimeout(timer)
    }
}

/**
 * 구글 뉴스 기사 링크 → 원문 URL 해독
 */
export async function resolveGoogleNewsUrl(gnewsUrl: string): Promise<string | null> {
    try {
        if (!gnewsUrl.includes('news.google.com')) return gnewsUrl // 이미 원문 링크

        // 1단계: 기사 인터스티셜 페이지에서 서명/타임스탬프 추출
        const pageRes = await fetchWithTimeout(gnewsUrl)
        if (!pageRes || !pageRes.ok) return null
        const html = await pageRes.text()

        const sigMatch = html.match(/data-n-a-sg="([^"]+)"/)
        const tsMatch = html.match(/data-n-a-ts="([^"]+)"/)
        const idMatch = gnewsUrl.match(/articles\/([^?/]+)/)
        if (!sigMatch || !tsMatch || !idMatch) {
            // 구버전 형식(CBMi...)은 base64 안에 URL이 직접 들어있는 경우가 있음
            return decodeLegacyGoogleNewsUrl(gnewsUrl)
        }

        // 2단계: batchexecute API 호출
        const articleId = idMatch[1]
        const payload = [
            'Fbv4je',
            `["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"${articleId}",${tsMatch[1]},"${sigMatch[1]}"]`,
        ]
        const body = 'f.req=' + encodeURIComponent(JSON.stringify([[payload]]))

        const apiRes = await fetchWithTimeout('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body,
        })
        if (!apiRes || !apiRes.ok) return null
        const text = await apiRes.text()

        // 응답에서 원문 URL 추출
        const urlMatch = text.match(/"(https?:\/\/[^"]+)"/g)
        if (!urlMatch) return null
        for (const m of urlMatch) {
            const url = m.slice(1, -1)
            if (!url.includes('google.com') && !url.includes('gstatic.com')) {
                return url.replace(/\\u003d/g, '=').replace(/\\u0026/g, '&')
            }
        }
        return null
    } catch {
        return null
    }
}

/**
 * 구버전 구글 뉴스 링크(base64에 URL이 직접 포함된 형식) 해독
 */
function decodeLegacyGoogleNewsUrl(gnewsUrl: string): string | null {
    try {
        const idMatch = gnewsUrl.match(/articles\/([^?/]+)/)
        if (!idMatch) return null
        const decoded = Buffer.from(idMatch[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('latin1')
        const urlMatch = decoded.match(/https?:\/\/[^\s"'\x00-\x1f\x7f-\xff]+/)
        return urlMatch ? urlMatch[0] : null
    } catch {
        return null
    }
}

/**
 * 원문 페이지에서 og:image 추출
 */
export async function fetchOgImage(articleUrl: string): Promise<string | null> {
    try {
        const res = await fetchWithTimeout(articleUrl)
        if (!res || !res.ok) return null
        const contentType = res.headers.get('content-type') || ''
        if (!contentType.includes('text/html')) return null
        const html = (await res.text()).slice(0, 300000) // 앞부분만 검사

        const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
            || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
        if (!og) return null

        let imageUrl = og[1].trim()
        // 상대 경로 보정
        if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl
        else if (imageUrl.startsWith('/')) {
            const base = new URL(articleUrl)
            imageUrl = base.origin + imageUrl
        }
        if (!/^https?:\/\//.test(imageUrl)) return null
        return imageUrl
    } catch {
        return null
    }
}

/**
 * 구글 뉴스 링크 → 원문 해독 → og:image 추출 (전체 파이프라인)
 */
export async function resolveThumbnailFromGoogleNews(gnewsUrl: string): Promise<string | null> {
    const realUrl = await resolveGoogleNewsUrl(gnewsUrl)
    if (!realUrl) return null
    return await fetchOgImage(realUrl)
}

/** HTML 엔티티를 일반 텍스트로 디코딩 */
function decodeEntities(s: string): string {
    return s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * 원문 페이지에서 설명(요약) 추출: og:description → meta description → twitter:description
 * RSS 요약보다 완결된 2~3문장 요약을 제공하는 경우가 많다.
 */
export async function fetchOgDescription(articleUrl: string): Promise<string | null> {
    try {
        const res = await fetchWithTimeout(articleUrl)
        if (!res || !res.ok) return null
        const contentType = res.headers.get('content-type') || ''
        if (!contentType.includes('text/html')) return null
        const html = (await res.text()).slice(0, 300000)

        const patterns = [
            /<meta[^>]+property=["']og:description["'][^>]+content=(["'])([\s\S]*?)\1/i,
            /<meta[^>]+content=(["'])([\s\S]*?)\1[^>]+property=["']og:description["']/i,
            /<meta[^>]+name=["']description["'][^>]+content=(["'])([\s\S]*?)\1/i,
            /<meta[^>]+content=(["'])([\s\S]*?)\1[^>]+name=["']description["']/i,
            /<meta[^>]+name=["']twitter:description["'][^>]+content=(["'])([\s\S]*?)\1/i,
        ]
        let raw: string | null = null
        for (const p of patterns) {
            const m = html.match(p)
            if (m) { raw = m[2]; break }
        }
        if (!raw) return null

        const text = decodeEntities(raw)
        return text.length >= 20 ? text : null
    } catch {
        return null
    }
}

/**
 * 구글 뉴스 링크 → 원문 해독 → og:description 추출 (전체 파이프라인)
 */
export async function resolveDescriptionFromGoogleNews(gnewsUrl: string): Promise<string | null> {
    const realUrl = await resolveGoogleNewsUrl(gnewsUrl)
    if (!realUrl) return null
    return await fetchOgDescription(realUrl)
}
