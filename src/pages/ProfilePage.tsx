
import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';
import { User, Settings, Award, LogOut, ChevronRight, Zap, Trophy, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';

export const ProfilePage: React.FC = () => {
  const { profile, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const achievements = [
    { id: 1, title: 'Первый шаг', desc: 'Завершил первый урок', icon: <Zap className="text-accent-warning" /> },
    { id: 2, title: 'Код-ниндзя', desc: 'Решил 5 задач без подсказок', icon: <Target className="text-accent-primary" /> },
    { id: 3, title: 'Стрик-мастер', desc: 'Занимался 3 дня подряд', icon: <Trophy className="text-accent-success" /> },
  ];

  return (
    <MainLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 mb-8 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 text-accent-primary/5 group-hover:rotate-12 transition-transform duration-1000">
              <User size={160} />
           </div>

           <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 bg-accent-primary rounded-full border-8 border-background flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-accent-primary/20">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-4xl font-black mb-2 tracking-tight">{profile?.full_name || 'Ученик'}</h1>
                <p className="text-muted-foreground font-medium mb-6">Уровень {profile?.level} • {profile?.xp} XP Мастерства</p>
                <div className="flex gap-3 justify-center md:justify-start">
                   <span className="px-5 py-2 bg-accent-primary/10 text-accent-primary border border-accent-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                      {profile?.current_goal || 'Frontend'}
                   </span>
                   <span className="px-5 py-2 bg-accent-success/10 text-accent-success border border-accent-success/20 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                      Student
                   </span>
                </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stats & Settings */}
          <div className="md:col-span-2 space-y-8">
            <section>
               <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                 <Settings className="text-muted-foreground" size={24} /> Настройки обучения
               </h2>
               <div className="bg-card border border-border rounded-[2rem] divide-y divide-border overflow-hidden shadow-lg">
                  <div className="p-6 md:p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary">
                          <Target size={24} />
                       </div>
                       <div>
                         <p className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-0.5">Цель обучения</p>
                         <p className="text-lg font-bold">{profile?.current_goal || 'Frontend'}</p>
                       </div>
                    </div>
                    <ChevronRight className="text-muted-foreground" size={20} />
                  </div>
                  <div className="p-6 md:p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-accent-success/10 rounded-2xl flex items-center justify-center text-accent-success">
                          <Zap size={24} />
                       </div>
                       <div>
                         <p className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-0.5">Дневная цель</p>
                         <p className="text-lg font-bold">{profile?.daily_minutes} минут в день</p>
                       </div>
                    </div>
                    <ChevronRight className="text-muted-foreground" size={20} />
                  </div>
                  <div className="p-6 md:p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-accent-warning/10 rounded-2xl flex items-center justify-center text-accent-warning">
                          <Award size={24} />
                       </div>
                       <div>
                         <p className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-0.5">Стиль объяснения</p>
                         <p className="text-lg font-bold capitalize">{profile?.explanation_style}</p>
                       </div>
                    </div>
                    <ChevronRight className="text-muted-foreground" size={20} />
                  </div>
               </div>
            </section>

            <button
              onClick={handleLogout}
              className="w-full p-8 bg-accent-danger/5 border-2 border-dashed border-accent-danger/20 rounded-[2rem] text-accent-danger font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-accent-danger hover:text-white transition-all shadow-xl shadow-accent-danger/5"
            >
              <LogOut size={24} /> Выйти из аккаунта
            </button>
          </div>

          {/* Achievements */}
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Award className="text-muted-foreground" size={24} /> Достижения
            </h2>
            <div className="space-y-4">
               {achievements.map((ach) => (
                 <motion.div
                   key={ach.id}
                   whileHover={{ x: 5 }}
                   className="p-5 bg-card border border-border rounded-3xl flex items-center gap-5 shadow-md"
                 >
                   <div className="w-14 h-14 bg-background border border-border rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                      {ach.icon}
                   </div>
                   <div>
                      <p className="text-base font-bold mb-0.5">{ach.title}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">{ach.desc}</p>
                   </div>
                 </motion.div>
               ))}
               <div className="p-8 bg-accent-primary/5 border-2 border-dashed border-accent-primary/20 rounded-3xl text-center">
                  <p className="text-xs font-bold text-accent-primary uppercase tracking-widest">Больше скоро...</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
