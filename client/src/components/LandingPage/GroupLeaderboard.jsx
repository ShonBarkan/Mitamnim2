import React, { useEffect, useState, useMemo } from 'react';
import { useStats } from '../../contexts/StatsContext';
import FrontendLogger from '../../utils/logger';

/**
 * GroupLeaderboard Component - High-end analytical scoreboard for training groups.
 * Fully integrated with the Arctic Mirror layout and flat panoramic metric schemas.
 */
const GroupLeaderboard = () => {
  const { fetchGroupPanoramicStats } = useStats();
  const [leaderboards, setLeaderboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');
  const [allOpen, setAllOpen] = useState(true);
  const [collapsedStates, setCollapsedStates] = useState({});

  /**
   * Generates localized ISO timestamp query boundaries based on selected range for the current year (2026).
   */
  const dateQuery = useMemo(() => {
    const now = new Date();
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (dateRange === 'today') {
      // Keep start at today 00:00:00
    } else if (dateRange === 'week') {
      const dayOfWeek = now.getDay();
      start.setDate(now.getDate() - dayOfWeek);
    } else if (dateRange === 'month') {
      start.setDate(1);
    } else if (dateRange === 'all') {
      start.setFullYear(now.getFullYear() - 5);
    }
    
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }, [dateRange]);

  // Synchronize remote leaderboard stats whenever dateQuery boundaries shift
  useEffect(() => {
    const loadLeaderboards = async () => {
      setLoading(true);
      FrontendLogger.info('LEADERBOARD_COMP', 'Querying group flat panoramic stats layer framework', { dateRange, ...dateQuery });
      try {
        const data = await fetchGroupPanoramicStats(dateQuery.start, dateQuery.end);
        
        // Target the correct inner array parameter matching your FastAPI service schema structure
        const unifiedData = data && Array.isArray(data.collective_exercises) ? data.collective_exercises : [];
        setLeaderboards(unifiedData);
        
        const initialStates = {};
        unifiedData.forEach(board => {
          initialStates[`${board.exercise_id}-${board.parameter_name}`] = false;
        });
        setCollapsedStates(initialStates);
        setAllOpen(true);
      } catch (error) {
        FrontendLogger.error('LEADERBOARD_COMP', 'Failed to synchronize live group scoreboard matrices', error);
        setLeaderboards([]);
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboards();
  }, [dateQuery, dateRange, fetchGroupPanoramicStats]);

  /**
   * Bulk action toggle for collapsing or expanding all active card segments.
   */
  const toggleAll = () => {
    if (!Array.isArray(leaderboards)) return;
    const newState = !allOpen;
    FrontendLogger.info('LEADERBOARD_COMP', `Executing bulk visibility toggle layout sequence. Target state: ${newState ? 'Expand' : 'Collapse'}`);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl select-none">
        <div className="space-y-1 text-right">
          <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none m-0">לוח תוצאות קבוצתי</h2>
          <div className="flex items-center gap-3">
            <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider m-0 mt-1">
              {dateRange === 'today' && 'ביצועי היום'}
              {dateRange === 'week' && 'דירוג שבועי נוכחי'}
              {dateRange === 'month' && 'סיכום חודשי'}
              {dateRange === 'all' && 'שיאי כל הזמנים'}
            </p>
            {Array.isArray(leaderboards) && leaderboards.length > 0 && (
              <button 
                type="button"
                onClick={toggleAll}
                className="text-[9px] font-black text-blue-600 bg-blue-600/5 border border-blue-500/10 px-4 py-1.5 rounded-full hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest mt-1"
              >
                {allOpen ? 'סגור הכל' : 'פתח הכל'}
              </button>
            )}
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
                  ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20 border border-zinc-900' 
                  : 'text-zinc-400 hover:text-zinc-900 border border-transparent'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Canvas Zone */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white/30 backdrop-blur-3xl rounded-[3rem] border border-white/60 shadow-xl select-none">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-zinc-200 border-t-zinc-900 mb-4" />
          <p className="text-zinc-400 font-black tracking-[0.3em] uppercase text-[10px] font-mono">Synchronizing Matrix Stats...</p>
        </div>
      ) : !Array.isArray(leaderboards) || leaderboards.length === 0 ? (
        <div className="text-center py-24 bg-white/30 backdrop-blur-3xl rounded-[3rem] border border-white/60 shadow-xl text-zinc-400 font-bold italic text-sm select-none">
          לא נמצאו נתוני ביצועים בטווח הזמן שנבחר
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
                onToggle={() => {
                  FrontendLogger.info('LEADERBOARD_COMP', `Toggling panel visibility threshold for rule mapping node key: ${boardId}`);
                  setCollapsedStates(prev => ({ ...prev, [boardId]: !prev[boardId] }));
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * LeaderboardCard Sub-component - Visualizes ranking metrics for a flat exercise definition.
 */
const LeaderboardCard = ({ board, isCollapsed, onToggle }) => {
  
  const { entries, stats } = useMemo(() => {
    // Standardize safety fallback for inner row map metrics streams
    const rawEntries = board && Array.isArray(board.metrics) ? board.metrics : [];
    
    // Check if the structure encapsulates computing pairs or plain records arrays
    const formattedEntries = rawEntries.map(entry => ({
      full_name: entry.parameter_name || 'Anonymous Athlete',
      value: entry.computed_value !== undefined ? entry.computed_value : 0
    }));

    const activeParticipants = formattedEntries.filter(e => e.value > 0);
    activeParticipants.sort((a, b) => b.value - a.value);

    const rankedParticipants = activeParticipants.map((entry, index) => ({
      ...entry,
      displayRank: index + 1
    }));
    
    const totalSum = activeParticipants.reduce((acc, curr) => acc + curr.value, 0);
    const inactiveParticipants = formattedEntries.filter(e => e.value === 0).map(entry => ({
      ...entry,
      displayRank: '-'
    }));
    
    return {
      entries: [...rankedParticipants, ...inactiveParticipants],
      stats: {
        totalSum: totalSum.toLocaleString(),
        activeCount: activeParticipants.length,
        totalCount: formattedEntries.length || 1
      }
    };
  }, [board]);

  const getRankStyles = (rank, isNotParticipated) => {
    if (isNotParticipated || rank === '-') return 'bg-white text-zinc-300 border border-zinc-100 shadow-sm';
    switch (rank) {
      case 1: return 'bg-gradient-to-br from-amber-300 via-yellow-400 to-yellow-500 text-white shadow-md shadow-yellow-500/10 border border-yellow-400';
      case 2: return 'bg-gradient-to-br from-slate-100 via-zinc-200 to-zinc-300 text-zinc-700 shadow-sm border border-zinc-200';
      case 3: return 'bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 text-white shadow-sm border border-orange-600';
      default: return 'bg-zinc-900 text-white border border-zinc-900';
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-3xl border border-white/60 shadow-xl rounded-[3rem] flex flex-col transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] overflow-hidden group">
      
      {/* Header Panel Wrapper */}
      <div 
        className="p-8 cursor-pointer flex items-center justify-between relative bg-gradient-to-b from-white/40 to-transparent select-none"
        onClick={onToggle}
      >
        <div className="w-10 hidden md:block" />

        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-center px-4">
          <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase transition-colors group-hover:text-blue-600 m-0 leading-none">
            {board.exercise_name}
          </h3>
          <div className="bg-white/80 border border-white backdrop-blur-sm px-4 py-1 rounded-xl shadow-sm mt-1">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none m-0">
              {board.parameter_name || 'Performance Matrix'}
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
      <div className="px-8 py-6 bg-white/30 backdrop-blur-md flex justify-center items-center gap-10 border-y border-white/60 relative select-none">
        <div className="text-center space-y-1">
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em] m-0">מצטבר קבוצתי</p>
          <p className="text-3xl font-black text-zinc-900 tracking-tight leading-none flex items-baseline justify-center m-0 mt-1">
            {stats.totalSum} 
            <span className="text-[10px] font-black text-blue-500 mr-2 uppercase tracking-widest">{board.unit || 'units'}</span>
          </p>
        </div>
        
        <div className="h-10 w-px bg-white/80" />
        
        <div className="text-center space-y-1">
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em] m-0">פעילים</p>
          <div className="flex items-center justify-center leading-none tracking-tight m-0 mt-1">
            <span className="text-3xl font-black text-zinc-900">{stats.activeCount}</span>
            <span className="text-xl font-bold text-zinc-300 mx-2">/</span>
            <span className="text-xl font-black text-zinc-400">{stats.totalCount}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Drawer List Segment */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'}`}>
        <div className="p-6 overflow-y-auto max-h-[400px] scrollbar-hide bg-white/10 space-y-2">
          <table className="w-full text-right border-separate border-spacing-y-2 m-0">
            <tbody>
              {entries.map((entry, index) => {
                const isNotParticipated = entry.value === 0 || entry.displayRank === '-';
                return (
                  <tr 
                    key={`${entry.full_name}-${index}`} 
                    className={`transition-all duration-300 ${isNotParticipated ? 'opacity-40 bg-white/20 border border-white/40 rounded-2xl' : 'bg-white/80 border border-white rounded-2xl shadow-sm hover:shadow-md'}`}
                  >
                    <td className="p-3 w-16 rounded-r-2xl border-y border-r border-transparent select-none">
                      <div className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-xs transition-all duration-500 ${getRankStyles(entry.displayRank, isNotParticipated)}`}>
                        {entry.displayRank}
                      </div>
                    </td>

                    <td className="p-3 border-y border-transparent">
                      <p className="font-black text-zinc-900 text-base tracking-tight m-0">
                        {entry.full_name}
                      </p>
                    </td>

                    <td className="p-3 text-left rounded-l-2xl border-y border-l border-transparent">
                      {isNotParticipated ? (
                        <span className="text-[9px] text-zinc-300 font-black uppercase tracking-tight italic select-none">No Entry</span>
                      ) : (
                        <div className="flex flex-col items-start leading-none gap-0.5 md:mr-auto select-none">
                          <span className="text-lg font-black text-zinc-900 tracking-tight">{entry.value}</span>
                          <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none mt-0.5">{board.unit || 'units'}</span>
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