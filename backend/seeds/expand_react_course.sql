-- =============================================================================
-- expand_react_course.sql
-- -----------------------------------------------------------------------------
-- Idempotent expansion of the "React Basics" course. Safe to run multiple times
-- and safe against a database that already has the original 6 lessons.
--
--   1. Rewrites the theory of the 6 existing React lessons (much clearer,
--      more detail, analogies, common pitfalls).
--   2. Adds 11 new lessons:
--        M1 components     + import/export, conditional rendering
--        M2 state-effects  + objects/arrays in state (immutability), useRef
--        M3 lists-forms    + select/checkbox/textarea, lifting state up
--        M4 hooks-data     + fetch in useEffect, useMemo/useCallback, custom hooks
--        M5 routing-style  + React Router, styling approaches
--
-- Run in Supabase → SQL Editor. Nothing is dropped; existing user progress is
-- preserved (lessons are matched by module+slug, tasks only inserted for new
-- lessons).
-- =============================================================================

DO $$
DECLARE
  c_id uuid;
  m1 uuid; m2 uuid; m3 uuid; m4 uuid; m5 uuid;
  l_id uuid;
BEGIN
  SELECT id INTO c_id FROM public.courses WHERE slug = 'react-basics';
  IF NOT FOUND THEN
    RAISE NOTICE 'Course react-basics not found — nothing to expand.';
    RETURN;
  END IF;

  -- Refresh course description to reflect the expanded curriculum.
  UPDATE public.courses
  SET description = 'Компоненты, JSX, props, useState, useEffect, списки, формы, хуки (useRef/useMemo/useCallback), работа с API, роутинг и стилизация в React 18.'
  WHERE id = c_id;

  -- Resolve existing modules.
  SELECT id INTO m1 FROM public.modules WHERE course_id = c_id AND slug = 'components';
  SELECT id INTO m2 FROM public.modules WHERE course_id = c_id AND slug = 'state-effects';
  SELECT id INTO m3 FROM public.modules WHERE course_id = c_id AND slug = 'lists-forms';

  -- ===========================================================================
  -- PART 1. Clearer theory for the 6 existing lessons.
  -- ===========================================================================

  -- 1. JSX ---------------------------------------------------------------------
  UPDATE public.lessons SET
    theory = $th$JSX — это синтаксис, который выглядит как HTML, но внутри JavaScript. Он не исполняется браузером напрямую: сборщик (Vite) превращает каждый <тег /> в вызов React.createElement(...). Поэтому писать можно «как HTML», но есть важные отличия:

• Атрибуты — в camelCase: не class, а className; не for, а htmlFor; не onclick, а onClick.
• Любое JS-выражение подставляется через фигурные скобки: <h1>Привет, {name}</h1>. Там же работают тернарники, вызовы функций, методы массивов.
• У компонента должен быть один корневой элемент. Если не хочешь лишнюю обёртку — используй Fragment: <>...</>.
• Теги без детей закрываются сразу: <img />, <input />.
• Комментарии внутри JSX: {/* так */}, а не //.

Правило: всё, что в фигурных скобках — JavaScript; всё, что вне — описание интерфейса.$th$,
    example_code = $ex$import { useState } from "react";

function Welcome({ name }) {
  const isAdmin = name === "Admin";
  return (
    <>
      <h1 className="title">Привет, {name}!</h1>
      <p>{isAdmin ? "Полный доступ" : "Обычный пользователь"}</p>
    </>
  );
}$ex$
  WHERE module_id = m1 AND slug = 'jsx';

  -- 2. Props -------------------------------------------------------------------
  UPDATE public.lessons SET
    theory = $th$Props (сокращение от properties) — это данные, которые родительский компонент передаёт дочернему. Думай о них как об аргументах функции: родитель вызывает <Card title="Привет" />, а внутри Card эти значения доступны как объект props.

Ключевые правила:
• Props только для чтения (readonly). Компонент никогда не меняет свои props — если значение должно меняться, это state.
• Удобнее всего деструктурировать сразу в параметрах: function Card({ title, price }) {}.
• Особый проп children — всё, что ты пишешь «внутрь» компонента между открывающим и закрывающим тегом. Через него делают обёртки (модалки, карточки с контентом).
• Передавать можно что угодно: строки, числа, булевы флаги, объекты, массивы и даже функции (колбэки для событий).
• Проп key — специальный, его нельзя прочитать внутри компонента; он нужен React для списков.

Совет: называй props понятно и не передавай больше 3–4 за раз — иначе компонент становится перегруженным.$th$,
    example_code = $ex$function Card({ title, children, onClose }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="card-body">{children}</div>
      <button onClick={onClose}>Закрыть</button>
    </div>
  );
}

// Использование:
<Card title="Уведомление" onClose={() => alert("закрыто")}>
  <p>Текст внутри children</p>
</Card>$ex$
  WHERE module_id = m1 AND slug = 'props';

  -- 3. useState ----------------------------------------------------------------
  UPDATE public.lessons SET
    theory = $th$useState — это хук, который добавляет компоненту «память». Обычная переменная забывается после каждого рендера и не вызывает обновление экрана. А state: сохраняется между рендерами И при изменении заставляет компонент перерисоваться.

