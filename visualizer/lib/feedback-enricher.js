/**
 * Feedback Enricher
 *
 * Joins feedback data with card metadata from manifest and pairing data.
 * Adds contextual information like player/figure names, type, era, template details.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../..');

const PAIRINGS_DIR = join(ROOT, 'data/series/court-covenant/pairings');

/**
 * Load all pairing data for enrichment
 */
function loadAllPairings() {
  const pairings = {};

  if (!existsSync(PAIRINGS_DIR)) {
    return pairings;
  }

  const files = readdirSync(PAIRINGS_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const data = JSON.parse(readFileSync(join(PAIRINGS_DIR, file), 'utf-8'));
    pairings[data.id] = data;
  }

  return pairings;
}

/**
 * Extract pose information from prompt text if possible
 * @param {string} prompt - The prompt text
 * @returns {object} Extracted pose info
 */
function extractPoseFromPrompt(prompt) {
  if (!prompt) return { playerPose: null, figurePose: null };

  // Look for pose markers in the prompt
  // Prompts generated with poses typically include the pose description
  const poseInfo = { playerPose: null, figurePose: null };

  // Try to extract interaction type
  const interactionMatch = prompt.match(/=== INTERACTION: (.+?) ===/);
  if (interactionMatch) {
    poseInfo.interaction = interactionMatch[1].toLowerCase().replace(/ /g, '-');
  }

  return poseInfo;
}

/**
 * Enrich a single feedback item with card and pairing metadata
 * @param {string} cardId - The card ID
 * @param {object} feedbackItem - The feedback data
 * @param {object} card - The card from manifest
 * @param {object} pairings - All pairing data
 * @returns {object} Enriched feedback item
 */
function enrichFeedbackItem(cardId, feedbackItem, card, pairings) {
  const enriched = {
    cardId,
    rating: feedbackItem.rating || null,
    notes: feedbackItem.notes || '',
    updatedAt: feedbackItem.updatedAt || null
  };

  if (!card) {
    return enriched;
  }

  // Add card metadata
  enriched.template = card.template;
  enriched.timestamp = card.timestamp;
  enriched.isoTimestamp = card.isoTimestamp;
  enriched.interaction = card.interaction;
  enriched.mode = card.mode || 'pairing';

  // Handle pairing vs solo mode
  if (card.mode === 'solo') {
    enriched.characterType = card.characterType;
    enriched.characterId = card.characterId;
    enriched.pairingId = null;
  } else {
    enriched.pairingId = card.pairingId;

    // Add pairing metadata if available
    const pairing = pairings[card.pairingId];
    if (pairing) {
      enriched.playerName = pairing.player.name;
      enriched.playerDisplayName = pairing.player.displayName || pairing.player.name;
      enriched.figureName = pairing.figure.name;
      enriched.figureDisplayName = pairing.figure.displayName || pairing.figure.name;
      enriched.type = pairing.type || 'hero';
      enriched.era = pairing.player.era || 'unknown';
      enriched.connection = pairing.connection?.thematic || '';
    }
  }

  // Extract pose info from prompt if available
  if (card.prompt) {
    const poseInfo = extractPoseFromPrompt(card.prompt);
    Object.assign(enriched, poseInfo);
  }

  return enriched;
}

/**
 * Enrich all feedback with card and pairing metadata
 * @param {object} feedback - Raw feedback object keyed by cardId
 * @param {object} manifest - Manifest with cards array
 * @param {object} pairings - All pairing data (optional, will load if not provided)
 * @returns {object} Enriched feedback export object
 */
export function enrichFeedback(feedback, manifest, pairings = null) {
  // Create card lookup map
  const cardMap = {};
  for (const card of manifest.cards || []) {
    cardMap[card.id] = card;
  }

  // Calculate summary statistics
  const summary = {
    total: Object.keys(feedback).length,
    loved: 0,
    liked: 0,
    issues: 0,
    unrated: 0
  };

  // Enrich each feedback item
  const items = [];

  for (const [cardId, feedbackItem] of Object.entries(feedback)) {
    const card = cardMap[cardId];
    const enriched = enrichFeedbackItem(cardId, feedbackItem, card, pairings || {});
    items.push(enriched);

    // Update summary
    switch (feedbackItem.rating) {
      case 'loved': summary.loved++; break;
      case 'liked': summary.liked++; break;
      case 'issues': summary.issues++; break;
      default: summary.unrated++;
    }
  }

  // Sort by timestamp (newest first)
  items.sort((a, b) => {
    if (!a.isoTimestamp && !b.isoTimestamp) return 0;
    if (!a.isoTimestamp) return 1;
    if (!b.isoTimestamp) return -1;
    return b.isoTimestamp.localeCompare(a.isoTimestamp);
  });

  return {
    exportDate: new Date().toISOString(),
    summary,
    items
  };
}

/**
 * Filter enriched feedback by rating
 * @param {object} enrichedFeedback - Enriched feedback object
 * @param {string} rating - Rating to filter by (loved, liked, issues, null for unrated)
 * @returns {object} Filtered enriched feedback
 */
export function filterByRating(enrichedFeedback, rating) {
  const filtered = {
    ...enrichedFeedback,
    items: enrichedFeedback.items.filter(item => {
      if (rating === 'none' || rating === 'unrated') {
        return !item.rating;
      }
      return item.rating === rating;
    })
  };

  // Recalculate summary for filtered set
  filtered.summary = {
    total: filtered.items.length,
    loved: filtered.items.filter(i => i.rating === 'loved').length,
    liked: filtered.items.filter(i => i.rating === 'liked').length,
    issues: filtered.items.filter(i => i.rating === 'issues').length,
    unrated: filtered.items.filter(i => !i.rating).length
  };

  return filtered;
}

/**
 * Convert enriched feedback to CSV format
 * @param {object} enrichedFeedback - Enriched feedback object
 * @returns {string} CSV string
 */
export function toCSV(enrichedFeedback) {
  const headers = [
    'cardId',
    'rating',
    'notes',
    'pairingId',
    'template',
    'playerName',
    'figureName',
    'type',
    'era',
    'interaction',
    'timestamp',
    'mode',
    'characterType',
    'characterId'
  ];

  const rows = [headers.join(',')];

  for (const item of enrichedFeedback.items) {
    const row = headers.map(h => {
      const value = item[h];
      if (value === null || value === undefined) return '';
      // Escape quotes and wrap in quotes if contains comma
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

export default {
  enrichFeedback,
  filterByRating,
  toCSV
};
