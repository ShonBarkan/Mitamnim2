import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExercise } from '../contexts/ExerciseContext';
import { useUsers } from '../contexts/UserContext';
import TrainerSidebar from '../components/common/users/TrainerSidebar';
import ExerciseLogForm from '../components/common/ExerciseLog/ExerciseLogForm';
import LogDiaryHistory from '../components/ExerciseLogPage/LogDiaryHistory';

/**
 * ExerciseLogPage Component
 * Refactored to support standalone view or embedded view within LogDiaryPage.
 */
const ExerciseLogPage = ({ embedded = false, forcedUserId = null }) => {
  const authContext = useAuth() || {};
  const activeUser = authContext.currentUser || authContext.user;

  const { fetchExercises } = useExercise() || {};
  const { users, refreshUsers } = useUsers() || {};

  // If embedded, use forcedUserId; otherwise use current user's ID
  const effectiveUserId = forcedUserId || activeUser?.id;
  const [editLogToLoad, setEditLogToLoad] = useState(null);

  const isTrainer = activeUser?.role === 'trainer' || activeUser?.role === 'admin';
  const isSelf = activeUser?.id === effectiveUserId;
  
  // Trainers can modify logs for their trainees, users can modify their own
  const canModifyLogs = isTrainer || isSelf;
  const shouldShowForm = isSelf;

  useEffect(() => {
    if (typeof fetchExercises === 'function') fetchExercises();
    if (isTrainer && typeof refreshUsers === 'function') {
      refreshUsers();
    }
  }, [fetchExercises, refreshUsers, isTrainer]);

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

  // Content to render
  const renderContent = () => (
    <div className="max-w-4xl mx-auto">
      {!embedded && (
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">יומן אימונים</h1>
          <p className="text-gray-500 mt-1">תיעוד ומעקב אחר התקדמות</p>
        </header>
      )}

      {effectiveUserId && shouldShowForm && (
        <ExerciseLogForm
          selectedUserId={effectiveUserId}
          canModifyLogs={canModifyLogs}
          editLogToLoad={editLogToLoad}
          onEditComplete={handleEditComplete}
        />
      )}

      {effectiveUserId && (
        <LogDiaryHistory
          selectedUserId={effectiveUserId}
          canModifyLogs={canModifyLogs}
          onEditClick={handleEditClick}
        />
      )}
    </div>
  );

  // Return structure based on view mode
  if (embedded) {
    return <div className="w-full">{renderContent()}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50" dir="rtl">
      {isTrainer && (
        <TrainerSidebar
          activeUser={activeUser}
          users={users}
          selectedUserId={effectiveUserId}
          setSelectedUserId={() => {}} // In non-embedded mode, we might need a setter, here we use props
        />
      )}

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        {renderContent()}
      </main>
    </div>
  );
};

export default ExerciseLogPage;