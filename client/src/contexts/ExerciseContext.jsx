import React, { createContext, useState, useCallback, useMemo } from 'react';
import { exerciseService } from '../services/exerciseService';

export const ExerciseContext = createContext();

export const ExerciseProvider = ({ children }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches all exercises including 'has_children' and 'has_params' flags.
   */
  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const response = await exerciseService.getAll();
      setExercises(response.data);
    } catch (err) {
      console.error("ExerciseContext: Failed to fetch exercises:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Utility: Recursively flattens the tree for hierarchical selectors (Dropdowns).
   * Filters for categories (exercises that have children).
   */
  const getCategoryTree = useCallback((list, parentId = null, depth = 0) => {
    let items = [];
    const categories = list.filter(ex => ex.parent_id === parentId && ex.has_children);

    categories.forEach(cat => {
      items.push({
        id: cat.id,
        name: `${'—'.repeat(depth)} ${cat.name}`,
        depth: depth
      });
      const children = getCategoryTree(list, cat.id, depth + 1);
      items = [...items, ...children];
    });

    return items;
  }, []);

  /**
   * Utility: Recursively finds all leaf nodes (exercises with no children) 
   * under a specific parent ID. Used for populating template banks.
   */
  const getAllLeafDescendants = useCallback((list, pid) => {
    let result = [];
    const children = list.filter(ex => ex.parent_id === pid);
    
    children.forEach(child => {
      if (!child.has_children) {
        result.push(child);
      } else {
        result = [...result, ...getAllLeafDescendants(list, child.id)];
      }
    });
    return result;
  }, []);

  const addExercise = async (data) => {
    try {
      const res = await exerciseService.create(data);
      setExercises(prev => [...prev, res.data]);
      return res.data;
    } catch (err) {
      console.error("ExerciseContext: Failed to add exercise:", err);
      throw err;
    }
  };

  const editExercise = async (id, data) => {
    try {
      const res = await exerciseService.update(id, data);
      setExercises(prev => prev.map(e => e.id === id ? { ...e, ...res.data } : e));
      return res.data;
    } catch (err) {
      console.error("ExerciseContext: Failed to update exercise:", err);
      throw err;
    }
  };

  const removeExercise = async (id) => {
    try {
      await exerciseService.delete(id);
      setExercises(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error("ExerciseContext: Failed to delete exercise:", err);
      throw err;
    }
  };

  // Expose the context values
  const value = {
    exercises,
    loading,
    fetchExercises,
    getCategoryTree,
    getAllLeafDescendants,
    addExercise,
    editExercise,
    removeExercise
  };

  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  );
};