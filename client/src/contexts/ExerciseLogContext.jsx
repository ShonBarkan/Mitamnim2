import React, { createContext, useState, useCallback, useContext, useMemo } from 'react';
import { exerciseLogService } from '../services/exerciseLogService';
import FrontendLogger from '../utils/logger';

export const ExerciseLogContext = createContext();

export const ExerciseLogProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSessionLogs = useCallback(async (sessionId) => {
    setLoading(true);
    try {
      FrontendLogger.info('EXERCISE_LOG_CONTEXT', `Hydrating exercise logs for session ID: ${sessionId}`);
      const data = await exerciseLogService.getSessionLogs(sessionId);
      setLogs(data);
      FrontendLogger.info('EXERCISE_LOG_CONTEXT', `Successfully synchronized ${data.length} logs`);
    } catch (error) {
      FrontendLogger.error('EXERCISE_LOG_CONTEXT', 'Failed to hydrate logs registry', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserLogs = useCallback(async (userId) => {
    setLoading(true);
    try {
      FrontendLogger.info('EXERCISE_LOG_CONTEXT', `Hydrating exercise logs for user ID: ${userId}`);
      const data = await exerciseLogService.getUserLogs(userId);
      setLogs(data);
      FrontendLogger.info('EXERCISE_LOG_CONTEXT', `Successfully synchronized ${data.length} user logs`);
    } catch (error) {
      FrontendLogger.error('EXERCISE_LOG_CONTEXT', 'Failed to hydrate user logs registry', error);
      setLogs([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  const createLog = useCallback(async (logData) => {
    setLoading(true);
    try {
      FrontendLogger.info('EXERCISE_LOG_CONTEXT', `Persisting new log snapshot for: ${logData.exercise_name}`);
      const newLog = await exerciseLogService.createLog(logData);
      
      setLogs((prev) => [...prev, newLog]);
      FrontendLogger.info('EXERCISE_LOG_CONTEXT', 'Log snapshot successfully persisted to state', { id: newLog.id });
      return newLog;
    } catch (error) {
      FrontendLogger.error('EXERCISE_LOG_CONTEXT', 'Failed to persist exercise log', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLog = useCallback(async (id, logData) => {
    setLoading(true);
    try {
      FrontendLogger.info('EXERCISE_LOG_CONTEXT', `Updating existing log ID: ${id}`);
      // The API call passes updated params and/or created_at timestamp
      const updatedLog = await exerciseLogService.updateLog(id, logData);
      
      setLogs((prev) => prev.map(log => log.id === id ? updatedLog : log));
      FrontendLogger.info('EXERCISE_LOG_CONTEXT', `Log ID: ${id} successfully updated in state`);
      return updatedLog;
    } catch (error) {
      FrontendLogger.error('EXERCISE_LOG_CONTEXT', `Failed to update log ID: ${id}`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeLog = useCallback(async (id) => {
    setLoading(true);
    try {
      FrontendLogger.info('EXERCISE_LOG_CONTEXT', `Purging log ID: ${id} from state`);
      await exerciseLogService.deleteLog(id);
      
      setLogs((prev) => prev.filter((log) => log.id !== id));
      FrontendLogger.info('EXERCISE_LOG_CONTEXT', `Log ID: ${id} successfully evicted`);
    } catch (error) {
      FrontendLogger.error('EXERCISE_LOG_CONTEXT', `Failed to purge log ID: ${id}`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearLogsState = useCallback(() => {
    FrontendLogger.info('EXERCISE_LOG_CONTEXT', 'Clearing logs state from memory');
    setLogs([]);
  }, []);

  const value = useMemo(() => ({
    logs,
    loading,
    fetchSessionLogs,
    fetchUserLogs,
    createLog,
    updateLog,
    removeLog,
    clearLogsState
  }), [logs, loading, fetchSessionLogs, fetchUserLogs, createLog, updateLog, removeLog, clearLogsState]);

  return (
    <ExerciseLogContext.Provider value={value}>
      {children}
    </ExerciseLogContext.Provider>
  );
};

export const useExerciseLog = () => {
  const context = useContext(ExerciseLogContext);
  if (!context) {
    throw new Error('useExerciseLog must be consumed within an ExerciseLogProvider');
  }
  return context;
};