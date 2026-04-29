import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { messageService } from '../services/messageService';
import { SocketContext } from './SocketContext';
import { AuthContext } from './AuthContext';

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  
  // State: object where keys are targetIds (UUIDs) and values are arrays of message objects
  const [messagesByTarget, setMessagesByTarget] = useState({});
  // State for sticky banners (general group banner and personal banner)
  const [mainMessages, setMainMessages] = useState({ general: null, personal: null });
  // Tracking loading status for each specific targetId
  const [loadingStates, setLoadingStates] = useState({});

  // Fetch message history for a specific target (Group UUID or User UUID)
  const fetchHistory = useCallback(async (targetId) => {
    if (!targetId) return;
    
    setLoadingStates(prev => ({ ...prev, [targetId]: true }));
    try {
      const response = await messageService.getHistory(targetId);
      setMessagesByTarget(prev => ({
        ...prev,
        [targetId]: response.data
      }));
    } catch (error) {
      console.error(`Error fetching history for ${targetId}:`, error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [targetId]: false }));
    }
  }, []);

  // Fetch initial sticky messages for banners
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

  // CRUD Actions: Send, Update, and Delete wrappers for messageService
  const sendMessage = async (type, content, targetId, isMain) => {
    return await messageService.createMessage(content, type, targetId, isMain);
  };

  const updateMessage = async (messageId, content) => {
    return await messageService.updateMessage(messageId, content);
  };

  const deleteMessage = async (messageId) => {
    return await messageService.deleteMessage(messageId);
  };

  // Centralized WebSocket event handler
  useEffect(() => {
    if (!socket || !user) return;

    const handleMessage = (event) => {
      const payload = JSON.parse(event.data);
      const { action, data } = payload;

      // Determine the targetKey to find the correct "folder" in messagesByTarget
      // For general: key is the group_id
      // For personal: key is the ID of the other participant
      const targetKey = data.message_type === 'general' 
        ? data.group_id 
        : (data.sender_id === user.id ? data.recipient_id : data.sender_id);

      if (!targetKey) return;

      setMessagesByTarget(prev => {
        const currentList = prev[targetKey] || [];

        switch (action) {
          case "MESSAGE_CREATED":
            // Avoid adding a message already in the list (prevents API/WS race conditions)
            if (currentList.some(m => m.id === data.id)) return prev;
            return {
              ...prev,
              [targetKey]: [...currentList, data]
            };

          case "MESSAGE_UPDATED":
            // Update the specific message within the relevant list
            return {
              ...prev,
              [targetKey]: currentList.map(m => m.id === data.id ? { ...m, ...data } : m)
            };

          case "MESSAGE_DELETED":
            // Remove the deleted message from the relevant list
            return {
              ...prev,
              [targetKey]: currentList.filter(m => m.id !== data.id)
            };

          default:
            return prev;
        }
      });

      // Synchronize sticky banners if the modified message affects current main messages
      const isCurrentlyMain = mainMessages.general?.id === data.id || mainMessages.personal?.id === data.id;
      if (data.is_main || isCurrentlyMain || action === "MESSAGE_DELETED") {
        fetchMainMessages();
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, user, fetchMainMessages, mainMessages]);

  return (
    <MessageContext.Provider value={{ 
      messagesByTarget, 
      mainMessages, 
      setMainMessages,
      fetchHistory, 
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