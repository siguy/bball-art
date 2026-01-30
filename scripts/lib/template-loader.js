/**
 * Template Loader
 *
 * Series-aware template loading with fallback chain.
 * Loads templates with series-specific → shared fallback.
 *
 * @module template-loader
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to templates metadata
const TEMPLATES_META_PATH = join(CONFIG.paths.data, 'templates-meta.json');

// Cache for templates metadata
let templatesMeta = null;

/**
 * Load templates metadata (cached)
 * @returns {Object} Templates metadata
 */
function getTemplatesMeta() {
  if (templatesMeta) return templatesMeta;

  if (existsSync(TEMPLATES_META_PATH)) {
    templatesMeta = JSON.parse(readFileSync(TEMPLATES_META_PATH, 'utf-8'));
  } else {
    templatesMeta = { templates: {}, seriesSpecific: {}, darkVariants: {}, rivalryVariants: {} };
  }

  return templatesMeta;
}

/**
 * @typedef {Object} TemplateModule
 * @property {Function} generate - Generate prompt for pairing
 * @property {Function} [generateSolo] - Generate prompt for solo character
 */

/**
 * @typedef {Object} TemplateLoadResult
 * @property {TemplateModule} module - The loaded template module
 * @property {string} path - Path where template was found
 * @property {boolean} isSeriesSpecific - Whether template is series-specific
 */

/**
 * Load a template module with series fallback
 *
 * Search order:
 * 1. Series-specific: prompts/templates/{series}/{templateId}.js
 * 2. Shared: prompts/templates/{templateId}.js
 *
 * @param {string} templateId - Template ID (e.g., 'thunder-lightning')
 * @param {string|null} seriesHint - Series to check first
 * @returns {Promise<TemplateLoadResult>} Loaded template
 * @throws {Error} If template not found
 */
export async function loadTemplate(templateId, seriesHint = null) {
  const errors = [];

  // Try series-specific template first
  if (seriesHint) {
    const seriesPath = join(CONFIG.paths.templates, seriesHint, `${templateId}.js`);
    if (existsSync(seriesPath)) {
      try {
        const relativePath = `../../prompts/templates/${seriesHint}/${templateId}.js`;
        const module = await import(relativePath);
        const template = module.default || Object.values(module)[0];

        if (template && (template.generate || template.generateSolo)) {
          return {
            module: template,
            path: seriesPath,
            isSeriesSpecific: true,
          };
        }
      } catch (err) {
        errors.push(`Series-specific (${seriesHint}): ${err.message}`);
      }
    }
  }

  // Fall back to shared templates
  const sharedPath = join(CONFIG.paths.templates, `${templateId}.js`);
  if (existsSync(sharedPath)) {
    try {
      const relativePath = `../../prompts/templates/${templateId}.js`;
      const module = await import(relativePath);
      const template = module.default || Object.values(module)[0];

      if (template && (template.generate || template.generateSolo)) {
        return {
          module: template,
          path: sharedPath,
          isSeriesSpecific: false,
        };
      }
    } catch (err) {
      errors.push(`Shared: ${err.message}`);
    }
  }

  // Template not found - build helpful error message
  const availableTemplates = listTemplateIds();
  const errorMsg = `Template not found: ${templateId}\n` +
    `Available templates: ${availableTemplates.slice(0, 10).join(', ')}${availableTemplates.length > 10 ? '...' : ''}\n` +
    (errors.length > 0 ? `Load errors: ${errors.join('; ')}` : '');

  throw new Error(errorMsg);
}

/**
 * List all template IDs from filesystem
 * @returns {string[]} Array of template IDs
 */
function listTemplateIds() {
  const templates = [];

  // Shared templates
  if (existsSync(CONFIG.paths.templates)) {
    const files = readdirSync(CONFIG.paths.templates)
      .filter(f => f.endsWith('.js') && !f.startsWith('index'));
    templates.push(...files.map(f => f.replace('.js', '')));
  }

  // Series-specific templates
  for (const series of CONFIG.series) {
    const seriesDir = join(CONFIG.paths.templates, series);
    if (existsSync(seriesDir)) {
      const files = readdirSync(seriesDir)
        .filter(f => f.endsWith('.js') && !f.startsWith('index'));
      templates.push(...files.map(f => f.replace('.js', '')));
    }
  }

  return [...new Set(templates)].sort();
}

