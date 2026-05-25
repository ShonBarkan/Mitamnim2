import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExercise } from '../contexts/ExerciseContext';
import { useUsers } from '../contexts/UserContext';
import TrainerSidebar from '../components/ExerciseLogPage/TrainerSidebar';
import ExerciseLogForm from '../components/common/ExerciseLog/ExerciseLogForm';
import LogDiaryHistory from '../components/ExerciseLogPage/LogDiaryHistory';

const ExerciseLogPage = () => {
  const authContext = useAuth() || {};
  const activeUser = authContext.currentUser || authContext.user;

  const { fetchExercises } = useExercise() || {};
  const { users, refreshUsers } = useUsers() || {};

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editLogToLoad, setEditLogToLoad] = useState(null);

  // Determine permissions: Only own profile can modify logs
  const canModifyLogs = activeUser?.id === selectedUserId;

  // Initialize data on mount
  useEffect(() => {
    if (typeof fetchExercises === 'function') fetchExercises();
    if (activeUser?.role === 'trainer' && typeof refreshUsers === 'function') {
      refreshUsers();
    }
  }, [fetchExercises, refreshUsers, activeUser]);

  // Set default user once auth is ready
  useEffect(() => {
    if (activeUser?.id && !selectedUserId) {
      setSelectedUserId(activeUser.id);
    }
  }, [activeUser, selectedUserId]);

  const handleEditClick = useCallback((log) => {
    setEditLogToLoad(log);
  }, []);

  const handleEditComplete = useCallback(() => {
    setEditLogToLoad(null);
  }, []);

  if (!activeUser) {
    return (
      <div className="flex justify-center items-center h-64" dir="rtl">
        <p className="text-gray-500 font-medium">טוען פרופיל משתמש...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50" dir="rtl">
      {/* Sidebar for Trainers to manage view */}
      {activeUser.role === 'trainer' && (
        <TrainerSidebar
          activeUser={activeUser}
          users={users}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">יומן אימונים</h1>
            <p className="text-gray-500 mt-1">תיעוד ומעקב אחר התקדמות</p>
          </header>

          {/* Log Creation/Edit Form - Only visible if editing own logs */}
          {selectedUserId && (
            <ExerciseLogForm
              selectedUserId={selectedUserId}
              canModifyLogs={canModifyLogs}
              editLogToLoad={editLogToLoad}
              onEditComplete={handleEditComplete}
            />
          )}

          {/* Historical Logs Diary */}
          {selectedUserId && (
            <LogDiaryHistory
              selectedUserId={selectedUserId}
              canModifyLogs={canModifyLogs}
              onEditClick={handleEditClick}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ExerciseLogPage;