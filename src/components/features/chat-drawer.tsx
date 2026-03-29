'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/types';
import { Send, X, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;
}

export function ChatDrawer({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
}: ChatDrawerProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    await onSendMessage(message);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-brand-black/30 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md brutal-border bg-white shadow-brutal-lg z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b-2 border-brand-black">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-brand-orange" />
            <h2 className="font-bold text-lg">AI Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-paper transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 text-brand-gray">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ask me anything about learning resources, courses, or study paths!</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                  msg.role === 'user' ? 'bg-brand-orange text-white' : 'bg-brand-paper'
                )}
              >
                {msg.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={cn(
                  'brutal-border p-3 max-w-[80%]',
                  msg.role === 'user' ? 'bg-brand-orange text-white' : 'bg-brand-paper'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-paper flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="brutal-border p-3 bg-brand-paper">
                <p className="text-sm text-brand-gray">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t-2 border-brand-black">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about courses..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
