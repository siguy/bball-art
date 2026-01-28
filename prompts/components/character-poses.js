/**
 * Character Poses System
 *
 * Loads character-specific poses from the data/poses directory.
 * Each character (player or figure) can have multiple signature poses
 * that can be swapped into any card template.
 *
 * Usage:
 *   import { getPlayerPose, getFigurePose, buildCustomActions } from './character-poses.js';
 *
 *   // Get a specific pose
 *   const rodmanPose = getPlayerPose('rodman', 'diving-loose-ball');
 *
 *   // Build custom actions for generate-card.js
 *   const actions = buildCustomActions('rodman', 'diving-loose-ball', 'esau', 'drawing-bow');
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../..');

const PLAYERS_DIR = join(ROOT, 'data/poses/players');
const FIGURES_DIR = join(ROOT, 'data/poses/figures');

// Cache for loaded pose files
const poseCache = {
  players: {},
  figures: {}
};

/**
 * Load a player's pose data
 */
export function loadPlayerPoses(playerId) {
  if (poseCache.players[playerId]) {
    return poseCache.players[playerId];
  }

  const filePath = join(PLAYERS_DIR, `${playerId}.json`);
  if (!existsSync(filePath)) {
    return null;
  }

  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  poseCache.players[playerId] = data;
  return data;
}

/**
 * Load a figure's pose data
 */
export function loadFigurePoses(figureId) {
  if (poseCache.figures[figureId]) {
    return poseCache.figures[figureId];
  }

  const filePath = join(FIGURES_DIR, `${figureId}.json`);
  if (!existsSync(filePath)) {
    return null;
  }

  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  poseCache.figures[figureId] = data;
  return data;
}

/**
 * Get a specific pose for a player
 * @param {string} playerId - Player ID (e.g., 'rodman')
 * @param {string} poseId - Pose ID (e.g., 'diving-loose-ball') or 'default'
 * @param {string} hairColorOverride - Optional hair color override
 * @returns {object|null} Pose object with prompt, energy, etc.
 */
export function getPlayerPose(playerId, poseId = 'default', hairColorOverride = null) {
  const playerData = loadPlayerPoses(playerId);
  if (!playerData) return null;

  const actualPoseId = poseId === 'default' ? playerData.defaultPose : poseId;
  const pose = playerData.poses[actualPoseId];
  if (!pose) return null;

  // Apply hair color override if provided
  let prompt = pose.prompt;
  if (hairColorOverride && playerData.hairColors) {
    const hairDesc = playerData.hairColors[hairColorOverride] || hairColorOverride;
    // Replace hair color in prompt if the pose has a hairColor field
    if (pose.hairColor) {
      prompt = prompt.replace(/wild hair[^,]*/, hairDesc);
    }
  } else if (pose.hairColor) {
    // Use the pose's default hair color
    const hairDesc = playerData.hairColors?.[pose.hairColor] || `${pose.hairColor} wild hair`;
    prompt = prompt.replace(/wild hair[^,]*/, hairDesc);
  }

  return {
    ...pose,
    prompt
  };
}

/**
 * Get a specific pose for a figure
 * @param {string} figureId - Figure ID (e.g., 'esau')
 * @param {string} poseId - Pose ID (e.g., 'drawing-bow') or 'default'
 * @returns {object|null} Pose object with prompt, energy, etc.
 */
export function getFigurePose(figureId, poseId = 'default') {
  const figureData = loadFigurePoses(figureId);
  if (!figureData) return null;

  const actualPoseId = poseId === 'default' ? figureData.defaultPose : poseId;
  return figureData.poses[actualPoseId] || null;
}

/**
 * Get a pose for any character by routing to the correct directory based on characterType.
 * @param {string} characterId - Character ID (e.g., 'jordan', 'moses')
 * @param {string} poseId - Pose ID (e.g., 'tongue-out-dunk') or 'default'
 * @param {string} characterType - 'player' or 'figure'
 * @param {string} hairColorOverride - Optional hair color override (players only)
 * @returns {object|null} Pose object with prompt, energy, etc.
 */
export function getCharacterPose(characterId, poseId = 'default', characterType = 'player', hairColorOverride = null) {
  return characterType === 'player'
    ? getPlayerPose(characterId, poseId, hairColorOverride)
    : getFigurePose(characterId, poseId);
}

/**
 * Build custom actions object for use with generate-card.js
 * @param {string} playerId - Player ID
 * @param {string} playerPoseId - Player pose ID or 'default'
 * @param {string} figureId - Figure ID
 * @param {string} figurePoseId - Figure pose ID or 'default'
 * @param {string} hairColorOverride - Optional hair color for player
 * @returns {object} Custom actions object { playerAction, figureAction, energy }
 */
export function buildCustomActions(playerId, playerPoseId, figureId, figurePoseId, hairColorOverride = null) {
  const playerPose = getPlayerPose(playerId, playerPoseId, hairColorOverride);
  const figurePose = getFigurePose(figureId, figurePoseId);

  if (!playerPose || !figurePose) {
    return null;
  }

  return {
    playerAction: playerPose.prompt,
    figureAction: figurePose.prompt,
    energy: `${playerPose.energy} meets ${figurePose.energy}`
  };
}

/**
 * List all available poses for a player
 */
export function listPlayerPoses(playerId) {
  const playerData = loadPlayerPoses(playerId);
  if (!playerData) return [];

  return Object.entries(playerData.poses).map(([id, pose]) => ({
    id,
    name: pose.name,
    description: pose.description,
    hairColor: pose.hairColor,
    isDefault: id === playerData.defaultPose
  }));
}

/**
 * List all available poses for a figure
 */
export function listFigurePoses(figureId) {
  const figureData = loadFigurePoses(figureId);
  if (!figureData) return [];

  return Object.entries(figureData.poses).map(([id, pose]) => ({
    id,
    name: pose.name,
    description: pose.description,
    isDefault: id === figureData.defaultPose
  }));
}

/**
 * List all available hair colors for a player
 */
export function listPlayerHairColors(playerId) {
  const playerData = loadPlayerPoses(playerId);
  if (!playerData || !playerData.hairColors) return [];

  return Object.entries(playerData.hairColors).map(([id, description]) => ({
    id,
    description
  }));
}

/**
 * Get CLI-ready custom action flags for generate-card.js
 * Returns the --custom-player-action and --custom-figure-action flags
 */
export function getCliFlags(playerId, playerPoseId, figureId, figurePoseId, hairColorOverride = null) {
  const playerPose = getPlayerPose(playerId, playerPoseId, hairColorOverride);
  const figurePose = getFigurePose(figureId, figurePoseId);

  if (!playerPose || !figurePose) {
    return null;
  }

  return `--custom-player-action "${playerPose.prompt}" --custom-figure-action "${figurePose.prompt}"`;
}

export default {
  loadPlayerPoses,
  loadFigurePoses,
  getPlayerPose,
  getFigurePose,
  getCharacterPose,
  buildCustomActions,
  listPlayerPoses,
  listFigurePoses,
  listPlayerHairColors,
  getCliFlags
};
