#!/usr/bin/env node
/**
 * Torah Titans Templates Index
 *
 * Series-specific templates for Torah Titans (Bible-only) cards.
 * These templates are designed for figure-figure pairings and biblical narratives.
 */

export { spouseBlessingTemplate } from './spouse-blessing.js';
export { trialCardTemplate } from './trial-card.js';
export { plagueCardTemplate } from './plague-card.js';
export { threeWayTemplate } from './three-way.js';

// Sibling Rivalry Templates
export { siblingCardTemplate } from './sibling-card.js';
export { siblingIconTemplate } from './sibling-icon.js';
export { siblingDualityTemplate } from './sibling-duality.js';

// Template registry for Torah Titans
export const torahTitansTemplates = {
  'spouse-blessing': () => import('./spouse-blessing.js').then(m => m.spouseBlessingTemplate),
  'trial-card': () => import('./trial-card.js').then(m => m.trialCardTemplate),
  'plague-card': () => import('./plague-card.js').then(m => m.plagueCardTemplate),
  'three-way': () => import('./three-way.js').then(m => m.threeWayTemplate),
  'sibling-card': () => import('./sibling-card.js').then(m => m.siblingCardTemplate),
  'sibling-icon': () => import('./sibling-icon.js').then(m => m.siblingIconTemplate),
  'sibling-duality': () => import('./sibling-duality.js').then(m => m.siblingDualityTemplate)
};

export default torahTitansTemplates;
