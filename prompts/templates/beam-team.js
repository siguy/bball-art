#!/usr/bin/env node
/**
 * Beam Team Card Template
 * Based on 1992-93 Stadium Club "Beam Team" insert set
 *
 * Signature look: Wide HOLOGRAPHIC PRISM borders on both sides,
 * rainbow light refraction through crystal shapes, dark arena center.
 */

import { generatePoseBlock, generateSoloPoseBlock } from '../components/poses.js';

export const beamTeamTemplate = {
  id: "beam-team",
  name: "Beam Team",
  era: "1990s",

  /**
   * Generate the full prompt for a Beam Team card
   */
  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const interaction = options.interaction || pairing.defaultInteraction || "side-by-side";
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

    // Generate the interaction block
    const poseBlock = generatePoseBlock(
      interaction,
      player.name,
      figure.name,
      figureAttribute,
      customActions
    );

    // Biblical figure clothing
    const figureClothing = figure.clothing || `${figure.visualStyle} robes and garments`;

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled after 1992-93 Stadium Club "Beam Team" insert with HOLOGRAPHIC PRISM borders.

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
- Wearing: PLAIN SOLID ${jersey.base.toUpperCase()} basketball tank top and shorts with ${jersey.accent} trim. The uniform is COMPLETELY BLANK - solid color fabric only. NO logos, NO symbols of any kind.
- Style: Stylized artistic rendering with prismatic light reflections

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Wearing: ${figureClothing}
- Style: Classical artistic interpretation, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card. This ensures names at bottom align with their figures.

=== CARD FRAME DESIGN (CRITICAL) ===
LEFT AND RIGHT BORDERS: Wide HOLOGRAPHIC PRISM borders on BOTH sides of the card:
- Light refracting through CRYSTAL/PRISM shapes
- Full RAINBOW SPECTRUM colors (red, orange, yellow, green, blue, purple) shimmering
- "Shattered light" effect like looking through a prism or diamond
- Geometric crystalline facets catching and splitting light
- The borders shimmer with iridescent holographic rainbow effect
- Approximately 18% of card width on each side - PROMINENT borders

CENTER: The two figures occupy the center against a DEEP BLACK arena background with subtle reflective floor.

LIGHT REFRACTION: Subtle prismatic light rays extend slightly from the borders into the center, catching on the figures.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Text reading "BEAM TEAM" in silver chrome lettering with holographic rainbow shimmer effect. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in iridescent gold with prismatic shimmer. Smaller than the title.

BOTTOM: Write "${player.name} & ${figure.displayName}" in silver holographic text with rainbow edge effect. Premium typography.

=== FINISH ===
Ultra-premium holographic card finish. The prismatic borders should look like real holographic/refractor cards - shimmering rainbow light through crystal. Most collectible, premium aesthetic.
`.trim();

    return prompt;
  },

  /**
   * Generate a solo character card (single player or figure)
   */
  generateSolo(character, options = {}) {
    const isPlayer = character.type === 'player';
    const pose = character.pose;
    const jersey = options.jersey || { base: 'red', accent: 'white' };

    const poseBlock = generateSoloPoseBlock(character.name, pose, character.type);

    let characterDescription;
    if (isPlayer) {
      characterDescription = `
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: PLAIN SOLID ${jersey.base.toUpperCase()} basketball tank top and shorts with ${jersey.accent} trim. COMPLETELY BLANK uniform.
- Style: Stylized artistic rendering with prismatic light reflections
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
A vertical premium basketball card in 3:4 aspect ratio, styled after 1992-93 Stadium Club "Beam Team" insert with HOLOGRAPHIC PRISM borders.

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER CARD - Only ONE figure on this card
2. ${isPlayer ? `The basketball player's jersey AND SHORTS must be COMPLETELY BLANK - solid ${jersey.base} color only with ${jersey.accent} trim` : 'Biblical figure in period-accurate attire'}
3. DO NOT add any team names, NBA logos, or brand marks
4. The figure must have exactly TWO ARMS
5. This is STYLIZED ART for a collectible card, not a photograph

${poseBlock}

=== CHARACTER DESCRIPTION ===

${characterDescription}

=== COMPOSITION ===
SOLO CARD: ${character.name} is the ONLY figure on this card.
- Character should be CENTERED and DOMINANT
- Show FULL BODY from head to feet - character fills 70-80% of card height
- Leave space around the figure so the action pose has room to breathe
- DO NOT crop at the knees or waist - we need to see the full athletic form

=== CARD FRAME DESIGN (CRITICAL) ===
LEFT AND RIGHT BORDERS: Wide HOLOGRAPHIC PRISM borders on BOTH sides of the card:
- Light refracting through CRYSTAL/PRISM shapes
- Full RAINBOW SPECTRUM colors (red, orange, yellow, green, blue, purple) shimmering
- "Shattered light" effect like looking through a prism or diamond
- Geometric crystalline facets catching and splitting light
- Approximately 18% of card width on each side

CENTER: The figure occupies the center against a DEEP BLACK arena background with subtle reflective floor.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Text reading "BEAM TEAM" in silver chrome lettering with holographic rainbow shimmer effect. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in iridescent gold with prismatic shimmer.

BOTTOM: Write "${character.displayName || character.name}" in silver holographic text with rainbow edge effect. Centered at bottom.

=== FINISH ===
Ultra-premium holographic card finish. The prismatic borders should look like real holographic/refractor cards.
`.trim();

    return prompt;
  }
};

export default beamTeamTemplate;
