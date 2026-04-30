# backend/seeds/

SQL-файлы для наполнения базы данных контентом.

## Файлы

| Файл | Назначение | Повторный запуск |
|------|-----------|-----------------|
| `full_content_seed.sql` | Главный seed — 11 курсов, модули, уроки, задания | Безопасен (UPSERT / CASCADE) |
| `admin_setup.sql` | Назначение роли admin пользователю по email | Безопасен (ON CONFLICT DO UPDATE) |

## Как использовать

1. Убедитесь, что все миграции из `backend/migrations/` уже применены (в порядке дат).
2. Откройте **Supabase Dashboard → SQL Editor → "+ New query"**.
3. Вставьте содержимое `full_content_seed.sql` и нажмите **Run**.
4. Для назначения админа — вставьте `admin_setup.sql`, заменив email на нужный.

## Важно

- `full_content_seed.sql` при повторном запуске удаляет модули/уроки/задания для seed-курсов и создаёт заново (CASCADE).
- Пользовательский прогресс (`user_progress`) для seed-уроков тоже очищается при повторном запуске.
- Файл **не трогает**: `profiles`, `auth.users`, `subscriptions`, `payments`, `error_logs`.
