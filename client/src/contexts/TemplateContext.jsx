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

  const createTemplate = async (templateData) => {
    setLoading(true);
    try {
      FrontendLogger.info('TEMPLATE_CONTEXT', `Ingesting new complex template structure: ${templateData.name}`);
      const newTemplate = await templateService.create(templateData);
      
      setTemplates((prev) => [...prev, newTemplate]);
      FrontendLogger.info('TEMPLATE_CONTEXT', 'Template structure successfully persisted to local domain state');
      return newTemplate;
    } catch (error) {
      FrontendLogger.error('TEMPLATE_CONTEXT', `Failed to persist template: ${templateData.name}`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeTemplate = async (id) => {
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

export const useTemplate = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplate must be consumed within a TemplateProvider');
  }
  return context;
};