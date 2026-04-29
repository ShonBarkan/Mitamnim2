import React, { createContext, useState, useCallback } from 'react';
import { userService } from '../services/userService';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshUsers = useCallback(async (groupId = null) => {
    setLoading(true);
    try {
      const response = await userService.getGroupUsers(groupId);
      // Ensure we extract data if response is an Axios object
      const data = response.data || response;
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addUser = async (userData) => {
    try {
      const response = await userService.createUser(userData);
      const newUser = response.data || response;
      setUsers((prev) => [...prev, newUser]);
      return newUser;
    } catch (error) {
      console.error("Failed to add user:", error);
      throw error;
    }
  };

  const deleteUser = async (userId) => {
    try {
      await userService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Failed to delete user:", error);
      throw error;
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const response = await userService.updateUser(userId, userData);
      
      /**
       * Crucial: Extract the user data from the Axios response.
       * If your service already returns .data, 'response' is used directly.
       */
      const updatedUser = response.data || response;

      setUsers((prev) => 
        prev.map((u) => (u.id === userId ? updatedUser : u))
      );

      // Return the clean object so AuthContext can update its state
      return updatedUser;
    } catch (error) {
      console.error("Failed to update user:", error);
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