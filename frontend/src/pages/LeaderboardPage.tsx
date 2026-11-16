import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Flame } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/i18n/useLanguage';
import { Avatar } from '@/components/avatar/Avatar';
import type { Profile } from '@/types/database';

const RANK_STYLES = [
  { wrap: 'bg-gradient-to-r from-amber-400/20 to-yellow-500/10 border-amber-400/40', icon: <Crown size={18} className="text-amber-400" />, medal: '🥇' },
  { wrap: 'bg-gradient-to-r from-slate-300/20 to-slate-400/10 border-slate-300/40', icon: <Medal size={18} className="text-slate-300" />, medal: '🥈' },
  { wrap: 'bg-gradient-to-r from-orange-400/20 to-amber-600/10 border-orange-400/40', icon: <Medal size={18} className="text-orange-400" />, medal: '🥉' },
];

export const LeaderboardPage: React.FC = () => {
  const { profile } = useAuthStore();
  const { t } = useLanguage();
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('xp', { ascending: false })
          .limit(50);
        if (!cancelled && data) setRows(data as Profile[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const myRank = profile ? rows.findIndex(r => r.id === profile.id) + 1 : 0;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="w-8 h-8 border-[3px] border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 lg:p-10 max-w-3xl mx-auto pb-24 md:pb-10">
        {/* Заголовок */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-warning/10 border border-accent-warning/20 text-accent-warning mb-4">
            <Trophy size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">{t('leaderboard_title')}</span>
          </div>
          <p className="text-sm text-muted-foreground">{t('leaderboard_subtitle')}</p>
        </motion.div>

        {/* Карточка вашего ранга */}
        {myRank > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-accent-primary/15 to-indigo-500/10 border border-accent-primary/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame size={22} className="text-accent-primary shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('leaderboard_your_rank')}</p>
                <p className="text-2xl font-black text-accent-primary">#{myRank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">XP</p>
              <p className="text-xl font-black">{profile?.xp ?? 0}</p>
            </div>
          </motion.div>
        )}

        {/* Список */}
        <div className="space-y-2">
          {rows.length === 0 && (
            <p className="text-center text-muted-foreground py-10">{t('leaderboard_empty')}</p>
          )}
          {rows.map((row, i) => {
            const isMe = profile && row.id === profile.id;
            const style = RANK_STYLES[i];
            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.6) }}
                className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border transition-all ${
                  isMe
                    ? 'bg-accent-primary/10 border-accent-primary/40 ring-1 ring-accent-primary/30'
                    : style
                      ? `${style.wrap} border`
                      : 'bg-card border-border hover:border-accent-primary/20'
                }`}
              >
                <div className="w-8 text-center shrink-0">
                  {style ? (
                    <span className="text-xl">{style.medal}</span>
                  ) : (
                    <span className="text-sm font-black text-muted-foreground">{i + 1}</span>
                  )}
                </div>
                <Avatar src={row.avatar_url} name={row.full_name} sizeClass="w-10 h-10 md:w-11 md:h-11" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">
                    {row.full_name || row.username || t('profile_default_name')}
                    {isMe && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-accent-primary">({t('leaderboard_you')})</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{t('sidebar_level')} {row.level ?? 1} · {row.streak ?? 0} 🔥</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-sm md:text-base text-accent-primary">{row.xp ?? 0} XP</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};
