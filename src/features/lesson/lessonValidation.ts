import type { ValidationIssue, ValidationResult } from "../../types/lesson";

const RULE_MESSAGES: Record<string, string> = {
  "include-h1": "Добавь тег <h1> с заголовком страницы.",
  "include-p": "Добавь минимум один абзац с тегом <p>.",
  "include-a": "Добавь ссылку с тегом <a> и атрибутом href.",
};

const checkRule = (code: string, rule: string): boolean => {
  switch (rule) {
    case "include-h1":
      return /<h1[^>]*>.*<\/h1>/is.test(code);
    case "include-p":
      return /<p[^>]*>.*<\/p>/is.test(code);
    case "include-a":
      return /<a[^>]*href=["'][^"']+["'][^>]*>.*<\/a>/is.test(code);
    default:
      return false;
  }
};

export const validateLessonAnswer = (
  code: string,
  requiredRules: string[],
): ValidationResult => {
  const issues: ValidationIssue[] = requiredRules
    .filter((rule) => !checkRule(code, rule))
    .map((rule) => ({
      rule,
      message: RULE_MESSAGES[rule] ?? `Неизвестное правило проверки: "${rule}".`,
    }));

  const passedCount = requiredRules.length - issues.length;
  const score = requiredRules.length === 0 ? 100 : Math.round((passedCount / requiredRules.length) * 100);

  return {
    isCorrect: issues.length === 0,
    score,
    issues,
    summary:
      issues.length === 0
        ? "Отлично! Задание выполнено верно."
        : `Выполнено ${passedCount} из ${requiredRules.length} условий. Исправь ошибки и проверь снова.`,
  };
};
