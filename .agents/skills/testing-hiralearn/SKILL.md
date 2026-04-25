# Testing HiraLearn

## Overview
HiraLearn is a React SPA (Vite + React 18 + TypeScript) with Supabase backend. It uses HashRouter (`/#/route`), Zustand for state, and Tailwind CSS.

## Dev Server
```bash
cd /path/to/HiraLearn
npm run dev
# Runs on http://localhost:5173 (or next available port)
```

## Route Structure

### Public Routes (testable without Supabase credentials)
- `/` — Landing page (LandingPage)
- `/login` — Auth page (sign in form)
- `/register` — Auth page (sign up form)
- `/pricing` — Pricing plans page

### Protected Routes (require Supabase auth session)
- `/dashboard` — Main dashboard
- `/courses` — Courses listing
- `/lessons/:lessonId` — Individual lesson page
- `/games` — Games page
- `/profile` — User profile
- `/admin` — Admin panel (adminOnly)
- `/onboarding` — New user onboarding

ProtectedRoute redirects unauthenticated users to `/login`.

## Testing Without Supabase Credentials
The app has a 3-second auth timeout fallback — if Supabase is not configured, it proceeds as guest after the timeout. Public routes work fully. Protected routes redirect to `/login`.

Expected console warning without credentials:
```
HiraLearn Warning: Supabase credentials missing. App will run in demo mode.
```

## Key Test Scenarios

### 1. Landing Page Smoke Test
- Navigate to root URL
- Verify "The Path of Mastery" heading renders
- Verify navbar shows: HiraLearn logo, The Path, Features, Pricing, Start the Path
- Check no console errors about missing modules

### 2. Navbar Routing
- Desktop: Click "Start the Path" button → should navigate to `/#/login`
- Mobile (375×812): Open hamburger menu → click "Start the Path" → should navigate to `/#/login`
- Both desktop and mobile links are `<Link to="/login">` in `src/components/Navbar.tsx`

### 3. Mobile Viewport Testing
Use Playwright via CDP to test mobile layouts:
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp("http://localhost:29229")
    context = browser.new_context(viewport={"width": 375, "height": 812})
    page = context.new_page()
    page.goto("http://localhost:5173/")
    # Hamburger menu: page.locator("button.md\\:hidden")
```

### 4. Protected Route Redirect
- Navigate to `/#/dashboard` without auth
- Should redirect to `/#/login`

### 5. Pricing Page
- Navigate to `/#/pricing`
- Verify 3 plans render: Student (7,500 ₸), Master Pro (14,500 ₸), Early Access (95,000 ₸)
- Prices are in KZT (tenge)

### 6. Console Error Check
Use Playwright to capture console messages:
```python
console_messages = []
page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
page.on("pageerror", lambda err: console_messages.append(f"[PAGE_ERROR] {err}"))
```
Expected: 0 errors. Only warnings about Supabase credentials and info logs.

## Testing with Supabase Auth
To test protected routes (dashboard, courses, lessons, games, profile), you need:
- A `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- A valid user account in the Supabase project

Without these, ProgressCard and RoadmapPath routing can only be verified by code review.

## Devin Secrets Needed
- `VITE_SUPABASE_URL` — Supabase project URL (for authenticated route testing)
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key (for authenticated route testing)

## Build & Lint Commands
```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # tsc && vite build && node patch-build.js
```
