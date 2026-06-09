import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Providers Wrapper
import AppProviders from './components/AppProviders';

// Application Structural Layout Components & Guards
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalLoader from './components/common/GlobalLoader';

// Viewport Pages Matrix Pipeline
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import UserPanelPage from './pages/UserPanelPage';
import GroupPanelPage from './pages/GroupPanelPage';
import ChatsPage from './pages/ChatsPage';
import SettingsPage from './pages/SettingsPage';
import CoachMessageManager from './pages/CoachMessageManager';
import ExerciseManagerPage from './pages/ExerciseManagerPage';
import LogDiaryPage from './pages/LogDiaryPage';
// import AthleteStatsPage from './pages/AthleteStatsPage';

// Settings Sub-System Workspace Components
import ParameterManager from './components/SettingsPage/ParameterManager';
import TagManager from './components/SettingsPage/TagManager';

// Workout & Template Ecosystem
import ShowTemplatesPage from './pages/ShowTemplatesPage';
import CreateTemplatePage from './pages/CreateTemplatePage';
import ActiveWorkoutPage from './pages/ActiveWorkoutPage';
import AthleteStatsPage from './pages/AthleteStatsPage';

// Schedule System
import SchedulePage from './pages/SchedulePage';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/users" replace />;
  return <LandingPage />;
}

function App() {
  return (
    <AppProviders>
      <Router>
        <Navbar />
        <GlobalLoader />
        <div className="min-h-screen bg-zinc-50" dir="rtl">
          <Routes>
            {/* Public Authentication Gateways */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes Wrapper */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomeRedirect />} />

              {/* Non-admin authenticated routes */}
              <Route element={<ProtectedRoute allowedRoles={['trainer', 'trainee']} />}>
                <Route path="/chats" element={<ChatsPage />} />
                <Route path="/exercises" element={<ExerciseManagerPage />} />
                <Route path="/templates" element={<ShowTemplatesPage />} />
                <Route path="/ActiveWorkoutPage" element={<ActiveWorkoutPage />} />
                <Route path="/statistics" element={<AthleteStatsPage />} />
                <Route path="/log-diary" element={<LogDiaryPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
              </Route>

              {/* Trainer and admin user management route */}
              <Route element={<ProtectedRoute allowedRoles={['trainer', 'admin']} />}>
                <Route path="/users" element={<UserPanelPage />} />
              </Route>

              {/* Trainer-only management routes */}
              <Route element={<ProtectedRoute allowedRoles={['trainer']} />}>
                <Route path="/templates/create" element={<CreateTemplatePage />} />
                <Route path="/coach-messages" element={<CoachMessageManager />} />
                <Route path="/settings" element={<SettingsPage />}>
                  <Route index element={<Navigate to="parameters" replace />} />
                  <Route path="parameters" element={<ParameterManager />} />
                  <Route path="tags" element={<TagManager />} />
                </Route>
              </Route>

              {/* Admin-only tools */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/groups" element={<GroupPanelPage />} />
              </Route>
            </Route>

            {/* Fallback Gateway */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AppProviders>
  );
}

export default App;