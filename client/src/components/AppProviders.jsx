import React, { useEffect } from 'react';
import { ToastProvider } from '../contexts/ToastContext';
import { LoadingProvider } from '../contexts/LoadingContext';
import { AuthProvider } from '../contexts/AuthContext';
import { UserProvider } from '../contexts/UserContext';
import { GroupProvider } from '../contexts/GroupContext';
import { SocketProvider } from '../contexts/SocketContext';
import { MessageProvider } from '../contexts/MessageContext';
import { ParameterProvider } from '../contexts/ParameterContext';
import { TagProvider } from '../contexts/TagContext';
import { ExerciseProvider } from '../contexts/ExerciseContext';
import { TemplateProvider } from '../contexts/TemplateContext';
import FrontendLogger from '../utils/logger';
import { SessionProvider } from '../contexts/SessionContext';
import { ExerciseLogProvider } from '../contexts/ExerciseLogContext';
import { DashboardConfigProvider } from '../contexts/DashboardConfigContext';
import { StatisticsProvider } from '../contexts/StatisticsContext';

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
      <LoadingProvider>
      <AuthProvider>
        <UserProvider>
          <GroupProvider>
            <SocketProvider>
              <MessageProvider>
                <ParameterProvider>
                  <TagProvider>
                    <ExerciseProvider>
                      <TemplateProvider>
                        <SessionProvider>
                          <ExerciseLogProvider>
                            <DashboardConfigProvider>
                              <StatisticsProvider>
                                {children}
                              </StatisticsProvider>
                            </DashboardConfigProvider>
                          </ExerciseLogProvider>
                        </SessionProvider>
                      </TemplateProvider>
                    </ExerciseProvider>
                  </TagProvider>
                </ParameterProvider>
              </MessageProvider>
            </SocketProvider>
          </GroupProvider>
        </UserProvider>
      </AuthProvider>
      </LoadingProvider>
    </ToastProvider>
  );
};

export default AppProviders;