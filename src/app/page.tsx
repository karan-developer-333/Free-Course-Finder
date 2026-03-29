'use client';

import { useState } from 'react';
import { TabNav } from '@/components/features/tab-nav';
import { SearchBar } from '@/components/features/search-bar';
import { CourseCard } from '@/components/features/course-card';
import { RoadmapView } from '@/components/features/roadmap-view';
import { ChatDrawer } from '@/components/features/chat-drawer';
import { SettingsModal } from '@/components/features/settings-modal';
import { PopularTopics } from '@/components/features/popular-topics';
import { LoadingSpinner } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useCourseSearch, useRoadmap } from '@/hooks/use-search';
import { useChat } from '@/hooks/use-chat';
import { useAISettings } from '@/providers/ai-settings';
import { Course } from '@/types';
import { GraduationCap, Sparkles } from 'lucide-react';

export default function Home() {
  const { settings, updateSettings } = useAISettings();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'roadmap'>('search');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const { courses, isLoading: isSearching, search, error: searchError } = useCourseSearch();
  const { roadmap, isLoading: isGenerating, generate, error: roadmapError } = useRoadmap();
  const { messages, sendMessage, isLoading: isChatLoading } = useChat();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      search(query.trim());
    }
  };

  const handleTopicSelect = (topic: string) => {
    setQuery(topic);
    search(topic);
    setActiveTab('search');
  };

  const handleGenerateRoadmap = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      generate(query.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-black text-white py-4 sm:py-6 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-brand-orange" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Free Course Finder</h1>
              <p className="text-xs sm:text-sm text-white/60 font-mono">
                AI-powered learning resource discovery
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-3 sm:p-4 space-y-3 sm:space-y-4">
        <TabNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenChat={() => setIsChatOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <div className="brutal-border bg-white shadow-brutal p-4 sm:p-6">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={activeTab === 'search' ? handleSearch : handleGenerateRoadmap}
            isLoading={isSearching || isGenerating}
            placeholder={
              activeTab === 'search'
                ? 'Search for free courses...'
                : 'Enter a topic for your learning roadmap...'
            }
          />
          {activeTab === 'roadmap' && query.trim() && !roadmap && !isGenerating && (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleGenerateRoadmap} disabled={isGenerating}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Roadmap
              </Button>
            </div>
          )}
        </div>

        <PopularTopics
          onSelect={handleTopicSelect}
          disabled={isSearching || isGenerating}
        />

        {activeTab === 'search' && (
          <div className="space-y-4">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-brand-gray">Searching for courses...</p>
              </div>
            )}

            {searchError && (
              <div className="brutal-border border-red-500 bg-red-50 p-4">
                <p className="text-red-600">{searchError}</p>
              </div>
            )}

            {!isSearching && courses.length > 0 && (
              <>
                <p className="font-bold text-lg">
                  Found {courses.length} free courses
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {courses.map((course, index) => (
                    <CourseCard
                      key={`${course.url}-${index}`}
                      course={course}
                      onClick={() => setSelectedCourse(course)}
                    />
                  ))}
                </div>
              </>
            )}

            {!isSearching && courses.length === 0 && !searchError && (
              <div className="text-center py-12 text-brand-gray">
                <p>Search for courses to see results here.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'roadmap' && (
          <RoadmapView
            roadmap={roadmap}
            isLoading={isGenerating}
            error={roadmapError || undefined}
          />
        )}
      </main>

      <footer className="border-t-2 border-brand-black bg-white py-4 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-brand-gray">
          <p>Find free courses from Coursera, edX, MIT OpenCourseWare, YouTube, and more.</p>
        </div>
      </footer>

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={sendMessage}
        isLoading={isChatLoading}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
      />

      {selectedCourse && (
        <Modal
          isOpen={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
          title={selectedCourse.title}
        >
          <div className="space-y-4">
            <div>
              <p className="font-bold text-brand-gray uppercase text-xs tracking-wide mb-1">
                Provider
              </p>
              <p className="text-lg">{selectedCourse.provider}</p>
            </div>
            <div>
              <p className="font-bold text-brand-gray uppercase text-xs tracking-wide mb-1">
                Description
              </p>
              <p>{selectedCourse.description}</p>
            </div>
            {selectedCourse.rating && (
              <div>
                <p className="font-bold text-brand-gray uppercase text-xs tracking-wide mb-1">
                  Rating
                </p>
                <p>{selectedCourse.rating}</p>
              </div>
            )}
            {selectedCourse.duration && (
              <div>
                <p className="font-bold text-brand-gray uppercase text-xs tracking-wide mb-1">
                  Duration
                </p>
                <p>{selectedCourse.duration}</p>
              </div>
            )}
            {selectedCourse.level && (
              <div>
                <p className="font-bold text-brand-gray uppercase text-xs tracking-wide mb-1">
                  Level
                </p>
                <p>{selectedCourse.level}</p>
              </div>
            )}
            <a
              href={selectedCourse.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center brutal-btn mt-6"
            >
              Visit Course
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
