
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import { Check, ArrowRight, Target, Clock, BookOpen, Rocket } from 'lucide-react';

type OnboardingStep = 'level' | 'goal' | 'time' | 'style';

export const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState<OnboardingStep>('level');
  const [data, setData] = useState({
    level: '',
    goal: '',
    daily_minutes: 30,
    explanation_style: 'normal'
  });
  const { user, setProfile } = useAuthStore();
  const navigate = useNavigate();

  const handleComplete = async () => {
    if (!user) return;

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        current_goal: data.goal,
        daily_minutes: data.daily_minutes,
        explanation_style: data.explanation_style,
        // We could also store level if we had a column for it, or just use it to suggest a course
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
    } else {
      setProfile(updatedProfile);
      navigate('/dashboard');
    }
  };

  interface StepOption {
    id: string | number;
    label: string;
    desc: string;
    icon: React.ReactElement;
  }

  interface StepConfig {
    title: string;
    options: StepOption[];
    next: OnboardingStep | 'complete';
  }

  const steps: Record<OnboardingStep, StepConfig> = {
    level: {
      title: 'Твой уровень в кодинге?',
      options: [
        { id: 'zero', label: 'Полный ноль', desc: 'Никогда не писал код', icon: <BookOpen /> },
        { id: 'beginner', label: 'Немного знаю', desc: 'Слышал про теги и переменные', icon: <Target /> },
        { id: 'intermediate', label: 'Уже верстал', desc: 'Могу собрать простую страницу', icon: <Rocket /> },
      ],
      next: 'goal'
    },
    goal: {
      title: 'Какая твоя главная цель?',
      options: [
        { id: 'frontend', label: 'Стать Frontend-разработчиком', desc: 'Полный путь до трудоустройства', icon: <Target /> },
        { id: 'js', label: 'Выучить JavaScript', desc: 'Для логики и интерактивности', icon: <Rocket /> },
        { id: 'portfolio', label: 'Собрать портфолио', desc: 'Сделать реальные проекты', icon: <Check /> },
      ],
      next: 'time'
    },
    time: {
      title: 'Сколько времени в день?',
      options: [
        { id: 15, label: '15 минут', desc: 'Быстрый старт', icon: <Clock /> },
        { id: 30, label: '30 минут', desc: 'Оптимальный темп', icon: <Clock /> },
        { id: 60, label: '60 минут', desc: 'Интенсивное обучение', icon: <Clock /> },
      ],
      next: 'style'
    },
    style: {
      title: 'Как тебе объяснять?',
      options: [
        { id: 'simple', label: 'Очень просто', desc: 'На котиках и примерах из жизни', icon: <BookOpen /> },
        { id: 'normal', label: 'Обычный стиль', desc: 'Баланс теории и практики', icon: <Check /> },
        { id: 'technical', label: 'Технически', desc: 'Меньше воды, больше терминов', icon: <Target /> },
      ],
      next: 'complete'
    }
  };

  const currentStepData = steps[step];

  const handleSelect = (id: string | number) => {
    setData({ ...data, [step === 'time' ? 'daily_minutes' : step === 'style' ? 'explanation_style' : step]: id });
    if (currentStepData.next === 'complete') {
      handleComplete();
    } else {
      setStep(currentStepData.next);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-hidden">
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
            <h1 className="text-3xl md:text-4xl font-bold mb-10 text-foreground">{currentStepData.title}</h1>

            <div className="grid grid-cols-1 gap-4">
              {currentStepData.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className="group relative p-6 bg-card border border-border hover:border-accent-primary rounded-3xl text-left transition-all hover:shadow-2xl hover:shadow-accent-primary/5 overflow-hidden"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-all">
                      {React.cloneElement(option.icon, { size: 28 })}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{option.label}</h3>
                      <p className="text-muted-foreground">{option.desc}</p>
                    </div>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="text-accent-primary" />
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
