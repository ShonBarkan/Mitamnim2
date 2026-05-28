import React, { createContext, useState, useCallback, useContext } from 'react';
import { groupService } from '../services/groupService';
import FrontendLogger from '../utils/logger';

export const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches all groups allocated within the active application scope context.
   */
  const refreshGroups = useCallback(async () => {
    setLoading(true);
    try {
      FrontendLogger.info('GROUP_CONTEXT', 'Initiating group metadata roster synchronization sequence');
      const data = await groupService.getGroups();
      setGroups(data);
      FrontendLogger.info('GROUP_CONTEXT', `Successfully synchronized ${data.length} group profiles within state boundaries`);
    } catch (error) {
      FrontendLogger.error('GROUP_CONTEXT', 'Failed to synchronize group infrastructure metadata records', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Spawns and registers a brand new isolated system group perimeter.
   */
  const addGroup = async (groupData) => {
    setLoading(true);
    try {
      FrontendLogger.info('GROUP_CONTEXT', `Spawning new isolated system group perimeter: '${groupData.name}'`);
      const newGroup = await groupService.createGroup(groupData);
      
      setGroups((prev) => [...prev, newGroup]);
      FrontendLogger.info('GROUP_CONTEXT', `Group entity '${groupData.name}' successfully allocated inside state context layouts`, newGroup);
      return newGroup;
    } catch (error) {
      FrontendLogger.error('GROUP_CONTEXT', `Failed to execute group context allocation sequence for perimeter: '${groupData.name}'`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates structural configuration rules or attribute scopes for an existing group node.
   */
  const updateGroup = async (groupId, groupData) => {
    setLoading(true);
    try {
      FrontendLogger.info('GROUP_CONTEXT', `Mutating structural properties context rules for group target node id: ${groupId}`);
      const updated = await groupService.updateGroup(groupId, groupData);

      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? updated : g))
      );
      FrontendLogger.info('GROUP_CONTEXT', `Group asset validation node id: ${groupId} successfully re-mapped and synced with UI schemas`);
      return updated;
    } catch (error) {
      FrontendLogger.error('GROUP_CONTEXT', `Failed to apply structural parameter updates on group validation asset target id: ${groupId}`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Absolutely flushes a group context row record and evicts downstream relations.
   */
  const deleteGroup = async (groupId) => {
    setLoading(true);
    try {
      FrontendLogger.info('GROUP_CONTEXT', `Requesting absolute destruction sequence for group perimeter node asset id: ${groupId}`);
      await groupService.deleteGroup(groupId);
      
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      FrontendLogger.info('GROUP_CONTEXT', `Group instance row record id: ${groupId} completely dropped from local tracking memory boundaries`);
    } catch (error) {
      FrontendLogger.error('GROUP_CONTEXT', `Failed to trigger absolute destruction chain execution layouts for target group node id: ${groupId}`, error);
      throw error;
    } finally {
      setLoading(false);
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

/**
 * Custom hook utility proxying contextual abstraction layers cleanly.
 * Must be consumed strictly within an active GroupProvider scope wrapper boundary.
 */
export const useGroups = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroups must be consumed strictly within an active GroupProvider scope wrapper boundary.');
  }
  return context;
};

export default GroupProvider;