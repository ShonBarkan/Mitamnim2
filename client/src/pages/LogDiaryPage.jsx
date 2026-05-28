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
          </header>

          {/* Render Active Component based on URL Tab and Selected User */}
          <div className="animate-in fade-in duration-300">
            {selectedUserId && (
                <ExerciseLogPage 
                  embedded={true} 
                  forcedUserId={selectedUserId} 
                />
              )
            }
          </div>
        </div>
      </main>
    </div>
  );
};

export default LogDiaryPage;