import React, { createContext, useState, useCallback } from 'react';
import { userService } from '../services/userService';
import { initialData } from '../mock/mockData';

export const UserContext = createContext();

const IS_DEV = process.env.NODE_ENV === 'development';

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
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
   * Fetch users for a specific group
   */
  const refreshUsers = useCallback(async (groupId = null) => {
    setLoading(true);
    try {
      if (IS_DEV) {
        // Dev Mode: Filter users from mock database
        await new Promise(resolve => setTimeout(resolve, 500));
        const db = getMockDb();
        const filteredUsers = groupId 
          ? db.users.filter(u => u.group_id === groupId) 
          : db.users;
        setUsers(filteredUsers);
      } else {
        // Prod Mode: Call actual API service
        const response = await userService.getGroupUsers(groupId);
        const data = response.data || response;
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [getMockDb]);

  /**
   * Add a new user
   */
  const addUser = async (userData) => {
    try {
      if (IS_DEV) {
        // Dev Mode: Update mock database
        const db = getMockDb();
        const newUser = { 
          ...userData, 
          id: crypto.randomUUID(), 
          created_at: new Date().toISOString() 
        };
        db.users.push(newUser);
        saveMockDb(db);
        setUsers((prev) => [...prev, newUser]);
        return newUser;
      } else {
        // Prod Mode: Call API
        const response = await userService.createUser(userData);
        const newUser = response.data || response;
        setUsers((prev) => [...prev, newUser]);
        return newUser;
      }
    } catch (error) {
      console.error("Failed to add user:", error);
      throw error;
    }
  };

  /**
   * Update an existing user
   */
  const updateUser = async (userId, userData) => {
    try {
      let updatedUser;
      if (IS_DEV) {
        // Dev Mode: Local update
        const db = getMockDb();
        const index = db.users.findIndex(u => u.id === userId);
        if (index === -1) throw new Error("User not found in mock DB");
        
        db.users[index] = { ...db.users[index], ...userData };
        updatedUser = db.users[index];
        saveMockDb(db);
      } else {
        // Prod Mode: API Update
        const response = await userService.updateUser(userId, userData);
        updatedUser = response.data || response;
      }

      setUsers((prev) => 
        prev.map((u) => (u.id === userId ? updatedUser : u))
      );
      return updatedUser;
    } catch (error) {
      console.error("Failed to update user:", error);
      throw error;
    }
  };

  /**
   * Delete a user
   */
  const deleteUser = async (userId) => {
    try {
      if (IS_DEV) {
        // Dev Mode: Local filter
        const db = getMockDb();
        db.users = db.users.filter(u => u.id !== userId);
        saveMockDb(db);
      } else {
        // Prod Mode: API Delete
        await userService.deleteUser(userId);
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Failed to delete user:", error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ 
      users, 
      loading, 
      refreshUsers, 
      addUser, 
      updateUser, 
      deleteUser 
    }}>
      {children}
    </UserContext.Provider>
  );
};