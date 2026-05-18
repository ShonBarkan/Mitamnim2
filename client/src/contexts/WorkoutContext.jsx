import React, { createContext, useState, useCallback, useContext } from 'react';
import { workoutSessionService } from '../services/workoutSessionService';
import FrontendLogger from '../utils/logger';

export const WorkoutContext = createContext();

/**
 * Context provider for managing live workout synchronization pipelines, 
 * performance logs tracking, and dynamic flat schema history logs.
 */
export const WorkoutProvider = ({ children }) => {
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]); // Added to fulfill ActivityDashboard specifications
  const [loading, setLoading] = useState(false); // Unified loading state tracer
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Fetches the authenticated user's completed workout session history array.
   */
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      FrontendLogger.info('WORKOUT_CONTEXT', 'Initiating historic completed workout logs synchronization pipeline');
      const data = await workoutSessionService.getHistory();
      setHistory(data);
      FrontendLogger.info('WORKOUT_CONTEXT', `Successfully synchronized ${data.length} historic workout sessions from database`);
    } catch (err) {
      FrontendLogger.error('WORKOUT_CONTEXT', 'Failed to retrieve synchronized workout history matrix portfolio', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetches isolated/flat historical performance logs or group logs for the dashboard stream.
   * Aligned directly with ActivityDashboardPage component expectations.
   */
  const fetchLogs = useCallback(async (userId = null, isTrainer = false) => {
    setLoading(true);
    try {
      FrontendLogger.info('WORKOUT_CONTEXT', `Syncing unified performance logs pool. Target Trainer Mode: ${isTrainer}`);
      
      // Fetching raw flattened logs context. Re-using history data payload mapped into a flat array structure
      const sessionHistory = await workoutSessionService.getHistory();
      
      // Flat Schema Mapping Strategy: Transposes deep workout structures into single activity log records
      const flattenedLogsPool = [];
      sessionHistory.forEach(session => {
        if (session.performed_exercises) {
          session.performed_exercises.forEach(exercise => {
            flattenedLogsPool.push({
              id: exercise.id,
              user_id: session.user_id,
              user_full_name: session.user_full_name || 'Athlete Member',
              timestamp: session.end_time || session.timestamp || new Date().toISOString(),
              exercise_id: exercise.exercise_id,
              exercise_name: exercise.exercise_name,
              workout_session_id: session.id,
              workout_session_name: session.template_name || 'Personal Workout',
              performance_data: exercise.sets ? exercise.sets.map(s => ({
                parameter_id: s.parameter_id,
                parameter_name: s.parameter_name,
                value: s.value,
                unit: s.unit
              })) : []
            });
          });
        }
      });

      setLogs(flattenedLogsPool);
      FrontendLogger.info('WORKOUT_CONTEXT', `Compiled ${flattenedLogsPool.length} flat performance records streams successfully`);
    } catch (err) {
      FrontendLogger.error('WORKOUT_CONTEXT', 'Failed during linear log matrix ingestion transactions', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Transmits and commits a completed live workout session block to the database perimeter.
   */
  const saveWorkoutSession = async (sessionData) => {
    setIsSaving(true);
    try {
      FrontendLogger.info('WORKOUT_CONTEXT', 'Dispatching active live session payload structural block to network service', sessionData);
      const data = await workoutSessionService.finishWorkout(sessionData);
      
      setHistory(prev => [data, ...prev]);
      FrontendLogger.info('WORKOUT_CONTEXT', 'Live workout session successfully closed, validated and pushed to local history state matrix', data);
      
      // Hot-reload activity feed logs implicitly
      await fetchLogs(null, false);
      return data;
    } catch (err) {
      FrontendLogger.error('WORKOUT_CONTEXT', 'Failed to finalize live session transaction block transmission parameters', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Dispatches manual flat performance entry record directly upstream.
   * Matches core insertion pipelines expected by ActivityCreator components.
   */
  const addLog = async (logPayload) => {
    setIsSaving(true);
    try {
      FrontendLogger.info('WORKOUT_CONTEXT', 'Injecting structural manual log entry element node directly upstream', logPayload);
      
      // Abstracted proxy layout target mapping against session services fallback pipelines
      const response = await workoutSessionService.finishWorkout({
        is_manual_entry: true,
        performed_exercises: [logPayload]
      });
      
      await fetchLogs(null, false);
      return response;
    } catch (err) {
      FrontendLogger.error('WORKOUT_CONTEXT', 'Execution error intercepted during raw log creation sequence', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Patch transaction updating existing specific activity metric entries on localized nodes.
   * Invoked directly within nested ActivityLogEditModal contexts.
   */
  const editLog = async (logId, updatedData) => {
    setIsSaving(true);
    try {
      FrontendLogger.info('WORKOUT_CONTEXT', `Patching performance metric records on log node key index: ${logId}`, updatedData);
      
      // Network pipeline invocation matching remote schema patch requests
      await workoutSessionService.patchLogRecord(logId, updatedData);
      
      // Local reactive update state adjustments safely avoiding full network reload triggers
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, ...updatedData } : l));
      FrontendLogger.info('WORKOUT_CONTEXT', `Successfully validated modification patch sequence transactions on target ID: ${logId}`);
    } catch (err) {
      FrontendLogger.error('WORKOUT_CONTEXT', `Abort issued during editing lifecycle actions pipeline on index node: ${logId}`, err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Destroys an isolated log sequence node completely inside the storage layout arrays.
   * Intercepted from inside internal specialized contextual delete buttons.
   */
  const removeLog = async (logId) => {
    try {
      FrontendLogger.warn('WORKOUT_CONTEXT', `Requesting complete database deletion workflow routing targeted at log ID: ${logId}`);
      
      await workoutSessionService.deleteLogRecord(logId);
      
      setLogs(prev => prev.filter(l => l.id !== logId));
      FrontendLogger.info('WORKOUT_CONTEXT', `Purged log node entity successfully from current active state tree tables.`);
    } catch (err) {
      FrontendLogger.error('WORKOUT_CONTEXT', `Removal routine exception error generated on target structural unit index: ${logId}`, err);
      throw err;
    }
  };

  return (
    <WorkoutContext.Provider value={{ 
      history, 
      logs,
      loading,
      isSaving, 
      fetchHistory, 
      fetchLogs,
      saveWorkoutSession,
      addLog,
      editLog,
      removeLog
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

/**
 * Custom hook utility proxying contextual abstraction layers cleanly.
 * Must be consumed strictly within an active WorkoutProvider scope wrapper boundary.
 */
export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be consumed strictly within an active WorkoutProvider scope wrapper boundary.');
  }
  return context;
};

export default WorkoutProvider;