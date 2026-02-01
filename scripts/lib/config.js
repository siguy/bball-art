/**
 * Centralized Configuration
 *
 * Single source of truth for paths, defaults, and environment settings.
 * Auto-discovers series from data/series/ directories.
 *
 * @module config
 */

import { readdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project root is two levels up from scripts/lib/
const ROOT = join(__dirname, '..', '..');

/**
 * Auto-discover series from data/series/ directories
 * @param {string} dataPath - Path to data directory
 * @returns {string[]} Array of series IDs
 */
function discoverSeries(dataPath) {
  const seriesPath = join(dataPath, 'series');
  if (!existsSync(seriesPath)) {
    return ['court-covenant', 'torah-titans']; // fallback defaults
  }

  try {
    return readdirSync(seriesPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch {
    return ['court-covenant', 'torah-titans'];
  }
}

/**
 * Configuration object
 * @type {Object}
 */
export const CONFIG = {
  // Project root directory
  root: ROOT,

  // Auto-discovered series (adding a new folder auto-registers it)
  series: discoverSeries(join(ROOT, 'data')),

  // Default series for fallback
  defaultSeries: 'court-covenant',

  // Directory paths (relative to root)
  paths: {
    data: join(ROOT, 'data'),
    output: join(ROOT, 'output'),
    poses: join(ROOT, 'data/poses'),
    quotes: join(ROOT, 'data/quotes'),
    characters: join(ROOT, 'data/characters'),
    series: join(ROOT, 'data/series'),
    templates: join(ROOT, 'prompts/templates'),
    brand: join(ROOT, 'brand'),
    visualizer: join(ROOT, 'visualizer'),
  },

  // Default values
  defaults: {
    interaction: 'simultaneous-action',
    aspectRatio: '3:4',
    series: 'court-covenant',
  },

  // Model configuration (from environment or defaults)
  models: {
    image: process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview',
  },

  // Logo path for reference images
  logoPath: join(ROOT, 'brand/logos/court and covenant logo - 1.png'),

  // Series abbreviations for filenames
  seriesAbbreviations: {
    'court-covenant': 'cc',
    'torah-titans': 'tt',
    'scripture-titans': 'st',
    'founding-fathers': 'ff',
    'parasha-pack': 'pp',
  },

  // Template abbreviations for filenames
  templateAbbreviations: {
    'thunder-lightning': 'tl',
    'thunder-lightning-dark': 'tld',
    'thunder-lightning-rivalry': 'tlr',
    'beam-team': 'bt',
    'beam-team-shadow': 'bts',
    'beam-team-rivalry': 'btr',
    'beam-team-a': 'bta',
    'beam-team-b': 'btb',
    'beam-team-c': 'btc',
    'beam-team-c-dunk': 'btcd',
    'metal-universe': 'mu',
    'metal-universe-dark': 'mud',
    'metal-universe-dark-alt': 'muda',
    'metal-universe-dark-alt-realistic': 'mudar',
    'metal-universe-rivalry': 'mur',
    'downtown': 'dt',
    'kaboom': 'kb',
    'prizm-silver': 'ps',
    'spouse-blessing': 'sb',
    'trial-card': 'tc',
    'plague-card': 'pc',
    'three-way': 'tw',
    'portrait-transformation': 'pt',
    // Parasha Pack templates
    'anchor-card': 'anc',
    'spotlight-card': 'spt',
    'action-card': 'act',
    'thinker-card': 'thk',
    'power-word-card': 'pwr',
  },
};

/**
 * Get the path for a specific series
 * @param {string} seriesId - Series ID
 * @returns {string} Full path to series directory
 */
export function getSeriesPath(seriesId) {
  return join(CONFIG.paths.series, seriesId);
}

/**
 * Get the pairings directory for a series
 * @param {string} seriesId - Series ID
 * @returns {string} Full path to pairings directory
 */
export function getPairingsPath(seriesId) {
  return join(CONFIG.paths.series, seriesId, 'pairings');
}

/**
 * Get the sub-series directory for a series
 * @param {string} seriesId - Series ID
 * @returns {string} Full path to sub-series directory
 */
export function getSubSeriesPath(seriesId) {
  return join(CONFIG.paths.series, seriesId, 'sub-series');
}

/**
 * Get the poses directory for a character type
 * @param {'player'|'figure'|'founder'} characterType - Type of character
 * @returns {string} Full path to poses directory
 */
export function getPosesPath(characterType) {
  // Map character types to their pose directories
  const typeToDir = {
    'player': 'players',
    'figure': 'figures',
    'founder': 'founders',
  };
  const dirName = typeToDir[characterType] || `${characterType}s`;
  return join(CONFIG.paths.poses, dirName);
}

/**
 * Get the quotes directory for figures
 * @returns {string} Full path to quotes directory
 */
export function getQuotesPath() {
  return join(CONFIG.paths.quotes, 'figures');
}

/**
 * Get the characters directory for a type
 * @param {'player'|'figure'} characterType - Type of character
 * @returns {string} Full path to characters directory
 */
export function getCharactersPath(characterType) {
  return join(CONFIG.paths.characters, `${characterType}s`);
}

/**
 * Get the output directory for cards
 * @param {string} seriesId - Series ID
 * @param {string} pairingId - Pairing or solo ID
 * @param {string} [subSeries] - Optional sub-series
 * @returns {string} Full path to output directory
 */
export function getOutputPath(seriesId, pairingId, subSeries = null) {
  const basePath = join(CONFIG.paths.output, 'cards', seriesId);

  if (subSeries) {
    return join(basePath, subSeries, pairingId);
  }

  return join(basePath, pairingId);
}

/**
 * Check if a series exists
 * @param {string} seriesId - Series ID to check
 * @returns {boolean} True if series exists
 */
export function seriesExists(seriesId) {
  return CONFIG.series.includes(seriesId);
}

/**
 * Get series abbreviation for filenames
 * @param {string} seriesId - Full series ID
 * @returns {string} Abbreviated series ID
 */
export function getSeriesAbbrev(seriesId) {
  return CONFIG.seriesAbbreviations[seriesId] || seriesId.slice(0, 2);
}

/**
 * Get template abbreviation for filenames
 * @param {string} templateId - Full template ID
 * @returns {string} Abbreviated template ID
 */
export function getTemplateAbbrev(templateId) {
  return CONFIG.templateAbbreviations[templateId] || templateId.replace(/-/g, '').slice(0, 4);
}

export default CONFIG;
