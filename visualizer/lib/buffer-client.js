/**
 * Buffer API Client for Social Media Scheduling
 * https://buffer.com/developers/api
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_PATH = join(__dirname, '../data/export-config.json');
const BUFFER_API_URL = 'https://api.bufferapp.com/1';

/**
 * Get Buffer access token from environment
 */
function getAccessToken() {
  return process.env.BUFFER_ACCESS_TOKEN || null;
}

/**
 * Load export config
 */
function loadConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
}

/**
 * Check if Buffer is configured and enabled
 * @returns {{enabled: boolean, configured: boolean, reason?: string}}
 */
export function checkBufferStatus() {
  const token = getAccessToken();
  const config = loadConfig();

  if (!config.buffer?.enabled) {
    return { enabled: false, configured: false, reason: 'Buffer is disabled in config' };
  }

  if (!token) {
    return { enabled: true, configured: false, reason: 'BUFFER_ACCESS_TOKEN not set' };
  }

  return { enabled: true, configured: true };
}

/**
 * Make authenticated request to Buffer API
 * @param {string} endpoint
 * @param {object} options - Fetch options
 */
async function bufferRequest(endpoint, options = {}) {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Buffer access token not configured');
  }

  const url = `${BUFFER_API_URL}${endpoint}`;
  const separator = endpoint.includes('?') ? '&' : '?';

  const response = await fetch(`${url}${separator}access_token=${token}`, {
    ...options,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Buffer API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get Buffer user profile info
 */
export async function getUser() {
  return bufferRequest('/user.json');
}

/**
 * Get connected social profiles
 * @returns {Promise<Array<{id: string, service: string, formatted_username: string}>>}
 */
export async function getProfiles() {
  return bufferRequest('/profiles.json');
}

/**
 * Get profile by service type
 * @param {string} service - 'instagram' or 'twitter'
 */
export async function getProfileByService(service) {
  const profiles = await getProfiles();
  return profiles.find(p => p.service === service) || null;
}

/**
 * Upload media to Buffer
 * @param {string} imagePath - Local path to image
 * @returns {Promise<{success: boolean, media?: object, error?: string}>}
 */
export async function uploadMedia(imagePath) {
  // Buffer requires images to be accessible via URL
  // For local files, we'd need to first upload to a hosting service
  // or use Buffer's direct upload feature (requires different approach)

  // For now, return a note that this requires the image to be hosted
  return {
    success: false,
    error: 'Buffer requires images to be accessible via URL. Upload to a hosting service first.',
    note: 'Consider using Cloudinary, S3, or similar for image hosting'
  };
}

/**
 * Create a post in Buffer queue
 * @param {object} options
 * @param {string} options.profileId - Buffer profile ID
 * @param {string} options.text - Post caption
 * @param {string} [options.mediaUrl] - URL to image (must be publicly accessible)
 * @param {Date} [options.scheduledAt] - When to post (null for immediate queue)
 * @returns {Promise<{success: boolean, update?: object, error?: string}>}
 */
export async function createPost(options) {
  const { profileId, text, mediaUrl, scheduledAt } = options;

  if (!profileId) {
    return { success: false, error: 'Profile ID is required' };
  }

  const body = new URLSearchParams();
  body.append('profile_ids[]', profileId);
  body.append('text', text);

  if (mediaUrl) {
    body.append('media[link]', mediaUrl);
    body.append('media[photo]', mediaUrl);
  }

  if (scheduledAt) {
    body.append('scheduled_at', Math.floor(scheduledAt.getTime() / 1000));
  }

  try {
    const result = await bufferRequest('/updates/create.json', {
      method: 'POST',
      body: body.toString()
    });

    return {
      success: result.success,
      update: result.updates?.[0] || null
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create posts for multiple profiles (Instagram + Twitter)
 * @param {object} options
 * @param {object} options.captions - { instagram: string, twitter: string }
 * @param {string} [options.mediaUrl] - URL to image
 * @param {Date} [options.scheduledAt] - When to post
 * @returns {Promise<{instagram?: object, twitter?: object}>}
 */
export async function createMultiPlatformPost(options) {
  const { captions, mediaUrl, scheduledAt } = options;
  const results = {};

  const profiles = await getProfiles();

  for (const [platform, caption] of Object.entries(captions)) {
    const profile = profiles.find(p => p.service === platform);
    if (!profile) {
      results[platform] = { success: false, error: `No ${platform} profile found` };
      continue;
    }

    results[platform] = await createPost({
      profileId: profile.id,
      text: caption,
      mediaUrl,
      scheduledAt
    });
  }

  return results;
}

/**
 * Get pending posts for a profile
 * @param {string} profileId
 */
export async function getPendingPosts(profileId) {
  return bufferRequest(`/profiles/${profileId}/updates/pending.json`);
}

/**
 * Delete a scheduled post
 * @param {string} updateId
 */
export async function deletePost(updateId) {
  return bufferRequest(`/updates/${updateId}/destroy.json`, {
    method: 'POST'
  });
}

/**
 * Post immediately (skip queue)
 * @param {string} updateId
 */
export async function shareNow(updateId) {
  return bufferRequest(`/updates/${updateId}/share.json`, {
    method: 'POST'
  });
}

export default {
  checkBufferStatus,
  getUser,
  getProfiles,
  getProfileByService,
  uploadMedia,
  createPost,
  createMultiPlatformPost,
  getPendingPosts,
  deletePost,
  shareNow
};
