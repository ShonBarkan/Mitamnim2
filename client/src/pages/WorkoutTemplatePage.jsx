import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '../hooks/useTemplates';
import { useAuth } from '../hooks/useAuth';

// Components
import TemplateCard from '../components/Templates/TemplateCard';
import CreateWorkoutTemplatePage from './CreateWorkoutTemplatePage'; 

/**
 * WorkoutTemplatePage - Entry point for browsing and managing workout programs.
 * Features the Arctic Mirror aesthetic with fluid view transitions.
 */
const WorkoutTemplatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { templates, loading: templatesLoading, fetchTemplates, removeTemplate } = useTemplates();
  
  // Views: 'list' (Default Gallery), 'editor' (Creation/Edit Mode)
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
    if (window.confirm('האם למחוק את השבלונה לצמיתות?')) {
      await removeTemplate(id);
    }
  };

  /**
   * Starts a live workout session.
   * Passes the template configuration via router state to the ActiveWorkoutPage.
   */
  const handleStartWorkout = (template) => {
    navigate('/active-workouts', { state: { template } });
  };

  const handleActionComplete = () => {
    setView('list');
    setEditingTemplate(null);
    fetchTemplates();
  };

  // --- RENDER EDITOR VIEW ---
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

  // --- RENDER MAIN GALLERY VIEW ---
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-zinc-200 p-6 md:p-12 font-sans" dir="rtl">
      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* Page Header */}
        <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 bg-white/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/60 shadow-xl">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-zinc-900 uppercase">שבלונות אימון</h1>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.3em]">Workout Logic & Program Library</p>
          </div>

          {isTrainer && (
            <button 
              onClick={handleCreateNewTemplate}
              className="px-8 py-4 bg-zinc-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-zinc-900/20 active:scale-95 transition-all hover:bg-zinc-800"
            >
              ＋ יצירת שבלונה חדשה
            </button>
          )}
        </header>

        {/* Templates Grid or Loading State */}
        {templatesLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
             <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">Syncing Library</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
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
              <div className="col-span-full py-40 bg-white/20 backdrop-blur-sm border-2 border-dashed border-white/40 rounded-[4rem] text-center">
                <div className="text-6xl mb-6 opacity-20">📂</div>
                <h2 className="text-2xl font-black text-zinc-300 uppercase tracking-tighter">אין שבלונות זמינות</h2>
                <p className="text-sm font-bold text-zinc-400 mt-2">צור שבלונה חדשה כדי להתחיל את האימון הראשון</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutTemplatePage;