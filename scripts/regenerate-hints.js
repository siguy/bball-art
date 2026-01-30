#!/usr/bin/env node
/**
 * Regenerate Generation Hints
 *
 * Rebuilds the generation hints file from current feedback data.
 * Run this after making significant changes to feedback.
 *
 * Usage:
 *   node scripts/regenerate-hints.js
 *
 * Options:
 *   --verbose   Show detailed output
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const VISUALIZER_DIR = join(ROOT, 'visualizer');

// Parse arguments
const verbose = process.argv.includes('--verbose');

async function main() {
  console.log('Regenerating generation hints...\n');

  // Load feedback
  const feedbackPath = join(VISUALIZER_DIR, 'data/feedback.json');
  if (!existsSync(feedbackPath)) {
    console.log('No feedback file found. Creating empty hints file.');
    const emptyHints = {
      generatedAt: new Date().toISOString(),
      quickHints: {},
      globalRecommendations: {
        topTemplates: [],
        avoidTemplates: []
      }
    };
    const hintsPath = join(VISUALIZER_DIR, 'data/generation-hints.json');
    writeFileSync(hintsPath, JSON.stringify(emptyHints, null, 2));
    console.log('Created empty hints file.');
    return;
  }

  const feedback = JSON.parse(readFileSync(feedbackPath, 'utf-8'));
  const feedbackCount = Object.keys(feedback).length;
  console.log(`Loaded ${feedbackCount} feedback entries`);

  // Build manifest
  const manifest = buildManifest();
  console.log(`Found ${manifest.cards.length} cards`);

  // Load pairings
  const pairings = loadAllPairings();
  console.log(`Loaded ${Object.keys(pairings).length} pairings`);

  // Import the analyzer modules dynamically
  const feedbackEnricherPath = join(VISUALIZER_DIR, 'lib/feedback-enricher.js');
  const feedbackAnalyzerPath = join(VISUALIZER_DIR, 'lib/feedback-analyzer.js');

  const enricher = await import(feedbackEnricherPath);
  const analyzer = await import(feedbackAnalyzerPath);

  // Enrich feedback
  const enriched = enricher.enrichFeedback(feedback, manifest, pairings);

  if (verbose) {
    console.log('\nEnriched feedback summary:');
    console.log(`  Total: ${enriched.summary.total}`);
    console.log(`  Loved: ${enriched.summary.loved}`);
    console.log(`  Liked: ${enriched.summary.liked}`);
    console.log(`  Issues: ${enriched.summary.issues}`);
  }

  // Analyze feedback
  const analysis = analyzer.analyzeFeedback(enriched);

  if (verbose) {
    console.log('\nAnalysis results:');
    console.log('  Top templates:');
    analysis.topTemplates.forEach(t => {
      console.log(`    ${t.name}: ${Math.round(t.score * 100)}% (${t.loved}L/${t.liked}l/${t.issues}i)`);
    });
    console.log('  Problem combinations:', analysis.problemCombinations.length);
  }

  // Generate hints
  const hints = analyzer.generateHints(analysis);

  // Save hints
  analyzer.saveHints(hints);

  console.log('\nHints generated successfully!');
  console.log(`  Pairing-specific hints: ${Object.keys(hints.quickHints).length}`);
  console.log(`  Top templates: ${hints.globalRecommendations.topTemplates.join(', ') || 'none'}`);
  console.log(`  Avoid templates: ${hints.globalRecommendations.avoidTemplates.join(', ') || 'none'}`);

  const hintsPath = join(VISUALIZER_DIR, 'data/generation-hints.json');
  console.log(`\nSaved to: ${hintsPath}`);
}

/**
 * Build manifest from output cards (simplified version for CLI)
 */
function buildManifest() {
  const cardsDir = join(ROOT, 'output/cards');
  const cards = [];

  if (!existsSync(cardsDir)) {
    return { cards: [] };
  }

  // Scan pairing cards
  const pairingDirs = readdirSync(cardsDir).filter(f => {
    const stat = statSync(join(cardsDir, f));
    return stat.isDirectory() && f !== 'solo' && !f.startsWith('solo-');
  });

  for (const pairingId of pairingDirs) {
    const pairingDir = join(cardsDir, pairingId);
    const files = readdirSync(pairingDir).filter(f =>
      f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.jpg')
    );

    for (const file of files) {
      // Parse filename: template-timestamp.ext
      const match = file.match(/^(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.(png|jpe?g)$/);
      if (!match) continue;

      const [, template, timestamp] = match;
      const promptFile = file.replace(/\.(png|jpe?g)$/, '-prompt.txt');
      const promptPath = join(pairingDir, promptFile);

      let prompt = '';
      if (existsSync(promptPath)) {
        prompt = readFileSync(promptPath, 'utf-8');
      }

      // Extract interaction from prompt if present
      let interaction = 'unknown';
      const interactionMatch = prompt.match(/=== INTERACTION: (.+?) ===/);
      if (interactionMatch) {
        interaction = interactionMatch[1].toLowerCase().replace(/ /g, '-');
      }

      cards.push({
        id: `${pairingId}-${template}-${timestamp}`,
        pairingId,
        template,
        timestamp: timestamp.replace(/-/g, ':').replace('T', ' ').slice(0, 19),
        isoTimestamp: timestamp,
        interaction,
        filename: file,
        prompt,
        mode: 'pairing'
      });
    }
  }

  // Scan solo cards
  const soloDirs = readdirSync(cardsDir).filter(f => {
    if (!f.startsWith('solo-')) return false;
    const stat = statSync(join(cardsDir, f));
    return stat.isDirectory();
  });

  for (const soloDir of soloDirs) {
    const soloMatch = soloDir.match(/^solo-(player|figure)-(.+)$/);
    if (!soloMatch) continue;

    const [, characterType, characterId] = soloMatch;
    const characterDir = join(cardsDir, soloDir);

    const files = readdirSync(characterDir).filter(f =>
      f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.jpg')
    );

    for (const file of files) {
      const match = file.match(/^(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.(png|jpe?g)$/);
      if (!match) continue;

      const [, template, timestamp] = match;

      cards.push({
        id: `solo-${characterType}-${characterId}-${template}-${timestamp}`,
        characterId,
        characterType,
        template,
        timestamp: timestamp.replace(/-/g, ':').replace('T', ' ').slice(0, 19),
        isoTimestamp: timestamp,
        filename: file,
        mode: 'solo'
      });
    }
  }

  return { cards };
}

/**
 * Load all pairing data
 */
function loadAllPairings() {
  const pairingsDir = join(ROOT, 'data/series/court-covenant/pairings');
  const pairings = {};

  if (!existsSync(pairingsDir)) {
    return pairings;
  }

  const files = readdirSync(pairingsDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const data = JSON.parse(readFileSync(join(pairingsDir, file), 'utf-8'));
    pairings[data.id] = data;
  }

  return pairings;
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
