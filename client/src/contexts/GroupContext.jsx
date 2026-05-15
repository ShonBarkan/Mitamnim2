import React, { createContext, useState, useCallback } from 'react';
import { groupService } from '../services/groupService';
import { initialData } from '../mock/mockData';

export const GroupContext = createContext();

const IS_DEV = process.env.NODE_ENV === 'development';

export const GroupProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
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
   * Fetches all groups.
   */
  const refreshGroups = useCallback(async () => {
    setLoading(true);
    try {
      if (IS_DEV) {
        await new Promise(resolve => setTimeout(resolve, 400));
        const db = getMockDb();
        setGroups(db.groups);
      } else {
        const response = await groupService.getGroups();
        const data = response.data || response;
        setGroups(data);
      }
    } catch (error) {
      console.error("GroupContext: Failed to fetch groups", error);
    } finally {
      setLoading(false);
    }
  }, [getMockDb]);

  /**
   * Creates a new group.
   */
  const addGroup = async (groupData) => {
    try {
      if (IS_DEV) {
        const db = getMockDb();
        const newGroup = {
          ...groupData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString()
        };
        db.groups.push(newGroup);
        saveMockDb(db);
        setGroups((prev) => [...prev, newGroup]);
        return newGroup;
      } else {
        const response = await groupService.createGroup(groupData);
        const data = response.data || response;
        setGroups((prev) => [...prev, data]);
        return data;
      }
    } catch (error) {
      console.error("GroupContext: Failed to add group", error);
      throw error;
    }
  };

  /**
   * Updates an existing group.
   */
  const updateGroup = async (groupId, groupData) => {
    try {
      let updated;
      if (IS_DEV) {
        const db = getMockDb();
        const index = db.groups.findIndex((g) => g.id === groupId);
        if (index === -1) throw new Error("Group not found in mock DB");

        db.groups[index] = { ...db.groups[index], ...groupData };
        updated = db.groups[index];
        saveMockDb(db);
      } else {
        const response = await groupService.updateGroup(groupId, groupData);
        updated = response.data || response;
      }

      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? updated : g))
      );
      return updated;
    } catch (error) {
      console.error("GroupContext: Failed to update group", error);
      throw error;
    }
  };

  /**
   * Deletes a group.
   */
  const deleteGroup = async (groupId) => {
    try {
      if (IS_DEV) {
        const db = getMockDb();
        db.groups = db.groups.filter((g) => g.id !== groupId);
        saveMockDb(db);
      } else {
        await groupService.deleteGroup(groupId);
      }
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (error) {
      console.error("GroupContext: Failed to delete group", error);
      throw error;
    }
  };

  return (
    <GroupContext.Provider value={{ 
      groups, 
      loading, 
      refreshGroups, 
      addGroup, 
      updateGroup, 
      deleteGroup 
    }}>
      {children}
    </GroupContext.Provider>
  );
};