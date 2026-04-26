import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Github, User, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AuthService } from '@/features/auth/AuthService';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useLanguage } from '@/i18n/useLanguage';
import type { TranslationKey } from '@/i18n/translations';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ModeToggle } from '@/components/ModeToggle';

const authSchema = z.object({
  email: z.string().email('auth_invalid_email'),
  password: z.string().min(6, 'auth_min_password'),
  fullName: z.string().min(2, 'auth_min_name').optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthFormData) => {
    if (!isSupabaseConfigured) {
      setError(t('auth_err_supabase_not_configured'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await AuthService.signIn(data.email, data.password);
      } else {
        await AuthService.signUp(data.email, data.password, data.fullName || '');
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error("Auth Error:", err);
      const message = err instanceof Error ? err.message : String(err);
      if (message === 'Failed to fetch' || (err instanceof TypeError)) {
        setError(t('auth_err_network'));
      } else if (message.toLowerCase().includes('invalid login credentials')) {
        setError(t('auth_err_invalid_credentials'));
      } else if (message.toLowerCase().includes('user already registered')) {
        setError(t('auth_err_already_registered'));
      } else if (message.toLowerCase().includes('email not confirmed')) {
        setError(t('auth_err_email_not_confirmed'));
      } else {
        setError(message || t('auth_err_generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    if (!isSupabaseConfigured) {
      setError(t('auth_err_github'));
      return;
    }
    try {
      await AuthService.signInWithGithub();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-success/5 rounded-full blur-[120px]" />
      </div>

      <div className="absolute top-6 right-6 flex gap-3 z-20">
        <LanguageToggle />
        <ModeToggle />
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6 group">
            <div className="w-8 h-8 bg-accent-primary rounded-lg rotate-45 flex items-center justify-center group-hover:scale-110 transition-transform">
              <div className="w-4 h-4 bg-background rounded-sm -rotate-45" />
            </div>
            <span className="text-xl font-bold tracking-tight">HiraLearn</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">
            {isLogin ? t('auth_welcome') : t('auth_begin')}
          </h1>
          <p className="text-muted text-sm">
            {isLogin ? t('auth_subtitle_login') : t('auth_subtitle_register')}
          </p>
        </div>

        {!isSupabaseConfigured && (
           <div className="mb-6 p-4 bg-accent-danger/10 border border-accent-danger/20 rounded-xl text-accent-danger text-xs flex gap-3 items-center">
              <AlertCircle className="shrink-0" size={20} />
              <p><b>{t('auth_supabase_not_configured')}</b> {t('auth_supabase_warning')}</p>
           </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex gap-3 items-center">
            <AlertCircle className="shrink-0" size={20} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted ml-2 uppercase tracking-widest">{t('auth_fullname')}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  {...register('fullName')}
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-accent-primary transition-colors"
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-[10px] ml-2">{t(errors.fullName.message as TranslationKey)}</p>}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted ml-2 uppercase tracking-widest">{t('auth_email')}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                {...register('email')}
                type="email"
                placeholder="user@example.com"
                className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-accent-primary transition-colors"
              />
            </div>
            {errors.email && <p className="text-red-500 text-[10px] ml-2">{t(errors.email.message as TranslationKey)}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted ml-2 uppercase tracking-widest">{t('auth_password')}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-accent-primary transition-colors"
              />
            </div>
            {errors.password && <p className="text-red-500 text-[10px] ml-2">{t(errors.password.message as TranslationKey)}</p>}
          </div>

          <button
            disabled={loading || !isSupabaseConfigured}
            className="w-full bg-foreground text-background py-4 rounded-2xl font-bold flex items-center justify-center group hover:bg-accent-primary hover:text-white transition-all disabled:opacity-50"
          >
            {loading ? t('auth_processing') : isLogin ? t('auth_signin') : t('auth_signup')}
            {!loading && <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted">{t('auth_or_continue')}</span>
          </div>
        </div>

        <button
          onClick={handleGithubLogin}
          disabled={!isSupabaseConfigured}
          className="w-full bg-background border border-border py-3 rounded-2xl flex items-center justify-center space-x-2 hover:bg-border transition-colors mb-8 disabled:opacity-50"
        >
          <Github size={18} />
          <span className="text-sm font-medium">GitHub</span>
        </button>

        <p className="text-center text-sm text-muted">
          {isLogin ? t('auth_no_account') : t('auth_has_account')}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-accent-primary font-bold hover:underline"
          >
            {isLogin ? t('auth_register') : t('auth_login')}
          </button>
        </p>
      </motion.div>
    </div>
  );
};
