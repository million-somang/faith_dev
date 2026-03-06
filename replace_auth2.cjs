const fs = require('fs');
const path = 'c:/project/faithportal/apps/api-server/src/routes/admin-ui.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace the specific if block with the async check block
const regex = /if \(!authToken \|\| authToken === 'true' \|\| \(userRole !== 'admin' && userLevel < 6\)\) \{\s*alert\('관리자 권한이 필요합니다\.'\);\s*window\.location\.href = '\/login\?redirect=' \+ encodeURIComponent\(window\.location\.pathname\);\s*\}/g;

const newCheck = `if (!authToken || authToken === 'true' || (userRole !== 'admin' && userLevel < 6)) {
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
                            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                        }
                    })
                    .catch(() => {
                        alert('관리자 권한이 필요합니다.');
                        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                    });
            } else`;

content = content.replace(regex, newCheck);
fs.writeFileSync(path, content, 'utf8');
console.log('Replaced successfully.');
