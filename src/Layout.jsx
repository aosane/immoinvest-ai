import React from 'react';
import { Toaster } from 'sonner';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <style>{`
        :root {
          --amber-500: #f59e0b;
          --amber-600: #d97706;
        }
        
        .dark {
          color-scheme: dark;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .dark ::-webkit-scrollbar-thumb {
          background: #475569;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .dark ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
        
        /* Prose dark mode */
        .dark .prose-slate {
          --tw-prose-body: #cbd5e1;
          --tw-prose-headings: #f1f5f9;
          --tw-prose-links: #f59e0b;
          --tw-prose-bold: #f1f5f9;
          --tw-prose-counters: #94a3b8;
          --tw-prose-bullets: #64748b;
          --tw-prose-quotes: #e2e8f0;
          --tw-prose-code: #f1f5f9;
        }
      `}</style>
      
      {children}
      
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e2e8f0',
          },
        }}
      />
    </div>
  );
}