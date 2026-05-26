import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';

// --- Helper Functions ---
const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const calculateDuration = (start, end) => {
  if (!start || !end) return 'לא הושלם';
  const diffMs = new Date(end) - new Date(start);
  const diffMins = Math.round(diffMs / 60000);
  return `${diffMins} דקות`;
};

// --- Modal Component ---
const SessionDetailsModal = ({ session, onClose }) => {
  if (!session) return null;

  const sortedLogs = useMemo(() => {
    if (!Array.isArray(session.logs)) return [];
    return [...session.logs].sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [session.logs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50">
          <div>
            <h2 className="text-2xl font-black text-zinc-900">{session.name}</h2>
            <div className="flex gap-4 mt-2 text-sm font-bold text-zinc-500">
              <span>{formatDate(session.started_at)}</span>
              <span>•</span>
              <span>{formatTime(session.started_at)} - {formatTime(session.finished_at) || '?'}</span>
              <span>•</span>
              <span>{calculateDuration(session.started_at, session.finished_at)}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-full transition-colors">✕</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {session.note && (
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm font-medium border border-yellow-100">
              <span className="font-bold">הערת אימון:</span> {session.note}
            </div>
          )}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-zinc-800 tracking-wide uppercase">מהלך האימון</h3>
            {sortedLogs.length > 0 ? (
              <div className="space-y-4">
                {sortedLogs.map((log, index) => (
                  <div key={log.id} className="p-5 border border-zinc-200 rounded-2xl bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 text-white font-black text-xs">{index + 1}</span>
                        <h4 className="font-bold text-zinc-900 text-lg">{log.exercise_name}</h4>
                      </div>
                      {log.sets > 0 && <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">{log.sets} סטים</span>}
                    </div>
                    {Array.isArray(log.params) && log.params.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {log.params.map(param => (
                          <div key={param.id} className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                            <span className="block text-[10px] uppercase font-black text-zinc-400 mb-1">{param.parameter_name}</span>
                            <span className="font-bold text-zinc-800">{param.value} <span className="text-xs text-zinc-500">{param.parameter_unit}</span></span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-zinc-400 font-medium">לא תועדו פרמטרים לסט זה.</p>}
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-zinc-500 font-medium py-8 bg-zinc-50 rounded-2xl">לא תועדו תרגילים באימון זה.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main Page Component ---
const WorkoutHistoryPage = ({ embedded = false, forcedUserId = null }) => {
  const authContext = useAuth() || {};
  const activeUser = authContext.currentUser || authContext.user;

  const { sessions, fetchSessions, loading } = useSession();
  const [selectedSessionModal, setSelectedSessionModal] = useState(null);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); 
  
  const targetUserId = forcedUserId || activeUser?.id;

  useEffect(() => {
    if (targetUserId) {
        fetchSessions(targetUserId); 
    }
  }, [fetchSessions, targetUserId]);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    const now = new Date();
    return sessions
      .filter(session => {
        // Name Search
        const matchesName = session.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Date Filter
        const sessionDate = new Date(session.started_at);
        let matchesDate = true;
        if (dateFilter === 'today') matchesDate = sessionDate.toDateString() === now.toDateString();
        else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = sessionDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = sessionDate >= monthAgo;
        }
        
        return matchesName && matchesDate;
      })
      .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
  }, [sessions, searchTerm, dateFilter]);

  if (!activeUser) return null;

  const content = (
    <div className="space-y-6">
      {!embedded && (
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-zinc-900">היסטוריית אימונים</h1>
            <p className="text-zinc-500 font-medium mt-1">צפה בתיעוד אימוני העבר, עקוב אחר התקדמות.</p>
          </div>
        </header>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <input 
          type="text" 
          placeholder="חיפוש אימון..." 
          className="flex-1 p-3 rounded-xl border border-zinc-200 outline-none focus:border-zinc-900"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="p-3 rounded-xl border border-zinc-200 outline-none focus:border-zinc-900 bg-white"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="all">כל הזמנים</option>
          <option value="today">היום</option>
          <option value="week">השבוע האחרון</option>
          <option value="month">החודש האחרון</option>
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(n => <div key={n} className="h-20 bg-zinc-200 rounded-2xl"/>)}
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <div 
              key={session.id} 
              onClick={() => setSelectedSessionModal(session)}
              className="flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-900 transition-all cursor-pointer group"
            >
              <div className="flex flex-col items-center justify-center w-16 h-16 bg-zinc-100 rounded-xl">
                <span className="text-[10px] font-black text-zinc-500 uppercase">{formatDate(session.started_at).split(' ')[1]}</span>
                <span className="text-lg font-black">{new Date(session.started_at).getDate()}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">{session.name}</h3>
                <p className="text-xs text-zinc-400 font-medium">
                    {formatTime(session.started_at)} • {calculateDuration(session.started_at, session.finished_at)}
                </p>
              </div>
              <div className="text-xs font-black text-zinc-400 uppercase">{Array.isArray(session.logs) ? session.logs.length : 0} תרגילים</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-400 font-bold">לא נמצאו אימונים התואמים לחיפוש</div>
      )}

      {selectedSessionModal && (
        <SessionDetailsModal session={selectedSessionModal} onClose={() => setSelectedSessionModal(null)} />
      )}
    </div>
  );

  return embedded ? content : (
    <div className="flex h-screen bg-zinc-50 font-sans" dir="rtl">
        <main className="flex-1 overflow-y-auto p-6 md:p-10">{content}</main>
    </div>
  );
};

export default WorkoutHistoryPage;