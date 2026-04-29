import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import { useTemplates } from '../hooks/useTemplates';
import { MessageContext } from '../contexts/MessageContext';

// Components
import PersonalInfo from '../components/LandingPage/PersonalInfo';
import MainBanners from '../components/LandingPage/MainBanners';
import MessageFeed from '../components/LandingPage/MessageFeed';
import ParameterManager from '../components/Parameters/ParameterManager';
import ExerciseTreeManager from '../components/Exercises/ExerciseTreeManager';
import ExercisePage from './ExercisePage';
import ActivityCreator from '../components/Activity/ActivityCreator';

// Template & Workout Components
import TemplateCard from '../components/Templates/TemplateCard';
import CreateWorkoutTemplatePage from './CreateWorkoutTemplatePage'; 
import ActiveWorkoutPage from './ActiveWorkoutPage'; // The new live workout component

const LandingPage = () => {
  const { user } = useAuth();
  const { users, refreshUsers } = useUsers();
  const { templates, loading: templatesLoading, fetchTemplates, removeTemplate } = useTemplates();
  const { mainMessages, fetchMainMessages } = useContext(MessageContext);

  // --- UI Navigation State ---
  // Views: 'main' (Default), 'templates_list', 'template_editor', 'active_workout'
  const [view, setView] = useState('main');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedTemplateForWorkout, setSelectedTemplateForWorkout] = useState(null);
  
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [selectedChatPartner, setSelectedChatPartner] = useState(null);

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  // --- Sync Data ---
  useEffect(() => {
    if (user?.group_id) {
      refreshUsers(user.group_id);
      fetchTemplates();
    }
    fetchMainMessages();
  }, [user, refreshUsers, fetchMainMessages, fetchTemplates]);

  // --- Handlers ---

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setView('template_editor');
  };

  const handleCreateNewTemplate = () => {
    setEditingTemplate(null);
    setView('template_editor');
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm('האם למחוק את השבלונה?')) {
      await removeTemplate(id);
    }
  };

  // Start a live workout session
  const handleStartWorkout = (template) => {
    setSelectedTemplateForWorkout(template);
    setView('active_workout');
  };

  const handleTemplateActionComplete = () => {
    setView('templates_list');
    setEditingTemplate(null);
  };

  const handleWorkoutFinished = () => {
    setView('main');
    setSelectedTemplateForWorkout(null);
  };

  return (
    <div style={{ direction: 'rtl', padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      
      {/* --- HEADER --- */}
      <header style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Don't show "Back Home" button during an active workout to prevent accidental exits */}
          {view !== 'main' && view !== 'active_workout' && (
            <button 
              onClick={() => setView('main')}
              style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}
            >
              ⬅ חזרה לבית
            </button>
          )}
          <h1 style={{ margin: 0 }}>
            {view === 'main' && `שלום, ${user?.first_name || user?.username} 👋`}
            {view === 'templates_list' && 'ניהול שבלונות אימון'}
            {view === 'template_editor' && (editingTemplate ? 'עריכת שבלונה' : 'יצירת שבלונה חדשה')}
            {view === 'active_workout' && 'אימון פעיל ⚡'}
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {view === 'main' && (
            <button 
              onClick={() => setView('templates_list')}
              style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              📋 {isTrainer ? 'ניהול שבלונות' : 'תוכניות אימון'}
            </button>
          )}
          
          {view !== 'active_workout' && (
            <button 
              onClick={() => setIsAddLogOpen(true)}
              style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(40, 167, 69, 0.25)' }}
            >
              ➕ תיעוד אימון מהיר
            </button>
          )}
        </div>
      </header>

      {/* --- CONDITIONAL RENDERING BY VIEW --- */}

      {/* 1. Main Dashboard View */}
      {view === 'main' && (
        <>
          <PersonalInfo user={user} />
          <MainBanners mainMessages={mainMessages} />

          {isTrainer && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
              <ParameterManager />
              <ExerciseTreeManager />
            </div>
          )}

          <div style={{ marginTop: '40px' }}>
            <ExercisePage />
          </div>

          <hr style={{ margin: '40px 0', border: '0', borderTop: '1px solid #eee' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <MessageFeed 
              title="📢 לוח מודעות קבוצתי" 
              targetId={user?.group_id} 
              type="general" 
              currentUserId={user?.id} 
              userRole={user?.role} 
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {selectedChatPartner && (
                <MessageFeed 
                  title={`💬 שיחה עם: ${selectedChatPartner.first_name}`} 
                  targetId={selectedChatPartner.id} 
                  type="personal" 
                  currentUserId={user.id} 
                  userRole={user.role} 
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* 2. Templates Browser View */}
      {view === 'templates_list' && (
        <section style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>השבלונות שלך</h2>
            {isTrainer && (
              <button onClick={handleCreateNewTemplate} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                + צור שבלונה חדשה
              </button>
            )}
          </div>
          
          {templatesLoading ? <p>טוען שבלונות...</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {templates.map(tmpl => (
                <TemplateCard 
                  key={tmpl.id} 
                  template={tmpl} 
                  isTrainer={isTrainer} 
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  onStart={handleStartWorkout} // Passing the start handler
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3. Template Editor View */}
      {view === 'template_editor' && (
        <CreateWorkoutTemplatePage 
          initialData={editingTemplate} 
          onSave={handleTemplateActionComplete}
          onCancel={() => setView('templates_list')}
        />
      )}

      {/* 4. Active Live Workout View */}
      {view === 'active_workout' && selectedTemplateForWorkout && (
        <ActiveWorkoutPage 
          template={selectedTemplateForWorkout}
          onSave={handleWorkoutFinished}
          onCancel={() => {
             if(window.confirm("בטוח שברצונך לצאת? נתוני האימון הנוכחי לא יישמרו.")) {
                 setView('main');
                 setSelectedTemplateForWorkout(null);
             }
          }}
        />
      )}

      {/* --- MODALS --- */}
      {isAddLogOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(8px)' }}>
          <div style={{ width: '95%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={() => setIsAddLogOpen(false)} style={{ position: 'absolute', top: '-45px', left: '0', background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>✕ סגור חלונית</button>
            <ActivityCreator onComplete={() => setIsAddLogOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;