import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UserContext';
import TrainerSidebar from '../components/common/users/TrainerSidebar';

// Importing existing pages to render them as embedded components
import ExerciseLogPage from './ExerciseLogPage'; 

const LogDiaryPage = () => {
  const { user } = useAuth();
  const { users, refreshUsers } = useUsers() || {};
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState(user?.id || null);
  
  // State to control mobile sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  // Sync users list if user is a trainer
  useEffect(() => {
    if (isTrainer && typeof refreshUsers === 'function') {
      refreshUsers();
    }
  }, [refreshUsers, isTrainer]);

  // Update URL params when changing tabs
  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  // Intercept user selection to close the sidebar on mobile devices
  const handleUserSelection = (id) => {
    setSelectedUserId(id);
    setIsSidebarOpen(false);
  };

  if (!user) return <div className="p-10 text-center font-bold text-zinc-500">טוען...</div>;

  return (
    <div className="flex h-[100dvh] bg-zinc-50 overflow-hidden" dir="rtl">
      
      {/* Mobile Sidebar Overlay */}
      {isTrainer && isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container - Drawer on Mobile, Static on Desktop */}
      {isTrainer && (
        <aside className={`
          fixed md:static inset-y-0 right-0 z-50 
          w-[280px] md:w-72 lg:w-80 shrink-0 
          border-l border-zinc-200 shadow-2xl md:shadow-none
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          {/* Mobile close button inside the drawer */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-100 shrink-0">
            <span className="font-black text-zinc-900 text-sm tracking-widest uppercase">בחר מתאמן</span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors text-zinc-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <TrainerSidebar
              activeUser={user}
              users={users}
              selectedUserId={selectedUserId}
              setSelectedUserId={handleUserSelection}
            />
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full">
        {/* Adjusted padding: smaller on mobile (p-3/4), larger on desktop (p-8/10) */}
        <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-8 lg:p-10 min-h-full flex flex-col">
          
          {/* Header Section */}
          <header className="mb-4 md:mb-8 shrink-0 flex items-center justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">יומן תיעודים</h1>
            
            {/* Mobile Toggle Button for Trainer Sidebar */}
            {isTrainer && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 shadow-sm active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                מתאמנים
              </button>
            )}
          </header>

          {/* Render Active Component based on URL Tab and Selected User */}
          <div className="flex-1 animate-in fade-in duration-300">
            {selectedUserId ? (
              <ExerciseLogPage 
                embedded={true} 
                forcedUserId={selectedUserId}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400 font-bold text-sm bg-white/50 rounded-3xl border border-zinc-200/50 p-10 text-center">
                אנא בחר מתאמן מהרשימה כדי לצפות ביומן התיעודים
              </div>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default LogDiaryPage;