const fs = require('fs');

let content = fs.readFileSync('c:/project/faithportal/apps/api-server/src/routes/admin-ui.ts', 'utf8');

const oldAuth = `            // 인증 체크
            const userRole = localStorage.getItem('user_role') || 'user';
            const userLevel = parseInt(localStorage.getItem('user_level') || '0');
            
            // 관리자 권한 체크 (role = 'admin' 또는 level >= 6)
            const authToken = localStorage.getItem('auth_token');
            if (!authToken || authToken === 'true' || (userRole !== 'admin' && userLevel < 6)) {
                alert('관리자 권한이 필요합니다.');
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }`;

const newAuthInit = `            // 인증 체크
            async function verifyAdminAccess() {
                try {
                    const res = await fetch('/api/auth/me');
                    const data = await res.json();
                    if (!data.loggedIn || !data.user) throw new Error();
                    if (data.user.role !== 'admin' && data.user.level < 6) {
                        alert('관리자 권한이 필요합니다.');
                        window.location.href = '/';
                        return false;
                    }
                    localStorage.setItem('auth_token', btoa(data.user.id + ':faith'));
                    localStorage.setItem('user_email', data.user.email);
                    localStorage.setItem('user_role', data.user.role);
                    localStorage.setItem('user_level', data.user.level.toString());
                    return true;
                } catch(e) {
                    alert('로그인이 필요합니다.');
                    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                    return false;
                }
            }`;

const newAuthStats = `            // 인증 체크
            verifyAdminAccess().then(ok => { if(ok) {`;

content = content.replace(new RegExp(oldAuth.replace(/[.*+?^$\{\}()|[\\]\\\\]/g, '\\\\$&'), 'g'), newAuthStats);

fs.writeFileSync('c:/project/faithportal/apps/api-server/src/routes/admin-ui.ts', content);
console.log('Admin Auth logic updated');
