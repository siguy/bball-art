#!/usr/bin/env node
/**
 * Parasha Pack Deck Generator
 *
 * Generate a complete weekly Torah portion card deck.
 *
 * Usage:
 *   node scripts/generate-parasha-deck.js yitro            # Specific parasha
 *   node scripts/generate-parasha-deck.js --current        # Current week (via Sefaria)
 *   node scripts/generate-parasha-deck.js yitro --dry-run  # Show prompts only
 *   node scripts/generate-parasha-deck.js yitro --cards anchor,spotlight # Specific card types
 *   node scripts/generate-parasha-deck.js --list           # List available decks
 *
 * Options:
 *   --current         Use Sefaria API to get current week's parasha
 *   --dry-run         Generate prompts without calling API
 *   --cards <types>   Comma-separated list of card types to generate
 *   --card-id <id>    Generate specific card by ID
 *   --list            List all available deck definitions
 *   --verbose         Show detailed output
 */

import minimist from 'minimist';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadDeck, listDecks, loadDeckCharacters, getCardsByType, getCardById } from './lib/parasha-loader.js';
import { getCurrentParasha, getParashaMetadata } from './lib/parasha-calendar.js';
import { CONFIG, getSeriesAbbrev, getTemplateAbbrev } from './lib/config.js';

// Parse arguments
const args = minimist(process.argv.slice(2), {
  string: ['cards', 'card-id'],
  boolean: ['current', 'dry-run', 'list', 'verbose', 'help'],
  alias: {
    h: 'help',
    c: 'current',
    d: 'dry-run',
    v: 'verbose'
  }
});

// Show help
if (args.help) {
  console.log(`
Parasha Pack Deck Generator

Usage:
  node scripts/generate-parasha-deck.js <parasha>           Generate deck for parasha
  node scripts/generate-parasha-deck.js --current           Generate current week's deck
  node scripts/generate-parasha-deck.js --list              List available decks

Options:
  --current, -c       Use Sefaria API to get current week's parasha
  --dry-run, -d       Generate prompts only (no API calls)
  --cards <types>     Card types to generate: anchor,spotlight,action,thinker,power-word
  --card-id <id>      Generate specific card by ID
  --verbose, -v       Show detailed output
  --help, -h          Show this help

Examples:
  node scripts/generate-parasha-deck.js yitro
  node scripts/generate-parasha-deck.js --current --dry-run
  node scripts/generate-parasha-deck.js yitro --cards spotlight,thinker
  node scripts/generate-parasha-deck.js yitro --card-id yitro-spotlight-yitro
`);
  process.exit(0);
}

// List available decks
if (args.list) {
  const decks = listDecks();
  console.log('\n📚 Available Parasha Pack Decks:\n');
  if (decks.length === 0) {
    console.log('  No decks found in data/series/parasha-pack/decks/');
  } else {
    decks.forEach(d => console.log(`  - ${d}`));
  }
  console.log('');
  process.exit(0);
}

/**
 * Load the appropriate template for a card type
 */
async function loadCardTemplate(cardType) {
  const templateMap = {
    'anchor': 'anchor-card',
    'spotlight': 'spotlight-card',
    'action': 'action-card',
    'thinker': 'thinker-card',
    'power-word': 'power-word-card'
  };

  const templateId = templateMap[cardType];
  if (!templateId) {
    throw new Error(`Unknown card type: ${cardType}`);
  }

  const templatePath = `./prompts/templates/parasha-pack/${templateId}.js`;
  try {
    const module = await import(`../${templatePath}`);
    // Get the default export or the named template export
    return module.default ||
           module[`${cardType.replace('-', '')}CardTemplate`] ||
           Object.values(module).find(v => v?.generate);
  } catch (error) {
    console.error(`Error loading template ${templateId}:`, error.message);
    throw error;
  }
}

/**
 * Generate a single card prompt
 */
async function generateCardPrompt(deck, card, options = {}) {
  const template = await loadCardTemplate(card.type);

  if (!template?.generate) {
    throw new Error(`Template for ${card.type} does not have a generate function`);
  }

  // Use simple version for testing if requested
  if (options.simple && template.generateSimple) {
    return template.generateSimple(deck, card);
  }

  return template.generate(deck, card, options);
}

