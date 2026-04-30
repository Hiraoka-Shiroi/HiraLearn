import { Component, ErrorInfo, ReactNode } from 'react';
import { reportError } from '@/lib/monitoring/errorLogger';
import { useLanguage } from '@/i18n/useLanguage';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void reportError(
      Object.assign(error, {
        stack: `${error.stack ?? ''}\n\nReact componentStack:\n${info.componentStack ?? ''}`,
      }),
    );
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return <ErrorFallback onReload={this.handleReload} />;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
const ErrorFallback = ({ onReload }: { onReload: () => void }) => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-[2.5rem] p-10 text-center">
        <h1 className="text-2xl font-bold mb-3">{t('err_title')}</h1>
        <p className="text-muted text-sm mb-8">{t('err_subtitle')}</p>
        <button
          onClick={onReload}
          className="bg-accent-primary text-white px-6 py-3 rounded-2xl font-bold hover:scale-[1.02] transition-all"
        >
          {t('err_reload')}
        </button>
      </div>
    </div>
  );
};
