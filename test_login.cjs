const http = require('http');

// Test via Vite proxy (port 5000)
const data = JSON.stringify({ email: 'sukman@naver.com', password: 'test1234' });

const req = http.request({
    hostname: 'localhost',
    port: 5000,  // Through Vite dev server proxy
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
    },
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log('=== Via Vite proxy (port 5000) ===');
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
        console.log('Set-Cookie:', res.headers['set-cookie']);
    });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
