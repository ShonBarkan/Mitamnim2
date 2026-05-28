import api from './api';
import FrontendLogger from '../utils/logger';

export const messageService = {
  /**
   * Get sticky/main messages for the landing page banners.
   * Path: GET /messages/main
   */
  getMainMessages: async () => {
    FrontendLogger.info('MESSAGE', 'Fetching pinned main announcements for group dashboard banners');
    const response = await api.get('/messages/main');
    return response.data;
  },

  /**
   * Get history for a specific group channel or personal direct chat.
   * Path: GET /messages/history/{targetId}
   */
  getHistory: async (targetId) => {
    FrontendLogger.info('MESSAGE', `Extracting conversation timeline stream history for target context id: ${targetId}`);
    const response = await api.get(`/messages/history/${targetId}`);
    return response.data;
  },

  /**
   * Fetch authorized communication contacts for the current user within their group boundaries.
   * Path: GET /messages/contacts
   */
  getContacts: async () => {
    FrontendLogger.info('MESSAGE', 'Querying authorized messaging contact framework directory');
    const response = await api.get('/messages/contacts');
    return response.data;
  },

  /**
   * Create and dispatch a new message (General Group announcement or Personal DM).
   * Path: POST /messages
   */
  createMessage: async (content, type, targetId, isMain = false) => {
    const payload = {
      content,
      message_type: type,
      is_main: isMain,
      [type === 'general' ? 'group_id' : 'recipient_id']: targetId
    };
    
    FrontendLogger.info('MESSAGE', `Dispatching new communication message token (${type}) to target: ${targetId}`, payload);
    const response = await api.post('/messages', payload);
    return response.data;
  },

  /**
   * Update an existing message content text.
   * Path: PATCH /messages/{messageId}
   */
  updateMessage: async (messageId, content) => {
    FrontendLogger.info('MESSAGE', `Mutating content string properties for message record target id: ${messageId}`);
    const response = await api.patch(`/messages/${messageId}`, { content });
    return response.data;
  },

  /**
   * Completely delete a message record asset from the system.
   * Path: DELETE /messages/{messageId}
   */
  deleteMessage: async (messageId) => {
    FrontendLogger.info('MESSAGE', `Purging message entity registration row asset from schemas, id: ${messageId}`);
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  }
};

export default messageService;