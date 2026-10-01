const { Hono } = require('hono');

async function test() {
    const tsx = require('tsx/cjs/api');
    // tsx 환경에서 marketing.routes.ts 가져오기
    const { marketingRoutes } = await import('../apps/api-server/src/routes/marketing.routes.ts');

    const app = new Hono();
    app.route('/', marketingRoutes);

    console.log('--- 1. Testing image route: webp_step1.png ---');
    const resWebp = await app.request('/uploads/marketing/screenshots/webp_step1.png');
    console.log('Status:', resWebp.status);
    console.log('Content-Type:', resWebp.headers.get('content-type'));
    console.log('Content-Length:', resWebp.headers.get('content-length'));

    console.log('\n--- 2. Testing image route: lotto_step2.png ---');
    const resLotto = await app.request('/uploads/marketing/screenshots/lotto_step2.png');
    console.log('Status:', resLotto.status);
    console.log('Content-Type:', resLotto.headers.get('content-type'));
    console.log('Content-Length:', resLotto.headers.get('content-length'));

    console.log('\n--- 3. Testing Threads API: /api/marketing/threads/calculator (ai=false) ---');
    const resCalc = await app.request('/api/marketing/threads/calculator?ai=false');
    console.log('Status:', resCalc.status);
    const calcData = await resCalc.json();
    console.log('Success:', calcData.success);
    console.log('Name:', calcData.data?.name);
    console.log('Images count:', calcData.data?.images?.length);
    console.log('Image URLs:', calcData.data?.imageUrls);
    console.log('Threads Headline:', calcData.data?.threads?.headline);
    console.log('Threads First Comment:', calcData.data?.threads?.firstComment);

    console.log('\n--- 4. Testing Threads API: /api/marketing/threads/lotto (ai=false) ---');
    const resLottoApi = await app.request('/api/marketing/threads/lotto?ai=false');
    const lottoData = await resLottoApi.json();
    console.log('Success:', lottoData.success);
    console.log('Slug:', lottoData.data?.slug);
    console.log('Name:', lottoData.data?.name);
    console.log('Image 1:', lottoData.data?.images?.[0]);
    console.log('Image 2:', lottoData.data?.images?.[1]);
    console.log('Image 3:', lottoData.data?.images?.[2]);

    console.log('\n--- 5. Testing Threads List API: /api/marketing/threads ---');
    const resList = await app.request('/api/marketing/threads');
    const listData = await resList.json();
    console.log('Total items:', listData.data?.total);
    console.log('First item:', listData.data?.items?.[0]);
}

test().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
