import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { User, Sparkles, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-4 px-4 py-6 md:px-8",
        isUser ? "bg-transparent" : "bg-slate-50/50 dark:bg-slate-800/30"
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
        isUser 
          ? "bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800" 
          : "bg-gradient-to-br from-amber-500 to-amber-600"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Building2 className="w-4 h-4 text-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {isUser ? 'Vous' : 'ImmoInvest AI'}
          </span>
          {!isUser && (
            <Sparkles className="w-3 h-3 text-amber-500" />
          )}
        </div>

        <div className={cn(
          "prose prose-slate dark:prose-invert max-w-none",
          "prose-p:leading-relaxed prose-p:my-2",
          "prose-headings:font-semibold prose-headings:text-slate-800 dark:prose-headings:text-slate-200",
          "prose-ul:my-2 prose-li:my-0.5",
          "prose-code:bg-slate-100 dark:prose-code:bg-slate-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
          "prose-pre:bg-slate-900 prose-pre:text-slate-100"
        )}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-amber-500 animate-pulse rounded-sm" />
          )}
        </div>
      </div>
    </motion.div>
  );
}