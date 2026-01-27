#!/usr/bin/env node
/**
 * Metal Universe Card Template
 * Based on 1997-98 Fleer Metal Universe insert set
 *
 * Signature look: Chrome/metallic finish, industrial aesthetic,
 * futuristic sci-fi elements, highly reflective surfaces.
 */

import { generatePoseBlock } from '../components/poses.js';

export const metalUniverseTemplate = {
  id: "metal-universe",
  name: "Metal Universe",
  era: "1990s",

  /**
   * Generate the full prompt for a Metal Universe card
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
A vertical premium basketball card in 3:4 aspect ratio, styled after 1997-98 Fleer Metal Universe insert set.

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
- Style: Stylized artistic rendering with chrome/metallic highlights on skin and uniform

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Wearing: ${figureClothing}
- Style: Classical figure rendered with metallic/chrome accents, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

INTERACTION: powerful allies rendered in chrome and metal, futuristic legends.

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card. This ensures names at bottom align with their figures.

=== BACKGROUND ===
Industrial chrome and steel environment. Polished metal surfaces with reflections. Geometric patterns of rivets and panels. Deep blue and silver color scheme with metallic sheen throughout. Sci-fi futuristic aesthetic. Chrome pipes and machinery silhouettes. The entire scene has a liquid metal quality.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "METAL UNIVERSE" in bold chrome/silver 3D metallic font with strong reflections and industrial feel. Looks like polished steel. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in chrome/silver metallic finish with reflective quality. Smaller than the title.

BOTTOM: Write "${player.name} & ${figure.displayName}" in chrome gradient text with 3D metallic effect. Industrial premium typography.

=== FINISH ===
Highly reflective chrome card finish. Everything has a polished metal quality. Premium 1990s Metal Universe insert card aesthetic.
`.trim();

    return prompt;
  }
};

export default metalUniverseTemplate;
