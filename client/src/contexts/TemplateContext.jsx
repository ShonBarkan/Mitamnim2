import React, { createContext, useState, useCallback, useContext } from 'react';
import { templateService } from '../services/templateService';
import FrontendLogger from '../utils/logger';

export const TemplateContext = createContext();

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches all workout templates allocated within the current group perimeter.
   */
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      FrontendLogger.info('TEMPLATE_CONTEXT', 'Initiating workout templates configuration sync sequence');
      const data = await templateService.getAll();
      setTemplates(data);
      FrontendLogger.info('TEMPLATE_CONTEXT', `Successfully synchronized ${data.length} template framework blueprints`);
    } catch (err) {
      FrontendLogger.error('TEMPLATE_CONTEXT', 'Failed to retrieve synchronized workout templates catalog layout', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Spawns and registers a brand new workout template framework entity.
   */
  const addTemplate = async (templateData) => {
    setLoading(true);
    try {
      FrontendLogger.info('TEMPLATE_CONTEXT', `Spawning new relational template layout: '${templateData.name}'`, templateData);
      const createdTemplate = await templateService.create(templateData);
      
      setTemplates(prev => [...prev, createdTemplate]);
      FrontendLogger.info('TEMPLATE_CONTEXT', `Template token '${templateData.name}' successfully allocated inside local state bounds`, createdTemplate);
      return createdTemplate;
    } catch (err) {
      FrontendLogger.error('TEMPLATE_CONTEXT', `Failed to execute allocation chain for template blueprint: '${templateData.name}'`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates configuration definitions or relational mapping sets for an existing template record.
   */
  const editTemplate = async (templateId, updateData) => {
    setLoading(true);
    try {
      FrontendLogger.info('TEMPLATE_CONTEXT', `Mutating schema configuration rules on template validation node id: ${templateId}`, updateData);
      const updatedTemplate = await templateService.update(templateId, updateData);

      setTemplates(prev => prev.map(t => t.id === templateId ? updatedTemplate : t));
      FrontendLogger.info('TEMPLATE_CONTEXT', `Template token id: ${templateId} successfully re-mapped and synced with state bounds`);
      return updatedTemplate;
    } catch (err) {
      FrontendLogger.error('TEMPLATE_CONTEXT', `Failed to apply structural mutations on template target record node id: ${templateId}`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Absolutely flushes a workout template row record and drops downstream dependencies.
   */
  const removeTemplate = async (templateId) => {
    setLoading(true);
    try {
      FrontendLogger.info('TEMPLATE_CONTEXT', `Requesting absolute destruction chain execution for template target node id: ${templateId}`);
      await templateService.delete(templateId);
      
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      FrontendLogger.info('TEMPLATE_CONTEXT', `Template record instance asset row id: ${templateId} completely dropped from tracking bounds memory`);
    } catch (err) {
      FrontendLogger.error('TEMPLATE_CONTEXT', `Failed to trigger destruction sequence layout execution for target template id: ${templateId}`, err);
      throw err;
    } finally {
      setLoading(false);
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

/**
 * Custom hook utility proxying contextual abstraction layers cleanly.
 * Must be consumed strictly within an active TemplateProvider scope wrapper boundary.
 */
export const useTemplates = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplates must be consumed strictly within an active TemplateProvider scope wrapper boundary.');
  }
  return context;
};

export default TemplateProvider;