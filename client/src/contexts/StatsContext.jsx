import React, { createContext, useState, useCallback, useContext } from 'react';
import statsEngineService from '../services/statsEngineService';
import dashboardConfigService from '../services/dashboardConfigService';

export const StatsContext = createContext();

/**
 * Context provider for statistics and dashboard configurations.
 * Centralizes analytics retrieval and manages leaderboard display settings.
 */
export const StatsProvider = ({ children }) => {
    const [dashboardConfigs, setDashboardConfigs] = useState([]);
    const [loading, setLoading] = useState(false);

    /**
     * Synchronizes dashboard configurations from the backend.
     */
    const refreshAllConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const configs = await dashboardConfigService.getConfigs();
            setDashboardConfigs(configs);
        } catch (error) {
            console.error("StatsContext: Sync failed", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Dashboard Settings Logic ---

    /**
     * Registers a new dashboard display rule.
     */
    const addDashboardConfig = async (data) => {
        try {
            const newConfig = await dashboardConfigService.createConfig(data);
            setDashboardConfigs(prev => [...prev, newConfig]);
            return newConfig;
        } catch (error) {
            console.error("StatsContext: Add dashboard config failed", error);
            throw error;
        }
    };

    /**
     * Updates an existing dashboard configuration.
     * Supports reordering, metric editing, and visibility toggles.
     */
    const updateDashboardConfig = async (id, data) => {
        try {
            const updated = await dashboardConfigService.updateConfig(id, data);
            setDashboardConfigs(prev => 
                prev.map(config => config.id === id ? updated : config)
            );
            return updated;
        } catch (error) {
            console.error("StatsContext: Update dashboard config failed", error);
            throw error;
        }
    };

    /**
     * Removes an item from the dashboard configuration.
     */
    const removeDashboardConfig = async (id) => {
        try {
            await dashboardConfigService.removeConfig(id);
            setDashboardConfigs(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error("StatsContext: Remove dashboard config failed", error);
            throw error;
        }
    };

    // --- Data Engine Retrieval ---

    /**
     * Fetches personal performance trends and history.
     * Aggregates data across exercise hierarchy and applies aggregation strategies.
     */
    const fetchPersonalStats = async (exerciseId, targetUserId = null) => {
        try {
            return await statsEngineService.getPersonalHistory(exerciseId, targetUserId);
        } catch (error) {
            console.error("StatsContext: Fetch personal stats failed", error);
            return [];
        }
    };

    /**
     * Fetches group-wide rankings for public leaderboards within a timeframe.
     */
    const fetchGroupLeaderboard = async (startDate, endDate) => {
        try {
            return await statsEngineService.getGroupLeaderboard(startDate, endDate);
        } catch (error) {
            console.error("StatsContext: Fetch group leaderboard failed", error);
            return [];
        }
    };

    const value = {
        dashboardConfigs,
        loading,
        refreshAllConfigs,
        addDashboardConfig,
        updateDashboardConfig,
        removeDashboardConfig,
        fetchPersonalStats,
        fetchGroupLeaderboard
    };

    return (
        <StatsContext.Provider value={value}>
            {children}
        </StatsContext.Provider>
    );
};

/**
 * Custom hook for accessing statistics and dashboard settings.
 */
export const useStats = () => {
    const context = useContext(StatsContext);
    if (!context) {
        throw new Error("useStats must be used within a StatsProvider");
    }
    return context;
};

export default StatsProvider;