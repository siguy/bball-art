/**
 * Caption Generator for Multi-Platform Export
 * Generates captions from templates using pairing, pose, and quote data
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../..');

// Data paths
const TEMPLATES_PATH = join(__dirname, '../data/caption-templates.json');
const PAIRINGS_DIR = join(ROOT, 'data/series/court-covenant/pairings');
const POSES_DIR = join(ROOT, 'data/poses');
const QUOTES_DIR = join(ROOT, 'data/quotes/figures');

// Cache for loaded data
let templatesCache = null;

/**
 * Load caption templates
 */
function loadTemplates() {
  if (!templatesCache) {
    templatesCache = JSON.parse(readFileSync(TEMPLATES_PATH, 'utf-8'));
  }
  return templatesCache;
}

/**
 * Load pairing data
 * @param {string} pairingId
 */
function loadPairing(pairingId) {
  const path = join(PAIRINGS_DIR, `${pairingId}.json`);
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8'));
  }
  return null;
}

/**
 * Load player pose data
 * @param {string} poseFileId
 */
function loadPlayerPose(poseFileId) {
  const path = join(POSES_DIR, 'players', `${poseFileId}.json`);
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8'));
  }
  return null;
}

/**
 * Load figure pose data
 * @param {string} poseFileId
 */
function loadFigurePose(poseFileId) {
  const path = join(POSES_DIR, 'figures', `${poseFileId}.json`);
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8'));
  }
  return null;
}

/**
 * Load figure quotes
 * @param {string} figureId
 */
function loadQuotes(figureId) {
  const path = join(QUOTES_DIR, `${figureId}.json`);
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8'));
  }
  return null;
}

/**
 * Get all available caption templates
 * @returns {Array<{id: string, name: string}>}
 */
export function getAvailableTemplates() {
  const templates = loadTemplates();
  return Object.entries(templates.templates).map(([id, template]) => ({
    id,
    name: template.name
  }));
}

/**
 * Get hashtags for a pairing
 * @param {string} pairingId
 * @returns {{player: string, figure: string, extra: string[]}}
 */
export function getHashtags(pairingId) {
  const templates = loadTemplates();
  return templates.pairingHashtags[pairingId] || {
    player: '',
    figure: '',
    extra: []
  };
}

/**
 * Build caption variables from card data
 * @param {object} options
 * @param {string} options.pairingId
 * @param {string} [options.playerPoseId] - Specific pose ID, or uses default
 * @param {string} [options.figurePoseId] - Specific pose ID, or uses default
 * @param {string} [options.quoteId] - Specific quote ID, or uses default
 * @returns {object} Variables for template substitution
 */
export function buildCaptionVariables(options) {
  const { pairingId, playerPoseId, figurePoseId, quoteId } = options;

  const templates = loadTemplates();
  const pairing = loadPairing(pairingId);

  if (!pairing) {
    return { error: `Pairing not found: ${pairingId}` };
  }

  // Load pose data
  const playerPoseData = loadPlayerPose(pairing.player.poseFileId);
  const figurePoseData = loadFigurePose(pairing.figure.poseFileId);

  // Get specific poses or defaults
  const playerPose = playerPoseData?.poses?.[playerPoseId] ||
                     playerPoseData?.poses?.[playerPoseData?.defaultPose] ||
                     null;
  const figurePose = figurePoseData?.poses?.[figurePoseId] ||
                     figurePoseData?.poses?.[figurePoseData?.defaultPose] ||
                     null;

  // Load quotes
  const figureId = pairing.figure.poseFileId;
  const quotesData = loadQuotes(figureId);
  const defaultQuoteId = templates.defaultQuotes?.[figureId] || null;
  const selectedQuoteId = quoteId || defaultQuoteId;
  const quote = quotesData?.quotes?.[selectedQuoteId] || null;

  // Get hashtags
  const hashtags = getHashtags(pairingId);

  // Build variables
  return {
    // Basic info
    player: pairing.player.name,
    figure: pairing.figure.name,
    player_display: pairing.player.displayName,
    figure_display: pairing.figure.displayName,

    // Connection
    narrative: pairing.connection.narrative,
    thematic: pairing.connection.thematic,
    relationship: pairing.connection.relationship,

    // Player pose
    player_pose_name: playerPose?.name || '',
    player_pose_energy: playerPose?.energy || '',
    player_pose_expression: playerPose?.expression || '',

    // Figure pose
    figure_pose_name: figurePose?.name || '',
    figure_pose_energy: figurePose?.energy || '',
    figure_pose_expression: figurePose?.expression || '',

    // Quote
    figure_quote_english: quote?.english || '',
    figure_quote_hebrew: quote?.hebrew || '',
    figure_quote_source: quote?.source || '',
    figure_quote_mood: quote?.mood || '',

    // Hashtags
    player_hashtag: hashtags.player,
    figure_hashtag: hashtags.figure,
    extra_hashtags: hashtags.extra?.map(h => `#${h}`).join(' ') || ''
  };
}

