import FrontendLogger from './logger';

/**
 * Uploads a binary file stream to Cloudinary utilizing unsigned upload presets.
 * Shared utility for both group avatars and user profile pictures.
 * * @param {File} file - The local file object selected by the user.
 * @returns {Promise<string>} The secure URL of the uploaded asset.
 */
export const uploadToCloudinary = async (file) => {
  FrontendLogger.info('CLOUDINARY_UTIL', `Initiating file stream upload for: ${file.name} (${file.size} bytes)`);

  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'mitamnim_preset';
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    const errorMsg = 'Missing VITE_CLOUDINARY_CLOUD_NAME environment variable deployment configuration';
    FrontendLogger.error('CLOUDINARY_UTIL', errorMsg);
    throw new Error(errorMsg);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Cloudinary upstream responded with non-2xx status code: ${response.status}`);
    }

    const jsonResponse = await response.json();
    FrontendLogger.info('CLOUDINARY_UTIL', 'Media asset successfully committed to Cloudinary cloud vaults', { url: jsonResponse.secure_url });
    return jsonResponse.secure_url;
  } catch (error) {
    FrontendLogger.error('CLOUDINARY_UTIL', 'Failed to execute upload transaction sequence over cloud gateway', error);
    throw error;
  }
};