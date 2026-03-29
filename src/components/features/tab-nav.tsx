'use client';

import { cn } from '@/lib/utils';
import { Settings, MessageCircle, BookOpen } from 'lucide-react';

interface TabNavProps {
  activeTab: 'search' | 'roadmap';
  onTabChange: (tab: 'search' | 'roadmap') => void;
  onOpenChat: () => void;
  onOpenSettings: () => void;
}

export function TabNav({
  activeTab,
  onTabChange,
  onOpenChat,
  onOpenSettings,
}: TabNavProps) {
  const tabs = [
    { id: 'search' as const, label: 'Find Courses', icon: BookOpen },
    { id: 'roadmap' as const, label: 'Roadmap', icon: BookOpen },
  ];

  return (
    <div className="flex items-center justify-between gap-4 p-4 brutal-border bg-white shadow-brutal">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 font-bold brutal-border transition-all',
              activeTab === tab.id
                ? 'bg-brand-orange text-white shadow-none'
                : 'bg-white text-brand-black hover:bg-brand-paper'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onOpenChat}
          className="p-3 brutal-border bg-white hover:bg-brand-paper transition-colors"
          title="Chat with AI"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenSettings}
          className="p-3 brutal-border bg-white hover:bg-brand-paper transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
