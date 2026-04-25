import { Database } from '@/types/database';

type Lesson = Database['public']['Tables']['lessons']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];
type Course = Database['public']['Tables']['courses']['Row'];

export const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Frontend с нуля',
    slug: 'frontend-zero',
    description: 'Полноценный путь от полного нуля до Junior Frontend разработчика.',
    level: 'beginner',
    is_published: true,
    created_at: new Date().toISOString()
  }
];

export const MOCK_MODULES: Module[] = [
  {
    id: 'module-1',
    course_id: 'course-1',
    title: 'Основы HTML',
    slug: 'html-basics',
    description: 'Изучаем структуру веб-страниц и основные теги.',
    order_index: 1,
    is_published: true,
    created_at: new Date().toISOString()
  }
];

export const MOCK_LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    module_id: 'module-1',
    title: 'Что такое HTML',
    slug: 'what-is-html',
    theory: 'HTML (HyperText Markup Language) — это язык разметки документов в интернете. Он состоит из тегов, которые описывают структуру страницы.',
    example_code: '<html>\n  <body>Привет!</body>\n</html>',
    order_index: 1,
    xp_reward: 50,
    is_published: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'lesson-2',
    module_id: 'module-1',
    title: 'Теги и структура',
    slug: 'tags-structure',
    theory: 'Каждый HTML файл начинается с объявления doctype и содержит корневой элемент html, внутри которого находятся head (мета-информация) и body (контент).',
    example_code: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>Заголовок</title>\n  </head>\n  <body>\n    Контент страницы\n  </body>\n</html>',
    order_index: 2,
    xp_reward: 50,
    is_published: true,
    created_at: new Date().toISOString()
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    lesson_id: 'lesson-1',
    title: 'Твой первый тег',
    description: 'Добавь тег <body> внутри тега <html> и напиши в нем "Привет"',
    task_type: 'code_editor',
    starter_code: '<html>\n  <!-- Твой код здесь -->\n</html>',
    expected_solution: '<html><body>Привет</body></html>',
    validation_rules: { solutionRegex: ["<body>", "Привет", "</body>"] },
    hints: ["Тег body идет после открытия html", "Не забудь закрыть тег /body"],
    xp_reward: 100,
    order_index: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 'task-2',
    lesson_id: 'lesson-2',
    title: 'Заголовок страницы',
    description: 'Создай заголовок <h1> с текстом "Мой первый сайт"',
    task_type: 'code_editor',
    starter_code: '<body>\n  <!-- Добавь заголовок здесь -->\n</body>',
    expected_solution: '<body><h1>Мой первый сайт</h1></body>',
    validation_rules: { solutionRegex: ["<h1>", "Мой первый сайт", "</h1>"] },
    hints: ["Заголовок h1 — самый важный на странице", "Убедись, что текст внутри тега точный"],
    xp_reward: 100,
    order_index: 2,
    created_at: new Date().toISOString()
  }
];
