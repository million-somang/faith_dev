export interface MiniAppMeta {
    name: string;
    slug: string;
    description: string;
    app_url: string;
    category?: string;
}

export interface MarketingContentResult {
    headline: string;
    tag: string;
    subtitle: string;
    threadsBody: string;
    threadsFirstComment: string;
    instagramCaption: string;
    instagramHashtags: string[];
}

const DEFAULT_GEMINI_KEY = 'AIzaSyCKlbG2OPMoT82FzyOqDzXRL78QZ6XuYyQ';

export async function generateMarketingContent(meta: MiniAppMeta): Promise<MarketingContentResult> {
    const apiKey = process.env.GEMINI_API_KEY || DEFAULT_GEMINI_KEY;
    const fullServiceUrl = meta.app_url.startsWith('http') 
        ? meta.app_url 
        : `https://veranex.app${meta.app_url.startsWith('/') ? '' : '/'}${meta.app_url}`;

    const prompt = `
당신은 베라넥스(Veranex / FaithPortal)의 SNS 바이럴 마케팅 총괄 디렉터입니다.
아래의 미니앱/웹도구를 스레드(Threads)와 인스타그램(Instagram)에 원클릭 확산시키기 위한 고효율 마케팅 카피와 카드뉴스 문구를 작성해주세요.

[서비스 정보]
- 서비스명: ${meta.name}
- 슬러그: ${meta.slug}
- 설명: ${meta.description}
- 카테고리: ${meta.category || '유틸리티'}
- 서비스 접속 URL: ${fullServiceUrl}

[채널별 카피 작성 가이드라인]
1. 카드뉴스용 (1080x1080 이미지에 들어갈 문구):
   - headline: 20자 이내의 강력한 후킹 제목 (예: "퇴직금 3초 만에 실수령액 조회", "올해 내 도화살 지수는?")
   - subtitle: 35자 이내의 부가 설명 (예: "로그인 없이 브라우저에서 즉시 실행", "공식 세법 기준 100% 무료 계산")
   - tag: 10자 이내 카테고리 뱃지 (예: "직장인 필수", "무료 사주", "킬링타임")

2. 스레드(Threads) 최적화:
   - threadsBody: 본문에는 외부 링크(URL)를 절대 넣지 마세요 (스레드 알고리즘 페널티 방지).
     첫 2줄은 스크롤을 멈추게 하는 강력한 빌더/사용자 화법 후킹 문구.
     핵심 혜택을 불렛포인트(•) 3개로 요약.
     마지막은 댓글을 유도하는 질문(예: "여러분은 퇴직금 얼마나 예상하시나요?")으로 마무리.
     마지막 줄에 단일 해시태그 1개 (예: #직장인꿀팁, #무료유틸리티).
   - threadsFirstComment: 스레드 첫 댓글에 들어갈 바로가기 아웃링크 및 안내 문구. (예: "👉 로그인 없이 바로 계산해보실 수 있어요! \n${fullServiceUrl}")

3. 인스타그램(Instagram) 최적화:
   - instagramCaption: 시각적/감성적 큐레이션 화법 ("알아두면 평생 써먹는 필수 사이트"). 프로필 상단 링크(Link in bio) 방문 유도 문구 포함.
   - instagramHashtags: 카테고리 및 타겟 페르소나와 직결된 해시태그 10~15개 배열.

반드시 아래 JSON 형식으로만 응답해주세요. 마크다운 백틱이나 추가 설명 없이 순수 JSON만 반환해야 합니다:
{
  "headline": "...",
  "subtitle": "...",
  "tag": "...",
  "threadsBody": "...",
  "threadsFirstComment": "...",
  "instagramCaption": "...",
  "instagramHashtags": ["해시태그1", "해시태그2"]
}
`;

    const modelName = 'gemini-3.6-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: 'application/json'
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API Error (${response.status}): ${errText}`);
        }

        const data: any = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidate) {
            throw new Error('Gemini API 반환 결과에 텍스트가 없습니다.');
        }

        const cleanJson = candidate.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleanJson);

        return {
            headline: parsed.headline || `${meta.name} 즉시 실행`,
            subtitle: parsed.subtitle || (meta.description ? meta.description.slice(0, 35) : '로그인 없이 브라우저에서 즉시 실행'),
            tag: parsed.tag || '무료 도구',
            threadsBody: parsed.threadsBody || `${meta.name}\n\n• 무료 실행\n• 간편한 사용\n\n써보시고 의견 남겨주세요!\n#베라넥스`,
            threadsFirstComment: parsed.threadsFirstComment || `👉 바로가기 링크: ${fullServiceUrl}`,
            instagramCaption: parsed.instagramCaption || `✨ ${meta.name}\n\n지금 프로필 링크에서 바로 확인해보세요!`,
            instagramHashtags: Array.isArray(parsed.instagramHashtags) ? parsed.instagramHashtags : ['#베라넥스', '#유용한사이트', '#꿀팁']
        };
    } catch (err: any) {
        console.error('[MarketingAI] Gemini API Generation Failed:', err.message);
        return {
            headline: `${meta.name} 3초 만에 무료 실행`,
            subtitle: meta.description ? meta.description.slice(0, 35) : '로그인 없이 브라우저에서 즉시 실행',
            tag: meta.category ? meta.category.toUpperCase() : '무료 도구',
            threadsBody: `제가 필요해서 직접 만든 [${meta.name}]입니다.\n\n매번 번거롭게 찾기 귀찮아서 로그인 없이 브라우저에서 바로 쓸 수 있게 만들었습니다.\n\n• 100% 무료\n• 개인정보/가입 불필요\n• 모바일/PC 완벽 호환\n\n써보시고 개선할 점 있으면 댓글로 편하게 알려주세요!\n#생산성도구`,
            threadsFirstComment: `👉 [${meta.name}] 바로가기 링크:\n${fullServiceUrl}`,
            instagramCaption: `📌 알아두면 무조건 써먹는 [${meta.name}]\n\n로그인이나 설치 없이 바로 사용할 수 있는 실용적인 웹 툴입니다.\n\n링크는 프로필 상단(Link in bio)에 걸어두었습니다! 저장해두고 필요할 때 꺼내 쓰세요.`,
            instagramHashtags: ['#베라넥스', '#직장인꿀팁', '#생산성도구', '#무료유틸리티', '#생활꿀팁', '#알아두면좋은사이트']
        };
    }
}
