import { useContext } from 'react';
import { TemplateContext } from '../contexts/TemplateContext';
import { WorkoutContext } from '../contexts/WorkoutContext';

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error("useWorkout must be used within WorkoutProvider");
  return context;
};