export interface PublishPostPayload {
    id: string;
    platform: 'THREADS' | 'INSTAGRAM' | 'ALL';
    headline?: string;
    bodyText: string;
    firstComment?: string;
    imageUrl?: string;
}

export interface PublishResult {
    success: boolean;
    externalPostId?: string;
    isMock?: boolean;
    error?: string;
}

export async function publishToSocialMedia(payload: PublishPostPayload): Promise<PublishResult> {
    const threadsToken = process.env.THREADS_ACCESS_TOKEN?.trim();
    const igToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
    const igUserId = process.env.INSTAGRAM_ACCOUNT_ID?.trim();

    // 1. Meta API 토큰이 준비되지 않은 경우 -> 안전한 Mock(시뮬레이션) 모드로 처리
    if (!threadsToken && !igToken) {
        console.log(`[MetaPublisher:MOCK] API 토큰 미설정 상태 - 시뮬레이션 발행 처리 [${payload.platform}] ID: ${payload.id}`);
        // 짧은 딜레이로 실제 발행 느낌 제공
        await new Promise(r => setTimeout(r, 600));

        const mockId = `mock_${payload.platform.toLowerCase()}_${Date.now()}`;
        return {
            success: true,
            externalPostId: mockId,
            isMock: true
        };
    }

    try {
        let externalId = '';

        // 2. Threads 발행 로직
        if (payload.platform === 'THREADS' || payload.platform === 'ALL') {
            if (threadsToken) {
                // 1단계: Threads 미디어/텍스트 컨테이너 생성
                const containerPayload: any = {
                    text: payload.bodyText,
                    access_token: threadsToken
                };
                if (payload.imageUrl && payload.imageUrl.startsWith('http')) {
                    containerPayload.media_type = 'IMAGE';
                    containerPayload.image_url = payload.imageUrl;
                } else {
                    containerPayload.media_type = 'TEXT';
                }

                const containerRes = await fetch('https://graph.threads.net/v1.0/me/threads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(containerPayload)
                });
                const containerData = await containerRes.json();
                if (!containerRes.ok || !containerData.id) {
                    throw new Error(`Threads Container Error: ${JSON.stringify(containerData)}`);
                }

                // 2단계: Threads 최종 게시
                const publishRes = await fetch('https://graph.threads.net/v1.0/me/threads_publish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        creation_id: containerData.id,
                        access_token: threadsToken
                    })
                });
                const published = await publishRes.json();
                if (!publishRes.ok || !published.id) {
                    throw new Error(`Threads Publish Error: ${JSON.stringify(published)}`);
                }

                externalId = published.id;

                // 3단계: 첫 댓글 (아웃링크) 자동 발행 (5초 딜레이)
                if (payload.firstComment && published.id) {
                    await new Promise(r => setTimeout(r, 5000));
                    try {
                        await fetch('https://graph.threads.net/v1.0/me/threads', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                media_type: 'TEXT',
                                text: payload.firstComment,
                                reply_to_id: published.id,
                                access_token: threadsToken
                            })
                        });
                    } catch (commentErr: any) {
                        console.error('[Threads] First comment failed:', commentErr.message);
                    }
                }
            }
        }

        // 3. Instagram 발행 로직
        if (payload.platform === 'INSTAGRAM' || payload.platform === 'ALL') {
            if (igToken && igUserId && payload.imageUrl && payload.imageUrl.startsWith('http')) {
                const igContainerRes = await fetch(`https://graph.facebook.com/v1.0/${igUserId}/media`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_url: payload.imageUrl,
                        caption: payload.bodyText,
                        access_token: igToken
                    })
                });
                const igContainer = await igContainerRes.json();
                if (!igContainerRes.ok || !igContainer.id) {
                    throw new Error(`Instagram Media Error: ${JSON.stringify(igContainer)}`);
                }

                const igPubRes = await fetch(`https://graph.facebook.com/v1.0/${igUserId}/media_publish`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        creation_id: igContainer.id,
                        access_token: igToken
                    })
                });
                const igPubData = await igPubRes.json();
                if (!igPubRes.ok || !igPubData.id) {
                    throw new Error(`Instagram Publish Error: ${JSON.stringify(igPubData)}`);
                }
                externalId = externalId ? `${externalId}, ${igPubData.id}` : igPubData.id;
            }
        }

        return {
            success: true,
            externalPostId: externalId || `meta_${Date.now()}`,
            isMock: false
        };
    } catch (error: any) {
        console.error('[MetaPublisher] Publish Error:', error);
        return {
            success: false,
            error: error.message || 'Meta API 발행 중 오류가 발생했습니다.'
        };
    }
}
