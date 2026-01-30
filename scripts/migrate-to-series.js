#!/usr/bin/env node
/**
 * Migration Script: Move cards to series directories
 *
 * Migrates ALL existing cards from flat output/cards/ to series-based directories:
 * - jacob-esau/ + solo-figure-* → output/cards/torah-titans/
 * - Everything else → output/cards/court-covenant/
 *
 * Also renames files to new naming convention and updates manifest/feedback.
 *
 * Usage:
 *   node scripts/migrate-to-series.js              # Dry run (preview changes)
 *   node scripts/migrate-to-series.js --execute    # Actually perform migration
 *   node scripts/migrate-to-series.js --rollback   # Revert migration from backup
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, copyFileSync, renameSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import {
  buildPairingFilename,
  buildSoloFilename,
  parseOldFilename,
  convertTimestamp,
  getSeriesAbbrev,
  getTemplateAbbrev
} from './lib/filename-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const CARDS_DIR = join(ROOT, 'output/cards');
const BACKUP_DIR = join(ROOT, 'output/cards-backup-pre-migration');
const MANIFEST_PATH = join(ROOT, 'visualizer/data/manifest.json');
const FEEDBACK_PATH = join(ROOT, 'visualizer/data/feedback.json');
const SELECTS_PATH = join(ROOT, 'visualizer/data/website-selects.json');

// Directories that should go to Torah Titans
const TORAH_TITANS_PAIRINGS = ['jacob-esau'];
const TORAH_TITANS_SOLO_PREFIXES = ['solo-figure-'];

// Parse args
const args = process.argv.slice(2);
const executeMode = args.includes('--execute');
const rollbackMode = args.includes('--rollback');

/**
 * Determine which series a directory belongs to
 */
function getTargetSeries(dirName) {
  // Check if it's a Torah Titans pairing
  if (TORAH_TITANS_PAIRINGS.includes(dirName)) {
    return 'torah-titans';
  }

  // Check if it's a Torah Titans solo figure
  for (const prefix of TORAH_TITANS_SOLO_PREFIXES) {
    if (dirName.startsWith(prefix)) {
      return 'torah-titans';
    }
  }

  // Everything else goes to Court & Covenant
  return 'court-covenant';
}

/**
 * Build new filename from old filename and context
 */
function buildNewFilename(oldFilename, dirName, series) {
  const parsed = parseOldFilename(oldFilename);
  if (!parsed) {
    // Not a recognized format, keep as-is
    return oldFilename;
  }

  const { template, timestamp, extension } = parsed;
  const newTimestamp = convertTimestamp(timestamp);

  // Check if it's a solo card
  const soloMatch = dirName.match(/^solo-(player|figure)-(.+)$/);
  if (soloMatch) {
    const [, characterType, characterId] = soloMatch;
    return buildSoloFilename({
      series,
      characterType,
      characterId,
      template,
      pose: 'def', // We don't have pose info from old filenames
      timestamp: newTimestamp,
      extension
    });
  }

  // It's a pairing card
  return buildPairingFilename({
    series,
    pairingId: dirName,
    template,
    playerPose: 'def', // We don't have pose info from old filenames
    figurePose: 'def',
    timestamp: newTimestamp,
    extension
  });
}

/**
 * Build mapping of old card IDs to new card IDs
 */
function buildIdMapping(oldId, dirName, oldFilename, newFilename, series) {
  // Old format: {pairingId}-{template}-{timestamp} or solo-{type}-{id}-{template}-{timestamp}
  // New format derived from new filename

  // Extract components from new filename
  const newBase = newFilename.replace(/\.(jpeg|jpg|png)$/, '');
  const parts = newBase.split('_');

  if (parts.length >= 5) {
    // New ID format: series_pairing_template_pose1_pose2_timestamp
    const [seriesAbbr, pairingOrSolo, templateAbbr, ...rest] = parts;
    const newTimestamp = rest[rest.length - 1];
    return `${pairingOrSolo}-${templateAbbr}-${newTimestamp}`;
  }

  // Fallback: derive from old ID
  return oldId;
}

/**
 * Create migration plan
 */
