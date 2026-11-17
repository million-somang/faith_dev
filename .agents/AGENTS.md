# Antigravity Rules

## 1. Strictly Prohibited Repetitive Output Patterns
- NEVER generate repeating lists of execution statuses, command feedback, or wait times such as ( push ) 실행: 10초., ( netstat ) 실행: 5초. in any response.
- Do not output simulated CLI progress blocks inside your thoughts or response text.

## 2. Mandatory `rule.md` Review During Planning (`/plan`) & Page Layout Width Standard
- Whenever creating, reviewing, or executing a plan (`/plan` slash command or `writing-plans` skill), you MUST FIRST read and verify `d:\project\faithportal\rule.md` and ensure every requirement in `rule.md` is strictly satisfied in the plan.
- Every page in `apps/next-portal` MUST use the exact same root container width and horizontal padding as the header (`PortalNavbar.tsx`): `max-w-6xl mx-auto px-3 sm:px-4 w-full`. Never use `max-w-4xl`, `max-w-5xl`, or mismatched horizontal padding (`sm:px-6`, `lg:px-8`) on page root containers.

## 3. Zero-Tolerance for Mock/Dummy Data (가짜/목업 데이터 생성 절대 금지)
- NEVER generate fake, mock, dummy, or seed data (`MOCK_*`, fake leaderboards, hardcoded dummy lists) in any frontend components, sub-apps, or backend API responses.
- All dynamic data MUST be backed by real database records or authentic API integrations.
- When no data exists (initial state or empty query), you MUST render a clean, honest, and polished Empty State UI (e.g., "아직 등록된 기록이 없습니다.") or skeleton loading, NEVER fake entries.

## 4. Protected Google Drive Background Audio Streaming Engine (절대 수정 금지 🔒)
- NEVER modify, refactor, or remove the MP4 audio-only streaming engine in `apps/api-server/src/controllers/drive-stream.controller.ts` (`neutralizeMp4VideoBoxesInBuffer`, `createAudioOnlyMp4Stream`, and the `mode === 'audio'` `audio/mp4` + HTTP 206 Range streaming handler in `DriveStreamController.streamVideo`).
- NEVER unmount or replace the global `<audio>` element in `apps/next-portal/src/context/DrivePlayerContext.tsx` during mobile screen lock (`visibilitychange`), and NEVER apply `display: none` (`className="hidden"`) to it.

## 5. Strict Prompt Scope Lock & Zero Unsolicited Code Changes (요청 프롬프트 외 타 코드·파일·프로세스 절대 수정 금지 🔒)
- **ONLY Touch Explicitly Requested Code**: You MUST NEVER modify, refactor, reformat, rename, or "clean up" any file, component, function, style, or import outside the exact scope explicitly requested in the user's prompt.
- **File Whitelist Enforcement**: Only edit files explicitly approved by the user for the current task. If achieving the user's goal requires touching any shared utility, backend service, database logic, or unmentioned component, you MUST STOP and ask for explicit user permission (`"[파일명]의 [특정 부분]을 수정해야 하는데 진행할까요?"`) BEFORE making the edit.
- **Minimal Surgical Patch & Pre-Commit Diff Check**: Edit only the minimum necessary lines. Before running `git add` / `git commit` or deploying, ALWAYS verify `git status` / `git diff --stat` to ensure zero unrequested files are touched.
- **Process & Service Isolation on Deploy**:
  - When only frontend (`apps/next-portal` or mini-apps) code is modified, NEVER restart `faith-api` (backend API server), preventing any momentary API/news interruption.
  - When backend (`apps/api-server`) changes are explicitly approved and require restarting `faith-api`, ALWAYS restart `faith-api` first and verify `http://127.0.0.1:4200/health` is responding BEFORE restarting `faith-portal`.
