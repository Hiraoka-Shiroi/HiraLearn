type ProgressBarProps = {
  progress: number;
};

export const ProgressBar = ({ progress }: ProgressBarProps) => {
  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
        <span>Прогресс урока</span>
        <span>{safeProgress}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-800">
        <div
          className="h-2 rounded-full bg-cyan-400 transition-all duration-300"
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
};
