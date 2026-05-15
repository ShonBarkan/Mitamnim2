import React, { createContext, useState, useCallback } from 'react';
import templateService from '../services/templateService';
import { initialData } from '../mock/mockData';

export const TemplateContext = createContext();

const IS_DEV = process.env.NODE_ENV === 'development';

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Helper to manage local storage for Dev mode
   */
  const getMockDb = useCallback(() => {
    const data = localStorage.getItem('mitamnim2_db');
    if (!data) {
      localStorage.setItem('mitamnim2_db', JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(data);
  }, []);

  const saveMockDb = (db) => {
    localStorage.setItem('mitamnim2_db', JSON.stringify(db));
  };

  /**
   * Fetches all workout templates for the group.
   */
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      if (IS_DEV) {
        await new Promise(resolve => setTimeout(resolve, 400));
        const db = getMockDb();
        setTemplates(db.workout_templates || []);
      } else {
        const response = await templateService.getAll();
        const data = response.data || response;
        setTemplates(data);
      }
    } catch (err) {
      console.error("TemplateContext: Fetching templates failed", err);
    } finally {
      setLoading(false);
    }
  }, [getMockDb]);

  /**
   * Creates a new workout template.
   * Exercises_config is stored as a JSON object containing exercise names and params.
   */
  const addTemplate = async (templateData) => {
    try {
      if (IS_DEV) {
        const db = getMockDb();
        const newTemplate = { 
          ...templateData, 
          id: crypto.randomUUID(),
          created_at: new Date().toISOString() 
        };
        db.workout_templates.push(newTemplate);
        saveMockDb(db);
        setTemplates(prev => [...prev, newTemplate]);
        return newTemplate;
      } else {
        const response = await templateService.create(templateData);
        const data = response.data || response;
        setTemplates(prev => [...prev, data]);
        return data;
      }
    } catch (err) {
      console.error("TemplateContext: Creating template failed", err);
      throw err;
    }
  };

  /**
   * Updates an existing template.
   */
  const editTemplate = async (templateId, updateData) => {
    try {
      let updated;
      if (IS_DEV) {
        const db = getMockDb();
        const index = db.workout_templates.findIndex(t => t.id === templateId);
        if (index === -1) throw new Error("Template not found in mock DB");
        
        db.workout_templates[index] = { ...db.workout_templates[index], ...updateData };
        updated = db.workout_templates[index];
        saveMockDb(db);
      } else {
        const response = await templateService.update(templateId, updateData);
        updated = response.data || response;
      }

      setTemplates(prev => 
        prev.map(t => (t.id === templateId ? updated : t))
      );
      return updated;
    } catch (err) {
      console.error("TemplateContext: Updating template failed", err);
      throw err;
    }
  };

  /**
   * Deletes a template and synchronizes the local state.
   */
  const removeTemplate = async (templateId) => {
    try {
      if (IS_DEV) {
        const db = getMockDb();
        db.workout_templates = db.workout_templates.filter(t => t.id !== templateId);
        saveMockDb(db);
      } else {
        await templateService.delete(templateId);
      }
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (err) {
      console.error("TemplateContext: Deleting template failed", err);
      throw err;
    }
  };

  return (
    <TemplateContext.Provider value={{ 
      templates, 
      loading, 
      fetchTemplates, 
      addTemplate, 
      editTemplate, 
      removeTemplate 
    }}>
      {children}
    </TemplateContext.Provider>
  );
};

export default TemplateProvider;