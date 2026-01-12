import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Settings, 
  Building2, 
  X,
  Moon,
  Sun,
  Zap
} from 'lucide-react';
import ConversationList from '@/components/chat/ConversationList';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

export default function Sidebar({ 
  isOpen, 
  onClose, 
  conversations, 
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  mockMode,
  theme,
  onToggleTheme
}) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-50 w-72 flex flex-col",
          "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800",
          "md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 
                          flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-white">ImmoInvest</h1>
              <p className="text-xs text-slate-400">Assistant IA</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* New conversation button */}
        <div className="p-3">
          <Button
            onClick={onNewConversation}
            className="w-full justify-start gap-2 bg-gradient-to-r from-amber-500 to-amber-600 
                     hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Nouvelle conversation
          </Button>
        </div>

        {/* Mock mode indicator */}
        {mockMode && (
          <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 
                        border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Mode Mock actif</span>
            </div>
          </div>
        )}

        {/* Conversations list */}
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={onSelectConversation}
          onDelete={onDeleteConversation}
        />

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className="w-full justify-start gap-2 text-slate-600 dark:text-slate-400"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4" />
                Mode clair
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                Mode sombre
              </>
            )}
          </Button>
          
          <Link to={createPageUrl('Settings')}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-slate-600 dark:text-slate-400"
            >
              <Settings className="w-4 h-4" />
              Paramètres
            </Button>
          </Link>
        </div>
      </motion.aside>
    </>
  );
}