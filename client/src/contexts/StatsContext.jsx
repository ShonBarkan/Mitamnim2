import React, { createContext, useState, useCallback, useContext } from 'react';
import statsEngineService from '../services/statsEngineService';
import dashboardConfigService from '../services/dashboardConfigService';
import { initialData } from '../mock/mockData';

export const StatsContext = createContext();

const IS_DEV = process.env.NODE_ENV === 'development';

export const StatsProvider = ({ children }) => {
    const [dashboardConfigs, setDashboardConfigs] = useState([]);
    const [loading, setLoading] = useState(false);

    /**
     * Helper to manage local storage for Dev mode
     */
    const getMockDb = useCallback(() => {
        const data = localStorage.getItem('mitamnim2_db');
        if (!data) {
            localStorage.setItem('mitamnim2_db', JSON.stringify(initialData));
            return initialData;
        }
        return JSON.parse(data);
    }, []);

    const saveMockDb = (db) => {
        localStorage.setItem('mitamnim2_db', JSON.stringify(db));
    };

    /**
     * Synchronizes dashboard configurations.
     */
    const refreshAllConfigs = useCallback(async () => {
        setLoading(true);
        try {
            if (IS_DEV) {
                await new Promise(resolve => setTimeout(resolve, 300));
                const db = getMockDb();
                setDashboardConfigs(db.stats_dashboard_config || []);
            } else {
                const response = await dashboardConfigService.getConfigs();
                setDashboardConfigs(response.data || response);
            }
        } catch (error) {
            console.error("StatsContext: Sync failed", error);
        } finally {
            setLoading(false);
        }
    }, [getMockDb]);

    /**
     * Registers a new dashboard display rule.
     */
    const addDashboardConfig = useCallback(async (data) => {
        try {
            if (IS_DEV) {
                const db = getMockDb();
                const newConfig = { ...data, id: Math.floor(Math.random() * 1000) };
                if (!db.stats_dashboard_config) db.stats_dashboard_config = [];
                db.stats_dashboard_config.push(newConfig);
                saveMockDb(db);
                setDashboardConfigs(prev => [...prev, newConfig]);
                return newConfig;
            } else {
                const response = await dashboardConfigService.createConfig(data);
                const newConfig = response.data || response;
                setDashboardConfigs(prev => [...prev, newConfig]);
                return newConfig;
            }
        } catch (error) {
            console.error("StatsContext: Add dashboard config failed", error);
            throw error;
        }
    }, [getMockDb]);

    /**
     * Updates an existing dashboard configuration.
     */
    const updateDashboardConfig = useCallback(async (id, data) => {
        try {
            let updated;
            if (IS_DEV) {
                const db = getMockDb();
                const index = db.stats_dashboard_config.findIndex(c => c.id === id);
                if (index !== -1) {
                    db.stats_dashboard_config[index] = { ...db.stats_dashboard_config[index], ...data };
                    updated = db.stats_dashboard_config[index];
                    saveMockDb(db);
                }
            } else {
                const response = await dashboardConfigService.updateConfig(id, data);
                updated = response.data || response;
            }

            setDashboardConfigs(prev => 
                prev.map(config => config.id === id ? updated : config)
            );
            return updated;
        } catch (error) {
            console.error("StatsContext: Update dashboard config failed", error);
            throw error;
        }
    }, [getMockDb]);

    /**
     * Removes an item from the dashboard configuration.
     */
    const removeDashboardConfig = useCallback(async (id) => {
        try {
            if (IS_DEV) {
                const db = getMockDb();
                db.stats_dashboard_config = db.stats_dashboard_config.filter(d => d.id !== id);
                saveMockDb(db);
            } else {
                await dashboardConfigService.removeConfig(id);
            }
            setDashboardConfigs(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error("StatsContext: Remove dashboard config failed", error);
            throw error;
        }
    }, [getMockDb]);

    /**
     * Fetches consolidated user performance overview.
     * In Dev: Mocks data based on activity_logs.
     */
    const fetchUserOverview = useCallback(async (targetUserId = null) => {
        setLoading(true);
        try {
            if (IS_DEV) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const db = getMockDb();
                const userLogs = db.activity_logs.filter(log => !targetUserId || log.user_id === targetUserId);
                
                return {
                    total_workouts: new Set(userLogs.map(l => l.session_id)).size,
                    total_sets: userLogs.length,
                    personal_records_count: 5, // Mocked value
                    recent_activity: userLogs.slice(0, 10)
                };
            } else {
                const response = await statsEngineService.getUserOverview(targetUserId);
                return response.data || response;
            }
        } catch (error) {
            console.error("StatsContext: Fetch user overview failed", error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [getMockDb]);

    /**
     * Fetches trends for a specific exercise name.
     */
    const fetchPersonalStats = useCallback(async (exerciseName, targetUserId = null) => {
        try {
            if (IS_DEV) {
                const db = getMockDb();
                return db.activity_logs.filter(log => 
                    log.exercise_name === exerciseName && (!targetUserId || log.user_id === targetUserId)
                );
            } else {
                const response = await statsEngineService.getPersonalHistory(exerciseName, targetUserId);
                return response.data || response;
            }
        } catch (error) {
            console.error("StatsContext: Fetch personal stats failed", error);
            return [];
        }
    }, [getMockDb]);

    /**
     * Fetches group-wide rankings.
     */
    const fetchGroupLeaderboard = useCallback(async (exerciseName, startDate, endDate) => {
        try {
            if (IS_DEV) {
                const db = getMockDb();
                // Simple mock aggregation by user
                const logs = db.activity_logs.filter(l => l.exercise_name === exerciseName);
                const rankings = {};
                logs.forEach(log => {
                    const val = Object.values(log.performance_data)[0] || 0;
                    if (!rankings[log.user_id] || val > rankings[log.user_id]) {
                        rankings[log.user_id] = val;
                    }
                });
                return Object.entries(rankings).map(([uid, score]) => ({ user_id: uid, score }));
            } else {
                const response = await statsEngineService.getGroupLeaderboard(exerciseName, startDate, endDate);
                return response.data || response;
            }
        } catch (error) {
            console.error("StatsContext: Fetch group leaderboard failed", error);
            return [];
        }
    }, [getMockDb]);

    return (
        <StatsContext.Provider value={{
            dashboardConfigs,
            loading,
            refreshAllConfigs,
            addDashboardConfig,
            updateDashboardConfig,
            removeDashboardConfig,
            fetchUserOverview,
            fetchPersonalStats,
            fetchGroupLeaderboard
        }}>
            {children}
        </StatsContext.Provider>
    );
};

export const useStats = () => {
    const context = useContext(StatsContext);
    if (!context) {
        throw new Error("useStats must be used within a StatsProvider");
    }
    return context;
};

export default StatsProvider;