function createMigrationPlan() {
  const plan = {
    moves: [],
    idMappings: {},
    seriesCounts: { 'court-covenant': 0, 'torah-titans': 0 },
    errors: []
  };

  if (!existsSync(CARDS_DIR)) {
    plan.errors.push('Cards directory does not exist');
    return plan;
  }

  // Get all directories in output/cards that aren't already series directories
  const dirs = readdirSync(CARDS_DIR).filter(d => {
    const fullPath = join(CARDS_DIR, d);
    // Skip if not a directory
    if (!statSync(fullPath).isDirectory()) return false;
    // Skip if already a series directory
    if (d === 'court-covenant' || d === 'torah-titans') return false;
    // Skip backup and hidden dirs
    if (d.startsWith('.') || d.startsWith('cards-backup')) return false;
    return true;
  });

  for (const dirName of dirs) {
    const series = getTargetSeries(dirName);
    const sourceDir = join(CARDS_DIR, dirName);
    const targetDir = join(CARDS_DIR, series, dirName);

    // Get all image files in the directory
    const files = readdirSync(sourceDir).filter(f =>
      f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.jpg')
    );

    for (const file of files) {
      const oldPath = join(sourceDir, file);
      const newFilename = buildNewFilename(file, dirName, series);
      const newPath = join(targetDir, newFilename);

      // Also handle the prompt file
      const promptFile = file.replace(/\.(png|jpe?g)$/, '-prompt.txt');
      const promptExists = existsSync(join(sourceDir, promptFile));

      // Build old card ID (matches current manifest format)
      const parsed = parseOldFilename(file);
      let oldCardId;
      if (dirName.startsWith('solo-')) {
        const soloMatch = dirName.match(/^solo-(player|figure)-(.+)$/);
        if (soloMatch && parsed) {
          oldCardId = `${dirName}-${parsed.template}-${parsed.timestamp}`;
        }
      } else if (parsed) {
        oldCardId = `${dirName}-${parsed.template}-${parsed.timestamp}`;
      }

      // Build new card ID
      const newBase = newFilename.replace(/\.(jpeg|jpg|png)$/, '');
      const newParts = newBase.split('_');
      let newCardId;
      if (newParts.length >= 5) {
        // Format: series_pairingOrSolo_template_pose1_pose2_timestamp
        // New ID: pairingOrSolo-template-timestamp
        const pairingOrSolo = newParts[1];
        const templateAbbr = newParts[2];
        const timestamp = newParts[newParts.length - 1];
        newCardId = `${pairingOrSolo}-${templateAbbr}-${timestamp}`;
      } else {
        newCardId = oldCardId; // fallback
      }

      plan.moves.push({
        type: 'image',
        series,
        dirName,
        oldPath,
        newPath,
        oldFilename: file,
        newFilename,
        oldCardId,
        newCardId
      });

      if (promptExists) {
        const oldPromptPath = join(sourceDir, promptFile);
        const newPromptFilename = newFilename.replace(/\.(jpeg|jpg|png)$/, '-prompt.txt');
        const newPromptPath = join(targetDir, newPromptFilename);

        plan.moves.push({
          type: 'prompt',
          series,
          dirName,
          oldPath: oldPromptPath,
          newPath: newPromptPath,
          oldFilename: promptFile,
          newFilename: newPromptFilename
        });
      }

      if (oldCardId && newCardId) {
        plan.idMappings[oldCardId] = newCardId;
      }

      plan.seriesCounts[series]++;
    }
  }

  return plan;
}

/**
 * Execute the migration
 */
function executeMigration(plan) {
  console.log('\n=== EXECUTING MIGRATION ===\n');

  // 1. Create backup
  console.log('Creating backup...');
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Backup manifest and feedback
  if (existsSync(MANIFEST_PATH)) {
    copyFileSync(MANIFEST_PATH, join(BACKUP_DIR, 'manifest.json'));
  }
  if (existsSync(FEEDBACK_PATH)) {
    copyFileSync(FEEDBACK_PATH, join(BACKUP_DIR, 'feedback.json'));
  }
  if (existsSync(SELECTS_PATH)) {
    copyFileSync(SELECTS_PATH, join(BACKUP_DIR, 'website-selects.json'));
  }

  // Save migration plan for potential rollback
  writeFileSync(join(BACKUP_DIR, 'migration-plan.json'), JSON.stringify(plan, null, 2));

  // 2. Create target directories
  console.log('Creating target directories...');
  const targetDirs = new Set(plan.moves.map(m => dirname(m.newPath)));
  for (const dir of targetDirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`  Created: ${dir.replace(ROOT, '')}`);
    }
  }

  // 3. Copy files (don't delete originals yet)
  console.log('\nCopying files...');
  let copyCount = 0;
  for (const move of plan.moves) {
    if (existsSync(move.oldPath)) {
      copyFileSync(move.oldPath, move.newPath);
      copyCount++;
      if (copyCount % 20 === 0) {
        console.log(`  Copied ${copyCount} files...`);
      }
    }
  }
  console.log(`  Copied ${copyCount} files total`);

  // 4. Update feedback.json with new IDs
  console.log('\nUpdating feedback.json...');
  if (existsSync(FEEDBACK_PATH)) {
    const feedback = JSON.parse(readFileSync(FEEDBACK_PATH, 'utf-8'));
    const newFeedback = {};
    let updatedCount = 0;

    for (const [oldId, data] of Object.entries(feedback)) {
      const newId = plan.idMappings[oldId];
      if (newId && newId !== oldId) {
        newFeedback[newId] = { ...data, migratedFrom: oldId };
        updatedCount++;
      } else {
        newFeedback[oldId] = data;
      }
    }

    writeFileSync(FEEDBACK_PATH, JSON.stringify(newFeedback, null, 2));
    console.log(`  Updated ${updatedCount} feedback entries`);
  }

  // 5. Update website-selects.json with new IDs
  console.log('\nUpdating website-selects.json...');
  if (existsSync(SELECTS_PATH)) {
    const selects = JSON.parse(readFileSync(SELECTS_PATH, 'utf-8'));
    if (selects.cards && Array.isArray(selects.cards)) {
      let updatedCount = 0;
      selects.cards = selects.cards.map(cardId => {
        const newId = plan.idMappings[cardId];
        if (newId && newId !== cardId) {
          updatedCount++;
          return newId;
        }
        return cardId;
      });
      selects.lastUpdated = new Date().toISOString();
      writeFileSync(SELECTS_PATH, JSON.stringify(selects, null, 2));
      console.log(`  Updated ${updatedCount} select entries`);
    }
  }

  // 6. Save ID mappings for reference
  writeFileSync(
    join(BACKUP_DIR, 'id-mappings.json'),
    JSON.stringify(plan.idMappings, null, 2)
  );

  console.log('\n=== MIGRATION COMPLETE ===');
  console.log('\nNext steps:');
  console.log('1. Verify cards are accessible in visualizer');
  console.log('2. Test filtering by series');
  console.log('3. If everything works, delete old directories with:');
  console.log('   node scripts/migrate-to-series.js --cleanup');
  console.log('\nTo rollback:');
  console.log('   node scripts/migrate-to-series.js --rollback');
}

