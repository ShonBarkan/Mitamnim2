import React, { createContext, useState, useCallback, useContext, useMemo } from 'react';
import { dashboardConfigService } from '../services/dashboardConfigService';
import FrontendLogger from '../utils/logger';

export const DashboardConfigContext = createContext();

export const DashboardConfigProvider = ({ children }) => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Configuration Management ---

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      FrontendLogger.info('DASHBOARD_CONFIG_CONTEXT', 'Hydrating dashboard configuration registry');
      const data = await dashboardConfigService.getConfigs();
      setConfigs(data);
    } catch (error) {
      FrontendLogger.error('DASHBOARD_CONFIG_CONTEXT', 'Failed to hydrate dashboard configs', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createConfig = useCallback(async (configData) => {
    setLoading(true);
    try {
      const newConfig = await dashboardConfigService.createConfig(configData);
      setConfigs((prev) => [...prev, newConfig]);
      return newConfig;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (id, configData) => {
    try {
      const updatedConfig = await dashboardConfigService.updateConfig(id, configData);
      setConfigs((prev) => prev.map(c => c.id === id ? { ...c, ...updatedConfig } : c));
      return updatedConfig;
    } catch (error) {
      throw error;
    }
  }, []);

  /**
   * Bulk updates the order of configurations (Drag & Drop)
   * @param {Array} newConfigsOrder - The full list of configs in the new order
   */
  const reorderConfigs = useCallback(async (newConfigsOrder) => {
    // Optimistic Update: Update UI immediately
    setConfigs(newConfigsOrder);
    
    try {
      const payload = newConfigsOrder.map((c, index) => ({
        id: c.id,
        position: index
      }));
      await dashboardConfigService.reorderConfigs(payload);
    } catch (error) {
      FrontendLogger.error('DASHBOARD_CONFIG_CONTEXT', 'Failed to reorder configs', error);
      // Revert if failed
      fetchConfigs();
      throw error;
    }
  }, [fetchConfigs]);

  const deleteConfig = useCallback(async (id) => {
    try {
      await dashboardConfigService.deleteConfig(id);
      setConfigs((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    configs,
    loading,
    fetchConfigs,
    createConfig,
    updateConfig,
    reorderConfigs,
    deleteConfig,
  }), [
    configs, loading, 
    fetchConfigs, createConfig, updateConfig, reorderConfigs, deleteConfig
  ]);

  return (
    <DashboardConfigContext.Provider value={value}>
      {children}
    </DashboardConfigContext.Provider>
  );
};

export const useDashboardConfig = () => {
  const context = useContext(DashboardConfigContext);
  if (!context) {
    throw new Error('useDashboardConfig must be consumed within a DashboardConfigProvider');
  }
  return context;
};