import React, { createContext, useState, useCallback } from 'react';
import { activeParamService } from '../services/activeParamService';

export const ActiveParamContext = createContext();

/**
 * Context provider for managing exercise-parameter links.
 * Handles cascading updates when parameters are unlinked.
 */
export const ActiveParamProvider = ({ children }) => {
  const [activeParams, setActiveParams] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches all active parameters for the current group.
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
   * Links a parameter to an exercise and updates local state.
   * Note: If the backend logic also links dependencies, we might need 
   * to fetchActiveParams instead of just appending.
   */
  const linkParam = async (data) => {
    try {
      const response = await activeParamService.link(data);
      // If linking a virtual parameter causes cascading links in the backend,
      // it is safer to refresh the whole list for the exercise:
      await fetchActiveParams(data.exercise_id);
      return response.data;
    } catch (err) {
      console.error("ActiveParamContext: Link failed:", err);
      throw err;
    }
  };

  /**
   * Removes a link and refreshes the state.
   * Since unlinking can trigger recursive deletions in the backend, 
   * we must re-fetch the parameters for the exercise to ensure UI consistency.
   */
  const unlinkParam = async (linkId) => {
    // Find the exercise ID before unlinking to know what to refresh
    const linkToDelete = activeParams.find(p => p.id === linkId);
    if (!linkToDelete) return;

    const exerciseId = linkToDelete.exercise_id;

    try {
      await activeParamService.unlink(linkId);
      
      // Re-fetch to catch recursive deletions (e.g., virtual params depending on this one)
      await fetchActiveParams(exerciseId);
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