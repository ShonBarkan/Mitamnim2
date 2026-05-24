import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Providers Wrapper
import AppProviders from './components/AppProviders';

// Application Structural Layout Components & Guards
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Viewport Pages Matrix Pipeline
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import UserPanelPage from './pages/UserPanelPage';
import GroupPanelPage from './pages/GroupPanelPage';
import ChatsPage from './pages/ChatsPage';
import SettingsPage from './pages/SettingsPage';
import CoachMessageManager from './pages/CoachMessageManager';
import ExerciseManagerPage from './pages/ExerciseManagerPage';
// import TemplateManagerPage from './pages/TemplateManagerPage';

// Settings Sub-System Workspace Components
import ParameterManager from './components/SettingsPage/ParameterManager';
import TagManager from './components/SettingsPage/TagManager';
import ShowTemplatesPage from './pages/ShowTemplatesPage';
import CreateTemplatePage from './pages/CreateTemplatePage';

function App() {
  return (
    <AppProviders>
      <Router>
        <Navbar />
        <div className="min-h-screen bg-zinc-50" dir="rtl">
          <Routes>
            {/* Public Authentication Gateways */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes Wrapper */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/chats" element={<ChatsPage />} />
              <Route path="/exercises" element={<ExerciseManagerPage />} />
              <Route path="/templates" element={<ShowTemplatesPage />} />

              
              {/* Privileged Coach Tools */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'trainer']} />}>
                {/* <Route path="/templates" element={<TemplateManagerPage />} /> */}
                <Route path="/users" element={<UserPanelPage />} />
                <Route path="/templates/create" element={<CreateTemplatePage />} />
                <Route path="/coach-messages" element={<CoachMessageManager />} />
                <Route path="/settings" element={<SettingsPage />}>
                  <Route index element={<Navigate to="parameters" replace />} />
                  <Route path="parameters" element={<ParameterManager />} />
                  <Route path="tags" element={<TagManager />} />
                </Route>
              </Route>

              {/* Admin Only */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/groups" element={<GroupPanelPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AppProviders>
  );
}

export default App;