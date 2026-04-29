import { useContext } from 'react';
import { ActivityContext } from '../contexts/ActivityContext';

/**
 * Custom Hook for accessing activity logs data and methods.
 * Must be used within an ActivityProvider.
 */
export const useActivity = () => {
  const context = useContext(ActivityContext);
  
  if (!context) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  
  return context;
};

export default useActivity;