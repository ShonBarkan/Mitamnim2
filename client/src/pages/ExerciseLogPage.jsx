import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExercise } from '../contexts/ExerciseContext';
import { useUsers } from '../contexts/UserContext';
import { useSession } from '../contexts/SessionContext';
import { useExerciseLog } from '../contexts/ExerciseLogContext';

import TrainerSidebar from '../components/common/users/TrainerSidebar';
import ExerciseLogForm from '../components/common/ExerciseLog/ExerciseLogForm';

import { Trash2, Clock, Save, X, Edit2, Activity } from 'lucide-react';

// --- Sub-Component: LogEntryRow ---
const LogEntryRow = ({ log, exercise, isEditing, onStartEdit, onSave, onCancel, onDelete, canModify }) => {
  const [editParams, setEditParams] = useState(() => 
    log.params ? log.params.reduce((acc, p) => ({ ...acc, [p.parameter_name]: p.value }), {}) : {}
  );
  
  const [editDate, setEditDate] = useState(() => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(new Date(log.created_at) - tzOffset).toISOString().slice(0, 16);
  });

  const { manualParams, virtualParams } = useMemo(() => {
    if (!exercise || !Array.isArray(exercise.parameters)) {
      return { manualParams: [], virtualParams: [] };
    }
    return {
      manualParams: exercise.parameters.filter(p => !p.is_virtual),
      virtualParams: exercise.parameters.filter(p => p.is_virtual)
    };
  }, [exercise]);

  const calculatedVirtuals = useMemo(() => {
    const results = {};
    if (!exercise?.parameters) return results;

    const getVal = (name) => editParams[name] || 0;
    const paramMap = new Map(exercise.parameters.map(p => [p.id, p]));

    virtualParams.forEach(vp => {
      const sourceValues = (vp.source_parameter_ids || []).map(id => {
        const source = paramMap.get(id);
        return source ? getVal(source.name) : 0;
      });

      const val1 = sourceValues[0] || 0;
      const val2 = sourceValues[1] || 0;

      switch (vp.calculation_type) {
        case 'multiply': results[vp.name] = (val1 * val2) * (vp.multiplier || 1); break;
        case 'conversion': results[vp.name] = val1 * (vp.multiplier || 1); break;
        case 'sum': results[vp.name] = (val1 + val2) * (vp.multiplier || 1); break;
        case 'subtract': results[vp.name] = (val1 - val2) * (vp.multiplier || 1); break;
        case 'divide': results[vp.name] = val2 !== 0 ? (val1 / val2) * (vp.multiplier || 1) : 0; break;
        default: results[vp.name] = 0;
      }
    });
    return results;
  }, [virtualParams, editParams, exercise]);

  const handleParamChange = (name, value) => {
    setEditParams(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSave = () => {
    const d = new Date(editDate);
    const formattedDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000).toISOString();

    const updatedParams = [
      ...manualParams.map(p => ({
        parameter_name: p.name,
        parameter_unit: p.unit,
        value: editParams[p.name] ?? 0
      })),
      ...virtualParams.map(vp => ({
        parameter_name: vp.name,
        parameter_unit: vp.unit,
        value: parseFloat(calculatedVirtuals[vp.name] || 0)
      }))
    ];
    
    onSave({ created_at: formattedDate, params: updatedParams });
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-4 shadow-sm w-full mb-2">
        <div className="flex gap-4 items-center">
            <input 
                type="datetime-local" 
                value={editDate} 
                onChange={(e) => setEditDate(e.target.value)}
                className="p-1.5 border border-blue-300 outline-none focus:ring-2 focus:ring-blue-500 rounded text-xs font-bold"
            />
            <span className="font-bold text-gray-900">{log.exercise_name}</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {manualParams.map(p => (
            <div key={p.id}>
              <label className="text-[10px] font-black uppercase text-gray-500">{p.name} ({p.unit})</label>
              <input 
                type="number"
                value={editParams[p.name] ?? ''}
                onChange={(e) => handleParamChange(p.name, e.target.value)}
                className="w-full p-2 border border-blue-200 rounded bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          {virtualParams.map(vp => (
             <div key={vp.id}>
               <label className="text-[10px] font-black uppercase text-blue-600">{vp.name} (Calculated)</label>
               <div className="w-full p-2 border border-blue-200 rounded bg-blue-100/50 text-gray-600 font-mono text-sm font-bold">
                  {calculatedVirtuals[vp.name] || '0'}
               </div>
             </div>
          ))}
        </div>
        
        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onCancel} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded font-bold transition-colors"><X size={14}/> Cancel</button>
          <button onClick={handleSave} className="flex items-center gap-1 text-xs text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded font-bold transition-colors"><Save size={14}/> Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col lg:flex-row justify-between lg:items-center py-3 border-b border-gray-100 last:border-0 gap-3">
      <div className="flex-1 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
        <div className="flex items-center gap-2 min-w-[150px]">
          <span className="font-bold text-sm text-gray-900">{log.exercise_name}</span>
        </div>
        
        {log.params && log.params.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
                {log.params.map((param, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-gray-50 border-gray-100">
                        <span className="text-[10px] uppercase font-black text-gray-400">
                            {param.parameter_name}:
                        </span>
                        <span className="font-bold text-gray-800 text-xs">
                            {param.value} <span className="text-[10px] font-normal text-gray-500">{param.parameter_unit}</span>
                        </span>
                    </div>
                ))}
            </div>
        )}
      </div>

      {canModify && (
        <div className="shrink-0 flex items-center gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onStartEdit} className="flex items-center gap-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1.5 rounded-md font-bold transition-colors"><Edit2 size={12}/> Edit</button>
            <button onClick={onDelete} className="flex items-center gap-1 text-[10px] bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1.5 rounded-md font-bold transition-colors"><Trash2 size={12}/> Delete</button>
        </div>
      )}
    </div>
  );
};


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

    // Group items by local date string
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

  // --- Session Handlers ---
  const handleDeleteSession = async (sessionId) => {
    if (window.confirm("Are you sure you want to delete this entire session and all its logs?")) {
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
      console.error("Failed to update session date");
    }
  };

  // --- Log Handlers ---
  const handleSaveLog = async (logId, updatedData) => {
    try {
      await updateLog(logId, updatedData);
      setEditingLogId(null);
      fetchSessions(effectiveUserId);
      fetchUserLogs(effectiveUserId);
    } catch (e) {
      console.error("Failed to save inline log edit");
    }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm("Are you sure you want to delete this log?")) {
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
    return <div className="flex justify-center items-center h-64" dir="rtl"><p className="text-gray-500 font-medium">Loading profile...</p></div>;
  }

  const renderContent = () => (
    <div className="max-w-6xl mx-auto pb-20">
      {!embedded && (
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Workout Log</h1>
          <p className="text-gray-500 mt-1">Continuous daily tracking</p>
        </header>
      )}

      {effectiveUserId && isSelf && (
        <ExerciseLogForm
          selectedUserId={effectiveUserId}
          canModifyLogs={canModifyLogs}
          editLogToLoad={null} 
          onEditComplete={() => {}}
        />
      )}

      <div className="mt-10">
        {(sessionsLoading || logsLoading) && !editingLogId ? (
            <div className="text-center py-10 text-gray-400 font-medium animate-pulse">Synchronizing feed...</div>
        ) : sortedGroupedFeed.length > 0 ? (
            <div className="space-y-10">
              {sortedGroupedFeed.map(([sortKey, group]) => (
                <div key={sortKey} className="relative">
                  
                  {/* Sticky Date Header */}
                  <h3 className="sticky top-0 z-10 bg-gray-50 text-blue-800 font-bold mb-4 border-b border-blue-200 pb-2">
                    {group.label}
                  </h3>
                  
                  <div className="space-y-4">
                    {group.items.map(item => {
                        
                        if (item.feedType === 'session_group') {
                            const isEditingDate = editingSessionDateId === item.id;
                            
                            return (
                                <div key={item.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                                    {/* Right Side Panel (Session Info) */}
                                    <div className="md:w-1/4 bg-gray-50 p-4 md:border-l border-gray-200 flex flex-col gap-2">
                                        <div className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 inline-block w-fit">
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
                                                    <button onClick={() => handleSaveSessionDate(item.id)} className="flex-1 flex justify-center items-center text-xs text-white bg-green-500 hover:bg-green-600 py-1.5 rounded font-bold"><Save size={12}/> Save</button>
                                                    <button onClick={() => setEditingSessionDateId(null)} className="flex-1 flex justify-center items-center text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 py-1.5 rounded font-bold"><X size={12}/> Cancel</button>
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
                                        <div className="text-xs font-bold text-gray-400 uppercase">
                                          {Array.isArray(item.logs) ? item.logs.length : 0} תרגילים
                                        </div>
                                        <div className="text-xs font-bold text-gray-400 uppercase">
                                          {item.note ? `${item.note}` : 'אין הערות על האימון'}
                                        </div>
                                        {canModifyLogs && (
                                            <div className="mt-auto pt-4">
                                                <button 
                                                    onClick={() => handleDeleteSession(item.id)}
                                                    className="w-full flex justify-center items-center gap-1.5 text-[10px] text-red-600 hover:bg-red-50 font-bold bg-white px-2 py-1.5 rounded-lg border border-red-100 transition-colors"
                                                >
                                                    <Trash2 size={12} /> למחוק אימון
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Left Side Panel (Compact Logs List) */}
                                    <div className="md:w-3/4 p-4">
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
                                                <p className="text-sm text-gray-400 font-bold">No exercises recorded inside this session.</p>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            );
                        }
                        
                        return (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row mb-4">
                                
                                {/* Right Side Panel (Matches Session Header layout) */}
                                <div className="md:w-1/4 bg-gray-50 p-4 md:border-l border-gray-200 flex gap-2">
                                    <div className="flex items-center gap-1.5 mt-1 text-sm font-bold text-gray-500">
                                        <Clock size={14} /> 
                                        <span>{formatTimeOnly(item.created_at)}</span>
                                    </div>
                                    
                                    {/* <div className="text-sm font-bold text-gray-600 bg-gray-200/50 px-3 py-1.5 rounded-md border border-gray-200 inline-block w-fit">
                                        <Activity size={14} className="inline mr-1 mb-0.5" /> תיעוד בודד
                                    </div> */}
                                    
                                </div>

                                {/* Left Side Panel (The Actual Log) */}
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
              ))}
            </div>
        ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">No records found in diary.</p>
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