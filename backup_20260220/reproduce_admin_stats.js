import { fetch } from 'undici';
async function testAdminStats() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/stats', {
            headers: {
                'Authorization': 'Bearer MjpmYWl0aA==' // 2:faith (valid token from log)
            }
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Body:', JSON.stringify(data, null, 2));
    }
    catch (error) {
        console.error('Error:', error);
    }
}
testAdminStats();
