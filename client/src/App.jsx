import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Providers Wrapper
import AppProviders from './components/AppProviders';

// Components & Pages
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import UserPanelPage from './pages/UserPanelPage';
import GroupPanelPage from './pages/GroupPanelPage';
import ExercisePage from './pages/ExercisePage';
import WorkoutTemplatePage from './pages/WorkoutTemplatePage';
import CreateWorkoutTemplatePage from './pages/CreateWorkoutTemplatePage';
import ActiveWorkoutPage from './pages/ActiveWorkoutPage';
import ChatsPage from './pages/ChatsPage';
import SettingsPage from './pages/SettingsPage';
import CoachMessageManager from './pages/CoachMessageManager';
import PersonalStatsPage from './pages/PersonalStatsPage';

function App() {
  return (
    <AppProviders>
      <Router>
        <Navbar />
        <div style={{ direction: 'rtl', padding: '20px' }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Private Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            } />

            <Route path="/exercises" element={
              <ProtectedRoute>
                <ExercisePage />
              </ProtectedRoute>
            } />
            
            <Route path="/exercises/:exerciseId" element={
              <ProtectedRoute>
                <ExercisePage />
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

            <Route path="/workout-templates" element={
              <ProtectedRoute>
                <WorkoutTemplatePage />
              </ProtectedRoute>
            } />

            <Route path="/create-workout-templates" element={
              <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                <CreateWorkoutTemplatePage />
              </ProtectedRoute>
            } />

            <Route path="/active-workouts" element={
              <ProtectedRoute>
                <ActiveWorkoutPage />
              </ProtectedRoute>
            } />

            <Route path="/chats" element={
              <ProtectedRoute>
                <ChatsPage />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />

            <Route path="/coach-messages" element={
                <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                  <CoachMessageManager />
                </ProtectedRoute>
              } 
            />

            <Route path="/stats-page" element={
                <ProtectedRoute>
                  <PersonalStatsPage />
                </ProtectedRoute>
              } 
            />

            <Route path="/stats-page/:userId" element={
                <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                  <PersonalStatsPage />
                </ProtectedRoute>
              } 
            />


          </Routes>
        </div>
      </Router>
    </AppProviders>
  );
}

export default App;