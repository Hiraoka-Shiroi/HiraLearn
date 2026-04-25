import { useMemo, useState } from "react";

import type { Lesson } from "../../types/lesson";
import { validateLessonAnswer } from "./lessonValidation";
import { CodeExample } from "./components/CodeExample";
import { ProgressBar } from "./components/ProgressBar";
import { TaskEditor } from "./components/TaskEditor";
import { ValidationResult } from "./components/ValidationResult";

const lessonMock: Lesson = {
  id: "lesson-html-text-1",
  title: "HTML: Заголовки, абзацы и ссылки",
  explanation:
    "В этом уроке ты закрепишь базовую структуру контента: один главный заголовок, один абзац и корректная ссылка.",
  exampleCode: `<h1>Моя первая страница</h1>\n<p>Я изучаю HTML шаг за шагом.</p>\n<a href="https://example.com">Перейти на сайт</a>`,
  task: {
    title: "Собери визитку ученика",
    instructions:
      "Создай HTML-фрагмент с одним <h1>, одним <p> и одной ссылкой <a> с атрибутом href.",
    requiredRules: ["include-h1", "include-p", "include-a"],
  },
};

export const LessonPage = () => {
  const [answerCode, setAnswerCode] = useState(`<h1></h1>\n<p></p>\n<a href=""></a>`);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof validateLessonAnswer> | null>(
    null,
  );

  const progress = useMemo(() => {
    if (!result) {
      return answerCode.trim().length > 0 ? 40 : 10;
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
    <main className="flex w-full flex-col gap-5">
      <header className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-400">Урок 2 из 8 • HTML</p>
        <h2 className="text-2xl font-bold tracking-tight">{lessonMock.title}</h2>
        <p className="mt-2 text-zinc-300">{lessonMock.explanation}</p>
      </header>

      <ProgressBar progress={progress} />

      <CodeExample code={lessonMock.exampleCode} />

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="mb-2 text-lg font-semibold">Задание: {lessonMock.task.title}</h3>
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
