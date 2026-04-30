-- =============================================================================
-- HiraLearn — Full content seed (11 courses, modules, lessons, tasks)
-- =============================================================================
-- HOW TO RUN:
--   1. Open Supabase Dashboard → SQL Editor → "+ New query"
--   2. Paste this entire file
--   3. Click "Run"
--
-- WHAT IT DOES:
--   * Upserts 11 courses by slug (safe to re-run; ON CONFLICT DO UPDATE)
--   * Wipes ONLY the modules of these 11 seed courses
--     (this CASCADE-deletes their lessons + tasks via FK ON DELETE CASCADE)
--   * Re-creates fresh modules / lessons / tasks
--
-- WHAT IT DOES NOT TOUCH:
--   profiles, auth.users, subscriptions, payments,
--   error_logs, page_metrics, admin_logs.
--
-- WHAT IT DOES TOUCH (only on RE-RUN):
--   user_progress rows that reference lessons inside the 11 seed courses
--   are deleted before the modules cascade — otherwise the cascade would
--   hit a FK violation (user_progress.lesson_id has no ON DELETE CASCADE).
--   First run is a no-op for user_progress.
--
-- PREREQUISITES:
--   The schema migrations must already be applied:
--     supabase/migrations/20260425_init_schema.sql
--     supabase/migrations/20260426_admin_monitoring.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- STEP 1 — Upsert all 11 courses
-- -----------------------------------------------------------------------------
INSERT INTO public.courses (title, slug, description, level, is_published) VALUES
  ('HTML Basics',                'html-basics',              'Семантическая разметка, теги, формы, доступность. Фундамент любого фронтенда.',                  'beginner',     true),
  ('CSS Basics',                 'css-basics',               'Селекторы, box-model, flex, цвета и шрифты. Учимся стилизовать страницы.',                       'beginner',     true),
  ('Responsive Layout',          'responsive-layout',        'Адаптивная вёрстка: media queries, mobile-first, CSS Grid и Flexbox для разных экранов.',        'intermediate', true),
  ('JavaScript Basics',          'javascript-basics',        'Синтаксис JS: переменные, типы, функции, массивы, объекты, async/await.',                        'beginner',     true),
  ('DOM & Events',               'dom-events',               'Работа с DOM, события, формы, делегирование. Делаем страницы интерактивными.',                  'intermediate', true),
  ('React Basics',               'react-basics',             'Компоненты, JSX, props, useState, useEffect, списки, формы в React 18.',                         'intermediate', true),
  ('TypeScript Basics',          'typescript-basics',        'Типы, интерфейсы, дженерики, типизация props/state в React.',                                    'intermediate', true),
  ('Git & GitHub',               'git-github',               'Системы контроля версий: коммиты, ветки, merge, conflict, pull request.',                        'beginner',     true),
  ('API Basics',                 'api-basics',               'HTTP, REST, fetch, async/await, обработка ошибок, JSON, заголовки.',                             'intermediate', true),
  ('Supabase / Firebase Basics', 'supabase-firebase-basics', 'BaaS: Auth, Database, Storage. Подключение Supabase и Firebase к фронту.',                       'intermediate', true),
  ('Frontend Projects',          'frontend-projects',        'Финальные проекты: лендинг, SPA-дашборд, pet-проект с интеграцией всего стека.',                  'advanced',     true)
ON CONFLICT (slug) DO UPDATE SET
  title         = EXCLUDED.title,
  description   = EXCLUDED.description,
  level         = EXCLUDED.level,
  is_published  = EXCLUDED.is_published;

-- -----------------------------------------------------------------------------
-- STEP 2a — Clean user_progress rows that reference seed lessons.
--           Required because user_progress.lesson_id has no ON DELETE CASCADE,
--           so the modules cascade below would otherwise FK-fail on re-run
--           after any user has completed a lesson. NO-OP on the very first run.
-- -----------------------------------------------------------------------------
DELETE FROM public.user_progress
WHERE lesson_id IN (
  SELECT l.id
  FROM public.lessons l
  JOIN public.modules m ON l.module_id = m.id
  WHERE m.course_id IN (
    SELECT id FROM public.courses WHERE slug IN (
      'html-basics','css-basics','responsive-layout','javascript-basics','dom-events',
      'react-basics','typescript-basics','git-github','api-basics',
      'supabase-firebase-basics','frontend-projects'
    )
  )
);

-- -----------------------------------------------------------------------------
-- STEP 2b — Wipe modules (and via CASCADE: lessons + tasks) for the 11 seed courses
-- -----------------------------------------------------------------------------
DELETE FROM public.modules
WHERE course_id IN (
  SELECT id FROM public.courses WHERE slug IN (
    'html-basics','css-basics','responsive-layout','javascript-basics','dom-events',
    'react-basics','typescript-basics','git-github','api-basics',
    'supabase-firebase-basics','frontend-projects'
  )
);

-- -----------------------------------------------------------------------------
-- STEP 3 — Re-create modules / lessons / tasks for every course
-- -----------------------------------------------------------------------------
DO $seed$
DECLARE
  c_id uuid;
  m_id uuid;
  l_id uuid;
BEGIN

-- =============================================================================
-- HTML Basics
-- =============================================================================
SELECT id INTO c_id FROM public.courses WHERE slug='html-basics';

-- Module 1: Структура документа
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Структура документа', 'structure', 1, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Что такое HTML', 'what-is-html',
'HTML (HyperText Markup Language) — язык разметки, на котором описывается структура веб-страницы. Браузер читает HTML и строит из него DOM-дерево, которое потом рисует на экране. HTML состоит из тегов: открывающий тег <p>, содержимое, закрывающий тег </p>. Документ всегда начинается с <!DOCTYPE html>, затем идёт <html>, внутри которого <head> (метаданные) и <body> (видимое содержимое).',
$ex$<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Моя страница</title>
  </head>
  <body>
    <h1>Привет, мир!</h1>
  </body>
</html>$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Первая страница',
'Создайте корректный HTML-документ с заголовком h1, который содержит текст "Hello".',
$st$<!DOCTYPE html>
<html>
  <head><title>Page</title></head>
  <body>
    <!-- ваш код здесь -->
  </body>
