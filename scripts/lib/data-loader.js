/**
 * Data Loader
 *
 * Unified module for loading pairings, characters, poses, and quotes.
 * Handles series/sub-series discovery and character resolution.
 *
 * @module data-loader
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import {
  CONFIG,
  getPairingsPath,
  getSubSeriesPath,
  getPosesPath,
  getQuotesPath,
  getCharactersPath,
} from './config.js';

/**
 * @typedef {Object} PairingFileResult
 * @property {string} path - Full path to the pairing file
 * @property {string} series - Series ID
 * @property {string|null} subSeries - Sub-series name if applicable
 */

/**
 * @typedef {Object} PairingData
 * @property {string} id - Pairing ID
 * @property {string} series - Series ID
 * @property {string|null} subSeries - Sub-series if applicable
 * @property {string} type - Pairing type (hero, villain, spouse, etc.)
 * @property {Object} player - Player data (for player-figure pairings)
 * @property {Object} figure - Figure data (for player-figure pairings)
 * @property {Array} characters - Characters array (for multi-character pairings)
 */

/**
 * @typedef {Object} CharacterResult
 * @property {Object} data - Character data object
 * @property {string} series - Series the character was found in
 */

/**
 * Find a pairing file across all series and sub-series
 *
 * @param {string} pairingId - The pairing ID to find
 * @param {string|null} preferredSeries - Series to check first
 * @returns {PairingFileResult|null} File info or null if not found
 */
export function findPairingFile(pairingId, preferredSeries = null) {
  // Build search order: preferred series first, then all known series
  const searchOrder = preferredSeries
    ? [preferredSeries, ...CONFIG.series.filter(s => s !== preferredSeries)]
    : CONFIG.series;

  for (const series of searchOrder) {
    // Check main pairings directory
    const mainPath = join(getPairingsPath(series), `${pairingId}.json`);
    if (existsSync(mainPath)) {
      return { path: mainPath, series, subSeries: null };
    }

    // Check sub-series directories
    const subSeriesDir = getSubSeriesPath(series);
    if (existsSync(subSeriesDir)) {
      const subDirs = readdirSync(subSeriesDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const subDir of subDirs) {
        const subPath = join(subSeriesDir, subDir, `${pairingId}.json`);
        if (existsSync(subPath)) {
          return { path: subPath, series, subSeries: subDir };
        }
      }
    }
  }

  return null;
}

/**
 * Load pairing data from a pairing ID
 *
 * @param {string} pairingId - The pairing ID to load
 * @param {string|null} preferredSeries - Series to check first
 * @returns {PairingData|null} Pairing data with series info, or null
 */
export function loadPairing(pairingId, preferredSeries = null) {
  const fileResult = findPairingFile(pairingId, preferredSeries);

  if (!fileResult) {
    return null;
  }

  const pairing = JSON.parse(readFileSync(fileResult.path, 'utf-8'));

  return {
    ...pairing,
    id: pairingId,
    series: fileResult.series,
    subSeries: fileResult.subSeries,
  };
}

/**
 * List all pairings for a series
 *
 * @param {string|null} seriesId - Series to list (or all if null)
 * @returns {Array<{id: string, series: string, subSeries: string|null}>}
 */
