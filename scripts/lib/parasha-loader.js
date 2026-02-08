/**
 * Parasha Loader
 *
 * Load deck definitions, characters, and vocabulary for Parasha Pack series.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const ROOT = join(__dirname, '../..');
const PARASHA_PACK_DIR = join(ROOT, 'data/series/parasha-pack');
const DECKS_DIR = join(PARASHA_PACK_DIR, 'decks');
const CHARACTERS_DIR = join(PARASHA_PACK_DIR, 'characters');
const VOCABULARY_DIR = join(PARASHA_PACK_DIR, 'vocabulary');

// Cache
const deckCache = new Map();
const characterCache = new Map();
let vocabularyCache = null;

/**
 * Load a deck definition by parasha ID
 * @param {string} parashaId - Parasha ID (e.g., 'yitro', 'bereshit')
 * @returns {object|null} Deck data or null if not found
 */
export function loadDeck(parashaId) {
  const normalizedId = parashaId.toLowerCase().replace(/\s+/g, '-');

  if (deckCache.has(normalizedId)) {
    return deckCache.get(normalizedId);
  }

  const filePath = join(DECKS_DIR, `${normalizedId}.json`);

  if (!existsSync(filePath)) {
    console.warn(`Deck not found: ${filePath}`);
    return null;
  }

  try {
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    deckCache.set(normalizedId, data);
    return data;
  } catch (error) {
    console.error(`Error loading deck ${normalizedId}:`, error.message);
    return null;
  }
}

/**
 * List all available decks
 * @returns {string[]} Array of parasha IDs
 */
export function listDecks() {
  if (!existsSync(DECKS_DIR)) {
    return [];
  }

  return readdirSync(DECKS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

/**
 * Load a character by ID
 * @param {string} characterId - Character ID (e.g., 'moses-pp')
 * @returns {object|null} Character data or null if not found
 */
export function loadCharacter(characterId) {
  if (characterCache.has(characterId)) {
    return characterCache.get(characterId);
  }

  const filePath = join(CHARACTERS_DIR, `${characterId}.json`);

  if (!existsSync(filePath)) {
    // Try without -pp suffix
    const altPath = join(CHARACTERS_DIR, `${characterId}-pp.json`);
    if (existsSync(altPath)) {
      const data = JSON.parse(readFileSync(altPath, 'utf8'));
      characterCache.set(characterId, data);
      return data;
    }
    console.warn(`Character not found: ${characterId}`);
    return null;
  }

  try {
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    characterCache.set(characterId, data);
    return data;
  } catch (error) {
    console.error(`Error loading character ${characterId}:`, error.message);
    return null;
  }
}

/**
 * Load all characters for a deck
 * @param {object} deck - Deck data
 * @returns {Map<string, object>} Map of character ID to character data
 */
export function loadDeckCharacters(deck) {
  const characters = new Map();

  if (!deck.characters) return characters;

  for (const charId of deck.characters) {
    const character = loadCharacter(charId);
    if (character) {
      characters.set(charId, character);
    }
  }

  return characters;
}

/**
 * Load vocabulary database
 * @returns {object} Vocabulary data
 */
export function loadVocabulary() {
  if (vocabularyCache) {
    return vocabularyCache;
  }

  const filePath = join(VOCABULARY_DIR, 'words.json');

  if (!existsSync(filePath)) {
    console.warn('Vocabulary file not found');
    return { words: {} };
  }

  try {
    vocabularyCache = JSON.parse(readFileSync(filePath, 'utf8'));
    return vocabularyCache;
  } catch (error) {
    console.error('Error loading vocabulary:', error.message);
    return { words: {} };
  }
}

/**
 * Get a specific power word
 * @param {string} wordId - Word ID
 * @returns {object|null} Word data or null
 */
export function getPowerWord(wordId) {
  const vocab = loadVocabulary();
  return vocab.words?.[wordId] || null;
}

/**
 * Get cards by type from a deck
 * @param {object} deck - Deck data
 * @param {string} cardType - Card type (anchor, spotlight, action, thinker, power-word)
 * @returns {object[]} Array of card data objects
 */
export function getCardsByType(deck, cardType) {
  if (!deck.cards) return [];

  return deck.cards.filter(card => card.type === cardType);
}

/**
 * Get a specific card by ID
 * @param {object} deck - Deck data
 * @param {string} cardId - Card ID
 * @returns {object|null} Card data or null
 */
export function getCardById(deck, cardId) {
  if (!deck.cards) return null;

  return deck.cards.find(card => card.id === cardId) || null;
}

/**
 * Load series config
 * @returns {object} Series config
 */
export function loadSeriesConfig() {
  const filePath = join(PARASHA_PACK_DIR, 'series-config.json');

  if (!existsSync(filePath)) {
    throw new Error('Parasha Pack series-config.json not found');
  }

  return JSON.parse(readFileSync(filePath, 'utf8'));
}

/**
 * Clear all caches (useful for development)
 */
export function clearCaches() {
  deckCache.clear();
  characterCache.clear();
  vocabularyCache = null;
}

export default {
  loadDeck,
  listDecks,
  loadCharacter,
  loadDeckCharacters,
  loadVocabulary,
  getPowerWord,
  getCardsByType,
  getCardById,
  loadSeriesConfig,
  clearCaches,
  PARASHA_PACK_DIR,
  DECKS_DIR,
  CHARACTERS_DIR,
  VOCABULARY_DIR
};
