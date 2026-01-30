#!/usr/bin/env node
/**
 * Data Validation Script
 *
 * Validates all JSON data files against their schemas.
 * Run this before committing to catch data errors early.
 *
 * Usage:
 *   node scripts/validate-data.js
 *   node scripts/validate-data.js --verbose
 *   node scripts/validate-data.js --type pairings
 *
 * Options:
 *   --verbose          Show all files checked, not just errors
 *   --type <type>      Only validate specific type: pairings, poses, quotes, series
 *   --fix              Attempt to fix minor issues (like missing cardMode)
 */

import minimist from 'minimist';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Parse arguments
const args = minimist(process.argv.slice(2), {
  boolean: ['verbose', 'fix', 'help'],
  string: ['type'],
  alias: { v: 'verbose', h: 'help', t: 'type' },
});

if (args.help) {
  console.log(`
Usage: node scripts/validate-data.js [options]

Options:
  --verbose, -v    Show all files checked, not just errors
  --type, -t       Only validate: pairings, poses, quotes, series
  --fix            Attempt to fix minor issues
  --help, -h       Show this help
  `);
  process.exit(0);
}

// Setup AJV validator
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Load schemas
const schemas = {
  pairing: JSON.parse(readFileSync(join(ROOT, 'data/schemas/pairing.schema.json'), 'utf-8')),
  pose: JSON.parse(readFileSync(join(ROOT, 'data/schemas/pose.schema.json'), 'utf-8')),
  quote: JSON.parse(readFileSync(join(ROOT, 'data/schemas/quote.schema.json'), 'utf-8')),
  seriesConfig: JSON.parse(readFileSync(join(ROOT, 'data/schemas/series-config.schema.json'), 'utf-8')),
};

// Compile validators
const validators = {
  pairing: ajv.compile(schemas.pairing),
  pose: ajv.compile(schemas.pose),
  quote: ajv.compile(schemas.quote),
  seriesConfig: ajv.compile(schemas.seriesConfig),
};

// Results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  fixed: 0,
  errors: [],
};

/**
 * Validate a single file against a schema
 */
function validateFile(filePath, validator, schemaName) {
  results.total++;

  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    const valid = validator(data);

    if (valid) {
      results.passed++;
      if (args.verbose) {
        console.log(`  ✓ ${filePath.replace(ROOT + '/', '')}`);
      }
      return { valid: true, data };
    } else {
      results.failed++;
      const errors = validator.errors.map(e => `${e.instancePath || '/'}: ${e.message}`);
      results.errors.push({ file: filePath, schema: schemaName, errors });

      console.log(`  ✗ ${filePath.replace(ROOT + '/', '')}`);
      errors.forEach(e => console.log(`      - ${e}`));

      return { valid: false, data, errors };
    }
  } catch (err) {
    results.failed++;
    results.errors.push({ file: filePath, schema: schemaName, errors: [err.message] });
    console.log(`  ✗ ${filePath.replace(ROOT + '/', '')}`);
    console.log(`      - Parse error: ${err.message}`);
    return { valid: false, errors: [err.message] };
  }
}

/**
 * Attempt to fix minor issues in a pairing file
 */
function fixPairingFile(filePath, data) {
  let modified = false;

  // Add cardMode if missing
  if (!data.cardMode) {
    if (data.player && data.figure) {
      // Check if it's figure-figure by looking at characterType
      if (data.player.characterType === 'figure' && data.figure.characterType === 'figure') {
        data.cardMode = 'figure-figure';
      } else {
        data.cardMode = 'player-figure';
      }
      modified = true;
    }
  }

  if (modified && args.fix) {
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    results.fixed++;
    console.log(`    → Fixed: added cardMode`);
  }

  return modified;
}

/**
 * Validate all pairings
 */
function validatePairings() {
  console.log('\n📂 Validating Pairings...');

  const seriesDirs = ['court-covenant', 'torah-titans'];

  for (const series of seriesDirs) {
    const pairingsDir = join(ROOT, 'data/series', series, 'pairings');
    if (!existsSync(pairingsDir)) continue;

    const files = readdirSync(pairingsDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = join(pairingsDir, file);
      const result = validateFile(filePath, validators.pairing, 'pairing');

      // Attempt fixes if requested
      if (!result.valid && result.data && args.fix) {
        fixPairingFile(filePath, result.data);
      }
    }

    // Check sub-series
    const subSeriesDir = join(ROOT, 'data/series', series, 'sub-series');
    if (existsSync(subSeriesDir)) {
      const subDirs = readdirSync(subSeriesDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const subDir of subDirs) {
        const subPairingsDir = join(subSeriesDir, subDir);
        const subFiles = readdirSync(subPairingsDir).filter(f => f.endsWith('.json'));

        for (const file of subFiles) {
          const filePath = join(subPairingsDir, file);
          const result = validateFile(filePath, validators.pairing, 'pairing');

          if (!result.valid && result.data && args.fix) {
            fixPairingFile(filePath, result.data);
          }
        }
      }
    }
  }
}

