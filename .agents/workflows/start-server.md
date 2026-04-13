---
description: 서버 실행 워크플로우 - 서버를 실행할 때 반드시 이 워크플로우를 따를 것
---

# 서버 실행 워크플로우

// turbo-all

## 포트 매핑 (절대 변경 금지)

| 서비스 | 포트 | 비고 |
|--------|------|------|
| main-portal (Vite) | 5000 | 프론트엔드 진입점 |
| API 서버 (Hono) | 4200 | 백엔드 API (Windows 예약 포트 3901~4000 회피) |
| app-news | 5001 | 미니앱 |
| app-text-checker | 5011 | 미니앱 |
| app-tetris | 5012 | 미니앱 |
| app-sudoku | 5013 | 미니앱 |
| app-pyeong-calc | 5014 | 미니앱 |
| app-2048 | 5015 | 미니앱 |
| app-minesweeper | 5016 | 미니앱 |
| app-age-calc | 5017 | 미니앱 |
| app-dday-calc | 5018 | 미니앱 |
| app-calculator | 5019 | 미니앱 |
| app-json-formatter | 5020 | 미니앱 |
| app-base64-converter | 5021 | 미니앱 |
| app-svg-converter | 5022 | 미니앱 |

> ⚠️ **중요**: Windows가 포트 3901~4000 범위를 예약하고 있으므로 API 서버에 4000번 포트를 절대 사용하지 말 것!
> ⚠️ **중요**: main-portal(5000)과 API 서버(4200)는 다른 포트여야 함. 같은 포트를 쓰면 Vite 프록시가 자기 자신을 가리키는 루프 발생!

## 실행 순서

1. 기존에 실행 중인 node 프로세스가 있는지 확인하고 종료

```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

2. 각 앱의 `vite.config.js` 찌꺼기 파일 삭제 (vite.config.ts만 남겨야 함)

```powershell
Get-ChildItem -Path "c:\project\faithportal\apps" -Recurse -Filter "vite.config.js" | Remove-Item -Force
```

3. 프로젝트 루트에서 turbo dev 실행 (전체 앱 + API 서버 동시 시작)

```powershell
cd c:\project\faithportal
npm run dev
```

4. 실행 확인: 로그에서 다음 두 가지가 반드시 나타나야 함
   - `Server is running on port 4200` (API 서버)
   - `http://localhost:5000/` (main-portal)

## 문제가 발생할 경우

- **EACCES 에러**: `netsh interface ipv4 show excludedportrange protocol=tcp` 명령으로 Windows 예약 포트 확인
- **포트 충돌**: `netstat -ano | findstr :<포트번호>`로 점유 프로세스 확인 후 종료
- **프록시 루프**: main-portal의 vite.config.ts에서 `/api` 프록시 타겟이 `localhost:4200`인지 확인 (5000이면 안됨!)
