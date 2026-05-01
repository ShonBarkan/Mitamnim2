import React, { useEffect, useState, useMemo } from 'react';
import { useStats } from '../../contexts/StatsContext';

const GroupLeaderboard = () => {
    const { fetchGroupLeaderboard } = useStats();
    const [leaderboards, setLeaderboards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('week');
    const [allOpen, setAllOpen] = useState(true);
    const [collapsedStates, setCollapsedStates] = useState({});

    const dateQuery = useMemo(() => {
        const now = new Date();
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-3 text-center md:text-right">
                    <h2 className="text-5xl font-black text-zinc-900 tracking-tighter leading-none">לוח תוצאות</h2>
                    <div className="flex items-center justify-center md:justify-start gap-4">
                        <p className="text-zinc-500 font-bold text-sm">
                            {dateRange === 'today' && 'ביצועי היום'}
                            {dateRange === 'week' && 'דירוג שבועי נוכחי'}
                            {dateRange === 'month' && 'סיכום חודשי'}
                            {dateRange === 'all' && 'שיאי כל הזמנים'}
                        </p>
                        <button 
                            onClick={toggleAll}
                            className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest"
                        >
                            {allOpen ? 'סגור הכל' : 'פתח הכל'}
                        </button>
                    </div>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-sm self-center md:self-auto">
                    {[
                        { id: 'today', label: 'היום' },
                        { id: 'week', label: 'שבוע' },
                        { id: 'month', label: 'חודש' },
                        { id: 'all', label: 'הכל' }
                    ].map((btn) => (
                        <button
                            key={btn.id}
                            onClick={() => setDateRange(btn.id)}
                            className={`px-6 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
                                dateRange === btn.id 
                                ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200' 
                                : 'text-zinc-400 hover:text-zinc-900'
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 arctic-glass rounded-[3rem] border-dashed border-zinc-200">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-zinc-400 font-black tracking-widest uppercase text-xs">Synchronizing Data...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-8">
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

const LeaderboardCard = ({ board, isCollapsed, onToggle }) => {
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

    const getRankStyles = (rank, isNotParticipated) => {
        if (isNotParticipated) return 'bg-zinc-100 text-zinc-300';
        switch (rank) {
            case 1: return 'bg-[#FFD700] text-white shadow-[0_4px_15px_rgba(255,215,0,0.4)]';
            case 2: return 'bg-[#C0C0C0] text-white shadow-[0_4px_15px_rgba(192,192,192,0.3)]';
            case 3: return 'bg-[#CD7F32] text-white shadow-[0_4px_15px_rgba(205,127,50,0.3)]';
            default: return 'bg-zinc-900 text-white';
        }
    };

    return (
        <div className="bg-white border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] flex flex-col transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] hover:-translate-y-1 overflow-hidden group/card">
            
            {/* HEADER - CENTERED & CLEAN */}
            <div 
                className="p-8 cursor-pointer flex items-center justify-between group/header relative bg-gradient-to-b from-white to-slate-50/30"
                onClick={onToggle}
            >
                <div className="w-10 hidden md:block" />

                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-2">
                    <h3 className="text-2xl font-black text-zinc-900 leading-none tracking-tight group-hover/header:text-blue-600 transition-colors">
                        {board.exercise_name}
                    </h3>
                    <div className="bg-white border border-zinc-200 px-4 py-1.5 rounded-xl shadow-sm">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">
                            {board.parameter_name}
                        </p>
                    </div>
                </div>

                <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    isCollapsed 
                    ? 'bg-zinc-100 text-zinc-400 rotate-180' 
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                }`}>
                    <span className="text-[10px] font-bold">▼</span>
                </div>
            </div>

            {/* QUICK STATS - WHITE LUXURY BOX */}
            <div className="px-6 py-8 bg-white flex justify-center items-center gap-10 border-y border-zinc-100 relative">
                {/* Visual Centering Aid */}
                <div className="text-center space-y-2 relative z-10">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">מצטבר קבוצתי</p>
                    <p className="text-3xl font-black text-zinc-900 leading-none flex items-baseline justify-center">
                        {stats?.totalSum} 
                        <span className="text-xs font-bold text-blue-500 mr-2 uppercase">{board.unit}</span>
                    </p>
                </div>
                
                <div className="h-12 w-px bg-zinc-100" />
                
                <div className="text-center space-y-2 relative z-10">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">פעילים</p>
                    <div className="flex items-center justify-center leading-none">
                        <span className="text-3xl font-black text-zinc-900">{stats?.activeCount}</span>
                        <span className="text-xl font-bold text-zinc-300 mx-2">/</span>
                        <span className="text-xl font-bold text-zinc-400">{stats?.totalCount}</span>
                    </div>
                </div>
            </div>

            {/* LIST SECTION */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'}`}>
                <div className="p-6 overflow-y-auto max-h-[400px] scrollbar-hide bg-slate-50/50">
                    <table className="w-full text-right border-separate border-spacing-y-3">
                        <tbody>
                            {entries.map((entry) => {
                                const isNotParticipated = entry.value === 0;
                                return (
                                    <tr 
                                        key={entry.full_name} 
                                        className={`transition-all ${isNotParticipated ? 'opacity-30' : 'bg-white rounded-2xl shadow-sm hover:shadow-md'}`}
                                    >
                                        <td className="p-4 w-16 rounded-r-2xl border-y border-r border-zinc-50">
                                            <div className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-xs transition-all duration-500 ${getRankStyles(entry.displayRank, isNotParticipated)}`}>
                                                {isNotParticipated ? '-' : entry.displayRank}
                                            </div>
                                        </td>
                                        <td className="p-4 border-y border-zinc-50">
                                            <p className="font-black text-zinc-900 text-base tracking-tight">
                                                {entry.full_name}
                                            </p>
                                        </td>
                                        <td className="p-4 text-left rounded-l-2xl border-y border-l border-zinc-50">
                                            {isNotParticipated ? (
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase italic tracking-tighter">No entry</span>
                                            ) : (
                                                <div className="flex flex-col items-start leading-none gap-1">
                                                    <span className="text-xl font-black text-zinc-900">{entry.value}</span>
                                                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">{board.unit}</span>
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