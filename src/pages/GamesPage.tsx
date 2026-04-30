
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, ShieldCheck, Zap, CheckCircle2, ChevronLeft, XCircle, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { trackEvent } from '@/lib/firebase/analytics';
import { useLanguage } from '@/i18n/useLanguage';
import { TranslationKey } from '@/i18n/translations';

const games: { id: string; titleKey: TranslationKey; descKey: TranslationKey; icon: React.ReactElement; xp: number }[] = [
  {
    id: 'bug-hunter',
    titleKey: 'games_bug_hunter',
    descKey: 'games_bug_desc',
    icon: <Bug className="text-accent-danger" />,
    xp: 100,
  },
  {
    id: 'tag-builder',
    titleKey: 'games_tag_builder',
    descKey: 'games_tag_desc',
    icon: <Zap className="text-accent-primary" />,
    xp: 150,
  }
];

const BUG_HUNTER_CHALLENGES = [
  {
    id: 1,
    descKey: 'games_bug_desc_1' as TranslationKey,
    buggyCode: "<div>\n  <h1>Welcome</h1>\n  <p>Practice is the path to mastery.</div>",
    solution: "<div>\n  <h1>Welcome</h1>\n  <p>Practice is the path to mastery.</p>\n</div>",
    check: (code: string) => code.includes('<p>') && code.includes('</p>') && code.includes('<h1>') && code.includes('</h1>') && code.includes('<div>') && code.includes('</div>')
  }
];

const TAG_BUILDER_CHALLENGES: { id: number; titleKey: TranslationKey; goal: string[]; blocks: string[] }[] = [
  {
    id: 1,
    titleKey: 'games_tag_simple',
    goal: ["article", "h2", "/h2", "p", "/p", "/article"],
    blocks: ["p", "article", "/p", "h2", "/h2", "div", "/article", "span"]
  }
];

export const GamesPage: React.FC = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const { profile, setProfile } = useAuthStore();
  const { t } = useLanguage();

  // Bug Hunter State
  const [bugIndex] = useState(0);
  const [userCode, setUserCode] = useState(BUG_HUNTER_CHALLENGES[0]?.buggyCode ?? '');
  const [bhResult, setBhResult] = useState<'idle' | 'success' | 'fail'>('idle');

  // Tag Builder State
  const [tbIndex] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tbResult, setTbResult] = useState<'idle' | 'success' | 'fail'>('idle');

  const getCompletedGames = (): Set<string> => {
    try {
      const raw = localStorage.getItem('hiralearn_completed_games');
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch { return new Set(); }
  };

  const markGameCompleted = (key: string) => {
    try {
      const completed = getCompletedGames();
      completed.add(key);
      localStorage.setItem('hiralearn_completed_games', JSON.stringify([...completed]));
    } catch { /* noop */ }
  };

  const calculateLevel = (xp: number): number => {
    if (xp < 100) return 1;
    if (xp < 300) return 2;
    if (xp < 600) return 3;
    if (xp < 1000) return 4;
    if (xp < 1500) return 5;
    if (xp < 2100) return 6;
    if (xp < 2800) return 7;
    if (xp < 3600) return 8;
    if (xp < 4500) return 9;
    return 10;
  };

  const addXPToProfile = async (amount: number, gameKey: string) => {
    if (!profile) return;
    if (getCompletedGames().has(gameKey)) return;
    markGameCompleted(gameKey);
    const newXp = profile.xp + amount;
    const newLevel = calculateLevel(newXp);
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ xp: newXp, level: newLevel })
      .eq('id', profile.id)
      .select()
      .single();

    if (!error && updatedProfile) {
      setProfile(updatedProfile);
    }
  };

  const handleBugCheck = () => {
    const challenge = BUG_HUNTER_CHALLENGES[bugIndex];
    if (challenge.check(userCode)) {
      setBhResult('success');
      void addXPToProfile(100, `bug-hunter-${bugIndex}`);
    } else {
      setBhResult('fail');
    }
  };

  const handleTagClick = (tag: string) => {
    if (tbResult === 'success') return;
    setSelectedTags([...selectedTags, tag]);
  };

  const clearTags = () => {
    setSelectedTags([]);
    setTbResult('idle');
  };

  const checkTags = () => {
    const challenge = TAG_BUILDER_CHALLENGES[tbIndex];
    const isCorrect = JSON.stringify(selectedTags) === JSON.stringify(challenge.goal);
    if (isCorrect) {
      setTbResult('success');
      void addXPToProfile(150, `tag-builder-${tbIndex}`);
    } else {
      setTbResult('fail');
    }
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-10 max-w-5xl mx-auto">
        <header className="mb-6 md:mb-12 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{t('games_arcade')}</h1>
            <p className="text-muted-foreground text-sm">{t('games_arcade_subtitle')}</p>
          </div>
          <div className="bg-card border border-border rounded-xl md:rounded-2xl px-3 py-2 flex items-center gap-2 md:gap-3 shrink-0">
             <Trophy className="text-accent-warning" size={20} />
             <span className="font-bold">{profile?.xp} XP</span>
          </div>
        </header>

        {!activeGame ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
            {games.map((game) => (
              <motion.button
                key={game.id}
                whileHover={{ y: -5 }}
                onClick={() => {
                  setActiveGame(game.id);
                  void trackEvent('game_start', { game_id: game.id });
                  if (game.id === 'bug-hunter') setUserCode(BUG_HUNTER_CHALLENGES[0].buggyCode);
                }}
                className="p-5 md:p-8 bg-card border border-border rounded-2xl md:rounded-[2.5rem] text-left active:border-accent-primary md:hover:border-accent-primary transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   {React.cloneElement(game.icon as React.ReactElement, { size: 120 })}
                </div>
                <div className="w-12 h-12 md:w-14 md:h-14 bg-background border border-border rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-accent-primary/10 transition-colors">
                  {game.icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2">{t(game.titleKey)}</h3>
                <p className="text-muted-foreground text-sm mb-4 md:mb-6">{t(game.descKey)}</p>
                <div className="flex items-center text-xs font-bold text-accent-success uppercase tracking-widest">
                  <ShieldCheck size={14} className="mr-2" />
                  {t('games_reward')}: {game.xp} XP
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="max-w-4xl">
            <button
              onClick={() => {
                setActiveGame(null);
                setBhResult('idle');
                setTbResult('idle');
                setSelectedTags([]);
              }}
              className="mb-8 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              {t('games_back')}
            </button>

            {activeGame === 'bug-hunter' && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-2xl md:rounded-[2.5rem] p-5 md:p-12">
                  <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 flex items-center gap-3">
                    <Bug className="text-accent-danger" /> Bug Hunter
                  </h2>
                  <p className="text-muted-foreground mb-5 md:mb-8">{t(BUG_HUNTER_CHALLENGES[bugIndex].descKey)}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-5 md:mb-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-2">{t('games_editor')}</label>
                      <textarea
                        value={userCode}
                        onChange={(e) => setUserCode(e.target.value)}
                        className="w-full h-40 md:h-48 bg-background border border-border rounded-xl md:rounded-2xl p-3 md:p-4 font-mono text-sm focus:outline-none focus:border-accent-primary transition-all"
                        spellCheck={false}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-2">{t('games_bug_label')}</label>
                      <pre className="w-full h-40 md:h-48 bg-accent-danger/5 border border-accent-danger/20 rounded-xl md:rounded-2xl p-3 md:p-4 font-mono text-sm text-accent-danger/70 overflow-auto">
                        {BUG_HUNTER_CHALLENGES[bugIndex].buggyCode}
                      </pre>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <button
                      onClick={handleBugCheck}
                      disabled={bhResult === 'success'}
                      className="w-full md:w-auto bg-accent-primary text-white px-8 md:px-10 py-4 rounded-xl md:rounded-2xl font-bold active:scale-95 md:hover:scale-105 transition-all disabled:opacity-50 min-h-[48px]"
                    >
                      {t('games_check_code')}
                    </button>

                    <AnimatePresence>
                      {bhResult === 'success' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center text-accent-success font-bold text-lg">
                          <CheckCircle2 className="mr-2" /> {t('games_great').replace('{xp}', '100')}
                        </motion.div>
                      )}
                      {bhResult === 'fail' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center text-accent-danger font-bold text-lg">
                          <XCircle className="mr-2" /> {t('games_try_again')}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {activeGame === 'tag-builder' && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-2xl md:rounded-[2.5rem] p-5 md:p-12 text-center">
                  <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 flex items-center justify-center gap-3">
                    <Zap className="text-accent-primary" /> Tag Builder
                  </h2>
                  <p className="text-muted-foreground mb-5 md:mb-8">{t('games_assemble_struct').replace('{title}', t(TAG_BUILDER_CHALLENGES[tbIndex].titleKey))}</p>

                  <div className="min-h-[100px] md:min-h-[120px] bg-background border-2 border-dashed border-border rounded-2xl md:rounded-3xl p-4 md:p-6 mb-6 md:mb-10 flex flex-wrap gap-2 md:gap-3 justify-center items-center">
                    {selectedTags.length === 0 && <span className="text-muted-foreground text-sm uppercase tracking-widest">{t('games_pick_blocks')}</span>}
                    {selectedTags.map((tag, i) => (
                      <motion.div
                        layoutId={`tag-${i}`}
                        key={i}
                        className="bg-accent-primary text-white px-4 py-2 rounded-xl text-sm font-mono font-bold shadow-lg shadow-accent-primary/20"
                      >
                        &lt;{tag}&gt;
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 md:gap-3 justify-center mb-8 md:mb-12">
                    {TAG_BUILDER_CHALLENGES[tbIndex].blocks.map((tag, i) => (
                      <button
                        key={i}
                        disabled={tbResult === 'success'}
                        onClick={() => handleTagClick(tag)}
                        className="bg-card border border-border px-4 md:px-6 py-3 rounded-xl md:rounded-2xl text-sm font-mono font-bold active:border-accent-primary active:text-accent-primary md:hover:border-accent-primary md:hover:text-accent-primary transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <button
                      onClick={clearTags}
                      disabled={tbResult === 'success'}
                      className="text-muted-foreground hover:text-foreground text-sm font-bold uppercase tracking-widest"
                    >
                      {t('games_clear')}
                    </button>
                    <button
                      onClick={checkTags}
                      disabled={tbResult === 'success'}
                      className="bg-foreground text-background px-8 md:px-10 py-4 rounded-xl md:rounded-2xl font-bold active:scale-95 md:hover:scale-105 transition-all disabled:opacity-50 min-h-[48px]"
                    >
                      {t('games_assemble')}
                    </button>
                  </div>

                  <AnimatePresence>
                    {tbResult === 'success' && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10 flex items-center justify-center text-accent-success font-bold text-xl">
                        <CheckCircle2 className="mr-3" /> {t('games_master').replace('{xp}', '150')}
                      </motion.div>
                    )}
                    {tbResult === 'fail' && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10 flex items-center justify-center text-accent-danger font-bold text-lg">
                        <XCircle className="mr-3" /> {t('games_unstable')}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
