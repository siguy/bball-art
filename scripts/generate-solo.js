#!/usr/bin/env node
/**
 * Generate Solo Character Card
 *
 * Creates a card featuring a single NBA player OR biblical figure (not a pairing).
 *
 * Usage:
 *   node scripts/generate-solo.js player <player-id> <template> [options]
 *   node scripts/generate-solo.js figure <figure-id> <template> [options]
 *
 * Examples:
 *   node scripts/generate-solo.js player jordan thunder-lightning --pose tongue-out-dunk
 *   node scripts/generate-solo.js figure moses beam-team --pose parting-sea
 *   node scripts/generate-solo.js figure moses beam-team --pose parting-sea --series torah-titans
 *   node scripts/generate-solo.js player rodman metal-universe-dark --pose diving-loose-ball --hair green
 *   node scripts/generate-solo.js player curry --list-poses
 *
 * Options:
 *   --series <id>     Series ID (default: court-covenant for players, auto-detect for figures)
 *   --pose <id>       Pose ID (or 'default')
 *   --hair <color>    Hair color override (for players with hair colors, e.g., Rodman)
 *   --list-poses      List available poses for this character
 *   --dry-run         Show prompt without generating
 */

import minimist from 'minimist';
import { writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';
import { generateImage } from './nano-banana-client.js';
import { buildSoloFilename, getOutputDir } from './lib/filename-builder.js';
import { CONFIG, getPosesPath } from './lib/config.js';
import { findCharacterData, loadPoseFile, listPoseFiles } from './lib/data-loader.js';
import { loadTemplate, getAvailableTemplatesHelp } from './lib/template-loader.js';
import {
  getPlayerPose,
  getFigurePose,
  listPlayerPoses,
  listFigurePoses,
  listPlayerHairColors,
  loadPlayerPoses,
  loadFigurePoses,
} from '../prompts/components/character-poses.js';

// Parse arguments
const args = minimist(process.argv.slice(2), {
  string: ['series', 'pose', 'hair'],
  boolean: ['list-poses', 'dry-run', 'help'],
  alias: { h: 'help' },
});

const [characterType, characterId, template] = args._;

// Validate character type
if (!characterType || !['player', 'figure'].includes(characterType)) {
  console.error('Usage: node scripts/generate-solo.js <player|figure> <character-id> <template> [options]');
  console.error('');
  console.error('Examples:');
  console.error('  node scripts/generate-solo.js player jordan thunder-lightning --pose tongue-out-dunk');
  console.error('  node scripts/generate-solo.js figure moses beam-team --pose parting-sea');
  console.error('  node scripts/generate-solo.js figure moses beam-team --series torah-titans');
  console.error('  node scripts/generate-solo.js player curry --list-poses');
  console.error('');
  console.error('Options:');
  console.error('  --series <id>     Series ID (default: court-covenant)');
  console.error('  --pose <id>       Pose ID (or "default")');
  console.error('  --hair <color>    Hair color override');
  console.error('  --list-poses      List available poses for this character');
  console.error('  --dry-run         Show prompt without generating');
  process.exit(1);
}

// Handle --list-poses
if (args['list-poses'] && characterId) {
  console.log(`\n=== POSES FOR ${characterId.toUpperCase()} (${characterType}) ===\n`);

  const poses = characterType === 'player'
    ? listPlayerPoses(characterId)
    : listFigurePoses(characterId);

  if (poses.length === 0) {
    console.log('  No poses defined yet.');
    console.log(`  Create: data/poses/${characterType}s/${characterId}.json`);
  } else {
    poses.forEach(p => {
      const defaultTag = p.isDefault ? ' (DEFAULT)' : '';
      console.log(`  ${p.id}${defaultTag}`);
      console.log(`    ${p.description}`);
      if (p.hairColor) console.log(`    Hair: ${p.hairColor}`);
    });
  }

  if (characterType === 'player') {
    const hairColors = listPlayerHairColors(characterId);
    if (hairColors.length > 0) {
      console.log(`\nHAIR COLORS:`);
      console.log('-'.repeat(50));
      hairColors.forEach(h => {
        console.log(`  ${h.id}: ${h.description}`);
      });
    }
  }

  process.exit(0);
}

// Validate required arguments
if (!characterId || !template) {
  console.error('Error: Missing character ID or template');
  console.error('Usage: node scripts/generate-solo.js <player|figure> <character-id> <template>');
  process.exit(1);
}

async function generateSoloCard() {
  // Load pose data
  const poseData = characterType === 'player'
    ? loadPlayerPoses(characterId)
    : loadFigurePoses(characterId);

  if (!poseData) {
    console.error(`Pose file not found for ${characterType}: ${characterId}`);
    console.error(`Expected: data/poses/${characterType}s/${characterId}.json`);

    // List available pose files
    const available = listPoseFiles(characterType);
    if (available.length > 0) {
      console.error('\nAvailable pose files:');
      available.forEach(f => console.error(`  - ${f}`));
    }
    process.exit(1);
  }

  // Get the pose
  const poseId = args.pose || 'default';
  const hairColor = args.hair || null;

  const pose = characterType === 'player'
    ? getPlayerPose(characterId, poseId, hairColor)
    : getFigurePose(characterId, poseId);

  if (!pose) {
    console.error(`Pose not found: ${poseId}`);
    console.error(`Run with --list-poses to see available options`);
    process.exit(1);
  }

  // Find character data from standalone file or pairings
  const characterResult = findCharacterData(characterType, characterId, args.series);

  if (!characterResult) {
    console.error(`Character data not found: ${characterId}`);
    console.error('');
    console.error('Character data can come from either:');
    console.error(`  1. Standalone file: data/characters/${characterType}s/${characterId}.json`);
    console.error(`  2. A pairing file with poseFileId: "${characterId}"`);
    console.error('');
    console.error('See docs/solo-characters.md for how to create standalone characters.');
    process.exit(1);
  }

  const { data: characterData, series } = characterResult;

  // Build the character object for the template
  const character = {
    ...characterData,
    type: characterType,
    pose: pose,
    displayName: characterData.displayName || characterData.name,
  };

  // Load template
  let templateObj;
  try {
    const { module } = await loadTemplate(template, series);
    templateObj = module;
  } catch (err) {
    console.error(err.message);
    console.error('');
    console.error(getAvailableTemplatesHelp());
    process.exit(1);
  }

  if (!templateObj.generateSolo) {
    console.error(`Template "${template}" does not support solo mode.`);
    console.error('Make sure the template has a generateSolo() method.');
    process.exit(1);
  }

  // Build options
  const options = {};
  if (characterType === 'player' && characterData.jerseyColors) {
    options.jersey = characterData.jerseyColors.primary;
  }
  if (hairColor) {
    options.hairColor = hairColor;
  }

  // Generate the prompt
  const prompt = templateObj.generateSolo(character, options);

  console.log('='.repeat(60));
  console.log('SOLO CARD GENERATION');
  console.log('='.repeat(60));
  console.log(`Series: ${series}`);
  console.log(`Type: ${characterType.toUpperCase()}`);
  console.log(`Character: ${character.name}`);
  console.log(`Pose: ${pose.name} (${poseId})`);
  console.log(`Template: ${template}`);
  if (hairColor) console.log(`Hair Color: ${hairColor}`);
  console.log('='.repeat(60));

  if (args['dry-run']) {
    console.log('\nPROMPT (dry-run mode):');
    console.log('-'.repeat(60));
    console.log(prompt);
    console.log('-'.repeat(60));
    return;
  }

  // Build output path with new filename format
  const filename = buildSoloFilename({
    series,
    characterType,
    characterId,
    template,
    pose: poseId,
  });

  const outputDir = getOutputDir(CONFIG.root, series, `solo-${characterType}-${characterId}`);

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, filename.replace(/\.[^.]+$/, ''));

  console.log(`\nGenerating image...`);
  console.log(`Output: ${outputPath}`);

  // Include logo as reference image
  const referenceImages = [];
  if (existsSync(CONFIG.logoPath)) {
    referenceImages.push({
      path: CONFIG.logoPath,
      mimeType: 'image/png',
    });
  }

  const result = await generateImage(prompt, {
    outputPath,
    aspectRatio: '3:4',
    referenceImages,
  });

  if (result.success) {
    console.log('\nSolo card generated successfully!');
    console.log(`  File: ${result.path}`);
    console.log(`  Size: ${(result.size / 1024).toFixed(1)} KB`);

    // Save prompt alongside image
    const promptPath = result.path.replace(/\.[^.]+$/, '-prompt.txt');
    writeFileSync(promptPath, prompt);
    console.log(`  Prompt saved: ${promptPath}`);

    // Log to test-runs
    const logEntry = {
      timestamp: new Date().toISOString(),
      mode: 'solo',
      series,
      characterType,
      characterId,
      characterName: character.name,
      poseId,
      template,
      hairColor: hairColor || null,
      outputPath: result.path,
      promptLength: prompt.length,
      fileSize: result.size,
      success: true,
    };

    const logPath = join(CONFIG.root, 'output/test-runs/generation-log.jsonl');
    const logLine = JSON.stringify(logEntry) + '\n';
    writeFileSync(logPath, logLine, { flag: 'a' });
  } else {
    console.log('\nGeneration failed');
    console.log(`  Error: ${result.error}`);
    if (result.message) {
      console.log(`  Message: ${result.message}`);
    }
    process.exit(1);
  }
}

generateSoloCard().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
