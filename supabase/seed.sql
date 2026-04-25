
-- Seed data for HiraLearn MVP

-- 1. Create a course
INSERT INTO courses (title, slug, description, is_published)
VALUES ('Frontend с нуля', 'frontend-zero', 'Освой HTML, CSS и JavaScript с полным погружением.', true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Create a module
INSERT INTO modules (course_id, title, order_index, is_published)
SELECT id, 'Основы HTML', 1, true FROM courses WHERE slug = 'frontend-zero'
ON CONFLICT DO NOTHING;

-- 3. Create lessons
INSERT INTO lessons (module_id, title, theory, order_index, xp_reward, is_published)
SELECT id, 'Что такое HTML', 'HTML (HyperText Markup Language) — это язык разметки документов во Всемирной паутине. Он говорит браузеру, как отображать контент.', 1, 50, true
FROM modules WHERE title = 'Основы HTML'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, theory, order_index, xp_reward, is_published)
SELECT id, 'Теги и структура', 'Каждый тег — это кирпичик. Большинство тегов парные: <tag>контент</tag>.', 2, 50, true
FROM modules WHERE title = 'Основы HTML'
ON CONFLICT DO NOTHING;

-- 4. Create tasks for the first lesson
INSERT INTO tasks (lesson_id, description, starter_code, validation_rules, xp_reward, order_index)
SELECT id, 'Создай заголовок первого уровня h1 с текстом "Привет, Сэнсэй"', '<!-- Напиши код здесь -->', '{"requiredTags": ["h1"], "requiredText": ["Привет, Сэнсэй"]}', 100, 1
FROM lessons WHERE title = 'Что такое HTML'
ON CONFLICT DO NOTHING;
