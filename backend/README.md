# backend/

Supabase backend: миграции БД, SQL-сиды, Edge Functions.

## Структура

```
backend/
├── migrations/          # SQL-миграции (применять по порядку дат)
├── seeds/
│   ├── full_content_seed.sql   # Главный seed: 11 курсов + модули + уроки + задания
│   ├── admin_setup.sql          # SQL для назначения admin-роли
│   └── README.md
├── functions/
│   ├── send-push/index.ts       # Edge Function: push-уведомления через FCM
│   ├── paddle-webhook/index.ts  # Edge Function: обработка Paddle webhooks
│   └── README.md
└── README.md (этот файл)
```

> Символическая ссылка `supabase → backend/` в корне проекта нужна для того,
> чтобы команды `supabase CLI` (`supabase db push`, `supabase functions deploy`)
> работали без флага `--workdir`.

## Что такое миграции

Миграции (`migrations/`) — SQL-файлы, которые создают и изменяют структуру базы данных.
Они применяются **последовательно**, по дате в имени файла.

| Миграция | Что делает |
|----------|-----------|
| `20260425_init_schema.sql` | Начальная схема: таблицы courses, modules, lessons, tasks, profiles, user_progress |
| `20260426_admin_monitoring.sql` | Таблицы error_logs, page_metrics, admin_logs |
| `20260426_backfill_missing_columns.sql` | Добавляет недостающие колонки |
| `20260427_admin_panel.sql` | RPC для admin-панели (list_users, update_role и т.д.) |
| `20260428_pin_super_admin.sql` | Фиксирует super-admin по email |
| `20260429_fix_admin_list_users_ambiguous.sql` | Исправление неоднозначных колонок |
| `20260430_progress_avatar_security.sql` | RLS, `complete_lesson` RPC, `update_own_profile` RPC, защита колонок |

### Какой SQL безопасен для повторного запуска

- **Миграции** — обычно содержат `IF NOT EXISTS` / `CREATE OR REPLACE`. Можно запускать повторно, но лучше не надо без причины.
- **`full_content_seed.sql`** — безопасен для повторного запуска (использует UPSERT + CASCADE). Но **удалит user_progress для seed-уроков**.
- **`admin_setup.sql`** — безопасен (ON CONFLICT DO UPDATE).

### Какой SQL нельзя запускать повторно

- Миграции без `IF NOT EXISTS` могут упасть с ошибкой, но не повредят данные.

## Как применять миграции

```bash
# Через Supabase CLI
supabase db push --workdir backend

# Или вручную — откройте каждый файл из migrations/ в порядке дат
# и выполните в Supabase Dashboard → SQL Editor
```

## Как залить контент (seed)

1. Убедитесь, что все миграции применены.
2. Откройте **Supabase Dashboard → SQL Editor → "+ New query"**.
3. Вставьте содержимое `seeds/full_content_seed.sql` и нажмите **Run**.

## Как назначить админа

1. Пользователь должен зарегистрироваться через UI.
2. Откройте `seeds/admin_setup.sql`, замените email на нужный.
3. Выполните в SQL Editor.

## Как включить аватарки/Storage

1. В Supabase Dashboard → Storage → создайте bucket `avatars` (public).
2. Добавьте RLS-политику на `storage.objects`:
   - `INSERT` — `auth.uid() IS NOT NULL`
   - `SELECT` — `true` (публичный доступ)
   - `UPDATE/DELETE` — `auth.uid()::text = (storage.foldername(name))[1]`

## Как работает complete_lesson RPC

`complete_lesson(p_lesson_id uuid)` — SECURITY DEFINER функция:
1. Проверяет, что пользователь авторизован (`auth.uid()`).
2. Вставляет запись в `user_progress` (или пропускает, если урок уже пройден).
3. Начисляет XP из `lessons.xp_reward`.
4. Пересчитывает уровень по формуле.
5. Обновляет streak (если сегодня первое завершение).
6. Возвращает обновлённый профиль.

Прямые UPDATE на `profiles.xp`, `profiles.level`, `profiles.streak` от `authenticated` пользователей автоматически откатываются триггером `profiles_protect_columns`.

## Push-уведомления

Подробности — в корневом `README.md` (секция Push Notifications Setup).
Функция `send-push` отправляет уведомления через FCM HTTP v1 API.
Секреты (`FCM_SERVICE_ACCOUNT_JSON`) хранятся только в Supabase Secrets.
