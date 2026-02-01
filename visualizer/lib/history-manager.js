/**
 * History Manager
 * Tracks version history for card iterations
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HISTORY_PATH = join(__dirname, '../data/card-history.json');

/**
 * Load card history from disk
 * @returns {Object} History data keyed by base card identifier
 */
export function loadHistory() {
  if (existsSync(HISTORY_PATH)) {
    try {
      return JSON.parse(readFileSync(HISTORY_PATH, 'utf-8'));
    } catch (err) {
      console.error('Failed to load card history:', err);
      return {};
    }
  }
  return {};
}

/**
 * Save card history to disk
 * @param {Object} history - History data to save
 */
export function saveHistory(history) {
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
}

/**
 * Generate a base card identifier from card data
 * This groups cards by pairing+template (or character+template for solo)
 * @param {Object} card - Card data
 * @returns {string} Base identifier
 */
export function getBaseCardId(card) {
  if (card.mode === 'solo') {
    return `solo-${card.characterType}-${card.characterId}__${card.template}`;
  }
  return `${card.pairingId}__${card.template}`;
}

/**
 * Add a version to card history
 * @param {Object} card - Full card data
 * @param {Object} options - Additional options
 * @param {string} options.feedbackNote - Note about what was changed
 * @returns {Object} The created version entry
 */
export function addVersion(card, options = {}) {
  const history = loadHistory();
  const baseId = getBaseCardId(card);

  if (!history[baseId]) {
    history[baseId] = {
      baseId,
      pairingId: card.pairingId,
      characterId: card.characterId,
      characterType: card.characterType,
      mode: card.mode || 'pairing',
      template: card.template,
      versions: []
    };
  }

  const versions = history[baseId].versions;
  const nextVersion = versions.length + 1;

  const versionEntry = {
    version: nextVersion,
    cardId: card.id,
    filename: card.filename,
    path: card.path,
    prompt: card.prompt,
    timestamp: card.isoTimestamp || new Date().toISOString(),
    addedAt: new Date().toISOString()
  };

  // Add poses if available
  if (card.poses) {
    versionEntry.poses = card.poses;
  }

  // Add feedback note if provided
  if (options.feedbackNote) {
    versionEntry.feedbackNote = options.feedbackNote;
  }

  versions.push(versionEntry);
  saveHistory(history);

  return versionEntry;
}

/**
 * Get all versions for a card
 * @param {string} baseId - Base card identifier (or card object to derive from)
 * @returns {Object|null} Version history or null if not found
 */
export function getVersions(baseId) {
  const history = loadHistory();

  // If passed a card object, derive the baseId
  if (typeof baseId === 'object') {
    baseId = getBaseCardId(baseId);
  }

  return history[baseId] || null;
}

/**
 * Get a specific version of a card
 * @param {string} baseId - Base card identifier
 * @param {number} version - Version number (1-indexed)
 * @returns {Object|null} Version entry or null
 */
export function getVersion(baseId, version) {
  const cardHistory = getVersions(baseId);
  if (!cardHistory) return null;

  return cardHistory.versions.find(v => v.version === version) || null;
}

/**
 * Find which version a specific card ID belongs to
 * @param {string} cardId - Full card ID
 * @returns {Object|null} { baseId, version, entry } or null
 */
export function findVersionByCardId(cardId) {
  const history = loadHistory();

  for (const [baseId, cardHistory] of Object.entries(history)) {
    const entry = cardHistory.versions.find(v => v.cardId === cardId);
    if (entry) {
      return {
        baseId,
        version: entry.version,
        totalVersions: cardHistory.versions.length,
        entry,
        history: cardHistory
      };
    }
  }

  return null;
}

/**
 * Update metadata for a version
 * @param {string} baseId - Base card identifier
 * @param {number} version - Version number
 * @param {Object} updates - Fields to update
 * @returns {boolean} Success
 */
export function updateVersion(baseId, version, updates) {
  const history = loadHistory();
  const cardHistory = history[baseId];

  if (!cardHistory) return false;

  const entry = cardHistory.versions.find(v => v.version === version);
  if (!entry) return false;

  Object.assign(entry, updates);
  saveHistory(history);

  return true;
}

/**
 * Get comparison data between two versions
 * @param {string} baseId - Base card identifier
 * @param {number} version1 - First version number
 * @param {number} version2 - Second version number
 * @returns {Object|null} Comparison data
 */
export function compareVersions(baseId, version1, version2) {
  const cardHistory = getVersions(baseId);
  if (!cardHistory) return null;

  const v1 = cardHistory.versions.find(v => v.version === version1);
  const v2 = cardHistory.versions.find(v => v.version === version2);

  if (!v1 || !v2) return null;

  return {
    baseId,
    version1: v1,
    version2: v2,
    pairingId: cardHistory.pairingId,
    template: cardHistory.template
  };
}

/**
 * Scan manifest cards and auto-populate history for existing cards
 * This is useful for migrating existing cards into the history system
 * @param {Object[]} cards - Array of cards from manifest
 * @returns {Object} Stats about what was added
 */
export function populateHistoryFromManifest(cards) {
  const history = loadHistory();
  let added = 0;
  let skipped = 0;

  for (const card of cards) {
    const baseId = getBaseCardId(card);

    if (!history[baseId]) {
      history[baseId] = {
        baseId,
        pairingId: card.pairingId,
        characterId: card.characterId,
        characterType: card.characterType,
        mode: card.mode || 'pairing',
        template: card.template,
        versions: []
      };
    }

    // Check if this card is already in versions
    const exists = history[baseId].versions.some(v => v.cardId === card.id);
    if (exists) {
      skipped++;
      continue;
    }

    // Add as a version
    const versionNum = history[baseId].versions.length + 1;
    history[baseId].versions.push({
      version: versionNum,
      cardId: card.id,
      filename: card.filename,
      path: card.path,
      prompt: card.prompt,
      timestamp: card.isoTimestamp,
      addedAt: new Date().toISOString(),
      poses: card.poses
    });
    added++;
  }

  saveHistory(history);

  return { added, skipped, total: cards.length };
}

export default {
  loadHistory,
  saveHistory,
  getBaseCardId,
  addVersion,
  getVersions,
  getVersion,
  findVersionByCardId,
  updateVersion,
  compareVersions,
  populateHistoryFromManifest
};
