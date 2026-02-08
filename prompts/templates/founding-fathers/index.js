/**
 * Founding Fathers Template Index
 *
 * Exports all templates for the Founding Fathers series.
 */

export { portraitTransformationTemplate } from './portrait-transformation.js';

// Template registry for this series
export const templates = {
  'portrait-transformation': () => import('./portrait-transformation.js').then(m => m.portraitTransformationTemplate)
};

export default templates;
