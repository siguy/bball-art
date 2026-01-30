import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, copyFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

// Import lib modules
import imageProcessor from './lib/image-processor.js';
import captionGenerator from './lib/caption-generator.js';
import bufferClient from './lib/buffer-client.js';
import pairingAssistant, { callGemini, generatePlayerPoseFile, generateFigurePoseFile, generateFigureQuotesFile } from './lib/pairing-assistant.js';
import { researchBiblicalFigure } from './lib/sefaria-client.js';
import feedbackEnricher from './lib/feedback-enricher.js';
import feedbackAnalyzer from './lib/feedback-analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Serve card images from output directory
app.use('/cards', express.static(join(ROOT, 'output/cards')));

// Serve logo
app.use('/brand', express.static(join(ROOT, 'brand')));

// Data paths
const MANIFEST_PATH = join(__dirname, 'data/manifest.json');
const FEEDBACK_PATH = join(__dirname, 'data/feedback.json');
const WEB_CARDS_DIR = join(ROOT, 'web/cards');
const WEB_DATA_PATH = join(ROOT, 'web/js/data.js');
const EXPORT_QUEUE_PATH = join(__dirname, 'data/export-queue.json');
const EXPORT_CONFIG_PATH = join(__dirname, 'data/export-config.json');
const CAPTION_TEMPLATES_PATH = join(__dirname, 'data/caption-templates.json');
const EXPORT_OUTPUT_DIR = join(ROOT, 'output/exports');

// Template abbreviation reverse mapping for parsing new filenames
const TEMPLATE_ABBREV_REVERSE = {
  'tl': 'thunder-lightning',
  'tld': 'thunder-lightning-dark',
  'tlr': 'thunder-lightning-rivalry',
  'bt': 'beam-team',
  'bts': 'beam-team-shadow',
  'btr': 'beam-team-rivalry',
  'bta': 'beam-team-a',
  'btb': 'beam-team-b',
  'btc': 'beam-team-c',
  'btcd': 'beam-team-c-dunk',
  'mu': 'metal-universe',
  'mud': 'metal-universe-dark',
  'muda': 'metal-universe-dark-alt',
  'mudar': 'metal-universe-dark-alt-realistic',
  'mur': 'metal-universe-rivalry',
  'dt': 'downtown',
  'kb': 'kaboom',
  'ps': 'prizm-silver',
  'sb': 'spouse-blessing',
  'tc': 'trial-card',
  'pc': 'plague-card',
  'tw': 'three-way'
};

// Series abbreviation reverse mapping
const SERIES_ABBREV_REVERSE = {
  'cc': 'court-covenant',
  'tt': 'torah-titans',
  'st': 'scripture-titans',
  'ff': 'founding-fathers'
};

/**
 * Parse a card filename (supports both old and new formats)
 * @param {string} file - Filename to parse
 * @returns {Object|null} Parsed data or null if not recognized
 */
function parseCardFilename(file) {
  // Try new format first: {series}_{pairing}_{template}_{pose1}_{pose2}_{timestamp}.ext
  const newMatch = file.match(/^([a-z]{2})_([a-z0-9-]+)_([a-z]+)_([a-z0-9-]+)_([a-z0-9-]+)_(\d{8}T\d{6})\.(png|jpe?g)$/);
  if (newMatch) {
    const [, seriesAbbr, pairingId, templateAbbr, pose1, pose2, timestamp, ext] = newMatch;
    const template = TEMPLATE_ABBREV_REVERSE[templateAbbr] || templateAbbr;
    const series = SERIES_ABBREV_REVERSE[seriesAbbr] || seriesAbbr;
    // Convert compact timestamp to readable format
    const isoTimestamp = `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}T${timestamp.slice(9, 11)}-${timestamp.slice(11, 13)}-${timestamp.slice(13, 15)}`;
    return {
      format: 'new',
      series,
      pairingId,
      template,
      pose1,
      pose2,
      timestamp: isoTimestamp,
      isSolo: pairingId.startsWith('solo-')
    };
  }

  // Try old format: {template}-{timestamp}.ext
  const oldMatch = file.match(/^(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.(png|jpe?g)$/);
  if (oldMatch) {
    const [, template, timestamp] = oldMatch;
    return {
      format: 'old',
      template,
      timestamp,
      isSolo: false
    };
  }

  return null;
}

/**
 * Scan a single directory for card files
 * @param {string} dirPath - Directory path to scan
 * @param {string} series - Series ID
 * @param {string} pairingId - Pairing or solo ID (directory name)
 * @param {string} urlBase - Base URL path for cards
 * @returns {Array} Array of card objects
 */
function scanCardDirectory(dirPath, series, pairingId, urlBase) {
  const cards = [];
  if (!existsSync(dirPath)) return cards;

  const files = readdirSync(dirPath).filter(f =>
    f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.jpg')
  );

  for (const file of files) {
    const parsed = parseCardFilename(file);
    if (!parsed) continue;

    const promptFile = file.replace(/\.(png|jpe?g)$/, '-prompt.txt');
    const promptPath = join(dirPath, promptFile);

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

    const fileStat = statSync(join(dirPath, file));
    const template = parsed.template;
    const timestamp = parsed.timestamp;

    // Determine if solo
    const isSolo = pairingId.startsWith('solo-');
    let characterType = null;
    let characterId = null;

    if (isSolo) {
      const soloMatch = pairingId.match(/^solo-(player|figure)-(.+)$/);
      if (soloMatch) {
        characterType = soloMatch[1];
        characterId = soloMatch[2];
      }
    }

    // Build card ID based on format
    let cardId;
    if (parsed.format === 'new') {
      // New format ID: pairingId-templateAbbr-timestamp (compact)
      const templateAbbr = Object.entries(TEMPLATE_ABBREV_REVERSE).find(([k, v]) => v === template)?.[0] || template;
      const compactTs = timestamp.replace(/-/g, '').replace('T', 'T');
      cardId = `${pairingId}-${templateAbbr}-${compactTs}`;
    } else {
      // Old format ID: pairingId-template-timestamp
      cardId = isSolo
        ? `solo-${characterType}-${characterId}-${template}-${timestamp}`
        : `${pairingId}-${template}-${timestamp}`;
    }

    const card = {
      id: cardId,
      series,
      template,
      timestamp: timestamp.replace(/-/g, ':').replace('T', ' ').slice(0, 19),
      isoTimestamp: timestamp,
      interaction,
      filename: file,
      path: `${urlBase}/${file}`,
      promptPath: existsSync(promptPath) ? `${urlBase}/${promptFile}` : null,
      prompt,
      size: fileStat.size
    };

    if (isSolo) {
      card.mode = 'solo';
      card.characterType = characterType;
      card.characterId = characterId;
    } else {
      card.mode = 'pairing';
      card.pairingId = pairingId;
    }

    // Add pose info if available (new format)
    if (parsed.format === 'new' && parsed.pose1 && parsed.pose2) {
      card.poses = { pose1: parsed.pose1, pose2: parsed.pose2 };
    }

    cards.push(card);
  }

  return cards;
}

/**
 * Scan output directory and build manifest
 * Supports both series directories and legacy flat structure
 */
function buildManifest() {
  const cardsDir = join(ROOT, 'output/cards');
  let cards = [];
  const soloCharacters = [];

  if (!existsSync(cardsDir)) {
    return { cards: [], series: [], pairings: [], templates: [], soloCharacters: [], generated: new Date().toISOString() };
  }

  // Get all series directories
  const seriesIds = ['court-covenant', 'torah-titans'];
  const foundSeries = [];

  for (const seriesId of seriesIds) {
    const seriesDir = join(cardsDir, seriesId);
    if (!existsSync(seriesDir)) continue;

    foundSeries.push(seriesId);

    // Scan all subdirectories in this series
    const subDirs = readdirSync(seriesDir).filter(f => {
      const stat = statSync(join(seriesDir, f));
      return stat.isDirectory();
    });

    for (const subDir of subDirs) {
      const subDirPath = join(seriesDir, subDir);

      // Check if this is a sub-series directory (like spouses, plagues)
      const isSubSeries = ['spouses', 'abrahams-trials', 'plagues', 'triangles'].includes(subDir);

      if (isSubSeries) {
        // Scan pairings within the sub-series
        const pairingDirs = readdirSync(subDirPath).filter(f => {
          const stat = statSync(join(subDirPath, f));
          return stat.isDirectory();
        });

        for (const pairingId of pairingDirs) {
          const pairingDir = join(subDirPath, pairingId);
          const urlBase = `/cards/${seriesId}/${subDir}/${pairingId}`;
          const dirCards = scanCardDirectory(pairingDir, seriesId, pairingId, urlBase);
          dirCards.forEach(c => { c.subSeries = subDir; });
          cards = cards.concat(dirCards);
        }
      } else {
        // Direct pairing or solo directory
        const urlBase = `/cards/${seriesId}/${subDir}`;
        const dirCards = scanCardDirectory(subDirPath, seriesId, subDir, urlBase);
        cards = cards.concat(dirCards);

        // Track solo characters
        if (subDir.startsWith('solo-')) {
          const soloMatch = subDir.match(/^solo-(player|figure)-(.+)$/);
          if (soloMatch) {
            const [, characterType, characterId] = soloMatch;
            if (!soloCharacters.some(c => c.type === characterType && c.id === characterId && c.series === seriesId)) {
              soloCharacters.push({ type: characterType, id: characterId, series: seriesId });
            }
          }
        }
      }
    }
  }

  // Also scan legacy flat structure (for any non-migrated cards)
  const legacyDirs = readdirSync(cardsDir).filter(f => {
    const stat = statSync(join(cardsDir, f));
    // Skip series directories and backups
    return stat.isDirectory() &&
           !seriesIds.includes(f) &&
           !f.startsWith('cards-backup') &&
           !f.startsWith('.');
  });

  for (const dirName of legacyDirs) {
    const dirPath = join(cardsDir, dirName);
    const urlBase = `/cards/${dirName}`;
    const dirCards = scanCardDirectory(dirPath, 'court-covenant', dirName, urlBase);
    dirCards.forEach(c => { c.legacy = true; });
    cards = cards.concat(dirCards);

    // Track solo characters
    if (dirName.startsWith('solo-')) {
      const soloMatch = dirName.match(/^solo-(player|figure)-(.+)$/);
      if (soloMatch) {
        const [, characterType, characterId] = soloMatch;
        if (!soloCharacters.some(c => c.type === characterType && c.id === characterId)) {
          soloCharacters.push({ type: characterType, id: characterId, series: 'court-covenant' });
        }
      }
    }
  }

  // Sort by timestamp descending (newest first)
  cards.sort((a, b) => b.isoTimestamp.localeCompare(a.isoTimestamp));

  // Extract unique values
  const pairings = [...new Set(cards.filter(c => c.pairingId).map(c => c.pairingId))].sort();
  const templates = [...new Set(cards.map(c => c.template))].sort();
  const interactions = [...new Set(cards.filter(c => c.interaction).map(c => c.interaction))].sort();

  const manifest = {
    cards,
    series: foundSeries,
    pairings,
    templates,
    interactions,
    soloCharacters,
    totalCards: cards.length,
    generated: new Date().toISOString()
  };

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  return manifest;
}

/**
 * Load or initialize feedback
 */
function loadFeedback() {
  if (existsSync(FEEDBACK_PATH)) {
    return JSON.parse(readFileSync(FEEDBACK_PATH, 'utf-8'));
  }
  return {};
}

function saveFeedback(feedback) {
  writeFileSync(FEEDBACK_PATH, JSON.stringify(feedback, null, 2));
}


// API Routes

// Get manifest (rebuild on request)
app.get('/api/manifest', (req, res) => {
  const manifest = buildManifest();
  res.json(manifest);
});

// Get all feedback
app.get('/api/feedback', (req, res) => {
  res.json(loadFeedback());
});

// Update feedback for a card
app.post('/api/feedback/:cardId', (req, res) => {
  const { cardId } = req.params;
  const feedback = loadFeedback();
  feedback[cardId] = {
    ...feedback[cardId],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  saveFeedback(feedback);
  res.json({ success: true, feedback: feedback[cardId] });
});

// Delete feedback for a card
app.delete('/api/feedback/:cardId', (req, res) => {
  const feedback = loadFeedback();
  delete feedback[req.params.cardId];
  saveFeedback(feedback);
  res.json({ success: true });
});

// ========================================
// FEEDBACK EXPORT & ANALYSIS ENDPOINTS
// ========================================

/**
 * Load all series configurations
 */
function loadSeriesConfigs() {
  const seriesDir = join(ROOT, 'data/series');
  const configs = {};

  if (!existsSync(seriesDir)) return configs;

  const dirs = readdirSync(seriesDir).filter(f => {
    const stat = statSync(join(seriesDir, f));
    return stat.isDirectory();
  });

  for (const dir of dirs) {
    const configPath = join(seriesDir, dir, 'series-config.json');
    if (existsSync(configPath)) {
      configs[dir] = JSON.parse(readFileSync(configPath, 'utf-8'));
    }
  }

  return configs;
}

/**
 * Load pairings for a specific series
 */
function loadSeriesPairings(seriesId) {
  const pairingsDir = join(ROOT, `data/series/${seriesId}/pairings`);
  const pairings = {};

  if (!existsSync(pairingsDir)) return pairings;

  const files = readdirSync(pairingsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(pairingsDir, file), 'utf-8'));
    pairings[data.id] = data;
  }

  // Also check sub-series directories
  const subSeriesDir = join(ROOT, `data/series/${seriesId}/sub-series`);
  if (existsSync(subSeriesDir)) {
    const subDirs = readdirSync(subSeriesDir).filter(f => {
      const stat = statSync(join(subSeriesDir, f));
      return stat.isDirectory();
    });

    for (const subDir of subDirs) {
      const subPairingsDir = join(subSeriesDir, subDir);
      const subFiles = readdirSync(subPairingsDir).filter(f => f.endsWith('.json'));
      for (const file of subFiles) {
        const data = JSON.parse(readFileSync(join(subPairingsDir, file), 'utf-8'));
        data.subSeries = subDir;
        pairings[data.id] = data;
      }
    }
  }

  return pairings;
}

