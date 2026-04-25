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

export interface LessonContent {
  id: string;
  title: string;
  module: string;
  theory: string;
  task: string;
  starterCode: string;
  solutionRegex: RegExp[];
  hint: string;
}

export interface UserProgress {
  completedLessons: string[];
  currentLessonId: string;
  xp: number;
  streak: number;
}
