# frontend/

Vite + React + TypeScript приложение HiraLearn.

## Быстрый старт

```bash
# Из корня проекта
npm run install:frontend
cp frontend/.env.example frontend/.env   # заполните ключи Supabase

npm run dev           # запуск на localhost
npm run dev:host      # запуск с доступом по IP (для телефона в одной Wi-Fi сети)
```

## Открыть с телефона

```bash
npm run dev:host
```

Vite покажет строку `Network: http://192.168.x.x:5173/`. Откройте этот адрес в браузере телефона (телефон и компьютер должны быть в одной Wi-Fi сети).

## Структура

```
frontend/
├── src/
│   ├── App.tsx                  # Роутинг, инициализация auth
│   ├── main.tsx                 # Точка входа, error boundary
│   ├── index.css                # Глобальные стили + Tailwind
│   │
│   ├── pages/                   # Страницы (по роутам)
│   │   ├── LandingPage.tsx      # Лендинг (/)
│   │   ├── AuthPage.tsx         # Логин / регистрация
│   │   ├── Dashboard.tsx        # Главная (после логина)
│   │   ├── CoursesPage.tsx      # Список курсов
│   │   ├── LessonPage.tsx       # Урок с теорией и заданием
│   │   ├── ProfilePage.tsx      # Профиль пользователя
│   │   ├── GamesPage.tsx        # Мини-игры
│   │   ├── OnboardingPage.tsx   # Онбординг после регистрации
│   │   ├── PricingPage.tsx      # Тарифы
│   │   ├── AdminLessonsPage.tsx # Админ: управление уроками
│   │   └── AdminModulesPage.tsx # Админ: управление модулями
│   │
│   ├── features/                # Feature-модули
│   │   ├── admin/               # Админ-панель (дашборд, пользователи, роли, push и т.д.)
│   │   ├── profile/             # Профиль: компоненты (Hero, Stats, EditModal, AccountInfo), хук useProfileData
│   │   ├── auth/                # AuthService
│   │   ├── billing/             # Paddle billing
│   │   └── lessons/             # (зарезервировано)
│   │
│   ├── components/              # Общие компоненты
│   │   ├── layout/              # MainLayout, Sidebar, BottomNavigation
│   │   ├── auth/                # ProtectedRoute
│   │   └── avatar/              # Avatar, AvatarPickerModal, cropImage
│   │
│   ├── lib/                     # Утилиты и сервисы
│   │   ├── supabase/client.ts   # Supabase клиент (singleton)
│   │   ├── supabase/services.ts # Сервисы данных (courses, progress, profile)
│   │   ├── firebase/            # Analytics + FCM push
│   │   ├── paddle/              # Paddle SDK
│   │   ├── progress/levels.ts   # Формула уровней
│   │   ├── validators/          # HTML checker для заданий
│   │   └── monitoring/          # Error logger, page metrics
│   │
│   ├── store/                   # Zustand stores
│   │   ├── useAuthStore.ts      # Пользователь, профиль, signOut
│   │   └── useThemeStore.ts     # Тема (цвет)
│   │
│   ├── i18n/                    # Переводы (RU / EN)
│   │   ├── translations.ts      # Все строки
│   │   └── useLanguage.ts       # Хук для переключения языка
│   │
│   └── types/                   # TypeScript типы
│       ├── database.ts          # Supabase Database types
│       └── lesson.ts            # Типы для уроков/заданий
│
├── public/                      # Статические файлы
├── index.html                   # HTML шаблон
├── vite.config.ts               # Vite конфиг (основной, для APK/SPA)
├── vite.config.web.ts           # Vite конфиг (для web/Netlify)
├── tailwind.config.ts           # Tailwind CSS конфигурация
├── postcss.config.js            # PostCSS (Tailwind + Autoprefixer)
├── tsconfig.json                # TypeScript конфигурация
├── .eslintrc.cjs                # ESLint правила
├── patch-build.js               # Скрипт для патча билда (Capacitor совместимость)
├── .env.example                 # Пример переменных окружения
└── package.json                 # Зависимости фронтенда
```

## Где менять

| Что | Где |
|-----|-----|
| Дизайн / UI | `src/pages/`, `src/components/`, `src/index.css`, `tailwind.config.ts` |
| Supabase запросы | `src/lib/supabase/services.ts` |
| Admin-панель | `src/features/admin/` |
| Переводы (RU/EN) | `src/i18n/translations.ts` |
| Курсы / контент | Через Admin UI или `backend/seeds/full_content_seed.sql` |
| Тему / цвета | `src/store/useThemeStore.ts`, `tailwind.config.ts`, `src/index.css` |

## Команды

```bash
npm run dev          # Запуск dev-сервера
npm run build        # Сборка (SPA, для Capacitor)
npm run build:web    # Сборка (Web, для Netlify)
npm run typecheck    # Проверка типов
npm run lint         # ESLint
```

## Сборка APK (Capacitor)

Android-платформа не закоммичена в репозиторий. Для первой настройки:

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init HiraLearn com.hiralearn.app --web-dir dist
npx cap add android
```

Затем для сборки:

```bash
npm run build                  # сборка SPA
npx cap sync android           # синхронизация с Android
npx cap open android           # открыть в Android Studio
```

Или из корня проекта:

```bash
npm run android:sync           # build + cap sync
npm run android:open           # открыть Android Studio
```
