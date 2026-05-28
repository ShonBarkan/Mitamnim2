import React, { createContext, useState, useCallback, useContext } from 'react';
import { exerciseService } from '../services/exerciseService';
import FrontendLogger from '../utils/logger';

export const ExerciseContext = createContext();

export const ExerciseProvider = ({ children }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      FrontendLogger.info('EXERCISE_CONTEXT', 'Hydrating exercise state from server registry');
      const data = await exerciseService.getAll();
      setExercises(data);
    } catch (error) {
      FrontendLogger.error('EXERCISE_CONTEXT', 'Failed to hydrate exercises', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addExercise = async (exerciseData) => {
    try {
      FrontendLogger.info('EXERCISE_CONTEXT', `Adding new exercise: ${exerciseData.name}`);
      const newExercise = await exerciseService.create(exerciseData);
      setExercises(prev => [...prev, newExercise]);
      return newExercise;
    } catch (error) {
      FrontendLogger.error('EXERCISE_CONTEXT', 'Failed to append new exercise', error);
      throw error;
    }
  };

  const addBulkExercises = async (exercisesData) => {
    try {
      FrontendLogger.info('EXERCISE_CONTEXT', `Ingesting ${exercisesData.length} new exercises via AI bulk operation`);
      const newExercises = await exerciseService.createBulk(exercisesData);
      setExercises(prev => [...prev, ...newExercises]);
      return newExercises;
    } catch (error) {
      FrontendLogger.error('EXERCISE_CONTEXT', 'Failed to perform bulk ingestion', error);
      throw error;
    }
  };

  const editExercise = async (id, exerciseData) => {
    try {
      FrontendLogger.info('EXERCISE_CONTEXT', `Updating exercise ID: ${id}`);
      const updatedExercise = await exerciseService.update(id, exerciseData);
      setExercises(prev => prev.map(e => e.id === id ? updatedExercise : e));
      return updatedExercise;
    } catch (error) {
      FrontendLogger.error('EXERCISE_CONTEXT', `Failed to update exercise ID: ${id}`, error);
      throw error;
    }
  };

  const removeExercise = async (id) => {
    try {
      FrontendLogger.info('EXERCISE_CONTEXT', `Removing exercise ID: ${id}`);
      await exerciseService.delete(id);
      setExercises(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      FrontendLogger.error('EXERCISE_CONTEXT', `Failed to purge exercise ID: ${id}`, error);
      throw error;
    }
  };

  return (
    <ExerciseContext.Provider value={{ 
      exercises, 
      loading, 
      fetchExercises, 
      addExercise, 
      addBulkExercises, 
      editExercise, 
      removeExercise 
    }}>
      {children}
    </ExerciseContext.Provider>
  );
};

export const useExercise = () => useContext(ExerciseContext);