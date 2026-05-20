import React, { createContext, useState, useCallback, useContext } from 'react';
import { tagService } from '../services/tagService';
import FrontendLogger from '../utils/logger';

export const TagContext = createContext();

export const TagProvider = ({ children }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Synchronizes and loads all group-isolated tags into application runtime memory.
   */
  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      FrontendLogger.info('TAG_CONTEXT', 'Initiating group tags layout synchronization sequence');
      const data = await tagService.getAll();
      setTags(data);
      FrontendLogger.info('TAG_CONTEXT', `Successfully cached ${data.length} localized metadata tags`);
    } catch (error) {
      FrontendLogger.error('TAG_CONTEXT', 'Operational exception caught during tags synchronization pipeline', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registers and commits a brand new localized metadata tag profile into system layers.
   */
  const addTag = async (tagData) => {
    try {
      FrontendLogger.info('TAG_CONTEXT', `Requesting registration transaction for group tag label: '${tagData.name}'`);
      const createdTag = await tagService.create(tagData);
      setTags(prev => [...prev, createdTag]);
      FrontendLogger.info('TAG_CONTEXT', `Tag '${tagData.name}' successfully verified and synchronized inside runtime array`);
      return createdTag;
    } catch (error) {
      FrontendLogger.error('TAG_CONTEXT', `Failed to execute allocation pipeline for custom tag entry: '${tagData.name}'`, error);
      throw error;
    }
  };

  /**
   * Commits an array of brand new metadata tags into system layers simultaneously.
   */
  const addBulkTags = async (tagsArray) => {
    try {
      FrontendLogger.info('TAG_CONTEXT', `Initiating bulk array deployment sequence for ${tagsArray.length} items`);
      const createdTags = await tagService.createBulk(tagsArray);
      setTags(prev => [...prev, ...createdTags]);
      FrontendLogger.info('TAG_CONTEXT', 'Bulk tags database synchronization sequence completed successfully');
      return createdTags;
    } catch (error) {
      FrontendLogger.error('TAG_CONTEXT', 'Failed to execute bulk allocation database workflow sequence', error);
      throw error;
    }
  };

  /**
   * Applies validated modifications onto a live assigned group tag row.
   */
  const editTag = async (id, updateData) => {
    try {
      FrontendLogger.info('TAG_CONTEXT', `Withholding schema mutation request boundaries for tag identity id: ${id}`);
      const updatedTag = await tagService.update(id, updateData);
      setTags(prev => prev.map(t => t.id === id ? updatedTag : t));
      FrontendLogger.info('TAG_CONTEXT', `Tag id: ${id} successfully re-mapped and synced with central memory data matrices`);
      return updatedTag;
    } catch (error) {
      FrontendLogger.error('TAG_CONTEXT', `Failed to apply update mutation transaction logic on tag asset id: ${id}`, error);
      throw error;
    }
  };

  /**
   * Drops a target group tag definition from active data structures memory.
   */
  const removeTag = async (id) => {
    try {
      FrontendLogger.warn('TAG_CONTEXT', `Requesting absolute destruction chain execution for tag verification node id: ${id}`);
      await tagService.delete(id);
      setTags(prev => prev.filter(t => t.id !== id));
      FrontendLogger.info('TAG_CONTEXT', `Tag instance record row id: ${id} completely dropped from baseline state maps`);
    } catch (error) {
      FrontendLogger.error('TAG_CONTEXT', `Failed to trigger destruction sequence execution layout for target tag id: ${id}`, error);
      throw error;
    }
  };

  /**
   * Functional utility lookup resolving raw numerical entity keys into their object profile parameters.
   */
  const getTagById = useCallback((id) => {
    return tags.find(t => t.id === parseInt(id)) || null;
  }, [tags]);

  return (
    <TagContext.Provider value={{
      tags,
      loading,
      fetchTags,
      addTag,
      addBulkTags,
      editTag,
      removeTag,
      getTagById
    }}>
      {children}
    </TagContext.Provider>
  );
};

/**
 * Custom hook proxying contextual parameters layers abstraction safely.
 */
export const useTag = () => {
  const context = useContext(TagContext);
  if (!context) {
    throw new Error("useTag must be consumed strictly within an active TagProvider context scope framework boundary.");
  }
  return context;
};

export default TagProvider;