</html>$st$,
'{"requiredTags":["h1"],"requiredText":["Hello"]}'::jsonb,
'["Используйте тег <h1>", "Не забудьте закрывающий </h1>", "Текст пишется между открывающим и закрывающим тегом"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Семантические теги', 'semantic-tags',
'Семантические теги (header, nav, main, section, article, aside, footer) описывают смысл блока, а не его внешний вид. Они улучшают доступность (screen readers), SEO и читаемость кода. <div> используйте только когда подходящего семантического тега нет.',
$ex$<header><nav>Меню</nav></header>
<main>
  <article>
    <h2>Статья</h2>
    <p>Текст…</p>
  </article>
</main>
<footer>©2026</footer>$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Семантический скелет',
'Сделайте страницу с тегами header, main и footer. Внутри main должен быть h2 с текстом "Главная".',
$st$<body>
  <!-- header, main (с h2 "Главная"), footer -->
</body>$st$,
'{"requiredTags":["header","main","footer","h2"],"requiredText":["Главная"]}'::jsonb,
'["Каждый из header/main/footer — отдельный тег", "h2 должен быть внутри main", "Тегов <div> избегайте, если есть семантические аналоги"]'::jsonb,
100, 1);

-- Module 2: Текст и ссылки
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Текст и ссылки', 'text-links', 2, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Заголовки, параграфы, списки', 'headings-lists',
'Заголовки h1-h6 формируют иерархию документа: на странице должен быть один h1 (главный заголовок), затем h2 для разделов, h3 — для подразделов и т.д. Параграфы оборачиваются в <p>. Списки бывают маркированные <ul> и нумерованные <ol>, элементы — <li>.',
$ex$<h1>Курс HTML</h1>
<p>Поехали изучать.</p>
<ul>
  <li>Теги</li>
  <li>Формы</li>
</ul>$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Список покупок',
'Сверстайте маркированный список из трёх элементов: "Хлеб", "Молоко", "Яблоки".',
$st$<ul>
  <!-- три <li> -->
</ul>$st$,
'{"requiredTags":["ul","li"],"requiredText":["Хлеб","Молоко","Яблоки"]}'::jsonb,
'["<ul> — это маркированный список", "Каждый пункт — это отдельный <li>", "Текст пишется внутри <li>"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Ссылки и атрибуты', 'links',
'Ссылка задаётся тегом <a> с обязательным атрибутом href. target="_blank" открывает ссылку в новой вкладке (всегда добавляйте rel="noopener" для безопасности). Ссылки могут быть абсолютные (https://…) и относительные (/about).',
$ex$<a href="https://example.com" target="_blank" rel="noopener">
  Открыть сайт
</a>$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Сделай ссылку',
'Создайте ссылку на https://google.com с текстом "Поиск".',
$st$<!-- ваша ссылка -->$st$,
'{"requiredTags":["a"],"requiredText":["https://google.com","Поиск"]}'::jsonb,
'["Тег <a> с атрибутом href", "Текст пишется между <a> и </a>", "Не забудьте закрывающий </a>"]'::jsonb,
100, 1);

-- Module 3: Формы и медиа
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Формы и медиа', 'forms-media', 3, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Изображения', 'images',
'Тег <img> вставляет картинку. Атрибут src — путь к файлу, alt — текстовое описание (важно для доступности и SEO). Для адаптивных картинок используйте srcset и sizes или современный <picture>.',
$ex$<img src="/logo.png" alt="Логотип HiraLearn" width="120" />$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Картинка с alt',
'Вставьте <img> с src="/cat.jpg" и alt="Кот".',
$st$<!-- ваша картинка -->$st$,
'{"requiredTags":["img"],"requiredText":["/cat.jpg","Кот"]}'::jsonb,
'["<img> — самозакрывающийся тег", "alt описывает картинку словами", "src — путь к файлу"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Формы и поля ввода', 'forms',
'Форма <form> содержит поля ввода <input>, <textarea>, <select>. Каждое поле должно иметь <label for="id"> для доступности. Кнопка отправки — <button type="submit">. Атрибут required делает поле обязательным.',
$ex$<form>
  <label for="email">Email</label>
  <input id="email" type="email" required />
  <button type="submit">Отправить</button>
</form>$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Форма логина',
'Сделайте форму с input type="email" и кнопкой "Войти".',
$st$<form>
  <!-- input + button -->
</form>$st$,
'{"requiredTags":["form","input","button"],"requiredText":["Войти"]}'::jsonb,
'["Используйте <input type=\"email\">", "<button> с текстом Войти", "Все поля внутри <form>"]'::jsonb,
100, 1);

-- =============================================================================
-- CSS Basics
-- =============================================================================
SELECT id INTO c_id FROM public.courses WHERE slug='css-basics';

-- Module 1: Селекторы и каскад
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Селекторы и каскад', 'selectors', 1, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Что такое CSS', 'what-is-css',
'CSS (Cascading Style Sheets) описывает, как HTML-элементы должны выглядеть. Подключается тремя способами: inline (style="…"), внутренний (<style> в head), внешний (<link rel="stylesheet" href="style.css">) — последний предпочтителен. Правило: селектор { свойство: значение; }',
$ex$h1 { color: indigo; font-size: 32px; }
.btn { background: #6366f1; padding: 8px 16px; }$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Покрасить заголовок',
'Сделайте все h1 синими (color: blue).',
$st$/* ваш CSS */$st$,
'{"requiredText":["h1","color: blue"]}'::jsonb,
'["Селектор тега пишется без точки и решётки", "Свойство color задаёт цвет текста", "Не забудьте точку с запятой"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Классы и id', 'classes-ids',
'Класс — селектор с точкой (.btn), id — с решёткой (#header). Класс можно использовать многократно, id — только на одном элементе. Специфичность: id (100) > класс (10) > тег (1). Для большинства задач предпочитайте классы.',
$ex$.card { border-radius: 16px; padding: 24px; }
#main-title { font-weight: 700; }$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Стиль для класса',
'Задайте элементам с классом .box фон #f0f0f0.',
$st$/* ваш CSS */$st$,
'{"requiredText":[".box","background","#f0f0f0"]}'::jsonb,
'["Класс начинается с точки", "Свойство background задаёт фон", "Цвет в формате #RRGGBB"]'::jsonb,
100, 1);