export function listPairings(seriesId = null) {
  const results = [];
  const seriesToScan = seriesId ? [seriesId] : CONFIG.series;

  for (const series of seriesToScan) {
    // Scan main pairings directory
    const pairingsDir = getPairingsPath(series);
    if (existsSync(pairingsDir)) {
      const files = readdirSync(pairingsDir)
        .filter(f => f.endsWith('.json') && f !== 'NEW-PAIRINGS.md');

      for (const file of files) {
        results.push({
          id: file.replace('.json', ''),
          series,
          subSeries: null,
        });
      }
    }

    // Scan sub-series directories
    const subSeriesDir = getSubSeriesPath(series);
    if (existsSync(subSeriesDir)) {
      const subDirs = readdirSync(subSeriesDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const subDir of subDirs) {
        const subPairingsDir = join(subSeriesDir, subDir);
        const subFiles = readdirSync(subPairingsDir)
          .filter(f => f.endsWith('.json'));

        for (const file of subFiles) {
          results.push({
            id: file.replace('.json', ''),
            series,
            subSeries: subDir,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Get character IDs from a pairing (handles both player-figure and multi-character)
 *
 * @param {Object} pairing - Pairing data object
 * @returns {{char1Id: string, char2Id: string, char1: Object, char2: Object, char1Type: string, char2Type: string}}
 */
export function extractPairingCharacters(pairing) {
  let char1, char2;

  if (pairing.player && pairing.figure) {
    // Standard player-figure pairing
    char1 = pairing.player;
    char2 = pairing.figure;
  } else if (pairing.characters && pairing.characters.length >= 2) {
    // Multi-character pairing (figure-figure, etc.)
    char1 = pairing.characters[0];
    char2 = pairing.characters[1];
  } else {
    throw new Error('Invalid pairing structure - needs player/figure or characters array');
  }

  // Get pose file IDs
  const char1Id = char1.poseFileId || generateFallbackId(char1.name);
  const char2Id = char2.poseFileId || generateFallbackId(char2.name);

  // Determine character types
  const char1Type = char1.characterType || 'player';
  const char2Type = char2.characterType || 'figure';

  return {
    char1Id,
    char2Id,
    char1,
    char2,
    char1Type,
    char2Type,
  };
}

/**
 * Generate a fallback ID from a name
 * "Isiah Thomas" -> "isiah-thomas"
 *
 * @param {string} name - Display name
 * @returns {string} Kebab-case ID
 */
export function generateFallbackId(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Find character data from standalone file or pairings
 *
 * @param {'player'|'figure'} characterType - Type of character
 * @param {string} characterId - Character ID (poseFileId)
 * @param {string|null} preferredSeries - Series to check first
 * @returns {CharacterResult|null} Character data with series, or null
 */
export function findCharacterData(characterType, characterId, preferredSeries = null) {
  // First, check for standalone character file
  const standaloneFile = join(getCharactersPath(characterType), `${characterId}.json`);

  if (existsSync(standaloneFile)) {
    const data = JSON.parse(readFileSync(standaloneFile, 'utf-8'));
    return {
      data: { ...data, type: characterType },
      series: data.series || preferredSeries || CONFIG.defaultSeries,
    };
  }

  // Search pairings across all series
  const searchOrder = preferredSeries
    ? [preferredSeries, ...CONFIG.series.filter(s => s !== preferredSeries)]
    : CONFIG.series;

  for (const series of searchOrder) {
    // Search main pairings directory
    const pairingsDir = getPairingsPath(series);
    if (existsSync(pairingsDir)) {
      const result = searchPairingsForCharacter(pairingsDir, characterType, characterId, series);
      if (result) return result;
    }

    // Search sub-series directories
    const subSeriesDir = getSubSeriesPath(series);
    if (existsSync(subSeriesDir)) {
      const subDirs = readdirSync(subSeriesDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const subDir of subDirs) {
        const subPairingsDir = join(subSeriesDir, subDir);
        const result = searchPairingsForCharacter(subPairingsDir, characterType, characterId, series);
        if (result) return result;
      }
    }
  }

  return null;
}

/**
 * Search a pairings directory for a specific character
 *
 * @param {string} pairingsDir - Directory to search
 * @param {'player'|'figure'} characterType - Type to match
 * @param {string} characterId - ID to match (poseFileId)
 * @param {string} series - Series ID
 * @returns {CharacterResult|null}
 */
function searchPairingsForCharacter(pairingsDir, characterType, characterId, series) {
  if (!existsSync(pairingsDir)) return null;

  const files = readdirSync(pairingsDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const pairing = JSON.parse(readFileSync(join(pairingsDir, file), 'utf-8'));

    // Check player field
    if (characterType === 'player' && pairing.player?.poseFileId === characterId) {
      return {
        data: { ...pairing.player, type: 'player' },
        series,
      };
    }

    // Check figure field
    if (characterType === 'figure' && pairing.figure?.poseFileId === characterId) {
      return {
        data: { ...pairing.figure, type: 'figure' },
        series,
      };
    }

    // Check multi-character pairings
    if (pairing.characters) {
      for (const char of pairing.characters) {
        if (char.poseFileId === characterId && char.characterType === characterType) {
          return {
            data: { ...char, type: characterType },
            series,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Load pose data for a character
 *
 * @param {'player'|'figure'|'founder'} characterType - Type of character
 * @param {string} poseFileId - Pose file ID
 * @returns {Object|null} Pose data object or null
 */
export function loadPoseFile(characterType, poseFileId) {
  const posePath = join(getPosesPath(characterType), `${poseFileId}.json`);

  if (!existsSync(posePath)) {
    return null;
  }

  return JSON.parse(readFileSync(posePath, 'utf-8'));
}

/**
 * Load founder data from the founding-fathers series
 *
 * @param {string} founderId - Founder ID (e.g., 'george-washington')
 * @returns {Object|null} Founder data object or null
 */
export function loadFounder(founderId) {
  const founderPath = join(CONFIG.paths.series, 'founding-fathers', 'founders', `${founderId}.json`);

  if (!existsSync(founderPath)) {
    return null;
  }

  const founder = JSON.parse(readFileSync(founderPath, 'utf-8'));

  // Also load the pose file and attach poses
  const poseFile = loadPoseFile('founder', founder.poseFileId || founderId);
  if (poseFile) {
    founder.poses = poseFile.poses;
    founder.defaultPose = poseFile.defaultPose;
  }

  return founder;
}

/**
 * List all founders in the founding-fathers series
 *
 * @returns {string[]} Array of founder IDs
 */
export function listFounders() {
  const foundersDir = join(CONFIG.paths.series, 'founding-fathers', 'founders');

  if (!existsSync(foundersDir)) {
    return [];
  }

  return readdirSync(foundersDir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

/**
 * Load quotes data for a figure
 *
 * @param {string} figureId - Figure ID
 * @returns {Object|null} Quotes data object or null
 */
export function loadQuotesFile(figureId) {
  const quotesPath = join(getQuotesPath(), `${figureId}.json`);

  if (!existsSync(quotesPath)) {
    return null;
  }

  return JSON.parse(readFileSync(quotesPath, 'utf-8'));
}

/**
 * List available pose files for a character type
 *
 * @param {'player'|'figure'} characterType - Type of character
 * @returns {string[]} Array of pose file IDs
 */
export function listPoseFiles(characterType) {
  const posesDir = getPosesPath(characterType);

  if (!existsSync(posesDir)) {
    return [];
  }

  return readdirSync(posesDir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

/**
 * List available pairings with helpful error messages
 *
 * @param {string} seriesId - Series to list
 * @param {number} limit - Max items to show
 * @returns {string[]} Array of pairing IDs
 */
export function listAvailablePairings(seriesId = 'court-covenant', limit = 10) {
  const pairingsDir = getPairingsPath(seriesId);

  if (!existsSync(pairingsDir)) {
    return [];
  }

  const files = readdirSync(pairingsDir)
    .filter(f => f.endsWith('.json') && !f.startsWith('NEW-'));

  return files.slice(0, limit).map(f => f.replace('.json', ''));
}

export default {
  findPairingFile,
  loadPairing,
  listPairings,
  extractPairingCharacters,
  generateFallbackId,
  findCharacterData,
  loadPoseFile,
  loadQuotesFile,
  listPoseFiles,
  listAvailablePairings,
  loadFounder,
  listFounders,
};
