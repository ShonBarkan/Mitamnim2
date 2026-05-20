import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Providers Wrapper (Injects the complete centralized architecture layer state tree)
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

// Settings Sub-System Workspace Components Mapped Directly To Core Target Modules
import ParameterManager from './components/SettingsPage/ParameterManager';
import TagManager from './components/SettingsPage/TagManager';

/**
 * Main Application Configuration Engine
 * Establishes client-side routing structures, privilege layers, and the core global layout wireframe.
 */
function App() {
  return (
    <AppProviders>
      <Router>
        {/* Navigation bar is decoupled and consistently available across authenticated route sessions */}
        <Navbar />
        
        {/* Unified Viewport Container Layer maintaining Arctic Mirror base configurations */}
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-zinc-200 font-sans antialiased selection:bg-zinc-900 selection:text-white" dir="rtl">
          <Routes>
            {/* Public Authentication Gateways */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Authenticated Global Core Views Nodes */}
            <Route path="/" element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            } />

            {/* Live Instant Communications Real-Time Thread Mesh */}
            <Route path="/chats" element={
              <ProtectedRoute>
                <ChatsPage />
              </ProtectedRoute>
            } />

            {/* Exercise Library - Accessible to all authenticated users */}
            <Route path="/exercises" element={
              <ProtectedRoute>
                <ExerciseManagerPage />
              </ProtectedRoute>
            } />

            {/* Privileged Squad & Accounts Governance Panels */}
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

            {/* Broadcast Sticky Announcement Command Dashboards */}
            <Route path="/coach-messages" element={
              <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                <CoachMessageManager />
              </ProtectedRoute>
            } />

            {/* Re-architected Nested Route Grid for Framework Sub-System Workspaces */}
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                <SettingsPage />
              </ProtectedRoute>
            }>
              {/* Fallback anchor to immediately force redirect onto parameters layout */}
              <Route index element={<Navigate to="parameters" replace />} />
              <Route path="parameters" element={<ParameterManager />} />
              <Route path="tags" element={<TagManager />} />
            </Route>

            {/* Catch-all global route fallback mapping anchors */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AppProviders>
  );
}

export default App;