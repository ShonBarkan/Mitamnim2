import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { useUsers } from '../contexts/UserContext';
import TrainerSidebar from '../components/common/Users/TrainerSidebar';

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

  // Sort logs strictly by position to reflect exactly how the user ordered them
  const sortedLogs = useMemo(() => {
    if (!Array.isArray(session.logs)) return [];
    return [...session.logs].sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [session.logs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
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
          <button 
            onClick={onClose}
            className="p-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
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
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 text-white font-black text-xs">
                          {index + 1}
                        </span>
                        <h4 className="font-bold text-zinc-900 text-lg">{log.exercise_name}</h4>
                      </div>
                      {log.sets > 0 && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">
                          {log.sets} סטים
                        </span>
                      )}
                    </div>
                    
                    {/* Render execution parameters strictly associated with this log */}
                    {Array.isArray(log.params) && log.params.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {log.params.map(param => (
                          <div key={param.id} className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                            <span className="block text-[10px] uppercase font-black text-zinc-400 mb-1">
                              {param.parameter_name}
                            </span>
                            <span className="font-bold text-zinc-800">
                              {param.value} <span className="text-xs text-zinc-500">{param.parameter_unit}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 font-medium">לא תועדו פרמטרים לסט זה.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-zinc-500 font-medium py-8 bg-zinc-50 rounded-2xl">
                לא תועדו תרגילים באימון זה.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main Page Component ---
const WorkoutHistoryPage = () => {
  const authContext = useAuth() || {};
  const activeUser = authContext.currentUser || authContext.user;

  const { users, refreshUsers } = useUsers() || {};
  const { sessions, fetchMySessions, loading } = useSession();

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedSessionModal, setSelectedSessionModal] = useState(null);

  const isTrainer = activeUser?.role === 'trainer';

  // Initialize data
  useEffect(() => {
    if (isTrainer && typeof refreshUsers === 'function') {
      refreshUsers();
    }
    // Note: Assuming fetchMySessions fetches based on selectedUserId on the backend, 
    // or you pass selectedUserId to it if the backend supports querying specific users.
    fetchMySessions(selectedUserId); 
  }, [fetchMySessions, refreshUsers, isTrainer, selectedUserId]);

  useEffect(() => {
    if (activeUser?.id && !selectedUserId) {
      setSelectedUserId(activeUser.id);
    }
  }, [activeUser, selectedUserId]);

  if (!activeUser) {
    return (
      <div className="flex justify-center items-center h-screen" dir="rtl">
        <p className="text-zinc-500 font-bold animate-pulse">טוען פרופיל משתמש...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 font-sans" dir="rtl">
      {/* Sidebar for Trainers */}
      {isTrainer && (
        <TrainerSidebar
          title="המתאמנים שלי"
          activeUser={activeUser}
          users={users}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-zinc-900">היסטוריית אימונים</h1>
              <p className="text-zinc-500 font-medium mt-1">צפה בתיעוד אימוני העבר, עקוב אחר התקדמות.</p>
            </div>
            
            {/* Action button leading to Page 2 */}
            {activeUser.id === selectedUserId && (
              <button className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">
                התחל אימון חדש +
              </button>
            )}
          </header>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-40 bg-zinc-200 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionModal(session)}
                  className="flex flex-col text-right bg-white p-6 rounded-3xl border border-zinc-200 hover:border-zinc-900 hover:shadow-xl transition-all group"
                >
                  <h3 className="text-xl font-black text-zinc-900 group-hover:text-blue-600 transition-colors mb-2 truncate w-full">
                    {session.name}
                  </h3>
                  
                  <div className="space-y-1 mb-4">
                    <p className="text-sm font-bold text-zinc-500">{formatDate(session.started_at)}</p>
                    <p className="text-xs font-medium text-zinc-400">
                      {formatTime(session.started_at)} • {calculateDuration(session.started_at, session.finished_at)}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between w-full">
                    <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                      {Array.isArray(session.logs) ? session.logs.length : 0} תרגילים תועדו
                    </span>
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-50 text-zinc-900 font-black group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                      ←
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 bg-white border border-zinc-200 rounded-3xl border-dashed">
              <span className="text-4xl mb-4">📭</span>
              <h3 className="text-xl font-black text-zinc-800">אין אימונים מתועדים</h3>
              <p className="text-zinc-500 font-medium text-center max-w-sm mt-2">
                ברגע שיושלמו אימונים חדשים, הם יופיעו כאן כולל הסטטיסטיקות שלהם.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Render Modal conditionally */}
      {selectedSessionModal && (
        <SessionDetailsModal 
          session={selectedSessionModal} 
          onClose={() => setSelectedSessionModal(null)} 
        />
      )}
    </div>
  );
};

export default WorkoutHistoryPage;