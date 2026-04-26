# HiraLearn Testing Skill

## Overview
HiraLearn is a structured coding education SPA (React 18 + TypeScript + Vite + Tailwind CSS + Supabase + Zustand). It uses hash-based routing (`/#/` URLs) and Supabase for auth/database.

## Local Dev Setup
```bash
cd /home/ubuntu/repos/HiraLearn
npm install
npm run dev  # Vite on localhost:5173
```
Requires `.env` file with Supabase credentials. If no `.env` exists, you can extract Supabase URL and key from the deployed bundle:
```bash
# Extract Supabase URL from deployed site
curl -s "https://<deployed-url>/index.html" | grep -oP 'https://[a-z0-9]+\.supabase\.co' | head -1
# Extract JWT key from deployed site
curl -s "https://<deployed-url>/index.html" | grep -oP 'eyJ[A-Za-z0-9_/+=\-]+\.eyJ[A-Za-z0-9_/+=\-]+\.[A-Za-z0-9_/+=\-]+' | head -1
```

## Build & Deploy for Testing
```bash
npm run build  # Outputs to dist/
# Then use Devin's deploy tool with command="frontend" dir="dist/"
```
The build uses `vite-plugin-singlefile` so everything is inlined into `dist/index.html`.

## Devin Secrets Needed
- `VITE_SUPABASE_URL` — Supabase project URL (e.g. `https://pckydjhjvunvgekppqqd.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/publishable key (JWT)
- Optional: Supabase service_role key for creating test users bypassing email confirmation
- Optional: `VITE_PADDLE_CLIENT_TOKEN` for payment testing

## Supabase Schema Notes
The actual database schema may differ from the TypeScript types in `src/types/database.ts`. Always verify with direct API queries:
```bash
curl -s "${SUPABASE_URL}/rest/v1/<table>?select=*&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

**Known schema differences:**
- `profiles` table does NOT have `last_active_at` column — use `updated_at` instead
- `admin_user_list` view does not exist — the app falls back to querying `profiles` directly
- `error_logs`, `page_metrics`, `payments` tables may not exist — the admin console code handles this gracefully
- `subscriptions` table exists and supports upsert for Kaspi payments

**Profiles table actual columns:** `id, username, full_name, avatar_url, role, level, xp, streak, current_goal, daily_minutes, explanation_style, created_at, updated_at`

## Key Routes (HashRouter)
| Route | Auth Required | Description |
|-------|--------------|-------------|
| `/#/` | No | Landing page |
| `/#/login` | No | Login form |
| `/#/register` | No | Registration form |
| `/#/pricing` | No | Pricing/subscription page |
| `/#/onboarding` | Yes | New user onboarding (4 steps) |
| `/#/dashboard` | Yes | Main dashboard with courses |
| `/#/dashboard?course=<slug>` | Yes | Dashboard filtered to specific course |
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
- **RLS**: After login, the Supabase client uses the user's JWT (authenticated role), not the anon/service_role key. RLS policies apply to all queries. The admin console stats use `profiles` count which works, but detailed selects may be blocked by RLS.

## Admin Console Testing
The admin console at `/#/admin` has several sections:
- **Stats cards**: Users count, revenue, system pulse, visitors, errors
- **System Pulse chart**: Shows page load times (requires `page_metrics` table)
- **Errors chart**: Shows error counts (requires `error_logs` table)
- **Users table**: Lists all users with name, role, level, XP, activity

**Important**: The admin user table relies on a fallback chain:
1. First tries `admin_user_list` view (may not exist)
2. Falls back to `profiles` table query
3. The fallback query must use columns that actually exist in `profiles` (check schema notes above)

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
3. **Onboarding redirect**: If `profile.current_goal` is set, OnboardingPage redirects to `/dashboard` immediately
4. **Progress bar**: Sidebar shows XP-based dynamic width, not hardcoded 33%
5. **Profile subscription**: Shows actual plan from DB ("Бесплатный" for free users)
6. **Sidebar logout**: Click logout → navigates to `/#/login`
7. **Course navigation**: Course card click → navigates to `/dashboard?course=<slug>`
8. **Kaspi payment**: Click plan → modal with phone number → "Я оплатил" → success banner (no alert)
9. **Profile settings**: Click Goal/Daily/Style row → navigates to `/onboarding`
10. **Admin user table**: Should show at least 1 user row (not "Пользователи не найдены")

## Known Issues (as of April 2026)
- Admin "Create Lesson" button is disabled (no creation UI)
- XP updates are client-side only (manipulable via DevTools)
- React Router v7 future flag deprecation warnings in console
- Several Supabase tables referenced in code may not exist: `error_logs`, `page_metrics`, `payments`, `admin_user_list` view
- The app uses HashRouter — direct URL navigation like `google-chrome "url/#/admin"` may redirect to dashboard; use sidebar navigation instead
