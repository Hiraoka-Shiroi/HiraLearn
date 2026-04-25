interface LivePreviewProps {
  code: string;
}

export const LivePreview = ({ code }: LivePreviewProps) => {
  const srcDoc = `
    <html>
      <head>
        <style>
          body {
            font-family: sans-serif;
            color: #f8fafc;
            background: transparent;
            padding: 20px;
          }
          ul, ol { margin-left: 20px; }
          li { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        ${code}
      </body>
    </html>
  `;

  return (
    <div className="h-full flex flex-col bg-slate-900 overflow-hidden">
      <div className="px-4 py-2 border-b border-border bg-card flex items-center">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">Live Preview</span>
      </div>

      <div className="flex-1 bg-white/5 m-4 rounded-xl border border-white/10 overflow-hidden">
        <iframe
          srcDoc={srcDoc}
          title="output"
          sandbox="allow-scripts"
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );
};
