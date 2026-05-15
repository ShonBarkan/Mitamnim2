import React, { createContext, useState, useCallback, useContext } from 'react';
import { parameterService } from '../services/parameterService';
import { initialData } from '../mock/mockData';

export const ParameterContext = createContext();

const IS_DEV = process.env.NODE_ENV === 'development';

export const ParameterProvider = ({ children }) => {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Helper to manage local storage for Dev mode
   */
  const getMockDb = useCallback(() => {
    const data = localStorage.getItem('mitamnim2_db');
    if (!data) {
      localStorage.setItem('mitamnim2_db', JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(data);
  }, []);

  const saveMockDb = (db) => {
    localStorage.setItem('mitamnim2_db', JSON.stringify(db));
  };

  /**
   * Fetches all available parameters for the group.
   */
  const fetchParameters = useCallback(async () => {
    setLoading(true);
    try {
      if (IS_DEV) {
        await new Promise(resolve => setTimeout(resolve, 400));
        const db = getMockDb();
        setParameters(db.parameters);
      } else {
        const response = await parameterService.getAll();
        const data = response.data || response;
        setParameters(data);
      }
    } catch (error) {
      console.error("ParameterContext: Failed to fetch parameters:", error);
    } finally {
      setLoading(false);
    }
  }, [getMockDb]);

  /**
   * Logic for calculating virtual parameter values based on source data.
   */
  const calculateVirtualValue = useCallback((param, performanceData) => {
    if (!param.is_virtual || !param.source_parameter_ids) return null;

    const sourceValues = param.source_parameter_ids.map(id => performanceData[id] || 0);

    switch (param.calculation_type) {
      case 'sum':
        return sourceValues.reduce((acc, val) => acc + val, 0) * (param.multiplier || 1);
      case 'divide':
        if (sourceValues[1] === 0) return 0;
        return (sourceValues[0] / sourceValues[1]) * (param.multiplier || 1);
      case 'conversion':
        return (sourceValues[0] || 0) * (param.multiplier || 1);
      case 'percentage':
        if (sourceValues[1] === 0) return 0;
        return (sourceValues[0] / sourceValues[1]) * 100;
      default:
        return null;
    }
  }, []);

  /**
   * Adds a new parameter definition.
   */
  const addParameter = async (data) => {
    try {
      if (IS_DEV) {
        const db = getMockDb();
        const newParam = { 
          ...data, 
          id: Math.floor(Math.random() * 10000) 
        };
        db.parameters.push(newParam);
        saveMockDb(db);
        setParameters(prev => [...prev, newParam]);
        return newParam;
      } else {
        const response = await parameterService.create(data);
        const dataRes = response.data || response;
        setParameters(prev => [...prev, dataRes]);
        return dataRes;
      }
    } catch (error) {
      console.error("ParameterContext: Failed to add parameter:", error);
      throw error;
    }
  };

  /**
   * Updates an existing parameter.
   */
  const editParameter = async (id, data) => {
    try {
      let updated;
      if (IS_DEV) {
        const db = getMockDb();
        const index = db.parameters.findIndex(p => p.id === id);
        if (index === -1) throw new Error("Parameter not found in mock DB");
        
        db.parameters[index] = { ...db.parameters[index], ...data };
        updated = db.parameters[index];
        saveMockDb(db);
      } else {
        const response = await parameterService.update(id, data);
        updated = response.data || response;
      }

      setParameters(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
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
      if (IS_DEV) {
        const db = getMockDb();
        db.parameters = db.parameters.filter(p => p.id !== id);
        saveMockDb(db);
      } else {
        await parameterService.delete(id);
      }
      setParameters(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("ParameterContext: Failed to remove parameter:", error);
      throw error;
    }
  };

  /**
   * Retrieves a parameter's name by its unique ID.
   */
  const getParameterNameById = useCallback((id) => {
    const param = parameters.find(p => p.id === parseInt(id));
    return param ? param.name : "Parameter Not Found";
  }, [parameters]);

  return (
    <ParameterContext.Provider value={{ 
      parameters, 
      loading, 
      fetchParameters, 
      addParameter, 
      editParameter, 
      removeParameter, 
      getParameterNameById,
      calculateVirtualValue
    }}>
      {children}
    </ParameterContext.Provider>
  );
};

export const useParameter = () => {
    const context = useContext(ParameterContext);
    if (!context) {
        throw new Error("useParameter must be used within a ParameterProvider");
    }
    return context;
};

export default ParameterProvider;