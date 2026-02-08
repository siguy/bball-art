#!/usr/bin/env node
/**
 * Quick test script to generate a single Parasha Pack card image
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateImage } from './nano-banana-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Get the card to generate from args or default to spotlight-yitro
const cardArg = process.argv[2] || 'spotlight-yitro';

// Map short names to prompt files
const promptFiles = {
  'anchor': 'pp_yitro_anc_yitro-anchor_20260201T213649.prompt.txt',
  'spotlight-yitro': 'pp_yitro_spt_yitro-spotlight-yitro_20260201T213649.prompt.txt',
  'spotlight-moses': 'pp_yitro_spt_yitro-spotlight-moses_20260201T213649.prompt.txt',
  'action-advice': 'pp_yitro_act_yitro-action-advice_20260201T213649.prompt.txt',
  'action-sinai': 'pp_yitro_act_yitro-action-sinai_20260201T213649.prompt.txt',
  'action-commandments': 'pp_yitro_act_yitro-action-commandments_20260201T213649.prompt.txt',
  'thinker-mountain': 'pp_yitro_thk_yitro-thinker-mountain_20260201T213649.prompt.txt',
  'thinker-advice': 'pp_yitro_thk_yitro-thinker-advice_20260201T213649.prompt.txt',
};

const promptFile = promptFiles[cardArg];
if (!promptFile) {
  console.error(`Unknown card: ${cardArg}`);
  console.error('Available cards:', Object.keys(promptFiles).join(', '));
  process.exit(1);
}

const promptPath = join(ROOT, 'output/decks/parasha-pack/yitro', promptFile);
const outputPath = join(ROOT, 'output/decks/parasha-pack/yitro', promptFile.replace('.prompt.txt', '.jpeg'));

console.log(`\n🎴 Generating Parasha Pack card: ${cardArg}\n`);

try {
  const prompt = readFileSync(promptPath, 'utf8');
  console.log(`📝 Prompt loaded (${prompt.length} chars)`);

  const result = await generateImage(prompt, {
    outputPath,
    aspectRatio: '3:4'  // Closest to 5:7 that's supported
  });

  if (result.success) {
    console.log(`\n✅ Image generated: ${result.path}`);
    console.log(`   Size: ${(result.size / 1024).toFixed(1)} KB`);
  } else {
    console.error('\n❌ Generation failed:', result.error);
    if (result.message) {
      console.error('   Message:', result.message);
    }
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