-- Module 2: Box model
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Box model', 'box-model', 2, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Padding, margin, border', 'padding-margin',
'Каждый блочный элемент — это коробка: content (содержимое), padding (внутренний отступ), border (рамка), margin (внешний отступ). По умолчанию ширина = content; box-sizing: border-box делает width учитывать padding+border (это удобнее, в reset-стилях обычно ставят * { box-sizing: border-box; }).',
$ex$.card {
  padding: 24px;
  margin: 16px;
  border: 1px solid #ddd;
  box-sizing: border-box;
}$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Padding 20px',
'Задайте всем .card padding в 20 пикселей.',
$st$/* ваш CSS */$st$,
'{"requiredText":[".card","padding: 20px"]}'::jsonb,
'["padding — внутренний отступ", "Значение в пикселях с суффиксом px", "Селектор класса с точкой"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Цвета, шрифты, скругления', 'colors-fonts',
'Цвет: color (текст), background (фон). Форматы: #6366f1, rgb(99,102,241), hsl(...). Шрифт: font-family ("Inter", sans-serif), font-size, font-weight (400 normal, 700 bold). Скругления: border-radius. Для красивых границ — rounded-[2.5rem] (40px) в Zen-стиле HiraLearn.',
$ex$.btn {
  background: #6366f1;
  color: white;
  font-weight: 600;
  border-radius: 16px;
  padding: 12px 24px;
}$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Скруглить кнопку',
'Сделайте у .btn border-radius равным 12px.',
$st$/* ваш CSS */$st$,
'{"requiredText":[".btn","border-radius: 12px"]}'::jsonb,
'["border-radius задаёт скругление углов", "Чем больше значение, тем круглее", "Единица — px"]'::jsonb,
100, 1);

-- Module 3: Flexbox
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Flexbox', 'flexbox', 3, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'display: flex', 'display-flex',
'Flexbox — одномерная раскладка. На контейнер ставим display: flex; внутри — flex-direction (row/column), justify-content (по главной оси), align-items (по поперечной), gap (отступы между элементами).',
$ex$.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Включить flex',
'Задайте .row display: flex.',
$st$/* ваш CSS */$st$,
'{"requiredText":[".row","display: flex"]}'::jsonb,
'["display: flex включает flex-режим", "Значение пишется без кавычек", "Не забудьте точку с запятой"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Центрирование', 'centering',
'Самый простой способ отцентрировать что угодно — flex с justify-content: center и align-items: center на контейнере. Это работает и по горизонтали, и по вертикали одновременно.',
$ex$.center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'По центру',
'У .hero сделайте display: flex и justify-content: center.',
$st$/* ваш CSS */$st$,
'{"requiredText":[".hero","display: flex","justify-content: center"]}'::jsonb,
'["Сначала включите flex", "justify-content центрирует по главной оси", "Для row главная ось — горизонталь"]'::jsonb,
100, 1);

-- =============================================================================
-- Responsive Layout
-- =============================================================================
SELECT id INTO c_id FROM public.courses WHERE slug='responsive-layout';

-- Module 1: Media queries
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Media queries', 'media-queries', 1, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Viewport и mobile-first', 'viewport',
'<meta name="viewport" content="width=device-width, initial-scale=1"> — обязательная мета-тег для адаптива (без неё мобильник масштабирует страницу). Mobile-first означает: пишем CSS сначала под мобильник, потом через @media (min-width: …) добавляем правила для бóльших экранов.',
$ex$/* mobile by default */
.container { padding: 16px; }
@media (min-width: 768px) {
  .container { padding: 32px; }
}$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Viewport meta',
'Добавьте в <head> мета-тег viewport.',
$st$<head>
  <!-- мета-тег viewport -->
</head>$st$,
'{"requiredTags":["meta"],"requiredText":["viewport","width=device-width"]}'::jsonb,
'["Тег <meta> самозакрывающийся", "name=\"viewport\"", "content=\"width=device-width, initial-scale=1\""]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Breakpoints', 'breakpoints',
'Стандартные точки перелома (Tailwind): sm 640, md 768, lg 1024, xl 1280, 2xl 1536. Стиль mobile-first: пишем CSS сначала для самого узкого экрана, затем добавляем @media (min-width: 768px) для планшетов и т.д.',
$ex$@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Условный CSS',
'Внутри @media (min-width: 768px) сделайте .menu display: flex.',
$st$@media (min-width: 768px) {
  /* ваш код */
}$st$,
'{"requiredText":["@media","min-width: 768px","display: flex"]}'::jsonb,
'["@media принимает условие в скобках", "Внутри пишутся обычные CSS-правила", "Не забудьте закрывающую }"]'::jsonb,
100, 1);

-- Module 2: Grid и Flex
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Grid и Flex', 'grid-flex', 2, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'CSS Grid', 'css-grid',
'CSS Grid — двумерная раскладка (строки + колонки). На контейнере: display: grid; grid-template-columns: repeat(3, 1fr) — три равных колонки. gap задаёт отступы. Для адаптивности комбинируйте с media queries или auto-fit/minmax.',
$ex$.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Сетка из 3 колонок',
'Сделайте .grid с тремя колонками одинаковой ширины.',
$st$/* ваш CSS */$st$,
'{"requiredText":[".grid","display: grid","grid-template-columns","1fr"]}'::jsonb,
'["display: grid включает Grid", "grid-template-columns задаёт колонки", "1fr — одна доля свободного места"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Flex для адаптива', 'flex-responsive',
'flex-wrap: wrap позволяет элементам переноситься на новую строку, когда не помещаются. Сочетайте с min-width элементов и gap — получите адаптивную галерею без media queries.',
$ex$.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.cards > * { flex: 1 1 240px; }$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Перенос строк',
'Включите .cards display: flex и flex-wrap: wrap.',
$st$/* ваш CSS */$st$,
'{"requiredText":[".cards","display: flex","flex-wrap: wrap"]}'::jsonb,
'["flex-wrap: wrap включает перенос", "По умолчанию flex не переносит элементы", "Без wrap всё в одну строку"]'::jsonb,
100, 1);

