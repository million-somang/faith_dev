const fs = require('fs');
const backupPath = 'c:/project/faithportal/backup_20260220/src/app.tsx';
const targetPath = 'c:/project/faithportal/apps/api-server/src/routes/admin-ui.ts';

const backupContent = fs.readFileSync(backupPath, 'utf8');
const lines = backupContent.split('\n');
// app.get('/admin/news') is approx 14165 to 14945
// Let's accurately slice it
const startIdx = lines.findIndex(l => l.includes("app.get('/admin/news', async (c) => {"));
let endIdx = -1;
for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].includes("app.get('/mypage', optionalAuth, (c) => {")) {
        endIdx = i - 1;
        break;
    }
}

if (startIdx !== -1 && endIdx !== -1) {
    let extracted = lines.slice(startIdx, endIdx).join('\n');
    // Replace app.get with adminUi.get
    extracted = extracted.replace("app.get('/admin/news'", "adminUi.get('/admin/news'");

    // Apply the auth fallback fix to the extracted route as well
    const oldCheck = `            if (!token || userLevel < 6) {
                alert('관리자 권한이 필요합니다.');
                location.href = '/';
            }`;

    const newCheck = `            if (!token || token === 'true' || userLevel < 6) {
                // Async fallback sync
                fetch('/api/auth/me', { credentials: 'include' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.loggedIn && (data.user.role === 'admin' || data.user.level >= 6)) {
                            localStorage.setItem('auth_token', btoa(data.user.id + ':faith'));
                            localStorage.setItem('user_email', data.user.email);
                            localStorage.setItem('user_role', data.user.role);
                            localStorage.setItem('user_level', data.user.level);
                            window.location.reload();
                        } else {
                            alert('관리자 권한이 필요합니다.');
                            window.location.href = 'http://localhost:5000/login?redirect=' + encodeURIComponent(window.location.pathname);
                        }
                    })
                    .catch(() => {
                        alert('관리자 권한이 필요합니다.');
                        window.location.href = 'http://localhost:5000/login?redirect=' + encodeURIComponent(window.location.pathname);
                    });
            } else`;

    extracted = extracted.replace(oldCheck, newCheck);

    let targetContent = fs.readFileSync(targetPath, 'utf8');
    targetContent += '\n\n' + extracted + '\n';
    fs.writeFileSync(targetPath, targetContent, 'utf8');
    console.log('Successfully extracted and appended news admin route.');
} else {
    console.log('Could not find boundaries.', startIdx, endIdx);
}
