export interface ValidationRules {
  requiredTags?: string[];
  requiredText?: string[];
}

export interface ValidationResult {
  score: number;
  isCorrect: boolean;
  passedChecks: string[];
  failedChecks: string[];
  feedback: string;
}

const normalize = (s: string): string =>
  s.replace(/\s+/g, ' ').trim().toLowerCase();

export const checkHTML = (code: string, rules: ValidationRules): ValidationResult => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(code, 'text/html');
  const passed: string[] = [];
  const failed: string[] = [];

  if (rules.requiredTags) {
    rules.requiredTags.forEach((tag: string) => {
      if (doc.getElementsByTagName(tag).length > 0) {
        passed.push(`Тег <${tag}> найден`);
      } else {
        failed.push(`Отсутствует тег <${tag}>`);
      }
    });
  }

  if (rules.requiredText) {
    const normalizedCode = normalize(doc.body?.textContent ?? '');
    rules.requiredText.forEach((text: string) => {
      const normalizedText = normalize(text);
      if (normalizedCode.includes(normalizedText)) {
        passed.push(`Текст "${text}" присутствует`);
      } else {
        failed.push(`Текст "${text}" не найден`);
      }
    });
  }

  const total = passed.length + failed.length;
  const score = total > 0 ? Math.round((passed.length / total) * 100) : 0;
  const isCorrect = failed.length === 0;

  let feedback = '';
  if (isCorrect) {
    feedback = "Отлично! Ты справился.";
  } else {
    feedback = failed[0] || "Есть ошибки, проверь код еще раз.";
  }

  return {
    isCorrect,
    score,
    passedChecks: passed,
    failedChecks: failed,
    feedback
  };
};
