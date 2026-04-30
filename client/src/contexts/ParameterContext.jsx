import React, { createContext, useState, useCallback, useContext } from 'react';
import { parameterService } from '../services/parameterService';

export const ParameterContext = createContext();

/**
 * Provider for managing global measurement parameters.
 * Supports standard (raw) and virtual parameters (sum, subtract, multiply, divide, percentage, conversion).
 */
export const ParameterProvider = ({ children }) => {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches all available parameters for the current group.
   * Metadata includes aggregation strategies and advanced calculation rules for virtual params.
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
   * Persists a new parameter definition.
   * Handles configuration for virtual parameters including calculation_type and source_parameter_ids.
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
   * Updates an existing parameter.
   * Supports partial updates for name, unit, aggregation strategy, or calculation logic.
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
   * Removes a parameter definition.
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

  /**
   * Helper function to retrieve a parameter's name by its unique ID.
   */
  const getParameterNameById = useCallback((id) => {
    const param = parameters.find(p => p.id === parseInt(id));
    return param ? param.name : "Parameter Not Found";
  }, [parameters]);

  const value = {
    parameters,
    loading,
    fetchParameters,
    addParameter,
    editParameter,
    removeParameter,
    getParameterNameById,
  };

  return (
    <ParameterContext.Provider value={value}>
      {children}
    </ParameterContext.Provider>
  );
};

/**
 * Custom hook for easy access to the ParameterContext.
 * Ensures the component is wrapped within a ParameterProvider.
 */
export const useParameter = () => {
    const context = useContext(ParameterContext);
    if (!context) {
        throw new Error("useParameter must be used within a ParameterProvider");
    }
    return context;
};

export default ParameterProvider;