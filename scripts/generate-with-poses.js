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

import { spawn } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
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
 * Find pairing file across all series
 * Returns { path, series, subSeries } or null
 */
function findPairingFile(pairingId, preferredSeries = null) {
  const seriesList = preferredSeries
    ? [preferredSeries, 'court-covenant', 'torah-titans']
    : ['court-covenant', 'torah-titans'];

  for (const series of seriesList) {
    // Check main pairings directory
    const mainPath = join(ROOT, `data/series/${series}/pairings`, `${pairingId}.json`);
    if (existsSync(mainPath)) {
      return { path: mainPath, series, subSeries: null };
    }

    // Check sub-series directories
    const subSeriesDir = join(ROOT, `data/series/${series}/sub-series`);
    if (existsSync(subSeriesDir)) {
      const subDirs = readdirSync(subSeriesDir).filter(f => {
        const stat = statSync(join(subSeriesDir, f));
        return stat.isDirectory();
      });

      for (const subDir of subDirs) {
        const subPath = join(subSeriesDir, subDir, `${pairingId}.json`);
        if (existsSync(subPath)) {
          return { path: subPath, series, subSeries: subDir };
        }
      }
    }
  }

  return null;
}

/**
 * Load pairing data from JSON file
 * Returns { playerId, figureId, pairing, series, subSeries } where IDs are from poseFileId fields
 */
function loadPairingData(pairingId, preferredSeries = null) {
  const pairingFile = findPairingFile(pairingId, preferredSeries);

  if (!pairingFile) {
    console.error(`Pairing file not found: ${pairingId}`);
    console.error('Searched in: court-covenant, torah-titans');
    return null;
  }

  const pairing = JSON.parse(readFileSync(pairingFile.path, 'utf-8'));

  // Handle both player-figure and figure-figure pairings
  let char1, char2;

  if (pairing.player && pairing.figure) {
    // Standard player-figure pairing
    char1 = pairing.player;
    char2 = pairing.figure;
  } else if (pairing.characters && pairing.characters.length >= 2) {
    // Multi-character pairing (figure-figure, etc.)
    char1 = pairing.characters[0];
    char2 = pairing.characters[1];
  } else {
    console.error('Invalid pairing structure - needs player/figure or characters array');
    return null;
  }

  // Get pose file IDs - use explicit poseFileId if available, otherwise fall back to name-based ID
  const char1Id = char1.poseFileId || generateFallbackId(char1.name);
  const char2Id = char2.poseFileId || generateFallbackId(char2.name);

  return {
    char1Id,
    char2Id,
    char1,
    char2,
    pairing,
    series: pairingFile.series,
    subSeries: pairingFile.subSeries
  };
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
  const pairingData = loadPairingData(pairingId, flags.series);
  if (!pairingData) {
    process.exit(1);
  }

  const { char1Id, char2Id, char1, char2, pairing, series } = pairingData;
  const char1Type = char1.characterType || 'player';
  const char2Type = char2.characterType || 'figure';

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

  process.exit(0);
}

/**
 * Load and display generation hints for a pairing
 */
function showHints(pairingId) {
  const hintsPath = join(ROOT, 'visualizer/data/generation-hints.json');

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

// Load pairing data to get pose file IDs
const pairingData = loadPairingData(pairingId, flags.series);
if (!pairingData) {
  process.exit(1);
}

const { char1Id, char2Id, char1, char2, pairing, series, subSeries } = pairingData;
const char1PoseId = flags['player-pose'] || 'default';
const char2PoseId = flags['figure-pose'] || 'default';
const hairColor = flags['hair'] || null;

// Use characterType from pairing JSON to route to correct pose directory
// Defaults to 'player'/'figure' for standard pairings (backward compatible)
const char1Type = char1.characterType || 'player';
const char2Type = char2.characterType || 'figure';

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
  '--figure-pose', char2PoseId
];

if (flags['dry-run']) {
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
