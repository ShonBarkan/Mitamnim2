import { useContext, useEffect } from 'react';
import { MessageContext } from '../contexts/MessageContext';

/**
 * Custom hook to manage messaging logic for a specific target.
 * targetId can be a Group UUID or a User UUID.
 */
export const useMessages = (targetId = null) => {
  const context = useContext(MessageContext);

  if (!context) {
    throw new Error("useMessages must be used within a MessageProvider");
  }

  // Extract relevant state and CRUD methods from the MessageContext
  const { 
    messagesByTarget, 
    fetchHistory, 
    loadingStates, 
    sendMessage, 
    updateMessage, 
    deleteMessage 
  } = context;

  useEffect(() => {
    // Automatically trigger history fetch if a targetId is present 
    // and we haven't loaded this specific conversation's history yet
    if (targetId && !messagesByTarget[targetId]) {
      fetchHistory(targetId);
    }
  }, [targetId, fetchHistory, messagesByTarget]);

  // Safely extract the message list or default to an empty array
  // This prevents runtime errors like "Cannot read property 'map' of undefined"
  const messages = messagesByTarget[targetId] || [];
  const loading = loadingStates[targetId] || false;

  return {
    messages,
    loading,
    sendMessage,
    updateMessage,
    deleteMessage
  };
};