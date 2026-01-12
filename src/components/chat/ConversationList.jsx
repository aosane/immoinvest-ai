import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

function groupConversations(conversations) {
  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  };

  conversations.forEach(conv => {
    const date = new Date(conv.created_date);
    if (isToday(date)) {
      groups.today.push(conv);
    } else if (isYesterday(date)) {
      groups.yesterday.push(conv);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  return groups;
}

function ConversationItem({ conversation, isActive, onClick, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn(
        "group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
        isActive 
          ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" 
          : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
      )}
      onClick={onClick}
    >
      <MessageSquare className={cn(
        "w-4 h-4 flex-shrink-0",
        isActive ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
      )} />
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isActive ? "text-amber-900 dark:text-amber-100" : "text-slate-700 dark:text-slate-300"
        )}>
          {conversation.title || 'Nouvelle conversation'}
        </p>
        {conversation.last_message_preview && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
            {conversation.last_message_preview}
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            className="text-red-600 dark:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conversation.id);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

function GroupSection({ title, conversations, activeId, onSelect, onDelete }) {
  if (conversations.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">
        {title}
      </h3>
      <div className="space-y-1">
        <AnimatePresence>
          {conversations.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              onClick={() => onSelect(conv)}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ConversationList({ conversations, activeId, onSelect, onDelete }) {
  const groups = groupConversations(conversations);

  return (
    <div className="flex-1 overflow-y-auto py-2 px-2">
      <GroupSection 
        title="Aujourd'hui" 
        conversations={groups.today}
        activeId={activeId}
        onSelect={onSelect}
        onDelete={onDelete}
      />
      <GroupSection 
        title="Hier" 
        conversations={groups.yesterday}
        activeId={activeId}
        onSelect={onSelect}
        onDelete={onDelete}
      />
      <GroupSection 
        title="Cette semaine" 
        conversations={groups.thisWeek}
        activeId={activeId}
        onSelect={onSelect}
        onDelete={onDelete}
      />
      <GroupSection 
        title="Plus ancien" 
        conversations={groups.older}
        activeId={activeId}
        onSelect={onSelect}
        onDelete={onDelete}
      />

      {conversations.length === 0 && (
        <div className="text-center py-8 px-4">
          <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Aucune conversation
          </p>
        </div>
      )}
    </div>
  );
}