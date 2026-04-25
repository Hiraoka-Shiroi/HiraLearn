interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
}

export const CodeEditor = ({ code, onChange }: CodeEditorProps) => {
  return (
    <div className="h-full flex flex-col bg-[#010409] overflow-hidden">
      <div className="px-4 py-2 border-b border-border bg-card flex items-center justify-between">
        <span className="text-xs font-mono text-muted">index.html</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 rounded-full bg-red-500/40" />
          <div className="w-2 h-2 rounded-full bg-amber-500/40" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
        </div>
      </div>

      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 w-full bg-transparent p-6 font-mono text-sm resize-none focus:outline-none text-blue-100 leading-relaxed"
        placeholder="Type your code here..."
      />

      <div className="p-4 bg-card border-t border-border flex justify-between items-center">
        <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Editor Mode: HTML</span>
        <button className="text-xs text-accent-primary hover:underline">Reset Code</button>
      </div>
    </div>
  );
};
