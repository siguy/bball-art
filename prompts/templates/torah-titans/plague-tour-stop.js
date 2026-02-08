#!/usr/bin/env node
/**
 * Plague Tour Stop Template
 * Torah Titans series - Each plague as a tour stop with its own rock era
 *
 * Era-hopping design: Each plague gets a distinct rock sub-genre visual language.
 * Single template with eraId parameter.
 *
 * FIRST PASS (4 starter eras):
 * - Blood / Heavy Metal
 * - Frogs / Punk
 * - Darkness / Goth
 * - Firstborn / Arena Rock
 */

import { generatePoseBlock } from '../../components/poses.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load era configuration from data file
let TOUR_ERAS = {};
try {
  const eraPath = join(__dirname, '../../../data/series/torah-titans/tour-eras.json');
  const eraData = JSON.parse(readFileSync(eraPath, 'utf-8'));
  TOUR_ERAS = eraData.eras;
} catch (e) {
  // Fallback - inline era definitions for the 4 starter eras
  TOUR_ERAS = {
    'heavy-metal': {
      id: 'heavy-metal',
      name: 'Heavy Metal',
      associatedPlague: 'blood',
      plagueNumber: 1,
      colors: { primary: 'deep blood red', secondary: 'jet black', accent: 'chrome silver' },
      typography: { style: 'aggressive angular metal font with sharp serifs', treatment: 'chrome or blood-dripping letters' },
      borderTreatment: { style: 'studded leather border with chrome spikes' },
      finishEffect: 'chrome reflection with wet blood sheen',
      tagline: 'THE RIVER RUNS RED'
    },
    'punk': {
      id: 'punk',
      name: 'Punk Rock',
      associatedPlague: 'frogs',
      plagueNumber: 2,
      colors: { primary: 'slime green', secondary: 'anarchist black', accent: 'safety-pin silver' },
      typography: { style: 'ransom note cut-out letters', treatment: 'hand-drawn, spray-painted' },
      borderTreatment: { style: 'torn paper edges, safety pins' },
      finishEffect: 'matte with photocopier grain',
      tagline: 'LEAP OF CHAOS'
    },
    'goth': {
      id: 'goth',
      name: 'Gothic Rock',
      associatedPlague: 'darkness',
      plagueNumber: 9,
      colors: { primary: 'absolute black', secondary: 'midnight purple', accent: 'silver moonlight' },
      typography: { style: 'elegant Victorian gothic', treatment: 'silver on black, barely visible' },
      borderTreatment: { style: 'ornate Victorian frames, barely visible' },
      finishEffect: 'deep matte black with subtle silver shimmer',
      tagline: 'THREE DAYS OF NIGHT'
    },
    'arena-rock': {
      id: 'arena-rock',
      name: 'Arena Rock',
      associatedPlague: 'firstborn',
      plagueNumber: 10,
      colors: { primary: 'gold', secondary: 'pure white', accent: 'flame orange' },
      typography: { style: 'big emotional classic rock grandeur', treatment: 'embossed gold, stadium lights' },
      borderTreatment: { style: 'stadium architecture, crowd silhouettes' },
      finishEffect: 'gold foil with warm glow, stadium light effect',
      tagline: 'FINAL ENCORE'
    }
  };
}