-- =============================================================================
-- JavaScript Basics
-- =============================================================================
SELECT id INTO c_id FROM public.courses WHERE slug='javascript-basics';

-- Module 1: Переменные и типы
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Переменные и типы', 'variables', 1, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'let, const, var', 'let-const',
'В современном JS используйте const (значение не меняется) и let (значение можно переписать). var — устаревший, имеет особенности hoisting и не блочную область видимости. Const с объектом не запрещает менять его поля — он лишь запрещает переприсваивание самой переменной.',
$ex$const PI = 3.14;
let count = 0;
count = count + 1;
const user = { name: "Anna" };
user.name = "Bob"; // OK$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Объяви константу',
'Объявите const PI = 3.14.',
$st$// ваш код$st$,
'{"requiredText":["const","PI","3.14"]}'::jsonb,
'["Используйте ключевое слово const", "Имя в верхнем регистре для констант — соглашение", "Знак = присваивает значение"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Примитивные типы', 'types',
'JS типы: string ("hello"), number (42 или 3.14), boolean (true/false), null, undefined, bigint, symbol. typeof возвращает строку с типом. JS — динамически типизирован: переменная может менять тип.',
$ex$typeof "abc"   // "string"
typeof 42      // "number"
typeof true    // "boolean"
typeof null    // "object" (исторический баг)$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Тип переменной',
'Объявите let age = 25 и в комментарии запишите её тип через typeof.',
$st$// ваш код$st$,
'{"requiredText":["let age","25","typeof"]}'::jsonb,
'["let позволяет переприсваивание", "typeof — оператор, скобки не обязательны", "Тип number"]'::jsonb,
100, 1);

-- Module 2: Функции и условия
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Функции и условия', 'functions', 2, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Функции', 'functions-basics',
'Функция объявляется через function name() {} или стрелочную const name = () => {}. Стрелочные не имеют своего this — это удобно в callback-ах. return возвращает значение; без return функция возвращает undefined.',
$ex$function add(a, b) { return a + b; }
const sub = (a, b) => a - b;
add(2, 3); // 5
sub(5, 1); // 4$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Сумма двух чисел',
'Напишите функцию sum(a, b), которая возвращает a + b.',
$st$function sum(a, b) {
  // ваш код
}$st$,
'{"requiredText":["function sum","return","a + b"]}'::jsonb,
'["Параметры a и b в скобках", "return возвращает значение", "Сложение через знак +"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'if / else / тернарный', 'conditions',
'Условные операторы: if (условие) {} else if {} else {}. Тернарный оператор: cond ? a : b — короткая форма. Используется в JSX и для коротких выражений. Для строгого сравнения — === (без приведения типа), нестрогого — == (избегайте).',
$ex$const age = 18;
if (age >= 18) console.log("adult");
else console.log("kid");
const label = age >= 18 ? "взрослый" : "ребёнок";$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Чёт-нечёт',
'Напишите функцию isEven(n), которая возвращает true, если n чётное.',
$st$function isEven(n) {
  // ваш код
}$st$,
'{"requiredText":["function isEven","return","% 2"]}'::jsonb,
'["Оператор % возвращает остаток от деления", "Чётное число — остаток 0", "Сравнение через ==="]'::jsonb,
100, 1);

-- Module 3: Массивы и объекты
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Массивы и объекты', 'arrays-objects', 3, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Массивы и методы', 'arrays',
'Массив — упорядоченная коллекция: [1,2,3]. Полезные методы: push (добавить в конец), pop (удалить с конца), map (преобразовать), filter (отфильтровать), reduce (свести в одно значение). map и filter возвращают новый массив, не мутируют исходный.',
$ex$const nums = [1,2,3,4];
const doubled = nums.map(n => n * 2);
const even = nums.filter(n => n % 2 === 0);
const sum = nums.reduce((s,n) => s+n, 0);$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Удвой массив',
'Используя map, верните массив, где каждый элемент удвоен.',
$st$function doubleAll(arr) {
  // верните arr.map(...)
}$st$,
'{"requiredText":["arr.map","* 2","return"]}'::jsonb,
'["map принимает функцию", "Внутри возвращайте n * 2", "map возвращает новый массив"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Объекты и деструктуризация', 'objects',
'Объект — пара ключ-значение: { name: "Anna", age: 25 }. Доступ: obj.name или obj["name"]. Деструктуризация: const { name } = obj. Spread: { ...obj, age: 26 } — копия объекта с переопределённым полем.',
$ex$const user = { name: "Anna", age: 25 };
const { name } = user;
const updated = { ...user, age: 26 };$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Достань имя',
'Используя деструктуризацию, достаньте поле name из объекта user.',
$st$const user = { name: "Bob", age: 30 };
// ваш код здесь$st$,
'{"requiredText":["const { name }","= user"]}'::jsonb,
'["Фигурные скобки слева от знака =", "Имя поля = имя переменной", "Используйте const"]'::jsonb,
100, 1);

-- =============================================================================
-- DOM & Events
-- =============================================================================
SELECT id INTO c_id FROM public.courses WHERE slug='dom-events';

-- Module 1: Работа с DOM
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Работа с DOM', 'dom', 1, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'querySelector', 'query-selector',
'document.querySelector(selector) возвращает первый подходящий элемент (или null). querySelectorAll — все, в виде NodeList. Селекторы — те же, что в CSS: ".btn", "#main", "nav a".',
$ex$const btn = document.querySelector(".btn");
const items = document.querySelectorAll("li");
items.forEach(li => console.log(li.textContent));$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Найди элемент',
'Сохраните в переменную title первый h1 на странице.',
$st$// const title = ...$st$,
'{"requiredText":["document.querySelector","h1","const title"]}'::jsonb,
'["querySelector принимает CSS-селектор", "Тег h1 — без точки и решётки", "Результат сохраняем в const"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Изменение DOM', 'dom-mutation',
'textContent — текст элемента, innerHTML — HTML внутри (осторожно: XSS!). classList — добавление/удаление классов: classList.add("active"), classList.toggle("hidden"). Создание: document.createElement, добавление: parent.appendChild(child).',
$ex$el.textContent = "Привет";
el.classList.add("active");
el.classList.toggle("hidden");$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Сменить текст',
'Замените текст h1 на "Hello DOM".',
$st$const h1 = document.querySelector("h1");
// h1.textContent = ...$st$,
'{"requiredText":["h1.textContent","Hello DOM"]}'::jsonb,
'["textContent заменяет всё содержимое", "Строка в кавычках", "Знак = для присваивания"]'::jsonb,
100, 1);

