import React from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import SessionGroup from './SessionGroup';
import LogEntryRow from './LogEntryRow';

// Format helper specific to this component
const formatTimeOnly = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
};

const DateGroup = ({
  sortKey,
  group,
  isDateCollapsed,
  toggleDateGroup,
  collapsedSessions,
  toggleSession,
  exercises,
  canModifyLogs,
  editingLogId,
  setEditingLogId,
  handleSaveLog,
  handleDeleteLog,
  handleDeleteSession,
  handleSaveSessionDate
}) => {
  return (
    <div className="relative">
      {/* Date Header */}
      <div 
        onClick={() => toggleDateGroup(sortKey)}
        className="sticky top-0 z-10 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors mb-4 border-b border-blue-200 pb-2 px-2 rounded-t-lg"
      >
        <h3 className="text-blue-800 font-bold">
          {group.label}
        </h3>
        <button className="text-xs text-blue-600 flex items-center gap-1 font-bold">
          {isDateCollapsed ? (
            <><ChevronDown size={14}/> הצג נתונים</>
          ) : (
            <><ChevronUp size={14}/> הסתר נתונים</>
          )}
        </button>
      </div>
      
      {/* Date Content (Sessions and Standalone Logs) */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isDateCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'}`}>
        <div className="space-y-4">
          {group.items.map(item => {
            
            // Session Group rendering
            if (item.feedType === 'session_group') {
              return (
                <SessionGroup
                  key={item.id}
                  item={item}
                  exercises={exercises}
                  canModifyLogs={canModifyLogs}
                  isSessionCollapsed={!collapsedSessions[item.id]}
                  toggleSession={toggleSession}
                  editingLogId={editingLogId}
                  setEditingLogId={setEditingLogId}
                  handleSaveLog={handleSaveLog}
                  handleDeleteLog={handleDeleteLog}
                  handleDeleteSession={handleDeleteSession}
                  handleSaveSessionDate={handleSaveSessionDate}
                />
              );
            }
            
            // Standalone log entry rendering
            return (
              <div key={item.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row mb-4">
                <div className="md:w-1/4 bg-gray-50 p-4 md:border-l border-gray-200 flex flex-col gap-3">
                  
                  {/* Subtle indicator for standalone exercise */}
                  <div className="text-sm font-bold text-gray-600 bg-gray-200/50 px-3 py-1.5 rounded-md border border-gray-200/50 inline-block w-fit">
                    תרגיל בודד
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500 px-1 mt-1">
                    <Clock size={14} className="text-gray-400" /> 
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
};

export default DateGroup;