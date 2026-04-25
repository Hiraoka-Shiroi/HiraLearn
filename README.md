# CodeSensei

Минимальный MVP фронтенда для уроков программирования.

## Быстрый старт

```bash
npm install
npm run dev
```

## Получить ZIP одной командой

```bash
npm run zip
```

Архив появится в `artifacts/CodeSensei-web.zip`.

## Ошибка с загрузкой в GitHub

Если не получается `git push`, чаще всего причина — в проекте не настроен `origin`.

Проверь:

```bash
git remote -v
```

Если пусто, запусти автонастройку и пуш:

```bash
npm run github:push -- https://github.com/<your-username>/<your-repo>.git main
```

Скрипт:
1. добавит/обновит `origin`;
2. переключит ветку в `main`;
3. выполнит `git push -u origin main`.

## Если PR показывает conflict в `src/features/lesson/LessonPage.tsx`

Сделай так в своей ветке:

```bash
git fetch origin
git merge origin/main
```

Оставь версию `LessonPage.tsx` из текущей ветки, затем:

```bash
git add src/features/lesson/LessonPage.tsx
git commit -m "fix: resolve LessonPage merge conflict"
git push
```
