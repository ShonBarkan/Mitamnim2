import React, { useState, useEffect } from 'react';
import { useStatistics } from '../../contexts/StatisticsContext';
import { useUsers } from '../../contexts/UserContext';
import FrontendLogger from '../../utils/logger';
import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

const DashboardLeaderboard = () => {
  const { dashboardStats, fetchDashboardStats, loadingStats } = useStatistics();
  const { users } = useUsers();
  
  const [period, setPeriod] = useState('week'); // Default to week
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    fetchDashboardStats(period);
  }, [period, fetchDashboardStats]);

  if (loadingStats && !dashboardStats) {
    return (
      <div className="bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white/70 shadow-2xl p-10 min-h-[400px] flex items-center justify-center">
        <span className="text-zinc-400 font-bold animate-pulse">טוען נתונים...</span>
      </div>
    );
  }

  if (!dashboardStats || !dashboardStats.stats || Object.keys(dashboardStats.stats).length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white/70 shadow-2xl p-10 min-h-[400px] flex flex-col justify-center items-center text-center">
        <h2 className="text-3xl font-black text-zinc-900">אין נתונים לתצוגה</h2>
        <p className="mt-4 text-sm text-zinc-500 max-w-xl">המאמן טרם הגדיר מדדים עבור הקבוצה, או שלא תועדו אימונים בתקופה זו.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white/70 shadow-2xl shadow-zinc-200/40 p-10 min-h-[400px] flex flex-col transition-all duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase text-zinc-900 m-0">לוח ביצועים קבוצתי</h2>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none font-mono mt-2">Team Statistics Board</p>
        </div>
        
        <div className="flex items-center gap-4 bg-zinc-100 p-2 rounded-2xl border border-zinc-200">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-zinc-700 outline-none cursor-pointer pr-4"
          >
            <option value="today">היום</option>
            <option value="week">השבוע</option>
            <option value="month">החודש</option>
          </select>
          
          <div className="w-px h-6 bg-zinc-300"></div>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl hover:bg-zinc-200 transition-colors text-zinc-600"
            title={isExpanded ? 'צמצם תצוגה' : 'הרחב תצוגה'}
          >
            {isExpanded ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(dashboardStats.stats).map(([displayName, data]) => {
          
          // Calculate Group Total based on Strategy
          const userValues = Object.values(data.user_data);
          let groupResult = 0;
          
          if (userValues.length > 0) {
              if (data.config.aggregation === 'SUM') groupResult = userValues.reduce((a, b) => a + b, 0);
              if (data.config.aggregation === 'MAX') groupResult = Math.max(...userValues);
              if (data.config.aggregation === 'AVG') groupResult = (userValues.reduce((a, b) => a + b, 0) / userValues.length).toFixed(1);
          }

          // Sort Users based on higher_better
          const sortedUsers = Object.entries(data.user_data).sort(([, valA], [, valB]) => {
              return data.config.higher_better ? valB - valA : valA - valB;
          });

          return (
            <div key={displayName} className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm flex flex-col relative overflow-hidden group">
              
              {/* Category Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-black text-zinc-800 leading-tight pr-1 border-r-4 border-blue-500">{displayName}</h3>
                    <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-wider">
                        אסטרטגיה: {data.config.aggregation} | {data.config.higher_better ? 'גבוה עדיף' : 'נמוך עדיף'}
                    </p>
                </div>
                <div className="text-right">
                    <span className="block text-3xl font-black text-blue-600 leading-none">{groupResult}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">סה"כ קבוצה</span>
                </div>
              </div>

              {/* Leaderboard List (Toggleable) */}
              {isExpanded && (
                <div className="flex-1 space-y-2 mt-4 pt-4 border-t border-zinc-50">
                  {sortedUsers.length === 0 ? (
                    <p className="text-sm text-zinc-400 text-center font-bold py-4">אין נתונים לתקופה זו</p>
                  ) : (
                    sortedUsers.map(([userId, val], index) => {
                      const userObj = users.find(u => u.id === userId);
                      const isPodium = index < 3;
                      return (
                        <div key={userId} className="flex justify-between items-center p-2 rounded-xl hover:bg-zinc-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${isPodium ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                                {index + 1}
                            </span>
                            <span className={`text-sm font-bold ${isPodium ? 'text-zinc-800' : 'text-zinc-500'}`}>
                                {userObj ? `${userObj.first_name} ${userObj.last_name}` : 'משתמש לא ידוע'}
                            </span>
                          </div>
                          <span className="font-black text-zinc-900">{val}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardLeaderboard;