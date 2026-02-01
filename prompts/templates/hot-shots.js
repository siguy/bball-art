#!/usr/bin/env node
/**
 * Hot Shots Card Template
 * Based on 1996-97 Flair Showcase "Hot Shots" die-cut insert set
 *
 * Key features:
 * - Flames and basketball radiating outward
 * - Fire gradient (red → orange → yellow → white-hot)
 * - Black void simulating die-cut edges
 * - High-gloss 90s premium finish
 */

import { generatePoseBlock, generateSoloPoseBlock } from '../components/poses.js';

export const hotShotsTemplate = {
  id: "hot-shots",
  name: "Hot Shots",
  era: "1990s",

  /**
   * Generate the full prompt for a Hot Shots card
   */
  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const interaction = options.interaction || pairing.defaultInteraction || "back-to-back";
    const colorScheme = options.colorScheme || "primary";

    // Get jersey colors based on scheme
    const jerseyColors = player.jerseyColors || { primary: { base: "red", accent: "white" }, secondary: { base: "white", accent: "red" } };
    const jersey = jerseyColors[colorScheme] || jerseyColors.primary;

    // Get the figure's attribute for the pose system
    const figureAttribute = figure.attributeDescription || figure.attribute;

    // Check for custom actions
    const customActions = (options.customPlayerAction && options.customFigureAction)
      ? { playerAction: options.customPlayerAction, figureAction: options.customFigureAction }
      : null;

    // Generate the interaction block FIRST - this is the single source of truth for poses
    const poseBlock = generatePoseBlock(
      interaction,
      player.name,
      figure.name,
      figureAttribute,
      customActions
    );

    // Biblical figure clothing (already defined in data)
    const figureClothing = figure.clothing || `${figure.visualStyle} robes and garments`;

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled after 1996-97 Flair Showcase "Hot Shots" die-cut insert set.

=== CRITICAL REQUIREMENTS ===
1. The basketball player's jersey AND SHORTS must be COMPLETELY BLANK - solid ${jersey.base} color only with ${jersey.accent} trim, like an unlabeled practice uniform
2. The shorts are PLAIN SOLID ${jersey.base.toUpperCase()} FABRIC - NO diamond shape, NO logo, NO emblem, NO symbol, NO design whatsoever
3. DO NOT add any team names, NBA logos, Nike swoosh, Jordan logo, or any brand marks
4. DO NOT add any numbers, letters, or symbols to the jersey or shorts
5. All figures must have exactly TWO ARMS
6. This is STYLIZED ART for a collectible card, not a photograph

${poseBlock}

=== FIGURE DESCRIPTIONS ===

${player.name.toUpperCase()}:
- Physical: ${player.physicalDescription}
- Wearing: PLAIN SOLID ${jersey.base.toUpperCase()} basketball tank top and shorts with ${jersey.accent} trim. The uniform is COMPLETELY BLANK - solid color fabric only. NO logos, NO diamonds, NO symbols of any kind.
- Style: Stylized artistic rendering, recognizable likeness but NOT photorealistic

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Wearing: ${figureClothing}
- Style: Classical artistic interpretation, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card. This ensures names at bottom align with their figures.

The two figures should be LARGE and PROMINENT, filling most of the card's vertical space. Show them from approximately knee-level up, making them the dominant visual element.

=== BACKGROUND ===
DRAMATIC FIRE BACKGROUND: An ORANGE BASKETBALL at the center with FLAMES radiating outward in all directions. The fire gradient flows from white-hot center through bright yellow, orange, to deep red at the edges.

The card edges fade to BLACK VOID, simulating a die-cut effect where flames meet darkness. Flames should appear to burst around and behind the figures, creating an "on fire" intensity.

NO cosmic elements, NO stars, NO nebulae - this is PURE FIRE AND HEAT.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "HOT SHOTS" in bold, dramatic font with FIRE GRADIENT (red at bottom, orange in middle, yellow at top). Letters should have a slight 3D bevel and appear to glow with heat. Subtle fire wisps around the letters.

LOGO: Below the title, render the provided "Court & Covenant" logo image VERY SMALL (about 1/4 the width of the title) in BRIGHT ORANGE with subtle fire glow effect. Keep the logo CRISP and SHARP - no blur.

BOTTOM: Write "${player.name} & ${figure.displayName}" in bold WHITE text with ORANGE GLOW outline. Clean 90s sports card typography with a fiery edge.

=== FINISH ===
High-gloss premium finish with the intensity of a 90s insert card. The flames should have depth and dimensionality, like looking through glass at real fire.
`.trim();

    return prompt;
  },

  /**
   * Generate a solo character card (single player or figure)
   * @param {object} character - Character data { type, name, physicalDescription, pose, ... }
   * @param {object} options - { darkMode, hairColor, jersey }
   */
  generateSolo(character, options = {}) {
    const isPlayer = character.type === 'player';
    const pose = character.pose;

    // Generate the pose block
    const poseBlock = generateSoloPoseBlock(character.name, pose, character.type);

    // Jersey colors for players
    const jersey = options.jersey || { base: 'red', accent: 'white' };

    // Character description section
    let characterDescription;
    if (isPlayer) {
      characterDescription = `
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: PLAIN SOLID ${jersey.base.toUpperCase()} basketball tank top and shorts with ${jersey.accent} trim. The uniform is COMPLETELY BLANK - solid color fabric only. NO logos, NO diamonds, NO symbols of any kind.
- Style: Stylized artistic rendering, recognizable likeness but NOT photorealistic
`.trim();
    } else {
      const figureClothing = character.clothing || `${character.visualStyle} robes and garments`;
      characterDescription = `
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${figureClothing}
- Style: Classical artistic interpretation, biblical period accurate
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}
`.trim();
    }

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled after 1996-97 Flair Showcase "Hot Shots" die-cut insert set.

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER CARD - Only ONE figure on this card
2. ${isPlayer ? `The basketball player's jersey AND SHORTS must be COMPLETELY BLANK - solid ${jersey.base} color only with ${jersey.accent} trim` : 'Biblical figure in period-accurate attire'}
3. ${isPlayer ? 'The shorts are PLAIN SOLID FABRIC - NO diamond shape, NO logo, NO emblem, NO symbol, NO design whatsoever' : 'Classical artistic interpretation'}
4. DO NOT add any team names, NBA logos, Nike swoosh, Jordan logo, or any brand marks
5. The figure must have exactly TWO ARMS
6. This is STYLIZED ART for a collectible card, not a photograph

${poseBlock}

=== CHARACTER DESCRIPTION ===

${characterDescription}

=== COMPOSITION ===
SOLO CARD: ${character.name} is the ONLY figure on this card.
- Character should be CENTERED and DOMINANT
- Show FULL BODY from head to feet - character fills 70-80% of card height
- Leave space around the figure so the action pose has room to breathe
- DO NOT crop at the knees or waist - we need to see the full athletic form
- Dynamic pose with the character as the dominant visual element

=== BACKGROUND ===
DRAMATIC FIRE BACKGROUND: An ORANGE BASKETBALL at the center with FLAMES radiating outward in all directions. The fire gradient flows from white-hot center through bright yellow, orange, to deep red at the edges.

The card edges fade to BLACK VOID, simulating a die-cut effect where flames meet darkness. Flames should appear to burst around and behind the figure, creating an "on fire" intensity.

NO cosmic elements, NO stars, NO nebulae - this is PURE FIRE AND HEAT.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "HOT SHOTS" in bold, dramatic font with FIRE GRADIENT (red at bottom, orange in middle, yellow at top). Letters should have a slight 3D bevel and appear to glow with heat. Subtle fire wisps around the letters.

LOGO: Below the title, render the provided "Court & Covenant" logo image VERY SMALL (about 1/4 the width of the title) in BRIGHT ORANGE with subtle fire glow effect. Keep the logo CRISP and SHARP - no blur.

BOTTOM: Write "${character.displayName || character.name}" in bold WHITE text with ORANGE GLOW outline. Clean 90s sports card typography with a fiery edge, centered at bottom.

=== FINISH ===
High-gloss premium finish with the intensity of a 90s insert card. The flames should have depth and dimensionality, like looking through glass at real fire.
`.trim();

    return prompt;
  }
};

export default hotShotsTemplate;
