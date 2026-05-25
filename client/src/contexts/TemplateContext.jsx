import React, { createContext, useState, useCallback, useContext, useMemo } from 'react';
import { templateService } from '../services/templateService';
import FrontendLogger from '../utils/logger';

export const TemplateContext = createContext();

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      FrontendLogger.info('TEMPLATE_CONTEXT', 'Hydrating full workout template domain state');
      const data = await templateService.getAll();
      setTemplates(data);
      FrontendLogger.info('TEMPLATE_CONTEXT', `Successfully synchronized ${data.length} templates`);
    } catch (error) {
      FrontendLogger.error('TEMPLATE_CONTEXT', 'Failed to hydrate templates registry', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTemplate = useCallback(async (templateData) => {
    setLoading(true);
    try {
      FrontendLogger.info('TEMPLATE_CONTEXT', `Ingesting new complex template structure: ${templateData.name}`);
      const newTemplate = await templateService.create(templateData);
      
      setTemplates((prev) => [...prev, newTemplate]);
      FrontendLogger.info('TEMPLATE_CONTEXT', 'Template structure successfully persisted to local domain state', { id: newTemplate.id });
      return newTemplate;
    } catch (error) {
      FrontendLogger.error('TEMPLATE_CONTEXT', `Failed to persist template: ${templateData.name}`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTemplate = useCallback(async (id, templateData) => {
    setLoading(true);
    try {
      FrontendLogger.info('TEMPLATE_CONTEXT', `Updating existing template ID: ${id}`);
      const updatedTemplate = await templateService.update(id, templateData);
      
      setTemplates((prev) => prev.map(t => t.id === id ? updatedTemplate : t));
      FrontendLogger.info('TEMPLATE_CONTEXT', `Template ID: ${id} successfully updated in domain state`);
      return updatedTemplate;
    } catch (error) {
      FrontendLogger.error('TEMPLATE_CONTEXT', `Failed to update template ID: ${id}`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeTemplate = useCallback(async (id) => {
    setLoading(true);
    try {
      FrontendLogger.info('TEMPLATE_CONTEXT', `Purging template ID: ${id} from registry`);
      await templateService.delete(id);
      
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      FrontendLogger.info('TEMPLATE_CONTEXT', `Template ID: ${id} successfully evicted`);
    } catch (error) {
      FrontendLogger.error('TEMPLATE_CONTEXT', `Failed to purge template ID: ${id}`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // useMemo ensures that context value is recreated only when dependencies change
  const value = useMemo(() => ({
    templates,
    loading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    removeTemplate
  }), [templates, loading, fetchTemplates, createTemplate, updateTemplate, removeTemplate]);

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplate = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplate must be consumed within a TemplateProvider');
  }
  return context;
};