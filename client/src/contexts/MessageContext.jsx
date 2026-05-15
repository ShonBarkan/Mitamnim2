import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { messageService } from '../services/messageService';
import { SocketContext } from './SocketContext';
import { AuthContext } from './AuthContext';
import { initialData } from '../mock/mockData';

export const MessageContext = createContext();

const IS_DEV = process.env.NODE_ENV === 'development';

export const MessageProvider = ({ children }) => {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  
  const [messagesByTarget, setMessagesByTarget] = useState({});
  const [contacts, setContacts] = useState([]); 
  const [mainMessages, setMainMessages] = useState({ general: null, personal: null });
  const [loadingStates, setLoadingStates] = useState({ history: {}, contacts: false });

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
   * Fetches the list of contacts.
   * In Dev: Filters users from the mock DB belonging to the same group.
   */
  const fetchContacts = useCallback(async () => {
    if (!user) return;
    setLoadingStates(prev => ({ ...prev, contacts: true }));
    try {
      if (IS_DEV) {
        await new Promise(resolve => setTimeout(resolve, 400));
        const db = getMockDb();
        // Exclude current user from contacts
        const groupUsers = db.users.filter(u => u.group_id === user.group_id && u.id !== user.id);
        setContacts(groupUsers);
      } else {
        const response = await messageService.getContacts();
        setContacts(response.data || response);
      }
    } catch (error) {
      console.error("MessageContext: Error fetching contacts:", error);
    } finally {
      setLoadingStates(prev => ({ ...prev, contacts: false }));
    }
  }, [user, getMockDb]);

  /**
   * Fetches message history for a target.
   */
  const fetchHistory = useCallback(async (targetId) => {
    if (!targetId || !user) return;
    
    setLoadingStates(prev => ({ 
      ...prev, 
      history: { ...prev.history, [targetId]: true } 
    }));

    try {
      if (IS_DEV) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const db = getMockDb();
        const history = db.messages.filter(m => 
          m.group_id === targetId || // General chat
          m.recipient_id === targetId || // Sent to contact
          (m.sender_id === targetId && m.recipient_id === user.id) // Received from contact
        );
        setMessagesByTarget(prev => ({ ...prev, [targetId]: history }));
      } else {
        const response = await messageService.getHistory(targetId);
        setMessagesByTarget(prev => ({
          ...prev,
          [targetId]: response.data || response
        }));
      }
    } catch (error) {
      console.error(`MessageContext: Error fetching history for ${targetId}:`, error);
    } finally {
      setLoadingStates(prev => ({ 
        ...prev, 
        history: { ...prev.history, [targetId]: false } 
      }));
    }
  }, [user, getMockDb]);

  /**
   * Fetches sticky/main messages for the announcement board.
   */
  const fetchMainMessages = useCallback(async () => {
    if (!user) return;
    try {
      let data = [];
      if (IS_DEV) {
        const db = getMockDb();
        data = db.messages.filter(m => m.is_main && (m.group_id === user.group_id || m.recipient_id === user.id));
      } else {
        const response = await messageService.getMainMessages();
        data = response.data || response;
      }

      const main = { general: null, personal: null };
      data.forEach(m => { 
        main[m.message_type] = m; 
      });
      setMainMessages(main);
    } catch (error) {
      console.error("MessageContext: Error fetching main messages:", error);
    }
  }, [user, getMockDb]);

  /**
   * Sends a message.
   * In Dev: Updates localStorage and immediately updates state.
   */
  const sendMessage = async (type, content, targetId, isMain) => {
    try {
      if (IS_DEV) {
        const db = getMockDb();
        const newMessage = {
          id: crypto.randomUUID(),
          sender_id: user.id,
          recipient_id: type === 'personal' ? targetId : null,
          group_id: type === 'general' ? targetId : user.group_id,
          content,
          message_type: type,
          is_main: isMain,
          created_at: new Date().toISOString()
        };
        
        db.messages.push(newMessage);
        saveMockDb(db);

        // Update local history state immediately in Dev
        setMessagesByTarget(prev => ({
          ...prev,
          [targetId]: [...(prev[targetId] || []), newMessage]
        }));

        if (isMain) fetchMainMessages();
        return newMessage;
      } else {
        return await messageService.createMessage(content, type, targetId, isMain);
      }
    } catch (error) {
      console.error("MessageContext: Send message failed:", error);
      throw error;
    }
  };

  const updateMessage = async (messageId, content) => {
    try {
      if (IS_DEV) {
        const db = getMockDb();
        const index = db.messages.findIndex(m => m.id === messageId);
        if (index !== -1) {
          db.messages[index].content = content;
          saveMockDb(db);
          // Refreshing the UI depends on the current active targetId, 
          // usually handled by state update in the component or manual refresh.
        }
      } else {
        return await messageService.updateMessage(messageId, content);
      }
    } catch (error) {
      console.error("MessageContext: Update message failed:", error);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      if (IS_DEV) {
        const db = getMockDb();
        db.messages = db.messages.filter(m => m.id !== messageId);
        saveMockDb(db);
        fetchMainMessages();
      } else {
        return await messageService.deleteMessage(messageId);
      }
    } catch (error) {
      console.error("MessageContext: Delete message failed:", error);
    }
  };

  /**
   * WebSocket listener (Only active in Production or if socket exists)
   */
  useEffect(() => {
    if (!socket || !user || IS_DEV) return;

    const handleMessage = (event) => {
      const payload = JSON.parse(event.data);
      const { action, data } = payload;

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

export default MessageProvider;