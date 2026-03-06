const http = require('http');

async function testAuth() {
    try {
        const resLogin = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@faith.kr', password: 'password' })
        });

        let cookie = '';
        if (resLogin.headers.has('set-cookie')) {
            cookie = resLogin.headers.get('set-cookie');
            console.log('Login Set-Cookie:', cookie);
        } else {
            console.log('Login failed or no cookie returned');
            const data = await resLogin.json();
            console.log('Login Response:', data);

            // Try with 'admin1234'
            const resLogin2 = await fetch('http://localhost:4000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'admin@faith.kr', password: 'admin1234' })
            });
            if (resLogin2.headers.has('set-cookie')) {
                cookie = resLogin2.headers.get('set-cookie');
                console.log('Login 2 Set-Cookie:', cookie);
            } else {
                const data2 = await resLogin2.json();
                console.log('Login 2 Response:', data2);
                return;
            }
        }

        const resMe = await fetch('http://localhost:4000/api/auth/me', {
            headers: { 'Cookie': cookie }
        });
        const meData = await resMe.json();
        console.log('Auth Me API Response:', JSON.stringify(meData));

    } catch (e) {
        console.error(e);
    }
}
testAuth();
