import { Flame, Star, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { HTML_MODULE_LESSONS } from '@/features/lesson/content';

export const StatsGrid = () => {
  const { xp, streak, completedLessons } = useStore();

  const stats = [
    { label: 'Current Streak', value: `${streak} days`, icon: <Flame className="text-orange-500" />, color: 'bg-orange-500/10' },
    { label: 'Total XP', value: xp.toLocaleString(), icon: <Star className="text-accent-warning" />, color: 'bg-accent-warning/10' },
    { label: 'Lessons Done', value: `${completedLessons.length} / ${HTML_MODULE_LESSONS.length}`, icon: <CheckCircle className="text-accent-success" />, color: 'bg-accent-success/10' },
    { label: 'Time Spent', value: '4.5 hrs', icon: <Clock className="text-accent-primary" />, color: 'bg-accent-primary/10' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-6 rounded-2xl bg-card border border-border flex items-center space-x-4"
        >
          <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
            {stat.icon}
          </div>
          <div>
            <p className="text-xs text-muted mb-1">{stat.label}</p>
            <p className="text-xl font-bold">{stat.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