-- Module 2: События
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'События', 'events', 2, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'addEventListener', 'add-listener',
'addEventListener(type, handler) подписывает обработчик на событие. Популярные события: click, input, submit, keydown, mouseenter. handler получает Event со свойствами target, currentTarget, type. Удалить — removeEventListener с той же функцией-ссылкой.',
$ex$btn.addEventListener("click", (e) => {
  console.log("clicked", e.target);
});$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Кнопка по клику',
'Подпишите .btn на клик и выводите console.log("clicked").',
$st$const btn = document.querySelector(".btn");
// btn.addEventListener(...)$st$,
'{"requiredText":["addEventListener","click","console.log","clicked"]}'::jsonb,
'["Первый аргумент — имя события", "Второй — функция-обработчик", "Стрелочные функции тут уместны"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Формы и preventDefault', 'forms-events',
'По умолчанию submit формы перезагружает страницу. event.preventDefault() это останавливает — мы можем сами обработать данные через JS. Доступ к значениям: form.elements.email.value или new FormData(form).',
$ex$form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  console.log(data.get("email"));
});$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Без перезагрузки',
'В обработчике submit вызовите e.preventDefault().',
$st$form.addEventListener("submit", (e) => {
  // ваш код здесь
});$st$,
'{"requiredText":["e.preventDefault()"]}'::jsonb,
'["preventDefault — метод Event", "Вызывается на объекте события", "Без аргументов"]'::jsonb,
100, 1);

-- =============================================================================
-- React Basics
-- =============================================================================
SELECT id INTO c_id FROM public.courses WHERE slug='react-basics';

-- Module 1: Компоненты и JSX
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Компоненты и JSX', 'components', 1, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'JSX', 'jsx',
'JSX — синтаксис, похожий на HTML, но компилируется в JavaScript-вызовы React.createElement. Атрибуты пишутся в camelCase: className, onClick. JS-выражения в фигурных скобках: {variable}. Корневой элемент один (или Fragment <>).',
$ex$const Hello = () => (
  <div className="card">
    <h1>Привет, {name}</h1>
  </div>
);$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Простой компонент',
'Создайте компонент Hello, который возвращает <h1>Hello</h1>.',
$st$function Hello() {
  // return ...
}$st$,
'{"requiredText":["function Hello","return","<h1>","Hello","</h1>"]}'::jsonb,
'["Компонент — это функция", "Возвращает JSX", "Имя компонента с большой буквы"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Props', 'props',
'Props — данные, которые родитель передаёт ребёнку. Это readonly: внутри компонента props менять нельзя. Деструктуризация в параметрах удобнее: function Card({ title }) {}. Передаются как атрибуты: <Card title="Hi" />.',
$ex$function Card({ title, children }) {
  return <div className="card"><h2>{title}</h2>{children}</div>;
}
// <Card title="Hi">текст</Card>$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Принимаем prop',
'Сделайте компонент Greet({ name }), возвращающий <p>Hello {name}</p>.',
$st$function Greet(/* props */) {
  // return ...
}$st$,
'{"requiredText":["function Greet","{ name }","return","Hello","{name}"]}'::jsonb,
'["Деструктурируйте { name } в параметрах", "Подстановка через {}", "Не забудьте return"]'::jsonb,
100, 1);

-- Module 2: State и эффекты
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'State и эффекты', 'state-effects', 2, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'useState', 'use-state',
'useState — хук состояния. Возвращает массив [value, setValue]. setValue заменяет состояние и триггерит ре-рендер. Если новое значение зависит от старого — используйте функциональную форму: setCount(c => c + 1).',
$ex$import { useState } from "react";
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c+1)}>{count}</button>;
}$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Счётчик',
'Сделайте компонент Counter с useState(0) и кнопкой, которая увеличивает счётчик.',
$st$import { useState } from "react";
function Counter() {
  // const [count, setCount] = useState(0);
  // return ...
}$st$,
'{"requiredText":["useState(0)","setCount","onClick"]}'::jsonb,
'["Импортируйте useState из react", "Деструктурируйте [value, setValue]", "Обработчик onClick"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'useEffect', 'use-effect',
'useEffect выполняет побочные эффекты (запросы, подписки, таймеры) после рендера. Второй аргумент — массив зависимостей: [] значит "только при монтировании". Возвращайте функцию очистки для unmount.',
$ex$useEffect(() => {
  const id = setInterval(() => tick(), 1000);
  return () => clearInterval(id);
}, []);$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Эффект при монтировании',
'Добавьте useEffect, который один раз при монтировании выводит console.log("mounted").',
$st$import { useEffect } from "react";
// useEffect(...)$st$,
'{"requiredText":["useEffect","console.log","mounted","[]"]}'::jsonb,
'["Второй аргумент — массив зависимостей", "Пустой массив = один раз", "Не забудьте импорт"]'::jsonb,
100, 1);

-- Module 3: Списки и формы
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Списки и формы', 'lists-forms', 3, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Рендер списков', 'lists',
'Чтобы отрендерить массив элементов, используйте map. У каждого элемента нужен уникальный key — React использует его для эффективного diff. Не используйте index, если порядок может меняться.',
$ex$<ul>
  {items.map(item => (
    <li key={item.id}>{item.title}</li>
  ))}
