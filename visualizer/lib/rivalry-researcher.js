/**
 * Rivalry Researcher
 *
 * Dedicated Gemini-powered research module for same-type rivalries
 * (player-vs-player and figure-vs-figure).
 *
 * Generates:
 * - Historic relationship narrative
 * - Key rivalry moments
 * - Rivalry-specific scene descriptions (become poses)
 * - For figure-figure: scripture references with Hebrew text
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../..');

// Gemini client (lazy-initialized)
let genaiClient = null;
const TEXT_MODEL = 'gemini-2.0-flash';

/**
 * Initialize the Gemini AI client lazily.
 */
async function getGenaiClient() {
  if (genaiClient) return genaiClient;

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
 */
function cleanJsonString(str) {
  return str.replace(/,\s*([\]}])/g, '$1');
}

/**
 * Try multiple strategies to parse a JSON string.
 */
function robustJsonParse(str) {
  try { return JSON.parse(str); } catch (_) {}
  const cleaned = cleanJsonString(str);
  try { return JSON.parse(cleaned); } catch (_) {}
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

  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = (jsonMatch ? jsonMatch[1] : text).trim();

  const parsed = robustJsonParse(jsonStr);
  if (parsed !== null) {
    return parsed;
  }

  throw new Error(`Failed to parse Gemini response as JSON: ${text.slice(0, 300)}`);
}

/**
 * Make a kebab-case ID from a string.
 */