/**
 * Load all pairing data for enrichment (all series)
 */
function loadAllPairings() {
  const pairings = {};
  const seriesIds = ['court-covenant', 'torah-titans'];

  for (const seriesId of seriesIds) {
    const seriesPairings = loadSeriesPairings(seriesId);
    for (const [id, pairing] of Object.entries(seriesPairings)) {
      pairing.series = seriesId;
      pairings[id] = pairing;
    }
  }

  return pairings;
}

/**
 * Export raw feedback (with optional rating filter)
 * GET /api/feedback/export?rating=loved
 */
app.get('/api/feedback/export', (req, res) => {
  try {
    const { rating } = req.query;
    const feedback = loadFeedback();

    let exportData = feedback;

    // Filter by rating if specified
    if (rating) {
      exportData = {};
      for (const [cardId, fb] of Object.entries(feedback)) {
        if (rating === 'none' || rating === 'unrated') {
          if (!fb.rating) exportData[cardId] = fb;
        } else if (fb.rating === rating) {
          exportData[cardId] = fb;
        }
      }
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="feedback-${rating || 'all'}-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Export enriched feedback with card metadata
 * GET /api/feedback/export/enriched?rating=loved&format=json
 * Supports JSON or CSV format
 */
app.get('/api/feedback/export/enriched', (req, res) => {
  try {
    const { rating, format = 'json' } = req.query;
    const feedback = loadFeedback();
    const manifest = buildManifest();
    const pairings = loadAllPairings();

    // Enrich feedback
    let enriched = feedbackEnricher.enrichFeedback(feedback, manifest, pairings);

    // Filter by rating if specified
    if (rating) {
      enriched = feedbackEnricher.filterByRating(enriched, rating);
    }

    // Return in requested format
    if (format === 'csv') {
      const csv = feedbackEnricher.toCSV(enriched);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="feedback-enriched-${rating || 'all'}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="feedback-enriched-${rating || 'all'}-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(enriched);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get feedback analysis / statistics
 * GET /api/feedback/analysis
 */
app.get('/api/feedback/analysis', (req, res) => {
  try {
    const feedback = loadFeedback();
    const manifest = buildManifest();
    const pairings = loadAllPairings();

    // Enrich and analyze
    const enriched = feedbackEnricher.enrichFeedback(feedback, manifest, pairings);
    const analysis = feedbackAnalyzer.analyzeFeedback(enriched);

    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get generation hints for a pairing (or all hints)
 * GET /api/generation-hints?pairingId=jordan-moses
 */
app.get('/api/generation-hints', (req, res) => {
  try {
    const { pairingId } = req.query;

    if (pairingId) {
      // Get hints for specific pairing
      const hints = feedbackAnalyzer.getHintsForPairing(pairingId);
      res.json(hints || { pairing: null, global: { topTemplates: [], avoidTemplates: [] } });
    } else {
      // Get all hints
      const hints = feedbackAnalyzer.loadHints();
      res.json(hints || { quickHints: {}, globalRecommendations: { topTemplates: [], avoidTemplates: [] } });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Regenerate hints from current feedback
 * POST /api/generation-hints/regenerate
 */
app.post('/api/generation-hints/regenerate', (req, res) => {
  try {
    const feedback = loadFeedback();
    const manifest = buildManifest();
    const pairings = loadAllPairings();

    // Enrich, analyze, generate hints
    const enriched = feedbackEnricher.enrichFeedback(feedback, manifest, pairings);
    const analysis = feedbackAnalyzer.analyzeFeedback(enriched);
    const hints = feedbackAnalyzer.generateHints(analysis);

    // Save hints
    feedbackAnalyzer.saveHints(hints);

    res.json({ success: true, hints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available series
app.get('/api/series', (req, res) => {
  const configs = loadSeriesConfigs();
  const series = Object.entries(configs).map(([id, config]) => ({
    id,
    name: config.name,
    tagline: config.tagline,
    description: config.description,
    cardModes: config.cardModes || [],
    availableTemplates: config.availableTemplates || [],
    seriesSpecificTemplates: config.seriesSpecificTemplates || []
  }));
  res.json(series);
});

// Get single series config
app.get('/api/series/:seriesId', (req, res) => {
  const { seriesId } = req.params;
  const configPath = join(ROOT, `data/series/${seriesId}/series-config.json`);

  if (!existsSync(configPath)) {
    return res.status(404).json({ error: 'Series not found' });
  }

  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  res.json(config);
});

// Get pairing data (summary) - supports ?series=court-covenant filter
app.get('/api/pairings', (req, res) => {
  const { series: seriesFilter } = req.query;
  const seriesIds = seriesFilter ? [seriesFilter] : ['court-covenant', 'torah-titans'];
  const pairings = {};

  for (const seriesId of seriesIds) {
    const seriesPairings = loadSeriesPairings(seriesId);
    for (const [id, data] of Object.entries(seriesPairings)) {
      // Handle different pairing structures (player-figure vs figure-figure)
      const playerName = data.player?.name || data.characters?.[0]?.name;
      const figureName = data.figure?.name || data.characters?.[1]?.name;
      const figureDisplayName = data.figure?.displayName || data.characters?.[1]?.displayName || figureName;
      const era = data.player?.era || data.era;

      pairings[id] = {
        id: data.id,
        series: seriesId,
        type: data.type,
        subSeries: data.subSeries,
        playerName,
        figureName,
        figureDisplayName,
        era,
        connection: data.connection?.narrative || data.connection?.thematic
      };
    }
  }

  res.json(pairings);
});

// Get full pairing data (all details) - supports ?series= filter
app.get('/api/pairings-full', (req, res) => {
  const { series: seriesFilter } = req.query;
  const seriesIds = seriesFilter ? [seriesFilter] : ['court-covenant', 'torah-titans'];
  const pairings = {};

  for (const seriesId of seriesIds) {
    const seriesPairings = loadSeriesPairings(seriesId);
    for (const [id, data] of Object.entries(seriesPairings)) {
      data.series = seriesId;
      pairings[id] = data;
    }
  }

  res.json(pairings);
});

// Add custom interaction to a pairing
app.post('/api/pairings/:pairingId/interactions', (req, res) => {
  const { pairingId } = req.params;
  const { series = 'court-covenant' } = req.body;

  // Try to find the pairing in the specified series or search all
  let pairingPath = join(ROOT, `data/series/${series}/pairings`, `${pairingId}.json`);

  // If not found, search other series
  if (!existsSync(pairingPath)) {
    const allPairings = loadAllPairings();
    const pairing = allPairings[pairingId];
    if (pairing) {
      const pairingSeries = pairing.series || 'court-covenant';
      pairingPath = join(ROOT, `data/series/${pairingSeries}/pairings`, `${pairingId}.json`);
    }
  }

  if (!existsSync(pairingPath)) {
    return res.status(404).json({ success: false, error: 'Pairing not found' });
  }

  try {
    const pairing = JSON.parse(readFileSync(pairingPath, 'utf-8'));

    // Initialize customInteractions array if it doesn't exist
    if (!pairing.customInteractions) {
      pairing.customInteractions = [];
    }

    // Add the new interaction
    const interaction = {
      id: req.body.id,
      name: req.body.name,
      playerAction: req.body.playerAction,
      figureAction: req.body.figureAction,
      energy: req.body.energy || ''
    };

    // Check for duplicate ID
    const existing = pairing.customInteractions.find(i => i.id === interaction.id);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Interaction ID already exists' });
    }

    pairing.customInteractions.push(interaction);

    // Save updated pairing
    writeFileSync(pairingPath, JSON.stringify(pairing, null, 2));

    res.json({ success: true, interaction });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generate a card
app.post('/api/generate', async (req, res) => {
  const { pairingId, template, interaction, customPlayerAction, customFigureAction } = req.body;

  if (!pairingId || !template) {
    return res.status(400).json({ success: false, error: 'Missing pairingId or template' });
  }

  try {
    // Build the command
    const args = [
      join(ROOT, 'scripts/generate-card.js'),
      pairingId,
      template
    ];

    // Add interaction if specified (and not using custom actions)
    if (interaction && !customPlayerAction) {
      args.push('--interaction', interaction);
    }

    // If custom actions specified, we need to create a custom template variant
    // For now, we'll use the generate-card-custom.js script (to be created)
    if (customPlayerAction && customFigureAction) {
      args.push('--custom-player-action', customPlayerAction);
      args.push('--custom-figure-action', customFigureAction);
    }

    console.log(`Generating card: ${pairingId} ${template}`);

    // Spawn the process
    const child = spawn('node', args, {
      cwd: ROOT,
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(data.toString());
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Extract filename from output
        const match = stdout.match(/File: (.+\.jpe?g)/);
        const filename = match ? match[1].split('/').pop() : 'generated';

        // Build cardId from filename (format: template-timestamp.ext)
        // CardId format: pairingId-template-timestamp
        let cardId = null;
        const filenameMatch = filename.match(/^(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.(png|jpe?g)$/);
        if (filenameMatch) {
          const [, extractedTemplate, timestamp] = filenameMatch;
          cardId = `${pairingId}-${extractedTemplate}-${timestamp}`;
        }

        res.json({ success: true, filename, cardId, pairingId, output: stdout });
      } else {
        res.json({ success: false, error: stderr || 'Generation failed', output: stdout });
      }
    });

    child.on('error', (err) => {
      res.status(500).json({ success: false, error: err.message });
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export "loved" cards to web directory
app.post('/api/export-loved', (req, res) => {
  try {
    const feedbackData = loadFeedback();
    const manifest = buildManifest();
    const pairingsDir = join(ROOT, 'data/series/court-covenant/pairings');

    // Get all cards with "loved" rating
    const lovedCardIds = Object.entries(feedbackData)
      .filter(([_, fb]) => fb.rating === 'loved')
      .map(([cardId]) => cardId);

    if (lovedCardIds.length === 0) {
      return res.json({ success: true, exported: 0, message: 'No loved cards to export' });
    }

    // Ensure web/cards directory exists
    if (!existsSync(WEB_CARDS_DIR)) {
      mkdirSync(WEB_CARDS_DIR, { recursive: true });
    }

    const selectedCards = [];
    const pairingsData = {};
    let exportCount = 0;

    // Process each loved card
    for (const cardId of lovedCardIds) {
      const card = manifest.cards.find(c => c.id === cardId);
      if (!card) continue;

      // Load pairing data if not already loaded
      if (!pairingsData[card.pairingId]) {
        const pairingPath = join(pairingsDir, `${card.pairingId}.json`);
        if (existsSync(pairingPath)) {
          pairingsData[card.pairingId] = JSON.parse(readFileSync(pairingPath, 'utf-8'));
        }
      }

      const pairing = pairingsData[card.pairingId];
      if (!pairing) continue;

      // Generate a clean filename for web
      const webFilename = `${card.pairingId}-${card.template}-${String(exportCount + 1).padStart(2, '0')}.png`;
      const sourcePath = join(ROOT, 'output/cards', card.pairingId, card.filename);
      const destPath = join(WEB_CARDS_DIR, webFilename);

      // Copy the file
      if (existsSync(sourcePath)) {
        copyFileSync(sourcePath, destPath);
        exportCount++;

        // Build card data for web
        selectedCards.push({
          id: cardId,
          pairingId: card.pairingId,
          player: pairing.player.name,
          figure: pairing.figure.name,
          connection: pairing.connection.thematic,
          narrative: pairing.connection.narrative,
          template: card.template.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          image: `cards/${webFilename}`
        });
      }
    }

    // Build pairings object for data.js
    const webPairings = {};
    for (const [id, pairing] of Object.entries(pairingsData)) {
      webPairings[id] = {
        player: { name: pairing.player.name, displayName: pairing.player.displayName, era: pairing.player.era },
        figure: { name: pairing.figure.name, displayName: pairing.figure.displayName },
        connection: pairing.connection.thematic,
        narrative: pairing.connection.narrative
      };
    }

    // Write data.js
    const dataJsContent = `// Court & Covenant - Curated Card Data
// Auto-generated from visualizer - "loved" cards
// Generated: ${new Date().toISOString()}

export const curatedCards = ${JSON.stringify(selectedCards, null, 2)};

export const pairings = ${JSON.stringify(webPairings, null, 2)};
`;

    writeFileSync(WEB_DATA_PATH, dataJsContent);

    res.json({
      success: true,
      exported: exportCount,
      total: lovedCardIds.length,
      cards: selectedCards.map(c => c.image)
    });

  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================
// EXPORT SYSTEM - Queue & Caption APIs
// ========================================

/**
 * Load or initialize export queue
 */
function loadExportQueue() {
  if (existsSync(EXPORT_QUEUE_PATH)) {
    return JSON.parse(readFileSync(EXPORT_QUEUE_PATH, 'utf-8'));
  }
  return { queue: [], carousels: [], threads: [], processed: [] };
}

function saveExportQueue(data) {
  writeFileSync(EXPORT_QUEUE_PATH, JSON.stringify(data, null, 2));
}

/**
 * Load export config
 */
function loadExportConfig() {
  return JSON.parse(readFileSync(EXPORT_CONFIG_PATH, 'utf-8'));
}

// --- Caption API Endpoints ---

// Get available caption templates
app.get('/api/caption/templates', (req, res) => {
  try {
    const templates = captionGenerator.getAvailableTemplates();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate caption from template
app.post('/api/caption/generate', (req, res) => {
  try {
    const { templateId, platform, pairingId, playerPoseId, figurePoseId, quoteId } = req.body;

    if (!templateId || !platform || !pairingId) {
      return res.status(400).json({ error: 'Missing required fields: templateId, platform, pairingId' });
    }

    const result = captionGenerator.generateCaption({
      templateId,
      platform,
      pairingId,
      playerPoseId,
      figurePoseId,
      quoteId
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available quotes for a figure
app.get('/api/caption/quotes/:figureId', (req, res) => {
  try {
    const quotes = captionGenerator.getAvailableQuotes(req.params.figureId);
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available poses for a character
app.get('/api/caption/poses/:type/:poseFileId', (req, res) => {
  try {
    const { type, poseFileId } = req.params;
    if (type !== 'player' && type !== 'figure') {
      return res.status(400).json({ error: 'Type must be "player" or "figure"' });
    }
    const poses = captionGenerator.getAvailablePoses(type, poseFileId);
    res.json(poses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get hashtags for a pairing
app.get('/api/caption/hashtags/:pairingId', (req, res) => {
  try {
    const hashtags = captionGenerator.getHashtags(req.params.pairingId);
    res.json(hashtags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Export Queue API Endpoints ---

// Get export queue
app.get('/api/export/queue', (req, res) => {
  try {
    const queue = loadExportQueue();
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add item to export queue
app.post('/api/export/queue', (req, res) => {
  try {
    const { cardId, destinations, captions, scheduledAt } = req.body;

    if (!cardId || !destinations || destinations.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: cardId, destinations' });
    }

    const queue = loadExportQueue();
    const item = {
      id: uuidv4(),
      cardId,
      destinations,
      captions: captions || {},
      scheduledAt: scheduledAt || null,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    queue.queue.push(item);
    saveExportQueue(queue);

    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update queue item
app.put('/api/export/queue/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const queue = loadExportQueue();
    const index = queue.queue.findIndex(item => item.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Queue item not found' });
    }

    queue.queue[index] = {
      ...queue.queue[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    saveExportQueue(queue);
    res.json({ success: true, item: queue.queue[index] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete queue item
app.delete('/api/export/queue/:id', (req, res) => {
  try {
    const { id } = req.params;
    const queue = loadExportQueue();
    queue.queue = queue.queue.filter(item => item.id !== id);
    saveExportQueue(queue);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Process export queue (export all pending items)
app.post('/api/export/process', async (req, res) => {
  try {
    const manifest = buildManifest();
    const queue = loadExportQueue();
    const config = loadExportConfig();
    const results = [];

    // Ensure export output directories exist
    if (!existsSync(EXPORT_OUTPUT_DIR)) {
      mkdirSync(EXPORT_OUTPUT_DIR, { recursive: true });
    }

    for (const item of queue.queue.filter(i => i.status === 'pending')) {
      const card = manifest.cards.find(c => c.id === item.cardId);
      if (!card) {
        results.push({ id: item.id, success: false, error: 'Card not found' });
        continue;
      }

      const sourcePath = join(ROOT, 'output/cards', card.pairingId, card.filename);
      if (!existsSync(sourcePath)) {
        results.push({ id: item.id, success: false, error: 'Source image not found' });
        continue;
      }

      const exportResults = {};

      // Process each destination
      for (const destination of item.destinations) {
        if (destination === 'website') {
          // Export to web/cards
          const webFilename = `${card.pairingId}-${card.template}-${Date.now()}.png`;
          const destPath = join(WEB_CARDS_DIR, webFilename);

          if (!existsSync(WEB_CARDS_DIR)) {
            mkdirSync(WEB_CARDS_DIR, { recursive: true });
          }

          copyFileSync(sourcePath, destPath);
          exportResults.website = { success: true, path: `cards/${webFilename}` };
        } else {
          // Process for social platforms (instagram, twitter)
          const platformConfig = config.platforms[destination];
          if (!platformConfig) {
            exportResults[destination] = { success: false, error: 'Platform not configured' };
            continue;
          }

          const outputDir = join(EXPORT_OUTPUT_DIR, destination);
          const result = await imageProcessor.processForPlatform(
            sourcePath,
            outputDir,
            destination,
            `${card.pairingId}-${card.template}-${Date.now()}`
          );

          exportResults[destination] = result;
        }
      }

      // Move item to processed
      item.status = 'processed';
      item.processedAt = new Date().toISOString();
      item.results = exportResults;

      results.push({ id: item.id, success: true, results: exportResults });
    }

    // Update queue
    const processedItems = queue.queue.filter(i => i.status === 'processed');
    queue.processed.push(...processedItems);
    queue.queue = queue.queue.filter(i => i.status !== 'processed');
    saveExportQueue(queue);

    res.json({ success: true, processed: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export single item immediately
app.post('/api/export/single', async (req, res) => {
  try {
    const { cardId, destinations, captions } = req.body;

    if (!cardId || !destinations || destinations.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: cardId, destinations' });
    }

    const manifest = buildManifest();
    const config = loadExportConfig();
    const card = manifest.cards.find(c => c.id === cardId);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const sourcePath = join(ROOT, 'output/cards', card.pairingId, card.filename);
    if (!existsSync(sourcePath)) {
      return res.status(404).json({ error: 'Source image not found' });
    }

    const exportResults = {};

    // Ensure export output directory exists
    if (!existsSync(EXPORT_OUTPUT_DIR)) {
      mkdirSync(EXPORT_OUTPUT_DIR, { recursive: true });
    }

    for (const destination of destinations) {
      if (destination === 'website') {
        const webFilename = `${card.pairingId}-${card.template}-${Date.now()}.png`;
        const destPath = join(WEB_CARDS_DIR, webFilename);

        if (!existsSync(WEB_CARDS_DIR)) {
          mkdirSync(WEB_CARDS_DIR, { recursive: true });
        }

        copyFileSync(sourcePath, destPath);
        exportResults.website = { success: true, path: `cards/${webFilename}` };
      } else {
        const outputDir = join(EXPORT_OUTPUT_DIR, destination);
        const result = await imageProcessor.processForPlatform(
          sourcePath,
          outputDir,
          destination,
          `${card.pairingId}-${card.template}-${Date.now()}`
        );
        exportResults[destination] = result;
      }
    }

    res.json({ success: true, results: exportResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get export config
app.get('/api/export/config', (req, res) => {
  try {
    const config = loadExportConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Buffer API Endpoints ---

// Check Buffer status
app.get('/api/buffer/status', (req, res) => {
  try {
    const status = bufferClient.checkBufferStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Buffer profiles (connected social accounts)
app.get('/api/buffer/profiles', async (req, res) => {
  try {
    const status = bufferClient.checkBufferStatus();
    if (!status.configured) {
      return res.status(400).json({ error: status.reason });
    }
    const profiles = await bufferClient.getProfiles();
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Schedule post to Buffer
app.post('/api/buffer/post', async (req, res) => {
  try {
    const { captions, mediaUrl, scheduledAt } = req.body;

    const status = bufferClient.checkBufferStatus();
    if (!status.configured) {
      return res.status(400).json({ error: status.reason });
    }

    const result = await bufferClient.createMultiPlatformPost({
      captions,
      mediaUrl,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// GENERATOR API ENDPOINTS
// ========================================

const POSES_PLAYERS_DIR = join(ROOT, 'data/poses/players');
const POSES_FIGURES_DIR = join(ROOT, 'data/poses/figures');
const CHARACTERS_PLAYERS_DIR = join(ROOT, 'data/characters/players');
const CHARACTERS_FIGURES_DIR = join(ROOT, 'data/characters/figures');
const TEMPLATES_META_PATH = join(ROOT, 'data/templates-meta.json');

/**
 * Load templates metadata
 */
function loadTemplatesMeta() {
  if (existsSync(TEMPLATES_META_PATH)) {
    return JSON.parse(readFileSync(TEMPLATES_META_PATH, 'utf-8'));
  }
  return { templates: {}, darkVariants: {} };
}

/**
 * List all players with pose files
 */
app.get('/api/poses/players', (req, res) => {
  try {
    const players = [];
    if (existsSync(POSES_PLAYERS_DIR)) {
      const files = readdirSync(POSES_PLAYERS_DIR).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const data = JSON.parse(readFileSync(join(POSES_PLAYERS_DIR, file), 'utf-8'));
        players.push({
          id: data.id,
          name: data.name,
          defaultPose: data.defaultPose,
          poseCount: Object.keys(data.poses || {}).length,
          hasHairColors: !!(data.hairColors && Object.keys(data.hairColors).length > 0)
        });
      }
    }
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * List all figures with pose files
 */
app.get('/api/poses/figures', (req, res) => {
  try {
    const figures = [];
    if (existsSync(POSES_FIGURES_DIR)) {
      const files = readdirSync(POSES_FIGURES_DIR).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const data = JSON.parse(readFileSync(join(POSES_FIGURES_DIR, file), 'utf-8'));
        figures.push({
          id: data.id,
          name: data.name,
          defaultPose: data.defaultPose,
          poseCount: Object.keys(data.poses || {}).length
        });
      }
    }
    res.json(figures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get player poses by poseFileId
 */
app.get('/api/poses/players/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = join(POSES_PLAYERS_DIR, `${id}.json`);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'Player pose file not found' });
    }

    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get figure poses by poseFileId
 */
app.get('/api/poses/figures/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = join(POSES_FIGURES_DIR, `${id}.json`);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'Figure pose file not found' });
    }

    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * List available templates with metadata
 */
app.get('/api/templates', (req, res) => {
  try {
    const meta = loadTemplatesMeta();
    res.json(meta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Generate card with poses
 * Full pose-controlled generation using generate-with-poses.js script
 */
app.post('/api/generate-with-poses', async (req, res) => {
  const {
    pairingId,
    template,
    playerPose,
    figurePose,
    hairColor,
    darkMode
  } = req.body;

  if (!pairingId || !template) {
    return res.status(400).json({ success: false, error: 'Missing pairingId or template' });
  }

  try {
    // Determine which template to use based on darkMode
    let actualTemplate = template;
    if (darkMode) {
      const meta = loadTemplatesMeta();
      const templateInfo = meta.templates[template];
      if (templateInfo && templateInfo.darkVariantId) {
        actualTemplate = templateInfo.darkVariantId;
      }
    }

    // Build the command arguments
    const args = [
      join(ROOT, 'scripts/generate-with-poses.js'),
      pairingId,
      actualTemplate
    ];

    // Add pose arguments if specified
    if (playerPose && playerPose !== 'default') {
      args.push('--player-pose', playerPose);
    }
    if (figurePose && figurePose !== 'default') {
      args.push('--figure-pose', figurePose);
    }
    if (hairColor) {
      args.push('--hair', hairColor);
    }

    console.log(`Generating card with poses: ${pairingId} ${actualTemplate}`);
    console.log(`  Player pose: ${playerPose || 'default'}`);
    console.log(`  Figure pose: ${figurePose || 'default'}`);
    if (hairColor) console.log(`  Hair color: ${hairColor}`);

    // Spawn the process
    const child = spawn('node', args, {
      cwd: ROOT,
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(data.toString());
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Extract filename from output
        const match = stdout.match(/File: (.+\.jpe?g)/);
        const filename = match ? match[1].split('/').pop() : 'generated';

        // Build cardId from filename
        let cardId = null;
        const filenameMatch = filename.match(/^(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.(png|jpe?g)$/);
        if (filenameMatch) {
          const [, extractedTemplate, timestamp] = filenameMatch;
          cardId = `${pairingId}-${extractedTemplate}-${timestamp}`;
        }

        // Try to read the prompt file
        let prompt = null;
        const promptFilename = filename.replace(/\.(png|jpe?g)$/, '-prompt.txt');
        const promptPath = join(ROOT, 'output/cards', pairingId, promptFilename);
        try {
          if (existsSync(promptPath)) {
            prompt = readFileSync(promptPath, 'utf-8');
          }
        } catch (e) {
          console.error('Could not read prompt file:', e.message);
        }

        res.json({
          success: true,
          filename,
          cardId,
          pairingId,
          template: actualTemplate,
          playerPose: playerPose || 'default',
          figurePose: figurePose || 'default',
          prompt,
          output: stdout
        });
      } else {
        res.json({ success: false, error: stderr || 'Generation failed', output: stdout });
      }
    });

    child.on('error', (err) => {
      res.status(500).json({ success: false, error: err.message });
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Trim white borders from a card image
 * Overwrites the original file with the trimmed version
 */
app.post('/api/cards/trim', async (req, res) => {
  const { cardPath } = req.body;

  if (!cardPath) {
    return res.status(400).json({ success: false, error: 'Missing cardPath' });
  }

  // Construct full path - cardPath comes as relative like "/cards/solo-player-iverson/..."
  const fullPath = join(ROOT, 'output', cardPath);

  if (!existsSync(fullPath)) {
    return res.status(404).json({ success: false, error: 'Card image not found' });
  }

  try {
    const result = await imageProcessor.trimWhiteBorder(fullPath);

    if (result.success) {
      // Rebuild manifest to update any cached dimensions
      buildManifest();

      res.json({
        success: true,
        trimmed: result.trimmed,
        originalSize: result.originalSize,
        newSize: result.newSize,
        message: result.trimmed
          ? `Trimmed: ${result.originalSize.width}x${result.originalSize.height} → ${result.newSize.width}x${result.newSize.height}`
          : 'No border detected'
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Undo blend (restore pre-blend backup)
 */
app.post('/api/cards/trim/undo', (req, res) => {
  const { cardPath } = req.body;

  if (!cardPath) {
    return res.status(400).json({ success: false, error: 'Missing cardPath' });
  }

  const fullPath = join(ROOT, 'output', cardPath);

  if (!existsSync(fullPath)) {
    return res.status(404).json({ success: false, error: 'Card image not found' });
  }

  const result = imageProcessor.undoTrimWhiteBorder(fullPath);

  if (result.success) {
    buildManifest();
  }

  res.json(result);
});

/**
 * Check if a pre-blend backup exists for a card
 */
app.get('/api/cards/trim/status', (req, res) => {
  const { cardPath } = req.query;

  if (!cardPath) {
    return res.status(400).json({ error: 'Missing cardPath query parameter' });
  }

  const fullPath = join(ROOT, 'output', cardPath);

  if (!existsSync(fullPath)) {
    return res.json({ hasBackup: false });
  }

  res.json({ hasBackup: imageProcessor.hasPreBlendBackup(fullPath) });
});

/**
 * Generate card from raw prompt
 * Allows regeneration with edited prompt text
 */
app.post('/api/generate-from-prompt', async (req, res) => {
  const { prompt, pairingId, originalFilename } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Missing prompt' });
  }

  // Use pairingId for output path, or default to 'custom'
  const outputPairing = pairingId || 'custom';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputDir = join(ROOT, 'output/cards', outputPairing);
  const outputFilename = `edited-${timestamp}`;
  const outputPath = join(outputDir, outputFilename);
  const promptPath = join(outputDir, `${outputFilename}-prompt.txt`);

  console.log(`Generating from edited prompt for: ${outputPairing}`);
  console.log(`  Output: ${outputPath}`);

  try {
    // Dynamically import the nano-banana client
    const { generateImage } = await import(join(ROOT, 'scripts/nano-banana-client.js'));

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      const { mkdirSync } = await import('fs');
      mkdirSync(outputDir, { recursive: true });
    }

    // Save the prompt
    writeFileSync(promptPath, prompt);

    // Generate the image
    const result = await generateImage(prompt, {
      outputPath: outputPath,
      aspectRatio: '3:4'
    });

    if (result.success) {
      const filename = result.path.split('/').pop();
      const cardId = `${outputPairing}-edited-${timestamp}`;

      res.json({
        success: true,
        filename,
        cardId,
        pairingId: outputPairing,
        prompt
      });
    } else {
      res.json({
        success: false,
        error: result.error || 'Generation failed',
        message: result.message
      });
    }
  } catch (err) {
    console.error('Generate from prompt error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================
// SOLO MODE API ENDPOINTS
// ========================================

const PAIRINGS_DIR = join(ROOT, 'data/series/court-covenant/pairings');

/**
 * Get all unique players with their metadata
 * Extracts players from pairings, deduplicating by poseFileId
 */
app.get('/api/characters/players', (req, res) => {
  try {
    const players = new Map();

    // First, load standalone character files (these take priority)
    if (existsSync(CHARACTERS_PLAYERS_DIR)) {
      const files = readdirSync(CHARACTERS_PLAYERS_DIR).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const player = JSON.parse(readFileSync(join(CHARACTERS_PLAYERS_DIR, file), 'utf-8'));
        const poseFileId = player.poseFileId || player.id;

        // Check if pose file exists and count poses
        const poseFilePath = join(POSES_PLAYERS_DIR, `${poseFileId}.json`);
        let poseCount = 0;
        let hasHairColors = false;

        if (existsSync(poseFilePath)) {
          const poseData = JSON.parse(readFileSync(poseFilePath, 'utf-8'));
          poseCount = Object.keys(poseData.poses || {}).length;
          hasHairColors = !!(poseData.hairColors && Object.keys(poseData.hairColors).length > 0);
        }

        players.set(poseFileId, {
          id: poseFileId,
          name: player.name,
          displayName: player.displayName || player.name,
          era: player.era,
          physicalDescription: player.physicalDescription,
          poseCount,
          hasHairColors,
          standalone: true
        });
      }
    }

    // Then, load from pairings (only if not already present from standalone)
    if (existsSync(PAIRINGS_DIR)) {
      const files = readdirSync(PAIRINGS_DIR).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const pairing = JSON.parse(readFileSync(join(PAIRINGS_DIR, file), 'utf-8'));
        const player = pairing.player;
        const poseFileId = player.poseFileId;

        if (poseFileId && !players.has(poseFileId)) {
          // Check if pose file exists and count poses
          const poseFilePath = join(POSES_PLAYERS_DIR, `${poseFileId}.json`);
          let poseCount = 0;
          let hasHairColors = false;

          if (existsSync(poseFilePath)) {
            const poseData = JSON.parse(readFileSync(poseFilePath, 'utf-8'));
            poseCount = Object.keys(poseData.poses || {}).length;
            hasHairColors = !!(poseData.hairColors && Object.keys(poseData.hairColors).length > 0);
          }

          players.set(poseFileId, {
            id: poseFileId,
            name: player.name,
            displayName: player.displayName || player.name,
            era: player.era,
            physicalDescription: player.physicalDescription,
            poseCount,
            hasHairColors,
            standalone: false
          });
        }
      }
    }

    res.json(Array.from(players.values()).sort((a, b) => a.name.localeCompare(b.name)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get all unique figures with their metadata
 * Extracts figures from pairings, deduplicating by poseFileId
 */
app.get('/api/characters/figures', (req, res) => {
  try {
    const figures = new Map();

    // First, load standalone character files (these take priority)
    if (existsSync(CHARACTERS_FIGURES_DIR)) {
      const files = readdirSync(CHARACTERS_FIGURES_DIR).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const figure = JSON.parse(readFileSync(join(CHARACTERS_FIGURES_DIR, file), 'utf-8'));
        const poseFileId = figure.poseFileId || figure.id;

        // Check if pose file exists and count poses
        const poseFilePath = join(POSES_FIGURES_DIR, `${poseFileId}.json`);
        let poseCount = 0;

        if (existsSync(poseFilePath)) {
          const poseData = JSON.parse(readFileSync(poseFilePath, 'utf-8'));
          poseCount = Object.keys(poseData.poses || {}).length;
        }

        figures.set(poseFileId, {
          id: poseFileId,
          name: figure.name,
          displayName: figure.displayName || figure.name,
          physicalDescription: figure.physicalDescription,
          poseCount,
          standalone: true
        });
      }
    }

    // Then, load from pairings (only if not already present from standalone)
    if (existsSync(PAIRINGS_DIR)) {
      const files = readdirSync(PAIRINGS_DIR).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const pairing = JSON.parse(readFileSync(join(PAIRINGS_DIR, file), 'utf-8'));
        const figure = pairing.figure;
        const poseFileId = figure.poseFileId;

        if (poseFileId && !figures.has(poseFileId)) {
          // Check if pose file exists and count poses
          const poseFilePath = join(POSES_FIGURES_DIR, `${poseFileId}.json`);
          let poseCount = 0;

          if (existsSync(poseFilePath)) {
            const poseData = JSON.parse(readFileSync(poseFilePath, 'utf-8'));
            poseCount = Object.keys(poseData.poses || {}).length;
          }

          figures.set(poseFileId, {
            id: poseFileId,
            name: figure.name,
            displayName: figure.displayName || figure.name,
            physicalDescription: figure.physicalDescription,
            poseCount,
            standalone: false
          });
        }
      }
    }

    res.json(Array.from(figures.values()).sort((a, b) => a.name.localeCompare(b.name)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Generate solo character card
 */
app.post('/api/generate-solo', async (req, res) => {
  const { type, characterId, template, pose, darkMode, hairColor } = req.body;

  if (!type || !characterId || !template) {
    return res.status(400).json({ success: false, error: 'Missing type, characterId, or template' });
  }

  if (!['player', 'figure'].includes(type)) {
    return res.status(400).json({ success: false, error: 'Type must be "player" or "figure"' });
  }

  try {
    // Build the command arguments
    const args = [
      join(ROOT, 'scripts/generate-solo.js'),
      type,
      characterId,
      template
    ];

    // Add pose if specified
    if (pose && pose !== 'default') {
      args.push('--pose', pose);
    }

    // Add hair color if specified
    if (hairColor) {
      args.push('--hair', hairColor);
    }

    console.log(`Generating solo card: ${type} ${characterId} ${template}`);
    console.log(`  Pose: ${pose || 'default'}`);
    if (hairColor) console.log(`  Hair color: ${hairColor}`);

    // Spawn the process
    const child = spawn('node', args, {
      cwd: ROOT,
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(data.toString());
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Extract filename from output
        const match = stdout.match(/File: (.+\.jpe?g)/);
        const filename = match ? match[1].split('/').pop() : 'generated';

        // Build cardId
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const cardId = `solo-${type}-${characterId}-${template}-${timestamp}`;

        res.json({
          success: true,
          filename,
          cardId,
          type,
          characterId,
          template,
          pose: pose || 'default',
          output: stdout
        });
      } else {
        res.json({ success: false, error: stderr || 'Generation failed', output: stdout });
      }
    });

    child.on('error', (err) => {
      res.status(500).json({ success: false, error: err.message });
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Card Context API - Rich metadata for card detail view
// ============================================================

const QUOTES_DIR = join(ROOT, 'data/quotes/figures');

/**
 * Get enriched context for a specific card
 * GET /api/cards/:cardId/context
 * Returns pairing data, poses, quotes, and rivalry research
 */
app.get('/api/cards/:cardId/context', (req, res) => {
  try {
    const { cardId } = req.params;
    const manifest = buildManifest();
    const card = manifest.cards.find(c => c.id === cardId);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Handle solo cards differently
    if (card.mode === 'solo') {
      return res.json(getSoloCardContext(card));
    }

    // Load pairing data
    const pairingPath = join(PAIRINGS_DIR, `${card.pairingId}.json`);
    if (!existsSync(pairingPath)) {
      return res.status(404).json({ error: 'Pairing not found' });
    }

    const pairing = JSON.parse(readFileSync(pairingPath, 'utf-8'));

    // Determine which directory to use for each character based on characterType
    // For regular pairings: player from players, figure from figures
    // For rivalry pairings: check characterType field
    const playerCharType = pairing.player.characterType || 'player';
    const playerPoseDir = playerCharType === 'figure' ? POSES_FIGURES_DIR : POSES_PLAYERS_DIR;

    const figureCharType = pairing.figure.characterType || 'figure';
    const figurePoseDir = figureCharType === 'figure' ? POSES_FIGURES_DIR : POSES_PLAYERS_DIR;

    // Load player/hero poses
    let playerPoses = null;
    let detectedPlayerPose = null;
    if (pairing.player.poseFileId) {
      const playerPosePath = join(playerPoseDir, `${pairing.player.poseFileId}.json`);
      if (existsSync(playerPosePath)) {
        playerPoses = JSON.parse(readFileSync(playerPosePath, 'utf-8'));
        detectedPlayerPose = detectPoseFromPrompt(card.prompt, playerPoses.poses);
      }
    }

    // Load figure/villain poses
    let figurePoses = null;
    let detectedFigurePose = null;
    if (pairing.figure.poseFileId) {
      const figurePosePath = join(figurePoseDir, `${pairing.figure.poseFileId}.json`);
      if (existsSync(figurePosePath)) {
        figurePoses = JSON.parse(readFileSync(figurePosePath, 'utf-8'));
        detectedFigurePose = detectPoseFromPrompt(card.prompt, figurePoses.poses);
      }
    }

    // Load quotes - try both characters for figures
    let quote = null;

    // Try to get quote from figure's pose
    if (detectedFigurePose?.quoteId && figureCharType === 'figure') {
      const quotesPath = join(QUOTES_DIR, `${pairing.figure.poseFileId}.json`);
      if (existsSync(quotesPath)) {
        const quotes = JSON.parse(readFileSync(quotesPath, 'utf-8'));
        quote = quotes.quotes?.[detectedFigurePose.quoteId] || null;
      }
    }

    // For rivalry pairings, also try player's pose if it has a quoteId
    if (!quote && detectedPlayerPose?.quoteId && playerCharType === 'figure') {
      const quotesPath = join(QUOTES_DIR, `${pairing.player.poseFileId}.json`);
      if (existsSync(quotesPath)) {
        const quotes = JSON.parse(readFileSync(quotesPath, 'utf-8'));
        quote = quotes.quotes?.[detectedPlayerPose.quoteId] || null;
      }
    }

    // Filter rivalry scripture references to only include relevant ones for detected poses
    let filteredRivalry = null;
    if (pairing.rivalryResearch) {
      // Only include scripture references that are relevant to the detected poses
      let relevantSources = [];

      if (pairing.rivalryResearch.scriptureReferences) {
        // Get quoteIds from detected poses
        const relevantQuoteIds = [];
        if (detectedPlayerPose?.quoteId) relevantQuoteIds.push(detectedPlayerPose.quoteId);
        if (detectedFigurePose?.quoteId) relevantQuoteIds.push(detectedFigurePose.quoteId);

        // If we have detected poses, try to match scripture references
        if (relevantQuoteIds.length > 0) {
          // Try to match scripture references by looking for keywords from the pose
          const poseKeywords = [];
          if (detectedPlayerPose?.name) poseKeywords.push(...detectedPlayerPose.name.toLowerCase().split(/\s+/));
          if (detectedFigurePose?.name) poseKeywords.push(...detectedFigurePose.name.toLowerCase().split(/\s+/));
          if (detectedPlayerPose?.description) poseKeywords.push(...detectedPlayerPose.description.toLowerCase().split(/\s+/));
          if (detectedFigurePose?.description) poseKeywords.push(...detectedFigurePose.description.toLowerCase().split(/\s+/));

          // Filter to meaningful keywords
          const meaningfulKeywords = poseKeywords.filter(k => k.length > 4);

          relevantSources = pairing.rivalryResearch.scriptureReferences.filter(ref => {
            const refText = `${ref.source} ${ref.context || ''} ${ref.english || ''}`.toLowerCase();
            return meaningfulKeywords.some(keyword => refText.includes(keyword));
          });

          // If no matches found, take the first 2-3 most relevant
          if (relevantSources.length === 0) {
            relevantSources = pairing.rivalryResearch.scriptureReferences.slice(0, 2);
          }
        } else {
          // No poses detected, show first 2 references
          relevantSources = pairing.rivalryResearch.scriptureReferences.slice(0, 2);
        }
      }

      filteredRivalry = {
        relationship: pairing.rivalryResearch.relationship,
        scriptureReferences: relevantSources
        // Note: keyMoments intentionally omitted per user request
      };
    }

    // Build response
    const context = {
      pairing: {
        id: pairing.id,
        type: pairing.type,
        cardMode: pairing.cardMode,
        connection: pairing.connection
      },
      player: {
        name: pairing.player.name,
        displayName: pairing.player.displayName,
        era: pairing.player.era,
        archetype: pairing.player.archetype,
        physicalDescription: pairing.player.physicalDescription
      },
      figure: {
        name: pairing.figure.name,
        displayName: pairing.figure.displayName,
        archetype: pairing.figure.archetype,
        physicalDescription: pairing.figure.physicalDescription,
        visualStyle: pairing.figure.visualStyle
      },
      poses: {
        player: detectedPlayerPose ? {
          id: detectedPlayerPose.id,
          name: detectedPlayerPose.name,
          description: detectedPlayerPose.description,
          expression: detectedPlayerPose.expression,
          energy: detectedPlayerPose.energy,
          quoteId: detectedPlayerPose.quoteId
        } : null,
        figure: detectedFigurePose ? {
          id: detectedFigurePose.id,
          name: detectedFigurePose.name,
          description: detectedFigurePose.description,
          expression: detectedFigurePose.expression,
          energy: detectedFigurePose.energy,
          quoteId: detectedFigurePose.quoteId
        } : null
      },
      quote: quote,
      rivalry: filteredRivalry
    };

    res.json(context);
  } catch (err) {
    console.error('Card context error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get context for a solo card
 */
function getSoloCardContext(card) {
  const isPlayer = card.characterType === 'player';
  const poseDir = isPlayer ? POSES_PLAYERS_DIR : POSES_FIGURES_DIR;
  const posePath = join(poseDir, `${card.characterId}.json`);

  let poses = null;
  let detectedPose = null;
  let quote = null;

  if (existsSync(posePath)) {
    poses = JSON.parse(readFileSync(posePath, 'utf-8'));
    detectedPose = detectPoseFromPrompt(card.prompt, poses.poses);

    // Load quote for figures
    if (!isPlayer && detectedPose?.quoteId) {
      const quotesPath = join(QUOTES_DIR, `${card.characterId}.json`);
      if (existsSync(quotesPath)) {
        const quotes = JSON.parse(readFileSync(quotesPath, 'utf-8'));
        quote = quotes.quotes?.[detectedPose.quoteId] || null;
      }
    }
  }

  // Try to load character data from standalone file or pairing
  let character = null;
  const charDir = isPlayer ? CHARACTERS_PLAYERS_DIR : CHARACTERS_FIGURES_DIR;
  const charPath = join(charDir, `${card.characterId}.json`);

  if (existsSync(charPath)) {
    character = JSON.parse(readFileSync(charPath, 'utf-8'));
  } else {
    // Try to find in pairings
    const pairingFiles = existsSync(PAIRINGS_DIR)
      ? readdirSync(PAIRINGS_DIR).filter(f => f.endsWith('.json'))
      : [];

    for (const file of pairingFiles) {
      const pairing = JSON.parse(readFileSync(join(PAIRINGS_DIR, file), 'utf-8'));
      const charKey = isPlayer ? 'player' : 'figure';
      if (pairing[charKey]?.poseFileId === card.characterId) {
        character = pairing[charKey];
        break;
      }
    }
  }

  return {
    pairing: null,
    player: isPlayer && character ? {
      name: character.name,
      displayName: character.displayName,
      era: character.era,
      archetype: character.archetype,
      physicalDescription: character.physicalDescription
    } : null,
    figure: !isPlayer && character ? {
      name: character.name,
      displayName: character.displayName,
      archetype: character.archetype,
      physicalDescription: character.physicalDescription,
      visualStyle: character.visualStyle
    } : null,
    poses: {
      player: isPlayer && detectedPose ? {
        id: detectedPose.id,
        name: detectedPose.name,
        description: detectedPose.description,
        expression: detectedPose.expression,
        energy: detectedPose.energy
      } : null,
      figure: !isPlayer && detectedPose ? {
        id: detectedPose.id,
        name: detectedPose.name,
        description: detectedPose.description,
        expression: detectedPose.expression,
        energy: detectedPose.energy,
        quoteId: detectedPose.quoteId
      } : null
    },
    quote: quote,
    rivalry: null
  };
}

/**
 * Try to detect which pose was used by matching prompt text against pose prompts
 * Returns the best matching pose or null if no confident match
 */
function detectPoseFromPrompt(promptText, poses) {
  if (!promptText || !poses) return null;

  const promptLower = promptText.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const [poseId, pose] of Object.entries(poses)) {
    if (!pose.prompt) continue;

    // Score based on keyword matches from the pose prompt
    const poseKeywords = pose.prompt.toLowerCase()
      .split(/[^a-z]+/)
      .filter(word => word.length > 3);

    let matches = 0;
    for (const keyword of poseKeywords) {
      if (promptLower.includes(keyword)) {
        matches++;
      }
    }

    // Also check for pose name and description
    if (pose.name && promptLower.includes(pose.name.toLowerCase())) {
      matches += 5;
    }
    if (pose.description && promptLower.includes(pose.description.toLowerCase())) {
      matches += 3;
    }

    // Normalize by keyword count to avoid bias toward longer prompts
    const score = poseKeywords.length > 0 ? matches / poseKeywords.length : 0;

    if (score > bestScore && matches >= 3) {
      bestScore = score;
      bestMatch = pose;
    }
  }

  return bestMatch;
}

// ============================================================
// Character Management Endpoints
// ============================================================

/**
 * Research a character and generate data
 * POST /api/characters/research
 */
app.post('/api/characters/research', async (req, res) => {
  const { type, name } = req.body;

  if (!type || !name) {
    return res.status(400).json({ error: 'Type and name are required' });
  }

  if (!['player', 'figure'].includes(type)) {
    return res.status(400).json({ error: 'Type must be "player" or "figure"' });
  }

  try {
    const id = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    console.log(`[Research] Starting ${type} research for: ${name} (${id})`);

    let character, poses, quotes;

    if (type === 'player') {
      ({ character, poses } = await researchPlayerAI(name, id));
    } else {
      ({ character, poses, quotes } = await researchFigureAI(name, id));
    }

    // Flatten poses for frontend: data.poses should be { poseId: poseObj, ... }
    // Frontend does Object.values(data.poses) to get array of pose objects
    const flatPoses = poses.poses || poses;
    res.json({ character, poses: flatPoses, quotes });

  } catch (err) {
    console.error('Research error:', err);
    res.status(500).json({ error: err.message || 'Research failed' });
  }
});

/**
 * AI-powered player research using Gemini via pairing-assistant.
 * Generates character profile + poses in a single call.
 */
async function researchPlayerAI(name, id) {
  console.log(`[Research] AI researching player: ${name}`);

  // Generate pose file data (includes physical description)
  const poseData = await generatePlayerPoseFile(name, id);

  // Make a supplementary call for character metadata that the pose file doesn't include
  let metadata = {};
  try {
    metadata = await callGemini(`Return a JSON object with metadata for NBA player "${name}".

{
  "displayName": "nickname or empty string if not commonly known by one",
  "era": "decade they were most dominant, one of: 1960s, 1970s, 1980s, 1990s, 2000s, 2010s, 2020s",
  "jerseyColors": {
    "primary": { "base": "their most iconic team's primary jersey color", "accent": "accent color" },
    "secondary": { "base": "secondary jersey base color", "accent": "accent color" }
  },
  "archetype": "2-3 sentence description of their playing style, persona, and cultural impact",
  "height": "height as listed (e.g., 6'6\")",
  "position": "their primary position"
}

Be accurate. Use their most iconic team's colors.`);
  } catch (e) {
    console.warn('[Research] Metadata call failed, using defaults:', e.message);
  }

  // Build character object for the frontend
  const character = {
    id,
    name,
    displayName: metadata.displayName || '',
    poseFileId: id,
    era: metadata.era || '2000s',
    jerseyColors: metadata.jerseyColors || {
      primary: { base: 'blue', accent: 'white' },
      secondary: { base: 'white', accent: 'blue' }
    },
    physicalDescription: poseData.description || `${name}, professional basketball player, athletic build`,
    archetype: metadata.archetype || `${name} - NBA player`
  };

  // Build poses object for the frontend
  const poses = {
    poses: poseData.poses || {},
    defaultPose: poseData.defaultPose || Object.keys(poseData.poses || {})[0] || 'signature-move'
  };

  console.log(`[Research] Player research complete: ${Object.keys(poses.poses).length} poses generated`);
  return { character, poses };
}

/**
 * AI-powered figure research using Sefaria + Gemini.
 * 1. Fetches real biblical text from Sefaria (Hebrew + English)
 * 2. Passes Sefaria data to Gemini for pose generation with real context
 * 3. Builds quotes from Sefaria's verified Hebrew text
 */
async function researchFigureAI(name, id) {
  console.log(`[Research] AI researching biblical figure: ${name}`);

  // Step 1: Research via Sefaria for real biblical text
  let sefariaData = { found: false, description: '', quotes: [], refs: [] };
  try {
    sefariaData = await researchBiblicalFigure(name);
    console.log(`[Research] Sefaria: found=${sefariaData.found}, quotes=${sefariaData.quotes.length}`);
  } catch (e) {
    console.warn('[Research] Sefaria research failed, continuing with AI-only:', e.message);
  }

  // Step 2: Generate pose file with Sefaria context
  let poseData;
  if (sefariaData.found && sefariaData.quotes.length > 0) {
    // Enhanced generation with real biblical context
    poseData = await generateFigurePosesWithContext(name, id, sefariaData);
  } else {
    // Fallback to standard AI generation
    poseData = await generateFigurePoseFile(name, id);
  }

  // Post-process: strip props/objects that leaked into description
  if (poseData.description) {
    // Remove clauses mentioning objects (e.g., "often depicted with a lyre or sword")
    poseData.description = poseData.description
      .replace(/,?\s*(often |typically |usually |frequently )?(depicted |shown |seen |portrayed )?(with|holding|carrying|wielding|bearing)\s+[^,.]+/gi, '')
      .replace(/\.\s*A (man|woman|person|figure) (after|of|who)[^.]+\./gi, '.')
      .replace(/\s{2,}/g, ' ')
      .replace(/,\s*\./g, '.')
      .replace(/\.\s*\./g, '.')
      .trim();
  }

  // Step 3: Build quotes from Sefaria data (real Hebrew) + Gemini enrichment
  let quotesData;
  if (sefariaData.quotes.length > 0) {
    quotesData = await buildQuotesFromSefaria(name, id, sefariaData);
  } else {
    // Fallback to pure AI quotes
    quotesData = await generateFigureQuotesFile(name, id);
  }

  // Step 4: Build character object
  const character = {
    id,
    name,
    displayName: name,
    poseFileId: id,
    era: 'biblical',
    clothing: poseData.clothing || 'robes and sandals, period-accurate biblical attire',
    physicalDescription: poseData.description || `${name}, biblical figure, dignified bearing`,
    archetype: poseData.visualStyle || `${name} - biblical figure`
  };

  const poses = {
    poses: poseData.poses || {},
    defaultPose: poseData.defaultPose || Object.keys(poseData.poses || {})[0] || 'iconic-moment'
  };

  console.log(`[Research] Figure research complete: ${Object.keys(poses.poses).length} poses, ${Object.keys(quotesData?.quotes || {}).length} quotes`);
  return { character, poses, quotes: quotesData };
}

/**
 * Generate figure poses with real Sefaria biblical context.
 * Enhances the AI prompt with actual verses so poses reference real moments.
 */
async function generateFigurePosesWithContext(name, id, sefariaData) {
  // Build context string from Sefaria quotes
  const contextLines = sefariaData.quotes.slice(0, 6).map((q, i) =>
    `${i + 1}. ${q.source}: "${q.english}"`
  ).join('\n');

  const descriptionContext = sefariaData.description
    ? `\nBackground: ${sefariaData.description}\n`
    : '';

  // Build physical description context from Sefaria passages
  let physicalDescContext = '';
  if (sefariaData.physicalDescriptions && sefariaData.physicalDescriptions.length > 0) {
    const descLines = sefariaData.physicalDescriptions.map((d, i) =>
      `${i + 1}. ${d.source}: "${d.english}"`
    ).join('\n');
    physicalDescContext = `
BIBLICAL PASSAGES DESCRIBING ${name.toUpperCase()}'S PHYSICAL APPEARANCE:
${descLines}

Use these passages to inform the "description" field. Only include traits that describe the PERSON's body — face, hair, skin, build, age, bearing. Do NOT include objects, props, or items they carry.
`;
  }

  // Read example for structure
  const examplePath = join(ROOT, 'data/poses/figures/moses.json');
  let example = null;
  if (existsSync(examplePath)) {
    example = JSON.parse(readFileSync(examplePath, 'utf-8'));
  }

  const prompt = `Generate a pose data file for the biblical figure: ${name}

This is for a collectible card art series pairing NBA players with biblical figures. I need 4-6 signature poses based on their actual biblical story.
${descriptionContext}
Here are REAL biblical passages about ${name} from Sefaria:
${contextLines}
${physicalDescContext}
IMPORTANT — PHYSICAL DESCRIPTION vs ATTRIBUTE vs POSE PROPS:
The "description" field must ONLY contain physical traits of the person's BODY:
  - YES: skin tone, hair color/texture, eye color, build, age, height, bearing, facial features
  - NO: objects (staff, pitcher, sword, lyre, harp), clothing, jewelry, headwear, character traits, spiritual descriptions
  - Reference biblical text and traditional Jewish/Christian art depictions for accuracy
  - Example GOOD: "Fair-skinned young woman with striking beauty, dark eyes, graceful bearing"
  - Example GOOD: "Ruddy-complexioned young man, strong athletic build, dark hair, bright beautiful eyes"
  - Example BAD: "Beautiful woman carrying a water pitcher on her shoulder"
  - Example BAD: "Young shepherd with a lyre, a man after God's own heart"
  - The description should read like a casting director's physical description — ONLY what the person looks like physically

The "attribute" field is for their SIGNATURE OBJECT (staff, sword, harp, pitcher, etc.)
The "clothing" field is for their garments and adornments.
Individual pose "prompt" fields CAN include props, items, and scene-specific objects — that's where a water pitcher, staff, weapon, etc. belongs.

${example ? `Here's an example of the format (Moses's file):
${JSON.stringify(example, null, 2)}` : ''}

Return a JSON object with this exact structure:
{
  "id": "${id}",
  "name": "${name}",
  "defaultPose": "most-iconic-pose-id",
  "description": "PHYSICAL BODY TRAITS ONLY - face, hair, skin, build, eyes, bearing. NO objects or clothing.",
  "attribute": "their signature item (staff, sword, pitcher, harp, etc.)",
  "attributeDescription": "detailed description of the attribute",
  "visualStyle": "brief visual style and archetype description",
  "clothing": "period-accurate clothing description",
  "poses": {
    "pose-id": {
      "id": "pose-id",
      "name": "Pose Display Name",
      "description": "What the pose depicts",
      "expression": "facial expression",
      "prompt": "detailed visual description for image generation - body position, clothing, items held, setting cues. Props and scene-specific objects go HERE.",
      "energy": "2-4 words describing the vibe",
      "quoteId": "matching-quote-id"
    }
  }
}

Make poses specific to ${name}'s actual biblical moments from the passages above. The quoteId should be a kebab-case identifier for the most relevant quote to that pose.`;

  try {
    return await callGemini(prompt);
  } catch (e) {
    console.warn(`[Research] Enhanced figure pose generation failed, trying standard:`, e.message);
    return await generateFigurePoseFile(name, id);
  }
}

/**
 * Build quotes data from Sefaria's real Hebrew text, enriched by Gemini for mood/context.
 */
async function buildQuotesFromSefaria(name, id, sefariaData) {
  // Ask Gemini to enrich the real Sefaria quotes with mood and context descriptions
  const quotesForEnrichment = sefariaData.quotes.slice(0, 6).map(q => ({
    source: q.source,
    hebrew: q.hebrew,
    english: q.english
  }));

  try {
    const enriched = await callGemini(`I have real biblical quotes for ${name} from Sefaria. Add context and mood to each.

Quotes:
${JSON.stringify(quotesForEnrichment, null, 2)}

Return a JSON object:
{
  "id": "${id}",
  "name": "${name}",
  "aliases": ["other names for ${name} in Jewish tradition"],
  "quotes": {
    "kebab-case-quote-id": {
      "source": "keep the exact source reference",
      "context": "1 sentence: what was happening when this was said/occurred",
      "hebrew": "keep the exact Hebrew text from input",
      "english": "keep the exact English text from input",
      "mood": "2-4 words describing emotional tone"
    }
  }
}

IMPORTANT: Keep the hebrew and english text EXACTLY as provided - do not modify or re-translate them. Only add the context, mood, and quote IDs. Generate descriptive kebab-case quote IDs based on the content.`);

    return enriched;
  } catch (e) {
    console.warn('[Research] Quote enrichment failed, building basic quotes:', e.message);

    // Build basic quotes directly from Sefaria data
    const quotes = {};
    sefariaData.quotes.slice(0, 6).forEach((q, i) => {
      const qId = `quote-${i + 1}`;
      quotes[qId] = {
        source: q.source,
        context: '',
        hebrew: q.hebrew,
        english: q.english,
        mood: ''
      };
    });

    return {
      id,
      name,
      aliases: [],
      quotes
    };
  }
}

/**
 * Save a new character and pose file
 * POST /api/characters/save
 */
app.post('/api/characters/save', (req, res) => {
  const { type, character, poses, quotes } = req.body;

  if (!type || !character || !poses) {
    return res.status(400).json({ error: 'Type, character, and poses are required' });
  }

  if (!['player', 'figure'].includes(type)) {
    return res.status(400).json({ error: 'Type must be "player" or "figure"' });
  }

  if (!character.id || !character.name) {
    return res.status(400).json({ error: 'Character must have id and name' });
  }

  try {
    const typeDir = type === 'player' ? 'players' : 'figures';

    // Ensure directories exist
    const characterDir = join(ROOT, 'data/characters', typeDir);
    const poseDir = join(ROOT, 'data/poses', typeDir);

    if (!existsSync(characterDir)) {
      mkdirSync(characterDir, { recursive: true });
    }
    if (!existsSync(poseDir)) {
      mkdirSync(poseDir, { recursive: true });
    }

    // Write character file
    const characterPath = join(characterDir, `${character.id}.json`);
    writeFileSync(characterPath, JSON.stringify(character, null, 2));

    // Write pose file
    const poseData = {
      id: character.id,
      name: character.name,
      defaultPose: poses.defaultPose || Object.keys(poses.poses)[0],
      description: character.physicalDescription,
      poses: poses.poses
    };

    const posePath = join(poseDir, `${character.id}.json`);
    writeFileSync(posePath, JSON.stringify(poseData, null, 2));

    console.log(`Saved character: ${character.name} (${type})`);
    console.log(`  Character file: ${characterPath}`);
    console.log(`  Pose file: ${posePath}`);

    // Write quotes file for biblical figures
    let quotesPath = null;
    if (type === 'figure' && quotes && quotes.quotes && Object.keys(quotes.quotes).length > 0) {
      const quotesDir = join(ROOT, 'data/quotes/figures');
      if (!existsSync(quotesDir)) {
        mkdirSync(quotesDir, { recursive: true });
      }
      quotesPath = join(quotesDir, `${character.id}.json`);
      writeFileSync(quotesPath, JSON.stringify(quotes, null, 2));
      console.log(`  Quotes file: ${quotesPath}`);
    }

    res.json({
      success: true,
      characterPath,
      posePath,
      quotesPath
    });

  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: err.message || 'Save failed' });
  }
});

/**
 * Get a single character with poses
 * GET /api/characters/:type/:id
 */
app.get('/api/characters/:type/:id', (req, res) => {
  const { type, id } = req.params;

  if (!['player', 'figure'].includes(type)) {
    return res.status(400).json({ error: 'Type must be "player" or "figure"' });
  }

  try {
    const typeDir = type === 'player' ? 'players' : 'figures';

    // Try standalone character file first
    let character = null;
    const standaloneCharPath = join(ROOT, 'data/characters', typeDir, `${id}.json`);

    if (existsSync(standaloneCharPath)) {
      character = JSON.parse(readFileSync(standaloneCharPath, 'utf-8'));
    } else {
      // Try to find in pairings
      const pairingsDir = join(ROOT, 'data/series/court-covenant/pairings');
      if (existsSync(pairingsDir)) {
        const pairingFiles = readdirSync(pairingsDir).filter(f => f.endsWith('.json'));
        for (const file of pairingFiles) {
          const pairing = JSON.parse(readFileSync(join(pairingsDir, file), 'utf-8'));
          const charKey = type === 'player' ? 'player' : 'figure';
          if (pairing[charKey]?.poseFileId === id || pairing[charKey]?.id === id) {
            character = pairing[charKey];
            break;
          }
        }
      }
    }

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Load poses
    let poses = {};
    const posePath = join(ROOT, 'data/poses', typeDir, `${id}.json`);
    if (existsSync(posePath)) {
      const poseData = JSON.parse(readFileSync(posePath, 'utf-8'));
      poses = poseData.poses || {};
    }

    res.json({ character, poses });

  } catch (err) {
    console.error('Get character error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update an existing character
 * PUT /api/characters/:type/:id
 */
app.put('/api/characters/:type/:id', (req, res) => {
  const { type, id } = req.params;
  const { character, poses } = req.body;

  if (!['player', 'figure'].includes(type)) {
    return res.status(400).json({ error: 'Type must be "player" or "figure"' });
  }

  try {
    const typeDir = type === 'player' ? 'players' : 'figures';

    // Update character file
    const characterDir = join(ROOT, 'data/characters', typeDir);
    if (!existsSync(characterDir)) {
      mkdirSync(characterDir, { recursive: true });
    }

    const characterPath = join(characterDir, `${id}.json`);
    writeFileSync(characterPath, JSON.stringify(character, null, 2));

    // Update pose file
    if (poses) {
      const poseDir = join(ROOT, 'data/poses', typeDir);
      if (!existsSync(poseDir)) {
        mkdirSync(poseDir, { recursive: true });
      }

      const poseData = {
        id: character.id,
        name: character.name,
        defaultPose: poses.defaultPose || Object.keys(poses.poses)[0],
        description: character.physicalDescription,
        poses: poses.poses
      };

      const posePath = join(poseDir, `${id}.json`);
      writeFileSync(posePath, JSON.stringify(poseData, null, 2));
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Delete a character
 * DELETE /api/characters/:type/:id
 */
app.delete('/api/characters/:type/:id', (req, res) => {
  const { type, id } = req.params;

  if (!['player', 'figure'].includes(type)) {
    return res.status(400).json({ error: 'Type must be "player" or "figure"' });
  }

  try {
    const typeDir = type === 'player' ? 'players' : 'figures';

    // Delete character file
    const characterPath = join(ROOT, 'data/characters', typeDir, `${id}.json`);
    if (existsSync(characterPath)) {
      unlinkSync(characterPath);
    }

    // Delete pose file
    const posePath = join(ROOT, 'data/poses', typeDir, `${id}.json`);
    if (existsSync(posePath)) {
      unlinkSync(posePath);
    }

    console.log(`Deleted character: ${id} (${type})`);

    res.json({ success: true });

  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Pairing Creation Assistant Endpoints
// ============================================================

/**
 * GET /api/pairing-assistant/characters
 * List all characters with their pairing status
 */
app.get('/api/pairing-assistant/characters', (req, res) => {
  try {
    const index = pairingAssistant.buildCharacterIndex();
    res.json(index);
  } catch (err) {
    console.error('Character index error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pairing-assistant/unused
 * List characters with pose files but no pairings
 */
app.get('/api/pairing-assistant/unused', (req, res) => {
  try {
    const unused = pairingAssistant.getUnusedCharacters();
    res.json(unused);
  } catch (err) {
    console.error('Unused characters error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pairing-assistant/suggest
 * Get AI-powered pairing suggestions based on mode
 */
app.post('/api/pairing-assistant/suggest', async (req, res) => {
  const { mode, player, figure, connection, hero, villain, rivalryType } = req.body;

  if (!mode) {
    return res.status(400).json({ error: 'Missing required field: mode' });
  }

  // Validate mode-specific requirements
  if (mode === 'full-pairing' && (!player || !figure)) {
    return res.status(400).json({ error: 'Full pairing mode requires both player and figure' });
  }
  if (mode === 'find-figure' && !player) {
    return res.status(400).json({ error: 'Find figure mode requires a player' });
  }
  if (mode === 'find-player' && !figure) {
    return res.status(400).json({ error: 'Find player mode requires a figure' });
  }

  try {
    // For rivalry mode, pass hero/villain as player/figure and include options
    const effectivePlayer = mode === 'rivalry' ? (hero || player) : player;
    const effectiveFigure = mode === 'rivalry' ? (villain || figure) : figure;
    const options = mode === 'rivalry' ? { rivalryType: rivalryType || 'player-figure' } : {};

    const suggestions = await pairingAssistant.generateSuggestions(mode, effectivePlayer, effectiveFigure, connection, options);
    res.json({ suggestions });
  } catch (err) {
    console.error('Suggestion error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pairing-assistant/create
 * Auto-generate all required files for a new pairing
 */
app.post('/api/pairing-assistant/create', async (req, res) => {
  const { player, figure, connection, type, opposingPairing, cardMode, rivalryConfig } = req.body;

  if (!player || !figure) {
    return res.status(400).json({ error: 'Missing required fields: player and figure' });
  }

  try {
    const result = await pairingAssistant.createPairingFiles({
      player,
      figure,
      connection,
      type,
      opposingPairing,
      cardMode,
      rivalryConfig
    });
    res.json(result);
  } catch (err) {
    console.error('Pairing creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// WEBSITE SELECTS ENDPOINTS
// ========================================

const WEBSITE_SELECTS_PATH = join(__dirname, 'data/website-selects.json');
const EXPORT_HISTORY_PATH = join(__dirname, 'data/export-history.json');

/**
 * Load website selects
 */
function loadWebsiteSelects() {
  if (existsSync(WEBSITE_SELECTS_PATH)) {
    return JSON.parse(readFileSync(WEBSITE_SELECTS_PATH, 'utf-8'));
  }
  return { lastUpdated: null, cards: [] };
}

/**
 * Save website selects
 */
function saveWebsiteSelects(data) {
  data.lastUpdated = new Date().toISOString();
  writeFileSync(WEBSITE_SELECTS_PATH, JSON.stringify(data, null, 2));
}

/**
 * Load export history
 */
function loadExportHistory() {
  if (existsSync(EXPORT_HISTORY_PATH)) {
    return JSON.parse(readFileSync(EXPORT_HISTORY_PATH, 'utf-8'));
  }
  return { exports: [] };
}

/**
 * Save export history
 */
function saveExportHistory(data) {
  writeFileSync(EXPORT_HISTORY_PATH, JSON.stringify(data, null, 2));
}

/**
 * GET /api/selects
 * Get all website selects (ordered)
 */
app.get('/api/selects', (req, res) => {
  try {
    const selects = loadWebsiteSelects();
    res.json(selects);
  } catch (err) {
    console.error('Load selects error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/selects
 * Add a card to website selects
 */
app.post('/api/selects', (req, res) => {
  const { cardId, notes } = req.body;

  if (!cardId) {
    return res.status(400).json({ error: 'Missing required field: cardId' });
  }

  try {
    const selects = loadWebsiteSelects();

    // Check if already selected
    if (selects.cards.some(c => c.cardId === cardId)) {
      return res.status(400).json({ error: 'Card already selected for website' });
    }

    // Check max limit (soft limit of 25)
    if (selects.cards.length >= 25) {
      return res.status(400).json({ error: 'Maximum 25 cards can be selected' });
    }

    // Add to end of list
    selects.cards.push({
      cardId,
      position: selects.cards.length + 1,
      addedAt: new Date().toISOString(),
      notes: notes || ''
    });

    saveWebsiteSelects(selects);
    res.json({ success: true, selects });
  } catch (err) {
    console.error('Add select error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/selects/:cardId
 * Remove a card from website selects
 */
app.delete('/api/selects/:cardId', (req, res) => {
  const { cardId } = req.params;

  try {
    const selects = loadWebsiteSelects();
    const index = selects.cards.findIndex(c => c.cardId === cardId);

    if (index === -1) {
      return res.status(404).json({ error: 'Card not in selects' });
    }

    selects.cards.splice(index, 1);

    // Recalculate positions
    selects.cards.forEach((card, i) => {
      card.position = i + 1;
    });

    saveWebsiteSelects(selects);
    res.json({ success: true, selects });
  } catch (err) {
    console.error('Remove select error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/selects/reorder
 * Reorder website selects (after drag-drop)
 */
app.put('/api/selects/reorder', (req, res) => {
  const { cardIds } = req.body;

  if (!Array.isArray(cardIds)) {
    return res.status(400).json({ error: 'cardIds must be an array' });
  }

  try {
    const selects = loadWebsiteSelects();

    // Create a map of existing cards
    const cardMap = new Map(selects.cards.map(c => [c.cardId, c]));

    // Rebuild cards array in new order
    const newCards = [];
    cardIds.forEach((cardId, index) => {
      const card = cardMap.get(cardId);
      if (card) {
        card.position = index + 1;
        newCards.push(card);
      }
    });

    selects.cards = newCards;
    saveWebsiteSelects(selects);
    res.json({ success: true, selects });
  } catch (err) {
    console.error('Reorder selects error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/selects/export
 * Export selected cards to web/js/data.js
 */
app.post('/api/selects/export', (req, res) => {
  try {
    const selects = loadWebsiteSelects();
    const manifest = buildManifest();
    const feedback = loadFeedback();

    if (selects.cards.length === 0) {
      return res.status(400).json({ error: 'No cards selected for export' });
    }

    // Build card data for website
    const pairingData = loadPairingDataForExport();
    const exportCards = [];
    for (const select of selects.cards) {
      const card = manifest.cards.find(c => c.id === select.cardId);
      if (!card) continue;

      // Get pairing data
      let playerName, figureName, connection, type;
      if (card.mode === 'solo') {
        playerName = card.characterType === 'player' ? formatCharacterNameForExport(card.characterId) : null;
        figureName = card.characterType === 'figure' ? formatCharacterNameForExport(card.characterId) : null;
        connection = 'Solo card';
        type = 'solo';
      } else {
        const pairing = pairingData[card.pairingId];
        if (pairing) {
          playerName = pairing.playerName;
          figureName = pairing.figureName;
          connection = pairing.connection || '';
          type = pairing.type || 'hero';
        }
      }

      exportCards.push({
        id: card.id,
        position: select.position,
        imagePath: card.path,
        template: card.template,
        playerName,
        figureName,
        connection,
        type,
        notes: select.notes
      });
    }

    // Sort by position
    exportCards.sort((a, b) => a.position - b.position);

    // Generate data.js content
    const dataJs = `// Court & Covenant - Card Data
// Auto-generated ${new Date().toISOString()}
// Do not edit manually

const CARDS = ${JSON.stringify(exportCards, null, 2)};

export { CARDS };
`;

    // Ensure web/js directory exists
    const webJsDir = join(ROOT, 'web/js');
    if (!existsSync(webJsDir)) {
      mkdirSync(webJsDir, { recursive: true });
    }

    // Write data.js
    writeFileSync(WEB_DATA_PATH, dataJs);

    // Log to export history
    const history = loadExportHistory();
    history.exports.push({
      id: `export-${Date.now()}`,
      type: 'website',
      cardCount: exportCards.length,
      exportedAt: new Date().toISOString(),
      success: true
    });
    saveExportHistory(history);

    res.json({
      success: true,
      cardCount: exportCards.length,
      outputPath: WEB_DATA_PATH
    });
  } catch (err) {
    console.error('Export selects error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper for export
function formatCharacterNameForExport(characterId) {
  if (!characterId) return 'Unknown';
  return characterId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Load pairing data for selects export
function loadPairingDataForExport() {
  const pairingsDir = join(ROOT, 'data/series/court-covenant/pairings');
  const pairings = {};

  if (existsSync(pairingsDir)) {
    const files = readdirSync(pairingsDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(readFileSync(join(pairingsDir, file), 'utf-8'));
        pairings[data.id] = {
          playerName: data.player?.name || data.player,
          figureName: data.figure?.name || data.figure,
          connection: data.connection?.narrative || data.connection,
          type: data.type || 'hero'
        };
      } catch (e) {
        // Skip invalid files
      }
    }
  }

  return pairings;
}

/**
 * GET /api/export-history
 * Get export history
 */
app.get('/api/export-history', (req, res) => {
  try {
    const history = loadExportHistory();
    res.json(history);
  } catch (err) {
    console.error('Load export history error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`\n🏀 Court & Covenant Card Visualizer`);
  console.log(`   http://localhost:${PORT}\n`);

  // Build initial manifest
  const manifest = buildManifest();
  console.log(`   ${manifest.totalCards} cards indexed`);
  console.log(`   ${manifest.pairings.length} pairings`);
  console.log(`   ${manifest.templates.length} templates\n`);
});
