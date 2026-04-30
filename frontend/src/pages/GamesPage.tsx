/**
 * Arcade — collection of bite-sized mini-games awarding XP through the
 * `award_xp` RPC. Most games are real (Bug Hunter, Tag Builder, CSS
 * Color Match, JS Quiz); visually-heavier ones (Flexbox Align, Syntax
 * Speed) are listed with a "Coming soon" badge so the section never
 * feels empty.
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug, ShieldCheck, Zap, CheckCircle2, ChevronLeft, XCircle, Trophy,
  Palette, Boxes, Code2, Timer, Clock3,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { trackEvent } from '@/lib/firebase/analytics';
import { useLanguage } from '@/i18n/useLanguage';
import { TranslationKey } from '@/i18n/translations';

type Difficulty = 'easy' | 'medium' | 'hard';

interface GameCard {
  id: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  icon: React.ReactElement;
  iconClass: string;
  bgClass: string;
  xp: number;
  difficulty: Difficulty;
  /** If false, we render the card as a "Coming soon" placeholder. */
  playable: boolean;
}

const games: GameCard[] = [
  {
    id: 'bug-hunter',
    titleKey: 'games_bug_hunter',
    descKey: 'games_bug_desc',
    icon: <Bug />,
    iconClass: 'text-accent-danger',
    bgClass: 'from-red-500/10 to-card',
    xp: 100,
    difficulty: 'medium',
    playable: true,
  },
  {
    id: 'tag-builder',
    titleKey: 'games_tag_builder',
    descKey: 'games_tag_desc',
    icon: <Zap />,
    iconClass: 'text-accent-primary',
    bgClass: 'from-accent-primary/10 to-card',
    xp: 150,
    difficulty: 'easy',
    playable: true,
  },
  {
    id: 'css-color-match',
    titleKey: 'games_css_match',
    descKey: 'games_css_match_desc',
    icon: <Palette />,
    iconClass: 'text-fuchsia-400',
    bgClass: 'from-fuchsia-500/10 to-card',
    xp: 120,
    difficulty: 'easy',
    playable: true,
  },
  {
    id: 'js-quiz',
    titleKey: 'games_js_quiz',
    descKey: 'games_js_quiz_desc',
    icon: <Code2 />,
    iconClass: 'text-amber-400',
    bgClass: 'from-amber-500/10 to-card',
    xp: 140,
    difficulty: 'medium',
    playable: true,
  },
  {
    id: 'flexbox-align',
    titleKey: 'games_flex',
    descKey: 'games_flex_desc',
    icon: <Boxes />,
    iconClass: 'text-emerald-400',
    bgClass: 'from-emerald-500/10 to-card',
    xp: 180,
    difficulty: 'hard',
    playable: false,
  },
  {
    id: 'syntax-speed',
    titleKey: 'games_syntax',
    descKey: 'games_syntax_desc',
    icon: <Timer />,
    iconClass: 'text-cyan-400',
    bgClass: 'from-cyan-500/10 to-card',
    xp: 200,
    difficulty: 'hard',
    playable: false,
  },
];

const BUG_HUNTER_CHALLENGES = [
  {
    id: 1,
    descKey: 'games_bug_desc_1' as TranslationKey,
    buggyCode: "<div>\n  <h1>Welcome</h1>\n  <p>Practice is the path to mastery.</div>",
    solution: "<div>\n  <h1>Welcome</h1>\n  <p>Practice is the path to mastery.</p>\n</div>",
    check: (code: string) =>
      code.includes('<p>') && code.includes('</p>')
      && code.includes('<h1>') && code.includes('</h1>')
      && code.includes('<div>') && code.includes('</div>'),
  },
];

const TAG_BUILDER_CHALLENGES: { id: number; titleKey: TranslationKey; goal: string[]; blocks: string[] }[] = [
  {
    id: 1,
    titleKey: 'games_tag_simple',
    goal: ['article', 'h2', '/h2', 'p', '/p', '/article'],
    blocks: ['p', 'article', '/p', 'h2', '/h2', 'div', '/article', 'span'],
  },
];

interface ColorPair { hex: string; name: string; alternatives: string[] }
const COLOR_MATCH_POOL: ColorPair[] = [
  { hex: '#ef4444', name: '#ef4444', alternatives: ['#22c55e', '#3b82f6', '#f59e0b'] },
  { hex: '#22c55e', name: '#22c55e', alternatives: ['#ef4444', '#6366f1', '#f97316'] },
  { hex: '#3b82f6', name: '#3b82f6', alternatives: ['#ef4444', '#10b981', '#a855f7'] },
  { hex: '#f59e0b', name: '#f59e0b', alternatives: ['#06b6d4', '#84cc16', '#ec4899'] },
  { hex: '#8b5cf6', name: '#8b5cf6', alternatives: ['#14b8a6', '#f43f5e', '#eab308'] },
];

