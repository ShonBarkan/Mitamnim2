import React, { useEffect, useState } from 'react';
import { useTemplate } from '../contexts/TemplateContext';
import { useAuth } from '../contexts/AuthContext';
import FrontendLogger from '../utils/logger';
import TemplateForm from '../components/TemplateManagerPage/TemplateForm';

const TemplateManagerPage = () => {
  const { templates, fetchTemplates, loading, removeTemplate } = useTemplate();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    FrontendLogger.info('TEMPLATE_MANAGER_PAGE', 'Mounting Template Manager Page');
    fetchTemplates();
  }, [fetchTemplates]);

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('האם אתה בטוח שברצונך למחוק שבלונה זו?')) {
      try {
        await removeTemplate(id);
      } catch (error) {
        FrontendLogger.error('TEMPLATE_MANAGER_PAGE', `Failed to delete template ${id}`, error);
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">ניהול שבלונות אימון</h1>
          <p className="text-sm text-zinc-500 font-bold">הקמה וניהול של תבניות אימון קבוצתיות</p>
        </div>
        
        {isTrainer && (
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-zinc-800 transition-all active:scale-95"
          >
            {isFormOpen ? 'סגור עורך' : 'צור שבלונה חדשה +'}
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <TemplateForm onCancel={() => setIsFormOpen(false)} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-zinc-400 font-bold">טוען שבלונות...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start">
                <h3 className="font-black text-lg">{template.name}</h3>
                {isTrainer && (
                  <button 
                    onClick={(e) => handleDelete(e, template.id)}
                    className="text-zinc-300 hover:text-red-500 transition-colors font-bold text-xs"
                  >
                    מחק
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-2 min-h-[3rem]">{template.description}</p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {template.tag_ids?.map(tagId => (
                  <span key={tagId} className="px-2 py-1 bg-zinc-100 rounded-lg text-[10px] font-bold text-zinc-600">
                    #{tagId}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateManagerPage;