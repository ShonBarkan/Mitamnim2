import React, { createContext, useState, useCallback, useContext } from 'react';
import { exerciseService } from '../services/exerciseService';
import FrontendLogger from '../utils/logger';

export const ExerciseContext = createContext();

export const ExerciseProvider = ({ children }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches the flat list of exercises from the unified Group Registry.
   */
  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      FrontendLogger.info('EXERCISE_CONTEXT', 'Initiating group exercise registry synchronization sequence');
      const data = await exerciseService.getAll();
      setExercises(data);
      FrontendLogger.info('EXERCISE_CONTEXT', `Successfully synchronized ${data.length} flat exercises from registry`);
    } catch (err) {
      FrontendLogger.error('EXERCISE_CONTEXT', 'Failed to synchronize exercise registry matrix mapping parameters', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registers a brand new flat exercise token node asset.
   */
  const createExercise = async (exerciseData) => {
    setLoading(true);
    try {
      FrontendLogger.info('EXERCISE_CONTEXT', `Spawning new flat exercise blueprint token: '${exerciseData.name}'`);
      const newExercise = await exerciseService.create(exerciseData);
      
      setExercises(prev => [...prev, newExercise]);
      FrontendLogger.info('EXERCISE_CONTEXT', `Exercise token '${exerciseData.name}' successfully allocated inside local context state`, newExercise);
      return newExercise;
    } catch (err) {
      FrontendLogger.error('EXERCISE_CONTEXT', `Failed to execute allocation sequence for exercise target rule: '${exerciseData.name}'`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates an existing exercise configuration parameters matrix.
   */
  const updateExercise = async (id, updateData) => {
    setLoading(true);
    try {
      FrontendLogger.info('EXERCISE_CONTEXT', `Mutating structural boundaries configuration for exercise target validation node id: ${id}`);
      const updatedExercise = await exerciseService.update(id, updateData);
      
      setExercises(prev => prev.map(ex => ex.id === id ? updatedExercise : ex));
      FrontendLogger.info('EXERCISE_CONTEXT', `Exercise token id: ${id} successfully re-mapped and synced with layout schemas`);
      return updatedExercise;
    } catch (err) {
      FrontendLogger.error('EXERCISE_CONTEXT', `Failed to apply structural mutations on exercise validation asset node target id: ${id}`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Completely evicts an exercise definition registry row from database.
   */
  const deleteExercise = async (id) => {
    setLoading(true);
    try {
      FrontendLogger.info('EXERCISE_CONTEXT', `Requesting absolute destruction chain for exercise validation registry node id: ${id}`);
      await exerciseService.delete(id);
      
      setExercises(prev => prev.filter(ex => ex.id !== id));
      FrontendLogger.info('EXERCISE_CONTEXT', `Exercise record instance row id: ${id} completely flushed from local tracking bounds memory`);
    } catch (err) {
      FrontendLogger.error('EXERCISE_CONTEXT', `Failed to trigger destruction sequence execution layout for target entity record node id: ${id}`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExerciseContext.Provider value={{ 
      exercises, 
      loading, 
      fetchExercises, 
      createExercise, 
      updateExercise, 
      deleteExercise 
    }}>
      {children}
    </ExerciseContext.Provider>
  );
};

/**
 * Custom hook utility proxying contextual abstraction layers cleanly.
 * Must be consumed strictly within an active ExerciseProvider scope wrapper boundary.
 */
export const useExercises = () => {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error('useExercises must be consumed strictly within an active ExerciseProvider scope wrapper boundary.');
  }
  return context;
};