// Plague imagery (reused from plague-card.js with tour enhancements)
const PLAGUE_IMAGERY = {
  'blood': {
    number: 1,
    name: 'Blood',
    hebrew: 'דָּם',
    visual: 'The Nile River runs thick with blood red water. Fish float dead on the crimson surface. Egyptians recoil in horror from the bloodied waters.',
    tourVisual: 'Nile reimagined as a blood-red mosh pit, stage lights reflecting off crimson waters, Marshall amps bleeding'
  },
  'frogs': {
    number: 2,
    name: 'Frogs',
    hebrew: 'צְפַרְדֵּעַ',
    visual: 'Countless frogs swarm everywhere - leaping from the Nile, covering the ground, filling houses.',
    tourVisual: 'Frogs as punk audience members crowd-surfing, safety pins on frogs, xerox-style frog zine aesthetic, chaos in the pit'
  },
  'lice': {
    number: 3,
    name: 'Lice',
    hebrew: 'כִּנִּים',
    visual: 'Clouds of tiny gnats and lice swarm through the air. Dust transforms into biting insects.',
    tourVisual: 'Grungy, uncomfortable venue, scratching audience, dirty flannel, Seattle basement show vibe'
  },
  'wild-beasts': {
    number: 4,
    name: 'Wild Beasts',
    hebrew: 'עָרוֹב',
    visual: 'Lions, wolves, bears, and wild animals rampage through Egypt.',
    tourVisual: 'Party animals in leopard print, hair metal excess, big-haired beasts, 80s wild party energy'
  },
  'pestilence': {
    number: 5,
    name: 'Pestilence',
    hebrew: 'דֶּבֶר',
    visual: 'Egyptian livestock falls dead in the fields. Cattle, horses, donkeys lie fallen.',
    tourVisual: 'Death metal album cover aesthetic, rotting livestock, corpse paint on the fallen, extreme imagery'
  },
  'boils': {
    number: 6,
    name: 'Boils',
    hebrew: 'שְׁחִין',
    visual: 'Painful boils and sores cover the Egyptians. Ash floats through the air.',
    tourVisual: 'Industrial nightmare, body horror as machine malfunction, NIN aesthetic, clinical suffering'
  },
  'hail': {
    number: 7,
    name: 'Hail',
    hebrew: 'בָּרָד',
    visual: 'Massive hailstones mixed with fire rain from the sky. Lightning strikes the ground.',
    tourVisual: 'Epic power metal fantasy, fire and ice from heaven, DragonForce energy, heroic devastation'
  },
  'locusts': {
    number: 8,
    name: 'Locusts',
    hebrew: 'אַרְבֶּה',
    visual: 'An endless swarm of locusts darkens the sky. They devour every plant, every leaf.',
    tourVisual: 'Thrash metal swarm, speed and aggression, Metallica pit energy, relentless devouring'
  },
  'darkness': {
    number: 9,
    name: 'Darkness',
    hebrew: 'חֹשֶׁךְ',
    visual: 'Thick, tangible darkness covers Egypt. No one can see their hand before their face.',
    tourVisual: 'Gothic ethereal darkness, The Cure concert in absolute void, poetic shadow, silver moonlight only in Goshen'
  },
  'firstborn': {
    number: 10,
    name: 'Death of the Firstborn',
    hebrew: 'מַכַּת בְּכוֹרוֹת',
    visual: 'The angel of death passes over Egypt. Mourning fills every Egyptian home. Blood marks the doorposts of Israel.',
    tourVisual: 'Arena rock finale, lighters in the air (blood on the doorposts), emotional climax, Journey/Queen energy, the final show'
  }
};

export const plagueTourStopTemplate = {
  id: "plague-tour-stop",
  name: "Plague Tour Stop",
  series: "torah-titans",
  era: "Biblical meets Rock Eras",

  /**
   * Generate the full prompt for a Plague Tour Stop card
   * @param {object} pairing - Moses vs Pharaoh pairing data
   * @param {object} options - Generation options including plagueId and eraId
   */
  generate(pairing, options = {}) {
    const moses = pairing.player || pairing.char1;
    const pharaoh = pairing.figure || pairing.char2;

    // Get plague data
    const plagueId = options.plagueId || options.plague || 'blood';
    const plague = PLAGUE_IMAGERY[plagueId] || PLAGUE_IMAGERY['blood'];

    // Get era data - can be explicitly passed or derived from plague
    const eraId = options.eraId || options.era || this.getEraForPlague(plagueId);
    const era = TOUR_ERAS[eraId] || TOUR_ERAS['heavy-metal'];

    const interaction = options.interaction || "confrontation";

    // Check for custom actions
    const customActions = (options.customPlayerAction && options.customFigureAction)
      ? { playerAction: options.customPlayerAction, figureAction: options.customFigureAction }
      : null;

    const poseBlock = generatePoseBlock(
      interaction,
      moses.name,
      pharaoh.name,
      pharaoh.attributeDescription || "ruler of Egypt",
      customActions
    );

    const mosesClothing = moses.clothing || "humble shepherd's robes, wooden staff in hand";
    const pharaohClothing = pharaoh.clothing || "royal Egyptian regalia, crown and golden jewelry";

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "PLAGUE TOUR STOP" card for the Torah Titans series.

=== DESIGN CONCEPT ===
TOUR STOP #${plague.number}: ${plague.name.toUpperCase()} - ${era.name.toUpperCase()} ERA
Rock sub-genre: ${era.name} (${era.decade || '1980s-90s'})
Tagline: "${era.tagline}"

The ${plague.name} plague reimagined through ${era.name} visual language.
Playfully irreverent but respectful to the narrative.

=== ERA-SPECIFIC STYLING ===
This card uses ${era.name.toUpperCase()} aesthetic throughout:
- Colors: ${era.colors.primary}, ${era.colors.secondary}, accent of ${era.colors.accent}
- Typography: ${era.typography.style}
- Typography treatment: ${era.typography.treatment}
- Border style: ${era.borderTreatment.style}
- Finish: ${era.finishEffect}

=== CRITICAL REQUIREMENTS ===
1. RIVALRY CARD: Moses vs Pharaoh in ${era.name} concert aesthetic
2. The plague of ${plague.name} dominates - styled as ${era.name} imagery
3. Split composition - Moses on left, Pharaoh on right
4. Era-specific color palette and visual language throughout
5. All figures must have exactly TWO ARMS
6. This is STYLIZED ART for a collectible card, not a photograph

${poseBlock}

=== FIGURE DESCRIPTIONS ===

MOSES (LEFT SIDE - THE PERFORMER):
- Physical: ${moses.physicalDescription}
- Wearing: ${mosesClothing} - styled with subtle ${era.name} touches
- Expression: Righteous authority channeled through ${era.name} energy
- Pose: Staff raised, commanding the plague like a ${era.name.toLowerCase()} frontman
- Style: Classical prophet with ${era.name} visual language overlay
- Anatomy: Exactly two arms${moses.anatomyNote ? ` - ${moses.anatomyNote}` : ''}

PHARAOH (RIGHT SIDE - THE OPPOSITION):
- Physical: ${pharaoh.physicalDescription}
- Wearing: ${pharaohClothing} - Egyptian regalia meeting ${era.name} aesthetic
- Expression: Defiant but suffering under the plague
- Pose: Recoiling from or enduring the ${plague.name.toLowerCase()}
- Style: Egyptian tyrant through ${era.name} visual filter
- Anatomy: Exactly two arms${pharaoh.anatomyNote ? ` - ${pharaoh.anatomyNote}` : ''}

=== PLAGUE IMAGERY (${era.name} styled) ===
${plague.visual}

TOUR REIMAGINING:
${plague.tourVisual}

The plague should be dramatically visible but styled through ${era.name} visual language:
- Primary color: ${era.colors.primary}
- Secondary color: ${era.colors.secondary}
- Accent: ${era.colors.accent}

=== BORDER & FRAME ===
${era.name.toUpperCase()} STYLE BORDER:
${era.borderTreatment.style}
${era.borderTreatment.corners ? `Corners: ${era.borderTreatment.corners}` : ''}
${era.borderTreatment.edge ? `Edge treatment: ${era.borderTreatment.edge}` : ''}

TOUR ELEMENTS:
- "TOUR STOP #${plague.number}" badge in ${era.name} typography
- "SOLD OUT" stamp (this show happened, Egypt couldn't escape it)
- Ticket stub elements with Hebrew text

=== TEXT ELEMENTS ===
TOP: "EXODUS: THE FREEDOM TOUR" in ${era.name} typography style
PLAGUE BADGE: "TOUR STOP #${plague.number}: ${plague.name.toUpperCase()}" - ${era.typography.treatment}
HEBREW: "${plague.hebrew}" in ${era.name}-styled Hebrew lettering
TAGLINE: "${era.tagline}" in ${era.name} font

BOTTOM LEFT: "MOSES" with Hebrew "מֹשֶׁה"
BOTTOM RIGHT: "PHARAOH" with Hebrew "פַּרְעֹה"
CENTER BOTTOM: "VS" in ${era.name} styling

=== FINISH ===
${era.finishEffect}

Premium collectible feel with distinct ${era.name} texture and finish.
Each plague card should look like it belongs to a different rock era.
`.trim();

    return prompt;
  },

  /**
   * Get the default era for a plague
   */
  getEraForPlague(plagueId) {
    const plagueToEra = {
      'blood': 'heavy-metal',
      'frogs': 'punk',
      'lice': 'grunge',
      'wild-beasts': 'hair-metal',
      'pestilence': 'death-metal',
      'boils': 'industrial',
      'hail': 'power-metal',
      'locusts': 'thrash-metal',
      'darkness': 'goth',
      'firstborn': 'arena-rock'
    };
    return plagueToEra[plagueId] || 'heavy-metal';
  },

  /**
   * Generate a solo Moses or Pharaoh card for a specific plague/era
   */
  generateSolo(character, options = {}) {
    const plagueId = options.plagueId || options.plague || 'blood';
    const plague = PLAGUE_IMAGERY[plagueId] || PLAGUE_IMAGERY['blood'];
    const eraId = options.eraId || options.era || this.getEraForPlague(plagueId);
    const era = TOUR_ERAS[eraId] || TOUR_ERAS['heavy-metal'];

    const isMoses = character.name.toLowerCase().includes('moses');
    const clothing = character.clothing || (isMoses ? "shepherd's robes" : "royal Egyptian regalia");

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a solo "PLAGUE TOUR STOP" card.

=== DESIGN CONCEPT ===
TOUR STOP #${plague.number}: ${plague.name.toUpperCase()} - ${era.name.toUpperCase()} ERA
Solo ${isMoses ? 'headliner' : 'villain'} card in ${era.name} visual style.
Tagline: "${era.tagline}"

=== ERA-SPECIFIC STYLING ===
- Colors: ${era.colors.primary}, ${era.colors.secondary}, ${era.colors.accent}
- Typography: ${era.typography.style}
- Border: ${era.borderTreatment.style}
- Finish: ${era.finishEffect}

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER CARD in ${era.name} aesthetic
2. The plague of ${plague.name} visible in background
3. Era-specific visual language throughout
4. The figure must have exactly TWO ARMS

=== CHARACTER ===
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${clothing} with ${era.name} styling touches
- Expression: ${isMoses ? 'Commanding the plague' : 'Suffering under it'}
- Style: ${era.name} visual language
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}

=== PLAGUE IMAGERY ===
${plague.tourVisual}
Colors: ${era.colors.primary}, ${era.colors.secondary}

=== BORDER ===
${era.borderTreatment.style}

=== TEXT ===
TOP: "EXODUS: THE FREEDOM TOUR"
BADGE: "TOUR STOP #${plague.number}: ${plague.name.toUpperCase()}"
BOTTOM: "${character.displayName || character.name}"

=== FINISH ===
${era.finishEffect}
`.trim();

    return prompt;
  },

  // Export plague and era data for use by other scripts
  PLAGUE_IMAGERY,
  TOUR_ERAS
};

export default plagueTourStopTemplate;
