import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling the API communication for global system metadata tags.
 * Maps standard atomic CRUD execution boundaries directly to remote endpoints.
 * Enforces strict English-only code commentary and total Hebrew UI localization support.
 */
export const tagService = {
  /**
   * Fetch all global system tags registered inside the application perimeter.
   * Path: GET /tags
   */
  getAll: async () => {
    FrontendLogger.info('TAG_SERVICE', 'Fetching all global system tags from remote pool matrix');
    const response = await api.get('/tags');
    return response.data;
  },

  /**
   * Create a new global system tag definition token asset.
   * Path: POST /tags
   */
  create: async (data) => {
    FrontendLogger.info('TAG_SERVICE', `Spawning new global tag profile asset: '${data.name}'`, data);
    const response = await api.post('/tags', data);
    return response.data;
  },

  /**
   * Create multiple system tag definitions in a single atomic batch.
   * Path: POST /tags/bulk
   */
  createBulk: async (tagsArray) => {
    FrontendLogger.info('TAG_SERVICE', `Dispatching bulk registration batch sequence for ${tagsArray.length} items`);
    const response = await api.post('/tags/bulk', tagsArray);
    return response.data;
  },

  /**
   * Update the entire structural definition of an existing global system tag.
   * Path: PUT /tags/{id}
   */
  update: async (id, data) => {
    FrontendLogger.info('TAG_SERVICE', `Executing full structural atomic PUT mutation for tag target id: ${id}`, data);
    const response = await api.put(`/tags/${id}`, data);
    return response.data;
  },

  /**
   * Remove a global tag row record definition from the system memory database.
   * Path: DELETE /tags/{id}
   */
  delete: async (id) => {
    FrontendLogger.info('TAG_SERVICE', `Triggering complete purge execution chain for tag target id: ${id}`);
    const response = await api.delete(`/tags/${id}`);
    return response.data;
  }
};

export default tagService;