function makeId(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Research the historic rivalry between two NBA players.
 *
 * @param {string} heroName - The hero player's name
 * @param {string} villainName - The villain player's name
 * @returns {object} rivalryResearch object
 */
export async function researchPlayerRivalry(heroName, villainName) {
  const prompt = `Research the NBA rivalry between ${heroName} and ${villainName}.

You are building data for a collectible basketball card art series. The card will show these two players on a split "rivalry" card — hero on the left, villain on the right, with a dramatic VS divider.

Return JSON with exactly this structure:
{
  "relationship": "2-3 sentence narrative of their rivalry — what made it legendary, personal, or heated",
  "keyMoments": [
    {
      "title": "Short title of the moment",
      "description": "1-2 sentence description",
      "year": "Year or range (e.g., '1991' or '1988-1991')"
    }
  ],
  "rivalryScenes": [
    {
      "id": "kebab-case-scene-id",
      "heroAction": "Visual description of what ${heroName} is doing — body position, expression, energy. Written for an image generation prompt.",
      "villainAction": "Visual description of what ${villainName} is doing — body position, expression, energy. Written for an image generation prompt.",
      "scene": "Setting/atmosphere description (arena, era, crowd energy)",
      "energy": "2-5 words describing the mood/vibe"
    }
  ]
}

Requirements:
- keyMoments: 3-5 pivotal rivalry moments, chronological
- rivalryScenes: 3-4 visual scenes ideal for a split card composition
- Each scene should have dramatically contrasting hero vs villain actions
- Be specific and visual in the action descriptions — these feed directly into image generation
- Focus on real events, real moments, real dynamics between these players`;

  try {
    const result = await callGemini(prompt);

    // Validate and normalize
    return {
      relationship: result.relationship || `${heroName} vs ${villainName} — a defining NBA rivalry.`,
      keyMoments: Array.isArray(result.keyMoments) ? result.keyMoments.slice(0, 5) : [],
      rivalryScenes: Array.isArray(result.rivalryScenes)
        ? result.rivalryScenes.slice(0, 4).map(s => ({
            id: s.id || makeId(s.heroAction?.slice(0, 30) || 'scene'),
            heroAction: s.heroAction || '',
            villainAction: s.villainAction || '',
            scene: s.scene || '',
            energy: s.energy || 'intense rivalry'
          }))
        : []
    };
  } catch (e) {
    console.warn(`Player rivalry research failed for ${heroName} vs ${villainName}:`, e.message);
    return {
      relationship: `${heroName} vs ${villainName} — rival NBA legends.`,
      keyMoments: [],
      rivalryScenes: [
        {
          id: 'face-off',
          heroAction: `${heroName} standing with competitive fire, jaw set, ready for battle`,
          villainAction: `${villainName} standing with menacing confidence, cold stare`,
          scene: 'NBA arena, packed crowd, playoff atmosphere',
          energy: 'intense, competitive, personal'
        }
      ]
    };
  }
}

/**
 * Research the biblical rivalry between two figures.
 * Also generates scripture references with Hebrew text.
 *
 * @param {string} heroName - The hero figure's name
 * @param {string} villainName - The villain figure's name
 * @returns {object} rivalryResearch object with scriptureReferences
 */
export async function researchFigureRivalry(heroName, villainName) {
  const prompt = `Research the biblical relationship between ${heroName} and ${villainName}.

You are building data for a collectible card art series pairing biblical figures. The card will show these two figures on a split "rivalry" card — hero on the left, villain on the right, with a dramatic VS divider.

Return JSON with exactly this structure:
{
  "relationship": "2-3 sentence narrative of their biblical relationship/conflict",
  "keyMoments": [
    {
      "title": "Short title of the moment",
      "description": "1-2 sentence description of this pivotal narrative moment"
    }
  ],
  "rivalryScenes": [
    {
      "id": "kebab-case-scene-id",
      "heroAction": "Visual description of what ${heroName} is doing — body position, clothing, expression, items held. Written for an image generation prompt.",
      "villainAction": "Visual description of what ${villainName} is doing — body position, clothing, expression, items held. Written for an image generation prompt.",
      "scene": "Setting/atmosphere description (ancient location, time of day, mood)",
      "energy": "2-5 words describing the mood/vibe"
    }
  ],
  "scriptureReferences": [
    {
      "source": "Book Chapter:Verse (e.g., 'Genesis 25:23')",
      "context": "What was happening when this was said/occurred",
      "hebrew": "The original Hebrew text of this verse",
      "english": "English translation of this verse",
      "mood": "2-4 words describing the emotional tone"
    }
  ]
}

Requirements:
- keyMoments: 3-5 pivotal narrative moments
- rivalryScenes: 3-4 visual scenes ideal for a split card composition
- scriptureReferences: 3-5 key verses that capture the rivalry dynamic — include verses from BOTH figures' perspectives and shared narrative moments
- The Hebrew MUST be actual biblical Hebrew text
- Be specific and visual in the action descriptions
- Focus on real biblical narrative`;

  try {
    const result = await callGemini(prompt);

    return {
      relationship: result.relationship || `${heroName} vs ${villainName} — a biblical confrontation.`,
      keyMoments: Array.isArray(result.keyMoments) ? result.keyMoments.slice(0, 5) : [],
      rivalryScenes: Array.isArray(result.rivalryScenes)
        ? result.rivalryScenes.slice(0, 4).map(s => ({
            id: s.id || makeId(s.heroAction?.slice(0, 30) || 'scene'),
            heroAction: s.heroAction || '',
            villainAction: s.villainAction || '',
            scene: s.scene || '',
            energy: s.energy || 'biblical confrontation'
          }))
        : [],
      scriptureReferences: Array.isArray(result.scriptureReferences)
        ? result.scriptureReferences.slice(0, 5).map(ref => ({
            source: ref.source || '',
            context: ref.context || '',
            hebrew: ref.hebrew || '',
            english: ref.english || '',
            mood: ref.mood || 'dramatic'
          }))
        : []
    };
  } catch (e) {
    console.warn(`Figure rivalry research failed for ${heroName} vs ${villainName}:`, e.message);
    return {
      relationship: `${heroName} vs ${villainName} — a defining biblical confrontation.`,
      keyMoments: [],
      rivalryScenes: [
        {
          id: 'confrontation',
          heroAction: `${heroName} standing with divine authority, righteous presence`,
          villainAction: `${villainName} standing in defiance, menacing presence`,
          scene: 'Ancient biblical setting, dramatic lighting',
          energy: 'biblical, fateful, divine judgment'
        }
      ],
      scriptureReferences: []
    };
  }
}

/**
 * Convert rivalry scenes into pose entries for a pose file.
 * Each scene becomes a rivalry-specific pose with isRivalryPose: true.
 *
 * @param {Array} rivalryScenes - From rivalryResearch
 * @param {'hero'|'villain'} side - Which character's poses to extract
 * @param {string} characterName - Name for the pose descriptions
 * @returns {object} Map of poseId -> pose data
 */
export function scenesToPoses(rivalryScenes, side, characterName) {
  const poses = {};

  for (const scene of rivalryScenes) {
    const action = side === 'hero' ? scene.heroAction : scene.villainAction;
    if (!action) continue;

    const poseId = `rivalry-${scene.id}`;
    poses[poseId] = {
      id: poseId,
      name: `Rivalry: ${scene.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
      description: `${characterName} in rivalry scene: ${scene.scene || ''}`.trim(),
      prompt: action,
      energy: scene.energy || 'rivalry, confrontation',
      isRivalryPose: true
    };
  }

  return poses;
}

export default {
  researchPlayerRivalry,
  researchFigureRivalry,
  scenesToPoses
};
