import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UserContext';
import TrainerSidebar from '../components/common/users/TrainerSidebar';

// Importing existing pages to render them as embedded components
import ExerciseLogPage from './ExerciseLogPage'; 
import WorkoutHistoryPage from './WorkoutHistoryPage';

const LogDiaryPage = () => {
  const { user } = useAuth();
  const { users, refreshUsers } = useUsers() || {};
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'logs'; // Default tab
  
  // State for user selection
  const [selectedUserId, setSelectedUserId] = useState(user?.id || null);
  
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

  if (!user) return <div className="p-10 text-center font-bold text-zinc-500">טוען...</div>;

  return (
    <div className="flex h-screen bg-zinc-50" dir="rtl">
      {/* Sidebar - Visible only for trainers/admins */}
      {isTrainer && (
        <TrainerSidebar
          activeUser={user}
          users={users}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          
          {/* Header Section */}
          <header className="mb-8">
            <h1 className="text-3xl font-black text-zinc-900">יומן תיעודים</h1>
            
            {/* Tab Navigation Controls */}
            <div className="flex gap-2 mt-6 p-1 bg-zinc-200/50 rounded-2xl w-fit">
              <button 
                onClick={() => handleTabChange('logs')}
                className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                  activeTab === 'logs' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                יומן תרגילים
              </button>
              <button 
                onClick={() => handleTabChange('history')}
                className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                  activeTab === 'history' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                היסטוריית אימונים
              </button>
            </div>
          </header>

          {/* Render Active Component based on URL Tab and Selected User */}
          <div className="animate-in fade-in duration-300">
            {selectedUserId && (
              activeTab === 'logs' ? (
                <ExerciseLogPage 
                  embedded={true} 
                  forcedUserId={selectedUserId} 
                />
              ) : (
                <WorkoutHistoryPage 
                  embedded={true} 
                  forcedUserId={selectedUserId} 
                />
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LogDiaryPage;