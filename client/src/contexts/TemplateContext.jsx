import React, { createContext, useState, useCallback } from 'react';
import templateService from '../services/templateService';

export const TemplateContext = createContext();

/**
 * Provider for managing workout templates.
 * Coordinates with templateService to persist exercise configurations 
 * including manual and calculated parameter values.
 */
export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches all workout templates for the current group.
   * Handles role-based access logic via the backend.
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
   * Creates a new workout template.
   * Expects templateData with simplified exercises_config (parameter_id and value only).
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
   * Updates an existing template.
   * Merges server response with local state to ensure UI consistency.
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
   * Deletes a template and synchronizes the local UI state.
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
      editTemplate, 
      removeTemplate 
    }}>
      {children}
    </TemplateContext.Provider>
  );
};

export default TemplateProvider;