import React, { createContext, useState, useCallback } from 'react';
import { groupService } from '../services/groupService';

export const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await groupService.getGroups();
      setGroups(data);
    } catch (error) {
      console.error("Failed to fetch groups", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addGroup = async (groupData) => {
    const newGroup = await groupService.createGroup(groupData);
    setGroups((prev) => [...prev, newGroup]);
  };

  const deleteGroup = async (groupId) => {
    await groupService.deleteGroup(groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const updateGroup = async (groupId, groupData) => {
    const updated = await groupService.updateGroup(groupId, groupData);
    setGroups((prev) => 
      prev.map((g) => (g.id === groupId ? updated : g))
    );
    return updated;
  };

  return (
    <GroupContext.Provider value={{ 
      groups, 
      loading, 
      refreshGroups, 
      addGroup, 
      updateGroup, // MUST be included here
      deleteGroup 
    }}>
      {children}
    </GroupContext.Provider>
  );
};