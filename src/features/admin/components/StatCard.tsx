import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: 'primary' | 'success' | 'warning' | 'danger';
}

const accentClasses: Record<NonNullable<StatCardProps['accent']>, string> = {
  primary: 'text-accent-primary',
  success: 'text-accent-success',
  warning: 'text-accent-warning',
  danger: 'text-accent-danger',
};

export const StatCard = ({
  label,
  value,
  hint,
  icon,
  accent = 'primary',
}: StatCardProps) => (
  <div className="bg-card border border-border rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[170px]">
    <div className="flex items-start justify-between mb-4">
      <span className="text-xs font-bold uppercase tracking-widest text-muted">
        {label}
      </span>
      {icon ? <span className={accentClasses[accent]}>{icon}</span> : null}
    </div>
    <div className="text-4xl font-bold tracking-tight">{value}</div>
    {hint ? <div className="text-xs text-muted mt-3">{hint}</div> : null}
  </div>
);
