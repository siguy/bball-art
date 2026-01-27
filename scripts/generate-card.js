#!/usr/bin/env node
/**
 * Card Generator Script
 *
 * Generates a card image from a pairing and card type.
 *
 * Usage:
 *   node scripts/generate-card.js <pairing-id> <card-type>
 *   node scripts/generate-card.js jordan-moses thunder-lightning
 *
 * Options:
 *   --interaction <pose>  Override default interaction pose
 *   --model <model>       Override model (gemini-2.5-flash-image or gemini-3-pro-image-preview)
 *   --dry-run             Generate prompt only, don't call API
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateImage } from './nano-banana-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

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
  console.error('  --interaction <pose>  Override interaction pose');
  console.error('  --model <model>       Use specific model');
  console.error('  --dry-run             Generate prompt only');
  process.exit(1);
}

async function generateCard() {
  // Load pairing data
  const pairingPath = join(ROOT, 'data/series/court-covenant/pairings', `${pairingId}.json`);
  if (!existsSync(pairingPath)) {
    console.error(`Pairing not found: ${pairingPath}`);
    const pairingsDir = join(ROOT, 'data/series/court-covenant/pairings');
    if (existsSync(pairingsDir)) {
      const files = readdirSync(pairingsDir).filter(f => f.endsWith('.json'));
      console.error('Available pairings:');
      files.forEach(f => console.error(`  - ${f.replace('.json', '')}`));
    }
    process.exit(1);
  }

  const pairing = JSON.parse(readFileSync(pairingPath, 'utf-8'));

  // Load and run template
  try {
    const templatePath = `../prompts/templates/${cardType}.js`;
    const templateModule = await import(templatePath);
    const template = templateModule.default || templateModule[`${cardType.replace(/-/g, '')}Template`];

    if (!template || !template.generate) {
      console.error(`Template not found or invalid: ${cardType}`);
      process.exit(1);
    }

    // Generate the prompt
    const options = {};
    if (flags.interaction) {
      options.interaction = flags.interaction;
    }

    const prompt = template.generate(pairing, options);

    console.log('='.repeat(60));
    console.log('CARD GENERATION');
    console.log('='.repeat(60));
    console.log(`Pairing: ${pairing.player.name} & ${pairing.figure.name}`);
    console.log(`Style: ${cardType}`);
    console.log(`Interaction: ${flags.interaction || pairing.defaultInteraction}`);
    console.log('='.repeat(60));

    if (flags['dry-run']) {
      console.log('\nPROMPT (dry-run mode):');
      console.log('-'.repeat(60));
      console.log(prompt);
      console.log('-'.repeat(60));
      return;
    }

    // Generate timestamp for unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = join(ROOT, 'output/cards', pairingId);
    const outputPath = join(outputDir, `${cardType}-${timestamp}`);

    console.log(`\nGenerating image...`);
    console.log(`Output: ${outputPath}`);

    const result = await generateImage(prompt, {
      outputPath,
      model: flags.model
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
        pairingId,
        cardType,
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

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

generateCard();
