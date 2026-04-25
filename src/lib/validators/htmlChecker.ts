
export interface ValidationResult {
  score: number;
  isCorrect: boolean;
  passedChecks: string[];
  failedChecks: string[];
  feedback: string;
}

export const checkHTML = (code: string, rules: any): ValidationResult => {
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
    rules.requiredText.forEach((text: string) => {
      if (code.includes(text)) {
        passed.push(`Текст "${text}" присутствует`);
      } else {
        failed.push(`Текст "${text}" не найден`);
      }
    });
  }

  const isCorrect = failed.length === 0;

  let feedback = '';
  if (isCorrect) {
    feedback = "Идеально! Ты справился.";
  } else {
    feedback = failed[0] || "Есть ошибки, проверь код еще раз.";
  }

  return {
    isCorrect,
    score: isCorrect ? 100 : 0,
    passedChecks: passed,
    failedChecks: failed,
    feedback
  };
};
