import React, { createContext, useState, useCallback, useContext } from 'react';
import { templateService } from '../services/templateService';
import FrontendLogger from '../utils/logger';

export const TemplateContext = createContext();

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      FrontendLogger.info('TEMPLATE_CONTEXT', 'Hydrating workout templates from server');
      const data = await templateService.getAll();
      setTemplates(data);
    } catch (error) {
      FrontendLogger.error('TEMPLATE_CONTEXT', 'Failed to hydrate templates', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTemplate = async (templateData) => {
    try {
      FrontendLogger.info('TEMPLATE_CONTEXT', `Ingesting new template: ${templateData.name}`);
      const newTemplate = await templateService.create(templateData);
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (error) {
      FrontendLogger.error('TEMPLATE_CONTEXT', 'Failed to create template', error);
      throw error;
    }
  };

  const removeTemplate = async (id) => {
    try {
      FrontendLogger.info('TEMPLATE_CONTEXT', `Purging template ID: ${id}`);
      await templateService.delete(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      FrontendLogger.error('TEMPLATE_CONTEXT', `Failed to purge template ID: ${id}`, error);
      throw error;
    }
  };

  return (
    <TemplateContext.Provider value={{ 
      templates, 
      loading, 
      fetchTemplates, 
      createTemplate, 
      removeTemplate 
    }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplate = () => useContext(TemplateContext);