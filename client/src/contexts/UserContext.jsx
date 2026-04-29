import React, { createContext, useState, useCallback } from 'react';
import { userService } from '../services/userService';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshUsers = useCallback(async (groupId = null) => {
    setLoading(true);
    try {
      const data = await userService.getGroupUsers(groupId);
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addUser = async (userData) => {
    const newUser = await userService.createUser(userData);
    setUsers((prev) => [...prev, newUser]);
  };

  const deleteUser = async (userId) => {
    await userService.deleteUser(userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const updateUser = async (userId, userData) => {
    const updatedUser = await userService.updateUser(userId, userData);
    setUsers((prev) => 
      prev.map((u) => (u.id === userId ? updatedUser : u))
    );
    return updatedUser;
  };

 return (
    <UserContext.Provider value={{ 
      users, 
      loading, 
      refreshUsers, 
      addUser, 
      updateUser, // Exposed to the app
      deleteUser 
    }}>
      {children}
    </UserContext.Provider>
  );
};