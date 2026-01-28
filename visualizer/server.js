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
import pairingAssistant from './lib/pairing-assistant.js';

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

/**
 * Scan output directory and build manifest
 * Includes both pairing cards and solo cards
 */
function buildManifest() {
  const cardsDir = join(ROOT, 'output/cards');
  const cards = [];

  if (!existsSync(cardsDir)) {
    return { cards: [], pairings: [], templates: [], soloCharacters: [], generated: new Date().toISOString() };
  }

  // Scan pairing cards (exclude solo directories)
  const pairingDirs = readdirSync(cardsDir).filter(f => {
    const stat = statSync(join(cardsDir, f));
    // Exclude 'solo' directory and any 'solo-*' directories
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

      const [, template, timestamp, ext] = match;
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

      const stat = statSync(join(pairingDir, file));

      cards.push({
        id: `${pairingId}-${template}-${timestamp}`,
        pairingId,
        template,
        timestamp: timestamp.replace(/-/g, ':').replace('T', ' ').slice(0, 19),
        isoTimestamp: timestamp,
        interaction,
        filename: file,
        path: `/cards/${pairingId}/${file}`,
        promptPath: existsSync(promptPath) ? `/cards/${pairingId}/${promptFile}` : null,
        prompt,
        size: stat.size,
        mode: 'pairing'
      });
    }
  }

  // Scan solo cards (directories named solo-player-* or solo-figure-*)
  const soloCharacters = [];
  const soloDirs = readdirSync(cardsDir).filter(f => {
    if (!f.startsWith('solo-')) return false;
    const stat = statSync(join(cardsDir, f));
    return stat.isDirectory();
  });

  for (const soloDir of soloDirs) {
    // Parse directory name: solo-player-{id} or solo-figure-{id}
    const soloMatch = soloDir.match(/^solo-(player|figure)-(.+)$/);
    if (!soloMatch) continue;

    const [, characterType, characterId] = soloMatch;
    const characterDir = join(cardsDir, soloDir);

    const files = readdirSync(characterDir).filter(f =>
      f.endsWith('.png') || f.endsWith('.jpeg') || f.endsWith('.jpg')
    );

    if (files.length > 0) {
      // Track unique solo characters
      if (!soloCharacters.some(c => c.type === characterType && c.id === characterId)) {
        soloCharacters.push({ type: characterType, id: characterId });
      }
    }

    for (const file of files) {
      const match = file.match(/^(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.(png|jpe?g)$/);
      if (!match) continue;

      const [, template, timestamp] = match;
      const promptFile = file.replace(/\.(png|jpe?g)$/, '-prompt.txt');
      const promptPath = join(characterDir, promptFile);

      let prompt = '';
      if (existsSync(promptPath)) {
        prompt = readFileSync(promptPath, 'utf-8');
      }

      const stat = statSync(join(characterDir, file));

      cards.push({
        id: `solo-${characterType}-${characterId}-${template}-${timestamp}`,
        characterId,
        characterType,
        template,
        timestamp: timestamp.replace(/-/g, ':').replace('T', ' ').slice(0, 19),
        isoTimestamp: timestamp,
        filename: file,
        path: `/cards/${soloDir}/${file}`,
        promptPath: existsSync(promptPath) ? `/cards/${soloDir}/${promptFile}` : null,
        prompt,
        size: stat.size,
        mode: 'solo'
      });
    }
  }

  // Sort by timestamp descending (newest first)
  cards.sort((a, b) => b.isoTimestamp.localeCompare(a.isoTimestamp));

  // Extract unique pairings and templates
  const pairings = [...new Set(cards.filter(c => c.pairingId).map(c => c.pairingId))].sort();
  const templates = [...new Set(cards.map(c => c.template))].sort();
  const interactions = [...new Set(cards.filter(c => c.interaction).map(c => c.interaction))].sort();

  const manifest = {
    cards,
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
  delete feedback[cardId];
  saveFeedback(feedback);
  res.json({ success: true });
});

// Get pairing data (summary)
app.get('/api/pairings', (req, res) => {
  const pairingsDir = join(ROOT, 'data/series/court-covenant/pairings');
  const pairings = {};

  if (existsSync(pairingsDir)) {
    const files = readdirSync(pairingsDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const data = JSON.parse(readFileSync(join(pairingsDir, file), 'utf-8'));
      pairings[data.id] = {
        id: data.id,
        playerName: data.player.name,
        figureName: data.figure.name,
        figureDisplayName: data.figure.displayName,
        era: data.player.era,
        connection: data.connection.narrative
      };
    }
  }

  res.json(pairings);
});

// Get full pairing data (all details)
app.get('/api/pairings-full', (req, res) => {
  const pairingsDir = join(ROOT, 'data/series/court-covenant/pairings');
  const pairings = {};

  if (existsSync(pairingsDir)) {
    const files = readdirSync(pairingsDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const data = JSON.parse(readFileSync(join(pairingsDir, file), 'utf-8'));
      pairings[data.id] = data;
    }
  }

  res.json(pairings);
});

// Add custom interaction to a pairing
app.post('/api/pairings/:pairingId/interactions', (req, res) => {
  const { pairingId } = req.params;
  const pairingPath = join(ROOT, 'data/series/court-covenant/pairings', `${pairingId}.json`);

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
    // Generate character ID from name
    const id = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Build character data based on type
    let character, poses;

    if (type === 'player') {
      character = await researchPlayer(name, id);
      poses = await generatePlayerPoses(name, character);
    } else {
      character = await researchFigure(name, id);
      poses = await generateFigurePoses(name, character);
    }

    res.json({ character, poses });

  } catch (err) {
    console.error('Research error:', err);
    res.status(500).json({ error: err.message || 'Research failed' });
  }
});

/**
 * Research an NBA player using web search
 */
async function researchPlayer(name, id) {
  // For now, generate sensible defaults that user can edit
  // In a full implementation, this would use web search APIs

  const character = {
    id,
    name,
    displayName: '',
    poseFileId: id,
    era: '2000s',
    jerseyColors: {
      primary: { base: 'blue', accent: 'white' },
      secondary: { base: 'white', accent: 'blue' }
    },
    physicalDescription: `Professional basketball player, athletic build`,
    archetype: `${name} - NBA player`
  };

  // Try to determine era from common knowledge
  const eraHints = {
    'wilt': '1970s', 'kareem': '1970s', 'dr j': '1970s', 'julius erving': '1970s',
    'magic': '1980s', 'bird': '1980s', 'isiah': '1980s',
    'jordan': '1990s', 'pippen': '1990s', 'barkley': '1990s', 'stockton': '1990s', 'malone': '1990s', 'shaq': '1990s', 'rodman': '1990s',
    'kobe': '2000s', 'iverson': '2000s', 'duncan': '2000s', 'garnett': '2000s',
    'lebron': '2010s', 'curry': '2010s', 'durant': '2010s', 'westbrook': '2010s',
    'jokic': '2020s', 'giannis': '2020s', 'luka': '2020s', 'sga': '2020s', 'tatum': '2020s'
  };

  const nameLower = name.toLowerCase();
  for (const [hint, era] of Object.entries(eraHints)) {
    if (nameLower.includes(hint)) {
      character.era = era;
      break;
    }
  }

  return character;
}

/**
 * Research a biblical figure using Sefaria/web search
 */
async function researchFigure(name, id) {
  const character = {
    id,
    name,
    displayName: name,
    poseFileId: id,
    era: 'biblical',
    clothing: 'robes and sandals, period-accurate biblical attire',
    physicalDescription: `Biblical figure, dignified bearing`,
    archetype: `${name} - biblical figure`
  };

  return character;
}

/**
 * Generate default poses for a player
 */
async function generatePlayerPoses(name, character) {
  // Generate common basketball poses that user can customize
  const poses = {
    'signature-move': {
      id: 'signature-move',
      name: 'Signature Move',
      description: `${name}'s signature basketball move`,
      expression: 'focused intensity',
      prompt: `executing signature basketball move - athletic form, focused expression, powerful body control`,
      energy: 'dominant, skilled'
    },
    'celebration': {
      id: 'celebration',
      name: 'Victory Celebration',
      description: 'Celebrating a big moment',
      expression: 'joy, triumph',
      prompt: `celebrating victory - fist pump or arms raised, expression of pure joy, the moment of triumph`,
      energy: 'triumphant, electric'
    },
    'defensive-stance': {
      id: 'defensive-stance',
      name: 'Defensive Stance',
      description: 'Low defensive position',
      expression: 'intense focus',
      prompt: `in low defensive stance - knees bent, arms wide, eyes locked on opponent, ready to react`,
      energy: 'intense, lockdown'
    },
    'dunk': {
      id: 'dunk',
      name: 'Powerful Dunk',
      description: 'Rising for a powerful dunk',
      expression: 'fierce determination',
      prompt: `rising for powerful one-handed dunk - body elevated, arm cocked back, eyes on rim, athletic explosion`,
      energy: 'explosive, powerful'
    }
  };

  return {
    poses,
    defaultPose: 'signature-move'
  };
}

/**
 * Generate default poses for a biblical figure
 */
async function generateFigurePoses(name, character) {
  const poses = {
    'iconic-moment': {
      id: 'iconic-moment',
      name: 'Iconic Moment',
      description: `${name}'s most famous biblical moment`,
      expression: 'divine authority',
      prompt: `in moment of greatest significance - dignified pose, period-accurate clothing, powerful presence`,
      energy: 'powerful, iconic'
    },
    'commanding-presence': {
      id: 'commanding-presence',
      name: 'Commanding Presence',
      description: 'Standing with authority',
      expression: 'confident authority',
      prompt: `standing with commanding presence - robes flowing, dignified bearing, the weight of destiny`,
      energy: 'authoritative, majestic'
    },
    'contemplation': {
      id: 'contemplation',
      name: 'Contemplation',
      description: 'Deep in thought or prayer',
      expression: 'thoughtful, reverent',
      prompt: `in moment of contemplation - head slightly bowed or gazing upward, hands folded or raised, spiritual connection`,
      energy: 'reverent, peaceful'
    }
  };

  return {
    poses,
    defaultPose: 'iconic-moment'
  };
}

/**
 * Save a new character and pose file
 * POST /api/characters/save
 */
app.post('/api/characters/save', (req, res) => {
  const { type, character, poses } = req.body;

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

    res.json({
      success: true,
      characterPath,
      posePath
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
  const { mode, player, figure, connection } = req.body;

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
    const suggestions = await pairingAssistant.generateSuggestions(mode, player, figure, connection);
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
  const { player, figure, connection, type, opposingPairing } = req.body;

  if (!player || !figure) {
    return res.status(400).json({ error: 'Missing required fields: player and figure' });
  }

  try {
    const result = await pairingAssistant.createPairingFiles({
      player,
      figure,
      connection,
      type,
      opposingPairing
    });
    res.json(result);
  } catch (err) {
    console.error('Pairing creation error:', err);
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
