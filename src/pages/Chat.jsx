import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Sidebar from '@/components/layout/Sidebar';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import EmptyState from '@/components/chat/EmptyState';
import { streamMockResponse, streamApiResponse, streamBackendFunction, generateTitle } from '@/components/chat/StreamingService';

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-created_date'),
  });

  // Fetch settings
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
  });

  const settings = settingsData?.[0] || { mock_mode: true, use_backend_function: false, api_endpoint: '' };

  // Mutations
  const createConversation = useMutation({
    mutationFn: (data) => base44.entities.Conversation.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const updateConversation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Conversation.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const deleteConversation = useMutation({
    mutationFn: (id) => base44.entities.Conversation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (activeConversation?.id === id) {
        setActiveConversation(null);
        setMessages([]);
      }
    },
  });

  // Theme effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages || []);
    } else {
      setMessages([]);
    }
  }, [activeConversation?.id]);

  const handleSelectConversation = useCallback((conv) => {
    setActiveConversation(conv);
    setSidebarOpen(false);
  }, []);

  const handleNewConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
    setSidebarOpen(false);
  }, []);

  const handleSendMessage = async (content) => {
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsStreaming(true);
    setStreamingContent('');

    let conversation = activeConversation;

    // Create new conversation if needed
    if (!conversation) {
      const title = await generateTitle(content);
      const newConv = await createConversation.mutateAsync({
        title,
        messages: [userMessage],
        last_message_preview: content.substring(0, 50)
      });
      conversation = newConv;
      setActiveConversation(newConv);
    } else {
      // Update existing conversation with user message
      await updateConversation.mutateAsync({
        id: conversation.id,
        data: {
          messages: newMessages,
          last_message_preview: content.substring(0, 50)
        }
      });
    }

    // Stream response
    let fullResponse = '';
    let streamGenerator;
    
    if (settings.mock_mode) {
      streamGenerator = streamMockResponse(content);
    } else if (settings.use_backend_function) {
      streamGenerator = streamBackendFunction(content, messages);
    } else {
      streamGenerator = streamApiResponse(content, settings.api_endpoint, messages);
    }

    for await (const chunk of streamGenerator) {
      fullResponse = chunk;
      setStreamingContent(chunk);
    }

    // Add assistant message
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: fullResponse,
      timestamp: new Date().toISOString()
    };

    const finalMessages = [...newMessages, assistantMessage];
    setMessages(finalMessages);
    setStreamingContent('');
    setIsStreaming(false);

    // Save to database
    await updateConversation.mutateAsync({
      id: conversation.id,
      data: {
        messages: finalMessages,
        last_message_preview: fullResponse.substring(0, 50)
      }
    });
  };

  const handleStartFromFeature = (featureTitle) => {
    handleSendMessage(`Je souhaite en savoir plus sur : ${featureTitle}`);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={(id) => deleteConversation.mutate(id)}
        mockMode={settings.mock_mode}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold text-slate-800 dark:text-white">
              {activeConversation?.title || 'Nouvelle conversation'}
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewConversation}
            className="shrink-0"
          >
            Nouveau chat
          </Button>
        </header>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0">
          {messages.length === 0 && !isStreaming ? (
            <EmptyState onStartConversation={handleStartFromFeature} />
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="w-full">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                
                {isStreaming && streamingContent && (
                  <ChatMessage
                    message={{ role: 'assistant', content: streamingContent }}
                    isStreaming={true}
                  />
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          <div className="w-full">
            <ChatInput
              onSend={handleSendMessage}
              isLoading={isStreaming}
            />
          </div>
        </div>
      </main>
    </div>
  );
}