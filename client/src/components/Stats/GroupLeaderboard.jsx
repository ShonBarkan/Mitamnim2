import React, { useEffect, useState, useMemo } from 'react';
import { useStats } from '../../contexts/StatsContext';

const GroupLeaderboard = () => {
    const { fetchGroupLeaderboard } = useStats();
    const [leaderboards, setLeaderboards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('week'); 

    const dateQuery = useMemo(() => {
        const now = new Date();
        const end = new Date(); 
        const start = new Date();
        
        start.setHours(0, 0, 0, 0);

        if (dateRange === 'today') {
            // Today logic
        } 
        else if (dateRange === 'week') {
            const dayOfWeek = now.getDay(); 
            start.setDate(now.getDate() - dayOfWeek);
        } 
        else if (dateRange === 'month') {
            start.setDate(1);
        } 
        else {
            start.setFullYear(now.getFullYear() - 10);
        }
        
        return { 
            start: start.toISOString(), 
            end: end.toISOString() 
        };
    }, [dateRange]);

    useEffect(() => {
        const loadLeaderboards = async () => {
            setLoading(true);
            try {
                const data = await fetchGroupLeaderboard(dateQuery.start, dateQuery.end);
                setLeaderboards(data);
            } catch (error) {
                console.error("Failed to load leaderboards:", error);
            } finally {
                setLoading(false);
            }
        };

        loadLeaderboards();
    }, [dateQuery, fetchGroupLeaderboard]);

    return (
        <div className="w-full py-8 bg-gray-50 rounded-3xl p-6 shadow-inner" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900">לוח תוצאות קבוצתי</h2>
                    <p className="text-gray-500 mt-1">
                        {dateRange === 'today' && 'ביצועי היום (מ-00:00)'}
                        {dateRange === 'week' && 'ביצועי השבוע (מיום ראשון)'}
                        {dateRange === 'month' && 'ביצועי החודש (מה-1 לחודש)'}
                        {dateRange === 'all' && 'כל הזמנים'}
                    </p>
                </div>

                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                    {[
                        { id: 'today', label: 'היום' },
                        { id: 'week', label: 'שבוע' },
                        { id: 'month', label: 'חודש' },
                        { id: 'all', label: 'הכל' }
                    ].map((btn) => (
                        <button
                            key={btn.id}
                            onClick={() => setDateRange(btn.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                                dateRange === btn.id 
                                ? 'bg-purple-600 text-white shadow-md' 
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">מעבד נתונים מהשטח...</p>
                </div>
            ) : leaderboards.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400">אין מספיק נתונים להצגת דירוג בטווח שנבחר.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {leaderboards.map((board) => (
                        <LeaderboardCard key={`${board.exercise_id}-${board.parameter_name}`} board={board} />
                    ))}
                </div>
            )}
        </div>
    );
};

const LeaderboardCard = ({ board }) => {
    const processedData = useMemo(() => {
        if (!board.entries) return { entries: [], stats: null };

        const activeParticipants = board.entries.filter(e => e.value > 0);
        const nonParticipants = board.entries.filter(e => e.value === 0);

        const rankedParticipants = activeParticipants.map((entry, index) => ({
            ...entry,
            displayRank: index + 1
        }));

        const values = activeParticipants.map(e => e.value);
        const totalSum = values.reduce((acc, curr) => acc + curr, 0);
        
        return {
            entries: [...rankedParticipants, ...nonParticipants],
            stats: {
                totalSum: totalSum.toLocaleString(),
                activeCount: activeParticipants.length,
                totalCount: board.entries.length
            }
        };
    }, [board]);

    const { entries, stats } = processedData;

    return (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col transition-transform hover:shadow-md">
            <div className="p-5 bg-gradient-to-l from-purple-50 to-white border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800">{board.exercise_name}</h3>
                <p className="text-sm text-purple-600 font-medium">{board.parameter_name}</p>
            </div>

            <div className="px-5 py-3 bg-gray-50 flex justify-around border-b border-gray-100 text-center">
                <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">סה"כ מצטבר</p>
                    <p className="text-sm font-black text-gray-700">{stats?.totalSum} {board.unit}</p>
                </div>
                <div className="w-px bg-gray-200"></div>
                <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">השתתפו</p>
                    <p className="text-sm font-black text-gray-700">{stats?.activeCount} / {stats?.totalCount}</p>
                </div>
            </div>

            <div className="p-2">
                <table className="w-full text-right border-separate border-spacing-y-2">
                    <thead>
                        <tr className="text-gray-400 text-[10px] font-bold uppercase">
                            <th className="px-4 py-1 w-16">#</th>
                            <th className="px-4 py-1">מתאמן</th>
                            <th className="px-4 py-1 text-left">תוצאה</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => {
                            const isNotParticipated = entry.value === 0;
                            return (
                                <tr 
                                    key={entry.full_name} 
                                    className={`group transition-all ${
                                        !isNotParticipated && entry.displayRank === 1 ? 'bg-yellow-50' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <td className="px-4 py-3 rounded-r-xl">
                                        <div className={`w-7 h-7 flex items-center justify-center rounded-full font-black text-xs ${
                                            isNotParticipated ? 'text-gray-300 border border-gray-100' :
                                            entry.displayRank === 1 ? 'bg-yellow-400 text-white shadow-sm' : 
                                            entry.displayRank === 2 ? 'bg-gray-300 text-white' :
                                            entry.displayRank === 3 ? 'bg-orange-300 text-white' : 'text-gray-400 bg-gray-100'
                                        }`}>
                                            {isNotParticipated ? '-' : entry.displayRank}
                                        </div>
                                    </td>
                                    <td className={`px-4 py-3 font-bold text-sm ${isNotParticipated ? 'text-gray-300 italic' : 'text-gray-700'}`}>
                                        {entry.full_name}
                                    </td>
                                    <td className="px-4 py-3 text-left rounded-l-xl">
                                        {isNotParticipated ? (
                                            <span className="text-xs text-gray-200 font-medium italic">לא הוזן נתון</span>
                                        ) : (
                                            <>
                                                <span className="text-md font-black text-gray-900">{entry.value}</span>
                                                <span className="mr-1 text-[10px] text-gray-400">{board.unit}</span>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GroupLeaderboard;