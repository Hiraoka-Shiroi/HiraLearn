-- Seed data for HiraLearn

-- 1. Create the first course
INSERT INTO courses (title, slug, description, level, is_published)
VALUES ('Frontend с нуля', 'frontend-zero', 'Полноценный путь от полного нуля до Junior Frontend разработчика.', 'beginner', true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Create modules
INSERT INTO modules (course_id, title, slug, description, order_index, is_published)
SELECT id, 'Основы HTML', 'html-basics', 'Изучаем структуру веб-страниц и основные теги.', 1, true
FROM courses WHERE slug = 'frontend-zero'
ON CONFLICT DO NOTHING;

INSERT INTO modules (course_id, title, slug, description, order_index, is_published)
SELECT id, 'CSS Стилизация', 'css-styling', 'Превращаем текст в красоту. Цвета, отступы, сетки.', 2, true
FROM courses WHERE slug = 'frontend-zero'
ON CONFLICT DO NOTHING;

INSERT INTO modules (course_id, title, slug, description, order_index, is_published)
SELECT id, 'JavaScript Основы', 'js-basics', 'Добавляем интерактивность. Переменные, функции, DOM.', 3, true
FROM courses WHERE slug = 'frontend-zero'
ON CONFLICT DO NOTHING;

-- 3. Create lessons for HTML module
INSERT INTO lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
SELECT id, 'Что такое HTML', 'what-is-html',
  'HTML (HyperText Markup Language) — это язык разметки документов в интернете. Он состоит из тегов, которые говорят браузеру, как отображать контент.

Каждый тег — это инструкция: покажи заголовок, покажи картинку, покажи список. Теги пишутся в угловых скобках: <тег>содержимое</тег>.

HTML — это скелет любого сайта. Без него браузер не знает, что показывать.',
  '<html>\n  <head>\n    <title>Мой сайт</title>\n  </head>\n  <body>\n    <h1>Привет!</h1>\n    <p>Это мой первый сайт</p>\n  </body>\n</html>', 1, 50, true
FROM modules WHERE slug = 'html-basics'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
SELECT id, 'Теги и структура', 'tags-structure',
  'Каждый HTML-документ имеет базовую структуру:

1. <!DOCTYPE html> — говорит браузеру, что это HTML5
2. <html> — корневой элемент
3. <head> — мета-информация (заголовок, стили)
4. <body> — видимый контент страницы

Большинство тегов парные: <tag>контент</tag>. Некоторые одиночные: <br>, <img>, <hr>.',
  '<!DOCTYPE html>\n<html>\n  <head>\n    <title>Структура</title>\n  </head>\n  <body>\n    <h1>Заголовок</h1>\n    <p>Параграф</p>\n    <hr>\n    <img src="photo.jpg">\n  </body>\n</html>', 2, 50, true
FROM modules WHERE slug = 'html-basics'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
SELECT id, 'Списки и ссылки', 'lists-links',
  'HTML позволяет создавать:

Упорядоченные списки (<ol>) — пронумерованные:
<ol><li>Первый</li><li>Второй</li></ol>

Неупорядоченные списки (<ul>) — маркированные:
<ul><li>Яблоко</li><li>Банан</li></ul>

Ссылки (<a>) — переходы на другие страницы:
<a href="https://example.com">Перейти</a>',
  '<ul>\n  <li><a href="page1.html">Главная</a></li>\n  <li><a href="page2.html">О нас</a></li>\n  <li><a href="page3.html">Контакты</a></li>\n</ul>', 3, 50, true
FROM modules WHERE slug = 'html-basics'
ON CONFLICT DO NOTHING;

-- 4. Create tasks for lessons
INSERT INTO tasks (lesson_id, title, description, task_type, starter_code, expected_solution, validation_rules, hints, xp_reward, order_index)
SELECT id, 'Твой первый тег', 'Создай заголовок первого уровня <h1> с текстом "Привет, Сэнсэй!"',
  'code_editor',
  '<!-- Напиши код здесь -->',
  '<h1>Привет, Сэнсэй!</h1>',
  '{"requiredTags": ["h1"], "requiredText": ["Привет, Сэнсэй!"]}',
  '["Тег заголовка первого уровня — это <h1>", "Не забудь закрыть тег: </h1>", "Текст должен быть точно: Привет, Сэнсэй!"]',
  100, 1
FROM lessons WHERE slug = 'what-is-html'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (lesson_id, title, description, task_type, starter_code, expected_solution, validation_rules, hints, xp_reward, order_index)
SELECT id, 'Параграф', 'Добавь параграф <p> с текстом "Я учу HTML" после заголовка.',
  'code_editor',
  '<h1>Привет!</h1>\n<!-- Добавь параграф здесь -->',
  '<h1>Привет!</h1>\n<p>Я учу HTML</p>',
  '{"requiredTags": ["h1", "p"], "requiredText": ["Привет!", "Я учу HTML"]}',
  '["Тег параграфа — это <p>", "Не забудь закрыть: </p>"]',
  100, 2
FROM lessons WHERE slug = 'what-is-html'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (lesson_id, title, description, task_type, starter_code, expected_solution, validation_rules, hints, xp_reward, order_index)
SELECT id, 'Базовая структура', 'Создай полную структуру HTML-документа: DOCTYPE, html, head с title "Мой сайт", и body с заголовком h1 "Добро пожаловать".',
  'code_editor',
  '<!-- Создай полную структуру HTML -->',
  '<!DOCTYPE html>\n<html>\n  <head>\n    <title>Мой сайт</title>\n  </head>\n  <body>\n    <h1>Добро пожаловать</h1>\n  </body>\n</html>',
  '{"requiredTags": ["html", "head", "title", "body", "h1"], "requiredText": ["Мой сайт", "Добро пожаловать"]}',
  '["Начни с <!DOCTYPE html>", "Потом <html>, внутри <head> и <body>", "В <head> добавь <title>", "В <body> добавь <h1>"]',
  150, 1
FROM lessons WHERE slug = 'tags-structure'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (lesson_id, title, description, task_type, starter_code, expected_solution, validation_rules, hints, xp_reward, order_index)
SELECT id, 'Навигация', 'Создай неупорядоченный список <ul> с тремя ссылками: Главная (index.html), Курсы (courses.html), Контакты (contacts.html).',
  'code_editor',
  '<!-- Создай список со ссылками -->',
  '<ul>\n  <li><a href="index.html">Главная</a></li>\n  <li><a href="courses.html">Курсы</a></li>\n  <li><a href="contacts.html">Контакты</a></li>\n</ul>',
  '{"requiredTags": ["ul", "li", "a"], "requiredText": ["Главная", "Курсы", "Контакты"]}',
  '["Используй <ul> для списка", "Каждый пункт оборачивай в <li>", "Внутри <li> добавь <a href=\"...\">Текст</a>"]',
  150, 1
FROM lessons WHERE slug = 'lists-links'
ON CONFLICT DO NOTHING;
