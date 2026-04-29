import React, { createContext, useState, useCallback } from 'react';
import { parameterService } from '../services/parameterService';

export const ParameterContext = createContext();

export const ParameterProvider = ({ children }) => {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches all measurement parameters belonging to the user's group.
   * Uses the updated parameterService.getAll() with trailing slash support.
   */
  const fetchParameters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await parameterService.getAll();
      setParameters(response.data);
    } catch (error) {
      console.error("ParameterContext: Failed to fetch parameters:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Creates a new parameter definition.
   * Updates local state immediately upon success.
   */
  const addParameter = async (data) => {
    try {
      const response = await parameterService.create(data);
      setParameters(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error("ParameterContext: Failed to add parameter:", error);
      throw error;
    }
  };

  /**
   * Updates an existing parameter (e.g., name or unit changes).
   * Refreshes the local parameters list with the returned updated object.
   */
  const editParameter = async (id, data) => {
    try {
      const response = await parameterService.update(id, data);
      setParameters(prev => prev.map(p => p.id === id ? response.data : p));
      return response.data;
    } catch (error) {
      console.error("ParameterContext: Failed to edit parameter:", error);
      throw error;
    }
  };

  /**
   * Removes a parameter from the group database and local state.
   */
  const removeParameter = async (id) => {
    try {
      await parameterService.delete(id);
      setParameters(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("ParameterContext: Failed to remove parameter:", error);
      throw error;
    }
  };

  const value = {
    parameters,
    loading,
    fetchParameters,
    addParameter,
    editParameter,
    removeParameter
  };

  return (
    <ParameterContext.Provider value={value}>
      {children}
    </ParameterContext.Provider>
  );
};