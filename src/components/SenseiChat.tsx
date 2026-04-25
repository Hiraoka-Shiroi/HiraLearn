import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { aiService } from '@/lib/ai/aiService';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'sensei' | 'user';
  text: string;
}

interface SenseiChatProps {
  currentCode: string;
}

export const SenseiChat = ({ currentCode }: SenseiChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'sensei', text: "Greetings. I am your Sensei. How can I guide you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await aiService.getFeedback(userMsg, currentCode);
      setMessages(prev => [...prev, { role: 'sensei', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'sensei', text: "The meditation was interrupted. Please try asking again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col hidden xl:flex">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="font-bold flex items-center text-sm">
          <div className="w-2 h-2 rounded-full bg-accent-success mr-2 animate-pulse" />
          AI Sensei
        </h3>
        <Sparkles size={14} className="text-accent-warning" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.role === 'sensei' ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.role === 'sensei' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'sensei'
                  ? 'bg-background border border-border rounded-tl-none'
                  : 'bg-accent-primary text-white rounded-tr-none'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-start"
            >
              <div className="bg-background border border-border rounded-2xl rounded-tl-none p-3">
                <Loader2 size={14} className="animate-spin text-accent-primary" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-background/50">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your Sensei..."
            className="w-full bg-background border border-border rounded-xl py-3 px-4 pr-10 text-xs focus:outline-none focus:border-accent-primary transition-colors"
          />
          <button
            onClick={handleSend}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent-primary transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