/**
 * Validate all pose files
 */
function validatePoses() {
  console.log('\n📂 Validating Poses...');

  const poseDirs = ['players', 'figures'];

  for (const type of poseDirs) {
    const posesDir = join(ROOT, 'data/poses', type);
    if (!existsSync(posesDir)) continue;

    const files = readdirSync(posesDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = join(posesDir, file);
      validateFile(filePath, validators.pose, 'pose');
    }
  }
}

/**
 * Validate all quote files
 */
function validateQuotes() {
  console.log('\n📂 Validating Quotes...');

  const quotesDir = join(ROOT, 'data/quotes/figures');
  if (!existsSync(quotesDir)) {
    console.log('  (no quotes directory found)');
    return;
  }

  const files = readdirSync(quotesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = join(quotesDir, file);
    validateFile(filePath, validators.quote, 'quote');
  }
}

/**
 * Validate series config files
 */
function validateSeriesConfigs() {
  console.log('\n📂 Validating Series Configs...');

  const seriesDirs = ['court-covenant', 'torah-titans'];

  for (const series of seriesDirs) {
    const configPath = join(ROOT, 'data/series', series, 'series-config.json');
    if (existsSync(configPath)) {
      validateFile(configPath, validators.seriesConfig, 'series-config');
    }
  }
}

/**
 * Check for orphaned references
 */
function checkReferences() {
  console.log('\n🔗 Checking References...');

  const posePlayers = new Set(
    readdirSync(join(ROOT, 'data/poses/players'))
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
  );

  const poseFigures = new Set(
    readdirSync(join(ROOT, 'data/poses/figures'))
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
  );

  // Check pairing references to pose files
  let orphanedRefs = 0;

  const seriesDirs = ['court-covenant', 'torah-titans'];
  for (const series of seriesDirs) {
    const pairingsDir = join(ROOT, 'data/series', series, 'pairings');
    if (!existsSync(pairingsDir)) continue;

    const files = readdirSync(pairingsDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const pairing = JSON.parse(readFileSync(join(pairingsDir, file), 'utf-8'));

      // Check player pose reference
      if (pairing.player?.poseFileId) {
        const isPlayer = pairing.player.characterType !== 'figure';
        const poseSet = isPlayer ? posePlayers : poseFigures;

        if (!poseSet.has(pairing.player.poseFileId)) {
          console.log(`  ⚠ ${file}: player.poseFileId "${pairing.player.poseFileId}" not found`);
          orphanedRefs++;
        }
      }

      // Check figure pose reference
      if (pairing.figure?.poseFileId) {
        if (!poseFigures.has(pairing.figure.poseFileId)) {
          console.log(`  ⚠ ${file}: figure.poseFileId "${pairing.figure.poseFileId}" not found`);
          orphanedRefs++;
        }
      }
    }
  }

  if (orphanedRefs === 0) {
    console.log('  ✓ All pose references valid');
  } else {
    console.log(`  Found ${orphanedRefs} orphaned references`);
  }
}

// Main execution
console.log('🔍 Validating Data Files...');

const typeFilter = args.type?.toLowerCase();

if (!typeFilter || typeFilter === 'pairings') {
  validatePairings();
}

if (!typeFilter || typeFilter === 'poses') {
  validatePoses();
}

if (!typeFilter || typeFilter === 'quotes') {
  validateQuotes();
}

if (!typeFilter || typeFilter === 'series') {
  validateSeriesConfigs();
}

if (!typeFilter) {
  checkReferences();
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(50));
console.log(`Total files:  ${results.total}`);
console.log(`Passed:       ${results.passed}`);
console.log(`Failed:       ${results.failed}`);
if (args.fix && results.fixed > 0) {
  console.log(`Fixed:        ${results.fixed}`);
}

if (results.failed > 0) {
  console.log('\n❌ Validation failed. Fix errors above before committing.');
  process.exit(1);
} else {
  console.log('\n✅ All validations passed!');
  process.exit(0);
}
