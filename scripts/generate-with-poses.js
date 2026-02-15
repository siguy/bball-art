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
 *   node scripts/generate-with-poses.js jacob-esau thunder-lightning --series torah-titans
 *
 * Options:
 *   --series <id>        Series ID (default: auto-detect)
 *   --player-pose <id>   Player/figure1 pose ID (or 'default')
 *   --figure-pose <id>   Figure/figure2 pose ID (or 'default')
 *   --hair <color>       Hair color override for player
 *   --list-poses         List available poses for this pairing
 *   --show-hints         Show generation hints before generating
 *   --dry-run            Show prompt without generating
 */

import minimist from 'minimist';
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  getCharacterPose,
  listPlayerPoses,
  listFigurePoses,
  listPlayerHairColors,
} from '../prompts/components/character-poses.js';
import { CONFIG } from './lib/config.js';
import { loadPairing, extractPairingCharacters } from './lib/data-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse arguments
const args = minimist(process.argv.slice(2), {
  string: ['series', 'player-pose', 'figure-pose', 'hair'],
  boolean: ['list-poses', 'show-hints', 'dry-run', 'draft', 'help'],
  alias: { h: 'help' },
});

const [pairingId, template] = args._;

/**
 * Show available poses for a pairing
 */
function showPoses(pairingId, pairingData) {
  const { char1Id, char2Id, char1, char2, char1Type, char2Type } = pairingData;
  const series = pairingData.series;

  console.log(`\n=== POSES FOR ${pairingId.toUpperCase()} (${series}) ===\n`);

  console.log(`${char1Type.toUpperCase()}: ${char1.name} (pose file: ${char1Id})`);
  console.log('-'.repeat(50));
  const char1Poses = char1Type === 'player' ? listPlayerPoses(char1Id) : listFigurePoses(char1Id);
  if (char1Poses.length === 0) {
    console.log('  No poses defined yet.');
    console.log(`  Create: data/poses/${char1Type}s/${char1Id}.json`);
  } else {
    char1Poses.forEach(p => {
      const defaultTag = p.isDefault ? ' (DEFAULT)' : '';
      console.log(`  ${p.id}${defaultTag}`);
      console.log(`    ${p.description}`);
      if (p.hairColor) console.log(`    Hair: ${p.hairColor}`);
    });
  }

  console.log(`\n${char2Type.toUpperCase()}: ${char2.name} (pose file: ${char2Id})`);
  console.log('-'.repeat(50));
  const char2Poses = char2Type === 'player' ? listPlayerPoses(char2Id) : listFigurePoses(char2Id);
  if (char2Poses.length === 0) {
    console.log('  No poses defined yet.');
    console.log(`  Create: data/poses/${char2Type}s/${char2Id}.json`);
  } else {
    char2Poses.forEach(p => {
      const defaultTag = p.isDefault ? ' (DEFAULT)' : '';
      console.log(`  ${p.id}${defaultTag}`);
      console.log(`    ${p.description}`);
    });
  }

  if (char1Type === 'player') {
    const hairColors = listPlayerHairColors(char1Id);
    if (hairColors.length > 0) {
      console.log(`\nHAIR COLORS for ${char1.name}:`);
      console.log('-'.repeat(50));
      hairColors.forEach(h => {
        console.log(`  ${h.id}: ${h.description}`);
      });
    }
  }
}

/**
 * Load and display generation hints for a pairing
 */
function showHints(pairingId) {
  const hintsPath = join(CONFIG.root, 'visualizer/data/generation-hints.json');

  if (!existsSync(hintsPath)) {
    console.log('\nNo hints available yet. Run: node scripts/regenerate-hints.js\n');
    return;
  }

  const hints = JSON.parse(readFileSync(hintsPath, 'utf-8'));
  const pairingHints = hints.quickHints[pairingId];
  const global = hints.globalRecommendations;

  console.log('\nGENERATION HINTS');
  console.log('='.repeat(50));

  // Show recommended templates
  const recommended = pairingHints?.recommendedTemplates || global?.topTemplates || [];
  if (recommended.length > 0) {
    console.log('\nRecommended templates:');
    recommended.forEach(t => console.log(`  - ${t}`));
  }

  // Show templates to avoid
  const avoid = pairingHints?.avoidTemplates || global?.avoidTemplates || [];
  if (avoid.length > 0) {
    console.log('\nTemplates to avoid:');
    avoid.forEach(t => console.log(`  - ${t}`));
  }

  // Show issue notes
  const notes = pairingHints?.issueNotes || [];
  if (notes.length > 0) {
    console.log('\nPrevious issues:');
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

// Handle --list-poses
if (args['list-poses'] && pairingId) {
  const pairing = loadPairing(pairingId, args.series);
  if (!pairing) {
    console.error(`Pairing file not found: ${pairingId}`);
    console.error('Searched in: court-covenant, torah-titans');
    process.exit(1);
  }

  const pairingData = extractPairingCharacters(pairing);
  showPoses(pairingId, { ...pairingData, series: pairing.series });
  process.exit(0);
}

// Show hints if requested
if (args['show-hints'] && pairingId) {
  showHints(pairingId);
}

// Validate required arguments
if (!pairingId || !template) {
  console.log(`
Usage: node scripts/generate-with-poses.js <pairing> <template> [options]

Examples:
  node scripts/generate-with-poses.js rodman-esau thunder-lightning-dark --player-pose diving-loose-ball --figure-pose drawing-bow
  node scripts/generate-with-poses.js isiah-pharaoh metal-universe-dark --player-pose default --figure-pose default
  node scripts/generate-with-poses.js jacob-esau thunder-lightning --series torah-titans

Options:
  --series <id>        Series ID (default: auto-detect)
  --player-pose <id>   Player/figure1 pose ID (or 'default')
  --figure-pose <id>   Figure/figure2 pose ID (or 'default')
  --hair <color>       Hair color override (e.g., 'green', 'pink', 'leopard')
  --list-poses         List available poses for this pairing
  --show-hints         Show generation hints before generating
  --dry-run            Show command without executing
  `);
  process.exit(1);
}

// Load pairing data
const pairing = loadPairing(pairingId, args.series);
if (!pairing) {
  console.error(`Pairing file not found: ${pairingId}`);
  console.error('Searched in: court-covenant, torah-titans');
  process.exit(1);
}

const { char1Id, char2Id, char1, char2, char1Type, char2Type } = extractPairingCharacters(pairing);
const series = pairing.series;

const char1PoseId = args['player-pose'] || 'default';
const char2PoseId = args['figure-pose'] || 'default';
const hairColor = args['hair'] || null;

// Get the poses using the correct pose file IDs and character types
const char1Pose = getCharacterPose(char1Id, char1PoseId, char1Type, hairColor);
const char2Pose = getCharacterPose(char2Id, char2PoseId, char2Type);

if (!char1Pose) {
  console.error(`Pose not found: ${char1Id}/${char1PoseId}`);
  console.error(`Expected pose file: data/poses/${char1Type}s/${char1Id}.json`);
  console.error(`Run with --list-poses to see available options`);
  process.exit(1);
}

if (!char2Pose) {
  console.error(`Pose not found: ${char2Id}/${char2PoseId}`);
  console.error(`Expected pose file: data/poses/${char2Type}s/${char2Id}.json`);
  console.error(`Run with --list-poses to see available options`);
  process.exit(1);
}

// Build the command
const generateScript = join(__dirname, 'generate-card.js');
const cmdArgs = [
  generateScript,
  pairingId,
  template,
  '--series', series,
  '--interaction', 'simultaneous-action',
  '--custom-player-action', char1Pose.prompt,
  '--custom-figure-action', char2Pose.prompt,
  '--player-pose', char1PoseId,
  '--figure-pose', char2PoseId,
];

if (args.draft) {
  cmdArgs.push('--draft');
}

if (args['dry-run']) {
  console.log('\n=== DRY RUN ===\n');
  console.log('Series:', series);
  console.log('Pairing:', char1.name, '&', char2.name);
  console.log('Char1 pose file:', char1Id);
  console.log('Char2 pose file:', char2Id);
  console.log('\nCommand:');
  console.log(`node scripts/generate-card.js ${pairingId} ${template} \\`);
  console.log(`  --series ${series} \\`);
  console.log(`  --interaction simultaneous-action \\`);
  console.log(`  --custom-player-action "${char1Pose.prompt}" \\`);
  console.log(`  --custom-figure-action "${char2Pose.prompt}"`);
  console.log('\nChar1 pose:', char1Pose.name);
  console.log('Char2 pose:', char2Pose.name);
  console.log('Combined energy:', `${char1Pose.energy} meets ${char2Pose.energy}`);
  process.exit(0);
}

// Execute
console.log(`\nGenerating ${pairingId} / ${template} (${series})`);
console.log(`  Char1: ${char1Pose.name} (from ${char1Id}.json)`);
console.log(`  Char2: ${char2Pose.name} (from ${char2Id}.json)`);
console.log('');

const child = spawn('node', cmdArgs, { stdio: 'inherit' });
child.on('close', code => process.exit(code));
