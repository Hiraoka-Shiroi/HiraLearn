
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import { Check, Target, Clock, BookOpen, Rocket } from 'lucide-react';
import { useLanguage } from '@/i18n/useLanguage';
import { TranslationKey } from '@/i18n/translations';

type OnboardingStep = 'level' | 'goal' | 'time' | 'style';

export const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState<OnboardingStep>('level');
  const [data, setData] = useState({
    level: '',
    goal: '',
    daily_minutes: 30,
    explanation_style: 'normal'
  });
  const { user, profile, setProfile } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (profile?.current_goal) {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, navigate]);

  const handleComplete = async (finalData?: typeof data) => {
    if (!user) return;
    const d = finalData ?? data;

    const { data: updatedProfile, error } = await supabase.rpc('update_own_profile', {
      p_full_name: null,
      p_username: null,
      p_avatar_url: null,
      p_current_goal: d.goal,
      p_daily_minutes: d.daily_minutes,
      p_explanation_style: d.explanation_style,
    });

    if (error) {
      console.error("Error updating profile:", error);
    } else if (updatedProfile) {
      const profile = Array.isArray(updatedProfile) ? updatedProfile[0] : updatedProfile;
      if (profile) setProfile(profile);
    }
    try { localStorage.setItem('hiralearn_onboarding_done', '1'); } catch (_e) { /* noop */ }
    navigate('/dashboard');
  };

  interface StepOption {
    id: string | number;
    labelKey: TranslationKey;
    descKey: TranslationKey;
    icon: React.ReactElement;
  }

  interface StepConfig {
    titleKey: TranslationKey;
    options: StepOption[];
    next: OnboardingStep | 'complete';
  }

  const steps: Record<OnboardingStep, StepConfig> = {
    level: {
      titleKey: 'onboarding_level',
      options: [
        { id: 'zero', labelKey: 'onb_level_zero', descKey: 'onb_level_zero_desc', icon: <BookOpen /> },
        { id: 'beginner', labelKey: 'onb_level_some', descKey: 'onb_level_some_desc', icon: <Target /> },
        { id: 'intermediate', labelKey: 'onb_level_inter', descKey: 'onb_level_inter_desc', icon: <Rocket /> },
      ],
      next: 'goal'
    },
    goal: {
      titleKey: 'onboarding_goal',
      options: [
        { id: 'frontend', labelKey: 'onb_goal_frontend', descKey: 'onb_goal_frontend_desc', icon: <Target /> },
        { id: 'js', labelKey: 'onb_goal_js', descKey: 'onb_goal_js_desc', icon: <Rocket /> },
        { id: 'portfolio', labelKey: 'onb_goal_portfolio', descKey: 'onb_goal_portfolio_desc', icon: <Check /> },
      ],
      next: 'time'
    },
    time: {
      titleKey: 'onboarding_time',
      options: [
        { id: 15, labelKey: 'onb_time_15', descKey: 'onb_time_15_desc', icon: <Clock /> },
        { id: 30, labelKey: 'onb_time_30', descKey: 'onb_time_30_desc', icon: <Clock /> },
        { id: 60, labelKey: 'onb_time_60', descKey: 'onb_time_60_desc', icon: <Clock /> },
      ],
      next: 'style'
    },
    style: {
      titleKey: 'onboarding_style',
      options: [
        { id: 'simple', labelKey: 'onb_style_simple', descKey: 'onb_style_simple_desc', icon: <BookOpen /> },
        { id: 'normal', labelKey: 'onb_style_normal', descKey: 'onb_style_normal_desc', icon: <Check /> },
        { id: 'technical', labelKey: 'onb_style_technical', descKey: 'onb_style_technical_desc', icon: <Target /> },
      ],
      next: 'complete'
    }
  };

  const currentStepData = steps[step];

  const handleSelect = (id: string | number) => {
    const key = step === 'time' ? 'daily_minutes' : step === 'style' ? 'explanation_style' : step;
    const updatedData = { ...data, [key]: id };
    setData(updatedData);
    if (currentStepData.next === 'complete') {
      handleComplete(updatedData);
    } else {
      setStep(currentStepData.next);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-success/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-2xl">
        <div className="flex justify-center gap-2 mb-12">
          {Object.keys(steps).map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                step === s ? 'w-12 bg-accent-primary' : 'w-6 bg-border'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-10 text-foreground">{t(currentStepData.titleKey)}</h1>

            <div className="grid grid-cols-1 gap-4">
              {currentStepData.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className="group relative p-4 md:p-6 bg-card border border-border active:border-accent-primary md:hover:border-accent-primary rounded-2xl md:rounded-3xl text-left transition-all md:hover:shadow-2xl md:hover:shadow-accent-primary/5 overflow-hidden min-h-[72px]"
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-accent-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-accent-primary group-active:bg-accent-primary group-active:text-white md:group-hover:bg-accent-primary md:group-hover:text-white transition-all shrink-0">
                      {React.cloneElement(option.icon, { size: 24 })}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg md:text-xl font-bold mb-0.5 md:mb-1">{t(option.labelKey)}</h3>
                      <p className="text-muted text-sm md:text-base">{t(option.descKey)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
