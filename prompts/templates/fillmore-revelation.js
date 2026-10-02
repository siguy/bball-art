#!/usr/bin/env node
/**
 * Fillmore Revelation Card Template
 * Based on 1960s San Francisco concert posters (Wes Wilson, Victor Moscoso)
 * fused with Ezekiel's visions.
 *
 * Signature look: melting hand-lettered type, vibrating op-art rings,
 * clashing saturated color, and Ezekiel's "wheels within wheels."
 * Built for the "Can These Bones Live?" collection (Ezekiel 37) - the
 * dry-bones-to-life motif is part of the background, so the theme and
 * the visuals come from the same prophet.
 */

import { generatePoseBlock } from '../components/poses.js';

export const fillmoreRevelationTemplate = {
  id: "fillmore-revelation",
  name: "Fillmore Revelation",
  era: "1960s",

  /**
   * Generate the full prompt for a Fillmore Revelation card
   */
  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const interaction = options.interaction || pairing.defaultInteraction || "simultaneous-action";
    const colorScheme = options.colorScheme || "primary";

    const jerseyColors = player.jerseyColors || { primary: { base: "royal blue", accent: "orange" } };
    const jersey = jerseyColors[colorScheme] || jerseyColors.primary;

    const figureAttribute = figure.attributeDescription || figure.attribute;

    const customActions = (options.customPlayerAction && options.customFigureAction)
      ? { playerAction: options.customPlayerAction, figureAction: options.customFigureAction }
      : null;

    const poseBlock = generatePoseBlock(
      interaction,
      player.name,
      figure.name,
      figureAttribute,
      customActions
    );

    const figureClothing = figure.clothing || `${figure.visualStyle} robes and garments`;

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled as a 1967 San Francisco psychedelic concert poster - FILLMORE POSTER ART meets biblical prophecy.

=== CRITICAL REQUIREMENTS ===
1. PSYCHEDELIC POSTER ILLUSTRATION - hand-drawn, flat saturated inks, flowing organic linework. NOT a photograph, NOT realistic 3D rendering
2. The basketball player's jersey AND SHORTS must be COMPLETELY BLANK - solid ${jersey.base} color only with ${jersey.accent} trim
3. The shorts are PLAIN SOLID ${jersey.base.toUpperCase()} FABRIC - NO logo, NO emblem, NO number, NO symbol
4. DO NOT add any team names, NBA logos, or brand marks
5. All figures must have exactly TWO ARMS
6. Faces and bodies stay clear and readable - the psychedelia lives in the background, the light, and the edges, never melting the faces

${poseBlock}

=== FIGURE DESCRIPTIONS ===

${player.name.toUpperCase()}:
- Physical: ${player.physicalDescription}
- Wearing: PLAIN SOLID ${jersey.base.toUpperCase()} basketball tank top and shorts with ${jersey.accent} trim. COMPLETELY BLANK uniform.
- Style: poster-art illustration with bold flowing contour lines, rim-lit by glowing magenta and acid-green light

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Wearing: ${figureClothing}
- Attribute: ${figureAttribute}
- Style: poster-art illustration with bold flowing contour lines, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

INTERACTION: Two legends sharing one cosmic vision - the energy between them ripples outward into the background like sound waves.

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card. This ensures names at bottom align with their figures.
Both figures shown full body or three-quarter body, large and dominant, filling most of the card height.

=== BACKGROUND (EZEKIEL'S VISION) ===
- Behind the figures: Ezekiel's "wheels within wheels" - enormous concentric rings spinning in opposite directions, their rims covered in watchful eyes, radiating like a giant op-art mandala
- Vibrating op-art concentric bands in clashing colors that seem to pulse and shimmer
- Color palette: deep electric orange and royal blue as the base, clashing with hot magenta, acid green, and violet - saturated, vibrating, 1960s ink-on-paper
- At the bottom: a valley of dry white bones coming back to life - bones reassembling and sprouting flowers, vines, and color as they rise
- A melting, wavy silhouette of a city skyline at the horizon line, dripping into the color bands
- Paisley swirls and flowing art-nouveau curves fill the margins

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "CAN THESE BONES LIVE?" in classic 1960s Fillmore poster lettering - swelling, melting, warped letterforms that stretch to fill the space, bright orange letters with a vibrating blue outline. Centered at top. Spell it exactly.

LOGO: Below the title, render the provided "Court & Covenant" logo image small, in gold.

BOTTOM: Write "${player.name} & ${figure.displayName}" in flowing psychedelic hand-lettering, legible, centered at the bottom.

=== FINISH ===
Screen-printed concert poster texture - slight ink misregistration, flat saturated inks, faint paper grain, a subtle iridescent sheen. The card should look like a collectible gig poster from the Summer of Love that prophesied a championship.
`.trim();

    return prompt;
  }
};

export default fillmoreRevelationTemplate;
