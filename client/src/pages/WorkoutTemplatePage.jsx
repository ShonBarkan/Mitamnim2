import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '../hooks/useTemplates';
import { useAuth } from '../hooks/useAuth';

// Components
import TemplateCard from '../components/Templates/TemplateCard';
import CreateWorkoutTemplatePage from './CreateWorkoutTemplatePage'; 

/**
 * Main Page for viewing and managing workout templates.
 * Handles navigation to the standalone ActiveWorkoutPage route.
 */
const WorkoutTemplatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { templates, loading: templatesLoading, fetchTemplates, removeTemplate } = useTemplates();
  
  // Views: 'list' (Default), 'editor'
  const [view, setView] = useState('list');
  const [editingTemplate, setEditingTemplate] = useState(null);

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreateNewTemplate = () => {
    setEditingTemplate(null);
    setView('editor');
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setView('editor');
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm('האם למחוק את השבלונה?')) {
      await removeTemplate(id);
    }
  };

  /**
   * Navigates to the separate workout route.
   * Passes the template object (containing the ID) via router state.
   */
  const handleStartWorkout = (template) => {
    navigate('/active-workouts', { state: { template } });
  };

  const handleActionComplete = () => {
    setView('list');
    setEditingTemplate(null);
    fetchTemplates();
  };

  // Render Editor View
  if (view === 'editor') {
    return (
      <CreateWorkoutTemplatePage 
        initialData={editingTemplate} 
        onSave={handleActionComplete}
        onCancel={() => {
          setView('list');
          setEditingTemplate(null);
        }}
      />
    );
  }

  // Render Main List View
  return (
    <div style={{ direction: 'rtl', padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        borderBottom: '2px solid #f0f0f0',
        paddingBottom: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>שבלונות אימון</h1>
          <p style={{ margin: '5px 0 0', color: '#666' }}>בחר תוכנית אימון והתחל לעבוד</p>
        </div>

        {isTrainer && (
          <button 
            onClick={handleCreateNewTemplate}
            style={{
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(40, 167, 69, 0.2)'
            }}
          >
            ➕ יצירת שבלונה חדשה
          </button>
        )}
      </header>

      {templatesLoading ? (
        <p style={{ textAlign: 'center', marginTop: '50px' }}>טוען שבלונות...</p>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {templates.length > 0 ? (
            templates.map(tmpl => (
              <TemplateCard 
                key={tmpl.id} 
                template={tmpl}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
                onStart={handleStartWorkout}
                isTrainer={isTrainer}
              />
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px', color: '#999' }}>
              <h2>אין שבלונות זמינות</h2>
              <p>צור שבלונה חדשה כדי להתחיל</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkoutTemplatePage;