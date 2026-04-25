const fs = require('fs');
const filePath = 'c:\\project\\faithportal\\apps\\api-server\\src\\routes\\admin-ui.ts';

let content = fs.readFileSync(filePath, 'utf-8');

// 정규식으로 모든 클라이언트 인증 체크 블록을 찾아서 교체
// 패턴: "// 인증 체크" ~ "} else" 까지의 전체 블록

const regex = /\/\/ 인증 체크\s*\r?\n\s*const userRole = localStorage\.getItem\('user_role'\)[^]*?\.catch\(\(\) => \{\s*\r?\n\s*alert\('관리자 권한이 필요합니다\.'\);\s*\r?\n\s*window\.location\.href = '\/login\?redirect=' \+ encodeURIComponent\(window\.location\.pathname\);\s*\r?\n\s*\}\);\s*\r?\n\s*\} else/g;

const replacement = `// 인증 정보 동기화 (서버사이드에서 이미 인증 완료)
            const authToken = localStorage.getItem('auth_token');
            const token = authToken;
            if (!authToken || authToken === 'true') {
                fetch('/api/auth/me', { credentials: 'include' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.loggedIn) {
                            localStorage.setItem('auth_token', btoa(data.user.id + ':faith'));
                            localStorage.setItem('user_email', data.user.email);
                            localStorage.setItem('user_role', data.user.role || 'user');
                            localStorage.setItem('user_level', String(data.user.level || 0));
                            document.getElementById('admin-name').textContent = data.user.email;
                        }
                    }).catch(() => {});
            }`;

const matches = content.match(regex);
console.log(`발견된 패턴: ${matches ? matches.length : 0}곳`);

content = content.replace(regex, replacement);
fs.writeFileSync(filePath, content, 'utf-8');

// 남은 alert 확인
const remaining = (content.match(/alert\('관리자 권한이 필요합니다\.'\)/g) || []).length;
console.log(`남은 alert('관리자 권한...'): ${remaining}곳`);
