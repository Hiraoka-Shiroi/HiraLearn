
-- Seed data for HiraLearn
-- 11 courses with modules, lessons, and XP rewards

-- ═══════════════════════════════════════════════════
-- COURSES
-- ═══════════════════════════════════════════════════

INSERT INTO courses (title, slug, description, level, is_published) VALUES
('HTML Basics', 'html-basics', 'Изучи основы HTML — язык разметки, который лежит в основе каждого сайта. Теги, атрибуты, формы, семантика.', 'beginner', true),
('CSS Basics', 'css-basics', 'Научись стилизовать веб-страницы с помощью CSS. Селекторы, свойства, Flexbox, анимации.', 'beginner', true),
('Responsive Layout', 'responsive-layout', 'Создавай адаптивные интерфейсы для любых экранов. Media queries, Grid, mobile-first подход.', 'intermediate', true),
('JavaScript Basics', 'js-basics', 'Погрузись в JavaScript — переменные, функции, циклы, массивы, объекты и основы работы с данными.', 'beginner', true),
('DOM & Events', 'dom-events', 'Научись управлять страницей через JavaScript. querySelector, addEventListener, динамический контент.', 'intermediate', true),
('React Basics', 'react-basics', 'Изучи React — компоненты, состояние (state), пропсы (props), хуки и создание SPA.', 'intermediate', true),
('TypeScript Basics', 'typescript-basics', 'Добавь типизацию в JavaScript. Интерфейсы, типы, дженерики и строгий код без ошибок.', 'intermediate', true),
('Git & GitHub', 'git-github', 'Освой систему контроля версий. Коммиты, ветки, merge, pull request и работа в команде.', 'beginner', true),
('API Basics', 'api-basics', 'Научись работать с API. REST, fetch, async/await, обработка ответов и ошибок.', 'intermediate', true),
('Supabase / Firebase Basics', 'backend-basics', 'Подключи бэкенд без написания серверного кода. Аутентификация, база данных, Storage.', 'intermediate', false),
('Frontend Projects', 'frontend-projects', 'Собери портфолио из реальных проектов. Лендинги, дашборды, приложения — всё с нуля.', 'advanced', false)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════
-- MODULES & LESSONS
-- ═══════════════════════════════════════════════════

-- ── HTML Basics ──────────────────────────────────
INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Введение в HTML', 'html-intro', 1, true FROM courses WHERE slug = 'html-basics'
ON CONFLICT DO NOTHING;

INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Текстовые теги', 'html-text-tags', 2, true FROM courses WHERE slug = 'html-basics'
ON CONFLICT DO NOTHING;

INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Формы и ввод', 'html-forms', 3, true FROM courses WHERE slug = 'html-basics'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Что такое HTML', 'what-is-html', 'HTML (HyperText Markup Language) — это язык разметки документов. Браузер читает HTML-код и отображает его как страницу с текстом, картинками и ссылками.', 1, 50, true
FROM modules WHERE slug = 'html-intro' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Структура HTML-документа', 'html-structure', 'Каждый HTML-документ начинается с <!DOCTYPE html>, затем идёт <html>, внутри — <head> и <body>. В head — метаинформация, в body — видимый контент.', 2, 50, true
FROM modules WHERE slug = 'html-intro' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Заголовки h1-h6', 'html-headings', 'Теги h1-h6 создают заголовки разных уровней. h1 — самый крупный и важный, h6 — самый мелкий. На странице должен быть только один h1.', 1, 40, true
FROM modules WHERE slug = 'html-text-tags' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Параграфы и переносы', 'html-paragraphs', 'Тег <p> создаёт параграф текста. Тег <br> делает перенос строки. <hr> — горизонтальная линия-разделитель.', 2, 40, true
FROM modules WHERE slug = 'html-text-tags' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Списки', 'html-lists', 'ul — маркированный список, ol — нумерованный. Каждый элемент оборачивается в <li>.', 3, 40, true
FROM modules WHERE slug = 'html-text-tags' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Элемент input', 'html-input', 'Тег <input> создаёт поле ввода. type="text" — текст, type="email" — email, type="password" — пароль. placeholder задаёт подсказку.', 1, 50, true
FROM modules WHERE slug = 'html-forms' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Кнопки и отправка', 'html-buttons', 'Тег <button> создаёт кнопку. type="submit" отправляет форму, type="button" — просто кнопка. Тег <form> оборачивает все поля.', 2, 50, true
FROM modules WHERE slug = 'html-forms' ON CONFLICT DO NOTHING;

-- ── CSS Basics ──────────────────────────────────
INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Введение в CSS', 'css-intro', 1, true FROM courses WHERE slug = 'css-basics'
ON CONFLICT DO NOTHING;

INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Flexbox', 'css-flexbox', 2, true FROM courses WHERE slug = 'css-basics'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Подключение CSS', 'css-linking', 'CSS подключается через тег <link rel="stylesheet" href="style.css"> в <head>. Также можно писать стили в <style> или inline через атрибут style.', 1, 40, true
FROM modules WHERE slug = 'css-intro' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Селекторы и свойства', 'css-selectors', 'Селектор указывает на элемент: h1 {} — все заголовки, .class {} — по классу, #id {} — по id. Свойства задают стиль: color, font-size, margin.', 2, 50, true
FROM modules WHERE slug = 'css-intro' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Цвета и фон', 'css-colors', 'color задаёт цвет текста, background-color — фон. Можно использовать имена (red), HEX (#ff0000), rgb(255,0,0) или hsl.', 3, 40, true
FROM modules WHERE slug = 'css-intro' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Основы Flexbox', 'css-flex-basics', 'display: flex превращает контейнер в flex-контейнер. justify-content управляет горизонтальным выравниванием, align-items — вертикальным.', 1, 60, true
FROM modules WHERE slug = 'css-flexbox' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Flex direction и wrap', 'css-flex-direction', 'flex-direction: row | column меняет направление. flex-wrap: wrap позволяет элементам переноситься на новую строку.', 2, 60, true
FROM modules WHERE slug = 'css-flexbox' ON CONFLICT DO NOTHING;

-- ── Responsive Layout ───────────────────────────
INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Media Queries', 'resp-media', 1, true FROM courses WHERE slug = 'responsive-layout'
ON CONFLICT DO NOTHING;

INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'CSS Grid', 'resp-grid', 2, true FROM courses WHERE slug = 'responsive-layout'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Viewport и meta', 'resp-viewport', 'Тег <meta name="viewport" content="width=device-width, initial-scale=1.0"> нужен для корректного отображения на мобильных.', 1, 50, true
FROM modules WHERE slug = 'resp-media' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Точки перелома', 'resp-breakpoints', '@media (max-width: 768px) {} — стили для экранов уже 768px. Mobile-first: сначала мобильный, потом @media (min-width).', 2, 50, true
FROM modules WHERE slug = 'resp-media' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Основы CSS Grid', 'resp-grid-basics', 'display: grid + grid-template-columns создаёт сетку. fr — единица свободного пространства. gap — отступы между ячейками.', 1, 60, true
FROM modules WHERE slug = 'resp-grid' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Grid и адаптивность', 'resp-grid-responsive', 'repeat(auto-fit, minmax(250px, 1fr)) создаёт автоматическую адаптивную сетку без media queries.', 2, 60, true
FROM modules WHERE slug = 'resp-grid' ON CONFLICT DO NOTHING;

-- ── JavaScript Basics ───────────────────────────
INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Переменные и типы', 'js-variables', 1, true FROM courses WHERE slug = 'js-basics'
ON CONFLICT DO NOTHING;

INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Функции и циклы', 'js-functions', 2, true FROM courses WHERE slug = 'js-basics'
ON CONFLICT DO NOTHING;

INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Массивы и объекты', 'js-arrays', 3, true FROM courses WHERE slug = 'js-basics'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'let, const, var', 'js-let-const', 'let — переменная, которую можно менять. const — константа. var — устаревший способ. Предпочитай const, потом let.', 1, 50, true
FROM modules WHERE slug = 'js-variables' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Типы данных', 'js-types', 'JavaScript имеет 7 примитивных типов: string, number, boolean, null, undefined, symbol, bigint. typeof проверяет тип.', 2, 50, true
FROM modules WHERE slug = 'js-variables' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Объявление функций', 'js-func-declaration', 'function sum(a, b) { return a + b; } — классическое объявление. const sum = (a, b) => a + b; — стрелочная функция.', 1, 60, true
FROM modules WHERE slug = 'js-functions' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Циклы for и while', 'js-loops', 'for (let i = 0; i < 10; i++) {} — цикл с счётчиком. while (условие) {} — цикл с условием. for...of — перебор массива.', 2, 60, true
FROM modules WHERE slug = 'js-functions' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Методы массивов', 'js-array-methods', 'push, pop, map, filter, find, reduce — основные методы. map создаёт новый массив, filter отбирает элементы, reduce сводит к одному значению.', 1, 70, true
FROM modules WHERE slug = 'js-arrays' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Работа с объектами', 'js-objects', 'Объект — набор пар ключ: значение. Доступ через точку obj.key или скобки obj["key"]. Деструктуризация: const { name } = obj;', 2, 70, true
FROM modules WHERE slug = 'js-arrays' ON CONFLICT DO NOTHING;

-- ── DOM & Events ────────────────────────────────
INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Работа с DOM', 'dom-basics', 1, true FROM courses WHERE slug = 'dom-events'
ON CONFLICT DO NOTHING;

INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'События', 'dom-event-handling', 2, true FROM courses WHERE slug = 'dom-events'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'querySelector', 'dom-query', 'document.querySelector(".class") находит первый элемент. querySelectorAll — все. getElementById — по id.', 1, 50, true
FROM modules WHERE slug = 'dom-basics' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Изменение элементов', 'dom-modify', 'textContent меняет текст, innerHTML — HTML-содержимое, classList.add/remove/toggle — классы, style.color — инлайн-стили.', 2, 60, true
FROM modules WHERE slug = 'dom-basics' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'addEventListener', 'dom-events-listener', 'element.addEventListener("click", handler) привязывает обработчик. Можно слушать click, input, submit, keydown и другие.', 1, 60, true
FROM modules WHERE slug = 'dom-event-handling' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Делегирование событий', 'dom-delegation', 'Вместо добавления обработчика на каждый элемент, вешаем один на родителя и проверяем event.target.', 2, 70, true
FROM modules WHERE slug = 'dom-event-handling' ON CONFLICT DO NOTHING;

-- ── React Basics ────────────────────────────────
INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Компоненты', 'react-components', 1, true FROM courses WHERE slug = 'react-basics'
ON CONFLICT DO NOTHING;

INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Состояние и хуки', 'react-hooks', 2, true FROM courses WHERE slug = 'react-basics'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'JSX и компоненты', 'react-jsx', 'JSX — это HTML-подобный синтаксис в JavaScript. Компонент — функция, которая возвращает JSX. Имя начинается с заглавной буквы.', 1, 60, true
FROM modules WHERE slug = 'react-components' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Props', 'react-props', 'Props — данные, которые передаются в компонент. <Card title="Hello" />. Внутри: function Card({ title }) { return <h1>{title}</h1>; }', 2, 60, true
FROM modules WHERE slug = 'react-components' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'useState', 'react-usestate', 'const [count, setCount] = useState(0); — создаёт переменную состояния. При вызове setCount компонент перерисовывается.', 1, 70, true
FROM modules WHERE slug = 'react-hooks' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'useEffect', 'react-useeffect', 'useEffect(() => { ... }, [deps]) — выполняет побочные эффекты. Пустой массив [] — один раз при монтировании.', 2, 70, true
FROM modules WHERE slug = 'react-hooks' ON CONFLICT DO NOTHING;

-- ── TypeScript Basics ───────────────────────────
INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Типы и интерфейсы', 'ts-types', 1, true FROM courses WHERE slug = 'typescript-basics'
ON CONFLICT DO NOTHING;

INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Дженерики', 'ts-generics', 2, true FROM courses WHERE slug = 'typescript-basics'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Базовые типы', 'ts-basic-types', 'let name: string = "Hira"; let age: number = 25; let active: boolean = true; TypeScript проверяет типы при компиляции.', 1, 50, true
FROM modules WHERE slug = 'ts-types' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Интерфейсы', 'ts-interfaces', 'interface User { name: string; age: number; } — описывает форму объекта. Можно расширять: interface Admin extends User { role: string; }', 2, 60, true
FROM modules WHERE slug = 'ts-types' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Основы дженериков', 'ts-generics-basics', 'function identity<T>(arg: T): T { return arg; } — дженерик функция. T заменяется реальным типом при вызове.', 1, 70, true
FROM modules WHERE slug = 'ts-generics' ON CONFLICT DO NOTHING;

-- ── Git & GitHub ────────────────────────────────
INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Основы Git', 'git-basics', 1, true FROM courses WHERE slug = 'git-github'
ON CONFLICT DO NOTHING;

INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'GitHub и командная работа', 'git-collaboration', 2, true FROM courses WHERE slug = 'git-github'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'git init и commit', 'git-init-commit', 'git init создаёт репозиторий. git add . добавляет файлы. git commit -m "message" — сохраняет изменения в истории.', 1, 40, true
FROM modules WHERE slug = 'git-basics' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Ветки и merge', 'git-branches', 'git branch feature создаёт ветку. git checkout feature переключает. git merge feature — вливает ветку обратно.', 2, 50, true
FROM modules WHERE slug = 'git-basics' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Pull Request', 'git-pr', 'PR (Pull Request) — запрос на слияние ветки. Создаётся на GitHub. Команда ревьюит код, оставляет комментарии, затем мерджит.', 1, 50, true
FROM modules WHERE slug = 'git-collaboration' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Конфликты и их решение', 'git-conflicts', 'Конфликты возникают когда два человека редактировали одну строку. Git помечает конфликты маркерами <<<<<<< и >>>>>>>.', 2, 60, true
FROM modules WHERE slug = 'git-collaboration' ON CONFLICT DO NOTHING;

-- ── API Basics ──────────────────────────────────
INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'HTTP и REST', 'api-http', 1, true FROM courses WHERE slug = 'api-basics'
ON CONFLICT DO NOTHING;

INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Fetch и async/await', 'api-fetch', 2, true FROM courses WHERE slug = 'api-basics'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Что такое API', 'api-intro', 'API — интерфейс для общения программ. REST API использует HTTP-методы: GET (получить), POST (создать), PUT (обновить), DELETE (удалить).', 1, 50, true
FROM modules WHERE slug = 'api-http' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Статус-коды', 'api-status-codes', '200 — OK, 201 — Created, 400 — Bad Request, 401 — Unauthorized, 404 — Not Found, 500 — Server Error.', 2, 40, true
FROM modules WHERE slug = 'api-http' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'fetch() и промисы', 'api-fetch-basics', 'fetch(url) возвращает промис. .then(res => res.json()) парсит JSON. .catch(err => ...) обрабатывает ошибки.', 1, 60, true
FROM modules WHERE slug = 'api-fetch' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'async/await', 'api-async-await', 'async function getData() { const res = await fetch(url); const data = await res.json(); return data; } — чище чем цепочки .then().', 2, 60, true
FROM modules WHERE slug = 'api-fetch' ON CONFLICT DO NOTHING;

-- ── Supabase / Firebase Basics ──────────────────
INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Backend-as-a-Service', 'baas-intro', 1, true FROM courses WHERE slug = 'backend-basics'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Что такое BaaS', 'baas-what', 'BaaS (Backend-as-a-Service) — готовый бэкенд. Supabase и Firebase дают базу данных, аутентификацию и хранилище файлов без написания серверного кода.', 1, 50, true
FROM modules WHERE slug = 'baas-intro' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Подключение Supabase', 'baas-supabase-setup', 'Установи @supabase/supabase-js. Создай клиент: createClient(url, anonKey). Используй supabase.from("table").select("*") для запросов.', 2, 60, true
FROM modules WHERE slug = 'baas-intro' ON CONFLICT DO NOTHING;

-- ── Frontend Projects ───────────────────────────
INSERT INTO modules (course_id, title, slug, order_index, is_published)
SELECT id, 'Портфолио-проекты', 'projects-portfolio', 1, true FROM courses WHERE slug = 'frontend-projects'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Лендинг с нуля', 'project-landing', 'Создай одностраничный лендинг: hero-секция, features, pricing, footer. Используй HTML, CSS и немного JS для мобильного меню.', 1, 100, true
FROM modules WHERE slug = 'projects-portfolio' ON CONFLICT DO NOTHING;

INSERT INTO lessons (module_id, title, slug, theory, order_index, xp_reward, is_published)
SELECT id, 'Todo-приложение на React', 'project-todo', 'Классический проект: список задач с добавлением, удалением и отметкой выполнения. Используй useState, map, filter.', 2, 100, true
FROM modules WHERE slug = 'projects-portfolio' ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════
-- TASKS (for published lessons that have hands-on exercises)
-- ═══════════════════════════════════════════════════

INSERT INTO tasks (lesson_id, title, description, starter_code, validation_rules, xp_reward, order_index)
SELECT id, 'Твой первый тег', 'Создай заголовок первого уровня h1 с текстом "Привет, Сэнсэй"', '<!-- Напиши код здесь -->', '{"requiredTags": ["h1"], "requiredText": ["Привет, Сэнсэй"]}', 100, 1
FROM lessons WHERE slug = 'what-is-html' ON CONFLICT DO NOTHING;

INSERT INTO tasks (lesson_id, title, description, starter_code, validation_rules, xp_reward, order_index)
SELECT id, 'Структура документа', 'Напиши базовую структуру HTML: DOCTYPE, html, head с title, body с h1', '<!-- Создай полную структуру -->', '{"requiredTags": ["html", "head", "title", "body", "h1"]}', 100, 1
FROM lessons WHERE slug = 'html-structure' ON CONFLICT DO NOTHING;

INSERT INTO tasks (lesson_id, title, description, starter_code, validation_rules, xp_reward, order_index)
SELECT id, 'Стилизуй заголовок', 'Добавь CSS: сделай h1 синим цветом и размером 32px', '<h1>Hello CSS</h1>\n<style>\n/* Твой CSS */\n</style>', '{"requiredTags": ["style", "h1"]}', 80, 1
FROM lessons WHERE slug = 'css-selectors' ON CONFLICT DO NOTHING;
