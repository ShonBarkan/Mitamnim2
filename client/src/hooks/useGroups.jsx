import { useContext } from 'react';
import { GroupContext } from '../contexts/GroupContext';

export const useGroups = () => {
  const context = useContext(GroupContext);
  if (!context) throw new Error("useGroups must be used within a GroupProvider");
  return context;
};