# HiraLearn Testing Skill

## Overview
HiraLearn is a structured coding education SPA (React 18 + TypeScript + Vite + Tailwind CSS + Supabase + Zustand). It uses hash-based routing (`/#/` URLs) and Supabase for auth/database.

## Local Dev Setup
```bash
cd /home/ubuntu/repos/HiraLearn
npm install
npm run dev  # Vite on localhost:5173
```

## Devin Secrets Needed
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/publishable key
- Optional: Supabase service_role key for creating test users bypassing email confirmation
- Optional: `VITE_PADDLE_CLIENT_TOKEN` for payment testing

## Key Routes (HashRouter)
| Route | Auth Required | Description |
|-------|--------------|-------------|
| `/#/` | No | Landing page |
| `/#/login` | No | Login form |
| `/#/register` | No | Registration form |
| `/#/pricing` | No | Pricing/subscription page |
| `/#/onboarding` | Yes | New user onboarding (4 steps) |
| `/#/dashboard` | Yes | Main dashboard with courses |
| `/#/courses` | Yes | Course catalog |
| `/#/lessons/:id` | Yes | Individual lesson view |
| `/#/games` | Yes | Arcade/mini-games |
| `/#/profile` | Yes | User profile + subscription |
| `/#/admin` | Yes (admin) | Admin dashboard |
| `/#/admin/lessons` | Yes (admin) | Admin lesson management |

## Testing Without Auth
These pages can be tested without logging in:
- Landing page (`/#/`)
- Login page (`/#/login`) — test error messages
- Pricing page (`/#/pricing`)
- Favicon (check `/favicon.svg` returns 200)

## Testing With Auth
Requires a Supabase account. Potential blockers:
- **Email rate limits**: Supabase may rate-limit signup emails (`over_email_send_rate_limit`). If this happens, you cannot create new test accounts.
- **Email validation**: Supabase may reject certain email domains (e.g., `@test.com`). Use `@gmail.com` or similar real domains.
- **Email confirmation**: If enabled, new accounts require email verification before login works.
- **Workaround**: If you have the Supabase service_role key, you can create users via the admin API bypassing email confirmation.

## Lint & Type Check
```bash
npx tsc --noEmit  # TypeScript strict mode
```
No ESLint config is present — rely on TypeScript for code quality checks.

## i18n
The app supports Russian (default) and English. Language toggle is in the top-right corner. Auth error messages are translated — test with Russian to verify translations work.

## Key Testing Patterns
1. **Auth error translation**: Enter wrong credentials on login → expect Russian error text "Неверный email или пароль."
2. **Onboarding**: New user → 4-step wizard (level, goal, time, style) → verify last step saves
3. **Progress bar**: Sidebar shows XP-based dynamic width, not hardcoded 33%
4. **Profile subscription**: Shows actual plan from DB ("Бесплатный" for free users)
5. **Sidebar logout**: Click logout → navigates to `/#/login`
6. **Course navigation**: Course card click → navigates to `/dashboard?course=<slug>`

## Known Issues (as of April 2026)
- Dashboard only shows modules for the first course
- Admin "Create Lesson" button is disabled (no creation UI)
- Kaspi "I've Paid" button is just `alert()` with no verification
- XP updates are client-side only (manipulable via DevTools)
- React Router v7 future flag deprecation warnings in console
