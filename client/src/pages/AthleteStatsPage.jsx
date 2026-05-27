import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStatistics } from '../contexts/StatisticsContext';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UserContext';

const AthleteStatsPage = () => {
  const { fetchRawStatistics, loadingStats } = useStatistics();
  const { user } = useAuth();
  const { users } = useUsers(); 
  const { athleteId } = useParams();
  
  const [stats, setStats] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState(athleteId ? [athleteId] : []);

  const loadStats = async (userIdsToFetch) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const isTrainer = user.role === 'trainer' || user.role === 'admin';

    try {
      const data = await fetchRawStatistics(
        startDate.toISOString(),
        endDate.toISOString(),
        isTrainer, 
        userIdsToFetch.length > 0 ? userIdsToFetch : null
      );
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  useEffect(() => {
    loadStats(selectedUserIds);
  }, [selectedUserIds, fetchRawStatistics]);

  if (loadingStats && !stats) return <div className="p-10 text-center">טוען נתונים...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-black mb-6">סטטיסטיקה</h1>

      {(user.role === 'trainer' || user.role === 'admin') && (
        <div className="mb-6 p-4 bg-zinc-100 rounded-2xl">
          <label className="block text-xs font-bold text-zinc-500 mb-2">סינון מתאמנים:</label>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setSelectedUserIds([])}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${selectedUserIds.length === 0 ? 'bg-blue-600 text-white' : 'bg-white'}`}
            >
              כולם
            </button>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUserIds([u.id])}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${selectedUserIds.includes(u.id) ? 'bg-blue-600 text-white' : 'bg-white'}`}
              >
                {u.first_name} {u.second_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {stats?.data?.map((athleteData) => (
        <div key={athleteData.user_id} className="mb-12">
          <h2 className="text-xl font-black mb-4 text-zinc-800">
            {athleteData.first_name} {athleteData.second_name}
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm">
              <p className="text-zinc-500 text-sm">סה"כ אימונים</p>
              <h2 className="text-2xl font-black">{athleteData.stats.total_sessions}</h2>
            </div>
            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm">
              <p className="text-zinc-500 text-sm">דקות אימון</p>
              <h2 className="text-2xl font-black">{athleteData.stats.total_duration_minutes}</h2>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-right">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="p-4 text-xs font-bold text-zinc-500">תאריך</th>
                  <th className="p-4 text-xs font-bold text-zinc-500">תרגיל</th>
                  <th className="p-4 text-xs font-bold text-zinc-500">מדדים</th>
                </tr>
              </thead>
              <tbody>
                {athleteData.stats.logs.map((log) => (
                  <tr key={log.id} className="border-t border-zinc-100">
                    <td className="p-4 text-sm font-medium">{new Date(log.created_at).toLocaleDateString('he-IL')}</td>
                    <td className="p-4 text-sm font-bold">{log.exercise_name}</td>
                    <td className="p-4 text-sm">
                      {log.params.map((p) => (
                        <span key={p.id} className="mr-2 bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold">
                          {p.parameter_name}: {p.value} {p.parameter_unit}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AthleteStatsPage;