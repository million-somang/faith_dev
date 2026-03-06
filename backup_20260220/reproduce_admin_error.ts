
import { fetch } from 'undici';

async function reproduceError() {
    try {
        console.log('1. 관리자 로그인 시도...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'sukman1@naver.com', password: 'test' })
        });

        if (!loginRes.ok) {
            console.error('로그인 실패:', loginRes.status, await loginRes.text());
            return;
        }

        const loginData = await loginRes.json() as any;
        console.log('로그인 성공. 토큰:', loginData.token); // 토큰 확인 (보통 쿠키나 헤더에 사용)

        // 쿠키가 설정되었는지 확인
        const reqHeaders: Record<string, string> = {};
        // Hono 세션 미들웨어는 보통 쿠키를 사용하지만, 여기서는 auth.ts를 보니 헤더(Authorization)를 쓸 수도 있음.
        // admin라우트는 'requireAdmin' 미들웨어 사용 -> auth.ts 확인 결과 'Authorization' 헤더에 'Bearer token' 필요
        // 또는 쿠키?
        // src/middleware/auth.ts를 다시 확인해야 정확함. 
        // 하지만 login 응답에 token이 있다면 헤더에 넣어본다.

        /* 
           참고: admin.ts의 requireAdmin은 헤더의 Authorization을 본다? 
           이전 view_code_item 결과를 보면:
           const authHeader = c.req.header('Authorization')
           if (authHeader) { ... }
        */

        // 로그인 응답에 토큰이 없거나, 세션 기반일 수 있음. 
        // set-cookie 헤더 확인
        const cookie = loginRes.headers.get('set-cookie');
        if (cookie) {
            reqHeaders['Cookie'] = cookie;
            console.log('쿠키 설정됨:', cookie);
        }

        if (loginData.token) {
            reqHeaders['Authorization'] = `Bearer ${loginData.token}`;
        }

        // admin.ts의 requireAdmin 구현을 보면 Base64 토큰을 로컬스토리지에서 가져와서 헤더에 넣는 방식일 수도 있음.
        // 클라이언트 로직(layout.ts syncAuth)을 보면 localStorage.getItem('auth_token')을 헤더에 넣는 로직이 있을 것.
        // 하지만 여기서는 서버 사이드 렌더링(/admin/news) 요청이므로, 
        // view 라우트는 보통 쿠키 세션을 따르거나, 헤더 인증을 요구하지 않을 수 있음 (미들웨어 설정에 따라).
        // src/index.tsx의 /admin/news 라우트엔 별도 미들웨어가 안 보임.
        // app.get('/admin/news', async (c) => { ... }) -> 미들웨어 없음?
        // 코드(Step 218) 라인 14093: app.get('/admin/news', async (c) => { ... }) 
        // 미들웨어가 명시되어 있지 않음! 
        // 그렇다면 누구나 접근 가능하거나, 내부에서 세션 검사를 할 것임.
        // 라인 14093 아래를 보면 인증 검사 로직이 안 보임 (Step 218에서는).
        // 일단 그냥 요청해본다.

        console.log('2. 뉴스 관리자 페이지 요청 (/admin/news)...');
        const pageRes = await fetch('http://localhost:5000/admin/news', {
            headers: reqHeaders
        });

        console.log('응답 상태 코드:', pageRes.status);
        const text = await pageRes.text();

        if (pageRes.ok) {
            console.warn('페이지 로드 성공.');
            console.warn('HTML 전체 길이:', text.length);
            // 전체 출력 (디버깅용) - redirect to file
            console.log(text);
        } else {
            console.warn('페이지 로드 실패:', pageRes.status, pageRes.statusText);
            console.warn('에러 본문:', text);
        }

    } catch (error) {
        console.error('오류 발생:', error);
    }
}

reproduceError();
