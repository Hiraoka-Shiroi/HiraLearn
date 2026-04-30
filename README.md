# HiraLearn

Structured path from zero to production-ready frontend projects with AI-guided scaffolding.

## Repo layout

```
HiraLearn/
├── frontend/                # Vite + React + TypeScript app
│   ├── src/
│   │   ├── pages/           # Страницы (Dashboard, Lesson, Profile, ...)
│   │   ├── features/        # Feature-модули (admin, profile, billing, ...)
│   │   ├── components/      # Общие компоненты (layout, auth, avatar)
│   │   ├── lib/             # Supabase client, сервисы, Firebase, утилиты
│   │   ├── store/           # Zustand stores (auth, theme)
│   │   ├── i18n/            # Переводы RU / EN
│   │   └── types/           # TypeScript типы
│   ├── public/
│   ├── package.json         # Фронтэндные зависимости
│   └── README.md
├── backend/                 # Supabase: миграции, edge функции, seeds
│   ├── migrations/          # SQL-миграции (применять по порядку дат)
│   ├── functions/           # Edge Functions (send-push, paddle-webhook)
│   ├── seeds/               # SQL-сиды (full_content_seed, admin_setup)
│   └── README.md
├── supabase → backend/      # Симлинк для Supabase CLI
├── netlify.toml             # Netlify: билдит из frontend/
├── package.json             # Root: прокси-скрипты к frontend/ и Supabase CLI
└── README.md
```

> `supabase` в корне — символическая ссылка на `backend/`. Нужна чтобы
> `supabase` CLI (`supabase db push`, `supabase functions deploy ...`) работал
> без флага `--workdir`. На Windows может потребоваться `git config core.symlinks true`
> и реклон — или заменить симлинк на флаг `--workdir backend`.

## Quick Start

```bash
npm run install:frontend
cp frontend/.env.example frontend/.env  # заполните ключи Supabase
npm run dev              # localhost
npm run dev:host         # + доступ по IP (для телефона в одной Wi-Fi сети)
```

### Все root-скрипты

| Команда | Что делает |
|---------|-----------|
| `npm run dev` | Запуск Vite dev-сервера |
| `npm run dev:host` | Dev-сервер с `--host 0.0.0.0` (Network URL для телефона) |
| `npm run build` | Сборка SPA (для Capacitor APK) |
| `npm run build:web` | Сборка для Netlify |
| `npm run typecheck` | Проверка типов TypeScript |
| `npm run lint` | ESLint |
| `npm run install:frontend` | Установка зависимостей фронтенда |
| `npm run android:sync` | Build + Capacitor sync android |
| `npm run android:open` | Открыть Android Studio |
| `npm run db:push` | Supabase DB push |
| `npm run db:reset` | Supabase DB reset |
| `npm run db:diff` | Supabase DB diff |

## Push Notifications Setup

HiraLearn supports real push notifications via Firebase Cloud Messaging (FCM) HTTP v1 API, delivered through a Supabase Edge Function.

### Prerequisites

1. **Supabase CLI** — [install guide](https://supabase.com/docs/guides/cli/getting-started)

   ```bash
   npm install -g supabase
   ```

2. **Firebase project** — [Firebase Console](https://console.firebase.google.com/)
   - Create a project (or use an existing one)
   - Enable Cloud Messaging
   - Generate a service account key: **Project Settings > Service accounts > Generate new private key**
   - Download the JSON file (do **NOT** commit it to Git)

### Configuration

#### 1. Link your Supabase project

```bash
supabase login
supabase init          # if not already done
supabase link --project-ref pckydjhjvunvgekppqqd
```

#### 2. Set server-side secrets

The Edge Function needs the full Firebase service account JSON. Set it as a Supabase secret:

```bash
supabase secrets set FCM_SERVICE_ACCOUNT_JSON="$(cat path/to/serviceAccountKey.json)"
```

> **Important:** Never store the service account key in `.env` or commit it to GitHub. All secrets must live only in Supabase secrets.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically by Supabase — you do not need to set them.

#### 3. Deploy the Edge Function

```bash
supabase functions deploy send-push
```

#### 4. Client-side Firebase config (optional, for receiving push)

To let users receive push notifications in the browser, add these to your `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FCM_VAPID_KEY=...
```

The VAPID key is found in **Firebase Console > Project Settings > Cloud Messaging > Web Push certificates**.

### Verify

1. Log in as an admin at `/admin/push`
2. Fill in title, body, and audience
3. Click "Send"

If FCM is not configured, the function will record the notification in the database and show a clear error:
- **"Edge Function send-push not found"** — run `supabase functions deploy send-push`
- **"Firebase Cloud Messaging not configured"** — set `FCM_SERVICE_ACCOUNT_JSON` secret
- **"No active devices"** — no users have registered push tokens yet

### Architecture

```
Admin Panel (/admin/push)
    |
    v
supabase.functions.invoke('send-push', { body: payload })
    |
    v
Edge Function (backend/functions/send-push/index.ts)
    |-- Verifies JWT + admin role via admin_resolve_push_audience RPC
    |-- Fetches matching push tokens from push_tokens table
    |-- Sends via FCM HTTP v1 API (service-account signed JWT)
    |-- Records result via admin_record_notification RPC
    |-- Marks invalid tokens as inactive
    |
    v
Returns: { audience_size, sent, failed, invalid_tokens }
```

### Secrets Reference

| Secret | Where to set | Description |
|--------|-------------|-------------|
| `FCM_SERVICE_ACCOUNT_JSON` | `supabase secrets set` | Full Firebase service account JSON |
| `VITE_FCM_VAPID_KEY` | `.env` | Web Push VAPID key (client-side) |
| `VITE_FIREBASE_*` | `.env` | Firebase client config (analytics + messaging) |

## Security

- XP, level, streak, role, status — **не обновляются напрямую с клиента**.
  Триггер `profiles_protect_columns` откатывает любые прямые UPDATE от `authenticated`.
- Начисление XP → `complete_lesson` / `award_xp` RPC (SECURITY DEFINER).
- Обновление профиля → `update_own_profile` RPC (только safe fields).
- Admin-действия → RPC с проверкой роли (`admin_resolve_push_audience` и т.д.).
- `service_role` ключ **не используется** на фронтенде.
- `.env` / `.env.local` / service account JSON файлы в `.gitignore`.

## Android / APK

Android-платформа не закоммичена в репозиторий. Создаётся командой:

```bash
cd frontend && npx cap add android
```

Подробности — в `frontend/README.md`.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase (Auth, Database, Edge Functions, RLS)
- **Push:** Firebase Cloud Messaging (FCM HTTP v1)
- **State:** Zustand
- **Routing:** React Router (HashRouter для Capacitor совместимости)
- **i18n:** Custom RU/EN toggle
- **Theme:** 5 color themes with persistence
- **Payments:** Paddle (Merchant of Record)
