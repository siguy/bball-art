#!/usr/bin/env node
/**
 * Generate Card with Character Poses
 *
 * Simplified card generation using the character poses database.
 *
 * Usage:
 *   node scripts/generate-with-poses.js <pairing> <template> --player-pose <pose> --figure-pose <pose>
 *
 * Examples:
 *   node scripts/generate-with-poses.js rodman-esau thunder-lightning-dark --player-pose diving-loose-ball --figure-pose drawing-bow
 *   node scripts/generate-with-poses.js rodman-esau beam-team-shadow --player-pose tipping-rebound --figure-pose stalking-prey --hair green
 *
 * Options:
 *   --player-pose <id>   Player pose ID (or 'default')
 *   --figure-pose <id>   Figure pose ID (or 'default')
 *   --hair <color>       Hair color override for player
 *   --list-poses         List available poses for this pairing
 *   --dry-run            Show prompt without generating
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  getPlayerPose,
  getFigurePose,
  listPlayerPoses,
  listFigurePoses,
  listPlayerHairColors
} from '../prompts/components/character-poses.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Extract player and figure IDs from pairing
function extractIds(pairingId) {
  const parts = pairingId.split('-');
  // Handle cases like "rodman-esau" or potentially longer names
  // For now, assume format is "player-figure"
  return {
    playerId: parts[0],
    figureId: parts.slice(1).join('-')
  };
}

// List available poses
if (flags['list-poses'] && pairingId) {
  const { playerId, figureId } = extractIds(pairingId);

  console.log(`\n=== POSES FOR ${pairingId.toUpperCase()} ===\n`);

  console.log(`PLAYER: ${playerId}`);
  console.log('-'.repeat(40));
  const playerPoses = listPlayerPoses(playerId);
  if (playerPoses.length === 0) {
    console.log('  No poses defined yet. Create: data/poses/players/' + playerId + '.json');
  } else {
    playerPoses.forEach(p => {
      const defaultTag = p.isDefault ? ' (DEFAULT)' : '';
      console.log(`  ${p.id}${defaultTag}`);
      console.log(`    ${p.description}`);
      if (p.hairColor) console.log(`    Hair: ${p.hairColor}`);
    });
  }

  console.log(`\nFIGURE: ${figureId}`);
  console.log('-'.repeat(40));
  const figurePoses = listFigurePoses(figureId);
  if (figurePoses.length === 0) {
    console.log('  No poses defined yet. Create: data/poses/figures/' + figureId + '.json');
  } else {
    figurePoses.forEach(p => {
      const defaultTag = p.isDefault ? ' (DEFAULT)' : '';
      console.log(`  ${p.id}${defaultTag}`);
      console.log(`    ${p.description}`);
    });
  }

  const hairColors = listPlayerHairColors(playerId);
  if (hairColors.length > 0) {
    console.log(`\nHAIR COLORS for ${playerId}:`);
    console.log('-'.repeat(40));
    hairColors.forEach(h => {
      console.log(`  ${h.id}: ${h.description}`);
    });
  }

  process.exit(0);
}

// Validate required arguments
if (!pairingId || !template) {
  console.log(`
Usage: node scripts/generate-with-poses.js <pairing> <template> [options]

Examples:
  node scripts/generate-with-poses.js rodman-esau thunder-lightning-dark --player-pose diving-loose-ball --figure-pose drawing-bow
  node scripts/generate-with-poses.js rodman-esau beam-team-shadow --player-pose default --figure-pose default

Options:
  --player-pose <id>   Player pose ID (or 'default')
  --figure-pose <id>   Figure pose ID (or 'default')
  --hair <color>       Hair color override (e.g., 'green', 'pink', 'leopard')
  --list-poses         List available poses for this pairing
  --dry-run            Show command without executing
  `);
  process.exit(1);
}

const { playerId, figureId } = extractIds(pairingId);
const playerPoseId = flags['player-pose'] || 'default';
const figurePoseId = flags['figure-pose'] || 'default';
const hairColor = flags['hair'] || null;

// Get the poses
const playerPose = getPlayerPose(playerId, playerPoseId, hairColor);
const figurePose = getFigurePose(figureId, figurePoseId);

if (!playerPose) {
  console.error(`Player pose not found: ${playerId}/${playerPoseId}`);
  console.error(`Run with --list-poses to see available options`);
  process.exit(1);
}

if (!figurePose) {
  console.error(`Figure pose not found: ${figureId}/${figurePoseId}`);
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
  console.log('Command:');
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
console.log(`  Player: ${playerPose.name}`);
console.log(`  Figure: ${figurePose.name}`);
console.log('');

const child = spawn('node', cmdArgs, { stdio: 'inherit' });
child.on('close', code => process.exit(code));
