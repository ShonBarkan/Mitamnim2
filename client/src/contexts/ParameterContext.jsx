import React, { createContext, useState, useCallback } from 'react';
import { parameterService } from '../services/parameterService';

export const ParameterContext = createContext();

export const ParameterProvider = ({ children }) => {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch parameters belonging to the user's group
  const fetchParameters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await parameterService.getAll();
      setParameters(response.data);
    } catch (error) {
      console.error("Failed to fetch parameters:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new parameter linked to a specific group
  const addParameter = async (data) => {
    try {
      const response = await parameterService.create(data);
      setParameters(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error("Failed to add parameter:", error);
      throw error;
    }
  };

  // Update an existing parameter
  const editParameter = async (id, data) => {
    try {
      const response = await parameterService.update(id, data);
      setParameters(prev => prev.map(p => p.id === id ? response.data : p));
      return response.data;
    } catch (error) {
      console.error("Failed to edit parameter:", error);
      throw error;
    }
  };

  // Delete a parameter
  const removeParameter = async (id) => {
    try {
      await parameterService.delete(id);
      setParameters(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Failed to remove parameter:", error);
      throw error;
    }
  };

  return (
    <ParameterContext.Provider value={{ 
      parameters, 
      loading, 
      fetchParameters, 
      addParameter, 
      editParameter, 
      removeParameter 
    }}>
      {children}
    </ParameterContext.Provider>
  );
};