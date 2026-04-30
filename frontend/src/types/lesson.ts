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

