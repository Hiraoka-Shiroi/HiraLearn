# backend/functions/

Supabase Edge Functions — серверные функции, которые деплоятся в Supabase.

## Функции

| Функция | Назначение |
|---------|-----------|
| `send-push/index.ts` | Отправка push-уведомлений через Firebase Cloud Messaging (FCM HTTP v1 API) |
| `paddle-webhook/index.ts` | Обработка вебхуков от Paddle (платежи, подписки) |

## Деплой

```bash
supabase functions deploy send-push
supabase functions deploy paddle-webhook
```

## Секреты (устанавливаются через Supabase CLI)

```bash
supabase secrets set FCM_SERVICE_ACCOUNT_JSON="$(cat path/to/serviceAccountKey.json)"
supabase secrets set PADDLE_WEBHOOK_SECRET=whsec_...
supabase secrets set PADDLE_API_KEY=...
```

`SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` предоставляются Supabase автоматически.

## Важно

- Никогда не храните `service_role` ключ или Firebase service account JSON в `.env` или в коде.
- Все секреты должны быть только в Supabase Secrets.
