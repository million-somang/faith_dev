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