</ul>$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Список из массива',
'Отрендерите массив items в <ul>, каждый — <li> с key={item.id}.',
$st$function List({ items }) {
  // return <ul>...</ul>
}$st$,
'{"requiredText":["items.map","<li","key={","</li>","</ul>"]}'::jsonb,
'["map возвращает массив JSX", "key — обязательный атрибут", "Используйте уникальный id"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Контролируемые формы', 'controlled-forms',
'Контролируемая форма: значение поля управляется state. value={state} + onChange={e => setState(e.target.value)}. Это позволяет валидировать, форматировать, дизейблить кнопку и т.д.',
$ex$const [email, setEmail] = useState("");
<input value={email} onChange={e => setEmail(e.target.value)} />$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Контролируемый input',
'Свяжите <input> с useState через value и onChange.',
$st$const [text, setText] = useState("");
// <input value={...} onChange={...} />$st$,
'{"requiredText":["value={text}","onChange","setText","e.target.value"]}'::jsonb,
'["value — текущее значение", "onChange срабатывает при вводе", "e.target.value — новое значение"]'::jsonb,
100, 1);

-- =============================================================================
-- TypeScript Basics
-- =============================================================================
SELECT id INTO c_id FROM public.courses WHERE slug='typescript-basics';

-- Module 1: Типы и интерфейсы
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Типы и интерфейсы', 'types', 1, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Примитивные типы', 'primitives',
'Базовые типы: string, number, boolean, null, undefined, void, never. Аннотация: let age: number = 25. TS выводит типы автоматически (inference) — не везде нужно писать аннотации. Union: string | number — значение одного из двух типов.',
$ex$let name: string = "Anna";
let age: number = 25;
let active: boolean = true;
let mixed: string | number = "ok";$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Аннотация типа',
'Объявите let count: number = 0.',
$st$// ваш код$st$,
'{"requiredText":["let count","number","= 0"]}'::jsonb,
'["После имени двоеточие и тип", "number — числовой тип", "Аннотация перед знаком ="]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Интерфейсы и type', 'interfaces',
'interface описывает форму объекта. type — то же, плюс может алиасить любые типы (union, primitives). Знак ? делает поле опциональным. readonly запрещает изменение.',
$ex$interface User {
  id: number;
  name: string;
  email?: string;
}
type Status = "active" | "blocked";$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Интерфейс User',
'Опишите interface User { id: number; name: string }.',
$st$// ваш интерфейс$st$,
'{"requiredText":["interface User","id: number","name: string"]}'::jsonb,
'["Ключевое слово interface", "Поля отделяются точкой с запятой или запятой", "Имя с большой буквы"]'::jsonb,
100, 1);

-- Module 2: Дженерики и React
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Дженерики и React', 'generics', 2, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Generics', 'generic-types',
'Дженерики позволяют писать функции и типы, работающие с разными типами без any. function identity<T>(x: T): T { return x; }. T выводится автоматически из аргумента. Используется в Array<T>, Map<K,V>, useState<T>.',
$ex$function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
const a = first([1,2,3]); // number | undefined$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Generic identity',
'Напишите function identity<T>(x: T): T, возвращающую x.',
$st$// function identity<T>...$st$,
'{"requiredText":["function identity","<T>","T): T","return x"]}'::jsonb,
'["T в угловых скобках перед списком аргументов", "Параметр и возвращаемое значение тоже T", "return x"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Типы в React', 'react-types',
'Props компонента описывают через interface или type. Хук useState типизируется параметром: useState<string[]>([]). Для children используйте React.ReactNode. Для обработчиков событий — React.MouseEvent, React.ChangeEvent<HTMLInputElement>.',
$ex$interface ButtonProps {
  label: string;
  onClick: () => void;
}
const Button: React.FC<ButtonProps> = ({ label, onClick }) =>
  <button onClick={onClick}>{label}</button>;$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Типизируем props',
'Опишите interface CardProps с полем title: string и используйте его в компоненте Card.',
$st$// interface CardProps ...
// function Card(props: CardProps) {...}$st$,
'{"requiredText":["interface CardProps","title: string","CardProps"]}'::jsonb,
'["interface — для props удобно", "Используйте interface как тип параметра", "Поле title типа string"]'::jsonb,
100, 1);

-- =============================================================================
-- Git & GitHub
-- =============================================================================
SELECT id INTO c_id FROM public.courses WHERE slug='git-github';

-- Module 1: Основы Git
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Основы Git', 'basics', 1, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'init, add, commit', 'init-add-commit',
'Git — распределённая система контроля версий. git init создаёт пустой репозиторий. git add добавляет файлы в staging area. git commit -m "msg" фиксирует снимок. git status показывает текущее состояние.',
$ex$git init
git add .
git commit -m "first commit"
git status$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Первый коммит',
'Сделайте коммит с сообщением "init".',
$st$# командная строка$st$,
'{"requiredText":["git add","git commit","init"]}'::jsonb,
'["git add . — все изменения", "git commit -m \"init\"", "Сообщение в кавычках"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Ветки и merge', 'branches',
'Ветка — указатель на коммит. git branch feature создаёт ветку, git checkout -b feature — создаёт и переключается. git merge feature вливает её в текущую. Конфликты разрешаются вручную в файлах с маркерами <<<<<<< / >>>>>>>.',
$ex$git checkout -b feature/login
# работаем, коммитим
git checkout main
git merge feature/login$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Создать ветку',
'Создайте и переключитесь на ветку feature/auth.',
$st$# командная строка$st$,
'{"requiredText":["git checkout -b","feature/auth"]}'::jsonb,
'["-b создаёт новую ветку", "Имя через слэш — соглашение", "checkout переключает"]'::jsonb,
100, 1);

-- Module 2: GitHub
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'GitHub', 'github', 2, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Push и pull', 'push-pull',
'git remote add origin <url> привязывает локальный репозиторий к удалённому. git push -u origin main отправляет ветку. git pull обновляет локальную ветку с remote. git clone <url> делает копию репозитория.',
$ex$git remote add origin https://github.com/user/repo.git
git push -u origin main
git pull$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Push в main',
'Запушьте ветку main в origin.',
$st$# командная строка$st$,
'{"requiredText":["git push","origin","main"]}'::jsonb,
'["push — отправка коммитов", "origin — алиас удалённого", "Указываем ветку"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Pull request', 'pull-request',
'PR — предложение влить ветку в основную. Создаётся в UI GitHub. Reviewer оставляет комментарии, после approve — merge. Хорошие практики: маленькие PR, осмысленный заголовок, описание "что/зачем", скриншоты для UI-изменений.',
$ex$# создаёте ветку, коммитите, пушите
git push origin feature/login
# в UI GitHub: Compare & pull request → Create$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Описание PR',
'Опишите в комментарии, что должно быть в хорошем PR (минимум 3 пункта).',
$st$/*
- ...
- ...
- ...
*/$st$,
'{"requiredText":["заголовок","описание","скриншот"]}'::jsonb,
'["Маленький объём", "Что и зачем", "Скриншоты для UI"]'::jsonb,
100, 1);

