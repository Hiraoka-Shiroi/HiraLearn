import { useEffect, useState } from 'react';
import { Play, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { LessonService } from '@/features/lessons/LessonService';
import { Database } from '@/types/database';

type Lesson = Database['public']['Tables']['lessons']['Row'];

interface ProgressCardProps {
  courseId: string;
}

export const ProgressCard = ({ courseId }: ProgressCardProps) => {
  const { completedLessons } = useStore();
  const navigate = useNavigate();
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [totalLessonsCount, setTotalLessonsCount] = useState(0);

  useEffect(() => {
    const loadProgress = async () => {
      const modules = await LessonService.getModules(courseId);
      if (modules.length > 0) {
        const lessons = await LessonService.getLessons(modules[0].id);
        setTotalLessonsCount(lessons.length);

        // Find first incomplete lesson
        const incomplete = lessons.find(l => !completedLessons.includes(l.id));
        setCurrentLesson(incomplete || lessons[lessons.length - 1]);
      }
    };
    loadProgress();
  }, [courseId, completedLessons]);

  if (!currentLesson) return null;

  const progress = Math.round((completedLessons.length / (totalLessonsCount || 1)) * 100);

  return (
    <div className="bg-card border border-border rounded-[2rem] p-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-accent-primary/5 to-transparent -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-4">
            <span className="px-3 py-1 bg-accent-primary/10 text-accent-primary text-[10px] font-bold rounded-full uppercase tracking-wider">
              Current Module
            </span>
            <span className="text-muted text-[10px] uppercase font-bold tracking-widest">{progress}% complete</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">{currentLesson.title}</h2>
          <p className="text-muted mb-6 max-w-lg text-sm leading-relaxed">
            {currentLesson.theory?.substring(0, 150)}...
          </p>
          <div className="w-full h-1.5 bg-background rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-accent-primary rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => navigate(`/lessons/${currentLesson.id}`)}
          className="bg-foreground text-background px-8 py-4 rounded-2xl font-bold flex items-center justify-center group-hover:bg-accent-primary group-hover:text-white transition-all shadow-xl shadow-accent-primary/0 group-hover:shadow-accent-primary/20"
        >
          <Play className="mr-2 fill-current" size={20} />
          Continue Path
          <ChevronRight className="ml-1" size={20} />
        </button>
      </div>
    </div>
  );
};
