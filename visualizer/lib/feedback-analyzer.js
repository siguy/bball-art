/**
 * Feedback Analyzer
 *
 * Derives patterns and statistics from enriched feedback data.
 * Generates recommendations for template/pairing combinations.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HINTS_PATH = join(__dirname, '../data/generation-hints.json');

/**
 * Calculate a success score for a set of ratings
 * Score ranges from 0 to 1, where:
 *   - loved = 1.0
 *   - liked = 0.6
 *   - issues = 0.0
 *   - unrated = 0.3 (neutral)
 * @param {object} counts - { loved, liked, issues, total }
 * @returns {number} Score between 0 and 1
 */
function calculateScore(counts) {
  if (counts.total === 0) return 0;

  const lovedScore = (counts.loved || 0) * 1.0;
  const likedScore = (counts.liked || 0) * 0.6;
  const issuesScore = (counts.issues || 0) * 0.0;
  const unratedScore = ((counts.total - (counts.loved || 0) - (counts.liked || 0) - (counts.issues || 0))) * 0.3;

  return (lovedScore + likedScore + issuesScore + unratedScore) / counts.total;
}

/**
 * Aggregate feedback by a specific dimension
 * @param {array} items - Enriched feedback items
 * @param {string} dimension - Field to group by (template, pairingId, era, type)
 * @returns {object} Aggregated stats keyed by dimension value
 */
function aggregateBy(items, dimension) {
  const groups = {};

  for (const item of items) {
    const key = item[dimension];
    if (!key) continue;

    if (!groups[key]) {
      groups[key] = { loved: 0, liked: 0, issues: 0, total: 0 };
    }

    groups[key].total++;

    switch (item.rating) {
      case 'loved': groups[key].loved++; break;
      case 'liked': groups[key].liked++; break;
      case 'issues': groups[key].issues++; break;
    }
  }

  // Calculate scores
  for (const [key, counts] of Object.entries(groups)) {
    groups[key].score = calculateScore(counts);
  }

  return groups;
}

/**
 * Find problematic combinations (template + pairing with issues)
 * @param {array} items - Enriched feedback items
 * @returns {array} Array of { pairingId, template, notes }
 */
function findProblemCombinations(items) {
  const problems = [];
  const combos = {};

  // Group by pairing+template
  for (const item of items) {
    if (!item.pairingId || !item.template) continue;

    const key = `${item.pairingId}::${item.template}`;
    if (!combos[key]) {
      combos[key] = { pairingId: item.pairingId, template: item.template, issues: 0, notes: [] };
    }

    if (item.rating === 'issues') {
      combos[key].issues++;
      if (item.notes) {
        combos[key].notes.push(item.notes);
      }
    }
  }

  // Return combos with issues
  for (const [key, combo] of Object.entries(combos)) {
    if (combo.issues > 0) {
      problems.push(combo);
    }
  }

  // Sort by issue count (descending)
  problems.sort((a, b) => b.issues - a.issues);

  return problems;
}

/**
 * Analyze feedback data and return comprehensive statistics
 * @param {object} enrichedFeedback - Enriched feedback object from feedback-enricher
 * @returns {object} Analysis results
 */
export function analyzeFeedback(enrichedFeedback) {
  const items = enrichedFeedback.items || [];

  // Aggregate by different dimensions
  const templatePerformance = aggregateBy(items, 'template');
  const pairingPerformance = aggregateBy(items, 'pairingId');
  const eraPerformance = aggregateBy(items, 'era');
  const typePerformance = aggregateBy(items, 'type');

  // Find top performing templates (sorted by score, then by total)
  const topTemplates = Object.entries(templatePerformance)
    .sort((a, b) => {
      if (b[1].score !== a[1].score) return b[1].score - a[1].score;
      return b[1].total - a[1].total;
    })
    .slice(0, 5)
    .map(([name, stats]) => ({ name, ...stats }));

  // Find top performing pairings
  const topPairings = Object.entries(pairingPerformance)
    .sort((a, b) => {
      if (b[1].score !== a[1].score) return b[1].score - a[1].score;
      return b[1].total - a[1].total;
    })
    .slice(0, 10)
    .map(([name, stats]) => ({ name, ...stats }));

  // Find problem combinations
  const problemCombinations = findProblemCombinations(items);

  return {
    analyzedAt: new Date().toISOString(),
    totalCards: items.length,
    summary: enrichedFeedback.summary,
    templatePerformance,
    pairingPerformance,
    eraPerformance,
    typePerformance,
    topTemplates,
    topPairings,
    problemCombinations
  };
}

/**
 * Generate hints for card generation based on feedback analysis
 * @param {object} analysis - Analysis results from analyzeFeedback
 * @returns {object} Generation hints
 */
export function generateHints(analysis) {
  const hints = {
    generatedAt: new Date().toISOString(),
    quickHints: {},
    globalRecommendations: {
      topTemplates: analysis.topTemplates.slice(0, 3).map(t => t.name),
      avoidTemplates: []
    }
  };

  // Find templates with consistently low scores
  for (const [name, stats] of Object.entries(analysis.templatePerformance)) {
    if (stats.total >= 3 && stats.score < 0.3) {
      hints.globalRecommendations.avoidTemplates.push(name);
    }
  }

  // Generate per-pairing hints
  for (const [pairingId, pairingStats] of Object.entries(analysis.pairingPerformance)) {
    const pairingHints = {
      recommendedTemplates: [],
      avoidTemplates: [],
      issueNotes: []
    };

    // Find which templates work well for this pairing
    const pairingCards = analysis.problemCombinations
      .filter(p => p.pairingId === pairingId);

    // Add templates to avoid
    for (const problem of pairingCards) {
      pairingHints.avoidTemplates.push(problem.template);
      pairingHints.issueNotes.push(...problem.notes.slice(0, 3));
    }

    // Recommend top global templates that aren't in avoid list
    pairingHints.recommendedTemplates = hints.globalRecommendations.topTemplates
      .filter(t => !pairingHints.avoidTemplates.includes(t));

    // Only add if there's meaningful data
    if (pairingHints.recommendedTemplates.length > 0 ||
        pairingHints.avoidTemplates.length > 0 ||
        pairingHints.issueNotes.length > 0) {
      hints.quickHints[pairingId] = pairingHints;
    }
  }

  return hints;
}

/**
 * Save hints to file
 * @param {object} hints - Generation hints
 */
export function saveHints(hints) {
  writeFileSync(HINTS_PATH, JSON.stringify(hints, null, 2));
}

/**
 * Load hints from file
 * @returns {object|null} Generation hints or null if not found
 */
export function loadHints() {
  if (!existsSync(HINTS_PATH)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(HINTS_PATH, 'utf-8'));
  } catch (err) {
    console.error('Failed to load hints:', err.message);
    return null;
  }
}

/**
 * Get hints for a specific pairing
 * @param {string} pairingId - The pairing ID
 * @returns {object|null} Hints for the pairing or null
 */
export function getHintsForPairing(pairingId) {
  const hints = loadHints();
  if (!hints) return null;

  return {
    pairing: hints.quickHints[pairingId] || null,
    global: hints.globalRecommendations
  };
}

export default {
  analyzeFeedback,
  generateHints,
  saveHints,
  loadHints,
  getHintsForPairing
};
