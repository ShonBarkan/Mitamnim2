import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplate } from '../contexts/TemplateContext';
import { useAuth } from '../contexts/AuthContext';
import { useTag } from '../contexts/TagContext';
import FrontendLogger from '../utils/logger';
import TagDisplay from '../components/common/tags/TagDisplay';
import { useToast } from '../contexts/ToastContext';

const ShowTemplatesPage = () => {
  const { templates, fetchTemplates, loading, removeTemplate } = useTemplate();
  const { fetchTags } = useTag();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  // State management for search term
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    FrontendLogger.info('SHOW_TEMPLATES_PAGE', 'Initializing page view');
    fetchTemplates();
    fetchTags();
  }, [fetchTemplates, fetchTags]);

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';
  const { showToast } = useToast();

  const handleDelete = useCallback(async (e, id) => {
    e.stopPropagation();
    if (window.confirm('האם אתה בטוח שברצונך למחוק שבלונה זו?')) {
      try {
        await removeTemplate(id);
      } catch (error) {
        showToast('שגיאה במחיקת השבלונה', 'error');
      }
    }
  }, [removeTemplate, showToast]);

  // Memoized filtering logic to prevent unnecessary re-renders while typing
  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return templates.filter(template => {
      // Search across template name
      if (template.name.toLowerCase().includes(lowerSearchTerm)) return true;
      
      // Search across template description
      if (template.description && template.description.toLowerCase().includes(lowerSearchTerm)) return true;
      
      // Search across tag names
      if (template.tags && template.tags.some(tag => tag.name.toLowerCase().includes(lowerSearchTerm))) return true;
      
      return false;
    });
  }, [templates, searchTerm]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">שבלונות אימון</h1>
          <p className="text-sm text-zinc-500 font-bold">ניהול וצפייה בתבניות אימון קבוצתיות</p>
        </div>
        <div className="flex gap-3">
          {/* Add this button for Free Workout */}
          <button 
            onClick={() => navigate('/ActiveWorkoutPage')} 
            className="px-6 py-3 bg-zinc-100 text-zinc-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
          >
           התחל אימון ריק
          </button>

          {isTrainer && (
            <button 
              onClick={() => navigate('/templates/create')} 
              className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
            >
              צור שבלונה חדשה +
            </button>
          )}
        </div>
      </div>

      {/* Glassmorphism search input following Arctic Mirror aesthetic */}
      <div className="relative">
        <input
          type="text"
          placeholder="סנן לפי שם או תג..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-zinc-200/40 rounded-2xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/30 transition-all shadow-sm"
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-300">🔍</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[1, 2, 3].map(i => <div key={i} className="h-64 bg-zinc-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm font-bold text-zinc-400">
            {searchTerm.trim() ? 'לא נמצאו שבלונות התואמות לחיפוש' : 'לא קיימות שבלונות זמינות'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div 
              key={template.id} 
              className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => setSelectedTemplate(template)}
            >
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-lg text-zinc-900 group-hover:text-cyan-700 transition-colors">{template.name}</h3>
                  {isTrainer && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/templates/create?id=${template.id}`); }} className="text-cyan-600 font-bold text-[10px] uppercase hover:underline">ערוך</button>
                      <button onClick={(e) => handleDelete(e, template.id)} className="text-zinc-300 hover:text-red-500 font-bold text-[10px] uppercase">מחק</button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{template.description || 'ללא תיאור'}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {template.tags?.map(tag => <TagDisplay key={tag.id} name={tag.name} color={tag.color} />)}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between gap-4">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  {template.exercises?.length || 0} תרגילים
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/ActiveWorkoutPage?template_id=${template.id}`);
                  }}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-cyan-700 transition-all active:scale-95"
                >
                  התחל אימון
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal View */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedTemplate(null)}>
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black mb-1">{selectedTemplate.name}</h2>
            <p className="text-sm text-zinc-500 mb-6">{selectedTemplate.description}</p>
            
            <div className="space-y-4">
              {selectedTemplate.exercises?.map((ex, idx) => (
                <div key={idx} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-black text-zinc-900">{idx + 1}. {ex.name}</span>
                    <span className="text-[10px] font-black bg-zinc-200 px-3 py-1 rounded-full">{ex.sets} סטים</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {ex.parameters?.map((p, pIdx) => (
                      <div key={pIdx} className="bg-white px-3 py-2 rounded-xl border border-zinc-100 flex justify-between">
                        <span className="text-[10px] font-bold text-zinc-400">{p.name}</span>
                        <span className="text-[10px] font-black text-zinc-900">{p.default_value}{p.unit ? ` ${p.unit}` : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setSelectedTemplate(null)} 
                className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-black"
              >
                סגור
              </button>
              <button 
                onClick={() => navigate(`/ActiveWorkoutPage?template_id=${selectedTemplate.id}`)} 
                className="flex-[2] py-3 bg-zinc-900 text-white rounded-xl font-black shadow-lg hover:bg-zinc-800 transition-all active:scale-95"
              >
                התחל אימון זה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowTemplatesPage;