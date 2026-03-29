import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, Map, Sparkles, ArrowRight, ExternalLink, Loader2, ChevronRight, MessageSquare, X, GraduationCap, Globe, Zap, Send, User, Bot, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from './lib/utils';
import { searchCourses, generateRoadmap, getChatResponse, type Course, type Roadmap, type AISettings } from './services/ai';

export default function App() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'roadmap'>('search');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem('edu-flow-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return {
      primaryProvider: 'gemini',
      geminiKey: '',
      mistralKey: '',
      tavilyKey: '',
      serperKey: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('edu-flow-settings', JSON.stringify(aiSettings));
  }, [aiSettings]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setRoadmap(null);
    setError(null);
    try {
      const results = await searchCourses(query, aiSettings);
      setCourses(results);
      setActiveTab('search');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const result = await generateRoadmap(query, aiSettings);
      setRoadmap(result);
      setActiveTab('roadmap');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    const newMessages = [...chatMessages, { role: 'user' as const, text: userMsg }];
    setChatMessages(newMessages);
    setIsChatLoading(true);
    setError(null);

    try {
      const response = await getChatResponse(userMsg, newMessages, aiSettings);
      const aiText = typeof response === 'string' ? response : "I'm sorry, I couldn't process that.";
      setChatMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'ai', text: `Error: ${err.message || "Could not connect to AI."}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-paper text-brand-black font-sans antialiased">
      {/* Header */}
      <header className="border-b border-brand-black bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-orange flex items-center justify-center brutal-border">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif italic text-2xl font-bold tracking-tight">EduFlow AI</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setActiveTab('search')}
              className={cn(
                "text-sm font-medium uppercase tracking-widest transition-colors",
                activeTab === 'search' ? "text-brand-orange underline underline-offset-8" : "opacity-50 hover:opacity-100"
              )}
            >
              Search
            </button>
            <button 
              onClick={() => setActiveTab('roadmap')}
              className={cn(
                "text-sm font-medium uppercase tracking-widest transition-colors",
                activeTab === 'roadmap' ? "text-brand-orange underline underline-offset-8" : "opacity-50 hover:opacity-100"
              )}
            >
              Roadmaps
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-brand-paper transition-colors rounded-full"
              title="Settings"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsChatOpen(true)}
              className="brutal-btn flex items-center gap-2 text-sm font-bold uppercase"
            >
              <MessageSquare className="w-4 h-4" />
              Assistant
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <div className="text-6xl md:text-8xl font-serif font-black leading-none mb-6">
            LEARN <span className="text-brand-orange italic">ANYTHING</span> <br />
            FROM <span className="underline decoration-brand-orange decoration-4">EVERYWHERE</span>
          </div>
          <p className="text-xl text-brand-black/60 max-w-2xl mx-auto mb-8">
            The ultimate AI-powered search for free educational resources. 
            Find courses or generate custom roadmaps instantly.
          </p>

          <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative group">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to learn today?"
              className="w-full h-20 pl-6 pr-40 text-xl brutal-border focus:outline-none focus:ring-0 transition-all group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            />
            <div className="absolute right-3 top-3 bottom-3 flex gap-2">
              <button 
                type="submit"
                disabled={isSearching}
                className="h-full bg-brand-black text-white px-6 font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-brand-orange transition-colors disabled:opacity-50"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                Search
              </button>
            </div>
          </form>
        </section>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border-2 border-red-600 text-red-600 font-bold brutal-border">
            <p className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </p>
            <p className="text-sm mt-2 opacity-80">
              Tip: If you're on Vercel, make sure you've added GEMINI_API_KEY, MISTRAL_API_KEY, TAVILY_API_KEY, or SERPER_API_KEY to your Environment Variables.
            </p>
          </div>
        )}

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
              {activeTab === 'search' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-8 border-b border-brand-black pb-4">
                    <h2 className="font-serif italic text-3xl">Top Free Courses</h2>
                    {courses.length > 0 && (
                      <button 
                        onClick={handleGenerateRoadmap}
                        className="text-sm font-bold uppercase flex items-center gap-2 text-brand-orange hover:underline"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate Roadmap Instead
                      </button>
                    )}
                  </div>

                  {courses.length === 0 && !isSearching && (
                    <div className="py-20 text-center border-2 border-dashed border-brand-black/20 rounded-xl">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-brand-black/40 font-medium">Search for a topic to see available courses</p>
                    </div>
                  )}

                  {isSearching && (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-white brutal-border animate-pulse" />
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6">
                    {courses.map((course, idx) => (
                      <div 
                        key={idx}
                        className="bg-white brutal-border p-6 group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-orange mb-1 block">
                              {course.provider}
                            </span>
                            <h3 className="text-2xl font-bold leading-tight group-hover:text-brand-orange transition-colors">
                              {course.title}
                            </h3>
                          </div>
                          {course.isFree && (
                            <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded uppercase">
                              Free
                            </span>
                          )}
                        </div>
                        <p className="text-brand-black/70 mb-6 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs font-medium text-brand-black/50">
                            {course.rating && (
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-brand-orange" />
                                {course.rating}
                              </span>
                            )}
                            <button 
                              onClick={() => setSelectedCourse(course)}
                              className="hover:text-brand-orange underline underline-offset-2"
                            >
                              Details
                            </button>
                          </div>
                          <a 
                            href={course.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 font-bold text-sm uppercase group-hover:translate-x-1 transition-transform"
                          >
                            Go to Course <ArrowRight className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-8 border-b border-brand-black pb-4">
                    <h2 className="font-serif italic text-3xl">Learning Roadmap</h2>
                    <button 
                      onClick={() => setActiveTab('search')}
                      className="text-sm font-bold uppercase flex items-center gap-2 text-brand-orange hover:underline"
                    >
                      <Search className="w-4 h-4" />
                      Back to Search
                    </button>
                  </div>

                  {!roadmap && !isSearching && (
                    <div className="py-20 text-center border-2 border-dashed border-brand-black/20 rounded-xl">
                      <Map className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-brand-black/40 font-medium">Generate a roadmap to see the learning path</p>
                      <button 
                        onClick={handleGenerateRoadmap}
                        className="mt-4 brutal-btn uppercase text-sm font-bold"
                      >
                        Generate Now
                      </button>
                    </div>
                  )}

                  {isSearching && (
                    <div className="space-y-8">
                      <div className="h-20 bg-white brutal-border animate-pulse" />
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-32 bg-white brutal-border animate-pulse" />
                        ))}
                      </div>
                    </div>
                  )}

                  {roadmap && (
                    <div className="space-y-12">
                      <div className="bg-brand-orange text-white p-8 brutal-border">
                        <h3 className="text-4xl font-serif font-black uppercase mb-4">{roadmap.title}</h3>
                        <p className="text-white/90 leading-relaxed">{roadmap.overview}</p>
                      </div>

                      <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-[2px] before:bg-brand-black">
                        {roadmap.steps.map((step, idx) => (
                          <div 
                            key={idx}
                            className="relative"
                          >
                            <div className="absolute -left-[33px] top-1 w-6 h-6 rounded-full bg-white border-2 border-brand-black flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </div>
                            <div className="bg-white brutal-border p-6">
                              <h4 className="text-xl font-bold mb-2 uppercase tracking-tight">{step.title}</h4>
                              <p className="text-brand-black/70 mb-4 text-sm">{step.description}</p>
                              
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Resources:</span>
                                <div className="flex flex-wrap gap-2">
                                  {step.resources.map((res, ridx) => (
                                    <a 
                                      key={ridx}
                                      href={res.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs font-bold bg-brand-paper px-3 py-1 border border-brand-black hover:bg-brand-orange hover:text-white transition-colors"
                                    >
                                      {res.name} <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Sidebar / Stats */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="bg-white brutal-border p-6">
              <h3 className="font-serif italic text-2xl mb-4">Why EduFlow?</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-green-600" />
                  </div>
                  <p className="text-sm font-medium">Real-time search across the entire web for free courses.</p>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium">AI-generated structured roadmaps for any complex topic.</p>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                    <Globe className="w-3 h-3 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium">Aggregated resources from YouTube, MIT, Coursera, and more.</p>
                </li>
              </ul>
            </div>

            <div className="bg-brand-black text-white p-6 brutal-border">
              <h3 className="font-serif italic text-2xl mb-4">Popular Topics</h3>
              <div className="flex flex-wrap gap-2">
                {['Python', 'UI Design', 'Quantum Physics', 'Marketing', 'Cooking', 'History', 'React', 'AI Ethics'].map(topic => (
                  <button 
                    key={topic}
                    onClick={() => {
                      setQuery(topic);
                      handleSearch();
                    }}
                    className="px-3 py-1 border border-white/20 text-xs font-bold uppercase hover:bg-white hover:text-brand-black transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Chat Assistant Drawer */}
        {isChatOpen && (
          <>
            <div 
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-brand-black/60 backdrop-blur-sm z-50"
            />
            <div 
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-brand-paper border-l-2 border-brand-black z-50 flex flex-col shadow-[-10px_0px_30px_rgba(0,0,0,0.2)]"
            >
              <div className="p-6 border-b border-brand-black flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-orange" />
                  <h3 className="font-serif italic text-xl">Learning Assistant</h3>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-brand-paper transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12 opacity-40">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4" />
                    <p>Ask me anything about your learning journey!</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={msg.role === 'user' ? "flex flex-col items-end" : "flex flex-col items-start"}>
                    <div className={cn(
                      "max-w-[85%] p-4 brutal-border",
                      msg.role === 'user' ? "bg-brand-orange text-white" : "bg-white"
                    )}>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-sm">
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-center gap-2 text-brand-black/40 italic text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assistant is thinking...
                  </div>
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="p-6 border-t border-brand-black bg-white">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 px-4 py-2 border-2 border-brand-black focus:outline-none focus:ring-0"
                  />
                  <button 
                    type="submit"
                    disabled={isChatLoading}
                    className="bg-brand-black text-white px-4 py-2 font-bold uppercase disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

      {/* Course Details Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm"
            onClick={() => setSelectedCourse(null)}
          />
          <div className="relative w-full max-w-2xl bg-white brutal-border p-8 overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setSelectedCourse(null)}
              className="absolute right-4 top-4 p-2 hover:bg-brand-paper transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="mb-6">
              <span className="text-xs uppercase font-bold tracking-widest text-brand-orange mb-2 block">
                {selectedCourse.provider}
              </span>
              <h2 className="text-4xl font-serif font-black uppercase leading-none mb-4">
                {selectedCourse.title}
              </h2>
              <div className="flex flex-wrap gap-4">
                {selectedCourse.isFree && (
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                    Free Course
                  </span>
                )}
                {selectedCourse.rating && (
                  <span className="bg-brand-paper text-brand-black text-xs font-bold px-3 py-1 border border-brand-black rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-brand-orange" />
                    {selectedCourse.rating}
                  </span>
                )}
              </div>
            </div>

            <div className="prose prose-brand max-w-none mb-8">
              <h4 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-2">Description</h4>
              <p className="text-lg leading-relaxed text-brand-black/80">
                {selectedCourse.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href={selectedCourse.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-brand-orange text-white text-center py-4 font-bold uppercase tracking-widest hover:bg-brand-black transition-colors brutal-border shadow-none hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Start Learning Now
              </a>
              <button 
                onClick={() => setSelectedCourse(null)}
                className="flex-1 border-2 border-brand-black py-4 font-bold uppercase tracking-widest hover:bg-brand-paper transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white brutal-border p-8 overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute right-4 top-4 p-2 hover:bg-brand-paper transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-3xl font-serif font-black uppercase mb-6">AI Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2 block">Primary Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setAiSettings(prev => ({ ...prev, primaryProvider: 'gemini' }))}
                    className={cn(
                      "py-2 font-bold uppercase text-sm border-2 border-brand-black transition-all",
                      aiSettings.primaryProvider === 'gemini' ? "bg-brand-orange text-white" : "bg-white hover:bg-brand-paper"
                    )}
                  >
                    Gemini
                  </button>
                  <button 
                    onClick={() => setAiSettings(prev => ({ ...prev, primaryProvider: 'mistral' }))}
                    className={cn(
                      "py-2 font-bold uppercase text-sm border-2 border-brand-black transition-all",
                      aiSettings.primaryProvider === 'mistral' ? "bg-brand-orange text-white" : "bg-white hover:bg-brand-paper"
                    )}
                  >
                    Mistral
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1 block">Gemini API Key</label>
                  <input 
                    type="password"
                    value={aiSettings.geminiKey}
                    onChange={(e) => setAiSettings(prev => ({ ...prev, geminiKey: e.target.value }))}
                    placeholder="Enter Gemini Key"
                    className="w-full px-4 py-2 border-2 border-brand-black focus:outline-none"
                  />
                  <p className="text-[10px] mt-1 opacity-60 italic">Leave empty to use environment default</p>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1 block">Mistral API Key</label>
                  <input 
                    type="password"
                    value={aiSettings.mistralKey}
                    onChange={(e) => setAiSettings(prev => ({ ...prev, mistralKey: e.target.value }))}
                    placeholder="Enter Mistral Key"
                    className="w-full px-4 py-2 border-2 border-brand-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1 block">Tavily API Key</label>
                  <input 
                    type="password"
                    value={aiSettings.tavilyKey}
                    onChange={(e) => setAiSettings(prev => ({ ...prev, tavilyKey: e.target.value }))}
                    placeholder="Enter Tavily Key"
                    className="w-full px-4 py-2 border-2 border-brand-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1 block">Serper API Key</label>
                  <input 
                    type="password"
                    value={aiSettings.serperKey}
                    onChange={(e) => setAiSettings(prev => ({ ...prev, serperKey: e.target.value }))}
                    placeholder="Enter Serper Key"
                    className="w-full px-4 py-2 border-2 border-brand-black focus:outline-none"
                  />
                </div>
              </div>

              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full bg-brand-black text-white py-3 font-bold uppercase hover:bg-brand-orange transition-colors"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-brand-black py-12 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-orange flex items-center justify-center brutal-border">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-serif italic text-xl font-bold">EduFlow AI</span>
          </div>
          <p className="text-sm text-brand-black/40">
            &copy; 2026 EduFlow AI. Powered by Google Gemini.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-brand-orange transition-colors">Privacy</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-brand-orange transition-colors">Terms</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-brand-orange transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
