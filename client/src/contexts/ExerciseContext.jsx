import React, { createContext, useState, useCallback } from 'react';
import { exerciseService } from '../services/exerciseService';

export const ExerciseContext = createContext();

export const ExerciseProvider = ({ children }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);

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


  const getExercisePath = useCallback((exercise, allNodes) => {
    if (!exercise || !allNodes) return "";
    let path = [];
    let current = exercise;

    // Traverse up the tree using parent_id
    while (current && current.parent_id) {
      const parent = allNodes.find(n => n.id == current.parent_id);
      if (parent) {
        path.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }
    return path.join(" > ");
  }, []);


  const getCategoryTree = useCallback((list, parentId = null, depth = 0) => {
    let items = [];
    const categories = list.filter(ex => ex.parent_id == parentId && ex.has_children);

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


  const getAllLeafDescendants = useCallback((list, pid) => {
    if (!list || list.length === 0) return [];
    
    let result = [];
    // Use loose equality (==) for robust ID matching
    const children = list.filter(ex => ex.parent_id == pid);
    
    children.forEach(child => {
      if (!child.has_children) {
        // Enrich the leaf node with its path before adding
        const enrichedChild = {
          ...child,
          path: getExercisePath(child, list)
        };
        result.push(enrichedChild);
      } else {
        // Keep searching deeper
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