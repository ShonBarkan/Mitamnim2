import api from './api';

export const messageService = {
  // Get sticky/main messages for the landing page banners
  getMainMessages: () => api.get('/messages/main'),

  // Get history for a specific group or personal chat
  getHistory: (targetId) => api.get(`/messages/history/${targetId}`),

  // Fetch authorized contacts for the current user within their group
  getContacts: () => api.get('/messages/contacts'),

  // Create a new message (General or Personal)
  createMessage: (content, type, targetId, isMain = false) => {
    const payload = {
      content,
      message_type: type,
      is_main: isMain,
      [type === 'general' ? 'group_id' : 'recipient_id']: targetId
    };
    return api.post('/messages/', payload);
  },

  // Update an existing message content
  updateMessage: (messageId, content) => api.patch(`/messages/${messageId}`, { content }),

  // Delete a message by its UUID
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`)
};