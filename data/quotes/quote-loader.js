#!/usr/bin/env node
/**
 * Quote Loader
 * Loads biblical quotes from the quotes database
 *
 * Usage:
 *   import { getQuote, getQuotesByFigure, getQuoteWithSource } from './quote-loader.js';
 *
 *   const quote = getQuote('esau', 'birthright-sold');
 *   // Returns: { source, context, hebrew, english, mood }
 *
 *   const fullQuote = getQuoteWithSource('esau', 'birthright-sold');
 *   // Returns quote with figureId and quoteId included
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache for loaded quote files
const quoteCache = new Map();

/**
 * Load quotes for a specific figure
 */
function loadFigureQuotes(figureId) {
  if (quoteCache.has(figureId)) {
    return quoteCache.get(figureId);
  }

  const quotePath = join(__dirname, 'figures', `${figureId}.json`);

  try {
    const data = JSON.parse(readFileSync(quotePath, 'utf-8'));
    quoteCache.set(figureId, data);
    return data;
  } catch (err) {
    console.warn(`No quotes found for figure: ${figureId}`);
    return null;
  }
}

/**
 * Get a specific quote by figure and quote ID
 * @param {string} figureId - The figure ID (e.g., 'esau', 'goliath')
 * @param {string} quoteId - The quote ID (e.g., 'birthright-sold')
 * @returns {object|null} The quote object or null if not found
 */
export function getQuote(figureId, quoteId) {
  const figureData = loadFigureQuotes(figureId);
  if (!figureData || !figureData.quotes) return null;
  return figureData.quotes[quoteId] || null;
}

/**
 * Get a quote with source metadata included
 * @param {string} figureId - The figure ID
 * @param {string} quoteId - The quote ID
 * @returns {object|null} The quote with figureId, figureName, and quoteId included
 */
export function getQuoteWithSource(figureId, quoteId) {
  const figureData = loadFigureQuotes(figureId);
  if (!figureData || !figureData.quotes) return null;

  const quote = figureData.quotes[quoteId];
  if (!quote) return null;

  return {
    figureId,
    figureName: figureData.name,
    quoteId,
    ...quote
  };
}

/**
 * Get all quotes for a figure
 * @param {string} figureId - The figure ID
 * @returns {object|null} Object with figure metadata and all quotes
 */
export function getQuotesByFigure(figureId) {
  return loadFigureQuotes(figureId);
}

/**
 * List all available figures with quotes
 * @returns {string[]} Array of figure IDs
 */
export function listFiguresWithQuotes() {
  const figuresDir = join(__dirname, 'figures');
  try {
    return readdirSync(figuresDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch (err) {
    return [];
  }
}

/**
 * Format a quote for display (card, social media, etc.)
 * @param {string} figureId - The figure ID
 * @param {string} quoteId - The quote ID
 * @param {object} options - Formatting options
 * @returns {string} Formatted quote string
 */
export function formatQuote(figureId, quoteId, options = {}) {
  const quote = getQuoteWithSource(figureId, quoteId);
  if (!quote) return null;

  const { includeHebrew = true, includeSource = true, style = 'full' } = options;

  if (style === 'hebrew-only') {
    return quote.hebrew;
  }

  if (style === 'english-only') {
    return `"${quote.english}"${includeSource ? ` - ${quote.source}` : ''}`;
  }

  // Full style: Hebrew + English + Source
  let result = '';
  if (includeHebrew) {
    result += `${quote.hebrew}\n`;
  }
  result += `"${quote.english}"`;
  if (includeSource) {
    result += `\n— ${quote.source}`;
  }

  return result;
}

/**
 * Get a random quote for a figure
 * @param {string} figureId - The figure ID
 * @returns {object|null} A random quote with metadata
 */
export function getRandomQuote(figureId) {
  const figureData = loadFigureQuotes(figureId);
  if (!figureData || !figureData.quotes) return null;

  const quoteIds = Object.keys(figureData.quotes);
  if (quoteIds.length === 0) return null;

  const randomId = quoteIds[Math.floor(Math.random() * quoteIds.length)];
  return getQuoteWithSource(figureId, randomId);
}

export default {
  getQuote,
  getQuoteWithSource,
  getQuotesByFigure,
  listFiguresWithQuotes,
  formatQuote,
  getRandomQuote
};
