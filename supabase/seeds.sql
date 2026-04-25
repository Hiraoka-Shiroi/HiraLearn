-- 1. Создаем первый курс
INSERT INTO courses (title, slug, description, level, is_published)
VALUES ('Frontend с нуля', 'frontend-zero', 'Полноценный путь от полного нуля до Junior Frontend разработчика.', 'beginner', true);

-- Получаем ID курса (для ручного ввода в следующие запросы или используйте переменные)
-- Пусть ID курса будет 'f0e0d0c0-b0a0-9080-7060-504030201000' для примера

-- 2. Создаем первый модуль
INSERT INTO modules (course_id, title, slug, description, order_index, is_published)
SELECT id, 'Основы HTML', 'html-basics', 'Изучаем структуру веб-страниц и основные теги.', 1, true
FROM courses WHERE slug = 'frontend-zero';

-- 3. Создаем первый урок
INSERT INTO lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
SELECT id, 'Что такое HTML', 'what-is-html', 'HTML (HyperText Markup Language) — это язык разметки документов в интернете. Он состоит из тегов.', '<html>\n  <body>Привет!</body>\n</html>', 1, 50, true
FROM modules WHERE slug = 'html-basics';

-- 4. Создаем задание к первому уроку
INSERT INTO tasks (lesson_id, title, description, task_type, starter_code, expected_solution, validation_rules, hints, xp_reward, order_index)
SELECT id, 'Твой первый тег', 'Добавь тег <body> внутри тега <html> и напиши в нем "Привет"', 'code_editor', '<html>\n  <!-- Твой код здесь -->\n</html>', '<html><body>Привет</body></html>',
'{"solutionRegex": ["<body>", "Привет", "</body>"]}',
'["Тег body идет после открытия html", "Не забудь закрыть тег /body"]', 100, 1
FROM lessons WHERE slug = 'what-is-html';
