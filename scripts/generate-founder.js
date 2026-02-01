#!/usr/bin/env node
/**
 * Generate Founding Father Portrait Card
 *
 * Creates portrait transformation cards for the Founding Fathers series.
 * Supports single layer, combined layers, and full 7-layer synthesis.
 *
 * Usage:
 *   node scripts/generate-founder.js <founder-id> --layer <layer>
 *   node scripts/generate-founder.js <founder-id> --layers <layer1,layer2>
 *   node scripts/generate-founder.js <founder-id> --synthesis
 *   node scripts/generate-founder.js <founder-id> --custom "<prompt>"
 *
 * Examples:
 *   node scripts/generate-founder.js washington --layer colonial
 *   node scripts/generate-founder.js washington --layers colonial,revolutionary
 *   node scripts/generate-founder.js washington --synthesis
 *   node scripts/generate-founder.js washington --layer colonial --pose cincinnatus-returning
 *   node scripts/generate-founder.js washington --list-poses
 *   node scripts/generate-founder.js --list-founders
 *
 * Options:
 *   --layer <id>        Single layer to apply (colonial, revolutionary, classical, landscape, monument, mural, contemporary)
 *   --layers <ids>      Comma-separated layers for combined generation
 *   --synthesis         Full 7-layer synthesis
 *   --custom "<prompt>" Use custom prompt (for refined prompts)
 *   --pose <id>         Specific pose to use
 *   --list-founders     List available founders
 *   --list-poses        List available poses for founder
 *   --list-layers       List available layers
 *   --dry-run           Show prompt without generating
 */

import minimist from 'minimist';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { generateImage } from './nano-banana-client.js';
import { CONFIG, getSeriesAbbrev, getTemplateAbbrev } from './lib/config.js';
import { loadFounder, listFounders } from './lib/data-loader.js';
import { portraitTransformationTemplate } from '../prompts/templates/founding-fathers/portrait-transformation.js';

// Parse arguments
const args = minimist(process.argv.slice(2), {
  string: ['layer', 'layers', 'pose', 'custom'],
  boolean: ['synthesis', 'list-founders', 'list-poses', 'list-layers', 'dry-run', 'help'],
  alias: { h: 'help' },
});

const [founderId] = args._;

// Handle --list-founders
if (args['list-founders']) {
  console.log('\n=== AVAILABLE FOUNDERS ===\n');
  const founders = listFounders();
  if (founders.length === 0) {
    console.log('  No founders defined yet.');
  } else {
    founders.forEach(id => {
      const founder = loadFounder(id);
      console.log(`  ${id}`);
      console.log(`    ${founder?.name || 'Unknown'} - ${founder?.role || ''}`);
    });
  }
  process.exit(0);
}

// Handle --list-layers
if (args['list-layers']) {
  console.log('\n=== AVAILABLE LAYERS ===\n');
  Object.entries(portraitTransformationTemplate.layers).forEach(([id, layer]) => {
    console.log(`  ${id}`);
    console.log(`    ${layer.name} (${layer.era})`);
  });
  process.exit(0);
}

// Validate founder ID
if (!founderId) {
  console.error('Usage: node scripts/generate-founder.js <founder-id> [options]');
  console.error('');
  console.error('Run with --list-founders to see available founders');
  console.error('Run with --list-layers to see available layers');
  process.exit(1);
}

// Load founder
const founder = loadFounder(founderId);
if (!founder) {
  console.error(`Founder not found: ${founderId}`);
  console.error('');
  console.error('Available founders:');
  listFounders().forEach(id => console.error(`  - ${id}`));
  process.exit(1);
}

// Handle --list-poses
if (args['list-poses']) {
  console.log(`\n=== POSES FOR ${founder.name.toUpperCase()} ===\n`);
  if (!founder.poses || Object.keys(founder.poses).length === 0) {
    console.log('  No poses defined yet.');
  } else {
    Object.entries(founder.poses).forEach(([id, pose]) => {
      const defaultTag = id === founder.defaultPose ? ' (DEFAULT)' : '';
      console.log(`  ${id}${defaultTag}`);
      console.log(`    ${pose.name}: ${pose.description || ''}`);
    });
  }
  process.exit(0);
}

