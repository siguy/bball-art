#!/usr/bin/env node
/**
 * Downtown Card Template
 * Based on Panini Donruss Optic "Downtown" insert set
 *
 * Signature look: City skyline background, neon colors,
 * urban aesthetic, night scene with bright lights.
 */

import { generatePoseBlock } from '../components/poses.js';

export const downtownTemplate = {
  id: "downtown",
  name: "Downtown",
  era: "2010s",

  /**
   * Generate the full prompt for a Downtown card
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
A vertical premium basketball card in 3:4 aspect ratio, styled after Panini Donruss Optic "Downtown" insert set.

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
- Style: Stylized artistic rendering with neon lighting effects

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Wearing: ${figureClothing}
- Style: Classical artistic interpretation with urban neon aesthetic, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

INTERACTION: Urban legends standing tall against the city skyline.

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card. This ensures names at bottom align with their figures.

=== BACKGROUND ===
Nighttime city skyline with:
- Stylized skyscrapers and buildings in silhouette
- Neon lights in pink, blue, purple, and orange
- City lights twinkling in windows
- Gradient sky from deep purple to dark blue
- Urban atmosphere with slight fog/haze
- The city represents their domain/kingdom

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "DOWNTOWN" in neon-style font - glowing letters in bright pink or blue with neon tube effect. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in neon gold with glow effect. Smaller than the title.

BOTTOM: Write "${player.name} & ${figure.displayName}" in clean white text with subtle neon glow. Modern premium typography.

=== FINISH ===
Glossy modern card finish with subtle holographic elements. Urban premium collectible aesthetic.
`.trim();

    return prompt;
  }
};

export default downtownTemplate;
