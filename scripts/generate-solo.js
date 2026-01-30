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

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateImage } from './nano-banana-client.js';
import { buildSoloFilename, getOutputDir } from './lib/filename-builder.js';
import {
  getPlayerPose,
  getFigurePose,
  listPlayerPoses,
  listFigurePoses,
  listPlayerHairColors,
  loadPlayerPoses,
  loadFigurePoses
} from '../prompts/components/character-poses.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Court & Covenant logo for reference image
const LOGO_PATH = join(ROOT, 'brand/logos/court and covenant logo - 1.png');

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

const [characterType, characterId, template] = positional;

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
if (flags['list-poses'] && characterId) {
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

/**
 * Find character data from standalone character file or pairings.
 * Standalone files take priority over pairing data.
 * Returns { data, series } or null
 */
function findCharacterData(characterType, characterId, preferredSeries = null) {
  // First, check for standalone character file
  const standaloneDir = join(ROOT, `data/characters/${characterType}s`);
  const standaloneFile = join(standaloneDir, `${characterId}.json`);

  if (existsSync(standaloneFile)) {
    const data = JSON.parse(readFileSync(standaloneFile, 'utf-8'));
    return {
      data: { ...data, type: characterType },
      series: data.series || preferredSeries || 'court-covenant'
    };
  }

  // Fall back to searching pairings across all series
  const seriesList = preferredSeries
    ? [preferredSeries, 'court-covenant', 'torah-titans']
    : ['court-covenant', 'torah-titans'];

  for (const series of seriesList) {
    const pairingsDir = join(ROOT, `data/series/${series}/pairings`);
    if (!existsSync(pairingsDir)) continue;

    const files = readdirSync(pairingsDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const pairing = JSON.parse(readFileSync(join(pairingsDir, file), 'utf-8'));

      if (characterType === 'player' && pairing.player?.poseFileId === characterId) {
        return {
          data: { ...pairing.player, type: 'player' },
          series
        };
      }

      if (characterType === 'figure' && pairing.figure?.poseFileId === characterId) {
        return {
          data: { ...pairing.figure, type: 'figure' },
          series
        };
      }

      // Also check multi-character pairings
      if (pairing.characters) {
        for (const char of pairing.characters) {
          if (char.poseFileId === characterId && char.characterType === characterType) {
            return {
              data: { ...char, type: characterType },
              series
            };
          }
        }
      }
    }

    // Also check sub-series
    const subSeriesDir = join(ROOT, `data/series/${series}/sub-series`);
    if (existsSync(subSeriesDir)) {
      const subDirs = readdirSync(subSeriesDir).filter(f => {
        const stat = statSync(join(subSeriesDir, f));
        return stat.isDirectory();
      });

      for (const subDir of subDirs) {
        const subPairingsDir = join(subSeriesDir, subDir);
        const subFiles = readdirSync(subPairingsDir).filter(f => f.endsWith('.json'));

        for (const file of subFiles) {
          const pairing = JSON.parse(readFileSync(join(subPairingsDir, file), 'utf-8'));

          if (characterType === 'figure' && pairing.figure?.poseFileId === characterId) {
            return {
              data: { ...pairing.figure, type: 'figure' },
              series
            };
          }

          if (pairing.characters) {
            for (const char of pairing.characters) {
              if (char.poseFileId === characterId && char.characterType === characterType) {
                return {
                  data: { ...char, type: characterType },
                  series
                };
              }
            }
          }
        }
      }
    }
  }

  return null;
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
    const poseDir = join(ROOT, `data/poses/${characterType}s`);
    if (existsSync(poseDir)) {
      const files = readdirSync(poseDir).filter(f => f.endsWith('.json'));
      console.error('\nAvailable pose files:');
      files.forEach(f => console.error(`  - ${f.replace('.json', '')}`));
    }
    process.exit(1);
  }

  // Get the pose
  const poseId = flags['pose'] || 'default';
  const hairColor = flags['hair'] || null;

  const pose = characterType === 'player'
    ? getPlayerPose(characterId, poseId, hairColor)
    : getFigurePose(characterId, poseId);

  if (!pose) {
    console.error(`Pose not found: ${poseId}`);
    console.error(`Run with --list-poses to see available options`);
    process.exit(1);
  }

  // Find character data from standalone file or pairings
  const characterResult = findCharacterData(characterType, characterId, flags.series);

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
    displayName: characterData.displayName || characterData.name
  };

  // Load and run template
  try {
    let templateModule;

    // Try series-specific template first
    try {
      const seriesTemplatePath = `../prompts/templates/${series}/${template}.js`;
      templateModule = await import(seriesTemplatePath);
    } catch {
      // Fall back to shared templates
      const templatePath = `../prompts/templates/${template}.js`;
      templateModule = await import(templatePath);
    }

    const templateObj = templateModule.default || Object.values(templateModule)[0];

    if (!templateObj || !templateObj.generateSolo) {
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

    if (flags['dry-run']) {
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
      pose: poseId
    });

    const outputDir = getOutputDir(ROOT, series, `solo-${characterType}-${characterId}`);

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = join(outputDir, filename.replace(/\.[^.]+$/, ''));

    console.log(`\nGenerating image...`);
    console.log(`Output: ${outputPath}`);

    // Include logo as reference image
    const referenceImages = [];
    if (existsSync(LOGO_PATH)) {
      referenceImages.push({
        path: LOGO_PATH,
        mimeType: 'image/png'
      });
    }

    const result = await generateImage(prompt, {
      outputPath,
      aspectRatio: '3:4',
      referenceImages
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
        success: true
      };

      const logPath = join(ROOT, 'output/test-runs/generation-log.jsonl');
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

  } catch (err) {
    console.error('Error:', err.message);
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      console.error(`Template not found: ${template}`);
      console.error('Available templates: thunder-lightning, beam-team, metal-universe, downtown, kaboom, prizm-silver');
      console.error('Dark variants: thunder-lightning-dark, beam-team-shadow, metal-universe-dark');
    }
    process.exit(1);
  }
}

generateSoloCard();