Вызов возвращает массив из двух элементов, который принято деструктурировать:
const [count, setCount] = useState(0);
• count — текущее значение (читаем)
• setCount — функция для обновления (только через неё!)

Важные детали:
• Если новое значение зависит от старого — используй функциональную форму: setCount(c => c + 1). Это защищает от «устаревших» значений при быстрых кликах.
• Для объекта или массива в state нужно создавать НОВЫЙ объект/массив (через spread {...obj}), а не мутировать старый — иначе React не увидит изменение.
• Можно объявить сколько угодно useState в одном компоненте — для имени, возраста, списка и т.д.
• Правила хуков: вызывай только на верхнем уровне компонента (не в if/цикле) и только из React-компонентов или других хуков.$th$,
    example_code = $ex$import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep]   = useState(1);

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={() => setCount(c => c + step)}>+{step}</button>
      <button onClick={() => setStep(s => s + 1)}>Увеличить шаг: {step}</button>
    </div>
  );
}$ex$
  WHERE module_id = m2 AND slug = 'use-state';

  -- 4. useEffect ---------------------------------------------------------------
  UPDATE public.lessons SET
    theory = $th$useEffect — хук для «побочных эффектов»: всего, что не относится напрямую к отрисовке интерфейса. Запросы к API, таймеры, подписки, работа с document.title, ручная работа с DOM — всё это эффекты. Они выполняются ПОСЛЕ того, как React отрисовал компонент на экран.

Второй аргумент — массив зависимостей — определяет, КОГДА эффект перезапускается:
• [] (пустой) — один раз, при монтировании компонента.
• [a, b] — при монтировании и каждый раз, когда меняется a или b.
• без второго аргумента — после КАЖДОГО рендера (почти всегда не то, что нужно).

Очистка: если эффект что-то «занимает» (таймер, подписка, слушатель события), верни из него функцию очистки — React вызовет её перед удалением компонента и перед каждым перезапуском эффекта. Это утечек памяти не допустит.

Частая ошибка — забыть зависимость и получить «устаревшее замыкание» (stale closure): эффект видит старое значение переменной. Если линтер ругается на missing dependency — почти всегда он прав.$th$,
    example_code = $ex$import { useState, useEffect } from "react";

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    // Очистка: убираем таймер, когда компонент удаляется
    return () => clearInterval(timer);
  }, []); // [] — один раз при монтировании

  return <p>Сейчас: {time.toLocaleTimeString()}</p>;
}$ex$
  WHERE module_id = m2 AND slug = 'use-effect';

  -- 5. Рендер списков ----------------------------------------------------------
  UPDATE public.lessons SET
    theory = $th$Чтобы показать массив данных (список товаров, сообщений, пользователей), используй метод массива map: он превращает каждый элемент в JSX-разметку. React умеет отрисовывать массивы элементов сам.

Обязательное правило — атрибут key у каждого элемента списка:
• key помогает React понять, какой элемент изменился, добавился или удалился, и обновлять только его (а не перерисовывать весь список).
• key должен быть уникальным и стабильным — лучше всего id из базы данных.
• Не используй индекс массива как key, если порядок элементов может меняться (добавление/удаление/сортировка) — это приведёт к багам и потере состояния элементов.

Полезные приёмы:
• Перед map можно отфильтровать массив: items.filter(...).map(...).
• Если не хочешь обёртку-элемент, используй <Fragment key={id}>...</Fragment> (с key на Fragment).$th$,
    example_code = $ex$const products = [
  { id: 1, name: "Кофе",  price: 150 },
  { id: 2, name: "Чай",   price: 100 },
  { id: 3, name: "Какао", price: 120 },
];

function Menu() {
  return (
    <ul>
      {products
        .filter(p => p.price > 110)
        .map(p => (
          <li key={p.id}>
            {p.name}: {p.price} ₽
          </li>
        ))}
    </ul>
  );
}$ex$
  WHERE module_id = m3 AND slug = 'lists';

  -- 6. Контролируемые формы ----------------------------------------------------
  UPDATE public.lessons SET
    theory = $th$В React есть два подхода к формам. Контролируемый компонент (controlled) — когда значение поля хранится в state и React управляет им: value={text} показывает текущее значение, а onChange обновляет state при каждом нажатии клавиши.

Почему это удобно:
• Значение всегда доступно в переменной — не нужно «доставать» его из DOM через querySelector.
• Можно валидировать на лету, форматировать (телефон, дату), дизейблить кнопку отправки пока форма невалидна.
• Легко сбросить или подставить значение из API.

Паттерн для одного поля: const [text, setText] = useState(""); и <input value={text} onChange={e => setText(e.target.value)} />.
Для нескольких полей удобно один state-объект: const [form, setForm] = useState({name:"", email:""}); и обновлять по вычисляемому ключу: e => setForm(f => ({...f, [e.target.name]: e.target.value})).
При отправке не забудь e.preventDefault() — иначе страница перезагрузится.$th$,
    example_code = $ex$import { useState } from "react";

