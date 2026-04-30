import React, { createContext, useState, useCallback } from 'react';
import { exerciseService } from '../services/exerciseService';

export const ExerciseContext = createContext();

/**
 * Provider for managing the exercise tree and its dynamic parameters.
 */
export const ExerciseProvider = ({ children }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches the entire exercise tree for the group.
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
   * Fetches active parameters for a specific exercise.
   * Crucial for retrieving calculation metadata for virtual parameters.
   */
  const fetchActiveParams = useCallback(async (exerciseId) => {
    try {
      const response = await exerciseService.getActiveParams(exerciseId);
      return response.data;
    } catch (err) {
      console.error(`ExerciseContext: Failed to fetch params for exercise ${exerciseId}:`, err);
      return [];
    }
  }, []);

  /**
   * Reconstructs the category path (breadcrumbs) for a given node.
   */
  const getExercisePath = useCallback((exercise, allNodes) => {
    if (!exercise || !allNodes) return "";
    let path = [];
    let current = exercise;

    while (current && current.parent_id) {
      const parent = allNodes.find(n => Number(n.id) === Number(current.parent_id));
      if (parent) {
        path.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }
    return path.join(" > ");
  }, []);

  /**
   * Generates a recursive tree structure for category selection components.
   */
  const getCategoryTree = useCallback((list, parentId = null, depth = 0) => {
    let items = [];
    const categories = list.filter(ex => Number(ex.parent_id) === Number(parentId) && ex.has_children);

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
   * Retrieves all leaf nodes (actual exercises) under a specific category.
   * Enriches leaf nodes with their full category path.
   */
  const getAllLeafDescendants = useCallback((list, pid) => {
    if (!list || list.length === 0) return [];
    
    let result = [];
    const children = list.filter(ex => Number(ex.parent_id) === Number(pid));
    
    children.forEach(child => {
      if (!child.has_children) {
        const enrichedChild = {
          ...child,
          path: getExercisePath(child, list)
        };
        result.push(enrichedChild);
      } else {
        result = [...result, ...getAllLeafDescendants(list, child.id)];
      }
    });
    return result;
  }, [getExercisePath]);

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

  const value = {
    exercises,
    loading,
    fetchExercises,
    fetchActiveParams,
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

export default ExerciseProvider;