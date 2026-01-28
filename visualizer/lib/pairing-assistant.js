/**
 * Pairing Creation Assistant
 * AI-powered pairing suggestions and auto-generation of pairing files.
 *
 * Uses Gemini 2.0 Flash for text suggestions.
 * Scans existing pairings/poses/quotes to build character index dynamically.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../..');

// Data directories
const PAIRINGS_DIR = join(ROOT, 'data/series/court-covenant/pairings');
const POSES_PLAYERS_DIR = join(ROOT, 'data/poses/players');
const POSES_FIGURES_DIR = join(ROOT, 'data/poses/figures');
const QUOTES_DIR = join(ROOT, 'data/quotes/figures');
const CHARACTERS_PLAYERS_DIR = join(ROOT, 'data/characters/players');
const CHARACTERS_FIGURES_DIR = join(ROOT, 'data/characters/figures');

// Gemini client (lazy-initialized)
let genaiClient = null;
const TEXT_MODEL = 'gemini-2.0-flash';

/**
 * Initialize the Gemini AI client lazily.
 * Returns null if GEMINI_API_KEY is not set.
 */
async function getGenaiClient() {
  if (genaiClient) return genaiClient;

  // Load dotenv from root
  try {
    const dotenv = await import('dotenv');
    dotenv.config({ path: join(ROOT, '.env') });
  } catch (e) {
    // dotenv not available, rely on process.env
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const { GoogleGenAI } = await import('@google/genai');
    genaiClient = new GoogleGenAI({ apiKey });
    return genaiClient;
  } catch (e) {
    console.error('Failed to initialize Gemini client:', e.message);
    return null;
  }
}

/**
 * Strip trailing commas from JSON strings.
 * Gemini often produces trailing commas before } or ] which are invalid JSON.
 */
function cleanJsonString(str) {
  return str.replace(/,\s*([\]}])/g, '$1');
}

/**
 * Try multiple strategies to parse a JSON string.
 */
function robustJsonParse(str) {
  // 1. Direct parse
  try { return JSON.parse(str); } catch (_) {}

  // 2. Clean trailing commas and try again
  const cleaned = cleanJsonString(str);
  try { return JSON.parse(cleaned); } catch (_) {}

  // 3. Extract JSON array or object and retry with cleaning
  const arrayMatch = str.match(/\[[\s\S]*\]/);
  const objectMatch = str.match(/\{[\s\S]*\}/);
  const extracted = arrayMatch?.[0] || objectMatch?.[0];
  if (extracted) {
    try { return JSON.parse(cleanJsonString(extracted)); } catch (_) {}
  }

  return null;
}

/**
 * Call Gemini for a text completion and parse JSON from the response.
 */
async function callGemini(prompt) {
  const ai = await getGenaiClient();
  if (!ai) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env');
  }

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json'
    }
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No text response from Gemini');
  }

  // Strip markdown fences if present (shouldn't happen with JSON mode, but just in case)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = (jsonMatch ? jsonMatch[1] : text).trim();

  const parsed = robustJsonParse(jsonStr);
  if (parsed !== null) {
    return parsed;
  }

  throw new Error(`Failed to parse Gemini response as JSON: ${text.slice(0, 300)}`);
}

// ============================================================
// Character Index
// ============================================================

/**
 * Build a character index by scanning all pairing files.
 * Returns { players: {...}, figures: {...} } mapping each character
 * to their pairings and metadata.
 */