// Determine generation mode
let mode = 'layer';
let layerIds = ['colonial']; // default

if (args.synthesis) {
  mode = 'synthesis';
} else if (args.layers) {
  mode = 'combined';
  layerIds = args.layers.split(',').map(l => l.trim());
} else if (args.layer) {
  mode = 'layer';
  layerIds = [args.layer];
}

// Get pose if specified
let pose = null;
if (args.pose) {
  pose = founder.poses?.[args.pose];
  if (!pose) {
    console.error(`Pose not found: ${args.pose}`);
    console.error('Run with --list-poses to see available poses');
    process.exit(1);
  }
}

async function generateFounderCard() {
  let prompt;

  if (args.custom) {
    // Use custom prompt directly
    prompt = args.custom;
    console.log('Using custom prompt');
  } else {
    // Generate prompt from template
    const options = { pose };

    switch (mode) {
      case 'synthesis':
        prompt = portraitTransformationTemplate.generateSynthesis(founder, options);
        break;
      case 'combined':
        prompt = portraitTransformationTemplate.generateCombined(founder, layerIds, options);
        break;
      case 'layer':
      default:
        prompt = portraitTransformationTemplate.generateLayer(founder, layerIds[0], options);
        break;
    }
  }

  // Build descriptive info for console output
  const layerDesc = mode === 'synthesis' ? 'ALL 7 LAYERS' :
                    mode === 'combined' ? layerIds.join(' + ') :
                    layerIds[0];

  console.log('='.repeat(60));
  console.log('FOUNDING FATHER PORTRAIT GENERATION');
  console.log('='.repeat(60));
  console.log(`Founder: ${founder.name}`);
  console.log(`Mode: ${mode.toUpperCase()}`);
  console.log(`Layer(s): ${layerDesc}`);
  if (pose) console.log(`Pose: ${pose.name}`);
  console.log(`Prompt length: ${prompt.length} characters`);
  console.log('='.repeat(60));

  if (args['dry-run']) {
    console.log('\nPROMPT (dry-run mode):');
    console.log('-'.repeat(60));
    console.log(prompt);
    console.log('-'.repeat(60));
    return;
  }

  // Build output filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
  const layerSlug = mode === 'synthesis' ? 'synthesis' :
                    mode === 'combined' ? layerIds.join('-') :
                    layerIds[0];
  const poseSlug = args.pose || 'default';
  const filename = `ff_${founderId}_pt_${layerSlug}_${poseSlug}_${timestamp}`;

  // Output directory
  const outputDir = join(CONFIG.paths.output, 'cards', 'founding-fathers', founderId);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, filename);

  console.log(`\nGenerating image...`);
  console.log(`Output: ${outputPath}`);

  const result = await generateImage(prompt, {
    outputPath,
    aspectRatio: '3:4',
  });

  if (result.success) {
    console.log('\nFounder portrait generated successfully!');
    console.log(`  File: ${result.path}`);
    console.log(`  Size: ${(result.size / 1024).toFixed(1)} KB`);

    // Save prompt alongside image
    const promptPath = result.path.replace(/\.[^.]+$/, '-prompt.txt');
    writeFileSync(promptPath, prompt);
    console.log(`  Prompt saved: ${promptPath}`);

    // Log to generation log
    const logEntry = {
      timestamp: new Date().toISOString(),
      series: 'founding-fathers',
      mode: 'founder-portrait',
      founderId,
      founderName: founder.name,
      generationMode: mode,
      layers: layerIds,
      pose: args.pose || null,
      template: 'portrait-transformation',
      outputPath: result.path,
      promptLength: prompt.length,
      fileSize: result.size,
      success: true,
    };

    const logDir = join(CONFIG.paths.output, 'test-runs');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
    const logPath = join(logDir, 'generation-log.jsonl');
    writeFileSync(logPath, JSON.stringify(logEntry) + '\n', { flag: 'a' });

    return result;
  } else {
    console.log('\nGeneration failed');
    console.log(`  Error: ${result.error}`);
    if (result.message) {
      console.log(`  Message: ${result.message}`);
    }
    process.exit(1);
  }
}

generateFounderCard().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
