import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/80 backdrop-blur-md border-b border-border py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-accent-primary rounded-lg rotate-45 flex items-center justify-center">
            <div className="w-4 h-4 bg-background rounded-sm -rotate-45" />
          </div>
          <span className="text-xl font-bold tracking-tight">HiraLearn</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {['The Path', 'Features', 'Pricing'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              {item}
            </a>
          ))}
          <Link
            to="/login"
            className="bg-accent-primary hover:bg-accent-primary/90 text-white px-5 py-2 rounded-full text-sm font-medium transition-all"
          >
            Start the Path
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 w-full bg-card border-b border-border p-6 flex flex-col space-y-4 md:hidden"
        >
          {['The Path', 'Features', 'Pricing'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="text-lg text-muted hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <Link
            to="/login"
            className="bg-accent-primary hover:bg-accent-primary/90 text-white px-5 py-2 rounded-full text-sm font-medium transition-all"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Start the Path
          </Link>
        </motion.div>
      )}
    </nav>
  );
};
