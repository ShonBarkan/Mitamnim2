import React, { createContext, useState, useCallback } from 'react';
import { activeParamService } from '../services/activeParamService';

export const ActiveParamContext = createContext();

/**
 * Context provider for managing exercise-parameter links.
 * Designed for modular component consumption without prop-drilling.
 */
export const ActiveParamProvider = ({ children }) => {
  const [activeParams, setActiveParams] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches all active parameters for the current group.
   * Highly efficient for context initialization.
   */
  const fetchAllGroupParams = useCallback(async () => {
    setLoading(true);
    try {
      const response = await activeParamService.getAllGroupParams();
      setActiveParams(response.data);
    } catch (err) {
      console.error("ActiveParamContext: Failed to fetch group params:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetches active parameters for a specific exercise node.
   */
  const fetchActiveParams = useCallback(async (exerciseId) => {
    if (!exerciseId) return;
    setLoading(true);
    try {
      const response = await activeParamService.getByExercise(exerciseId);
      setActiveParams(response.data);
    } catch (err) {
      console.error("ActiveParamContext: Failed to fetch active params:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetches specific active parameters based on an ID array.
   */
  const fetchActiveParamsBatch = useCallback(async (ids = null) => {
    setLoading(true);
    try {
      const response = await activeParamService.getBatch(ids);
      setActiveParams(response.data);
    } catch (err) {
      console.error("ActiveParamContext: Failed to fetch batch active params:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Links a parameter to an exercise and updates the local state.
   */
  const linkParam = async (data) => {
    try {
      const response = await activeParamService.link(data);
      // Immediately update state with the enriched metadata from backend
      setActiveParams(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error("ActiveParamContext: Link failed:", err);
      throw err;
    }
  };

  /**
   * Removes a link and filters the local state.
   */
  const unlinkParam = async (linkId) => {
    try {
      await activeParamService.unlink(linkId);
      setActiveParams(prev => prev.filter(p => p.id !== linkId));
    } catch (err) {
      console.error("ActiveParamContext: Unlink failed:", err);
      throw err;
    }
  };

  return (
    <ActiveParamContext.Provider value={{ 
      activeParams, 
      loading,
      fetchAllGroupParams,
      fetchActiveParams, 
      fetchActiveParamsBatch,
      linkParam, 
      unlinkParam 
    }}>
      {children}
    </ActiveParamContext.Provider>
  );
};