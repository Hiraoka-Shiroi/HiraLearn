import type { ValidationResult as ValidationResultType } from "../../../types/lesson";

type ValidationResultProps = {
  result: ValidationResultType | null;
};

export const ValidationResult = ({ result }: ValidationResultProps) => {
  if (!result) {
    return (
      <section className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 p-4 text-sm text-zinc-400">
        Здесь появится результат после нажатия «Проверить».
      </section>
    );
  }

  return (
    <section
      className={`rounded-xl border p-4 ${
        result.isCorrect
          ? "border-emerald-700 bg-emerald-950/40"
          : "border-amber-700 bg-amber-950/30"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-100">Результат проверки</h3>
        <span className="rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-300">
          Score: {result.score}%
        </span>
      </div>
      <p className="mb-3 text-sm text-zinc-200">{result.summary}</p>

      {!result.isCorrect && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-200">
          {result.issues.map((issue) => (
            <li key={issue.rule}>{issue.message}</li>
          ))}
        </ul>
      )}
    </section>
  );
};
