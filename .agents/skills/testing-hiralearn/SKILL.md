# HiraLearn Testing Skill

## Overview
HiraLearn is a structured coding education SPA (React 18 + TypeScript + Vite + Tailwind CSS + Supabase + Zustand). It uses hash-based routing (`/#/` URLs) and Supabase for auth/database.

## Repo layout (post-restructure)
- `frontend/` — Vite + React app (everything UI/build/lint).
- `backend/` — Supabase migrations, edge functions, seeds.
- Root `supabase` is a symlink → `backend/` so the Supabase CLI keeps working without flags.
- Root `package.json` proxies `dev`/`build`/`lint`/`typecheck` to `frontend/`.

## Local Dev Setup
```bash
cd /home/ubuntu/repos/HiraLearn
npm install --prefix frontend          # or simply: npm run install:frontend
npm run dev                            # ≡ npm run dev --prefix frontend (Vite on localhost:5173)
```
Requires `frontend/.env` file with Supabase credentials. If no `.env` exists, you can extract Supabase URL and key from the deployed bundle.

**Important**: The Netlify deploy serves JS/CSS as separate files (NOT inlined via vite-plugin-singlefile). To extract credentials, target the JS bundle:
```bash
# 1. Find the JS bundle filename from the HTML
curl -s "https://hiraoka.netlify.app/" | grep -oP 'src="/assets/index-[^"]+\.js"'
# 2. Extract Supabase URL from the JS bundle
curl -s "https://hiraoka.netlify.app/assets/index-<HASH>.js" | grep -oP 'https://[a-z0-9]+\.supabase\.co' | head -1
# 3. Extract anon key (JWT) from the JS bundle
curl -s "https://hiraoka.netlify.app/assets/index-<HASH>.js" | grep -oP 'eyJ[A-Za-z0-9_/+=\-]+\.eyJ[A-Za-z0-9_/+=\-]+\.[A-Za-z0-9_/+=\-]+' | head -1
```
The `npm run build` output (for APK) uses `vite-plugin-singlefile` and inlines everything into `frontend/dist/index.html`, but local `.env` may have placeholder values — always extract from the deployed site.

**Port fallback**: If port 5173 is in use, Vite will auto-select the next available port (e.g., 5174). Check the terminal output for the actual URL.

## Build & Deploy for Testing
```bash
npm run build                 # ≡ npm run build --prefix frontend; outputs to frontend/dist/
# Then use Devin's deploy tool with command="frontend" dir="frontend/dist/"
```

## Devin Secrets Needed
- `HIRALEARN_TEST_EMAIL` — Test account email (repo-scoped, non-sensitive)
- `HIRALEARN_TEST_PASSWORD` — Test account password (repo-scoped)
- Optional: `VITE_SUPABASE_URL` — Can be extracted from deployed bundle instead
- Optional: `VITE_SUPABASE_ANON_KEY` — Can be extracted from deployed bundle instead
- Optional: Supabase service_role key for bypassing RLS or creating test users
- Optional: `VITE_PADDLE_CLIENT_TOKEN` for payment testing

## Verifying Supabase Connection Before Testing
Before starting the dev server, verify the Supabase credentials work:
```bash
# Test auth with provided credentials
curl -s "https://<SUPABASE_URL>/auth/v1/token?grant_type=password" \
  -H "apikey: <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"<EMAIL>","password":"<PASSWORD>"}' | head -5
# Should return {"access_token":"eyJ...", ...}
```
If using a service_role key, you can query tables directly:
```bash
curl -s "https://<SUPABASE_URL>/rest/v1/profiles?select=id,full_name,level,xp,streak&limit=2" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

## Supabase Schema & Migration Notes
The actual database schema may differ from the TypeScript types in `frontend/src/types/database.ts`. Always verify with direct API queries:
```bash
curl -s "${SUPABASE_URL}/rest/v1/<table>?select=*&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

**Known schema differences:**
- `profiles` table might not have `last_active_at` column — use `updated_at` instead
- `admin_user_list` view may not exist — the app falls back to querying `profiles` directly
- `error_logs`, `page_metrics`, `payments` tables may not exist — the admin console code handles this gracefully
- `subscriptions` table exists and supports upsert for Kaspi payments
- `courses` table might not have `order_index` column — query without ordering

**Migration dependency**: The frontend code may reference Supabase RPC functions (e.g., `update_own_profile`, `complete_lesson`) that require migrations from `backend/migrations/` to be applied. If you get "Could not find the function" errors, the migration has not been run in Supabase SQL Editor. Check `backend/migrations/` for the relevant SQL file.

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

