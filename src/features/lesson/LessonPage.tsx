import { useMemo, useState } from "react";

import type { Lesson } from "../../types/lesson";
import { validateLessonAnswer } from "./lessonValidation";
import { CodeExample } from "./components/CodeExample";
import { ProgressBar } from "./components/ProgressBar";
import { TaskEditor } from "./components/TaskEditor";
import { ValidationResult } from "./components/ValidationResult";

const lessonMock: Lesson = {
  id: "lesson-html-text-1",
  title: "HTML: Заголовки и абзацы",
  explanation:
    "В этом уроке ты научишься использовать заголовок <h1>, абзац <p> и ссылку <a>. Сначала создай заголовок страницы, затем добавь абзац и ссылку на любой сайт.",
  exampleCode: `<h1>Моя первая страница</h1>\n<p>Я изучаю HTML шаг за шагом.</p>\n<a href="https://example.com">Перейти на сайт</a>`,
  task: {
    title: "Собери простой блок контента",
    instructions:
      "Добавь в ответ: 1) один <h1>, 2) один <p>, 3) одну ссылку <a> с href.",
    requiredRules: ["include-h1", "include-p", "include-a"],
  },
};

export const LessonPage = () => {
  const [answerCode, setAnswerCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof validateLessonAnswer> | null>(
    null,
  );

  const progress = useMemo(() => {
    if (!result) {
      return answerCode.trim().length > 0 ? 35 : 10;
    }

    return result.isCorrect ? 100 : Math.max(60, result.score);
  }, [answerCode, result]);

  const handleCheck = () => {
    setIsChecking(true);

    const validationResult = validateLessonAnswer(
      answerCode,
      lessonMock.task.requiredRules,
    );

    setResult(validationResult);
    setIsChecking(false);
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 text-zinc-100">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{lessonMock.title}</h1>
        <p className="text-zinc-300">{lessonMock.explanation}</p>
      </header>

      <ProgressBar progress={progress} />

      <CodeExample code={lessonMock.exampleCode} />

      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="mb-2 text-lg font-semibold">Задание</h3>
        <p className="text-sm text-zinc-300">{lessonMock.task.instructions}</p>
      </section>

      <TaskEditor
        value={answerCode}
        onChange={setAnswerCode}
        onCheck={handleCheck}
        isChecking={isChecking}
      />

      <ValidationResult result={result} />
    </main>
  );
};
