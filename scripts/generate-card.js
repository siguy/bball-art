#!/usr/bin/env node
/**
 * Card Generator Script
 *
 * Generates a card image from a pairing and card type.
 *
 * Usage:
 *   node scripts/generate-card.js <pairing-id> <card-type>
 *   node scripts/generate-card.js jordan-moses thunder-lightning
 *   node scripts/generate-card.js jacob-esau thunder-lightning --series torah-titans
 *
 * Options:
 *   --series <series>           Series ID (default: auto-detect or court-covenant)
 *   --interaction <pose>        Override default interaction pose
 *   --custom-player-action <a>  Custom player action description
 *   --custom-figure-action <a>  Custom figure action description
 *   --player-pose <id>          Player pose ID (for filename tracking)
 *   --figure-pose <id>          Figure pose ID (for filename tracking)
 *   --model <model>             Override model
 *   --dry-run                   Generate prompt only, don't call API
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateImage } from './nano-banana-client.js';
import { buildPairingFilename, getOutputDir } from './lib/filename-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Court & Covenant logo for reference image
const LOGO_PATH = join(ROOT, 'brand/logos/court and covenant logo - 1.png');

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {};
const positional = [];

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const flag = args[i].slice(2);
    flags[flag] = args[i + 1] || true;
    if (args[i + 1] && !args[i + 1].startsWith('--')) i++;
  } else {
    positional.push(args[i]);
  }
}

const [pairingId, cardType] = positional;

// Validate arguments
if (!pairingId || !cardType) {
  console.error('Usage: node scripts/generate-card.js <pairing-id> <card-type>');
  console.error('Example: node scripts/generate-card.js jordan-moses thunder-lightning');
  console.error('');
  console.error('Options:');
  console.error('  --series <series>           Series ID (default: auto-detect)');
  console.error('  --interaction <pose>        Override interaction pose');
  console.error('  --custom-player-action <a>  Custom player action description');
  console.error('  --custom-figure-action <a>  Custom figure action description');
  console.error('  --player-pose <id>          Player pose ID');
  console.error('  --figure-pose <id>          Figure pose ID');
  console.error('  --model <model>             Use specific model');
  console.error('  --dry-run                   Generate prompt only');
  process.exit(1);
}

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

async function generateCard() {
  // Find pairing file
  const pairingFile = findPairingFile(pairingId, flags.series);

  if (!pairingFile) {
    console.error(`Pairing not found: ${pairingId}`);

    // List available pairings from court-covenant
    const pairingsDir = join(ROOT, 'data/series/court-covenant/pairings');
    if (existsSync(pairingsDir)) {
      const files = readdirSync(pairingsDir).filter(f => f.endsWith('.json'));
      console.error('\nAvailable pairings (court-covenant):');
      files.slice(0, 10).forEach(f => console.error(`  - ${f.replace('.json', '')}`));
      if (files.length > 10) console.error(`  ... and ${files.length - 10} more`);
    }
    process.exit(1);
  }

  const { path: pairingPath, series, subSeries } = pairingFile;
  const pairing = JSON.parse(readFileSync(pairingPath, 'utf-8'));

  // Determine template path - check series-specific templates first
  let templateModule;
  try {
    // Try series-specific template first
    const seriesTemplatePath = `../prompts/templates/${series}/${cardType}.js`;
    templateModule = await import(seriesTemplatePath);
  } catch {
    // Fall back to shared templates
    try {
      const templatePath = `../prompts/templates/${cardType}.js`;
      templateModule = await import(templatePath);
    } catch (err) {
      console.error(`Template not found: ${cardType}`);
      console.error('Available templates: thunder-lightning, beam-team, metal-universe, downtown, kaboom, prizm-silver');
      console.error('Dark variants: thunder-lightning-dark, beam-team-shadow, metal-universe-dark');
      process.exit(1);
    }
  }

  const template = templateModule.default || Object.values(templateModule)[0];

  if (!template || !template.generate) {
    console.error(`Template not found or invalid: ${cardType}`);
    process.exit(1);
  }

  // Generate the prompt
  const options = {};
  if (flags.interaction) {
    options.interaction = flags.interaction;
  }
  if (flags['custom-player-action']) {
    options.customPlayerAction = flags['custom-player-action'];
  }
  if (flags['custom-figure-action']) {
    options.customFigureAction = flags['custom-figure-action'];
  }

  const prompt = template.generate(pairing, options);

  // Get display names (handle both player-figure and figure-figure pairings)
  const char1Name = pairing.player?.name || pairing.characters?.[0]?.name || 'Character 1';
  const char2Name = pairing.figure?.name || pairing.characters?.[1]?.name || 'Character 2';

  console.log('='.repeat(60));
  console.log('CARD GENERATION');
  console.log('='.repeat(60));
  console.log(`Series: ${series}${subSeries ? ` (${subSeries})` : ''}`);
  console.log(`Pairing: ${char1Name} & ${char2Name}`);
  console.log(`Style: ${cardType}`);
  console.log(`Interaction: ${flags.interaction || pairing.defaultInteraction || 'default'}`);
  console.log('='.repeat(60));

  if (flags['dry-run']) {
    console.log('\nPROMPT (dry-run mode):');
    console.log('-'.repeat(60));
    console.log(prompt);
    console.log('-'.repeat(60));
    return;
  }

  // Build output path with new filename format
  const playerPose = flags['player-pose'] || 'default';
  const figurePose = flags['figure-pose'] || 'default';

  const filename = buildPairingFilename({
    series,
    pairingId,
    template: cardType,
    playerPose,
    figurePose
  });

  const outputDir = getOutputDir(ROOT, series, pairingId, subSeries);

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, filename.replace(/\.[^.]+$/, ''));

  console.log(`\nGenerating image...`);
  console.log(`Output: ${outputPath}`);

  // Include logo as reference image for consistent branding
  const referenceImages = [];
  if (existsSync(LOGO_PATH)) {
    referenceImages.push({
      path: LOGO_PATH,
      mimeType: 'image/png'
    });
  } else {
    console.warn('Warning: Logo not found at', LOGO_PATH);
  }

  const result = await generateImage(prompt, {
    outputPath,
    model: flags.model,
    referenceImages
  });

  if (result.success) {
    console.log('\n✓ Card generated successfully!');
    console.log(`  File: ${result.path}`);
    console.log(`  Size: ${(result.size / 1024).toFixed(1)} KB`);

    // Save prompt alongside image for reference
    const promptPath = result.path.replace(/\.[^.]+$/, '-prompt.txt');
    writeFileSync(promptPath, prompt);
    console.log(`  Prompt saved: ${promptPath}`);

    // Log to test-runs for tracking
    const logEntry = {
      timestamp: new Date().toISOString(),
      series,
      subSeries,
      pairingId,
      cardType,
      playerPose,
      figurePose,
      interaction: flags.interaction || pairing.defaultInteraction,
      model: flags.model || process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
      outputPath: result.path,
      promptLength: prompt.length,
      fileSize: result.size,
      success: true
    };

    const logPath = join(ROOT, 'output/test-runs/generation-log.jsonl');
    const logLine = JSON.stringify(logEntry) + '\n';
    writeFileSync(logPath, logLine, { flag: 'a' });

  } else {
    console.log('\n✗ Generation failed');
    console.log(`  Error: ${result.error}`);
    if (result.message) {
      console.log(`  Message: ${result.message}`);
    }
    process.exit(1);
  }
}

generateCard();
