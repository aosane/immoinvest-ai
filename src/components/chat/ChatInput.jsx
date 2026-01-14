import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatInput({ onSend, isLoading, placeholder }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestions = [
    "Quel rendement viser pour un premier investissement ?",
    "Comment calculer la rentabilité nette ?",
    "Quelles villes privilégier en 2024 ?",
    "Différence entre LMNP et LMP ?"
  ];

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {!message && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-3 md:px-8 flex flex-wrap gap-2"
        >
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setMessage(suggestion)}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 
                       text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 
                       hover:text-amber-700 dark:hover:text-amber-400 transition-all duration-200
                       border border-transparent hover:border-amber-200 dark:hover:border-amber-800"
            >
              {suggestion}
            </button>
          ))}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="px-4 py-4 md:px-8">
        <div className="relative flex items-end gap-2 w-full">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || "Posez votre question sur l'investissement locatif..."}
              disabled={isLoading}
              className="min-h-[52px] max-h-[200px] resize-none pr-4 py-3.5 
                       rounded-2xl border-slate-200 dark:border-slate-700 
                       bg-slate-50 dark:bg-slate-800/50
                       focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500
                       transition-all duration-200"
              rows={1}
            />
          </div>

          <Button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="h-[52px] w-[52px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 
                     hover:from-amber-600 hover:to-amber-700 
                     disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-800
                     transition-all duration-200 shadow-lg shadow-amber-500/20 disabled:shadow-none"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
          <Sparkles className="w-3 h-3 inline mr-1" />
          ImmoInvest AI peut faire des erreurs. Vérifiez les informations importantes.
        </p>
      </form>
    </div>
  );
}