/**
 * Build output filename
 */
function buildFilename(deck, card) {
  const seriesAbbrev = getSeriesAbbrev('parasha-pack');
  const templateAbbrev = getTemplateAbbrev(`${card.type}-card`);
  const timestamp = new Date().toISOString().replace(/[:-]/g, '').split('.')[0];

  return `${seriesAbbrev}_${deck.id}_${templateAbbrev}_${card.id}_${timestamp}`;
}

/**
 * Main generation function
 */
async function generateDeck() {
  // Determine which parasha to generate
  let parashaId;

  if (args.current) {
    console.log('🔍 Fetching current parasha from Sefaria...');
    const current = await getCurrentParasha();

    if (!current) {
      console.error('❌ Could not fetch current parasha from Sefaria');
      process.exit(1);
    }

    parashaId = current.id;
    console.log(`📅 Current parasha: ${current.name} (${current.nameHebrew})`);
  } else {
    parashaId = args._[0];

    if (!parashaId) {
      console.error('❌ Please specify a parasha or use --current');
      console.error('   Example: node scripts/generate-parasha-deck.js yitro');
      console.error('   Run with --list to see available decks');
      process.exit(1);
    }
  }

  // Load deck definition
  console.log(`📖 Loading deck: ${parashaId}`);
  const deck = loadDeck(parashaId);

  if (!deck) {
    console.error(`❌ Deck not found: ${parashaId}`);
    console.error('   Run with --list to see available decks');
    process.exit(1);
  }

  console.log(`✅ Loaded: ${deck.parasha} (${deck.parashaHebrew})`);
  console.log(`   ${deck.cards.length} cards in deck`);

  // Load characters
  const characters = loadDeckCharacters(deck);
  console.log(`   ${characters.size} characters loaded`);

  // Determine which cards to generate
  let cardsToGenerate = deck.cards;

  if (args['card-id']) {
    const card = getCardById(deck, args['card-id']);
    if (!card) {
      console.error(`❌ Card not found: ${args['card-id']}`);
      process.exit(1);
    }
    cardsToGenerate = [card];
  } else if (args.cards) {
    const requestedTypes = args.cards.split(',').map(t => t.trim());
    cardsToGenerate = deck.cards.filter(c => requestedTypes.includes(c.type));

    if (cardsToGenerate.length === 0) {
      console.error(`❌ No cards found for types: ${args.cards}`);
      console.error('   Available types: anchor, spotlight, action, thinker, power-word');
      process.exit(1);
    }
  }

  console.log(`\n🎴 Generating ${cardsToGenerate.length} card(s)...\n`);

  // Create output directory
  const outputDir = join(CONFIG.paths.output, 'decks', 'parasha-pack', deck.id);
  if (!args['dry-run']) {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  }

  // Generate each card
  const results = [];

  for (const card of cardsToGenerate) {
    console.log(`  📝 ${card.type}: ${card.title || card.id}`);

    try {
      const prompt = await generateCardPrompt(deck, card, {
        simple: args['dry-run'] // Use simple prompts for dry run
      });

      if (args['dry-run']) {
        console.log('\n--- PROMPT ---');
        console.log(prompt);
        console.log('--- END PROMPT ---\n');
      } else {
        // TODO: Call image generation API
        // For now, save the prompt to a file
        const filename = buildFilename(deck, card);
        const promptPath = join(outputDir, `${filename}.prompt.txt`);
        writeFileSync(promptPath, prompt, 'utf8');
        console.log(`     Prompt saved: ${filename}.prompt.txt`);

        results.push({
          cardId: card.id,
          type: card.type,
          title: card.title,
          promptPath
        });
      }
    } catch (error) {
      console.error(`     ❌ Error: ${error.message}`);
      if (args.verbose) {
        console.error(error);
      }
    }
  }

  // Summary
  if (!args['dry-run']) {
    console.log(`\n✅ Generated ${results.length} card prompts`);
    console.log(`   Output: ${outputDir}`);
    console.log('\nTo generate images, run the prompts through the image generation API.');
  }

  return results;
}

// Run
generateDeck().catch(error => {
  console.error('Fatal error:', error.message);
  if (args.verbose) {
    console.error(error);
  }
  process.exit(1);
});