-- =============================================================================
-- API Basics
-- =============================================================================
SELECT id INTO c_id FROM public.courses WHERE slug='api-basics';

-- Module 1: HTTP и REST
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'HTTP и REST', 'http-rest', 1, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'HTTP методы и статусы', 'http-methods',
'HTTP — протокол клиент-сервер. Методы: GET (получить), POST (создать), PUT/PATCH (обновить), DELETE (удалить). Статусы: 2xx успех, 3xx редирект, 4xx ошибка клиента (404, 401, 403), 5xx ошибка сервера.',
$ex$GET  /api/users      → список
POST /api/users      → создать
GET  /api/users/42   → один
DELETE /api/users/42 → удалить$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Что вернёт GET 404',
'В комментарии запишите, что означает HTTP-статус 404.',
$st$// 404 — ...$st$,
'{"requiredText":["404","Not Found"]}'::jsonb,
'["4xx — ошибка клиента", "404 = Not Found", "Ресурс не найден"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'JSON', 'json',
'JSON — текстовый формат обмена данными. Объекты {"key":"value"}, массивы [1,2,3], вложенность поддерживается. JSON.stringify(obj) — в строку, JSON.parse(str) — в объект. API обычно возвращают именно JSON.',
$ex$const obj = { id: 1, name: "Anna" };
const str = JSON.stringify(obj);
const back = JSON.parse(str);$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'JSON.parse',
'Распарсьте строку str = ''{"x":1}'' в объект через JSON.parse.',
$st$const str = '{"x":1}';
// const obj = ...$st$,
'{"requiredText":["JSON.parse","str"]}'::jsonb,
'["JSON.parse принимает строку", "Возвращает объект", "Работает только с валидным JSON"]'::jsonb,
100, 1);

-- Module 2: Fetch
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Fetch и async/await', 'fetch', 2, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'fetch GET', 'fetch-get',
'fetch(url) возвращает Promise<Response>. Чтобы получить данные: const res = await fetch(url); const data = await res.json(). Обработка ошибок: if (!res.ok) throw new Error(res.status). Сетевые ошибки ловятся через try/catch.',
$ex$const res = await fetch("/api/users");
if (!res.ok) throw new Error("HTTP " + res.status);
const users = await res.json();$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Запрос пользователей',
'Напишите async-функцию loadUsers, которая делает GET /api/users и возвращает массив.',
$st$async function loadUsers() {
  // fetch + await + json
}$st$,
'{"requiredText":["async function loadUsers","await fetch","await","json()"]}'::jsonb,
'["async объявляет асинхронную функцию", "await ждёт промис", "res.json() тоже промис"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'POST с телом', 'fetch-post',
'Для POST/PUT нужно передать method, headers и body. Тело сериализуется в JSON: JSON.stringify(payload). Заголовок Content-Type: application/json обязателен.',
$ex$await fetch("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Anna" }),
});$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'POST запрос',
'Сделайте POST /api/users с телом { name: "Bob" } через fetch.',
$st$async function createUser() {
  // ...
}$st$,
'{"requiredText":["method: \"POST\"","Content-Type","JSON.stringify","Bob"]}'::jsonb,
'["method: \"POST\" в опциях", "headers объект", "body — строка JSON"]'::jsonb,
100, 1);

-- =============================================================================
-- Supabase / Firebase Basics
-- =============================================================================
SELECT id INTO c_id FROM public.courses WHERE slug='supabase-firebase-basics';

-- Module 1: BaaS и Auth
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'BaaS и Auth', 'baas-auth', 1, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Что такое BaaS', 'what-is-baas',
'BaaS (Backend-as-a-Service) — готовая бэкенд-инфраструктура: Auth, БД, файлы, realtime, edge-функции. Supabase — open-source альтернатива Firebase, под капотом PostgreSQL. Firebase — Google-сервис с NoSQL Firestore. Преимущества: меньше кода, быстрый старт, всё через API/SDK.',
$ex$import { createClient } from "@supabase/supabase-js";
const supabase = createClient(url, anonKey);$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Создать клиент',
'Импортируйте createClient и вызовите его с url и anonKey.',
$st$import { createClient } from "@supabase/supabase-js";
// const supabase = createClient(...)$st$,
'{"requiredText":["createClient","url","anonKey","supabase"]}'::jsonb,
'["Импорт из @supabase/supabase-js", "createClient(url, key)", "Возвращает клиент"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'signUp и signIn', 'auth',
'supabase.auth.signUp({ email, password }) регистрирует пользователя. signInWithPassword авторизует. Сессия хранится в localStorage. onAuthStateChange — подписка на изменения. signOut завершает сессию.',
$ex$await supabase.auth.signUp({ email, password });
await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signOut();$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Регистрация',
'Вызовите supabase.auth.signUp с email и password.',
$st$async function register(email, password) {
  // ваш код здесь
}$st$,
'{"requiredText":["supabase.auth.signUp"]}'::jsonb,
'["Метод signUp на auth", "Принимает объект с email/password", "await т.к. возвращает Promise"]'::jsonb,
100, 1);

