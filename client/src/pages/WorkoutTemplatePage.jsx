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

  const handleStartWorkout = (template) => {
    navigate('/active-workouts', { state: { template } });
  };

  const handleActionComplete = () => {
    setView('list');
    setEditingTemplate(null);
    fetchTemplates();
  };

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

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-zinc-200">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">שבלונות אימון</h1>
            <p className="text-sm text-zinc-500 font-medium mt-1">בחר תוכנית אימון והתחל לעבוד</p>
          </div>

          {isTrainer && (
            <button 
              onClick={handleCreateNewTemplate}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm active:scale-95"
            >
              <span className="text-lg leading-none">+</span>
              יצירת שבלונה חדשה
            </button>
          )}
        </header>

        {templatesLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold text-zinc-500">טוען שבלונות...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                <span className="text-4xl mb-4 opacity-50">📋</span>
                <h2 className="text-xl font-bold text-zinc-800 mb-2">אין שבלונות זמינות</h2>
                <p className="text-zinc-500 text-sm">צור שבלונה חדשה כדי להתחיל</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutTemplatePage;