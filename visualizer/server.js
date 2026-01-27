import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

// Import lib modules
import imageProcessor from './lib/image-processor.js';
import captionGenerator from './lib/caption-generator.js';
import bufferClient from './lib/buffer-client.js';

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
 */
function buildManifest() {
  const cardsDir = join(ROOT, 'output/cards');
  const cards = [];

  if (!existsSync(cardsDir)) {
    return { cards: [], pairings: [], templates: [], generated: new Date().toISOString() };
  }

  const pairingDirs = readdirSync(cardsDir).filter(f => {
    const stat = statSync(join(cardsDir, f));
    return stat.isDirectory();
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
      });
    }
  }

  // Sort by timestamp descending (newest first)
  cards.sort((a, b) => b.isoTimestamp.localeCompare(a.isoTimestamp));

  // Extract unique pairings and templates
  const pairings = [...new Set(cards.map(c => c.pairingId))].sort();
  const templates = [...new Set(cards.map(c => c.template))].sort();
  const interactions = [...new Set(cards.map(c => c.interaction))].sort();

  const manifest = {
    cards,
    pairings,
    templates,
    interactions,
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