/**
 * Generate caption from template
 * @param {object} options
 * @param {string} options.templateId - Template ID ('standard', 'with-quote', etc.)
 * @param {string} options.platform - Platform ('instagram', 'twitter')
 * @param {string} options.pairingId
 * @param {string} [options.playerPoseId]
 * @param {string} [options.figurePoseId]
 * @param {string} [options.quoteId]
 * @returns {{caption: string, charCount: number, maxLength: number, variables: object}}
 */
export function generateCaption(options) {
  const { templateId, platform, pairingId, playerPoseId, figurePoseId, quoteId } = options;

  const templates = loadTemplates();
  const template = templates.templates[templateId];

  if (!template) {
    return { error: `Template not found: ${templateId}` };
  }

  const platformTemplate = template[platform];
  if (!platformTemplate) {
    return { error: `Platform not supported in template: ${platform}` };
  }

  // Build variables
  const variables = buildCaptionVariables({ pairingId, playerPoseId, figurePoseId, quoteId });

  if (variables.error) {
    return variables;
  }

  // Replace variables in template
  let caption = platformTemplate;
  for (const [key, value] of Object.entries(variables)) {
    caption = caption.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  }

  // Clean up any remaining empty placeholders
  caption = caption.replace(/\{[^}]+\}/g, '');

  // Clean up multiple newlines
  caption = caption.replace(/\n{3,}/g, '\n\n').trim();

  // Platform max lengths
  const maxLengths = {
    instagram: 2200,
    twitter: 280
  };

  return {
    caption,
    charCount: caption.length,
    maxLength: maxLengths[platform] || 2200,
    variables
  };
}

/**
 * Get available quotes for a figure
 * @param {string} figureId
 * @returns {Array<{id: string, english: string, source: string}>}
 */
export function getAvailableQuotes(figureId) {
  const quotesData = loadQuotes(figureId);
  if (!quotesData?.quotes) return [];

  return Object.entries(quotesData.quotes).map(([id, quote]) => ({
    id,
    english: quote.english,
    hebrew: quote.hebrew,
    source: quote.source
  }));
}

/**
 * Get available poses for a character
 * @param {string} type - 'player' or 'figure'
 * @param {string} poseFileId
 * @returns {Array<{id: string, name: string, energy: string}>}
 */
export function getAvailablePoses(type, poseFileId) {
  const poseData = type === 'player'
    ? loadPlayerPose(poseFileId)
    : loadFigurePose(poseFileId);

  if (!poseData?.poses) return [];

  return Object.entries(poseData.poses).map(([id, pose]) => ({
    id,
    name: pose.name,
    energy: pose.energy
  }));
}

/**
 * Clear template cache (for hot reloading)
 */
export function clearCache() {
  templatesCache = null;
}

export default {
  generateCaption,
  buildCaptionVariables,
  getAvailableTemplates,
  getAvailableQuotes,
  getAvailablePoses,
  getHashtags,
  clearCache
};
