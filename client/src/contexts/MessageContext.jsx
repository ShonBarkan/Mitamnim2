import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { messageService } from '../services/messageService';
import { SocketContext } from './SocketContext';
import { AuthContext } from './AuthContext';
import FrontendLogger from '../utils/logger';

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  
  const [messagesByTarget, setMessagesByTarget] = useState({});
  const [contacts, setContacts] = useState([]); 
  const [mainMessages, setMainMessages] = useState({ general: null, personal: null });
  const [loadingStates, setLoadingStates] = useState({ history: {}, contacts: false });

  /**
   * Fetches the list of authorized communication contacts within the group scope.
   */
  const fetchContacts = useCallback(async () => {
    if (!user) return;
    setLoadingStates(prev => ({ ...prev, contacts: true }));
    try {
      FrontendLogger.info('MESSAGE_CONTEXT', 'Fetching verified contact directory from network service');
      const data = await messageService.getContacts();
      setContacts(data);
    } catch (error) {
      FrontendLogger.error('MESSAGE_CONTEXT', 'Error fetching message directory contacts roster', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, contacts: false }));
    }
  }, [user]);

  /**
   * Fetches the complete message stream history matrix for a specific target ID.
   */
  const fetchHistory = useCallback(async (targetId) => {
    if (!targetId || !user) return;
    
    setLoadingStates(prev => ({ 
      ...prev, 
      history: { ...prev.history, [targetId]: true } 
    }));

    try {
      FrontendLogger.info('MESSAGE_CONTEXT', `Syncing historical conversation timeline for target channel node: ${targetId}`);
      const data = await messageService.getHistory(targetId);
      setMessagesByTarget(prev => ({
        ...prev,
        [targetId]: data
      }));
    } catch (error) {
      FrontendLogger.error(`MESSAGE_CONTEXT`, `Failed to retrieve sync metrics history for target node ${targetId}`, error);
    } finally {
      setLoadingStates(prev => ({ 
        ...prev, 
        history: { ...prev.history, [targetId]: false } 
      }));
    }
  }, [user]);

  /**
   * Fetches sticky/main broadcast announcements for the landing dashboard panel.
   */
  const fetchMainMessages = useCallback(async () => {
    if (!user) return;
    try {
      FrontendLogger.info('MESSAGE_CONTEXT', 'Querying active sticky announcement configurations portfolio');
      const data = await messageService.getMainMessages();

      const main = { general: null, personal: null };
      data.forEach(m => { 
        main[m.message_type] = m; 
      });
      setMainMessages(main);
    } catch (error) {
      FrontendLogger.error('MESSAGE_CONTEXT', 'Error parsing landing system banner main messages payload', error);
    }
  }, [user]);

  /**
   * Dispatches and stores an outbound communication transmission payload packet.
   */
  const sendMessage = async (type, content, targetId, isMain) => {
    try {
      FrontendLogger.info('MESSAGE_CONTEXT', `Dispatching outbound payload block [Type: ${type}] to destination node: ${targetId}`);
      const result = await messageService.createMessage(content, type, targetId, isMain);
      return result;
    } catch (error) {
      FrontendLogger.error('MESSAGE_CONTEXT', `Failed to pipeline outbound message token transmission to target: ${targetId}`, error);
      throw error;
    }
  };

  /**
   * Mutates the inner content string properties of an existing message node.
   */
  const updateMessage = async (messageId, content) => {
    try {
      FrontendLogger.info('MESSAGE_CONTEXT', `Transmitting content string mutations for message asset entity id: ${messageId}`);
      return await messageService.updateMessage(messageId, content);
    } catch (error) {
      FrontendLogger.error('MESSAGE_CONTEXT', `Failed to finalize message content node update for target id: ${messageId}`, error);
    }
  };

  /**
   * Evicts a message validation row record asset from the system.
   */
  const deleteMessage = async (messageId) => {
    try {
      FrontendLogger.info('MESSAGE_CONTEXT', `Triggering structural destruction validation call for message asset id: ${messageId}`);
      return await messageService.deleteMessage(messageId);
    } catch (error) {
      FrontendLogger.error('MESSAGE_CONTEXT', `Failed to apply absolute eviction sequences for target message id: ${messageId}`, error);
    }
  };

  /**
   * Real-time WebSocket packet pipeline interceptor loop listener.
   */
  useEffect(() => {
    if (!socket || !user) return;

    const handleMessage = (event) => {
      const payload = JSON.parse(event.data);
      const { action, data } = payload;

      // Filter non-message events safely
      if (!action || !action.startsWith("MESSAGE_")) return;

      FrontendLogger.socket(`Inbound live real-time payload action block intercepted: ${action}`, data);

      setMessagesByTarget(prev => {
        let targetKey = null;
        if (data.message_type) {
          targetKey = data.message_type === 'general' 
            ? data.group_id 
            : (data.sender_id === user.id ? data.recipient_id : data.sender_id);
        } else {
          targetKey = Object.keys(prev).find(key => 
            prev[key].some(m => m.id === data.id)
          );
        }

        if (!targetKey) return prev;
        const currentList = prev[targetKey] || [];

        switch (action) {
          case "MESSAGE_CREATED":
            if (currentList.some(m => m.id === data.id)) return prev;
            return { ...prev, [targetKey]: [...currentList, data] };
          case "MESSAGE_UPDATED":
            return { ...prev, [targetKey]: currentList.map(m => m.id === data.id ? { ...m, ...data } : m) };
          case "MESSAGE_DELETED":
            return { ...prev, [targetKey]: currentList.filter(m => m.id !== data.id) };
          default:
            return prev;
        }
      });

      if (action === "MESSAGE_DELETED" || data.is_main) {
        fetchMainMessages();
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, user, fetchMainMessages]);

  /**
   * Lifecycle trigger executing profile boot sync variables.
   */
  useEffect(() => {
    if (user) {
      fetchContacts();
      fetchMainMessages();
    }
  }, [user, fetchContacts, fetchMainMessages]);

  return (
    <MessageContext.Provider value={{ 
      messagesByTarget, 
      contacts,
      mainMessages, 
      setMainMessages,
      fetchHistory, 
      fetchContacts,
      fetchMainMessages,
      sendMessage,
      updateMessage,
      deleteMessage,
      loadingStates 
    }}>
      {children}
    </MessageContext.Provider>
  );
};

/**
 * Custom hook utility proxying contextual abstraction layers cleanly.
 * Must be consumed strictly within an active MessageProvider scope wrapper boundary.
 */
export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be consumed strictly within an active MessageProvider scope wrapper boundary.');
  }
  return context;
};

export default MessageProvider;