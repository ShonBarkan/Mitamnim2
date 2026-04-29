import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { messageService } from '../services/messageService';
import { SocketContext } from './SocketContext';
import { AuthContext } from './AuthContext';

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  
  const [messagesByTarget, setMessagesByTarget] = useState({});
  const [contacts, setContacts] = useState([]); // List of chat contacts
  const [mainMessages, setMainMessages] = useState({ general: null, personal: null });
  const [loadingStates, setLoadingStates] = useState({ history: {}, contacts: false });

  /**
   * Fetches the list of contacts (trainers/trainees from the same group)
   */
  const fetchContacts = useCallback(async () => {
    if (!user) return;
    setLoadingStates(prev => ({ ...prev, contacts: true }));
    try {
      const response = await messageService.getContacts();
      setContacts(response.data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, contacts: false }));
    }
  }, [user]);

  /**
   * Fetches message history for a specific target (User ID or Group ID)
   */
  const fetchHistory = useCallback(async (targetId) => {
    if (!targetId) return;
    
    setLoadingStates(prev => ({ 
      ...prev, 
      history: { ...prev.history, [targetId]: true } 
    }));

    try {
      const response = await messageService.getHistory(targetId);
      setMessagesByTarget(prev => ({
        ...prev,
        [targetId]: response.data
      }));
    } catch (error) {
      console.error(`Error fetching history for ${targetId}:`, error);
    } finally {
      setLoadingStates(prev => ({ 
        ...prev, 
        history: { ...prev.history, [targetId]: false } 
      }));
    }
  }, []);

  /**
   * Fetches sticky/main messages for the announcement board
   */
  const fetchMainMessages = useCallback(async () => {
    try {
      const response = await messageService.getMainMessages();
      const main = { general: null, personal: null };
      response.data.forEach(m => { 
        main[m.message_type] = m; 
      });
      setMainMessages(main);
    } catch (error) {
      console.error("Error fetching main messages:", error);
    }
  }, []);

  const sendMessage = async (type, content, targetId, isMain) => {
    return await messageService.createMessage(content, type, targetId, isMain);
  };

  const updateMessage = async (messageId, content) => {
    return await messageService.updateMessage(messageId, content);
  };

  const deleteMessage = async (messageId) => {
    return await messageService.deleteMessage(messageId);
  };

  /**
   * WebSocket listener for real-time message synchronization
   */
  useEffect(() => {
    if (!socket || !user) return;

    const handleMessage = (event) => {
      const payload = JSON.parse(event.data);
      const { action, data } = payload;

      setMessagesByTarget(prev => {
        let targetKey = null;

        if (data.message_type) {
          // Calculate conversation key: group_id for general, other party's ID for personal
          targetKey = data.message_type === 'general' 
            ? data.group_id 
            : (data.sender_id === user.id ? data.recipient_id : data.sender_id);
        } else {
          // If metadata is missing (e.g., DELETE action), find which conversation contains the message
          targetKey = Object.keys(prev).find(key => 
            prev[key].some(m => m.id === data.id)
          );
        }

        if (!targetKey) return prev;

        const currentList = prev[targetKey] || [];

        switch (action) {
          case "MESSAGE_CREATED":
            if (currentList.some(m => m.id === data.id)) return prev;
            return {
              ...prev,
              [targetKey]: [...currentList, data]
            };

          case "MESSAGE_UPDATED":
            return {
              ...prev,
              [targetKey]: currentList.map(m => m.id === data.id ? { ...m, ...data } : m)
            };

          case "MESSAGE_DELETED":
            return {
              ...prev,
              [targetKey]: currentList.filter(m => m.id !== data.id)
            };

          default:
            return prev;
        }
      });

      // Synchronize announcement board if the message is sticky or deleted
      if (action === "MESSAGE_DELETED" || data.is_main) {
        fetchMainMessages();
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, user, fetchMainMessages]);

  /**
   * Initial data fetch on component mount or user change
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