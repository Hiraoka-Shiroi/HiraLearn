export type Lesson = {
  id: string;
  title: string;
  explanation: string;
  exampleCode: string;
  task: {
    title: string;
    instructions: string;
    requiredRules: string[];
  };
};

export type ValidationIssue = {
  rule: string;
  message: string;
};

export type ValidationResult = {
  isCorrect: boolean;
  score: number;
  issues: ValidationIssue[];
  summary: string;
};
