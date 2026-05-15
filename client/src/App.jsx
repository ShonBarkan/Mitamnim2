import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Providers Wrapper (Injects all updated hybrid contexts)
import AppProviders from './components/AppProviders';

// Components & Pages
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import UserPanelPage from './pages/UserPanelPage';
import GroupPanelPage from './pages/GroupPanelPage';
import WorkoutTemplatePage from './pages/WorkoutTemplatePage';
import CreateWorkoutTemplatePage from './pages/CreateWorkoutTemplatePage';
import ActiveWorkoutPage from './pages/ActiveWorkoutPage';
import ActivityDashboardPage from './pages/ActivityDashboardPage'; // New Hub
import ChatsPage from './pages/ChatsPage';
import SettingsPage from './pages/SettingsPage';
import CoachMessageManager from './pages/CoachMessageManager';
import PersonalStatsPage from './pages/PersonalStatsPage';

/**
 * Main Application Component
 * Defines the routing structure and global layout.
 * Refactored: Removed ExercisePage in favor of ActivityDashboardPage.
 */
function App() {
  return (
    <AppProviders>
      <Router>
        {/* Navigation bar is visible on all routes */}
        <Navbar />
        
        {/* Main Viewport Container with Arctic Mirror base styles */}
        <div className="min-h-screen font-sans antialiased selection:bg-zinc-900 selection:text-white bg-slate-50" dir="rtl">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Private Routes (Protected by AuthContext & ProtectedRoute) */}
            <Route path="/" element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            } />

            {/* Performance Hub: Replaces ExercisePage as the main logging & history view */}
            <Route path="/activity" element={
              <ProtectedRoute>
                <ActivityDashboardPage />
              </ProtectedRoute>
            } />

            {/* Admin/Trainer Access Only: Management Panels */}
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

            {/* Workout & Training Management */}
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

            {/* Communication & Feedback */}
            <Route path="/chats" element={
              <ProtectedRoute>
                <ChatsPage />
              </ProtectedRoute>
            } />

            <Route path="/coach-messages" element={
                <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                  <CoachMessageManager />
                </ProtectedRoute>
              } 
            />

            {/* Analytics, Stats & System Settings */}
            <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                  <SettingsPage />
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

            {/* Fallback can be added here if needed */}
          </Routes>
        </div>
      </Router>
    </AppProviders>
  );
}

export default App;