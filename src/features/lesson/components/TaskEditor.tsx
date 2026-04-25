import { type ChangeEvent } from "react";

type TaskEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onCheck: () => void;
  isChecking?: boolean;
};

export const TaskEditor = ({
  value,
  onChange,
  onCheck,
  isChecking = false,
}: TaskEditorProps) => {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 text-lg font-semibold text-zinc-100">Твой ответ</h3>
      <textarea
        value={value}
        onChange={handleChange}
        className="min-h-64 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-4 font-mono text-sm text-zinc-100 outline-none ring-cyan-400 transition focus:ring"
        placeholder="Напиши HTML-решение здесь..."
      />
      <button
        type="button"
        onClick={onCheck}
        disabled={isChecking}
        className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isChecking ? "Проверка..." : "Проверить"}
      </button>
    </section>
  );
};
