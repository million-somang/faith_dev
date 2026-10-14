# Antigravity Rules

## 1. Strictly Prohibited Repetitive Output Patterns
- NEVER generate repeating lists of execution statuses, command feedback, or wait times such as ( push ) 실행: 10초., ( netstat ) 실행: 5초. in any response.
- Do not output simulated CLI progress blocks inside your thoughts or response text.

## 2. Mandatory `rule.md` Review During Planning (`/plan`) & Page Layout Width Standard
- Whenever creating, reviewing, or executing a plan (`/plan` slash command or `writing-plans` skill), you MUST FIRST read and verify `d:\project\faithportal\rule.md` and ensure every requirement in `rule.md` is strictly satisfied in the plan.
- Every page in `apps/next-portal` MUST use the exact same root container width and horizontal padding as the header (`PortalNavbar.tsx`): `max-w-6xl mx-auto px-3 sm:px-4 w-full`. Never use `max-w-4xl`, `max-w-5xl`, or mismatched horizontal padding (`sm:px-6`, `lg:px-8`) on page root containers.