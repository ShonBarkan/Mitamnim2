import React, { createContext, useState, useCallback } from 'react';
import { exerciseService } from '../services/exerciseService';
import { initialData } from '../mock/mockData';

export const ExerciseContext = createContext();

const IS_DEV = process.env.NODE_ENV === 'development';

export const ExerciseProvider = ({ children }) => {
  const [exercises, setExercises] = useState([]); // Now a flat list from registry
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
   * Fetches the flat list of exercises from the Group Registry.
   * This replaces the old recursive tree fetch.
   */
  const fetchExercises = useCallback(async (groupId) => {
    setLoading(true);
    try {
      if (IS_DEV) {
        await new Promise(resolve => setTimeout(resolve, 400));
        const db = getMockDb();
        // Filters registry by group_id
        const registry = db.group_exercise_registry.filter(ex => ex.group_id === groupId);
        setExercises(registry);
      } else {
        const response = await exerciseService.getRegistry(groupId);
        setExercises(response.data || response);
      }
    } catch (err) {
      console.error("ExerciseContext: Failed to fetch registry:", err);
    } finally {
      setLoading(false);
    }
  }, [getMockDb]);

  /**
   * Retrieves the last parameter snapshot for a specific exercise name.
   * Used to auto-fill parameters when a trainer selects an exercise.
   */
  const getExerciseParams = useCallback(async (exerciseName, groupId) => {
    try {
      if (IS_DEV) {
        const db = getMockDb();
        const entry = db.group_exercise_registry.find(
          ex => ex.exercise_name === exerciseName && ex.group_id === groupId
        );
        return entry ? entry.last_params_snapshot : null;
      } else {
        const response = await exerciseService.getParamsSnapshot(exerciseName, groupId);
        return response.data || response;
      }
    } catch (err) {
      console.error("ExerciseContext: Failed to fetch params snapshot:", err);
      return null;
    }
  }, [getMockDb]);

  /**
   * Renames an exercise and performs a bulk update across logs and templates.
   * This is the "Merge/Repair" logic.
   */
  const renameExercise = async (groupId, oldName, newName) => {
    setLoading(true);
    try {
      if (IS_DEV) {
        const db = getMockDb();

        // 1. Update Registry
        db.group_exercise_registry = db.group_exercise_registry.map(ex => 
          (ex.exercise_name === oldName && ex.group_id === groupId) 
          ? { ...ex, exercise_name: newName } 
          : ex
        );

        // 2. Update Activity Logs
        db.activity_logs = db.activity_logs.map(log => 
          log.exercise_name === oldName ? { ...log, exercise_name: newName } : log
        );

        // 3. Update Workout Templates (exercises_config JSON)
        db.workout_templates = db.workout_templates.map(tpl => {
          if (tpl.group_id === groupId && tpl.exercises_config) {
            const updatedConfig = tpl.exercises_config.map(ex => 
              ex.exercise_name === oldName ? { ...ex, exercise_name: newName } : ex
            );
            return { ...tpl, exercises_config: updatedConfig };
          }
          return tpl;
        });

        saveMockDb(db);
        setExercises(db.group_exercise_registry.filter(ex => ex.group_id === groupId));
      } else {
        await exerciseService.rename(groupId, oldName, newName);
        await fetchExercises(groupId);
      }
    } catch (err) {
      console.error("ExerciseContext: Rename/Merge failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes an exercise entry from the registry (Wipes the "memory" of it).
   */
  const removeExerciseFromRegistry = async (groupId, exerciseName) => {
    try {
      if (IS_DEV) {
        const db = getMockDb();
        db.group_exercise_registry = db.group_exercise_registry.filter(
          ex => !(ex.exercise_name === exerciseName && ex.group_id === groupId)
        );
        saveMockDb(db);
        setExercises(prev => prev.filter(ex => ex.exercise_name !== exerciseName));
      } else {
        await exerciseService.deleteFromRegistry(groupId, exerciseName);
        setExercises(prev => prev.filter(ex => ex.exercise_name !== exerciseName));
      }
    } catch (err) {
      console.error("ExerciseContext: Failed to delete from registry:", err);
      throw err;
    }
  };

  return (
    <ExerciseContext.Provider value={{ 
      exercises, 
      loading, 
      fetchExercises, 
      getExerciseParams, 
      renameExercise, 
      removeExerciseFromRegistry 
    }}>
      {children}
    </ExerciseContext.Provider>
  );
};

export default ExerciseProvider;