import React, { createContext, useState, useCallback, useContext, useMemo } from 'react';
import { sessionService } from '../services/sessionService';
import FrontendLogger from '../utils/logger';

export const SessionContext = createContext();

const DRAFT_STORAGE_KEY = 'mitamnim_active_workout_draft';
const DRAFT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

export const SessionProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Local Storage Draft Management ---

  const saveDraft = useCallback((draftData) => {
    try {
      const payload = { ...draftData, _timestamp: Date.now() };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      FrontendLogger.error('SESSION_CONTEXT', 'Failed to save session draft to local storage', error);
    }
  }, []);

  const loadDraft = useCallback(() => {
    try {
      const draftStr = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!draftStr) return null;

      const draft = JSON.parse(draftStr);
      const isExpired = (Date.now() - draft._timestamp) > DRAFT_EXPIRY_MS;

      if (isExpired) {
        FrontendLogger.info('SESSION_CONTEXT', 'Session draft expired. Purging from local storage.');
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        return null;
      }

      FrontendLogger.info('SESSION_CONTEXT', 'Recovered active session draft from local storage');
      return draft;
    } catch (error) {
      FrontendLogger.error('SESSION_CONTEXT', 'Failed to parse session draft from local storage', error);
      return null;
    }
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    FrontendLogger.info('SESSION_CONTEXT', 'Session draft cleared from local storage');
  }, []);


  // --- API Communication ---

  const fetchMySessions = useCallback(async () => {
    setLoading(true);
    try {
      FrontendLogger.info('SESSION_CONTEXT', 'Hydrating user workout sessions history');
      const data = await sessionService.getMySessions();
      setSessions(data);
      FrontendLogger.info('SESSION_CONTEXT', `Successfully synchronized ${data.length} sessions`);
    } catch (error) {
      FrontendLogger.error('SESSION_CONTEXT', 'Failed to hydrate sessions registry', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitSession = useCallback(async (sessionData) => {
    setLoading(true);
    try {
      FrontendLogger.info('SESSION_CONTEXT', 'Submitting fat session payload to server');
      const newSession = await sessionService.submitSession(sessionData);
      
      // Add the newly created session to the top of the history list
      setSessions((prev) => [newSession, ...prev]);
      
      // Clean up local states since the session is now safely in the DB
      clearDraft();
      setActiveSession(null);
      
      FrontendLogger.info('SESSION_CONTEXT', 'Fat session successfully mounted to state', { id: newSession.id });
      return newSession;
    } catch (error) {
      FrontendLogger.error('SESSION_CONTEXT', 'Failed to submit fat session', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [clearDraft]);

  const updateSession = useCallback(async (id, sessionData) => {
    setLoading(true);
    try {
      FrontendLogger.info('SESSION_CONTEXT', `Updating existing session ID: ${id}`);
      const updatedSession = await sessionService.updateSession(id, sessionData);
      
      setSessions((prev) => prev.map(s => s.id === id ? { ...s, ...updatedSession } : s));
      
      FrontendLogger.info('SESSION_CONTEXT', `Session ID: ${id} successfully updated in state`);
      return updatedSession;
    } catch (error) {
      FrontendLogger.error('SESSION_CONTEXT', `Failed to update session ID: ${id}`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeSession = useCallback(async (id) => {
    setLoading(true);
    try {
      FrontendLogger.info('SESSION_CONTEXT', `Purging session ID: ${id} from state`);
      await sessionService.deleteSession(id);
      
      setSessions((prev) => prev.filter((s) => s.id !== id));
      
      FrontendLogger.info('SESSION_CONTEXT', `Session ID: ${id} successfully evicted`);
    } catch (error) {
      FrontendLogger.error('SESSION_CONTEXT', `Failed to purge session ID: ${id}`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    sessions,
    activeSession,
    setActiveSession,
    loading,
    fetchMySessions,
    submitSession,
    updateSession,
    removeSession,
    saveDraft,
    loadDraft,
    clearDraft
  }), [
    sessions, activeSession, loading, 
    fetchMySessions, submitSession, updateSession, removeSession,
    saveDraft, loadDraft, clearDraft
  ]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be consumed within a SessionProvider');
  }
  return context;
};