import React, { useState } from 'react';
import { Trash2, Clock, Save, X, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import LogEntryRow from './LogEntryRow';
import CustomDateTimePicker from '../common/CustomDateTimePicker'; 

// Format helper specific to this component
const formatTimeOnly = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
};

const SessionGroup = ({
  item,
  exercises,
  canModifyLogs,
  isSessionCollapsed,
  toggleSession,
  editingLogId,
  setEditingLogId,
  handleSaveLog,
  handleDeleteLog,
  handleDeleteSession,
  handleSaveSessionDate
}) => {
  // Local state for editing the session date
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newSessionDate, setNewSessionDate] = useState("");

  const startEditingDate = () => {
    if (!canModifyLogs) return;
    setIsEditingDate(true);
    // Initialize with the current session start time
    setNewSessionDate(item.started_at);
  };

  const saveDate = () => {
    handleSaveSessionDate(item.id, newSessionDate);
    setIsEditingDate(false);
  };

  const cancelEditingDate = () => {
    setIsEditingDate(false);
    setNewSessionDate("");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      <div className="md:w-1/4 bg-gray-50 p-4 md:border-l border-gray-200 flex flex-col gap-3 relative group">
        
        {/* Collapse toggle button */}
        <button 
          onClick={() => toggleSession(item.id)}
          className="absolute top-4 left-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
          title="Toggle Session"
        >
          {isSessionCollapsed ? <ChevronDown size={18}/> : <ChevronUp size={18}/>}
        </button>

        {/* Session Name */}
        <div className="pr-1 pl-10">
          <div className="text-sm font-bold text-blue-800 bg-blue-100/50 px-3 py-2 rounded-lg border border-blue-200/50 break-words leading-snug">
            {item.name}
          </div>
        </div>
        
        {/* Time display or Edit input */}
        {isEditingDate ? (
          <div className="flex flex-col gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm mt-1">
            
            <CustomDateTimePicker 
              initialDate={newSessionDate}
              onChange={(formattedDateTime) => setNewSessionDate(formattedDateTime)}
            />

            <div className="flex gap-2 w-full mt-1">
              <button onClick={saveDate} className="flex-1 flex justify-center items-center gap-1 text-xs text-white bg-green-500 hover:bg-green-600 py-1.5 rounded font-bold transition-colors">
                <Save size={12}/> שמור
              </button>
              <button onClick={cancelEditingDate} className="flex-1 flex justify-center items-center gap-1 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 py-1.5 rounded font-bold transition-colors">
                <X size={12}/> בטל
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500 px-1">
            <Clock size={14} className="text-gray-400" /> 
            <span>{formatTimeOnly(item.started_at)}</span>
          </div>
        )}
        
        {/* Session Stats and Notes */}
        <div className="text-xs font-semibold text-gray-400 px-1 mt-1">
          {Array.isArray(item.logs) ? item.logs.length : 0} תרגילים
        </div>
        
        {item.note && (
          <div className="text-xs text-gray-500 italic px-1 bg-white/50 p-2 rounded border border-gray-100 mt-1">
            {item.note}
          </div>
        )}

        {/* Actions bar */}
        {canModifyLogs && !isEditingDate && (
          <div className="mt-auto pt-4 flex items-center justify-start gap-3 opacity-80 hover:opacity-100 transition-opacity">
            <button 
              onClick={startEditingDate}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded-md transition-all"
            >
              <Edit2 size={14} /> 
              <span>ערוך זמנים</span>
            </button>
            
            <button 
              onClick={() => handleDeleteSession(item.id)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-md transition-all"
            >
              <Trash2 size={14} /> 
              <span>מחק אימון</span>
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
          <div className="h-full flex items-center justify-center py-8">
            <p className="text-sm text-gray-400 font-bold bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
              לא תועדו תרגילים באימון זה.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionGroup;