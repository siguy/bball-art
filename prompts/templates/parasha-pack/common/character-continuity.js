/**
 * Character Continuity System for Parasha Pack
 *
 * Ensures characters maintain consistent appearances across all 54 parashiyot.
 * Children recognize characters by their visual identity, so consistency is critical.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to character files
const CHARACTERS_DIR = join(__dirname, '../../../../data/series/parasha-pack/characters');

// Cache for loaded characters
const characterCache = new Map();

/**
 * Load a character's appearance data
 * @param {string} characterId - Character ID (e.g., 'moses-pp')
 * @returns {object|null} Character data or null if not found
 */
export function loadCharacter(characterId) {
  if (characterCache.has(characterId)) {
    return characterCache.get(characterId);
  }

  const filePath = join(CHARACTERS_DIR, `${characterId}.json`);

  if (!existsSync(filePath)) {
    console.warn(`Character file not found: ${filePath}`);
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
 * Get the appearance description for a character
 * @param {string} characterId - Character ID
 * @returns {string} Appearance description for prompts
 */
export function getCharacterAppearance(characterId) {
  const character = loadCharacter(characterId);

  if (!character) {
    return `[Character ${characterId} not found - use placeholder description]`;
  }

  const { appearance, name, personality } = character;

  return `
=== CHARACTER: ${name.toUpperCase()} ===
${appearance.description}

Distinguishing features:
${appearance.distinguishingFeatures.map(f => `- ${f}`).join('\n')}

Personality: ${personality.childFriendlyDescription}

CONTINUITY NOTE: ${appearance.continuityNote}
  `.trim();
}

/**
 * Get the emotion variant for a character
 * @param {string} characterId - Character ID
 * @param {string} emotionId - Emotion ID (e.g., 'happy', 'worried')
 * @returns {string} Emotion description or default
 */
export function getCharacterEmotion(characterId, emotionId) {
  const character = loadCharacter(characterId);

  if (!character?.emotions?.range) {
    return `showing ${emotionId} expression`;
  }

  const emotion = character.emotions.range.find(e => e.id === emotionId);

  if (emotion) {
    return emotion.description;
  }

  // Fall back to default
  const defaultEmotion = character.emotions.range.find(
    e => e.id === character.emotions.default
  );

  return defaultEmotion?.description || `showing ${emotionId} expression`;
}

/**
 * Get props for a character
 * @param {string} characterId - Character ID
 * @param {string[]} requestedProps - Array of prop IDs to include
 * @returns {string} Props description
 */
export function getCharacterProps(characterId, requestedProps = []) {
  const character = loadCharacter(characterId);

  if (!character?.props) {
    return '';
  }

  const propsText = [];
  for (const propId of requestedProps) {
    if (character.props[propId]) {
      propsText.push(character.props[propId].description);
    }
  }

  // Include default props that should always appear
  for (const [propId, prop] of Object.entries(character.props)) {
    if (prop.when === 'always' && !requestedProps.includes(propId)) {
      propsText.push(prop.description);
    }
  }

  return propsText.length > 0 ? `Props: ${propsText.join(', ')}` : '';
}

/**
 * Build a complete character description block for prompts
 * @param {string} characterId - Character ID
 * @param {object} options - Options for the character block
 * @param {string} options.emotion - Emotion to display
 * @param {string[]} options.props - Props to include
 * @param {string} options.action - What the character is doing
 * @returns {string} Complete character block for prompt
 */
export function buildCharacterBlock(characterId, options = {}) {
  const character = loadCharacter(characterId);

  if (!character) {
    return `[Character ${characterId} not found]`;
  }

  const { emotion = character.emotions?.default, props = [], action = '' } = options;

  const emotionDesc = getCharacterEmotion(characterId, emotion);
  const propsDesc = getCharacterProps(characterId, props);

  return `
=== CHARACTER: ${character.name.toUpperCase()} ===
${character.appearance.description}

Expression: ${emotionDesc}
${action ? `Action: ${action}` : ''}
${propsDesc}

Key features (MUST include):
${character.appearance.distinguishingFeatures.map(f => `- ${f}`).join('\n')}

CONTINUITY: This character must look identical in every card they appear in.
  `.trim();
}

/**
 * Build group character description (for Israelites, etc.)
 * @param {string} characterId - Group character ID
 * @param {object} options - Options
 * @param {string} options.emotion - Shared emotion for the group
 * @param {string} options.composition - 'smallGroup', 'crowd', or 'family'
 * @returns {string} Group character block
 */
export function buildGroupCharacterBlock(characterId, options = {}) {
  const character = loadCharacter(characterId);

  if (!character || character.characterType !== 'group') {
    return buildCharacterBlock(characterId, options);
  }

  const { emotion = 'together-hopeful', composition = 'smallGroup' } = options;
  const emotionDesc = getCharacterEmotion(characterId, emotion);
  const compositionGuide = character.compositionGuidelines?.[composition] || '';

  return `
=== GROUP: ${character.name.toUpperCase()} ===
${character.appearance.description}

Group composition: ${compositionGuide}

Shared emotion: ${emotionDesc}

Guidelines:
${character.appearance.distinguishingFeatures.map(f => `- ${f}`).join('\n')}

DIVERSITY: Include mix of ages, genders, and skin tones.
  `.trim();
}

export default {
  loadCharacter,
  getCharacterAppearance,
  getCharacterEmotion,
  getCharacterProps,
  buildCharacterBlock,
  buildGroupCharacterBlock
};
