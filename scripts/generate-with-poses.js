#!/usr/bin/env node
/**
 * Generate Card with Character Poses
 *
 * Simplified card generation using the character poses database.
 * Loads pairing data to get explicit poseFileId references.
 *
 * Usage:
 *   node scripts/generate-with-poses.js <pairing> <template> --player-pose <pose> --figure-pose <pose>
 *
 * Examples:
 *   node scripts/generate-with-poses.js rodman-esau thunder-lightning-dark --player-pose diving-loose-ball --figure-pose drawing-bow
 *   node scripts/generate-with-poses.js isiah-pharaoh metal-universe-dark --player-pose walking-off-court --figure-pose throne-defiance
 *
 * Options:
 *   --player-pose <id>   Player pose ID (or 'default')
 *   --figure-pose <id>   Figure pose ID (or 'default')
 *   --hair <color>       Hair color override for player
 *   --list-poses         List available poses for this pairing
 *   --show-hints         Show generation hints before generating
 *   --dry-run            Show prompt without generating
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  getPlayerPose,
  getFigurePose,
  getCharacterPose,
  listPlayerPoses,
  listFigurePoses,
  listPlayerHairColors
} from '../prompts/components/character-poses.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Parse arguments
const args = process.argv.slice(2);
const flags = {};
const positional = [];

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const flag = args[i].slice(2);
    if (args[i + 1] && !args[i + 1].startsWith('--')) {
      flags[flag] = args[i + 1];
      i++;
    } else {
      flags[flag] = true;
    }
  } else {
    positional.push(args[i]);
  }
}

const [pairingId, template] = positional;

/**
 * Load pairing data from JSON file
 * Returns { playerId, figureId, pairing } where IDs are from poseFileId fields
 */
function loadPairingData(pairingId) {
  // Try to find pairing file in court-covenant series
  const pairingPath = join(ROOT, 'data/series/court-covenant/pairings', `${pairingId}.json`);

  if (!existsSync(pairingPath)) {
    console.error(`Pairing file not found: ${pairingPath}`);
    return null;
  }

  const pairing = JSON.parse(readFileSync(pairingPath, 'utf-8'));

  // Get pose file IDs - use explicit poseFileId if available, otherwise fall back to name-based ID
  const playerId = pairing.player.poseFileId || generateFallbackId(pairing.player.name);
  const figureId = pairing.figure.poseFileId || generateFallbackId(pairing.figure.name);

  return { playerId, figureId, pairing };
}

/**
 * Generate a fallback ID from a name (for backwards compatibility)
 * "Isiah Thomas" -> "isiah-thomas"
 * "Dennis Rodman" -> "dennis-rodman"
 */