export function buildCharacterIndex() {
  const players = {};
  const figures = {};

  if (!existsSync(PAIRINGS_DIR)) {
    return { players, figures };
  }

  const files = readdirSync(PAIRINGS_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    try {
      const pairing = JSON.parse(readFileSync(join(PAIRINGS_DIR, file), 'utf-8'));
      const pairingId = pairing.id;

      // Index player
      const playerKey = pairing.player.poseFileId || pairing.player.name.toLowerCase().replace(/\s+/g, '-');
      if (!players[playerKey]) {
        players[playerKey] = {
          name: pairing.player.name,
          displayName: pairing.player.displayName || pairing.player.name,
          era: pairing.player.era,
          pairings: [],
          primaryPairing: null
        };
      }
      players[playerKey].pairings.push(pairingId);
      // First pairing encountered (or non-alternate) becomes primary
      if (!players[playerKey].primaryPairing || !pairing.isAlternate) {
        players[playerKey].primaryPairing = pairingId;
      }

      // Index figure
      const figureKey = pairing.figure.poseFileId || pairing.figure.name.toLowerCase().replace(/\s+/g, '-');
      if (!figures[figureKey]) {
        figures[figureKey] = {
          name: pairing.figure.name,
          displayName: pairing.figure.displayName || pairing.figure.name,
          pairings: [],
          primaryPairing: null,
          opposingFigures: []
        };
      }
      figures[figureKey].pairings.push(pairingId);
      if (!figures[figureKey].primaryPairing || !pairing.isAlternate) {
        figures[figureKey].primaryPairing = pairingId;
      }

      // Track opposing relationships
      if (pairing.opposingPairing) {
        // Find the opposing pairing's figure
        const opposingPath = join(PAIRINGS_DIR, `${pairing.opposingPairing}.json`);
        if (existsSync(opposingPath)) {
          try {
            const opposingData = JSON.parse(readFileSync(opposingPath, 'utf-8'));
            const opposingFigureKey = opposingData.figure.poseFileId;
            if (opposingFigureKey && !figures[figureKey].opposingFigures.includes(opposingFigureKey)) {
              figures[figureKey].opposingFigures.push(opposingFigureKey);
            }
          } catch (e) { /* skip */ }
        }
      }
    } catch (e) {
      console.error(`Error reading pairing file ${file}:`, e.message);
    }
  }

  return { players, figures };
}

/**
 * Get characters that have pose files but aren't in any pairing.
 */
export function getUnusedCharacters() {
  const index = buildCharacterIndex();
  const unusedPlayers = [];
  const unusedFigures = [];

  // Check player pose files
  if (existsSync(POSES_PLAYERS_DIR)) {
    const poseFiles = readdirSync(POSES_PLAYERS_DIR).filter(f => f.endsWith('.json'));
    for (const file of poseFiles) {
      const id = file.replace('.json', '');
      if (!index.players[id]) {
        try {
          const data = JSON.parse(readFileSync(join(POSES_PLAYERS_DIR, file), 'utf-8'));
          unusedPlayers.push({ id, name: data.name, source: 'poses' });
        } catch (e) { /* skip */ }
      }
    }
  }

  // Check standalone player character files
  if (existsSync(CHARACTERS_PLAYERS_DIR)) {
    const charFiles = readdirSync(CHARACTERS_PLAYERS_DIR).filter(f => f.endsWith('.json'));
    for (const file of charFiles) {
      const id = file.replace('.json', '');
      if (!index.players[id] && !unusedPlayers.some(p => p.id === id)) {
        try {
          const data = JSON.parse(readFileSync(join(CHARACTERS_PLAYERS_DIR, file), 'utf-8'));
          unusedPlayers.push({ id, name: data.name, source: 'characters' });
        } catch (e) { /* skip */ }
      }
    }
  }

  // Check figure pose files
  if (existsSync(POSES_FIGURES_DIR)) {
    const poseFiles = readdirSync(POSES_FIGURES_DIR).filter(f => f.endsWith('.json'));
    for (const file of poseFiles) {
      const id = file.replace('.json', '');
      if (!index.figures[id]) {
        try {
          const data = JSON.parse(readFileSync(join(POSES_FIGURES_DIR, file), 'utf-8'));
          unusedFigures.push({ id, name: data.name, source: 'poses' });
        } catch (e) { /* skip */ }
      }
    }
  }

  // Check standalone figure character files
  if (existsSync(CHARACTERS_FIGURES_DIR)) {
    const charFiles = readdirSync(CHARACTERS_FIGURES_DIR).filter(f => f.endsWith('.json'));
    for (const file of charFiles) {
      const id = file.replace('.json', '');
      if (!index.figures[id] && !unusedFigures.some(f => f.id === id)) {
        try {
          const data = JSON.parse(readFileSync(join(CHARACTERS_FIGURES_DIR, file), 'utf-8'));
          unusedFigures.push({ id, name: data.name, source: 'characters' });
        } catch (e) { /* skip */ }
      }
    }
  }

  return { players: unusedPlayers, figures: unusedFigures };
}

// ============================================================
// AI Suggestion Engine
// ============================================================

/**
 * Build a summary of existing pairings for prompt context.
 */
function buildPairingsContext() {
  const heroes = [];
  const villains = [];

  if (!existsSync(PAIRINGS_DIR)) return { heroes, villains, all: [] };

  const files = readdirSync(PAIRINGS_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const p = JSON.parse(readFileSync(join(PAIRINGS_DIR, file), 'utf-8'));
      const entry = {
        id: p.id,
        player: p.player.name,
        figure: p.figure.name,
        connection: p.connection.thematic,
        type: p.type || 'hero'
      };
      if (entry.type === 'villain') {
        villains.push(entry);
      } else {
        heroes.push(entry);
      }
    } catch (e) { /* skip */ }
  }

  return { heroes, villains, all: [...heroes, ...villains] };
}

/**
 * Format pairings for prompt inclusion.
 */
function formatPairingsForPrompt(pairings) {
  return pairings.map(p =>
    `- ${p.player} + ${p.figure} (${p.type}): "${p.connection}"`
  ).join('\n');
}

/**
 * Generate suggestions based on mode.
 */
export async function generateSuggestions(mode, player, figure, connection) {
  const context = buildPairingsContext();
  const index = buildCharacterIndex();

  switch (mode) {
    case 'full-pairing':
      return suggestFullPairing(player, figure, connection, context, index);
    case 'find-figure':
      return suggestFiguresForPlayer(player, context, index);
    case 'find-player':
      return suggestPlayersForFigure(figure, context, index);
    case 'discover-heroes':
      return discoverHeroes(context, index);
    case 'discover-opposites':
      return discoverOpposites(context, index);
    default:
      throw new Error(`Unknown mode: ${mode}`);
  }
}

/**
 * Mode 1: Full Pairing - generate connection narratives for a given player + figure.
 */
async function suggestFullPairing(player, figure, connection, context, index) {
  const playerKey = player.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const figureKey = figure.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const playerAlreadyPaired = !!index.players[playerKey];
  const figureAlreadyPaired = !!index.figures[figureKey];

  const prompt = `You are helping create thematic pairings between NBA basketball players and biblical/Jewish historical figures for a collectible card art series called "Court & Covenant."

Given this player and figure, suggest 2-3 thematic connections.

Player: ${player}
Biblical Figure: ${figure}
${connection ? `User's suggested connection: ${connection}` : ''}

Existing pairings for context:
${formatPairingsForPrompt(context.all)}

For each suggestion provide:
1. A "thematic" connection (1 sentence, the core parallel)
2. A "narrative" tagline (1-2 punchy sentences, edgy and fun)
3. A "relationship" description (how they relate as a pair)
4. Whether this is a "hero" or "villain" pairing
5. If relevant, which existing pairing this might oppose (use the pairing ID like "wilt-samson")

Return as a JSON array of objects with fields: thematic, narrative, relationship, type, opposingPairing (null if none).`;

  const suggestions = await callGemini(prompt);
  const results = Array.isArray(suggestions) ? suggestions : [suggestions];

  return results.map(s => ({
    player,
    figure,
    connection: {
      thematic: s.thematic,
      narrative: s.narrative,
      relationship: s.relationship
    },
    type: s.type || 'hero',
    playerAlreadyPaired,
    figureAlreadyPaired,
    playerCurrentPairing: playerAlreadyPaired ? index.players[playerKey]?.primaryPairing : null,
    figureCurrentPairing: figureAlreadyPaired ? index.figures[figureKey]?.primaryPairing : null,
    opposingPairing: s.opposingPairing || null
  }));
}

/**
 * Mode 2: Find matching biblical figures for a player.
 */
async function suggestFiguresForPlayer(player, context, index) {
  // Build list of paired and unpaired figures
  const pairedFigures = Object.entries(index.figures).map(([id, f]) =>
    `${f.name} (paired with: ${f.pairings.join(', ')})`
  );

  const prompt = `You are helping find biblical/Jewish historical figures that match an NBA player's archetype for a collectible card art series called "Court & Covenant."

Player: ${player}

Already paired figures (you can still suggest these, but note the existing pairing):
${pairedFigures.join('\n')}

Existing pairings for context:
${formatPairingsForPrompt(context.all)}

Suggest 3-5 matching biblical figures. Mix both unpaired and already-paired figures if the match is strong. For already-paired figures, note the conflict.

For each suggestion provide:
1. "figure": the biblical figure's name
2. "thematic": core parallel (1 sentence)
3. "narrative": punchy tagline (1-2 sentences, edgy/fun)
4. "relationship": how they relate
5. "type": "hero" or "villain"
6. "alreadyPaired": true/false
7. "currentPairing": existing pairing ID if already paired, null otherwise

Return as a JSON array, best matches first.`;

  const suggestions = await callGemini(prompt);
  const results = Array.isArray(suggestions) ? suggestions : [suggestions];

  return results.map(s => ({
    player,
    figure: s.figure,
    connection: {
      thematic: s.thematic,
      narrative: s.narrative,
      relationship: s.relationship
    },
    type: s.type || 'hero',
    playerAlreadyPaired: !!index.players[player.toLowerCase().replace(/[^a-z0-9]+/g, '-')],
    figureAlreadyPaired: s.alreadyPaired || false,
    figureCurrentPairing: s.currentPairing || null,
    opposingPairing: null
  }));
}

/**
 * Mode 3: Find matching NBA players for a biblical figure.
 */
async function suggestPlayersForFigure(figure, context, index) {
  const pairedPlayers = Object.entries(index.players).map(([id, p]) =>
    `${p.name} (paired with: ${p.pairings.join(', ')})`
  );

  const prompt = `You are helping find NBA basketball players that match a biblical figure's archetype for a collectible card art series called "Court & Covenant."

Biblical Figure: ${figure}

Already paired players (you can still suggest these, but note the existing pairing):
${pairedPlayers.join('\n')}

Existing pairings for context:
${formatPairingsForPrompt(context.all)}

Suggest 3-5 matching NBA players. Mix both unpaired and already-paired players if the match is strong.

For each suggestion provide:
1. "player": the NBA player's name
2. "thematic": core parallel (1 sentence)
3. "narrative": punchy tagline (1-2 sentences, edgy/fun)
4. "relationship": how they relate
5. "type": "hero" or "villain"
6. "alreadyPaired": true/false
7. "currentPairing": existing pairing ID if already paired, null otherwise

Return as a JSON array, best matches first.`;

  const suggestions = await callGemini(prompt);
  const results = Array.isArray(suggestions) ? suggestions : [suggestions];

  return results.map(s => ({
    player: s.player,
    figure,
    connection: {
      thematic: s.thematic,
      narrative: s.narrative,
      relationship: s.relationship
    },
    type: s.type || 'hero',
    playerAlreadyPaired: s.alreadyPaired || false,
    playerCurrentPairing: s.currentPairing || null,
    figureAlreadyPaired: !!index.figures[figure.toLowerCase().replace(/[^a-z0-9]+/g, '-')],
    opposingPairing: null
  }));
}

/**
 * Mode 4: Discover new hero pairings based on gaps in the roster.
 */
async function discoverHeroes(context, index) {
  const prompt = `You are helping discover new hero pairings for a basketball card art series called "Court & Covenant" that pairs NBA legends with biblical/Jewish historical figures.

Existing hero pairings:
${formatPairingsForPrompt(context.heroes)}

Existing villain pairings:
${formatPairingsForPrompt(context.villains)}

Suggest 3-5 NEW hero pairings that would complement the existing roster. Consider:
- Players from different eras not yet represented
- Biblical figures with compelling untold parallels
- Thematic gaps (e.g., mentorship, sacrifice, redemption)
- Characters that already have pose files can be reused in alternate pairings

For each suggestion provide:
1. "player": NBA player name
2. "figure": biblical figure name
3. "thematic": core parallel (1 sentence)
4. "narrative": punchy tagline (1-2 sentences)
5. "relationship": how they relate
6. "type": "hero"

Return as a JSON array.`;

  const suggestions = await callGemini(prompt);
  const results = Array.isArray(suggestions) ? suggestions : [suggestions];

  return results.map(s => {
    const playerKey = s.player?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const figureKey = s.figure?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return {
      player: s.player,
      figure: s.figure,
      connection: {
        thematic: s.thematic,
        narrative: s.narrative,
        relationship: s.relationship
      },
      type: 'hero',
      playerAlreadyPaired: !!index.players[playerKey],
      figureAlreadyPaired: !!index.figures[figureKey],
      opposingPairing: null
    };
  });
}

/**
 * Mode 5: Discover villain pairings that oppose existing heroes.
 */
async function discoverOpposites(context, index) {
  const prompt = `You are finding hero-villain opposing pairings for a basketball card series called "Court & Covenant."

Existing hero pairings:
${formatPairingsForPrompt(context.heroes)}

Existing villain pairings:
${formatPairingsForPrompt(context.villains)}

Find 3-5 villain pairings that would naturally OPPOSE existing hero pairings. Focus on narrative tension (betrayer vs betrayed, mocker vs mocked, rival vs rival).

For each suggestion:
1. "player": NBA player name (someone who could be cast as a villain/antagonist)
2. "figure": biblical villain/antagonist figure name
3. "thematic": core parallel (1 sentence)
4. "narrative": punchy tagline (1-2 sentences)
5. "relationship": the villain dynamic
6. "type": "villain"
7. "opposingPairing": the existing hero pairing ID this opposes (e.g., "wilt-samson")
8. "rivalryAngle": why this villain pairing opposes that hero pairing

Return as a JSON array.`;

  const suggestions = await callGemini(prompt);
  const results = Array.isArray(suggestions) ? suggestions : [suggestions];

  return results.map(s => {
    const playerKey = s.player?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const figureKey = s.figure?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return {
      player: s.player,
      figure: s.figure,
      connection: {
        thematic: s.thematic,
        narrative: s.narrative,
        relationship: s.relationship
      },
      type: 'villain',
      playerAlreadyPaired: !!index.players[playerKey],
      figureAlreadyPaired: !!index.figures[figureKey],
      opposingPairing: s.opposingPairing || null,
      rivalryAngle: s.rivalryAngle || null
    };
  });
}

// ============================================================
// Auto-Generation
// ============================================================

/**
 * Generate a character ID from a name.
 */
function makeId(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Create all required files for a new pairing.
 * Checks which files already exist and only generates missing ones.
 */
export async function createPairingFiles({ player, figure, connection, type, opposingPairing }) {
  const playerId = makeId(player);
  const figureId = makeId(figure);
  const pairingId = `${playerId}-${figureId}`;
  const filesCreated = [];

  const index = buildCharacterIndex();
  const playerAlreadyPaired = !!index.players[playerId];
  const figureAlreadyPaired = !!index.figures[figureId];

  // 1. Generate player pose file if missing
  const playerPosePath = join(POSES_PLAYERS_DIR, `${playerId}.json`);
  if (!existsSync(playerPosePath)) {
    const poseData = await generatePlayerPoseFile(player, playerId);
    if (!existsSync(POSES_PLAYERS_DIR)) {
      mkdirSync(POSES_PLAYERS_DIR, { recursive: true });
    }
    writeFileSync(playerPosePath, JSON.stringify(poseData, null, 2));
    filesCreated.push(`data/poses/players/${playerId}.json`);
    console.log(`Created player pose file: ${playerId}.json`);
  }

  // 2. Generate figure pose file if missing
  const figurePosePath = join(POSES_FIGURES_DIR, `${figureId}.json`);
  if (!existsSync(figurePosePath)) {
    const poseData = await generateFigurePoseFile(figure, figureId);
    if (!existsSync(POSES_FIGURES_DIR)) {
      mkdirSync(POSES_FIGURES_DIR, { recursive: true });
    }
    writeFileSync(figurePosePath, JSON.stringify(poseData, null, 2));
    filesCreated.push(`data/poses/figures/${figureId}.json`);
    console.log(`Created figure pose file: ${figureId}.json`);
  }

  // 3. Generate figure quotes file if missing
  const quotesPath = join(QUOTES_DIR, `${figureId}.json`);
  if (!existsSync(quotesPath)) {
    const quotesData = await generateFigureQuotesFile(figure, figureId);
    if (!existsSync(QUOTES_DIR)) {
      mkdirSync(QUOTES_DIR, { recursive: true });
    }
    writeFileSync(quotesPath, JSON.stringify(quotesData, null, 2));
    filesCreated.push(`data/quotes/figures/${figureId}.json`);
    console.log(`Created figure quotes file: ${figureId}.json`);
  }

  // 4. Load pose data to build pairing JSON
  const playerPoseData = JSON.parse(readFileSync(playerPosePath, 'utf-8'));
  const figurePoseData = JSON.parse(readFileSync(figurePosePath, 'utf-8'));

  // 5. Create pairing JSON
  const pairingPath = join(PAIRINGS_DIR, `${pairingId}.json`);
  const isAlternate = playerAlreadyPaired || figureAlreadyPaired;
  const alternateOf = playerAlreadyPaired
    ? index.players[playerId]?.primaryPairing
    : figureAlreadyPaired
      ? index.figures[figureId]?.primaryPairing
      : null;

  const pairingData = {
    id: pairingId,
    series: 'court-covenant',
    type: type || 'hero',
    isAlternate,
    alternateOf: isAlternate ? alternateOf : null,
    opposingPairing: opposingPairing || null,
    player: {
      name: player,
      displayName: playerPoseData.name || player,
      poseFileId: playerId,
      era: playerPoseData.era || '2000s',
      jerseyColors: playerPoseData.jerseyColors || {
        primary: { base: 'white', accent: 'blue' },
        secondary: { base: 'blue', accent: 'white' }
      },
      signatureMoves: playerPoseData.signatureMoves || [],
      physicalDescription: playerPoseData.description || `Professional basketball player, athletic build`,
      archetype: playerPoseData.archetype || player
    },
    figure: {
      name: figure,
      displayName: figurePoseData.name || figure,
      poseFileId: figureId,
      attribute: figurePoseData.attribute || '',
      attributeDescription: figurePoseData.attributeDescription || '',
      visualStyle: figurePoseData.visualStyle || `biblical figure`,
      clothing: figurePoseData.clothing || 'robes and sandals, period-accurate biblical attire',
      physicalDescription: figurePoseData.figureDescription || figurePoseData.description || `Biblical figure, dignified bearing`,
      anatomyNote: 'two arms only',
      archetype: figurePoseData.archetype || figure
    },
    connection: connection || {
      thematic: '',
      narrative: '',
      relationship: ''
    },
    interactions: [
      {
        id: 'back-to-back',
        description: `${player} and ${figure} standing back-to-back, facing outward with confidence`
      },
      {
        id: 'side-by-side',
        description: `${player} and ${figure} standing together as equals`
      }
    ],
    defaultInteraction: 'back-to-back',
    cardVariants: type === 'villain'
      ? ['thunder-lightning-dark', 'beam-team-shadow', 'metal-universe-dark']
      : ['thunder-lightning', 'beam-team', 'downtown'],
    priority: 99,
    status: 'active'
  };

  if (!existsSync(PAIRINGS_DIR)) {
    mkdirSync(PAIRINGS_DIR, { recursive: true });
  }
  writeFileSync(pairingPath, JSON.stringify(pairingData, null, 2));
  filesCreated.push(`data/series/court-covenant/pairings/${pairingId}.json`);
  console.log(`Created pairing file: ${pairingId}.json`);

  return {
    success: true,
    pairingId,
    filesCreated,
    generatorUrl: `/generator.html?pairing=${pairingId}`
  };
}

/**
 * Use AI to generate a player pose file with character-specific poses.
 */
async function generatePlayerPoseFile(playerName, playerId) {
  // Read an example pose file for structure reference
  const examplePath = join(POSES_PLAYERS_DIR, 'jordan.json');
  let example = null;
  if (existsSync(examplePath)) {
    example = JSON.parse(readFileSync(examplePath, 'utf-8'));
  }

  const prompt = `Generate a basketball card pose data file for NBA player: ${playerName}

This is for a collectible card art series. I need 4-6 signature poses for this player.

${example ? `Here's an example of the format (Michael Jordan's file):
${JSON.stringify(example, null, 2)}` : ''}

Return a JSON object with this exact structure:
{
  "id": "${playerId}",
  "name": "${playerName}",
  "defaultPose": "the-most-iconic-pose-id",
  "description": "Physical description of the player, height, build, notable features",
  "poses": {
    "pose-id": {
      "id": "pose-id",
      "name": "Pose Display Name",
      "description": "What the pose looks like",
      "expression": "facial expression description",
      "prompt": "detailed visual description for image generation - what the player is doing, body position, energy",
      "energy": "2-4 words describing the vibe"
    }
  }
}

Make the poses specific to ${playerName}'s actual signature moves, celebrations, and iconic moments. Be specific and visual in the prompt field.`;

  try {
    return await callGemini(prompt);
  } catch (e) {
    // Fallback: generate basic pose data
    console.warn(`AI pose generation failed for ${playerName}, using defaults:`, e.message);
    return {
      id: playerId,
      name: playerName,
      defaultPose: 'signature-move',
      description: `Professional basketball player, athletic build`,
      poses: {
        'signature-move': {
          id: 'signature-move',
          name: 'Signature Move',
          description: `${playerName}'s signature basketball move`,
          expression: 'focused intensity',
          prompt: `executing signature basketball move - athletic form, focused expression, powerful body control`,
          energy: 'dominant, skilled'
        },
        'celebration': {
          id: 'celebration',
          name: 'Victory Celebration',
          description: 'Celebrating a big moment',
          expression: 'joy, triumph',
          prompt: `celebrating victory - fist pump or arms raised, expression of pure joy`,
          energy: 'triumphant, electric'
        },
        'dunk': {
          id: 'dunk',
          name: 'Powerful Dunk',
          description: 'Rising for a powerful dunk',
          expression: 'fierce determination',
          prompt: `rising for powerful one-handed dunk - body elevated, arm cocked back, eyes on rim`,
          energy: 'explosive, powerful'
        }
      }
    };
  }
}

/**
 * Use AI to generate a figure pose file with character-specific poses.
 */
async function generateFigurePoseFile(figureName, figureId) {
  // Read an example pose file for structure reference
  const examplePath = join(POSES_FIGURES_DIR, 'moses.json');
  let example = null;
  if (existsSync(examplePath)) {
    example = JSON.parse(readFileSync(examplePath, 'utf-8'));
  }

  const prompt = `Generate a pose data file for the biblical/Jewish historical figure: ${figureName}

This is for a collectible card art series pairing NBA players with biblical figures. I need 4-6 signature poses for this character based on their biblical story.

${example ? `Here's an example of the format (Moses's file):
${JSON.stringify(example, null, 2)}` : ''}

Return a JSON object with this exact structure:
{
  "id": "${figureId}",
  "name": "${figureName}",
  "defaultPose": "most-iconic-pose-id",
  "description": "Physical description - clothing, bearing, notable features, biblical accuracy",
  "attribute": "their signature item (staff, sword, etc.)",
  "attributeDescription": "detailed description of the attribute",
  "visualStyle": "brief visual style description",
  "clothing": "period-accurate clothing description",
  "poses": {
    "pose-id": {
      "id": "pose-id",
      "name": "Pose Display Name",
      "description": "What the pose depicts",
      "expression": "facial expression",
      "prompt": "detailed visual description for image generation - body position, clothing, items, setting cues",
      "energy": "2-4 words describing the vibe",
      "quoteId": "matching-quote-id"
    }
  }
}

Make the poses specific to ${figureName}'s actual biblical moments and story. The quoteId should match a key that would exist in a quotes file for this figure.`;

  try {
    return await callGemini(prompt);
  } catch (e) {
    console.warn(`AI pose generation failed for ${figureName}, using defaults:`, e.message);
    return {
      id: figureId,
      name: figureName,
      defaultPose: 'iconic-moment',
      description: `Biblical figure, dignified bearing, period-accurate attire`,
      poses: {
        'iconic-moment': {
          id: 'iconic-moment',
          name: 'Iconic Moment',
          description: `${figureName}'s most famous biblical moment`,
          expression: 'divine authority',
          prompt: `in moment of greatest significance - dignified pose, period-accurate clothing, powerful presence`,
          energy: 'powerful, iconic'
        },
        'commanding-presence': {
          id: 'commanding-presence',
          name: 'Commanding Presence',
          description: 'Standing with authority',
          expression: 'confident authority',
          prompt: `standing with commanding presence - robes flowing, dignified bearing`,
          energy: 'authoritative, majestic'
        },
        'contemplation': {
          id: 'contemplation',
          name: 'Contemplation',
          description: 'Deep in thought or prayer',
          expression: 'thoughtful, reverent',
          prompt: `in moment of contemplation - head slightly bowed, hands folded or raised, spiritual connection`,
          energy: 'reverent, peaceful'
        }
      }
    };
  }
}

/**
 * Use AI to generate a figure quotes file with Hebrew and English quotes.
 */
async function generateFigureQuotesFile(figureName, figureId) {
  // Read an example for structure
  const examplePath = join(QUOTES_DIR, 'moses.json');
  let example = null;
  if (existsSync(examplePath)) {
    example = JSON.parse(readFileSync(examplePath, 'utf-8'));
  }

  const prompt = `Generate a biblical quotes file for the figure: ${figureName}

This is for a collectible card series. I need 4-6 of their most iconic biblical quotes with Hebrew and English.

${example ? `Here's the exact format to follow (Moses's file):
${JSON.stringify(example, null, 2)}` : ''}

Return a JSON object with this exact structure:
{
  "id": "${figureId}",
  "name": "${figureName}",
  "aliases": ["other names for this figure"],
  "quotes": {
    "quote-id": {
      "source": "Book Chapter:Verse",
      "context": "What was happening when this was said",
      "hebrew": "The original Hebrew text",
      "english": "English translation",
      "mood": "2-4 words describing the emotional tone"
    }
  }
}

Use actual biblical verses. The Hebrew should be the real Hebrew text. The quote IDs should be descriptive kebab-case identifiers. Focus on the most dramatic and iconic moments.`;

  try {
    return await callGemini(prompt);
  } catch (e) {
    console.warn(`AI quotes generation failed for ${figureName}, using defaults:`, e.message);
    return {
      id: figureId,
      name: figureName,
      aliases: [],
      quotes: {
        'signature-quote': {
          source: '',
          context: `${figureName}'s most iconic moment`,
          hebrew: '',
          english: `[Add ${figureName}'s signature quote]`,
          mood: 'powerful, defining'
        }
      }
    };
  }
}

export default {
  buildCharacterIndex,
  getUnusedCharacters,
  generateSuggestions,
  createPairingFiles
};