-- Module 2: Database
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Database', 'database', 2, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'select / insert / update', 'crud',
'supabase.from("table").select("*") возвращает все строки. .eq("col", val) — фильтр. .insert([{...}]) — добавить. .update({...}).eq("id", x) — обновить. RLS-политики ограничивают доступ — без них запросы вернут пустой массив.',
$ex$const { data } = await supabase.from("courses").select("*");
await supabase.from("notes").insert([{ text: "hi" }]);
await supabase.from("notes").update({ done: true }).eq("id", 1);$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Получить курсы',
'Сделайте select("*") из таблицы courses.',
$st$async function loadCourses() {
  // const { data } = await supabase.from(...)
}$st$,
'{"requiredText":["supabase.from","courses","select","*"]}'::jsonb,
'["from(\"courses\") выбирает таблицу", "select(\"*\") — все колонки", "Деструктурируйте { data }"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Realtime подписки', 'realtime',
'supabase.channel("name").on("postgres_changes", ...) подписывает на изменения таблицы. Уведомления приходят через WebSocket. Не забудьте отписываться при unmount: supabase.removeChannel(ch).',
$ex$const ch = supabase.channel("rooms")
  .on("postgres_changes", { event: "*", schema: "public", table: "messages" },
      (payload) => console.log(payload))
  .subscribe();$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Подписка на таблицу',
'Создайте channel и подпишитесь на изменения таблицы messages.',
$st$// supabase.channel(...).on(...).subscribe()$st$,
'{"requiredText":["supabase.channel","postgres_changes","messages","subscribe"]}'::jsonb,
'["channel создаёт канал", "on(postgres_changes, …)", "subscribe запускает подписку"]'::jsonb,
100, 1);

-- =============================================================================
-- Frontend Projects
-- =============================================================================
SELECT id INTO c_id FROM public.courses WHERE slug='frontend-projects';

-- Module 1: Лендинг
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'Лендинг', 'landing', 1, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Структура лендинга', 'landing-structure',
'Лендинг — одностраничный сайт с одной целью (продажа курса, подписка). Типичная структура: hero (заголовок + CTA), features, social proof (отзывы), pricing, FAQ, footer. Главное правило — ясный CTA выше первой прокрутки.',
$ex$<section class="hero">
  <h1>Заголовок</h1>
  <p>Подзаголовок</p>
  <a href="#cta" class="btn">Купить</a>
</section>$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Hero-секция',
'Сделайте section.hero с h1 "Buy" и кнопкой <a class="btn">CTA</a>.',
$st$<section class="hero">
  <!-- h1 + a.btn -->
</section>$st$,
'{"requiredTags":["section","h1","a"],"requiredText":["Buy","CTA"]}'::jsonb,
'["Класс hero на section", "h1 — главный заголовок", "Ссылка с классом btn"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'CTA и формы захвата', 'cta',
'CTA (call-to-action) — кнопка/ссылка, ведущая к целевому действию. Должна выделяться: контрастный цвет, явный текст ("Купить", "Записаться"), большой размер. Дублируйте CTA через каждые 1-2 экрана прокрутки.',
$ex$<a href="#pricing" class="btn btn-primary">
  Записаться на курс
</a>$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Контрастный CTA',
'Стиль .btn-primary: background indigo, color white, padding 12px 24px, border-radius 16px.',
$st$/* CSS для .btn-primary */$st$,
'{"requiredText":[".btn-primary","background","color: white","border-radius"]}'::jsonb,
'["color: white", "background — яркий цвет", "border-radius для скругления"]'::jsonb,
100, 1);

-- Module 2: SPA-проект
INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
VALUES (c_id, 'SPA-проект', 'spa', 2, true) RETURNING id INTO m_id;

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Роутинг в React', 'routing',
'React Router — стандартное решение для SPA. <BrowserRouter> в корне, <Routes><Route path="/" element={<Home/>}/></Routes>. Навигация через <Link to="/about">. Хук useNavigate — программная навигация.',
$ex$import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
<BrowserRouter>
  <Link to="/">Home</Link>
  <Routes>
    <Route path="/" element={<Home/>}/>
  </Routes>
</BrowserRouter>$ex$,
1, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'Маршрут /about',
'Добавьте Route с path="/about" и element={<About/>}.',
$st$<Routes>
  {/* добавьте Route */}
</Routes>$st$,
'{"requiredText":["<Route","path=\"/about\"","element={<About"]}'::jsonb,
'["<Route> — самозакрывающийся", "path — путь URL", "element — компонент"]'::jsonb,
100, 1);

INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
VALUES (m_id, 'Финальный pet-проект', 'pet-project',
'Объедините всё: React + TypeScript + Tailwind + Supabase. Минимальный pet: задачник (todo) с auth, сохранением в БД, списком задач, добавлением, удалением. Деплой через Vercel/Netlify. Не забудьте README с описанием.',
$ex$// stack: Vite + React + TS + Tailwind + Supabase
// pages: /login, /tasks
// table: tasks(id, user_id, title, done)$ex$,
2, 50, true) RETURNING id INTO l_id;
INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
VALUES (l_id, 'README проекта',
'В комментарии перечислите 4 раздела хорошего README: title, описание, как запустить, технологии.',
$st$/*
- ...
- ...
- ...
- ...
*/$st$,
'{"requiredText":["title","описание","запустить","технологии"]}'::jsonb,
'["Заголовок проекта", "Кратко: что делает", "Команды для запуска", "Стек технологий"]'::jsonb,
100, 1);

END $seed$;

COMMIT;

-- =============================================================================
-- ПОСЛЕ ВЫПОЛНЕНИЯ:
--   1. Откройте сайт HiraLearn → /courses
--   2. Должно отобразиться 11 курсов с описаниями и уровнями
--   3. Кликните на любой курс → откроется список модулей
--   4. Кликните на модуль → откроется список уроков
--   5. Кликните на урок → теория + example_code + задача
--
-- ЕСЛИ КУРСЫ НЕ ПОЯВИЛИСЬ:
--   * Проверьте, что выполнились ОБЕ миграции
--     (supabase/migrations/20260425_init_schema.sql,
--      supabase/migrations/20260426_admin_monitoring.sql)
--   * В Supabase Dashboard → Table editor → courses должно быть 11 строк
--   * Если 0 строк — проверьте логи SQL Editor (вкладка "Output")
--   * Если строки есть, но на сайте нет — перезагрузите страницу с очисткой кэша
--     (Ctrl+Shift+R)
--   * Откройте DevTools → Network → найдите запрос к /rest/v1/courses,
--     посмотрите ответ. Если 401/403 — проблема с RLS, проверьте, что
--     политика "Published courses are viewable" включена.
-- =============================================================================
