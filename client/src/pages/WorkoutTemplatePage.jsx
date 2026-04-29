import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '../hooks/useTemplates';
import { useAuth } from '../hooks/useAuth';
import TemplateCard from '../components/Templates/TemplateCard';

/**
 * Main Page for viewing and managing workout templates.
 */
const WorkoutTemplatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { templates, loading, fetchTemplates, removeTemplate } = useTemplates();
  
  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreateNew = () => {
    navigate('/templates/create');
  };

  const handleEdit = (template) => {
    navigate(`/templates/edit/${template.id}`, { state: { template } });
  };

  const handleStartWorkout = (template) => {
    // This will be implemented in the WorkoutSession phase
    console.log("Starting workout with template:", template.name);
  };

  const handleDelete = async (id) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את השבלונה?')) {
      await removeTemplate(id);
    }
  };

  return (
    <div style={{ direction: 'rtl', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
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
            onClick={handleCreateNew}
            style={{
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 123, 255, 0.2)'
            }}
          >
            ➕ יצירת שבלונה חדשה
          </button>
        )}
      </header>

      {loading ? (
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
                onEdit={handleEdit}
                onDelete={handleDelete}
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