interface JsQuestion { q: string; options: string[]; correct: number }
const JS_QUESTIONS: JsQuestion[] = [
  { q: 'typeof null', options: ['"null"', '"object"', '"undefined"', '"number"'], correct: 1 },
  { q: '[] == false', options: ['true', 'false', 'TypeError', 'NaN'], correct: 0 },
  { q: "JSON.parse('{}')", options: ['{}', '"{}"', 'null', 'SyntaxError'], correct: 0 },
  { q: 'let a = [1,2]; a.length = 0;', options: ['[1,2]', '[]', 'undefined', 'error'], correct: 1 },
];

// ─────────────────────────────────────────────────────────────────────

export const GamesPage: React.FC = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const { profile, setProfile } = useAuthStore();
  const { t } = useLanguage();

  // Bug Hunter state
  const [bugIndex] = useState(0);
  const [userCode, setUserCode] = useState(BUG_HUNTER_CHALLENGES[0]?.buggyCode ?? '');
  const [bhResult, setBhResult] = useState<'idle' | 'success' | 'fail'>('idle');

  // Tag Builder state
  const [tbIndex] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tbResult, setTbResult] = useState<'idle' | 'success' | 'fail'>('idle');

  // Color Match state
  const [colorRound, setColorRound] = useState(0);
  const colorPair = useMemo(() => COLOR_MATCH_POOL[colorRound % COLOR_MATCH_POOL.length], [colorRound]);
  const colorChoices = useMemo(() => {
    const choices = [colorPair.name, ...colorPair.alternatives];
    // Deterministic shuffle by round — avoids React key churn on re-render.
    return choices.sort((a, b) => ((a.charCodeAt(2) + colorRound) % 7) - ((b.charCodeAt(2) + colorRound) % 7));
  }, [colorPair, colorRound]);
  const [colorResult, setColorResult] = useState<'idle' | 'success' | 'fail'>('idle');
  const [colorScore, setColorScore] = useState(0);

  // JS Quiz state
  const [jsIdx, setJsIdx] = useState(0);
  const [jsScore, setJsScore] = useState(0);
  const [jsPicked, setJsPicked] = useState<number | null>(null);

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

  const addXPToProfile = async (amount: number, gameKey: string) => {
    if (!profile) return;
    if (getCompletedGames().has(gameKey)) return;
    markGameCompleted(gameKey);

    // Direct UPDATEs to xp/level/streak from `authenticated` are silently
    // reverted by the profiles_protect_columns trigger. The award_xp RPC
    // (SECURITY DEFINER) is the only sanctioned path.
    const { data: updatedProfile, error } = await supabase.rpc('award_xp', {
      p_amount: amount,
      p_reason: `game:${gameKey}`,
    });

    if (!error && updatedProfile) {
      const next = Array.isArray(updatedProfile) ? updatedProfile[0] : updatedProfile;
      if (next) setProfile(next);
    }
  };

  // ── handlers ──────────────────────────────────────────────────────
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
  const clearTags = () => { setSelectedTags([]); setTbResult('idle'); };
  const checkTags = () => {
    const challenge = TAG_BUILDER_CHALLENGES[tbIndex];
    if (JSON.stringify(selectedTags) === JSON.stringify(challenge.goal)) {
      setTbResult('success');
      void addXPToProfile(150, `tag-builder-${tbIndex}`);
    } else {
      setTbResult('fail');
    }
  };

  const handleColorPick = (value: string) => {
    if (colorResult === 'success') return;
    if (value === colorPair.name) {
      const nextScore = colorScore + 1;
      setColorScore(nextScore);
      setColorResult('success');
      if (nextScore >= 3) {
        void addXPToProfile(120, `css-color-match-${nextScore}`);
      }
      setTimeout(() => {
        setColorRound(r => r + 1);
        setColorResult('idle');
      }, 700);
    } else {
      setColorResult('fail');
      setTimeout(() => setColorResult('idle'), 700);
    }
  };

  const handleJsPick = (i: number) => {
    if (jsPicked !== null) return;
    setJsPicked(i);
    const correct = JS_QUESTIONS[jsIdx].correct === i;
    if (correct) setJsScore(s => s + 1);
    setTimeout(() => {
      if (jsIdx + 1 >= JS_QUESTIONS.length) {
        if (jsScore + (correct ? 1 : 0) >= 3) {
          void addXPToProfile(140, 'js-quiz-finished');
        }
        // keep final state visible
      } else {
        setJsIdx(jsIdx + 1);
        setJsPicked(null);
      }
    }, 800);
  };

  const resetActiveGame = () => {
    setActiveGame(null);
    setBhResult('idle');
    setTbResult('idle');
    setSelectedTags([]);
    setColorRound(0);
    setColorResult('idle');
    setColorScore(0);
    setJsIdx(0);
    setJsScore(0);
    setJsPicked(null);
  };

  // ─────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="p-4 md:p-10 max-w-5xl mx-auto">
        <header className="mb-6 md:mb-10 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black mb-1">{t('games_arcade')}</h1>
            <p className="text-muted-foreground text-sm">{t('games_arcade_subtitle')}</p>
          </div>
          <div className="bg-card border border-border rounded-xl md:rounded-2xl px-3 py-2 flex items-center gap-2 shrink-0">
            <Trophy className="text-accent-warning" size={20} />
            <span className="font-bold">{profile?.xp ?? 0} XP</span>
          </div>
        </header>

        {!activeGame ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
            {games.map((game) => (
              <GameTile
                key={game.id}
                game={game}
                onOpen={() => {
                  if (!game.playable) return;
                  setActiveGame(game.id);
                  void trackEvent('game_start', { game_id: game.id });
                  if (game.id === 'bug-hunter') setUserCode(BUG_HUNTER_CHALLENGES[0].buggyCode);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-4xl">
            <button
              onClick={resetActiveGame}
              className="mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={16} /> {t('games_back')}
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
                    <ResultBanner result={bhResult} xp={100} />
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

                  <div className="min-h-[100px] bg-background border-2 border-dashed border-border rounded-2xl md:rounded-3xl p-4 md:p-6 mb-6 flex flex-wrap gap-2 md:gap-3 justify-center items-center">
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

                  <div className="flex flex-wrap gap-2 md:gap-3 justify-center mb-8">
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
                    <button onClick={clearTags} disabled={tbResult === 'success'} className="text-muted-foreground hover:text-foreground text-sm font-bold uppercase tracking-widest">
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
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex items-center justify-center text-accent-success font-bold text-xl">
                        <CheckCircle2 className="mr-3" /> {t('games_master').replace('{xp}', '150')}
                      </motion.div>
                    )}
                    {tbResult === 'fail' && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex items-center justify-center text-accent-danger font-bold text-lg">
                        <XCircle className="mr-3" /> {t('games_unstable')}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {activeGame === 'css-color-match' && (
              <ColorMatchGame
                colorPair={colorPair}
                choices={colorChoices}
                result={colorResult}
                score={colorScore}
                onPick={handleColorPick}
              />
            )}

            {activeGame === 'js-quiz' && (
              <JsQuizGame
                index={jsIdx}
                picked={jsPicked}
                score={jsScore}
                onPick={handleJsPick}
              />
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────

const GameTile: React.FC<{ game: GameCard; onOpen: () => void }> = ({ game, onOpen }) => {
  const { t } = useLanguage();
  return (
    <motion.button
      whileHover={game.playable ? { y: -4 } : {}}
      whileTap={game.playable ? { scale: 0.98 } : {}}
      onClick={onOpen}
      disabled={!game.playable}
      className={`text-left p-5 md:p-6 border border-border rounded-2xl md:rounded-3xl relative overflow-hidden transition-all ${
        game.playable
          ? `bg-gradient-to-br ${game.bgClass} active:border-accent-primary md:hover:border-accent-primary cursor-pointer`
          : 'bg-card opacity-70 cursor-not-allowed'
      }`}
    >
      {/* Difficulty pill */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        {!game.playable && (
          <span className="px-2 py-0.5 rounded-md bg-surface-2 border border-border text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Clock3 size={10} /> {t('games_soon')}
          </span>
        )}
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${difficultyClass(game.difficulty)}`}>
          {t(diffLabelKey(game.difficulty))}
        </span>
      </div>

      <div className={`w-12 h-12 md:w-14 md:h-14 bg-card border border-border rounded-xl md:rounded-2xl flex items-center justify-center mb-4 ${game.iconClass}`}>
        {React.cloneElement(game.icon, { size: 24 })}
      </div>
      <h3 className="text-lg md:text-xl font-black mb-1.5">{t(game.titleKey)}</h3>
      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{t(game.descKey)}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-accent-success uppercase tracking-widest flex items-center gap-1.5">
          <ShieldCheck size={12} /> +{game.xp} XP
        </span>
        <span className="font-bold text-accent-primary uppercase tracking-widest">
          {game.playable ? t('games_play') : t('games_soon')} →
        </span>
      </div>
    </motion.button>
  );
};

const difficultyClass = (d: Difficulty) =>
  d === 'easy' ? 'bg-emerald-500/15 text-emerald-400'
    : d === 'medium' ? 'bg-amber-500/15 text-amber-400'
      : 'bg-red-500/15 text-red-400';

const diffLabelKey = (d: Difficulty): TranslationKey =>
  d === 'easy' ? 'games_diff_easy' : d === 'medium' ? 'games_diff_medium' : 'games_diff_hard';

const ResultBanner: React.FC<{ result: 'idle' | 'success' | 'fail'; xp: number }> = ({ result, xp }) => {
  const { t } = useLanguage();
  return (
    <AnimatePresence>
      {result === 'success' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center text-accent-success font-bold text-lg">
          <CheckCircle2 className="mr-2" /> {t('games_great').replace('{xp}', String(xp))}
        </motion.div>
      )}
      {result === 'fail' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center text-accent-danger font-bold text-lg">
          <XCircle className="mr-2" /> {t('games_try_again')}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ColorMatchGame: React.FC<{
  colorPair: ColorPair;
  choices: string[];
  result: 'idle' | 'success' | 'fail';
  score: number;
  onPick: (v: string) => void;
}> = ({ colorPair, choices, result, score, onPick }) => {
  const { t } = useLanguage();
  return (
    <div className="bg-card border border-border rounded-2xl md:rounded-[2.5rem] p-5 md:p-12 text-center">
      <h2 className="text-xl md:text-2xl font-black mb-2 flex items-center justify-center gap-3">
        <Palette className="text-fuchsia-400" /> {t('games_css_match')}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">{t('games_css_match_desc')}</p>

      <motion.div
        key={colorPair.hex}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-auto w-32 h-32 md:w-40 md:h-40 rounded-3xl mb-6 shadow-2xl"
        style={{ backgroundColor: colorPair.hex }}
      />

      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-6">
        {choices.map((c) => (
          <button
            key={c}
            onClick={() => onPick(c)}
            className="px-4 py-3 rounded-xl bg-surface-1 border border-border font-mono text-sm font-bold hover:border-accent-primary active:border-accent-primary active:scale-[0.97] transition-all min-h-[48px]"
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm font-bold">
        <Trophy size={16} className="text-accent-warning" />
        <span>{score}</span>
        <span className="text-muted-foreground">• {t('games_best_score')}</span>
      </div>

      <AnimatePresence>
        {result === 'success' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 text-accent-success font-bold">
            ✓
          </motion.p>
        )}
        {result === 'fail' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 text-accent-danger font-bold">
            ✗ {t('games_try_again')}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

const JsQuizGame: React.FC<{
  index: number;
  picked: number | null;
  score: number;
  onPick: (i: number) => void;
}> = ({ index, picked, score, onPick }) => {
  const { t } = useLanguage();
  const q = JS_QUESTIONS[Math.min(index, JS_QUESTIONS.length - 1)];
  const done = index >= JS_QUESTIONS.length - 1 && picked !== null;

  return (
    <div className="bg-card border border-border rounded-2xl md:rounded-[2.5rem] p-5 md:p-10 max-w-xl mx-auto">
      <h2 className="text-xl md:text-2xl font-black mb-2 flex items-center gap-3">
        <Code2 className="text-amber-400" /> {t('games_js_quiz')}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        {index + 1} / {JS_QUESTIONS.length} · {t('games_best_score')}: <span className="font-bold text-accent-primary">{score}</span>
      </p>

      <div className="bg-background border border-border rounded-2xl p-5 md:p-6 mb-4 font-mono text-base md:text-lg text-center break-all">
        {q.q}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {q.options.map((opt, i) => {
          const isCorrect = picked !== null && i === q.correct;
          const isWrong = picked === i && i !== q.correct;
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => onPick(i)}
              className={`px-4 py-3 rounded-xl border font-mono text-sm font-bold transition-all min-h-[48px] ${
                isCorrect
                  ? 'bg-accent-success/10 border-accent-success/40 text-accent-success'
                  : isWrong
                    ? 'bg-accent-danger/10 border-accent-danger/40 text-accent-danger'
                    : 'bg-surface-1 border-border hover:border-accent-primary active:border-accent-primary'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {done && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent-primary/10 border border-accent-primary/30 text-accent-primary font-bold text-center">
          {score}/{JS_QUESTIONS.length}
        </motion.div>
      )}
    </div>
  );
};