/**
 * Rollback migration using backup
 */
function rollbackMigration() {
  console.log('\n=== ROLLING BACK MIGRATION ===\n');

  if (!existsSync(BACKUP_DIR)) {
    console.error('No backup found at:', BACKUP_DIR);
    process.exit(1);
  }

  // Restore manifest and feedback
  if (existsSync(join(BACKUP_DIR, 'manifest.json'))) {
    copyFileSync(join(BACKUP_DIR, 'manifest.json'), MANIFEST_PATH);
    console.log('Restored manifest.json');
  }
  if (existsSync(join(BACKUP_DIR, 'feedback.json'))) {
    copyFileSync(join(BACKUP_DIR, 'feedback.json'), FEEDBACK_PATH);
    console.log('Restored feedback.json');
  }
  if (existsSync(join(BACKUP_DIR, 'website-selects.json'))) {
    copyFileSync(join(BACKUP_DIR, 'website-selects.json'), SELECTS_PATH);
    console.log('Restored website-selects.json');
  }

  console.log('\nRollback complete.');
  console.log('Note: Copied files in series directories were not removed.');
  console.log('You may want to manually delete:');
  console.log('  - output/cards/court-covenant/');
  console.log('  - output/cards/torah-titans/');
}

/**
 * Main
 */
function main() {
  console.log('=== CARD MIGRATION TO SERIES DIRECTORIES ===\n');

  if (rollbackMode) {
    rollbackMigration();
    return;
  }

  const plan = createMigrationPlan();

  if (plan.errors.length > 0) {
    console.error('Errors:');
    plan.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  // Print summary
  console.log('Migration Plan Summary:');
  console.log(`  Total files to migrate: ${plan.moves.length}`);
  console.log(`  Court & Covenant cards: ${plan.seriesCounts['court-covenant']}`);
  console.log(`  Torah Titans cards: ${plan.seriesCounts['torah-titans']}`);
  console.log(`  ID mappings: ${Object.keys(plan.idMappings).length}`);

  // Show sample moves
  console.log('\nSample moves:');
  const samples = plan.moves.filter(m => m.type === 'image').slice(0, 5);
  for (const move of samples) {
    console.log(`  ${move.series}/${move.dirName}/`);
    console.log(`    ${move.oldFilename}`);
    console.log(`    → ${move.newFilename}`);
    if (move.oldCardId !== move.newCardId) {
      console.log(`    ID: ${move.oldCardId} → ${move.newCardId}`);
    }
  }

  if (executeMode) {
    executeMigration(plan);
  } else {
    console.log('\n=== DRY RUN MODE ===');
    console.log('No files were moved. To execute migration, run:');
    console.log('  node scripts/migrate-to-series.js --execute');

    // Save plan for review
    const planPath = join(ROOT, 'output/migration-plan-preview.json');
    writeFileSync(planPath, JSON.stringify(plan, null, 2));
    console.log(`\nFull plan saved to: ${planPath}`);
  }
}

main();
