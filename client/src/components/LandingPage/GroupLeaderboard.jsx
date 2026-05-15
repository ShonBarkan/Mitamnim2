import React, { useEffect, useState, useMemo } from 'react';
import { useStats } from '../../contexts/StatsContext';

/**
 * GroupLeaderboard Component - High-end analytical scoreboard for training groups.
 * Re-engineered to follow the Arctic Mirror visual guidelines and flat metric schemas.
 */
const GroupLeaderboard = () => {
  const { fetchGroupLeaderboard } = useStats();
  const [leaderboards, setLeaderboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');
  const [allOpen, setAllOpen] = useState(true);
  const [collapsedStates, setCollapsedStates] = useState({});

  /**
   * Generates localized ISO timestamp query boundaries based on selected range.
   */
  const dateQuery = useMemo(() => {
    const now = new Date();
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0); // Defaults to midnight for 'today' selection

    if (dateRange === 'week') {
      const dayOfWeek = now.getDay();
      start.setDate(now.getDate() - dayOfWeek);
    } else if (dateRange === 'month') {
      start.setDate(1);
    } else if (dateRange === 'all') {
      start.setFullYear(now.getFullYear() - 10);
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  }, [dateRange]);

  // Synchronize remote leaderboard stats whenever dateQuery boundaries shift
  useEffect(() => {
    const loadLeaderboards = async () => {
      setLoading(true);
      try {
        const data = await fetchGroupLeaderboard(dateQuery.start, dateQuery.end);
        setLeaderboards(data);
        
        const initialStates = {};
        data.forEach(board => {
          initialStates[`${board.exercise_id}-${board.parameter_name}`] = false;
        });
        setCollapsedStates(initialStates);
        setAllOpen(true);
      } catch (error) {
        console.error("Failed to load leaderboards:", error);
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboards();
  }, [dateQuery, fetchGroupLeaderboard]);

  /**
   * Bulk action toggle for collapsing or expanding all active card segments.
   */
  const toggleAll = () => {
    const newState = !allOpen;
    const updatedStates = {};
    leaderboards.forEach(board => {
      updatedStates[`${board.exercise_id}-${board.parameter_name}`] = !newState;
    });
    setCollapsedStates(updatedStates);
    setAllOpen(newState);
  };

  return (
    <div className="w-full space-y-10 font-sans" dir="rtl">
      
      {/* Top Controls Layout Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl">
        <div className="space-y-1 text-right">
          <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">לוח תוצאות קבוצתי</h2>
          <div className="flex items-center gap-3">
            <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider">
              {dateRange === 'today' && 'ביצועי היום'}
              {dateRange === 'week' && 'דירוג שבועי נוכחי'}
              {dateRange === 'month' && 'סיכום חודשי'}
              {dateRange === 'all' && 'שיאי כל הזמנים'}
            </p>
            <button 
              type="button"
              onClick={toggleAll}
              className="text-[9px] font-black text-blue-600 bg-blue-600/5 border border-blue-500/10 px-4 py-1.5 rounded-full hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest"
            >
              {allOpen ? 'סגור הכל' : 'פתח הכל'}
            </button>
          </div>
        </div>

        {/* Chronological Scope Selector Toggles */}
        <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 shadow-inner">
          {[
            { id: 'today', label: 'היום' },
            { id: 'week', label: 'שבוע' },
            { id: 'month', label: 'חודש' },
            { id: 'all', label: 'הכל' }
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setDateRange(btn.id)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap active:scale-95 ${
                dateRange === btn.id 
                  ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20' 
                  : 'text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Canvas Zone */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white/30 backdrop-blur-3xl rounded-[3rem] border border-white/60 shadow-xl">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-zinc-200 border-t-zinc-900 mb-4" />
          <p className="text-zinc-400 font-black tracking-[0.3em] uppercase text-[10px]">Synchronizing Matrix Stats...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
          {leaderboards.map((board) => {
            const boardId = `${board.exercise_id}-${board.parameter_name}`;
            return (
              <LeaderboardCard 
                key={boardId} 
                board={board} 
                isCollapsed={collapsedStates[boardId]}
                onToggle={() => setCollapsedStates(prev => ({ ...prev, [boardId]: !prev[boardId] }))}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * LeaderboardCard Component - Visualizes ranking metrics for an exercise.
 */
const LeaderboardCard = ({ board, isCollapsed, onToggle }) => {
  
  // Rank calculations compiled cleanly via structural memos
  const { entries, stats } = useMemo(() => {
    if (!board.entries) return { entries: [], stats: null };
    const activeParticipants = board.entries.filter(e => e.value > 0);
    const rankedParticipants = activeParticipants.map((entry, index) => ({
      ...entry,
      displayRank: index + 1
    }));
    const totalSum = activeParticipants.reduce((acc, curr) => acc + curr.value, 0);
    
    return {
      entries: [...rankedParticipants, ...board.entries.filter(e => e.value === 0)],
      stats: {
        totalSum: totalSum.toLocaleString(),
        activeCount: activeParticipants.length,
        totalCount: board.entries.length
      }
    };
  }, [board]);

  /**
   * Premium theme resolver for ranking medals.
   */
  const getRankStyles = (rank, isNotParticipated) => {
    if (isNotParticipated) return 'bg-zinc-100 text-zinc-300';
    switch (rank) {
      case 1: return 'bg-gradient-to-br from-amber-300 via-yellow-400 to-yellow-500 text-white shadow-lg shadow-yellow-500/20';
      case 2: return 'bg-gradient-to-br from-slate-200 via-zinc-300 to-zinc-400 text-white shadow-lg shadow-zinc-400/20';
      case 3: return 'bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white shadow-lg shadow-amber-700/20';
      default: return 'bg-zinc-900 text-white';
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-3xl border border-white/60 shadow-xl rounded-[3rem] flex flex-col transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] overflow-hidden group">
      
      {/* Header Panel Wrapper */}
      <div 
        className="p-8 cursor-pointer flex items-center justify-between relative bg-gradient-to-b from-white/40 to-transparent"
        onClick={onToggle}
      >
        <div className="w-10 hidden md:block" />

        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-4">
          <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase transition-colors group-hover:text-blue-600">
            {board.exercise_name}
          </h3>
          <div className="bg-white/80 border border-white backdrop-blur-sm px-4 py-1 rounded-xl shadow-sm">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">
              {board.parameter_name}
            </p>
          </div>
        </div>

        <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
          isCollapsed 
            ? 'bg-white/60 text-zinc-400 border-white/80 rotate-180' 
            : 'bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-900/20'
        }`}>
          <span className="text-[10px] font-black">▼</span>
        </div>
      </div>

      {/* Aggregate Group Metrics Card Block */}
      <div className="px-8 py-6 bg-white/30 backdrop-blur-md flex justify-center items-center gap-10 border-y border-white/60 relative">
        <div className="text-center space-y-1">
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em]">מצטבר קבוצתי</p>
          <p className="text-3xl font-black text-zinc-900 tracking-tight leading-none flex items-baseline justify-center">
            {stats?.totalSum} 
            <span className="text-[10px] font-black text-blue-500 mr-2 uppercase tracking-widest">{board.unit}</span>
          </p>
        </div>
        
        <div className="h-10 w-px bg-white/80" />
        
        <div className="text-center space-y-1">
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em]">פעילים</p>
          <div className="flex items-center justify-center leading-none tracking-tight">
            <span className="text-3xl font-black text-zinc-900">{stats?.activeCount}</span>
            <span className="text-xl font-bold text-zinc-300 mx-2">/</span>
            <span className="text-xl font-black text-zinc-400">{stats?.totalCount}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Drawer List Segment */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'}`}>
        <div className="p-6 overflow-y-auto max-h-[400px] scrollbar-hide bg-white/10 space-y-2">
          <table className="w-full text-right border-separate border-spacing-y-2">
            <tbody>
              {entries.map((entry) => {
                const isNotParticipated = entry.value === 0;
                return (
                  <tr 
                    key={entry.full_name} 
                    className={`transition-all duration-300 ${isNotParticipated ? 'opacity-30' : 'bg-white/80 border border-white rounded-2xl shadow-sm hover:shadow-md'}`}
                  >
                    {/* Rank Number Badge */}
                    <td className="p-3 w-16 rounded-r-2xl border-y border-r border-transparent">
                      <div className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-xs transition-all duration-500 ${getRankStyles(entry.displayRank, isNotParticipated)}`}>
                        {isNotParticipated ? '-' : entry.displayRank}
                      </div>
                    </td>

                    {/* Athlete Profile Full Identity Name */}
                    <td className="p-3 border-y border-transparent">
                      <p className="font-black text-zinc-900 text-base tracking-tight">
                        {entry.full_name}
                      </p>
                    </td>

                    {/* Metric Execution Value */}
                    <td className="p-3 text-left rounded-l-2xl border-y border-l border-transparent">
                      {isNotParticipated ? (
                        <span className="text-[9px] text-zinc-300 font-black uppercase tracking-tight italic">No Entry</span>
                      ) : (
                        <div className="flex flex-col items-start leading-none gap-0.5">
                          <span className="text-lg font-black text-zinc-900 tracking-tight">{entry.value}</span>
                          <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none">{board.unit}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default GroupLeaderboard;