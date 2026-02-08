/**
 * Parasha Pack Templates
 *
 * Educational card templates for weekly Torah portion decks.
 * Designed for preschool/kindergarten (ages 4-6).
 */

export { anchorCardTemplate } from './anchor-card.js';
export { spotlightCardTemplate } from './spotlight-card.js';
export { actionCardTemplate } from './action-card.js';
export { thinkerCardTemplate } from './thinker-card.js';
export { powerWordCardTemplate } from './power-word-card.js';

// Common utilities
export { default as styleGuide } from './common/style-guide.js';
export { default as characterContinuity } from './common/character-continuity.js';

// Template registry for loader
export const templates = {
  'anchor-card': () => import('./anchor-card.js'),
  'spotlight-card': () => import('./spotlight-card.js'),
  'action-card': () => import('./action-card.js'),
  'thinker-card': () => import('./thinker-card.js'),
  'power-word-card': () => import('./power-word-card.js'),
};

/**
 * Load a Parasha Pack template by ID
 * @param {string} templateId - Template ID
 * @returns {Promise<object>} Template module
 */
export async function loadParashaPackTemplate(templateId) {
  const loader = templates[templateId];
  if (!loader) {
    throw new Error(`Unknown Parasha Pack template: ${templateId}`);
  }
  return await loader();
}

export default {
  templates,
  loadParashaPackTemplate
};
