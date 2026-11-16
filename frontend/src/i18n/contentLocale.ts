/**
 * Локализация контента (курсы / модули / уроки / задания).
 *
 * Подход: английский текст хранится в отдельных колонках `*_en` в БД.
 * Если колонка пуста (NULL / ''), показывается оригинал (русский).
 * Локализация происходит на уровне сервиса данных — компоненты читают
 * обычные поля `.title`, `.theory`, `.description` и ничего не знают
 * про переключение языка.
 *
 * Язык читается из localStorage (туда его сохраняет переключатель RU/EN).
 * Если ключ не найден — по умолчанию русский.
 *
 * ВАЖНО: контент локализуется в момент загрузки данных. Если пользователь
 * переключил язык, находясь на странице — контент обновится после перехода
 * на другую страницу (или перезагрузки). UI-тексты (кнопки, заголовки)
 * переключаются мгновенно как и раньше.
 */

export type ContentLanguage = 'ru' | 'en';

// Возможные ключи localStorage, под которыми приложение хранит язык.
// Добавьте сюда ваш ключ, если переключатель сохраняет под другим именем.
const STORAGE_KEYS = ['hiralearn_language', 'language', 'lang', 'hiralearn-lang'];

export function getContentLanguage(): ContentLanguage {
  try {
    for (const k of STORAGE_KEYS) {
      const v = window.localStorage.getItem(k);
      if (v === 'en' || v === 'ru') return v;
    }
  } catch {
    /* localStorage недоступен */
  }
  return 'ru';
}

/** Выбрать значение: английское (если язык=en и оно не пустое) либо оригинал. */
function pick<T>(base: T, en: T | null | undefined, lang: ContentLanguage): T {
  if (lang === 'en' && en !== null && en !== undefined && (en as unknown as string) !== '') {
    return en;
  }
  return base;
}

type Row = Record<string, unknown>;

function localizeFields(row: Row, fields: readonly string[], lang: ContentLanguage): Row {
  const out: Row = { ...row };
  for (const f of fields) {
    out[f] = pick(row[f], row[`${f}_en`] as never, lang);
  }
  return out;
}

const COURSE_FIELDS = ['title', 'description'] as const;
const MODULE_FIELDS = ['title', 'description'] as const;
const LESSON_FIELDS = ['title', 'theory'] as const;
const TASK_FIELDS = ['title', 'description'] as const;

export function localizeCourse<T extends Row>(c: T): T {
  return localizeFields(c, COURSE_FIELDS, getContentLanguage()) as T;
}

export function localizeModule<T extends Row>(m: T): T {
  return localizeFields(m, MODULE_FIELDS, getContentLanguage()) as T;
}

export function localizeLesson<T extends Row>(l: T): T {
  return localizeFields(l, LESSON_FIELDS, getContentLanguage()) as T;
}

export function localizeTask<T extends Row>(t: T): T {
  const lang = getContentLanguage();
  const out = localizeFields(t, TASK_FIELDS, lang) as T;
  // hints — JSONB-массив; hints_en — тоже JSONB-массив
  const hintsEn = (t as Row).hints_en;
  if (lang === 'en' && Array.isArray(hintsEn) && hintsEn.length > 0) {
    (out as Row).hints = hintsEn;
  }
  return out;
}
