import React, { createContext, useState, useCallback } from 'react';
import { templateService } from '../services/templateService';

export const TemplateContext = createContext();

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches all templates accessible to the user.
   */
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await templateService.getAll();
      setTemplates(response.data);
    } catch (err) {
      console.error("TemplateContext: Fetching templates failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Creates a new workout template and updates the local state.
   */
  const addTemplate = async (templateData) => {
    try {
      const response = await templateService.create(templateData);
      setTemplates(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error("TemplateContext: Creating template failed", err);
      throw err;
    }
  };

  /**
   * Updates an existing template and syncs the local state.
   * Useful for partial updates (e.g., just changing scheduled_hour).
   */
  const editTemplate = async (templateId, updateData) => {
    try {
      const response = await templateService.update(templateId, updateData);
      setTemplates(prev => 
        prev.map(t => (t.id === templateId ? { ...t, ...response.data } : t))
      );
      return response.data;
    } catch (err) {
      console.error("TemplateContext: Updating template failed", err);
      throw err;
    }
  };

  /**
   * Deletes a template and updates the local state.
   */
  const removeTemplate = async (templateId) => {
    try {
      await templateService.delete(templateId);
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
      editTemplate, // Added to the context provider
      removeTemplate 
    }}>
      {children}
    </TemplateContext.Provider>
  );
};