## ProfilePage Testing
The ProfilePage (`/#/profile`) is the most complex page. It was refactored into feature components:
- `features/profile/components/ProfileHero.tsx` — avatar, name, level, XP bar
- `features/profile/components/ProfileStats.tsx` — 2x2 grid (level, streak, lessons, XP)
- `features/profile/components/ProfileEditModal.tsx` — edit name, goal, daily, style via RPC
- `features/profile/components/AccountInfoCard.tsx` — user ID, email, role, status, plan
- `features/profile/hooks/useProfileData.ts` — all data fetching and calculations

Before testing, query Supabase to know the expected values:
```bash
# Get profile data (use auth token, not anon key for RLS-protected queries)
TOKEN=$(curl -s "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
curl -s "$SUPABASE_URL/rest/v1/profiles?select=*&id=eq.<USER_ID>" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $TOKEN"
curl -s "$SUPABASE_URL/rest/v1/user_progress?select=*&user_id=eq.<USER_ID>&status=eq.completed" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $TOKEN"
```

**Key things to verify on ProfilePage:**
- **Hero block**: Avatar (initial letter if no avatar_url), level badge, XP progress bar, days since `created_at`
- **XP progress bar**: Uses thresholds `[0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500]`. Calculate expected % from profile.level and profile.xp. The bar is capped at 100%.
- **Quick stats**: XP, streak, completed lessons count, level — all must match DB values
- **Next lesson**: Shows first incomplete lesson from current course with XP reward. Must be clickable and navigate to `/lessons/:id`
- **Learning path**: Shows course-scoped progress (not global). Verify % = completedInCourse / totalInCourse
- **Achievements**: `first_step` unlocked if completedCount >= 1, `ninja` if >= 5, `streak` if streak >= 3. Visual difference between locked/unlocked (star vs lock icon, opacity)
- **Streak block**: Shows actual streak count and motivational text
- **Settings rows**: Goal, daily minutes, explanation style — all from profile data
- **Recent activity**: Lists completed lessons with dates and XP rewards

**Sidebar XP bar must match ProfilePage XP bar** — both use the same threshold-based formula.

## Design System Testing
The app uses CSS custom properties for theming. Key things to verify:
- **Dark mode** (default): Deep dark background with subtle radial gradients, surface-1/2/glass card backgrounds, glow shadows on active elements
- **Light mode**: Toggle via sun/moon icon in sidebar footer. All text must remain readable, cards must have visible boundaries
- **i18n**: Toggle via RU/EN button in sidebar footer. The sidebar nav items, ProfilePage sections, and achievement names must all translate. The language toggle is in the bottom-left of the sidebar.

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
The app supports Russian (default) and English. Language toggle is in the sidebar footer (bottom-left "RU"/"EN" button). Auth error messages are translated — test with Russian to verify translations work.

## Key Testing Patterns
1. **Auth error translation**: Enter wrong credentials on login → expect Russian error text "Неверный email или пароль."
2. **Onboarding**: New user → 4-step wizard (level, goal, time, style) → verify last step saves
3. **Onboarding redirect**: If `profile.current_goal` is set, OnboardingPage redirects to `/dashboard` immediately
4. **Progress bar**: Sidebar shows XP-based dynamic width using threshold formula, not hardcoded values
5. **Profile subscription**: Shows actual plan from DB ("Бесплатный" for free users)
6. **Sidebar logout**: Click logout → navigates to `/#/login`
7. **Course navigation**: Course card click → navigates to `/dashboard?course=<slug>`
8. **Kaspi payment**: Click plan → modal with phone number → "Я оплатил" → success banner (no alert)
9. **Profile settings**: Click Goal/Daily/Style row → navigates to `/onboarding`
10. **Admin user table**: Should show at least 1 user row (not "Пользователи не найдены")
11. **Next lesson click**: ProfilePage next lesson card → navigates to `/lessons/:id` for the correct lesson
12. **Sidebar active state**: Active nav item has highlighted background with glow effect (spring animation)

## Known Issues (as of April 2026)
- Admin "Create Lesson" button is disabled (no creation UI)
- XP updates are client-side only (manipulable via DevTools)
- React Router v7 future flag deprecation warnings in console
- Several Supabase tables referenced in code may not exist: `error_logs`, `page_metrics`, `payments`, `admin_user_list` view
- The app uses HashRouter — direct URL navigation like `google-chrome "url/#/admin"` may redirect to dashboard; use sidebar navigation instead
- XP may exceed level threshold without auto-incrementing the level (DB data inconsistency) — the UI correctly caps the XP bar at 100%
- `courses` table might not have `order_index` column — avoid ordering by it in API queries
- RPC functions (`update_own_profile`, `complete_lesson`) might not exist if migrations haven't been applied — check `backend/migrations/` for the SQL and advise the user to apply it
