#!/usr/bin/env node
/**
 * Kaboom Card Template
 * Based on Panini "Kaboom!" insert set
 *
 * Signature look: Comic book/pop art style, hand-drawn aesthetic,
 * bold colors, action lines, explosive energy.
 */

import { generatePoseBlock } from '../components/poses.js';

export const kaboomTemplate = {
  id: "kaboom",
  name: "Kaboom!",
  era: "2010s",

  /**
   * Generate the full prompt for a Kaboom card
   */
  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const interaction = options.interaction || pairing.defaultInteraction || "simultaneous-action";
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
A vertical premium basketball card in 3:4 aspect ratio, styled after Panini "Kaboom!" insert set - COMIC BOOK STYLE.

=== CRITICAL REQUIREMENTS ===
1. COMIC BOOK / POP ART illustration style - bold outlines, flat colors, hand-drawn aesthetic
2. The basketball player's jersey AND SHORTS must be COMPLETELY BLANK - solid ${jersey.base} color only with ${jersey.accent} trim
3. The shorts are PLAIN SOLID ${jersey.base.toUpperCase()} FABRIC - NO logo, NO emblem, NO symbol
4. DO NOT add any team names, NBA logos, or brand marks
5. All figures must have exactly TWO ARMS
6. This is COMIC BOOK ART, not realistic rendering

${poseBlock}

=== FIGURE DESCRIPTIONS ===

${player.name.toUpperCase()}:
- Physical: ${player.physicalDescription}
- Wearing: PLAIN SOLID ${jersey.base.toUpperCase()} basketball tank top and shorts with ${jersey.accent} trim. COMPLETELY BLANK uniform.
- Style: COMIC BOOK style with bold black outlines, cel-shaded coloring, dynamic pose

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Wearing: ${figureClothing}
- Style: COMIC BOOK style with bold outlines, hand-drawn look, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

INTERACTION: Explosive comic book action, dynamic energy between the legends.

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card. This ensures names at bottom align with their figures.

=== BACKGROUND ===
Bold comic book style background with:
- Bright solid color blocks (yellow, orange, red)
- "KABOOM!" style action lines radiating outward
- Ben-Day dots pattern (like vintage comics)
- Explosive starburst shapes
- Pop art aesthetic with high contrast colors

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "KABOOM!" in bold comic book style font - chunky letters with black outline and bright yellow fill. Explosive comic lettering. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in gold with comic-style outline. Smaller than the title.

BOTTOM: Write "${player.name} & ${figure.displayName}" in bold comic book font with black outline. Fun, energetic typography.

=== FINISH ===
Matte comic book print quality. The entire card should look like it was ripped from a superhero comic. Bold, fun, collectible.
`.trim();

    return prompt;
  }
};

export default kaboomTemplate;
