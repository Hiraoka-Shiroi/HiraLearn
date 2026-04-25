import { useEffect, useState } from 'react';
import { Check, Lock, ChevronDown } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { LessonService } from '@/features/lessons/LessonService';
import { useNavigate } from 'react-router-dom';
import { Database } from '@/types/database';

type Lesson = Database['public']['Tables']['lessons']['Row'];

interface RoadmapPathProps {
  courseId: string;
}

export const RoadmapPath = ({ courseId }: RoadmapPathProps) => {
  const { completedLessons } = useStore();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadRoadmap = async () => {
      const modules = await LessonService.getModules(courseId);
      if (modules.length > 0) {
        const lessonsData = await LessonService.getLessons(modules[0].id);
        setLessons(lessonsData);
      }
    };
    loadRoadmap();
  }, [courseId]);

  return (
    <div className="bg-card border border-border rounded-[2rem] p-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold">The Path</h3>
        <button className="text-sm text-muted flex items-center hover:text-foreground">
          View all <ChevronDown className="ml-1" size={16} />
        </button>
      </div>

      <div className="space-y-6">
        {lessons.map((lesson, index) => {
          const isCompleted = completedLessons.includes(lesson.id);
          const isLocked = !isCompleted && index > 0 && !completedLessons.includes(lessons[index-1]?.id);

          return (
            <button
              key={lesson.id}
              disabled={isLocked}
              onClick={() => navigate(`/workspace?lessonId=${lesson.id}`)}
              className="w-full relative flex items-center space-x-4 text-left group"
            >
              {index !== lessons.length - 1 && (
                <div className={`absolute left-5 top-10 w-0.5 h-10 -z-10 ${
                  isCompleted ? 'bg-accent-primary' : 'bg-border'
                }`} />
              )}

              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                isCompleted ? 'bg-accent-primary border-accent-primary' :
                !isLocked ? 'bg-background border-accent-primary shadow-[0_0_15px_rgba(99,102,241,0.3)]' :
                'bg-background border-border'
              }`}>
                {isCompleted && <Check size={18} className="text-white" />}
                {!isCompleted && !isLocked && <div className="w-2.5 h-2.5 rounded-full bg-accent-primary animate-pulse" />}
                {isLocked && <Lock size={16} className="text-muted" />}
              </div>

              <div className="flex-1">
                <h4 className={`font-medium text-sm ${
                  isLocked ? 'text-muted' : 'text-foreground group-hover:text-accent-primary transition-colors'
                }`}>
                  {index + 1}. {lesson.title}
                </h4>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
