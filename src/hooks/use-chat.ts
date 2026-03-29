'use client';

import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types';
import { getChatResponse } from '@/actions/ai';
import { useAISettings } from '@/providers/ai-settings';

export function useChat() {
  const { settings } = useAISettings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const result = await getChatResponse(content, messages, settings);
        if (result.success && result.text) {
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: result.text,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [messages, settings]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
  };
}
