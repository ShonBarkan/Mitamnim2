import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExercise } from '../contexts/ExerciseContext';
import { useUsers } from '../contexts/UserContext';
import { useSession } from '../contexts/SessionContext';
import { useExerciseLog } from '../contexts/ExerciseLogContext';

import TrainerSidebar from '../components/common/users/TrainerSidebar';
import ExerciseLogForm from '../components/common/ExerciseLog/ExerciseLogForm';
import DateGroup from '../components/ExerciseLogPage/DateGroup';

import { ChevronDown, ChevronUp } from 'lucide-react';

// --- Main Component: ExerciseLogPage ---
const ExerciseLogPage = ({ embedded = false, forcedUserId = null }) => {
  const authContext = useAuth() || {};
  const activeUser = authContext.currentUser || authContext.user;

  const { exercises, fetchExercises } = useExercise() || {};
  const { users, refreshUsers } = useUsers() || {};
  
  const { sessions, fetchSessions, updateSession, removeSession, loading: sessionsLoading } = useSession();
  const { logs, fetchUserLogs, updateLog, removeLog, loading: logsLoading } = useExerciseLog() || {};

  const effectiveUserId = forcedUserId || activeUser?.id;

  const [editingLogId, setEditingLogId] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  // States for collapsable UI
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState({});
  const [collapsedSessions, setCollapsedSessions] = useState({});
  const [isAllCollapsed, setIsAllCollapsed] = useState(false);

  const isTrainer = activeUser?.role === 'trainer' || activeUser?.role === 'admin';
  const isSelf = activeUser?.id === effectiveUserId;
  const canModifyLogs = isTrainer || isSelf;

  useEffect(() => {
    if (typeof fetchExercises === 'function') fetchExercises();
    if (isTrainer && typeof refreshUsers === 'function') refreshUsers();
  }, [fetchExercises, refreshUsers, isTrainer]);

  useEffect(() => {
    if (effectiveUserId) {
        fetchSessions(effectiveUserId);
        if (typeof fetchUserLogs === 'function') fetchUserLogs(effectiveUserId);
    }
  }, [fetchSessions, fetchUserLogs, effectiveUserId]);

  const sortedGroupedFeed = useMemo(() => {
    const standaloneLogs = (logs || [])
        .filter(log => !log.session_id)
        .map(log => ({ ...log, feedType: 'standalone_log', sortDate: new Date(log.created_at).getTime() }));

    const sessionItems = (sessions || []).map(session => ({
        ...session, feedType: 'session_group', sortDate: new Date(session.started_at).getTime()
    }));

    const allItems = [...standaloneLogs, ...sessionItems].sort((a, b) => b.sortDate - a.sortDate);

    const groups = {};
    allItems.forEach((item) => {
      const dateObj = new Date(item.sortDate);
      const sortKey = dateObj.toISOString().split('T')[0];
      const dateLabel = dateObj.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      if (!groups[sortKey]) groups[sortKey] = { label: dateLabel, items: [] };
      groups[sortKey].items.push(item);
    });

    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [logs, sessions]);

  const filteredGroupedFeed = useMemo(() => {
    if (!searchFilter.trim()) return sortedGroupedFeed;

    const lowerSearchTerm = searchFilter.toLowerCase();

    return sortedGroupedFeed
      .map(([sortKey, group]) => {
        const filteredItems = group.items.map(item => {
          if (item.feedType === 'session_group' && item.logs && Array.isArray(item.logs)) {
            const matchingLogs = item.logs.filter(log => log.exercise_name.toLowerCase().includes(lowerSearchTerm));
            if (matchingLogs.length > 0) return { ...item, logs: matchingLogs };
            if (item.name.toLowerCase().includes(lowerSearchTerm)) return item; 
            return null;
          }

          if (item.feedType === 'standalone_log') {
            if (item.exercise_name.toLowerCase().includes(lowerSearchTerm)) return item;
            if (group.label.toLowerCase().includes(lowerSearchTerm)) return item;
          }
          return null;
        }).filter(item => item !== null);

        if (filteredItems.length > 0 || group.label.toLowerCase().includes(lowerSearchTerm)) {
          return [sortKey, { ...group, items: filteredItems }];
        }
        return null;
      })
      .filter(group => group !== null);
  }, [sortedGroupedFeed, searchFilter]);

  // Toggle Handlers
  const toggleDateGroup = (sortKey) => {
    setCollapsedDates(prev => ({ ...prev, [sortKey]: !prev[sortKey] }));
  };

  const toggleSession = (sessionId) => {
    setCollapsedSessions(prev => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  // Expand/Collapse All handler
  const toggleCollapseAll = () => {
    const targetState = !isAllCollapsed;
    setIsAllCollapsed(targetState);

    const newCollapsedDates = {};
    const newCollapsedSessions = {};

    sortedGroupedFeed.forEach(([sortKey, group]) => {
      newCollapsedDates[sortKey] = targetState; 
      
      group.items.forEach(item => {
        if (item.feedType === 'session_group') {
          newCollapsedSessions[item.id] = !targetState; 
        }
      });
    });

    setCollapsedDates(newCollapsedDates);
    setCollapsedSessions(newCollapsedSessions);
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק אימון זה ואת כל התרגילים שבו?")) {
      await removeSession(sessionId);
    }
  };

  const handleSaveSessionDate = async (sessionId, newDateString) => {
    if (!newDateString) return;
    try {
      const d = new Date(newDateString);
      const formattedDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000).toISOString();
      await updateSession(sessionId, { started_at: formattedDate });
    } catch (e) {
      console.error("Error updating session date", e);
    }
  };

  const handleSaveLog = async (logId, updatedData) => {
    try {
      await updateLog(logId, updatedData);
      setEditingLogId(null);
      fetchSessions(effectiveUserId);
      fetchUserLogs(effectiveUserId);
    } catch (e) {
      console.error("Error updating log", e);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק תיעוד זה?")) {
      await removeLog(logId);
      fetchSessions(effectiveUserId);
      fetchUserLogs(effectiveUserId);
    }
  };

  if (!activeUser) {
    return <div className="flex justify-center items-center h-64" dir="rtl"><p className="text-gray-500 font-medium">טוען נתונים...</p></div>;
  }

  const renderContent = () => (
    <div className="max-w-6xl mx-auto pb-20">
      {!embedded && (
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">יומן תיעודים</h1>
          <p className="text-gray-500 mt-1">מעקב יומי שוטף</p>
        </header>
      )}

      {effectiveUserId && isSelf && (
        <div className="mb-6">
          <div 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-colors mb-2"
          >
            <span className="font-black text-zinc-800 text-lg">תיעוד אימון חדש</span>
            <button 
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${isFormOpen ? 'bg-zinc-100 text-zinc-600' : 'bg-blue-600 text-white'}`}
            >
              {isFormOpen ? 'הסתר' : 'הצג'}
            </button>
          </div>
          
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isFormOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <ExerciseLogForm
              selectedUserId={effectiveUserId}
              canModifyLogs={canModifyLogs}
              editLogToLoad={null} 
              onEditComplete={() => {}}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3 mt-2 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="חיפוש לפי תאריך, שם אימון או שם תרגיל..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-zinc-200/40 rounded-2xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/30 transition-all shadow-sm pr-10"
          />
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-300">🔍</span>
        </div>
        
        <button
          onClick={toggleCollapseAll}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm whitespace-nowrap"
        >
          {isAllCollapsed ? (
            <><ChevronDown size={18} /> הרחב הכל</>
          ) : (
            <><ChevronUp size={18} /> כווץ הכל</>
          )}
        </button>
      </div>

      <div className="mt-8">
        {(sessionsLoading || logsLoading) && !editingLogId ? (
            <div className="text-center py-10 text-gray-400 font-medium animate-pulse">מסנכרן נתונים...</div>
        ) : filteredGroupedFeed.length > 0 ? (
            <div className="space-y-10">
              {filteredGroupedFeed.map(([sortKey, group]) => (
                <DateGroup
                  key={sortKey}
                  sortKey={sortKey}
                  group={group}
                  isDateCollapsed={collapsedDates[sortKey]}
                  toggleDateGroup={toggleDateGroup}
                  collapsedSessions={collapsedSessions}
                  toggleSession={toggleSession}
                  exercises={exercises}
                  canModifyLogs={canModifyLogs}
                  editingLogId={editingLogId}
                  setEditingLogId={setEditingLogId}
                  handleSaveLog={handleSaveLog}
                  handleDeleteLog={handleDeleteLog}
                  handleDeleteSession={handleDeleteSession}
                  handleSaveSessionDate={handleSaveSessionDate}
                />
              ))}
            </div>
        ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">
                  {searchFilter.trim() ? 'לא נמצאו רישומים התואמים לחיפוש.' : 'לא נמצאו רישומים ביומן.'}
                </p>
            </div>
        )}
      </div>
    </div>
  );

  if (embedded) return <div className="w-full">{renderContent()}</div>;

  return (
    <div className="flex h-screen bg-gray-50" dir="rtl">
      {isTrainer && (
        <TrainerSidebar
          activeUser={activeUser}
          users={users}
          selectedUserId={effectiveUserId}
          setSelectedUserId={() => {}}
        />
      )}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        {renderContent()}
      </main>
    </div>
  );
};

export default ExerciseLogPage;