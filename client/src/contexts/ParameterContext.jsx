import React, { createContext, useState, useCallback, useContext } from 'react';
import { parameterService } from '../services/parameterService';

export const ParameterContext = createContext();

export const ParameterProvider = ({ children }) => {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);


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

  const removeParameter = async (id) => {
    try {
      await parameterService.delete(id);
      setParameters(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("ParameterContext: Failed to remove parameter:", error);
      throw error;
    }
  };

  const getParameterNameById = useCallback((id) => {
    const param = parameters.find(p => p.id === parseInt(id));
    return param ? param.name : "לא נמצא פרמטר";
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
 */
export const useParameter = () => {
    const context = useContext(ParameterContext);
    if (!context) {
        throw new Error("useParameter must be used within a ParameterProvider");
    }
    return context;
};