#!/usr/bin/env node
/**
 * Plague Card Template
 * Torah Titans specific template for the 10 Plagues of Egypt
 *
 * Designed for Moses vs Pharaoh cards featuring each of the 10 plagues.
 * Dramatic rivalry aesthetic with plague-specific imagery.
 */

import { generatePoseBlock } from '../../components/poses.js';

// Plague-specific visual elements
const PLAGUE_IMAGERY = {
  'blood': {
    number: 1,
    name: 'Blood',
    hebrew: 'דָּם',
    visual: 'The Nile River runs thick with blood red water. Fish float dead on the crimson surface. Egyptians recoil in horror from the bloodied waters.',
    colors: { primary: 'deep blood red', secondary: 'dark maroon', accent: 'black river banks' }
  },
  'frogs': {
    number: 2,
    name: 'Frogs',
    hebrew: 'צְפַרְדֵּעַ',
    visual: 'Countless frogs swarm everywhere - leaping from the Nile, covering the ground, filling houses. A sea of green amphibians.',
    colors: { primary: 'murky green', secondary: 'brown mud', accent: 'yellow-green slime' }
  },
  'lice': {
    number: 3,
    name: 'Lice',
    hebrew: 'כִּנִּים',
    visual: 'Clouds of tiny gnats and lice swarm through the air. Dust transforms into biting insects. An inescapable plague of creeping things.',
    colors: { primary: 'dusty brown', secondary: 'dark grey', accent: 'swarming black specks' }
  },
  'wild-beasts': {
    number: 4,
    name: 'Wild Beasts',
    hebrew: 'עָרוֹב',
    visual: 'Lions, wolves, bears, and wild animals rampage through Egypt. Dangerous beasts fill the streets and palaces.',
    colors: { primary: 'tawny gold', secondary: 'savage brown', accent: 'fierce orange' }
  },
  'pestilence': {
    number: 5,
    name: 'Pestilence',
    hebrew: 'דֶּבֶר',
    visual: 'Egyptian livestock falls dead in the fields. Cattle, horses, donkeys lie fallen. A terrible disease sweeps through the animals.',
    colors: { primary: 'sickly yellow-green', secondary: 'decay brown', accent: 'death grey' }
  },
  'boils': {
    number: 6,
    name: 'Boils',
    hebrew: 'שְׁחִין',
    visual: 'Painful boils and sores cover the Egyptians. Ash floats through the air. The magicians cannot stand before Moses.',
    colors: { primary: 'inflamed red', secondary: 'ash grey', accent: 'infected yellow' }
  },
  'hail': {
    number: 7,
    name: 'Hail',
    hebrew: 'בָּרָד',
    visual: 'Massive hailstones mixed with fire rain from the sky. Lightning strikes the ground. Trees and crops are destroyed.',
    colors: { primary: 'ice white', secondary: 'storm grey', accent: 'fire orange within ice' }
  },
  'locusts': {
    number: 8,
    name: 'Locusts',
    hebrew: 'אַרְבֶּה',
    visual: 'An endless swarm of locusts darkens the sky. They devour every plant, every leaf. Egypt is stripped bare.',
    colors: { primary: 'locust brown', secondary: 'swarm black', accent: 'destroyed green remnants' }
  },
  'darkness': {
    number: 9,
    name: 'Darkness',
    hebrew: 'חֹשֶׁךְ',
    visual: 'Thick, tangible darkness covers Egypt. No one can see their hand before their face. Only Goshen has light.',
    colors: { primary: 'absolute black', secondary: 'void purple', accent: 'distant light in Goshen' }
  },
  'firstborn': {
    number: 10,
    name: 'Death of the Firstborn',
    hebrew: 'מַכַּת בְּכוֹרוֹת',
    visual: 'The angel of death passes over Egypt. Mourning fills every Egyptian home. Blood marks the doorposts of Israel.',
    colors: { primary: 'death black', secondary: 'blood red doorposts', accent: 'pale moonlight' }
  }
};

export const plagueCardTemplate = {
  id: "plague-card",
  name: "Plague Card",
  series: "torah-titans",
  era: "Biblical",

  /**
   * Generate the full prompt for a Plague Card
   * @param {object} pairing - Moses vs Pharaoh pairing data
   * @param {object} options - Generation options including plague info
   */
  generate(pairing, options = {}) {
    const moses = pairing.player || pairing.char1;
    const pharaoh = pairing.figure || pairing.char2;

    // Get plague data
    const plagueId = options.plagueId || pairing.seriesSpecificData?.plagueName || 'blood';
    const plague = PLAGUE_IMAGERY[plagueId] || PLAGUE_IMAGERY['blood'];

    const interaction = options.interaction || "confrontation";

    // Check for custom actions
    const customActions = (options.customPlayerAction && options.customFigureAction)
      ? { playerAction: options.customPlayerAction, figureAction: options.customFigureAction }
      : null;

    // Generate the interaction block
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
A vertical premium collectible card in 3:4 aspect ratio, styled as a "Plague Card" for the Torah Titans series.

=== PLAGUE: ${plague.name.toUpperCase()} (${plague.hebrew}) ===
Plague ${plague.number} of 10

=== CRITICAL REQUIREMENTS ===
1. RIVALRY CARD: Moses (hero) vs Pharaoh (villain)
2. The plague of ${plague.name} dominates the background
3. Split composition - Moses on left, Pharaoh on right
4. Classical artistic interpretation, biblical period accurate
5. All figures must have exactly TWO ARMS
6. This is STYLIZED ART for a collectible card, not a photograph

${poseBlock}

=== FIGURE DESCRIPTIONS ===

MOSES (LEFT SIDE - HERO):
- Physical: ${moses.physicalDescription}
- Wearing: ${mosesClothing}
- Expression: Righteous authority, channeling divine power
- Pose: Staff raised, commanding the plague
- Style: Classical heroic interpretation
- Anatomy: Exactly two arms${moses.anatomyNote ? ` - ${moses.anatomyNote}` : ''}

PHARAOH (RIGHT SIDE - VILLAIN):
- Physical: ${pharaoh.physicalDescription}
- Wearing: ${pharaohClothing}
- Expression: Defiant but shaken, hardened heart visible in his stance
- Pose: Recoiling from the plague, yet still proud
- Style: Classical interpretation showing hubris and suffering
- Anatomy: Exactly two arms${pharaoh.anatomyNote ? ` - ${pharaoh.anatomyNote}` : ''}

=== COMPOSITION ===
RIVALRY SPLIT CARD:
- Moses on the LEFT, standing tall, emanating divine authority
- Pharaoh on the RIGHT, powerful but diminished by the plague
- A visual dividing line down the center - the plague itself serves as the divide
- Both figures LARGE and PROMINENT, filling most of the card height

=== BACKGROUND & PLAGUE IMAGERY ===
${plague.visual}

The plague should be dramatically visible but not obscure the figures:
- Primary color: ${plague.colors.primary}
- Secondary color: ${plague.colors.secondary}
- Accent: ${plague.colors.accent}

Egyptian architecture (palace, columns) visible in Pharaoh's half.
Divine light emanating from Moses' side, contrasting with the plague's devastation.

=== BORDER & FRAME ===
Split border reflecting the rivalry:
- Left side (Moses): Golden light border with Hebrew letters
- Right side (Pharaoh): Dark Egyptian hieroglyphic border
- Center divider: Plague imagery (${plague.name.toLowerCase()}) flowing between them

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "TORAH TITANS" in dramatic font - half gold (Moses side), half dark bronze (Pharaoh side).

SUBTITLE: Write "PLAGUE ${plague.number}: ${plague.name.toUpperCase()}" below in ominous text.

HEBREW: Small "${plague.hebrew}" in elegant Hebrew script.

BOTTOM LEFT: "Moses" in heroic gold text
BOTTOM RIGHT: "Pharaoh" in dark bronze text
CENTER BOTTOM: "VS" in dramatic divider

=== FINISH ===
High-contrast dramatic finish. Moses' side has divine shimmer. Pharaoh's side has darker, troubled aesthetic. Premium collectible feel with the weight of biblical epic.
`.trim();

    return prompt;
  },

  /**
   * Generate a solo character card
   * For plague cards, this shows either Moses commanding or Pharaoh suffering
   */
  generateSolo(character, options = {}) {
    const plagueId = options.plagueId || 'blood';
    const plague = PLAGUE_IMAGERY[plagueId] || PLAGUE_IMAGERY['blood'];
    const isMoses = character.name.toLowerCase().includes('moses');
    const pose = character.pose || options.pose;
    const clothing = character.clothing || (isMoses ? "shepherd's robes, staff raised" : "royal Egyptian regalia");

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "Plague Card" for the Torah Titans series.

=== PLAGUE: ${plague.name.toUpperCase()} (${plague.hebrew}) ===
Plague ${plague.number} of 10

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER CARD
2. The plague of ${plague.name} visible in the background
3. ${isMoses ? 'Divine authority and power' : 'Suffering and defiance'}
4. Classical artistic interpretation, biblical period accurate
5. The figure must have exactly TWO ARMS

=== SINGLE FIGURE POSE ===
${character.name} is shown ${isMoses ? 'commanding the plague:' : 'facing the plague:'}
${pose?.prompt || (isMoses ? 'Staff raised, calling down divine judgment' : 'Standing defiant yet shaken before the devastation')}
Energy: ${pose?.energy || (isMoses ? 'Divine authority, righteous power' : 'Stubborn defiance, hardened heart')}

=== CHARACTER DESCRIPTION ===

${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${clothing}
- Expression: ${isMoses ? 'Righteous authority' : 'Defiant suffering'}
- Style: Classical artistic interpretation
- Anatomy: Exactly two arms

=== COMPOSITION ===
SOLO CARD: ${character.name} is the ONLY figure.
- Character CENTERED and DOMINANT, 60-70% of card height
- Show from approximately ankle-level up
- ${isMoses ? 'Divine light radiating from the figure' : 'Plague effects surrounding but not overwhelming'}

=== BACKGROUND ===
${plague.visual}
- Primary color: ${plague.colors.primary}
- Secondary color: ${plague.colors.secondary}

=== BORDER & FRAME ===
${isMoses ? 'Golden light border with Hebrew letters' : 'Dark Egyptian hieroglyphic border with plague motifs'}

=== TEXT ELEMENTS ===
TOP: "TORAH TITANS" in ${isMoses ? 'gold' : 'dark bronze'}.
SUBTITLE: "PLAGUE ${plague.number}: ${plague.name.toUpperCase()}"
BOTTOM: "${character.displayName || character.name}"

=== FINISH ===
${isMoses ? 'Divine shimmer finish' : 'Darker, troubled aesthetic'}.
`.trim();

    return prompt;
  },

  // Export plague data for use by other scripts
  PLAGUE_IMAGERY
};

export default plagueCardTemplate;