function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const update = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const valid = form.email.includes("@") && form.password.length >= 6;

  const submit = e => {
    e.preventDefault();
    alert(`Вход: ${form.email}`);
  };

  return (
    <form onSubmit={submit}>
      <input name="email"    value={form.email}    onChange={update} placeholder="Email" />
      <input name="password" value={form.password} onChange={update} type="password" />
      <button disabled={!valid}>Войти</button>
    </form>
  );
}$ex$
  WHERE module_id = m3 AND slug = 'controlled-forms';

  -- ===========================================================================
  -- PART 2. New lessons in existing modules.
  -- ===========================================================================

  -- M1 / lesson 3: Импорт и экспорт компонентов --------------------------------
  SELECT id INTO l_id FROM public.lessons WHERE module_id = m1 AND slug = 'import-export';
  IF NOT FOUND THEN
    INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
    VALUES (m1, 'Импорт и экспорт компонентов', 'import-export',
$th$Когда приложение растёт, держать все компоненты в одном файле невозможно. Принято каждый компонент — в отдельном файле, а собирать всё вместе через import / export.

Два вида экспорта:
• Именованный: export function Button() {} — импортируется с фигурными скобками: import { Button } from "./Button".
• По умолчанию (default): export default function Button() {} — импортируется без скобок: import Button from "./Button". В одном файле только один default.

Правила импорта:
• Из react импортируй хуки и утилиты: import { useState, useEffect } from "react".
• Свои файлы подключай по относительному пути: ./components/Button (расширение .jsx/.tsx можно не писать).
• Имя файла компонента — с большой буквы, как и сам компонент: Button.jsx.
• CSS часто импортируют прямо в JS-файл: import "./Button.css" — сборщик сам подключит стили.

Совет: один файл — одна ответственность. Если компонент разросся — выдели из него подкомпоненты в соседние файлы.$th$,
$ex$// ===== Button.jsx =====
export default function Button({ label, onClick }) {
  return <button onClick={onClick}>{label}</button>;
}

// ===== helpers.js (именованные экспорты) =====
export function formatPrice(n) { return n + " ₽"; }
export const MAX_ITEMS = 10;

// ===== App.jsx =====
import Button from "./Button";
import { formatPrice } from "./helpers";

export default function App() {
  return <Button label={formatPrice(500)} onClick={() => {}} />;
}$ex$,
    3, 50, true) RETURNING id INTO l_id;

    INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
    VALUES (l_id, 'Импортируй useState',
'Добавьте в начало файла импорт useState из пакета "react".',
$st$// добавьте импорт сверху

function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}$st$,
'{"requiredText":["import","{ useState }","from","react"]}'::jsonb,
'["useState — именованный экспорт из react", "Используйте фигурные скобки", "Строка вида: import { useState } from \"react\";"]'::jsonb,
100, 1);
  END IF;

  -- M1 / lesson 4: Условный рендер ---------------------------------------------
  SELECT id INTO l_id FROM public.lessons WHERE module_id = m1 AND slug = 'conditional-render';
  IF NOT FOUND THEN
    INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
    VALUES (m1, 'Условный рендер', 'conditional-render',
$th$Часто нужно показать разную разметку в зависимости от условия: «если пользователь залогинен — приветствие, иначе кнопка входа». В JSX это делается тремя способами:

1. if / else ДО return — когда ветки сильно отличаются.
2. Тернарный оператор прямо в JSX: {isLoggedIn ? <UserPanel/> : <LoginButton/>}.
3. Короткое условие через &&: {error && <p className="error">{error}</p>} — покажет <p> только если error truthy. Осторожно: если слева число 0, React отрисует «0»! Поэтому пиши {count > 0 && ...}.

Ранний return (guard clause): если в начале функции проверить условие и сразу вернуть разметку (или null), остальной код выполняется только для «основного» случая. Это убирает вложенность.

Запомни: в JSX нельзя писать if-else напрямую внутри фигурных скобок — только выражения. Поэтому if — до return, а внутри — тернарник или &&.$th$,
$ex$function Greeting({ user, error, isLoading }) {
  if (isLoading) return <p>Загрузка...</p>;          // ранний return
  if (error)    return <p className="error">{error}</p>;

  return (
    <div>
      {user ? (
        <h1>С возвращением, {user.name}!</h1>
      ) : (
        <button>Войти</button>
      )}
      {user?.isAdmin && <button>Панель администратора</button>}
    </div>
  );
}$ex$,
    4, 50, true) RETURNING id INTO l_id;

    INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
    VALUES (l_id, 'Покажи ошибку через &&',
'Отрендерите <p>Ошибка</p> только если переменная hasError истинна. Используйте &&.',
$st$function Box({ hasError }) {
  return (
    <div>
      {/* ваш код здесь */}
    </div>
  );
}$st$,
'{"requiredText":["hasError","&&","<p>","Ошибка","</p>"]}'::jsonb,
'["Условие слева от &&", "JSX — справа от &&", "Проверка: {hasError && <p>Ошибка</p>}"]'::jsonb,
100, 1);
  END IF;

  -- M2 / lesson 3: Объект и массив в state -------------------------------------
  SELECT id INTO l_id FROM public.lessons WHERE module_id = m2 AND slug = 'state-objects';
  IF NOT FOUND THEN
    INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
    VALUES (m2, 'Объект и массив в state', 'state-objects',
$th$Когда в state лежит объект или массив, менять его «на месте» (мутировать) БЕСПОЛЕЗНО: React сравнивает ссылки, и если ссылка та же — ре-рендера не происходит. Правило: всегда создавай новую структуру.

• Объект — через spread: setUser(u => ({ ...u, name: "Новое" })). Копируются все поля, а указанные перезаписываются. Для вложенных объектов spread нужен на каждом уровне: { ...u, address: { ...u.address, city: "Сочи" } }.
• Массив — тоже новый: добавление setItems(arr => [...arr, newItem]); удаление по id setItems(arr => arr.filter(i => i.id !== id)); изменение setItems(arr => arr.map(i => i.id===id ? {...i, done:true} : i)).
• Никогда не делай push/pop/splice напрямую с state-массивом — сначала создай копию.

Этот принцип называется иммутабельностью. Он не только заставляет React перерисоваться, но и делает код предсказуемым: старое значение остаётся неизменным (удобно для отмены действий, истории, отладки).$th$,
$ex$import { useState } from "react";

function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Учить React", done: false },
  ]);

  const addTodo = text =>
    setTodos(ts => [...ts, { id: Date.now(), text, done: false }]);

  const toggle = id =>
    setTodos(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const remove = id => setTodos(ts => ts.filter(t => t.id !== id));

  return (
    <ul>
      {todos.map(t => (
        <li key={t.id} style={{ opacity: t.done ? 0.5 : 1 }}
            onClick={() => toggle(t.id)}>
          {t.text} <button onClick={() => remove(t.id)}>×</button>
        </li>
      ))}
    </ul>
  );
}$ex$,
    3, 50, true) RETURNING id INTO l_id;

    INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
    VALUES (l_id, 'Добавь элемент в массив-state',
'Допишите addItem: добавьте новый элемент в конец массива items. Не мутируйте старый массив.',
$st$import { useState } from "react";
function List() {
  const [items, setItems] = useState(["a", "b"]);
  const addItem = (newItem) => {
    // setItems( ... )
  };
  return null;
}$st$,
'{"requiredText":["setItems","[...items","newItem","]"]}'::jsonb,
'["Создайте новый массив через spread", "...items копирует старые элементы", "Новый элемент в конце: [...items, newItem]"]'::jsonb,
100, 1);
  END IF;

  -- M2 / lesson 4: useRef ------------------------------------------------------
  SELECT id INTO l_id FROM public.lessons WHERE module_id = m2 AND slug = 'use-ref';
  IF NOT FOUND THEN
    INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
    VALUES (m2, 'useRef — доступ к DOM и изменяемые значения', 'use-ref',
$th$useRef возвращает объект вида { current: initialValue } с двумя суперспособностями:

1. Доступ к реальному DOM-элементу. Передай ref={inputRef} в JSX-тег, и после монтирования в inputRef.current будет лежать настоящий HTML-элемент. Так делают фокус (inputRef.current.focus()), прокрутку, измерение размеров, интеграцию с не-React библиотеками.
2. Изменяемое «состояние без ре-рендера». Изменение ref.current НЕ вызывает перерисовку. Это удобно для хранения таймеров, предыдущих значений, флагов — всего, что нужно помнить между рендерами, но показывать на экране не надо.

Отличие от useState: state — для данных, которые видны на экране (изменение → ре-рендер). ref — для «служебных» значений и DOM (изменение → тишина). Правило: если ты рисуешь значение на экране — это state, а не ref.

Важно: не меняй ref.current во время рендера (в теле компонента) — делай это в обработчиках или useEffect.$th$,
$ex$import { useRef, useState } from "react";

function FocusForm() {
  const inputRef = useRef(null);
  const countRef = useRef(0); // сколько раз нажали — без ре-рендера
  const [, force] = useState(0);

  const focusInput = () => inputRef.current?.focus();

  const click = () => {
    countRef.current += 1;
    force(x => x + 1); // только чтобы показать число на экране
  };

  return (
    <div>
      <input ref={inputRef} placeholder="Нажми кнопку — я сфокусируюсь" />
      <button onClick={focusInput}>Фокус</button>
      <button onClick={click}>Нажатий: {countRef.current}</button>
    </div>
  );
}$ex$,
    4, 50, true) RETURNING id INTO l_id;

    INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
    VALUES (l_id, 'Создай ref и повесь на input',
'Создайте inputRef через useRef(null) и добавьте ref={inputRef} к <input>. В обработчике focus вызовите inputRef.current.focus().',
$st$import { useRef } from "react";
function Focuser() {
  // const inputRef = ...
  const focus = () => {
    // inputRef.current.focus();
  };
  return (
    <div>
      <input /* ref=... */ />
      <button onClick={focus}>Фокус</button>
    </div>
  );
}$st$,
'{"requiredText":["useRef(null)","ref={inputRef}","inputRef.current","focus()"]}'::jsonb,
'["useRef(null) создаёт объект-ссылку", "ref={inputRef} привязывает к DOM-элементу", "После монтирования в .current лежит элемент"]'::jsonb,
100, 1);
  END IF;

  -- M3 / lesson 3: select, checkbox, textarea ----------------------------------
  SELECT id INTO l_id FROM public.lessons WHERE module_id = m3 AND slug = 'form-elements';
  IF NOT FOUND THEN
    INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
    VALUES (m3, 'Формы: select, checkbox, textarea', 'form-elements',
$th$Контролируемый подход работает для всех полей формы, но у каждого своя особенность:

• <select value={city} onChange={...}> — value вешается на сам <select>, а не на <option>. Значение — строка (или массив строк при multiple).
• <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}> — вместо value используй checked, а новое значение бери из e.target.checked (булево, не строка!).
• <textarea value={text} onChange={...}> — в React работает как input: значение в атрибуте value, а не внутри тега.
• <input type="radio"> — группируются по одинаковому name, checked={value === "option"}.

