import { LessonPage } from "./features/lesson/LessonPage";

const App = () => {
  return (
    <div className="min-h-screen text-zinc-100">
      <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">CodeSensei</p>
            <h1 className="text-lg font-semibold">AI-тренажёр по Frontend с нуля</h1>
          </div>
          <div className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
            Demo • HTML Module
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:grid-cols-[1fr_280px]">
        <LessonPage />

        <aside className="h-fit space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-glow">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">AI Sensei</h2>
          <p className="text-sm text-zinc-300">
            Я не дам готовый ответ сразу. Сначала подскажу, где ошибка, и помогу дойти до
            решения шаг за шагом.
          </p>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-200">
            <p className="mb-1 text-zinc-400">Фокус урока</p>
            <p>h1, p, a[href]</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-200">
            <p className="mb-1 text-zinc-400">Серия дней</p>
            <p className="text-xl font-semibold text-cyan-400">7 🔥</p>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default App;
