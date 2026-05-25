import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExercise } from '../contexts/ExerciseContext';
import { useUsers } from '../contexts/UserContext';
import TrainerSidebar from '../components/common/users/TrainerSidebar';
import ExerciseLogForm from '../components/common/ExerciseLog/ExerciseLogForm';
import LogDiaryHistory from '../components/ExerciseLogPage/LogDiaryHistory';

const ExerciseLogPage = () => {
  const authContext = useAuth() || {};
  const activeUser = authContext.currentUser || authContext.user;

  const { fetchExercises } = useExercise() || {};
  const { users, refreshUsers } = useUsers() || {};

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editLogToLoad, setEditLogToLoad] = useState(null);

  const isTrainer = activeUser?.role === 'trainer';
  const isSelf = activeUser?.id === selectedUserId;
  
  const canModifyLogs = isSelf;

  const shouldShowForm = isSelf;

  useEffect(() => {
    if (typeof fetchExercises === 'function') fetchExercises();
    if (isTrainer && typeof refreshUsers === 'function') {
      refreshUsers();
    }
  }, [fetchExercises, refreshUsers, isTrainer]);

  useEffect(() => {
    if (activeUser?.id && !selectedUserId) {
      setSelectedUserId(activeUser.id);
    }
  }, [activeUser, selectedUserId]);

  const handleEditClick = useCallback((log) => {
    if (canModifyLogs) {
      setEditLogToLoad(log);
    }
  }, [canModifyLogs]);

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
      {isTrainer && (
        <TrainerSidebar
          activeUser={activeUser}
          users={users}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
        />
      )}

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">יומן אימונים</h1>
            <p className="text-gray-500 mt-1">תיעוד ומעקב אחר התקדמות</p>
          </header>

          {selectedUserId && shouldShowForm && (
            <ExerciseLogForm
              selectedUserId={selectedUserId}
              canModifyLogs={canModifyLogs}
              editLogToLoad={editLogToLoad}
              onEditComplete={handleEditComplete}
            />
          )}

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