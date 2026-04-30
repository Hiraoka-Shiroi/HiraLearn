import { ReactNode } from 'react';
import { X } from 'lucide-react';

export const Spinner = ({ size = 16 }: { size?: number }) => (
  <span
    className="inline-block border-2 border-current border-t-transparent rounded-full animate-spin"
    style={{ width: size, height: size }}
  />
);

export const Toast = ({
  kind,
  message,
  onClose,
}: {
  kind: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
}) => (
  <div
    className={`fixed bottom-6 right-6 z-50 max-w-sm flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg ${
      kind === 'success'
        ? 'bg-accent-success/10 border-accent-success/30 text-accent-success'
        : kind === 'error'
        ? 'bg-accent-danger/10 border-accent-danger/30 text-accent-danger'
        : 'bg-card border-border text-foreground'
    }`}
  >
    <span className="text-sm font-medium flex-1">{message}</span>
    <button onClick={onClose} className="opacity-60 hover:opacity-100">
      <X size={14} />
    </button>
  </div>
);

export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer ? (
          <div className="px-6 py-4 border-t border-border flex justify-end gap-2 bg-background/30">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled,
  children,
  ...rest
}: {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const variants: Record<string, string> = {
    primary: 'bg-accent-primary text-white hover:scale-[1.02]',
    secondary: 'bg-card border border-border hover:border-accent-primary',
    danger: 'bg-accent-danger/10 text-accent-danger border border-accent-danger/30 hover:bg-accent-danger/20',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-white/5',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };
  return (
    <button
      disabled={disabled || loading}
      className={`rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading ? <Spinner size={14} /> : null}
      {children}
    </button>
  );
};

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full px-4 py-2 bg-background border border-border rounded-2xl text-sm focus:border-accent-primary outline-none ${
      props.className ?? ''
    }`}
  />
);

export const Select = ({
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...rest}
    className={`w-full px-4 py-2 bg-background border border-border rounded-2xl text-sm focus:border-accent-primary outline-none ${
      rest.className ?? ''
    }`}
  >
    {children}
  </select>
);

export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`w-full px-4 py-2 bg-background border border-border rounded-2xl text-sm focus:border-accent-primary outline-none ${
      props.className ?? ''
    }`}
  />
);

export const Badge = ({
  tone = 'default',
  children,
}: {
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
  children: ReactNode;
}) => {
  const tones: Record<string, string> = {
    default: 'bg-border text-muted-foreground',
    success: 'bg-accent-success/15 text-accent-success border border-accent-success/30',
    warning: 'bg-accent-warning/15 text-accent-warning border border-accent-warning/30',
    danger: 'bg-accent-danger/15 text-accent-danger border border-accent-danger/30',
    primary: 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${tones[tone]}`}
    >
      {children}
    </span>
  );
};


