import React from 'react';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import { UserProvider } from '../contexts/UserContext';
import { GroupProvider } from '../contexts/GroupContext';
import { SocketProvider } from '../contexts/SocketContext';
import { MessageProvider } from '../contexts/MessageContext';
import { ParameterProvider } from '../contexts/ParameterContext';
import { ExerciseProvider } from '../contexts/ExerciseContext';
import { ActiveParamProvider } from '../contexts/ActiveParamContext';
import { ActivityProvider } from '../contexts/ActivityContext';
import { TemplateProvider } from '../contexts/TemplateContext';
import { WorkoutProvider } from '../contexts/WorkoutContext';
import { WorkoutSessionProvider } from '../contexts/WorkoutSessionContext';
import { StatsProvider } from '../contexts/StatsContext';

/**
 * AppProviders Component
 * 
 * Centralizes all Context Providers for the Gingilla project.
 * Maintains a strict hierarchy:
 * 1. Infrastructure (Toast, Auth, User, Group)
 * 2. Real-time Communication (Socket -> Message)
 * 3. Domain Logic (Parameters, Exercises, Stats, etc.)
 */
const AppProviders = ({ children }) => {
  return (
    <ToastProvider>
      <AuthProvider>
        <UserProvider>
          <GroupProvider>
            <SocketProvider>
              <MessageProvider>
                <ParameterProvider>
                  <ExerciseProvider>
                    <StatsProvider>
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
                    </StatsProvider>
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