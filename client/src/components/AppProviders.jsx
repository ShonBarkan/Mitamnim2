import React, { useEffect } from 'react';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import { UserProvider } from '../contexts/UserContext';
import { GroupProvider } from '../contexts/GroupContext';
import { SocketProvider } from '../contexts/SocketContext';
import { MessageProvider } from '../contexts/MessageContext';
import { ParameterProvider } from '../contexts/ParameterContext';
import { TagProvider } from '../contexts/TagContext';
import { ExerciseProvider } from '../contexts/ExerciseContext';
import { TemplateProvider } from '../contexts/TemplateContext'; // הוספת ה-Provider החדש
import FrontendLogger from '../utils/logger';

/**
 * AppProviders Component
 * Centralizes all Context Providers for the Mitamnim application.
 */
const AppProviders = ({ children }) => {
  
  useEffect(() => {
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
                  <TagProvider>
                    <ExerciseProvider>
                      <TemplateProvider>
                        {children}
                      </TemplateProvider>
                    </ExerciseProvider>
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