#!/usr/bin/env node
/**
 * Hot Shots Card Template
 * Based on 1996-97 Flair Showcase "Hot Shots" die-cut insert set
 *
 * Key features:
 * - Large Spalding-style basketball (60-70% of card)
 * - Left-to-right gradient: yellow (5%) → orange (15%) → red (80%)
 * - Irregular flame-shaped die-cut on top/sides, straight bottom with curved corners
 * - Very thin black hairline at die-cut edge, white exterior beyond
 * - Gold script "Hot Shots" in top corner, names curve along ball edge
 * - Logo at bottom center
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
7. All figures must be FULLY VISIBLE - no body parts cut off by the die-cut edge

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
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card.

The two figures are positioned IN FRONT OF a large basketball, which serves as both background element and visual anchor. Figures should be prominent but not obscure the ball entirely - they frame it or stand before it.

FIGURE PLACEMENT: Both figures must be FULLY CONTAINED within the die-cut boundary. Keep a safe margin from all edges - no arms, legs, heads, or clothing should extend into the die-cut zone. The irregular flame edges should frame empty background/gradient space, never cutting through the figures.

=== BACKGROUND ===
DOMINANT BASKETBALL: A large SPALDING-STYLE BASKETBALL fills 60-70% of the card, positioned centrally. The ball is the focal point - orange leather with black seam lines, rendered in detail.

GRADIENT: A flat horizontal gradient spans the ENTIRE card background from left to right:
- LEFT EDGE: YELLOW (5% of card width)
- CENTER-LEFT to CENTER: ORANGE (15% of card width)
- CENTER to RIGHT EDGE: DEEP RED (80% of card width)

This is a FLAT color wash across the background - NOT radiating from the ball, NOT surrounding the ball. The basketball sits ON TOP of this gradient, not inside it. There should be NO yellow glow or halo around the ball.

DIE-CUT EDGE: The card has an IRREGULAR, JAGGED die-cut border on the TOP and SIDES - flame-like shapes, asymmetrical and dynamic. The BOTTOM edge is STRAIGHT and EVEN with gently CURVED CORNERS.

The die-cut has THREE layers from inside to outside:
1. Card content (gradient/ball/figures)
2. VERY THIN BLACK HAIRLINE tracing the irregular edge (1-2 pixels, barely visible)
3. Pure WHITE exterior beyond the cut

The black line is a HAIRLINE - extremely thin, just enough to define the edge. The contrast of gradient → hairline black → white exterior makes the die-cut crisp.

IMPORTANT: The die-cut is UNEVEN on top and sides only. Bottom is a clean straight edge with rounded corners, like a traditional card base.

=== TEXT ELEMENTS (render exactly as specified) ===
TITLE: Write "Hot Shots" in elegant GOLD SCRIPT font, positioned in the TOP CORNER (left or right, whichever balances the composition). The script should be cursive and stylish, with a subtle shine. NOT centered, NOT across the full top.

NAMES: Write "${player.name}" and "${figure.displayName}" in SLIM GOLD CHARACTERS that curve ALONG THE EDGE OF THE BASKETBALL. The names follow the circular contour of the ball. Elegant, thin lettering that complements the ball's shape.

LOGO: At the BOTTOM CENTER of the card, render the "Court & Covenant" logo SMALL in GOLD. Keep it crisp, positioned along the straight bottom edge.

=== FINISH ===
High-gloss premium finish with the intensity of a 90s insert card.
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
7. The figure must be FULLY VISIBLE - no body parts cut off by the die-cut edge

${poseBlock}

=== CHARACTER DESCRIPTION ===

${characterDescription}

=== COMPOSITION ===
SOLO CARD: ${character.name} is the ONLY figure on this card.
- Character is positioned IN FRONT OF the large basketball
- Show FULL BODY from head to feet
- Dynamic pose with the character as the dominant visual element
- The basketball serves as background anchor behind the figure

FIGURE PLACEMENT: The figure must be FULLY CONTAINED within the die-cut boundary. Keep a safe margin from all edges - no arms, legs, head, or clothing should extend into the die-cut zone. The irregular flame edges should frame empty background/gradient space, never cutting through the figure.

=== BACKGROUND ===
DOMINANT BASKETBALL: A large SPALDING-STYLE BASKETBALL fills 60-70% of the card, positioned centrally behind the figure. The ball is the focal point - orange leather with black seam lines, rendered in detail.

GRADIENT: A flat horizontal gradient spans the ENTIRE card background from left to right:
- LEFT EDGE: YELLOW (5% of card width)
- CENTER-LEFT to CENTER: ORANGE (15% of card width)
- CENTER to RIGHT EDGE: DEEP RED (80% of card width)

This is a FLAT color wash across the background - NOT radiating from the ball, NOT surrounding the ball. The basketball sits ON TOP of this gradient, not inside it. There should be NO yellow glow or halo around the ball.

DIE-CUT EDGE: The card has an IRREGULAR, JAGGED die-cut border on the TOP and SIDES - flame-like shapes, asymmetrical and dynamic. The BOTTOM edge is STRAIGHT and EVEN with gently CURVED CORNERS.

The die-cut has THREE layers from inside to outside:
1. Card content (gradient/ball/figure)
2. VERY THIN BLACK HAIRLINE tracing the irregular edge (1-2 pixels, barely visible)
3. Pure WHITE exterior beyond the cut

The black line is a HAIRLINE - extremely thin, just enough to define the edge. The contrast of gradient → hairline black → white exterior makes the die-cut crisp.

IMPORTANT: The die-cut is UNEVEN on top and sides only. Bottom is a clean straight edge with rounded corners, like a traditional card base.

=== TEXT ELEMENTS (render exactly as specified) ===
TITLE: Write "Hot Shots" in elegant GOLD SCRIPT font, positioned in the TOP CORNER (left or right, whichever balances the composition). The script should be cursive and stylish, with a subtle shine. NOT centered, NOT across the full top.

NAME: Write "${character.displayName || character.name}" in SLIM GOLD CHARACTERS that curve ALONG THE EDGE OF THE BASKETBALL. The name follows the circular contour of the ball. Elegant, thin lettering that complements the ball's shape.

LOGO: At the BOTTOM CENTER of the card, render the "Court & Covenant" logo SMALL in GOLD. Keep it crisp, positioned along the straight bottom edge.

=== FINISH ===
High-gloss premium finish with the intensity of a 90s insert card.
`.trim();

    return prompt;
  }
};

export default hotShotsTemplate;
