import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExercise } from '../contexts/ExerciseContext';
import { useUsers } from '../contexts/UserContext';
import { useSession } from '../contexts/SessionContext';
import { useExerciseLog } from '../contexts/ExerciseLogContext';

import TrainerSidebar from '../components/common/users/TrainerSidebar';
import ExerciseLogForm from '../components/common/ExerciseLog/ExerciseLogForm';
import LogEntryRow from '../components/ExerciseLogPage/LogEntryRow';

import { Trash2, Clock, Save, X, Edit2, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [editingSessionDateId, setEditingSessionDateId] = useState(null);
  const [newSessionDate, setNewSessionDate] = useState("");
  const [searchFilter, setSearchFilter] = useState('');

  // States for collapsable UI
  const [isFormOpen, setIsFormOpen] = useState(() => window.innerWidth >= 768);
  const [collapsedDates, setCollapsedDates] = useState({});
  const [collapsedSessions, setCollapsedSessions] = useState({});

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
        setIsFormOpen(window.innerWidth >= 768);
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

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק אימון זה ואת כל התרגילים שבו?")) {
      await removeSession(sessionId);
    }
  };

  const handleSaveSessionDate = async (sessionId) => {
    if (!newSessionDate) return;
    try {
      const d = new Date(newSessionDate);
      const formattedDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000).toISOString();
      await updateSession(sessionId, { started_at: formattedDate });
      setEditingSessionDateId(null);
    } catch (e) {
      console.error("שגיאה בעדכון תאריך האימון");
    }
  };

  const handleSaveLog = async (logId, updatedData) => {
    try {
      await updateLog(logId, updatedData);
      setEditingLogId(null);
      fetchSessions(effectiveUserId);
      fetchUserLogs(effectiveUserId);
    } catch (e) {
      console.error("שגיאה בעדכון התיעוד");
    }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק תיעוד זה?")) {
      await removeLog(logId);
      fetchSessions(effectiveUserId);
      fetchUserLogs(effectiveUserId);
    }
  };

  const formatTimeOnly = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
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

      <div className="relative mt-2 mb-6">
        <input
          type="text"
          placeholder="חיפוש לפי תאריך, שם אימון או שם תרגיל..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-zinc-200/40 rounded-2xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/30 transition-all shadow-sm"
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-300">🔍</span>
      </div>

      <div className="mt-8">
        {(sessionsLoading || logsLoading) && !editingLogId ? (
            <div className="text-center py-10 text-gray-400 font-medium animate-pulse">מסנכרן נתונים...</div>
        ) : filteredGroupedFeed.length > 0 ? (
            <div className="space-y-10">
              {filteredGroupedFeed.map(([sortKey, group]) => {
                const isDateCollapsed = collapsedDates[sortKey];

                return (
                  <div key={sortKey} className="relative">
                    
                    <div 
                      onClick={() => toggleDateGroup(sortKey)}
                      className="sticky top-0 z-10 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors mb-4 border-b border-blue-200 pb-2"
                    >
                      <h3 className="text-blue-800 font-bold">
                        {group.label}
                      </h3>
                      <button className="text-xs text-blue-600 flex items-center gap-1 font-bold">
                        {isDateCollapsed ? <><ChevronDown size={14}/> הצג נתונים</> : <><ChevronUp size={14}/> הסתר נתונים</>}
                      </button>
                    </div>
                    
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isDateCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'}`}>
                      <div className="space-y-4">
                        {group.items.map(item => {
                            
                            if (item.feedType === 'session_group') {
                                const isEditingDate = editingSessionDateId === item.id;
                                const isSessionCollapsed = collapsedSessions[item.id];
                                
                                return (
                                    <div key={item.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                                        <div className="md:w-1/4 bg-gray-50 p-4 md:border-l border-gray-200 flex flex-col gap-2 relative">
                                            
                                            {/* Button to collapse this specific session */}
                                            <button 
                                                onClick={() => toggleSession(item.id)}
                                                className="absolute top-4 left-4 p-1.5 bg-gray-200 hover:bg-gray-300 rounded text-gray-600 transition-colors"
                                            >
                                                {isSessionCollapsed ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
                                            </button>

                                            <div className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 inline-block w-fit max-w-[80%] truncate">
                                                {item.name}
                                            </div>
                                            
                                            {isEditingDate ? (
                                                <div className="flex flex-col gap-2 mt-2">
                                                    <input 
                                                        type="datetime-local" 
                                                        className="text-xs p-1.5 border border-gray-300 rounded w-full outline-none focus:border-blue-500"
                                                        value={newSessionDate}
                                                        onChange={(e) => setNewSessionDate(e.target.value)}
                                                    />
                                                    <div className="flex gap-2 w-full">
                                                        <button onClick={() => handleSaveSessionDate(item.id)} className="flex-1 flex justify-center items-center text-xs text-white bg-green-500 hover:bg-green-600 py-1.5 rounded font-bold"><Save size={12}/> שמור</button>
                                                        <button onClick={() => setEditingSessionDateId(null)} className="flex-1 flex justify-center items-center text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 py-1.5 rounded font-bold"><X size={12}/> בטל</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div 
                                                    className={`flex items-center gap-1.5 mt-1 text-sm font-bold text-gray-500 ${canModifyLogs ? 'cursor-pointer hover:text-blue-600' : ''}`}
                                                    onClick={() => {
                                                        if(canModifyLogs) {
                                                            setEditingSessionDateId(item.id);
                                                            const tzOffset = (new Date()).getTimezoneOffset() * 60000;
                                                            const localISOTime = new Date(new Date(item.started_at) - tzOffset).toISOString().slice(0, -1);
                                                            setNewSessionDate(localISOTime.substring(0, 16));
                                                        }
                                                    }}
                                                >
                                                    <Clock size={14} /> 
                                                    <span>{formatTimeOnly(item.started_at)} {item.finished_at ? `- ${formatTimeOnly(item.finished_at)}` : ''}</span>
                                                    {canModifyLogs && <Edit2 size={10} className="opacity-50 ml-1" />}
                                                </div>
                                            )}
                                            
                                            <div className="text-xs font-bold text-gray-400">
                                              {Array.isArray(item.logs) ? item.logs.length : 0} תרגילים
                                            </div>
                                            
                                            <div className="text-xs font-bold text-gray-400">
                                              {item.note ? `${item.note}` : 'אין הערות לאימון זה'}
                                            </div>

                                            {canModifyLogs && (
                                                <div className="mt-auto pt-4">
                                                    <button 
                                                        onClick={() => handleDeleteSession(item.id)}
                                                        className="w-full flex justify-center items-center gap-1.5 text-[10px] text-red-600 hover:bg-red-50 font-bold bg-white px-2 py-1.5 rounded-lg border border-red-100 transition-colors"
                                                    >
                                                        <Trash2 size={12} /> מחיקת אימון
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className={`md:w-3/4 p-4 transition-all duration-500 ease-in-out overflow-y-auto ${isSessionCollapsed ? 'max-h-[200px]' : 'max-h-[5000px]'}`}>
                                            {item.logs && item.logs.length > 0 ? (
                                                <div className="flex flex-col">
                                                    {[...item.logs]
                                                        .sort((a, b) => (a.position || 0) - (b.position || 0))
                                                        .map(log => (
                                                            <LogEntryRow
                                                              key={log.id}
                                                              log={log}
                                                              exercise={exercises?.find(ex => ex.id === log.exercise_id)}
                                                              isEditing={editingLogId === log.id}
                                                              onStartEdit={() => setEditingLogId(log.id)}
                                                              onSave={(data) => handleSaveLog(log.id, data)}
                                                              onCancel={() => setEditingLogId(null)}
                                                              onDelete={() => handleDeleteLog(log.id)}
                                                              canModify={canModifyLogs}
                                                            />
                                                        ))}
                                                </div>
                                            ) : (
                                                <div className="h-full flex items-center justify-center">
                                                    <p className="text-sm text-gray-400 font-bold">לא תועדו תרגילים באימון זה.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                            
                            return (
                                <div key={item.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row mb-4">
                                    <div className="md:w-1/4 bg-gray-50 p-4 md:border-l border-gray-200 flex gap-2">
                                        <div className="flex items-center gap-1.5 mt-1 text-sm font-bold text-gray-500">
                                            <Clock size={14} /> 
                                            <span>{formatTimeOnly(item.created_at)}</span>
                                        </div>
                                    </div>
                                    <div className="md:w-3/4 p-4">
                                        <LogEntryRow
                                          log={item}
                                          exercise={exercises?.find(ex => ex.id === item.exercise_id)}
                                          isEditing={editingLogId === item.id}
                                          onStartEdit={() => setEditingLogId(item.id)}
                                          onSave={(data) => handleSaveLog(item.id, data)}
                                          onCancel={() => setEditingLogId(null)}
                                          onDelete={() => handleDeleteLog(item.id)}
                                          canModify={canModifyLogs}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
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