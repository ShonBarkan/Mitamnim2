import React from 'react';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import { UserProvider } from '../contexts/UserContext';
import { GroupProvider } from '../contexts/GroupContext';
import { SocketProvider } from '../contexts/SocketContext'; // Restored
import { MessageProvider } from '../contexts/MessageContext';
import { ParameterProvider } from '../contexts/ParameterContext';
import { ExerciseProvider } from '../contexts/ExerciseContext';
import { ActiveParamProvider } from '../contexts/ActiveParamContext';
import { ActivityProvider } from '../contexts/ActivityContext';
import { TemplateProvider } from '../contexts/TemplateContext';
import { WorkoutProvider } from '../contexts/WorkoutContext';
import { WorkoutSessionProvider } from '../contexts/WorkoutSessionContext';

/**
 * AppProviders Component
 * Restored SocketProvider specifically for the messaging system.
 * Hierarchy ensures MessageProvider can access the SocketContext.
 */
const AppProviders = ({ children }) => {
  return (
    <ToastProvider>
      <AuthProvider>
        <UserProvider>
          <GroupProvider>
            {/* SocketProvider must wrap MessageProvider */}
            <SocketProvider>
              <MessageProvider>
                <ParameterProvider>
                  <ExerciseProvider>
                    <ActiveParamProvider>
                      <ActivityProvider>
                        <TemplateProvider>
                          <WorkoutProvider>
                            <WorkoutSessionProvider>
                              {children}
                            </WorkoutSessionProvider>
                          </WorkoutProvider>
                        </TemplateProvider>
                      </ActivityProvider>
                    </ActiveParamProvider>
                  </ExerciseProvider>
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