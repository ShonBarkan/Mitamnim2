import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Providers
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { UserProvider } from './contexts/UserContext';
import { GroupProvider } from './contexts/GroupContext';
import { MessageProvider } from './contexts/MessageContext';
import { ParameterProvider } from './contexts/ParameterContext';
import { ExerciseProvider } from './contexts/ExerciseContext';
import { ActiveParamProvider } from './contexts/ActiveParamContext';
import { ActivityProvider } from './contexts/ActivityContext';
import { TemplateProvider } from './contexts/TemplateContext';
import { WorkoutProvider } from './contexts/WorkoutContext';




// Components & Pages
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import UserPanelPage from './pages/UserPanelPage';
import GroupPanelPage from './pages/GroupPanelPage';


function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <UserProvider>
          <GroupProvider>
            <SocketProvider>
              <MessageProvider>
                <ParameterProvider>
                  <ExerciseProvider>
                    <ActiveParamProvider>
                      <ActivityProvider>
                        <TemplateProvider>
                          <WorkoutProvider>
                            <Router>
                              <Navbar />
                              <div style={{ direction: 'rtl', padding: '20px' }}>
                                <Routes>
                                  <Route path="/login" element={<LoginPage />} />
                                  
                                  <Route path="/" element={
                                    <ProtectedRoute>
                                      <LandingPage />
                                    </ProtectedRoute>
                                  } />

                                  <Route path="/users" element={
                                    <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                                      <UserPanelPage />
                                    </ProtectedRoute>
                                  } />

                                  <Route path="/groups" element={
                                    <ProtectedRoute allowedRoles={['admin']}>
                                      <GroupPanelPage />
                                    </ProtectedRoute>
                                  } />
                              </Routes>
                            </div>
                            </Router>
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
}

export default App;