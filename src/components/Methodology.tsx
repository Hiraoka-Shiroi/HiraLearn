
import { motion } from 'framer-motion';
import { Target, Zap, Shield, BookOpen } from 'lucide-react';

const features = [
  {
    icon: <Target className="text-accent-primary" />,
    title: "Принцип лестницы",
    description: "Каждая тема — это ступенька. Мы никогда не перепрыгиваем через этапы, гарантируя прочный фундамент."
  },
  {
    icon: <Zap className="text-accent-success" />,
    title: "AI-поддержка",
    description: "Наш Сэнсэй не дает готовых ответов. Он создает обучающую среду, чтобы вы дошли до решения сами."
  },
  {
    icon: <Shield className="text-accent-warning" />,
    title: "Движок удержания",
    description: "Интервальные повторения и постоянный обзор старых тем, интегрированные в новые уроки."
  },
  {
    icon: <BookOpen className="text-accent-danger" />,
    title: "Реальные проекты",
    description: "Никаких 'hello world'. Собирайте портфолио из реальных проектов уже с первого модуля."
  }
];

export const Methodology = () => {
  return (
    <section id="the-path" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Создано для ясности.</h2>
          <p className="text-muted max-w-xl mx-auto">
            Обычные уроки не работают, потому что они хаотичны. Мы следуем философии Дзен: один сфокусированный шаг за раз.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-card border border-border hover:border-accent-primary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center mb-6 shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-muted text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