Шаблон для нескольких полей один: state-объект + обновление по [e.target.name]. Для чекбокса в обновлении проверяй тип поля: const v = e.target.type === "checkbox" ? e.target.checked : e.target.value.

Несколько кнопок submit в одной форме различай через formAction или по name/value кнопки в onSubmit.$th$,
$ex$import { useState } from "react";

function Survey() {
  const [form, setForm] = useState({ city: "msk", agree: false, about: "" });
  const upd = e => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: v }));
  };

  return (
    <form>
      <select name="city" value={form.city} onChange={upd}>
        <option value="msk">Москва</option>
        <option value="spb">Санкт-Петербург</option>
      </select>

      <label>
        <input type="checkbox" name="agree" checked={form.agree} onChange={upd} />
        Согласен с условиями
      </label>

      <textarea name="about" value={form.about} onChange={upd} placeholder="О себе" />
    </form>
  );
}$ex$,
    3, 50, true) RETURNING id INTO l_id;

    INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
    VALUES (l_id, 'Контролируемый checkbox',
'Сделайте checkbox контролируемым: привяжите checked к состоянию agreed, а в onChange используйте e.target.checked.',
$st$import { useState } from "react";
function Agree() {
  const [agreed, setAgreed] = useState(false);
  return (
    <label>
      <input
        type="checkbox"
        // checked={...}
        // onChange={...}
      />
      Согласен
    </label>
  );
}$st$,
'{"requiredText":["checked={agreed}","onChange","e.target.checked","setAgreed"]}'::jsonb,
'["У checkbox контролируется атрибут checked", "Новое значение — e.target.checked (булево)", "setAgreed(e.target.checked)"]'::jsonb,
100, 1);
  END IF;

  -- M3 / lesson 4: Подъём состояния --------------------------------------------
  SELECT id INTO l_id FROM public.lessons WHERE module_id = m3 AND slug = 'lifting-state-up';
  IF NOT FOUND THEN
    INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
    VALUES (m3, 'Подъём состояния (lifting state up)', 'lifting-state-up',
$th$Что делать, если двум компонентам-«братьям» нужно одно и то же изменяемое значение? Например, поле ввода в одном компоненте меняет текст, который отображается в другом. В React данные текут только сверху вниз (от родителя к детям), поэтому общее состояние поднимают в ближайшего общего предка — это и есть lifting state up.

Схема:
1. Родитель объявляет useState и хранит значение.
2. Детям-читателям значение передаётся как prop.
3. Детям-писателям передаётся колбэк-проп (функция), которую они вызывают при изменении — а она уже меняет state родителя.

Так всё состояние сосредоточено в одном месте (single source of truth), и любая часть интерфейса всегда показывает актуальные данные. Если состояние нужно ещё выше — поднимай дальше. А если оно нужно во многих местах приложения — присмотрись к Context (useContext) или стейт-менеджерам.

Правило: не дублируй состояние. Если значение можно вычислить из props — вычисляй, не заводи для него отдельный state.$th$,
$ex$import { useState } from "react";

// Ребёнок-писатель: получает значение и колбэк
function SearchInput({ query, onQueryChange }) {
  return (
    <input
      value={query}
      onChange={e => onQueryChange(e.target.value)}
      placeholder="Поиск..."
    />
  );
}

// Ребёнок-читатель
function ResultCount({ query, items }) {
  const found = items.filter(i => i.includes(query)).length;
  return <p>Найдено: {found}</p>;
}

// Родитель — хранит общее состояние
function SearchPage() {
  const [query, setQuery] = useState("");
  const items = ["react", "javascript", "css", "html"];
  return (
    <div>
      <SearchInput query={query} onQueryChange={setQuery} />
      <ResultCount query={query} items={items} />
    </div>
  );
}$ex$,
    4, 50, true) RETURNING id INTO l_id;

    INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
    VALUES (l_id, 'Передай колбэк вниз',
'Родитель Counter хранит count и setCount. Дочернему Button нужно передать колбэк onIncrement, который увеличивает счётчик. Допишите вызов <Button onIncrement={...} />.',
$st$import { useState } from "react";
function Button({ onIncrement }) {
  return <button onClick={onIncrement}>+1</button>;
}
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <span>{count}</span>
      {/* <Button onIncrement={...} /> */}
    </div>
  );
}$st$,
'{"requiredText":["<Button","onIncrement=","setCount","c => c + 1"]}'::jsonb,
'["Колбэк — это функция, меняющая state родителя", "Используйте функциональную форму setCount(c => c + 1)", "Передаётся как проп: onIncrement={() => setCount(c => c + 1)}"]'::jsonb,
100, 1);
  END IF;

  -- ===========================================================================
  -- PART 3. New module 4 — «Хуки и данные».
  -- ===========================================================================
  SELECT id INTO m4 FROM public.modules WHERE course_id = c_id AND slug = 'hooks-data';
  IF NOT FOUND THEN
    INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
    VALUES (c_id, 'Хуки и данные', 'hooks-data', 4, true) RETURNING id INTO m4;
  END IF;

  -- M4 / lesson 1: fetch в useEffect -------------------------------------------
  SELECT id INTO l_id FROM public.lessons WHERE module_id = m4 AND slug = 'fetch-use-effect';
  IF NOT FOUND THEN
    INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
    VALUES (m4, 'Загрузка данных: fetch + useEffect', 'fetch-use-effect',
$th$Почти каждое приложение тянет данные с сервера. В React это делается связкой useEffect + fetch: эффект с пустым массивом зависимостей запускает запрос один раз при монтировании, а результат кладётся в state.

Обязательно три состояния запроса:
• data — сами данные (изначально null/[]).
• loading — boolean, показываем спиннер пока true.
• error — строка с ошибкой, если запрос упал (сеть упала, 404, 500).

Важные детали:
• fetch асинхронный — используй async/await внутри эффекта (но сам колбэк useEffect не делай async, заведи внутри отдельную async-функцию).
• Если компонент успел размонтироваться до ответа — не вызывай setState на мёртвом компоненте. Защита: флаг let ignore = false; в эффекте, в cleanup ставь ignore = true, и перед setState проверяй if (ignore) return. Для реальных проектов — AbortController.
• Не забывай .json() и проверку response.ok — fetch не падает на 404/500, он резолвится с response.ok === false.$th$,
$ex$import { useState, useEffect } from "react";

function UserProfile({ userId }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch(`https://api.example.com/users/${userId}`)
      .then(r => { if (!r.ok) throw new Error("Ошибка сети"); return r.json(); })
      .then(data => { if (!ignore) setUser(data); })
      .catch(err => { if (!ignore) setError(err.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [userId]); // перезапрос при смене userId

  if (loading) return <p>Загрузка...</p>;
  if (error)   return <p className="error">{error}</p>;
  return <h1>{user.name}</h1>;
}$ex$,
    1, 60, true) RETURNING id INTO l_id;

    INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
    VALUES (l_id, 'Эффект с пустым массивом зависимостей',
'Добавьте useEffect, который один раз при монтировании вызывает fetch("https://api.example.com/posts"). Массив зависимостей — пустой.',
$st$import { useEffect } from "react";
function Posts() {
  useEffect(() => {
    // fetch(...)
  }, /* массив зависимостей */);
  return null;
}$st$,
'{"requiredText":["useEffect","fetch(","https://api.example.com/posts","[]"]}'::jsonb,
'["Запрос делается внутри useEffect", "Пустой массив [] = один раз при монтировании", "fetch(url) возвращает Promise"]'::jsonb,
100, 1);
  END IF;

  -- M4 / lesson 2: useMemo и useCallback ---------------------------------------
  SELECT id INTO l_id FROM public.lessons WHERE module_id = m4 AND slug = 'memo-callback';
  IF NOT FOUND THEN
    INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
    VALUES (m4, 'useMemo и useCallback — мемоизация', 'memo-callback',
$th$Это хуки для оптимизации, и их главное правило — не применяй преждевременно. Сначала измерь (React DevTools → Profiler), потом оптимизируй.

• useMemo(() => вычисление, [deps]) — кэширует РЕЗУЛЬТАТ тяжёлого вычисления. Пока deps не менялись, возвращается старое значение без пересчёта. Пример: фильтрация/сортировка большого списка на каждом рендере.
• useCallback(fn, [deps]) — кэширует саму ФУНКЦИЮ (ссылку). Полезно, когда функция передаётся в дочерний компонент, обёрнутый в React.memo: стабильная ссылка = лишний ре-рендер не происходит.

Оба хука получают массив зависимостей — логика та же, что у useEffect. Типичные ошибки: забыть зависимость (устаревшее значение), обернуть всё подряд (мемоизация сама стоит памяти и времени), использовать useMemo для функций (для функций — useCallback).

Когда НЕ надо: простые вычисления, маленькие списки, обработчики кнопок в обычных компонентах. Преждевременная оптимизация сложнее в отладке.$th$,
$ex$import { useState, useMemo, useCallback } from "react";

function Search({ items }) {
  const [query, setQuery] = useState("");

  // Тяжёлая фильтрация — пересчитывается только когда меняются items или query
  const filtered = useMemo(
    () => items.filter(i => i.title.includes(query)),
    [items, query]
  );

  // Стабильная ссылка на обработчик — передаётся в memo-компонент
  const handleSelect = useCallback(id => {
    console.log("выбран", id);
  }, []); // нет зависимостей — функция создаётся один раз

  return (
    <ul>
      {filtered.map(i => (
        <li key={i.id} onClick={() => handleSelect(i.id)}>{i.title}</li>
      ))}
    </ul>
  );
}$ex$,
    2, 60, true) RETURNING id INTO l_id;

    INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
    VALUES (l_id, 'Оберни вычисление в useMemo',
'Оберните вычисление expensive(a, b) в useMemo с зависимостями [a, b].',
$st$import { useMemo } from "react";
function Calc({ a, b }) {
  // const result = expensive(a, b);  // было — каждый рендер
  const result = null; // используйте useMemo
  return <div>{result}</div>;
}$st$,
'{"requiredText":["useMemo","expensive(a, b)","[a, b]"]}'::jsonb,
'["useMemo(() => ..., [deps])", "Первый аргумент — функция, возвращающая значение", "Зависимости — [a, b]"]'::jsonb,
100, 1);
  END IF;

  -- M4 / lesson 3: Кастомные хуки ----------------------------------------------
  SELECT id INTO l_id FROM public.lessons WHERE module_id = m4 AND slug = 'custom-hooks';
  IF NOT FOUND THEN
    INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
    VALUES (m4, 'Кастомные хуки — переиспользуем логику', 'custom-hooks',
$th$Если логика с хуками (useState/useEffect/...) повторяется в нескольких компонентах — выдели её в кастомный хук. Это обычная функция, имя которой начинается с use (требование линтера и соглашение). Внутри она вызывает другие хуки и возвращает то, что нужно компоненту — данные, функции, ref.

Зачем:
• Убирает дублирование (один и тот же fetch-логика в трёх местах → один useFetch).
• Делает компонент чище: компонент говорит ЧТО показать, а хук — КАК получить данные.
• Упрощает тестирование.

Примеры распространённых кастомных хуков: useFetch, useLocalStorage, useDebounce, useMediaQuery, usePrevious.

Правила те же: вызывай хуки только на верхнем уровне, не в условиях. Имя обязательно с use — иначе линтер не проверит правила хуков.$th$,
$ex$import { useState, useEffect } from "react";

// Кастомный хук: загрузка данных + состояния loading/error
function useFetch(url) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(d => !ignore && setData(d))
      .catch(e => !ignore && setError(e.message))
      .finally(() => !ignore && setLoading(false));
    return () => { ignore = true; };
  }, [url]);

  return { data, loading, error };
}

