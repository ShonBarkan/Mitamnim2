import React, { createContext, useState, useCallback, useContext } from 'react';
import formulaService from '../services/formulaService';
import conversionService from '../services/conversionService';
import statsEngineService from '../services/statsEngineService';
import dashboardConfigService from '../services/dashboardConfigService';

export const StatsContext = createContext();

export const StatsProvider = ({ children }) => {
    const [formulas, setFormulas] = useState([]);
    const [conversions, setConversions] = useState([]);
    const [dashboardConfigs, setDashboardConfigs] = useState([]);
    const [loading, setLoading] = useState(false);

    /**
     * Sync all configuration data from the server.
     * Fetches Formulas, Conversions, and Dashboard Configurations in parallel.
     */
    const refreshAllConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const [f, c, d] = await Promise.all([
                formulaService.getFormulas(),
                conversionService.getConversions(),
                dashboardConfigService.getConfigs()
            ]);
            setFormulas(f);
            setConversions(c);
            setDashboardConfigs(d);
        } catch (error) {
            console.error("StatsContext: Failed to sync stats configurations", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Formula Management ---
    const addFormula = async (data) => {
        try {
            const newFormula = await formulaService.createFormula(data);
            setFormulas(prev => [...prev, newFormula]);
            return newFormula;
        } catch (error) {
            console.error("StatsContext: Failed to add formula", error);
            throw error;
        }
    };

    // --- Conversion Management ---
    const addConversion = async (data) => {
        try {
            const newConv = await conversionService.createConversion(data);
            setConversions(prev => [...prev, newConv]);
            return newConv;
        } catch (error) {
            console.error("StatsContext: Failed to add conversion", error);
            throw error;
        }
    };

    const removeConversion = async (id) => {
        try {
            await conversionService.deleteConversion(id);
            setConversions(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("StatsContext: Failed to remove conversion", error);
            throw error;
        }
    };

    // --- Dashboard Configuration Management ---
    const addDashboardConfig = async (data) => {
        try {
            const newConfig = await dashboardConfigService.createConfig(data);
            setDashboardConfigs(prev => [...prev, newConfig]);
            return newConfig;
        } catch (error) {
            console.error("StatsContext: Failed to add dashboard config", error);
            throw error;
        }
    };

    /**
     * Updates an existing dashboard configuration.
     * Essential for Drag and Drop (display_order), field edits, and public toggles.
     */
    const updateDashboardConfig = async (id, data) => {
        try {
            const updated = await dashboardConfigService.updateConfig(id, data);
            setDashboardConfigs(prev => 
                prev.map(config => config.id === id ? updated : config)
            );
            return updated;
        } catch (error) {
            console.error("StatsContext: Failed to update dashboard config", error);
            throw error;
        }
    };

    const removeDashboardConfig = async (id) => {
        try {
            await dashboardConfigService.removeConfig(id);
            setDashboardConfigs(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error("StatsContext: Failed to remove dashboard config", error);
            throw error;
        }
    };

    // --- Data Retrieval for Charts & Leaderboards ---

    /**
     * Data Retrieval for Individual Charts.
     * Triggers the real-time Pandas engine on the backend for personal history.
     */
    const fetchPersonalStats = async (exerciseId, targetUserId = null) => {
        try {
            return await statsEngineService.getPersonalHistory(exerciseId, targetUserId);
        } catch (error) {
            console.error("StatsContext: Failed to fetch personal stats", error);
            return [];
        }
    };

    /**
     * Data Retrieval for Group Leaderboards (Landing Page).
     * Fetches all public rankings based on the configured aggregation strategies.
     */
    const fetchGroupLeaderboard = async (startDate, endDate) => {
        try {
            return await statsEngineService.getGroupLeaderboard(startDate, endDate);
        } catch (error) {
            console.error("StatsContext: Failed to fetch group leaderboard", error);
            return [];
        }
    };

    const value = {
        formulas,
        conversions,
        dashboardConfigs,
        loading,
        refreshAllConfigs,
        addFormula,
        addConversion,
        removeConversion,
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
 * Custom hook for easy access to the StatsContext.
 */
export const useStats = () => {
    const context = useContext(StatsContext);
    if (!context) {
        throw new Error("useStats must be used within a StatsProvider");
    }
    return context;
};

export default StatsProvider;