
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import { Message, ChatSession } from './types';
import { streamMessageToGemini } from './services/geminiService';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, isTyping]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const startNewChat = useCallback(() => {
    const id = Date.now().toString();
    const newSession: ChatSession = {
      id,
      title: 'New Session',
      messages: [],
      createdAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(id);
  }, []);

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Fix: Explicitly check that result is a string before adding to state
        const result = reader.result;
        if (typeof result === 'string') {
          setAttachedImages(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && attachedImages.length === 0) || isTyping) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = Date.now().toString();
      const newSession: ChatSession = {
        id: sessionId,
        title: input.trim() || 'Visual Analysis',
        messages: [],
        createdAt: new Date(),
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
    }

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
      images: attachedImages.length > 0 ? [...attachedImages] : undefined,
    };

    const history = sessions.find(s => s.id === sessionId)?.messages || [];

    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, messages: [...s.messages, userMessage], title: s.messages.length === 0 ? (input.slice(0, 30) || 'Work') : s.title } : s
    ));

    setInput('');
    setAttachedImages([]);
    setIsTyping(true);

    try {
      const modelMessage: Message = {
        role: 'model',
        content: '',
        timestamp: new Date(),
      };

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, messages: [...s.messages, modelMessage] } : s
      ));

      let fullContent = '';
      const stream = streamMessageToGemini(userMessage.content, history, userMessage.images);
      
      for await (const chunk of stream) {
        fullContent += chunk;
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? {
            ...s,
            messages: s.messages.map((m, idx) => 
              idx === s.messages.length - 1 ? { ...m, content: fullContent } : m
            )
          } : s
        ));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const SuggestionCard = ({ text }: { text: string }) => (
    <button 
      onClick={() => setInput(text)}
      className="p-4 bg-[#1e1f20] hover:bg-[#282a2d] rounded-xl text-left border border-transparent hover:border-gray-700 transition-all flex flex-col justify-between h-40 w-44 shrink-0"
    >
      <span className="text-gray-300 text-sm leading-relaxed">{text}</span>
      <div className="bg-[#131314] p-2 rounded-full self-end">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      </div>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#131314] text-[#e3e3e3] overflow-hidden">
      <Sidebar 
        sessions={sessions} 
        currentSessionId={currentSessionId} 
        onNewChat={startNewChat} 
        onSelectSession={handleSelectSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col relative">
        <header className="p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-[#282a2d] rounded-full transition-colors md:hidden"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-gray-200">GEMINI UNFILTERED</span>
              <div className="bg-red-900/30 text-[10px] px-2 py-0.5 rounded border border-red-500/30 text-red-400">RAW MODE</div>
            </div>
          </div>
        </header>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-0 scrollbar-hide pb-32"
        >
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="max-w-4xl mx-auto mt-20 md:mt-32">
              <h1 className="text-4xl md:text-6xl font-medium mb-12">
                <span className="shimmer-text">Ready to work?</span>
                <br />
                <span className="text-gray-600">Quit wasting time and ask.</span>
              </h1>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                <SuggestionCard text="Fix my broken Python code" />
                <SuggestionCard text="Why is my business failing?" />
                <SuggestionCard text="Roast my landing page design" />
                <SuggestionCard text="Give me a brutal workout routine" />
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8 mt-4">
              {currentSession.messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-red-600 flex-shrink-0 flex items-center justify-center">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    </div>
                  )}
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-[#282a2d] px-5 py-3 rounded-3xl' : 'pt-1'}`}>
                    {msg.images && msg.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {msg.images.map((img, idx) => (
                          <img key={idx} src={img} className="max-w-[200px] max-h-[200px] rounded-lg border border-gray-700" alt="Uploaded" />
                        ))}
                      </div>
                    )}
                    <div className={`prose prose-invert max-w-none text-[15px] leading-relaxed whitespace-pre-wrap ${msg.role === 'model' ? 'text-gray-200' : 'text-white'}`}>
                      {msg.content || (isTyping && i === currentSession.messages.length - 1 ? 'Working...' : '')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-[#131314] bg-opacity-95 p-4 pb-8">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-[#1e1f20] rounded-3xl p-2 border border-gray-800 focus-within:border-gray-600 transition-all shadow-xl">
              
              {attachedImages.length > 0 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {attachedImages.map((img, i) => (
                    <div key={i} className="relative group shrink-0">
                      <img src={img} className="w-16 h-16 object-cover rounded-lg border border-gray-700" alt="Preview" />
                      <button 
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1 border border-gray-600"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 hover:bg-[#2d2e30] rounded-full text-gray-400 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path><polyline points="16 5 21 5 21 10"></polyline><line x1="9" y1="15" x2="21" y2="3"></line></svg>
                </button>
                
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Ask me something, if you dare."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-gray-200 placeholder-gray-500 resize-none py-3 px-1 scrollbar-hide max-h-40"
                  rows={1}
                />

                <div className="flex items-center gap-1 pr-2">
                  <button 
                    type="submit"
                    disabled={isTyping}
                    className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all disabled:opacity-50"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
                </div>
              </form>
            </div>
            <p className="text-center text-[10px] text-gray-500 mt-3 px-4">
              Gemini Unfiltered provides raw, blunt data. No feelings were harmed in the making of this response.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
