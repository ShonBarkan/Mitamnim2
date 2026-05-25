import React, { createContext, useState, useCallback, useContext, useMemo } from 'react';
import { sessionService } from '../services/sessionService';
import FrontendLogger from '../utils/logger';

export const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const startSession = useCallback(async (sessionData) => {
    setLoading(true);
    try {
      FrontendLogger.info('SESSION_CONTEXT', 'Initializing new active session');
      const newSession = await sessionService.startSession(sessionData);
      
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      FrontendLogger.info('SESSION_CONTEXT', 'New session successfully mounted to state', { id: newSession.id });
      return newSession;
    } catch (error) {
      FrontendLogger.error('SESSION_CONTEXT', 'Failed to mount new session', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (id, sessionData) => {
    setLoading(true);
    try {
      FrontendLogger.info('SESSION_CONTEXT', `Updating existing session ID: ${id}`);
      const updatedSession = await sessionService.updateSession(id, sessionData);
      
      setSessions((prev) => prev.map(s => s.id === id ? updatedSession : s));
      
      // Update active session if it is the one being modified
      if (activeSession && activeSession.id === id) {
        setActiveSession(updatedSession);
      }
      
      FrontendLogger.info('SESSION_CONTEXT', `Session ID: ${id} successfully updated in state`);
      return updatedSession;
    } catch (error) {
      FrontendLogger.error('SESSION_CONTEXT', `Failed to update session ID: ${id}`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeSession]);

  const removeSession = useCallback(async (id) => {
    setLoading(true);
    try {
      FrontendLogger.info('SESSION_CONTEXT', `Purging session ID: ${id} from state`);
      await sessionService.deleteSession(id);
      
      setSessions((prev) => prev.filter((s) => s.id !== id));
      
      if (activeSession && activeSession.id === id) {
        setActiveSession(null);
      }
      
      FrontendLogger.info('SESSION_CONTEXT', `Session ID: ${id} successfully evicted`);
    } catch (error) {
      FrontendLogger.error('SESSION_CONTEXT', `Failed to purge session ID: ${id}`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeSession]);

  const value = useMemo(() => ({
    sessions,
    activeSession,
    setActiveSession,
    loading,
    fetchMySessions,
    startSession,
    updateSession,
    removeSession
  }), [sessions, activeSession, loading, fetchMySessions, startSession, updateSession, removeSession]);

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