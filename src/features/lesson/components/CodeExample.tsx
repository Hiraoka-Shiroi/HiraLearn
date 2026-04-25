type CodeExampleProps = {
  code: string;
};

export const CodeExample = ({ code }: CodeExampleProps) => {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 text-lg font-semibold text-zinc-100">Пример кода</h3>
      <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
        <code>{code}</code>
      </pre>
    </section>
  );
};
