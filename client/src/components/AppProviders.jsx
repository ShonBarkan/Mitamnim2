import React from 'react';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import { UserProvider } from '../contexts/UserContext';
import { GroupProvider } from '../contexts/GroupContext';
import { SocketProvider } from '../contexts/SocketContext';
import { MessageProvider } from '../contexts/MessageContext';
import { ParameterProvider } from '../contexts/ParameterContext';
import { ExerciseProvider } from '../contexts/ExerciseContext';
import { ActivityProvider } from '../contexts/ActivityContext';
import { TemplateProvider } from '../contexts/TemplateContext';
import { WorkoutProvider } from '../contexts/WorkoutContext';
import { StatsProvider } from '../contexts/StatsContext';

/**
 * AppProviders Component
 * * Centralizes all Context Providers for the Mitamnim2 project.
 * Order of nesting follows dependency logic:
 * 1. Infrastructure & Auth (Toast, Auth)
 * 2. Identity & Connectivity (User, Group, Socket, Message)
 * 3. Domain Logic & Performance Data (Parameter, Exercise, Activity, Template, Workout, Stats)
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
                    <ActivityProvider>
                      <TemplateProvider>
                        <WorkoutProvider>
                          <StatsProvider>
                            {children}
                          </StatsProvider>
                        </WorkoutProvider>
                      </TemplateProvider>
                    </ActivityProvider>
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