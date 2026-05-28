import React, { createContext, useState, useCallback, useContext } from 'react';
import { userService } from '../services/userService';
import FrontendLogger from '../utils/logger';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches users belonging to the active group perimeter scope context.
   */
  const refreshUsers = useCallback(async (groupId = null) => {
    setLoading(true);
    try {
      FrontendLogger.info('USER_CONTEXT', 'Initiating group roster synchronization pipeline', { groupId });
      const data = await userService.getGroupUsers(groupId);
      setUsers(data);
      FrontendLogger.info('USER_CONTEXT', `Successfully synchronized ${data.length} users within current state boundaries`);
    } catch (error) {
      FrontendLogger.error('USER_CONTEXT', 'Failed to synchronize group user directory registry mappings', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Allocates and registers a brand new user account profile node inside the cluster pool.
   */
  const addUser = async (userData) => {
    setLoading(true);
    try {
      FrontendLogger.info('USER_CONTEXT', `Spawning new user registration token for username: '${userData.username}'`);
      const newUser = await userService.createUser(userData);
      
      setUsers((prev) => [...prev, newUser]);
      FrontendLogger.info('USER_CONTEXT', `User account profile token successfully allocated in local state`, newUser);
      return newUser;
    } catch (error) {
      FrontendLogger.error('USER_CONTEXT', `Failed to execute user account allocation pipeline for: '${userData.username}'`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates configuration attributes for an existing registered user profile node.
   */
  const updateUser = async (userId, userData) => {
    setLoading(true);
    try {
      FrontendLogger.info('USER_CONTEXT', `Mutating profile identity parameter layout constraints for user id: ${userId}`);
      const updatedUser = await userService.updateUser(userId, userData);

      setUsers((prev) => 
        prev.map((u) => (u.id === userId ? updatedUser : u))
      );
      FrontendLogger.info('USER_CONTEXT', `User entity node id: ${userId} successfully re-mapped and synchronized with state bounds`);
      return updatedUser;
    } catch (error) {
      FrontendLogger.error('USER_CONTEXT', `Failed to commit structural updates across user profile target node id: ${userId}`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Absolutely evicts a user security identity registration row asset from schemas.
   */
  const deleteUser = async (userId) => {
    setLoading(true);
    try {
      FrontendLogger.info('USER_CONTEXT', `Requesting absolute destruction chain execution against user target node id: ${userId}`);
      await userService.deleteUser(userId);
      
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      FrontendLogger.info('USER_CONTEXT', `User record instance asset row id: ${userId} completely dropped from tracking memory bounds`);
    } catch (error) {
      FrontendLogger.error('USER_CONTEXT', `Failed to trigger destruction sequence execution context for target profile user id: ${userId}`, error);
      throw error;
    } finally {
      setLoading(false);
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

/**
 * Custom hook utility proxying contextual abstraction layers cleanly.
 * Must be consumed strictly within an active UserProvider scope wrapper boundary.
 */
export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUsers must be consumed strictly within an active UserProvider scope wrapper boundary.');
  }
  return context;
};

export default UserProvider;