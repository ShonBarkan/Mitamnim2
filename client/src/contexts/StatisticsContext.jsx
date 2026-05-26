import React, { createContext, useState, useCallback, useContext, useMemo } from 'react';
import { statisticsService } from '../services/statisticsService';
import FrontendLogger from '../utils/logger';

export const StatisticsContext = createContext();

export const StatisticsProvider = ({ children }) => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  /**
   * Fetch and store dashboard statistics in the context state.
   */
  const fetchDashboardStats = useCallback(async (period = 'today') => {
    setLoadingStats(true);
    try {
      const data = await statisticsService.getDashboardStats(period);
      setDashboardStats(data);
      return data;
    } catch (error) {
      FrontendLogger.error('STATISTICS_CONTEXT', 'Error fetching dashboard stats', error);
      throw error;
    } finally {
      setLoadingStats(false);
    }
  }, []);

  /**
   * Fetch athlete specific stats. 
   * Returns data directly to be used in local component state (e.g., inside a chart modal).
   */
  const fetchAthleteStats = useCallback(async (athleteId, parameterName, exerciseId = null, monthsBack = 3) => {
    setLoadingStats(true);
    try {
      const data = await statisticsService.getAthleteStats(athleteId, parameterName, exerciseId, monthsBack);
      return data;
    } catch (error) {
      FrontendLogger.error('STATISTICS_CONTEXT', `Error fetching stats for athlete: ${athleteId}`, error);
      throw error;
    } finally {
      setLoadingStats(false);
    }
  }, []);

  /**
   * Fetch group trend stats.
   * Returns data directly to be used in local component state.
   */
  const fetchGroupTrends = useCallback(async (parameterName, exerciseId = null, monthsBack = 3) => {
    setLoadingStats(true);
    try {
      const data = await statisticsService.getGroupTrends(parameterName, exerciseId, monthsBack);
      return data;
    } catch (error) {
      FrontendLogger.error('STATISTICS_CONTEXT', 'Error fetching group trends', error);
      throw error;
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const value = useMemo(() => ({
    dashboardStats,
    loadingStats,
    fetchDashboardStats,
    fetchAthleteStats,
    fetchGroupTrends
  }), [
    dashboardStats, 
    loadingStats, 
    fetchDashboardStats, 
    fetchAthleteStats, 
    fetchGroupTrends
  ]);

  return (
    <StatisticsContext.Provider value={value}>
      {children}
    </StatisticsContext.Provider>
  );
};

export const useStatistics = () => {
  const context = useContext(StatisticsContext);
  if (!context) {
    throw new Error('useStatistics must be consumed within a StatisticsProvider');
  }
  return context;
};