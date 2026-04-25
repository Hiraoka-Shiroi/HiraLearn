import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const tiers = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for testing the waters",
    features: ["HTML Basics Module", "Limited AI Checks", "Community Support", "Basic Portfolio Site"],
    cta: "Start Free",
    featured: false
  },
  {
    name: "Student",
    price: "15",
    description: "For serious beginners",
    features: ["All Modules (CSS, JS, React)", "Standard AI Mentoring", "Project Reviews", "Progress Reports"],
    cta: "Join Student",
    featured: false
  },
  {
    name: "Pro",
    price: "29",
    description: "The complete mastery path",
    features: ["Unlimited AI Sensei", "Interview Prep", "Personalized Plan", "Job Referral Network", "Certificate"],
    cta: "Go Pro",
    featured: true
  },
  {
    name: "Early Access",
    price: "199",
    description: "Lifetime ownership",
    features: ["All Future Courses", "Founder's Badge", "Direct Support", "Lifetime Updates"],
    cta: "Get Lifetime",
    featured: false
  }
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Invest in Your Path.</h2>
          <p className="text-muted max-w-xl mx-auto">
            Choose the level of guidance you need. Every tier includes the core Step-by-Step curriculum.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-8 rounded-[2rem] border transition-all ${
                tier.featured
                  ? 'bg-accent-primary border-accent-primary shadow-2xl shadow-accent-primary/20 scale-105 z-10'
                  : 'bg-card border-border hover:border-muted'
              }`}
            >
              <div className="mb-8">
                <h3 className={`text-lg font-bold mb-2 ${tier.featured ? 'text-white' : 'text-foreground'}`}>
                  {tier.name}
                </h3>
                <div className="flex items-baseline">
                  <span className={`text-4xl font-bold ${tier.featured ? 'text-white' : 'text-foreground'}`}>${tier.price}</span>
                  <span className={`text-sm ml-1 ${tier.featured ? 'text-white/70' : 'text-muted'}`}>{tier.price !== '199' && '/mo'}</span>
                </div>
                <p className={`text-sm mt-4 ${tier.featured ? 'text-white/80' : 'text-muted'}`}>
                  {tier.description}
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start text-sm">
                    <Check
                      className={`mr-3 mt-0.5 shrink-0 ${tier.featured ? 'text-white' : 'text-accent-primary'}`}
                      size={16}
                    />
                    <span className={tier.featured ? 'text-white/90' : 'text-muted'}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-4 rounded-2xl font-bold transition-all ${
                  tier.featured
                    ? 'bg-white text-accent-primary hover:bg-slate-100'
                    : 'bg-background border border-border hover:bg-border'
                }`}
              >
                {tier.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
