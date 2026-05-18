import React, { createContext, useState, useCallback, useContext } from 'react';
import dashboardConfigService from '../services/dashboardConfigService';
import statsService from '../services/statsService';
import FrontendLogger from '../utils/logger';

export const StatsContext = createContext();

export const StatsProvider = ({ children }) => {
  const [dashboardConfigs, setDashboardConfigs] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Synchronizes group dashboard visualization configurations.
   */
  const refreshAllConfigs = useCallback(async () => {
    setLoading(true);
    try {
      FrontendLogger.info('STATS_CONTEXT', 'Synchronizing leaderboard metrics dashboard configurations');
      const data = await dashboardConfigService.getConfigs();
      setDashboardConfigs(data);
      FrontendLogger.info('STATS_CONTEXT', `Successfully loaded ${data.length} active layout config rules`);
    } catch (error) {
      FrontendLogger.error('STATS_CONTEXT', 'Failed to synchronize dashboard configuration matrix portfolio', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registers a brand new dashboard visibility display rule.
   */
  const addDashboardConfig = useCallback(async (configData) => {
    try {
      FrontendLogger.info('STATS_CONTEXT', 'Registering new metric track rule blueprint on public board', configData);
      const newConfig = await dashboardConfigService.createConfig(configData);
      
      setDashboardConfigs(prev => [...prev, newConfig]);
      FrontendLogger.info('STATS_CONTEXT', 'Leaderboard tracking rule successfully allocated inside state layouts', newConfig);
      return newConfig;
    } catch (error) {
      FrontendLogger.error('STATS_CONTEXT', 'Failed to append metric layout configuration boundary rule', error);
      throw error;
    }
  }, []);

  /**
   * Updates display rules or priority sequences for an existing configuration item.
   */
  const updateDashboardConfig = useCallback(async (id, updateData) => {
    try {
      FrontendLogger.info('STATS_CONTEXT', `Mutating layout behavior attributes for configuration node id: ${id}`, updateData);
      const updated = await dashboardConfigService.updateConfig(id, updateData);

      setDashboardConfigs(prev => 
        prev.map(config => config.id === id ? updated : config)
      );
      FrontendLogger.info('STATS_CONTEXT', `Configuration block id: ${id} successfully synced across UI frameworks`);
      return updated;
    } catch (error) {
      FrontendLogger.error('STATS_CONTEXT', `Failed to mutate dashboard display config validation rule target id: ${id}`, error);
      throw error;
    }
  }, []);

  /**
   * Removes a tracking metric configuration row from the leaderboard pool.
   */
  const removeDashboardConfig = useCallback(async (id) => {
    try {
      FrontendLogger.info('STATS_CONTEXT', `Evicting tracking rule blueprint node id: ${id} from layout array boundaries`);
      await dashboardConfigService.removeConfig(id);
      
      setDashboardConfigs(prev => prev.filter(d => d.id !== id));
      FrontendLogger.info('STATS_CONTEXT', `Layout rule id: ${id} completely dropped from tracking memory bounds`);
    } catch (error) {
      FrontendLogger.error('STATS_CONTEXT', `Failed to execute absolute destruction chain for dashboard rule id: ${id}`, error);
      throw error;
    }
  }, []);

  /**
   * Extends direct request streams to pull personal chronological analysis metrics blocks.
   */
  const fetchPersonalStats = useCallback(async (startDate, endDate) => {
    setLoading(true);
    try {
      FrontendLogger.info('STATS_CONTEXT', 'Requesting personal dried analytics metrics streams timeline array', { startDate, endDate });
      const data = await statsService.getPersonalStats(startDate, endDate);
      return data;
    } catch (error) {
      FrontendLogger.error('STATS_CONTEXT', 'Failed to catch clean personal chronological data blocks', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Extracts combined panoramic surveillance metrics matrices across the entire group roster.
   */
  const fetchGroupPanoramicStats = useCallback(async (startDate, endDate) => {
    setLoading(true);
    try {
      FrontendLogger.info('STATS_CONTEXT', 'Requesting panoramic multi-user team visualization overview arrays', { startDate, endDate });
      const data = await statsService.getGroupPanoramicStats(startDate, endDate);
      return data;
    } catch (error) {
      FrontendLogger.error('STATS_CONTEXT', 'Failed to compute panoramic analytical data array frameworks', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <StatsContext.Provider value={{
      dashboardConfigs,
      loading,
      refreshAllConfigs,
      addDashboardConfig,
      updateDashboardConfig,
      removeDashboardConfig,
      fetchPersonalStats,
      fetchGroupPanoramicStats
    }}>
      {children}
    </StatsContext.Provider>
  );
};

/**
 * Custom hook utility proxying contextual abstraction layers cleanly.
 * Must be consumed strictly within an active StatsProvider scope wrapper boundary.
 */
export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be consumed strictly within an active StatsProvider scope wrapper boundary.');
  }
  return context;
};

export default StatsProvider;