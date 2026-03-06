const fs = require('fs');

const adminUiPath = 'c:/project/faithportal/apps/api-server/src/routes/admin-ui.ts';
let content = fs.readFileSync(adminUiPath, 'utf8');

const oldCheck = `            if (!authToken || authToken === 'true' || (userRole !== 'admin' && userLevel < 6)) {
                alert('관리자 권한이 필요합니다.');
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            }`;

const newCheck = `            if (!authToken || authToken === 'true' || (userRole !== 'admin' && userLevel < 6)) {
                document.body.style.opacity = '0.5';
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
                            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                        }
                    })
                    .catch(() => {
                        alert('관리자 권한이 필요합니다.');
                        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                    });
                
                // 실행 중단을 위해 에러 발생 (아래 코드 무시)
                throw new Error('Auth Sync in progress...');
            }`;

content = content.replaceAll(oldCheck, newCheck);
fs.writeFileSync(adminUiPath, content, 'utf8');
console.log('Successfully replaced auth checks.');