/**
 * List templates available for a series
 *
 * @param {string|null} seriesId - Series ID (or null for all)
 * @returns {Array<Object>} Templates with metadata
 */
export function listTemplates(seriesId = null) {
  const meta = getTemplatesMeta();
  const results = [];

  // Add shared templates
  for (const [id, template] of Object.entries(meta.templates || {})) {
    results.push({
      id,
      ...template,
      isSeriesSpecific: false,
      availableFor: 'all',
    });
  }

  // Add dark variants
  for (const [id, template] of Object.entries(meta.darkVariants || {})) {
    results.push({
      id,
      ...template,
      isSeriesSpecific: false,
      availableFor: 'all',
      isDarkVariant: true,
    });
  }

  // Add rivalry variants
  for (const [id, template] of Object.entries(meta.rivalryVariants || {})) {
    results.push({
      id,
      ...template,
      isSeriesSpecific: false,
      availableFor: 'all',
      isRivalryVariant: true,
    });
  }

  // Add series-specific templates
  if (seriesId && meta.seriesSpecific?.[seriesId]) {
    for (const [id, template] of Object.entries(meta.seriesSpecific[seriesId])) {
      results.push({
        id,
        ...template,
        isSeriesSpecific: true,
        availableFor: seriesId,
      });
    }
  } else if (!seriesId) {
    // Add all series-specific templates when no filter
    for (const [series, templates] of Object.entries(meta.seriesSpecific || {})) {
      for (const [id, template] of Object.entries(templates)) {
        results.push({
          id,
          ...template,
          isSeriesSpecific: true,
          availableFor: series,
        });
      }
    }
  }

  return results;
}

/**
 * Get metadata for a specific template
 *
 * @param {string} templateId - Template ID
 * @param {string|null} seriesId - Series for series-specific lookup
 * @returns {Object|null} Template metadata or null
 */
export function getTemplateMetadata(templateId, seriesId = null) {
  const meta = getTemplatesMeta();

  // Check series-specific first
  if (seriesId && meta.seriesSpecific?.[seriesId]?.[templateId]) {
    return {
      ...meta.seriesSpecific[seriesId][templateId],
      isSeriesSpecific: true,
    };
  }

  // Check shared templates
  if (meta.templates?.[templateId]) {
    return {
      ...meta.templates[templateId],
      isSeriesSpecific: false,
    };
  }

  // Check dark variants
  if (meta.darkVariants?.[templateId]) {
    return {
      ...meta.darkVariants[templateId],
      isSeriesSpecific: false,
      isDarkVariant: true,
    };
  }

  // Check rivalry variants
  if (meta.rivalryVariants?.[templateId]) {
    return {
      ...meta.rivalryVariants[templateId],
      isSeriesSpecific: false,
      isRivalryVariant: true,
    };
  }

  return null;
}

/**
 * Get the default template for a pairing type
 *
 * @param {'hero'|'villain'|'rivalry'|'spouse'} type - Pairing type
 * @returns {string} Default template ID
 */
export function getDefaultTemplate(type) {
  const meta = getTemplatesMeta();
  return meta.defaultByType?.[type] || 'thunder-lightning';
}

/**
 * Check if a template supports solo mode
 *
 * @param {string} templateId - Template ID to check
 * @param {string|null} seriesHint - Series hint for loading
 * @returns {Promise<boolean>} True if template has generateSolo method
 */
export async function supportssoloMode(templateId, seriesHint = null) {
  try {
    const { module } = await loadTemplate(templateId, seriesHint);
    return typeof module.generateSolo === 'function';
  } catch {
    return false;
  }
}

/**
 * Get available templates list as a formatted string for error messages
 * @returns {string} Formatted list
 */
export function getAvailableTemplatesHelp() {
  const shared = ['thunder-lightning', 'beam-team', 'metal-universe', 'downtown', 'kaboom', 'prizm-silver'];
  const dark = ['thunder-lightning-dark', 'beam-team-shadow', 'metal-universe-dark'];
  const torahTitans = ['spouse-blessing', 'trial-card', 'plague-card', 'three-way'];

  return [
    'Available templates:',
    `  Shared: ${shared.join(', ')}`,
    `  Dark variants: ${dark.join(', ')}`,
    `  Torah Titans: ${torahTitans.join(', ')}`,
  ].join('\n');
}

export default {
  loadTemplate,
  listTemplates,
  getTemplateMetadata,
  getDefaultTemplate,
  supportssoloMode,
  getAvailableTemplatesHelp,
};
