import React, { createContext, useState, useCallback } from 'react';
import { activeParamService } from '../services/activeParamService';

export const ActiveParamContext = createContext();

export const ActiveParamProvider = ({ children }) => {
  const [activeParams, setActiveParams] = useState([]); 
  const [loading, setLoading] = useState(false);

  /**
   * Fetches parameters linked to a specific exercise.
   */
  const fetchActiveParams = useCallback(async (exerciseId) => {
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
   * Links a new parameter to an exercise.
   * The state is updated immediately with the enriched data from the server.
   */
  const linkParam = async (data) => {
    try {
      const response = await activeParamService.link(data);
      
      // Update state immediately with the enriched object returned by the Backend
      setActiveParams(prev => [...prev, response.data]);
      
      return response.data;
    } catch (err) {
      console.error("ActiveParamContext: Link failed:", err);
      throw err;
    }
  };

  /**
   * Removes a link between a parameter and an exercise.
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
      fetchActiveParams, 
      linkParam, 
      unlinkParam 
    }}>
      {children}
    </ActiveParamContext.Provider>
  );
};