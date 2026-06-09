import api from './api';
import FrontendLogger from '../utils/logger';

export const scheduleService = {
  getSchedule: async (userId, startDate, endDate) => {
    FrontendLogger.info('SCHEDULE_SERVICE', `Fetching schedule for user: ${userId}`);
    try {
      // Ensuring dates are sent in UTC string format to the backend
      const response = await api.get(`/schedule/${userId}`, {
        params: { 
          start_date: startDate.toISOString(), 
          end_date: endDate.toISOString() 
        }
      });
      return response.data;
    } catch (error) {
      FrontendLogger.error('SCHEDULE_SERVICE', `Failed to fetch schedule for user: ${userId}`, error);
      throw error;
    }
  },

  createEvent: async (eventData) => {
    FrontendLogger.info('SCHEDULE_SERVICE', `Creating new schedule event: '${eventData.title}'`);
    try {
      const response = await api.post('/schedule', eventData);
      FrontendLogger.info('SCHEDULE_SERVICE', 'Event successfully created', { id: response.data?.event?.id });
      return response.data;
    } catch (error) {
      FrontendLogger.error('SCHEDULE_SERVICE', `Failed to create event: '${eventData.title}'`, error);
      throw error;
    }
  },

  createGroupEvent: async (groupId, eventData) => {
    FrontendLogger.info('SCHEDULE_SERVICE', `Creating group schedule event for group ID: ${groupId}`);
    try {
      const response = await api.post(`/schedule/group/${groupId}`, eventData);
      FrontendLogger.info('SCHEDULE_SERVICE', `Group events successfully created (${response.data?.total_created} events)`);
      return response.data;
    } catch (error) {
      FrontendLogger.error('SCHEDULE_SERVICE', `Failed to create group events for group ID: ${groupId}`, error);
      throw error;
    }
  },

  updateEvent: async (eventId, eventData) => {
    FrontendLogger.info('SCHEDULE_SERVICE', `Patching schedule event ID: ${eventId}`);
    try {
      const response = await api.put(`/schedule/${eventId}`, eventData);
      FrontendLogger.info('SCHEDULE_SERVICE', 'Event successfully updated');
      return response.data;
    } catch (error) {
      FrontendLogger.error('SCHEDULE_SERVICE', `Failed to update event ID: ${eventId}`, error);
      throw error;
    }
  },

  deleteEvent: async (eventId) => {
    FrontendLogger.info('SCHEDULE_SERVICE', `Purging schedule event ID: ${eventId}`);
    try {
      await api.delete(`/schedule/${eventId}`);
      FrontendLogger.info('SCHEDULE_SERVICE', `Event ID: ${eventId} successfully evicted`);
    } catch (error) {
      FrontendLogger.error('SCHEDULE_SERVICE', `Failed to purge event ID: ${eventId}`, error);
      throw error;
    }
  }
};

export default scheduleService;