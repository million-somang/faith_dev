
async function testAdminAccess() {
    const meUrl = 'http://localhost:5000/api/auth/me';
    const sessionId = 'debug-session-admin-fixed';

    try {
        console.log('Using Session ID:', sessionId);
        const cookieHeader = `session_id=${sessionId}`;

        // 2. Check /api/auth/me
        console.log('Checking /api/auth/me...');
        const meRes = await fetch(meUrl, {
            headers: { 'Cookie': cookieHeader }
        });
        const meData = await meRes.json();
        console.log('User Profile:', JSON.stringify(meData, null, 2));

        if (meData.user && meData.user.role === 'admin') {
            console.log('✅ Admin verification SUCCESS: API returns role="admin"');
        } else {
            console.log('❌ Admin verification FAILED: API returns role="' + (meData.user?.role || 'undefined') + '"');
        }

    } catch (error) {
        console.error('Test error:', error);
    }
}

testAdminAccess();
