
import React from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onNewChat, 
  onSelectSession, 
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[#1e1f20] transition-transform duration-300 ease-in-out transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 border-r border-gray-700 flex flex-col
      `}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={onNewChat}
              className="flex items-center gap-3 px-4 py-3 bg-[#282a2d] hover:bg-[#333537] rounded-full text-sm font-medium transition-colors flex-1"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              New chat
            </button>
            
            {/* Close Button - Only visible on mobile */}
            <button 
              onClick={onClose}
              className="ml-2 p-2 hover:bg-[#282a2d] rounded-full transition-colors md:hidden text-gray-400 hover:text-white"
              aria-label="Close sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent</p>
            {sessions.length === 0 ? (
              <p className="px-4 text-sm text-gray-500 italic">No recent chats</p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-colors text-left truncate
                    ${currentSessionId === session.id ? 'bg-[#333537] text-white' : 'hover:bg-[#282a2d] text-gray-300'}
                  `}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <span className="truncate">{session.title}</span>
                </button>
              ))
            )}
          </div>

          <div className="mt-auto pt-4 space-y-1 border-t border-gray-800">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#282a2d] rounded-full text-sm transition-colors text-gray-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
