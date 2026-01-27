#!/usr/bin/env node
/**
 * Prompt Generator Script
 *
 * Usage:
 *   node scripts/generate-prompt.js <pairing-id> <card-type>
 *   node scripts/generate-prompt.js jordan-moses thunder-lightning
 *
 * Options:
 *   --interaction <pose>  Override default interaction pose
 *   --output <file>       Write prompt to file instead of stdout
 *   --json                Output as JSON with metadata
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
  console.error('Usage: node scripts/generate-prompt.js <pairing-id> <card-type>');
  console.error('Example: node scripts/generate-prompt.js jordan-moses thunder-lightning');
  process.exit(1);
}

// Load pairing data
const pairingPath = join(ROOT, 'data/series/court-covenant/pairings', `${pairingId}.json`);
if (!existsSync(pairingPath)) {
  console.error(`Pairing not found: ${pairingPath}`);
  console.error('Available pairings:');
  // List available pairings
  const pairingsDir = join(ROOT, 'data/series/court-covenant/pairings');
  if (existsSync(pairingsDir)) {
    const files = readdirSync(pairingsDir).filter(f => f.endsWith('.json'));
    files.forEach(f => console.error(`  - ${f.replace('.json', '')}`));
  }
  process.exit(1);
}

const pairing = JSON.parse(readFileSync(pairingPath, 'utf-8'));

// Load and run template
async function generatePrompt() {
  try {
    // Dynamic import of the template
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

    // Output
    if (flags.json) {
      const output = {
        pairingId,
        cardType,
        options,
        prompt,
        generatedAt: new Date().toISOString()
      };
      if (flags.output) {
        writeFileSync(flags.output, JSON.stringify(output, null, 2));
        console.log(`Written to ${flags.output}`);
      } else {
        console.log(JSON.stringify(output, null, 2));
      }
    } else {
      if (flags.output) {
        writeFileSync(flags.output, prompt);
        console.log(`Written to ${flags.output}`);
      } else {
        console.log(prompt);
      }
    }

    // Also save to generated folder
    const generatedPath = join(ROOT, 'prompts/generated', `${pairingId}-${cardType}.txt`);
    writeFileSync(generatedPath, prompt);
    console.error(`\n[Saved to ${generatedPath}]`);

  } catch (err) {
    console.error('Error generating prompt:', err.message);
    process.exit(1);
  }
}

// Helper for listing files (imported conditionally)
import { readdirSync } from 'fs';

generatePrompt();