function generateFallbackId(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// Validate pairing argument exists for list-poses
if (flags['list-poses'] && pairingId) {
  const pairingData = loadPairingData(pairingId);
  if (!pairingData) {
    process.exit(1);
  }

  const { playerId, figureId, pairing } = pairingData;

  console.log(`\n=== POSES FOR ${pairingId.toUpperCase()} ===\n`);

  console.log(`PLAYER: ${pairing.player.name} (pose file: ${playerId})`);
  console.log('-'.repeat(50));
  const playerPoses = listPlayerPoses(playerId);
  if (playerPoses.length === 0) {
    console.log('  No poses defined yet.');
    console.log(`  Create: data/poses/players/${playerId}.json`);
    console.log(`  Or add poseFileId to pairing: "${playerId}"`);
  } else {
    playerPoses.forEach(p => {
      const defaultTag = p.isDefault ? ' (DEFAULT)' : '';
      console.log(`  ${p.id}${defaultTag}`);
      console.log(`    ${p.description}`);
      if (p.hairColor) console.log(`    Hair: ${p.hairColor}`);
    });
  }

  console.log(`\nFIGURE: ${pairing.figure.name} (pose file: ${figureId})`);
  console.log('-'.repeat(50));
  const figurePoses = listFigurePoses(figureId);
  if (figurePoses.length === 0) {
    console.log('  No poses defined yet.');
    console.log(`  Create: data/poses/figures/${figureId}.json`);
    console.log(`  Or add poseFileId to pairing: "${figureId}"`);
  } else {
    figurePoses.forEach(p => {
      const defaultTag = p.isDefault ? ' (DEFAULT)' : '';
      console.log(`  ${p.id}${defaultTag}`);
      console.log(`    ${p.description}`);
    });
  }

  const hairColors = listPlayerHairColors(playerId);
  if (hairColors.length > 0) {
    console.log(`\nHAIR COLORS for ${pairing.player.name}:`);
    console.log('-'.repeat(50));
    hairColors.forEach(h => {
      console.log(`  ${h.id}: ${h.description}`);
    });
  }

  process.exit(0);
}

/**
 * Load and display generation hints for a pairing
 */
function showHints(pairingId) {
  const hintsPath = join(ROOT, 'visualizer/data/generation-hints.json');

  if (!existsSync(hintsPath)) {
    console.log('\n💡 No hints available yet. Run: node scripts/regenerate-hints.js\n');
    return;
  }

  const hints = JSON.parse(readFileSync(hintsPath, 'utf-8'));
  const pairingHints = hints.quickHints[pairingId];
  const global = hints.globalRecommendations;

  console.log('\n💡 GENERATION HINTS');
  console.log('='.repeat(50));

  // Show recommended templates
  const recommended = pairingHints?.recommendedTemplates || global?.topTemplates || [];
  if (recommended.length > 0) {
    console.log('\n✓ Recommended templates:');
    recommended.forEach(t => console.log(`  • ${t}`));
  }

  // Show templates to avoid
  const avoid = pairingHints?.avoidTemplates || global?.avoidTemplates || [];
  if (avoid.length > 0) {
    console.log('\n✗ Templates to avoid:');
    avoid.forEach(t => console.log(`  • ${t}`));
  }

  // Show issue notes
  const notes = pairingHints?.issueNotes || [];
  if (notes.length > 0) {
    console.log('\n⚠ Previous issues:');
    notes.slice(0, 3).forEach(n => console.log(`  "${n}"`));
  }

  if (recommended.length === 0 && avoid.length === 0) {
    console.log('\n  No specific hints for this pairing.');
    if (global?.topTemplates?.length > 0) {
      console.log(`  Global top templates: ${global.topTemplates.join(', ')}`);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');
}

// Show hints if requested
if (flags['show-hints'] && pairingId) {
  showHints(pairingId);
}

// Validate required arguments
if (!pairingId || !template) {
  console.log(`
Usage: node scripts/generate-with-poses.js <pairing> <template> [options]

Examples:
  node scripts/generate-with-poses.js rodman-esau thunder-lightning-dark --player-pose diving-loose-ball --figure-pose drawing-bow
  node scripts/generate-with-poses.js isiah-pharaoh metal-universe-dark --player-pose default --figure-pose default
  node scripts/generate-with-poses.js jordan-moses --show-hints thunder-lightning

Options:
  --player-pose <id>   Player pose ID (or 'default')
  --figure-pose <id>   Figure pose ID (or 'default')
  --hair <color>       Hair color override (e.g., 'green', 'pink', 'leopard')
  --list-poses         List available poses for this pairing
  --show-hints         Show generation hints before generating
  --dry-run            Show command without executing
  `);
  process.exit(1);
}

// Load pairing data to get pose file IDs
const pairingData = loadPairingData(pairingId);
if (!pairingData) {
  process.exit(1);
}

const { playerId, figureId, pairing } = pairingData;
const playerPoseId = flags['player-pose'] || 'default';
const figurePoseId = flags['figure-pose'] || 'default';
const hairColor = flags['hair'] || null;

// Use characterType from pairing JSON to route to correct pose directory
// Defaults to 'player'/'figure' for standard pairings (backward compatible)
const playerCharType = pairing.player.characterType || 'player';
const figureCharType = pairing.figure.characterType || 'figure';

// Get the poses using the correct pose file IDs and character types
const playerPose = getCharacterPose(playerId, playerPoseId, playerCharType, hairColor);
const figurePose = getCharacterPose(figureId, figurePoseId, figureCharType);

if (!playerPose) {
  console.error(`Player pose not found: ${playerId}/${playerPoseId}`);
  console.error(`Expected pose file: data/poses/players/${playerId}.json`);
  console.error(`Run with --list-poses to see available options`);
  process.exit(1);
}

if (!figurePose) {
  console.error(`Figure pose not found: ${figureId}/${figurePoseId}`);
  console.error(`Expected pose file: data/poses/figures/${figureId}.json`);
  console.error(`Run with --list-poses to see available options`);
  process.exit(1);
}

// Build the command
const generateScript = join(__dirname, 'generate-card.js');
const cmdArgs = [
  generateScript,
  pairingId,
  template,
  '--interaction', 'simultaneous-action',
  '--custom-player-action', playerPose.prompt,
  '--custom-figure-action', figurePose.prompt
];

if (flags['dry-run']) {
  console.log('\n=== DRY RUN ===\n');
  console.log('Pairing:', pairing.player.name, '&', pairing.figure.name);
  console.log('Player pose file:', playerId);
  console.log('Figure pose file:', figureId);
  console.log('\nCommand:');
  console.log(`node scripts/generate-card.js ${pairingId} ${template} \\`);
  console.log(`  --interaction simultaneous-action \\`);
  console.log(`  --custom-player-action "${playerPose.prompt}" \\`);
  console.log(`  --custom-figure-action "${figurePose.prompt}"`);
  console.log('\nPlayer pose:', playerPose.name);
  console.log('Figure pose:', figurePose.name);
  console.log('Combined energy:', `${playerPose.energy} meets ${figurePose.energy}`);
  process.exit(0);
}

// Execute
console.log(`\nGenerating ${pairingId} / ${template}`);
console.log(`  Player: ${playerPose.name} (from ${playerId}.json)`);
console.log(`  Figure: ${figurePose.name} (from ${figureId}.json)`);
console.log('');

const child = spawn('node', cmdArgs, { stdio: 'inherit' });
child.on('close', code => process.exit(code));
