#!/usr/bin/env node
/**
 * Thunder & Lightning Card Template (v6)
 * Based on 1993-94 Fleer Ultra insert set
 *
 * Key improvements:
 * - Stylized cartoon art style (not photorealistic)
 * - Toned down nebula saturation
 * - Stronger anti-logo language for shorts
 * - Interaction-First Architecture (prevents three-arm problem)
 */

import { generatePoseBlock } from '../components/poses.js';

export const thunderLightningTemplate = {
  id: "thunder-lightning",
  name: "Thunder & Lightning",
  era: "1990s",

  /**
   * Generate the full prompt for a Thunder & Lightning card
   */
  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const interaction = options.interaction || pairing.defaultInteraction || "back-to-back";
    const colorScheme = options.colorScheme || "primary";

    const bgColors = options.bgColors || {
      primary: "deep purple",
      secondary: "electric blue"
    };

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
A vertical premium basketball card in 3:4 aspect ratio, styled after 1993-94 Fleer Ultra "Thunder & Lightning" insert set.

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

INTERACTION: confident, united, powerful allies. The two figures are connected by the composition, energy flowing between them.

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card. This ensures names at bottom align with their figures.

The two figures should be LARGE and PROMINENT, filling most of the card's vertical space. Show them from approximately knee-level up, making them the dominant visual element.

=== BACKGROUND ===
Muted electric gradient of deep purple and blue, with subtle nebulae and cosmic dust. White-hot electric lightning bolts arcing across the scene. The background should not overpower the figures.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "THUNDER & LIGHTNING" in bold, white, 1990s-style sans-serif font with metallic sheen and subtle drop shadow. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image SMALL (about 1/3 the width of the title) in BRIGHT SHINY GOLD with glow effect.

BOTTOM: Write "${player.name} & ${figure.displayName}" in silver text with subtle metallic shine. Clean 90s sports card typography, not overly chrome or exaggerated.

=== FINISH ===
High-gloss refractor finish with holographic light-bending effect. Premium 1990s insert card feel.
`.trim();

    return prompt;
  }
};

export default thunderLightningTemplate;
