import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '../contexts/TemplateContext';
import { useAuth } from '../contexts/AuthContext';
import WorkoutCard from '../components/WorkoutsPage/WorkoutCard';
import FrontendLogger from '../utils/logger';

/**
 * WorkoutsPage - Entry point for browsing and launching workout programs.
 * Fully managed via React Router navigation states for true decoupled view pipelines.
 */
const WorkoutsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { templates, loading: templatesLoading, fetchTemplates, removeTemplate } = useTemplates();
  
  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  // Fetch group workout programs catalog on mount
  useEffect(() => {
    FrontendLogger.info('WORKOUTS_PAGE', 'Mounting training programs registry matrix library view');
    fetchTemplates();
  }, [fetchTemplates]);

  /**
   * Routes the user to a dedicated creation path matching the current App configuration.
   */
  const handleCreateNewTemplate = () => {
    FrontendLogger.info('WORKOUTS_PAGE', 'Navigating to dedicated create workout template route path');
    // FIXED: Router sync parameter mismatch resolved to target the original app state bounds
    navigate('/create-workout-templates');
  };

  /**
   * Routes the user to the editor path, passing the targeted configuration via router state.
   */
  const handleEditTemplate = (template) => {
    FrontendLogger.info('WORKOUTS_PAGE', `Navigating to template editor path route for blueprint ID: ${template.id}`);
    navigate(`/workouts/edit/${template.id}`, { state: { template } });
  };

  /**
   * Triggers explicit backend destruction commands for a selected blueprint item.
   */
  const handleDeleteTemplate = async (id) => {
    FrontendLogger.warn('WORKOUTS_PAGE', `Executing validation confirmation sequence for absolute template eviction chain ID: ${id}`);
    if (window.confirm('האם למחוק את השבלונה לצמיתות?')) {
      try {
        await removeTemplate(id);
        FrontendLogger.info('WORKOUTS_PAGE', `Template blueprint asset row successfully dropped: ${id}`);
      } catch (err) {
        FrontendLogger.error('WORKOUTS_PAGE', `Failed to apply absolute destruction parameters on entity node ID: ${id}`, err);
      }
    }
  };

  /**
   * Launches physical training performance capture overlays.
   * Feeds target instance state variables directly into active session routers.
   */
  const handleStartWorkout = (template) => {
    FrontendLogger.info('WORKOUTS_PAGE', `Spawning active workspace runtime execution instance context from template node ID: ${template.id}`);
    navigate('/active-workouts', { state: { template } });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-zinc-200 p-6 md:p-12 font-sans" dir="rtl">
      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* Page Header Block */}
        <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 bg-white/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/60 shadow-xl">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-zinc-900 uppercase">תוכניות אימון</h1>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.3em]">Workout Logic & Program Library</p>
          </div>

          {isTrainer && (
            <button 
              onClick={handleCreateNewTemplate}
              className="px-8 py-4 bg-zinc-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-zinc-900/20 active:scale-95 transition-all hover:bg-zinc-800"
            >
              ＋ יצירת תוכנית חדשה
            </button>
          )}
        </header>

        {/* Dynamic State Layout Grid Conditional Blocks */}
        {templatesLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
             <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">Syncing Library</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {templates.length > 0 ? (
              templates.map(tmpl => (
                <WorkoutCard 
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
                <h2 className="text-2xl font-black text-zinc-300 uppercase tracking-tighter">אין תוכניות זמינות</h2>
                <p className="text-sm font-bold text-zinc-400 mt-2">צור תוכנית אימון חדשה או פנה למאמן הקבוצה כדי להתחיל</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutsPage;