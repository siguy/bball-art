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
 *   --act <1|2|3>               Act number for triptych cards (progression)
 *   --model <model>             Override model
 *   --dry-run                   Generate prompt only, don't call API
 */

import minimist from 'minimist';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { generateImage as generateGemini } from './nano-banana-client.js';
import { generateImage as generateDraft } from './draft-client.js';
import { buildPairingFilename, getOutputDir } from './lib/filename-builder.js';
import { CONFIG } from './lib/config.js';
import { loadPairing, listAvailablePairings } from './lib/data-loader.js';
import { loadTemplate, getAvailableTemplatesHelp } from './lib/template-loader.js';

// Parse command line arguments
const args = minimist(process.argv.slice(2), {
  string: ['series', 'interaction', 'custom-player-action', 'custom-figure-action', 'player-pose', 'figure-pose', 'model', 'act'],
  boolean: ['dry-run', 'draft', 'help'],
  alias: { h: 'help' },
});

const [pairingId, cardType] = args._;

// Show help
if (args.help || (!pairingId || !cardType)) {
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
  console.error('  --draft                     Use cheap FLUX model for exploration');
  console.error('  --dry-run                   Generate prompt only');
  process.exit(1);
}

async function generateCard() {
  // Load pairing data
  const pairing = loadPairing(pairingId, args.series);

  if (!pairing) {
    console.error(`Pairing not found: ${pairingId}`);

    // List available pairings
    const available = listAvailablePairings('court-covenant', 10);
    if (available.length > 0) {
      console.error('\nAvailable pairings (court-covenant):');
      available.forEach(p => console.error(`  - ${p}`));
    }
    process.exit(1);
  }

  const { series, subSeries } = pairing;

  // Load template
  let template;
  try {
    const { module } = await loadTemplate(cardType, series);
    template = module;
  } catch (err) {
    console.error(err.message);
    console.error('');
    console.error(getAvailableTemplatesHelp());
    process.exit(1);
  }

  if (!template.generate) {
    console.error(`Template "${cardType}" does not have a generate() method.`);
    process.exit(1);
  }

  // Generate the prompt
  const options = {};
  if (args.interaction) {
    options.interaction = args.interaction;
  }
  if (args['custom-player-action']) {
    options.customPlayerAction = args['custom-player-action'];
  }
  if (args['custom-figure-action']) {
    options.customFigureAction = args['custom-figure-action'];
  }
  if (args.act) {
    options.act = args.act;
  }

  const prompt = template.generate(pairing, options);

  // Get display names (handle both player-figure and figure-figure pairings)
  const char1Name = pairing.player?.name || pairing.characters?.[0]?.name || 'Character 1';
  const char2Name = pairing.figure?.name || pairing.characters?.[1]?.name || 'Character 2';

  // Get act info for display
  const actInfo = args.act ? ` (Act ${args.act})` : '';

  console.log('='.repeat(60));
  console.log('CARD GENERATION');
  console.log('='.repeat(60));
  console.log(`Series: ${series}${subSeries ? ` (${subSeries})` : ''}`);
  console.log(`Pairing: ${char1Name} & ${char2Name}${actInfo}`);
  console.log(`Style: ${cardType}`);
  console.log(`Interaction: ${args.interaction || pairing.defaultInteraction || 'default'}`);
  if (args.act) console.log(`Act: ${args.act} of 3 (Triptych)`);
  console.log('='.repeat(60));

  if (args['dry-run']) {
    console.log('\nPROMPT (dry-run mode):');
    console.log('-'.repeat(60));
    console.log(prompt);
    console.log('-'.repeat(60));
    return;
  }

  // Build output path with new filename format
  const playerPose = args['player-pose'] || 'default';
  const figurePose = args['figure-pose'] || 'default';

  const filename = buildPairingFilename({
    series,
    pairingId,
    template: cardType,
    playerPose,
    figurePose,
  });

  const outputDir = getOutputDir(CONFIG.root, series, pairingId, subSeries);

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, filename.replace(/\.[^.]+$/, ''));

  const isDraft = args.draft;
  const generateImage = isDraft ? generateDraft : generateGemini;

  console.log(`\nGenerating image${isDraft ? ' [DRAFT]' : ''}...`);
  console.log(`Output: ${outputPath}`);

  // Include logo as reference image (skip in draft mode)
  const referenceImages = [];
  if (!isDraft && existsSync(CONFIG.logoPath)) {
    referenceImages.push({
      path: CONFIG.logoPath,
      mimeType: 'image/png',
    });
  } else if (!isDraft) {
    console.warn('Warning: Logo not found at', CONFIG.logoPath);
  }

  const result = await generateImage(prompt, {
    outputPath,
    model: isDraft ? undefined : args.model,
    referenceImages,
  });

  if (result.success) {
    console.log('\nCard generated successfully!');
    console.log(`  File: ${result.path}`);
    console.log(`  Size: ${(result.size / 1024).toFixed(1)} KB`);

    // Save prompt alongside image for reference
    const promptPath = result.path.replace(/\.[^.]+$/, '-prompt.txt');
    writeFileSync(promptPath, prompt);
    console.log(`  Prompt saved: ${promptPath}`);

    // Log to test-runs for tracking
    const logEntry = {
      timestamp: new Date().toISOString(),
      draft: isDraft || false,
      series,
      subSeries,
      pairingId,
      cardType,
      playerPose,
      figurePose,
      interaction: args.interaction || pairing.defaultInteraction,
      model: isDraft ? 'flux-1-dev' : (args.model || CONFIG.models.image),
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

generateCard().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
