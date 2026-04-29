import React, { createContext, useState, useCallback } from 'react';
import { activeParamService } from '../services/activeParamService';

export const ActiveParamContext = createContext();

export const ActiveParamProvider = ({ children }) => {
  const [activeParams, setActiveParams] = useState([]); // Parameters for the currently selected exercise
  const [loading, setLoading] = useState(false);

  // Fetch parameters linked to a specific exercise
  const fetchActiveParams = useCallback(async (exerciseId) => {
    setLoading(true);
    try {
      const response = await activeParamService.getByExercise(exerciseId);
      setActiveParams(response.data);
    } catch (err) {
      console.error("Failed to fetch active params:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Link a new parameter to an exercise
  const linkParam = async (data) => {
    try {
      const response = await activeParamService.link(data);
      // After linking, we refresh the list to show the new parameter with its metadata
      setActiveParams(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error("Link failed:", err);
      throw err;
    }
  };

  // Remove a link
  const unlinkParam = async (linkId) => {
    try {
      await activeParamService.unlink(linkId);
      setActiveParams(prev => prev.filter(p => p.id !== linkId));
    } catch (err) {
      console.error("Unlink failed:", err);
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