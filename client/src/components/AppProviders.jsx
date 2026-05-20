import React, { useEffect } from 'react';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import { UserProvider } from '../contexts/UserContext';
import { GroupProvider } from '../contexts/GroupContext';
import { SocketProvider } from '../contexts/SocketContext';
import { MessageProvider } from '../contexts/MessageContext';
import { ParameterProvider } from '../contexts/ParameterContext';
import { TagProvider } from '../contexts/TagContext'; // FIXED: Imported the missing group tags context domain row
import FrontendLogger from '../utils/logger';

/**
 * AppProviders Component
 * Centralizes all Context Providers for the Mitamnim application.
 * Order of nesting strictly follows system dependency layers:
 * 1. Infrastructure & Global Safety UI (Toast, Auth)
 * 2. Identity Nodes & Live Sync Streams (User, Group, Socket, Message)
 * 3. Domain Core Repositories & Performance Matrices (Parameter, Tag, Exercise, Template, Workout, Stats)
 */
const AppProviders = ({ children }) => {
  
  useEffect(() => {
    // Audit log to verify global system initialization beats
    FrontendLogger.info('APP_PROVIDERS', 'Bootstrapping global application provider tree matrices');
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <UserProvider>
          <GroupProvider>
            <SocketProvider>
              <MessageProvider>
                <ParameterProvider>
                  <TagProvider> {/* FIXED: Enclosing underlying children components safely inside the active group tags blueprint scope */}
                    {children}
                  </TagProvider>
                </ParameterProvider>
              </MessageProvider>
            </SocketProvider>
          </GroupProvider>
        </UserProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default AppProviders;