// Компонент стал в разы короче
function Posts() {
  const { data, loading, error } = useFetch("https://api.example.com/posts");
  if (loading) return <p>Загрузка...</p>;
  if (error)   return <p>Ошибка: {error}</p>;
  return <ul>{data.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}$ex$,
    3, 60, true) RETURNING id INTO l_id;

    INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
    VALUES (l_id, 'Назови хук правильно',
'Объявите функцию-хук useCounter, которая возвращает [count, increment]. Имя должно начинаться с use.',
$st$import { useState } from "react";
// function ...() {
//   const [count, setCount] = useState(0);
//   const increment = () => setCount(c => c + 1);
//   return [count, increment];
// }$st$,
'{"requiredText":["function useCounter","useState","return [count, increment]"]}'::jsonb,
'["Имя хука обязательно начинается с use", "Внутри можно вызывать другие хуки", "Возвращайте то, что нужно компоненту"]'::jsonb,
100, 1);
  END IF;

  -- ===========================================================================
  -- PART 4. New module 5 — «Роутинг и стилизация».
  -- ===========================================================================
  SELECT id INTO m5 FROM public.modules WHERE course_id = c_id AND slug = 'routing-styling';
  IF NOT FOUND THEN
    INSERT INTO public.modules (course_id, title, slug, order_index, is_published)
    VALUES (c_id, 'Роутинг и стилизация', 'routing-styling', 5, true) RETURNING id INTO m5;
  END IF;

  -- M5 / lesson 1: React Router ------------------------------------------------
  SELECT id INTO l_id FROM public.lessons WHERE module_id = m5 AND slug = 'react-router';
  IF NOT FOUND THEN
    INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
    VALUES (m5, 'React Router — навигация в приложении', 'react-router',
$th$Чтобы в приложении было несколько «страниц» (/dashboard, /profile, /login) без перезагрузки, используют React Router (пакет react-router-dom). Основные элементы:

• <BrowserRouter> — оборачивает всё приложение, слушает адресную строку.
• <Routes> + <Route path="/profile" element={<Profile/>} /> — сопоставляет URL с компонентом. path="*" — для 404. Параметры: path="/users/:id".
• <Link to="/profile"> — как <a>, но без перезагрузки страницы. Активную ссылку подсвечивают через <NavLink>.
• useParams() — достаёт :id из URL. useNavigate() — программный переход (после логина, после отправки формы).
• Вложенные маршруты + <Outlet /> — общий layout (шапка/сайдбар) вокруг разных страниц.

Установка: npm install react-router-dom. Важно: не используй обычные <a href> для внутренних переходов — они перезагружают приложение и теряют состояние.$th$,
$ex$import { BrowserRouter, Routes, Route, Link, NavLink, useParams, useNavigate } from "react-router-dom";

function Home()    { return <h1>Главная</h1>; }
function UserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div>
      <h1>Пользователь {id}</h1>
      <button onClick={() => navigate("/")}>На главную</button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <NavLink to="/" end>Главная</NavLink>
        <Link to="/users/42">Пользователь 42</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users/:id" element={<UserPage />} />
        <Route path="*" element={<h1>404 — страница не найдена</h1>} />
      </Routes>
    </BrowserRouter>
  );
}$ex$,
    1, 60, true) RETURNING id INTO l_id;

    INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
    VALUES (l_id, 'Маршрут с параметром',
'Добавьте Route с путём /posts/:postId, который рендерит <PostPage />. Импортируйте всё из react-router-dom.',
$st$// import { ... } from "react-router-dom";
function PostPage() { return null; }
// <Routes>
//   <Route path="/" element={<Home />} />
//   {/* ваш Route здесь */}
// </Routes>$st$,
'{"requiredText":["Route","path=\"/posts/:postId\"","element={<PostPage />}","react-router-dom"]}'::jsonb,
'["Параметр в пути пишется через двоеточие: :postId", "element принимает JSX компонента", "Импорт из react-router-dom"]'::jsonb,
100, 1);
  END IF;

  -- M5 / lesson 2: Стилизация в React ------------------------------------------
  SELECT id INTO l_id FROM public.lessons WHERE module_id = m5 AND slug = 'styling-react';
  IF NOT FOUND THEN
    INSERT INTO public.lessons (module_id, title, slug, theory, example_code, order_index, xp_reward, is_published)
    VALUES (m5, 'Стилизация в React: подходы', 'styling-react',
$th$В React нет «единственно верного» способа писать стили — выбирай под задачу. Основные подходы:

1. Обычный CSS-файл, импортируемый в компонент: import "./Button.css". Классы задаются через className. Просто, но классы глобальные — возможны конфликты имён.
2. CSS-модули (Button.module.css) — классы автоматически становятся уникальными (хэш в имени), конфликтов нет. Импорт: import styles from "./Button.module.css"; использование className={styles.btn}. Отличный выбор по умолчанию.
3. Inline-стили: style={{ color: "red", fontSize: 16 }} — объект, имена свойств в camelCase, числа = px. Удобно для динамических значений, но плохо для большого объёма (нет :hover, медиазапросов).
4. CSS-in-JS (styled-components, emotion) — стили как компоненты. Удобно для темизации, но добавляет зависимость и вес.
5. Утилитарные фреймворки (Tailwind CSS) — готовые классы-атомары. Быстрая разработка, но HTML «захламляется» классами.

Условные классы удобно собирать через шаблонные строки: className={`btn ${active ? "btn--active" : ""}`}. Для сложных случаев есть библиотека clsx (classnames).$th$,
$ex$// ===== Button.module.css =====
// .btn { padding: 8px 16px; border-radius: 8px; }
// .primary { background: #6366f1; color: white; }

import styles from "./Button.module.css";

function Button({ primary, children, style }) {
  const cls = `${styles.btn} ${primary ? styles.primary : ""}`;
  return (
    <button className={cls} style={style}>
      {children}
    </button>
  );
}

// Использование:
<Button primary style={{ marginTop: 12 }}>Отправить</Button>$ex$,
    2, 60, true) RETURNING id INTO l_id;

    INSERT INTO public.tasks (lesson_id, title, description, starter_code, validation_rules, hints, xp_reward, order_index)
    VALUES (l_id, 'Условный className',
'Допишите className кнопки: базовый класс "btn", и если isActive истинна — добавьте "btn-active". Используйте шаблонную строку.',
$st$function Tab({ isActive, label }) {
  return (
    <button className={/* ваш код */}>
      {label}
    </button>
  );
}$st$,
'{"requiredText":["className=","`","btn","${","isActive","btn-active"]}'::jsonb,
'["Шаблонная строка в обратных кавычках", "Тернарник внутри ${}", "Пример: `btn ${isActive ? \"btn-active\" : \"\"}`"]'::jsonb,
100, 1);
  END IF;

  RAISE NOTICE 'React Basics expanded: 6 lessons reworked + 11 new lessons added.';
END $$;
