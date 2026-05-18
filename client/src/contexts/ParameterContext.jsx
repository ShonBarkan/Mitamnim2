import React, { createContext, useState, useCallback, useContext } from 'react';
import { parameterService } from '../services/parameterService';
import FrontendLogger from '../utils/logger';

export const ParameterContext = createContext();

export const ParameterProvider = ({ children }) => {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches all available measurement parameters for the current group perimeter.
   */
  const fetchParameters = useCallback(async () => {
    setLoading(true);
    try {
      FrontendLogger.info('PARAMETER_CONTEXT', 'Initiating group metrics parameter schema synchronization');
      const data = await parameterService.getAll();
      setParameters(data);
      FrontendLogger.info('PARAMETER_CONTEXT', `Successfully synchronized ${data.length} measurement parameters`);
    } catch (error) {
      FrontendLogger.error('PARAMETER_CONTEXT', 'Failed to fetch parameter layout definitions framework', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Evaluates and computes live virtual parameter previews on the client-side for fluid UI feedback.
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
   * Registers a brand new parameter token tracking asset.
   */
  const addParameter = async (paramData) => {
    try {
      FrontendLogger.info('PARAMETER_CONTEXT', `Spawning new system parameter blueprint rule: '${paramData.name}'`);
      const createdParam = await parameterService.create(paramData);
      
      setParameters(prev => [...prev, createdParam]);
      FrontendLogger.info('PARAMETER_CONTEXT', `Parameter token '${paramData.name}' successfully verified and allocated`, createdParam);
      return createdParam;
    } catch (error) {
      FrontendLogger.error('PARAMETER_CONTEXT', `Failed to execute allocation sequence for parameter target rule: '${paramData.name}'`, error);
      throw error;
    }
  };

  /**
   * Updates configuration definitions for an existing parameter matrix.
   */
  const editParameter = async (id, updateData) => {
    try {
      FrontendLogger.info('PARAMETER_CONTEXT', `Mutating structural boundaries configuration for parameter validation node id: ${id}`);
      const updatedParam = await parameterService.update(id, updateData);

      setParameters(prev => prev.map(p => p.id === id ? updatedParam : p));
      FrontendLogger.info('PARAMETER_CONTEXT', `Parameter token id: ${id} successfully re-mapped and synced with layout schemas`);
      return updatedParam;
    } catch (error) {
      FrontendLogger.error('PARAMETER_CONTEXT', `Failed to apply structural mutations on parameter validation asset node target id: ${id}`, error);
      throw error;
    }
  };

  /**
   * Removes a parameter definition token asset from the active tracking schemas.
   */
  const removeParameter = async (id) => {
    try {
      FrontendLogger.info('PARAMETER_CONTEXT', `Requesting absolute destruction chain for parameter validation registry node id: ${id}`);
      await parameterService.delete(id);
      
      setParameters(prev => prev.filter(p => p.id !== id));
      FrontendLogger.info('PARAMETER_CONTEXT', `Parameter record instance row id: ${id} completely flushed from local tracking bounds memory`);
    } catch (error) {
      FrontendLogger.error('PARAMETER_CONTEXT', `Failed to trigger destruction sequence execution layout for target entity record node id: ${id}`, error);
      throw error;
    }
  };

  /**
   * Utility lookup resolving numerical parameter identifiers into clean string tokens.
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

/**
 * Custom hook utility proxying contextual abstraction layers cleanly.
 * Must be consumed strictly within an active ParameterProvider scope wrapper boundary.
 */
export const useParameter = () => {
  const context = useContext(ParameterContext);
  if (!context) {
    throw new Error("useParameter must be consumed strictly within an active ParameterProvider scope wrapper boundary.");
  }
  return context;
};

export default ParameterProvider;