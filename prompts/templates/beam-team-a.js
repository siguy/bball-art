#!/usr/bin/env node
/**
 * Beam Team Card Template - Option A: Classic 1992-93 Faithful
 *
 * True to original: Silver/holographic angled laser beam borders
 * on both sides with light-refracting prismatic patterns.
 */

import { generatePoseBlock } from '../components/poses.js';

export const beamTeamATemplate = {
  id: "beam-team-a",
  name: "Beam Team (Classic)",
  era: "1990s",

  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const interaction = options.interaction || pairing.defaultInteraction || "side-by-side";
    const colorScheme = options.colorScheme || "primary";

    const jerseyColors = player.jerseyColors || { primary: { base: "red", accent: "white" }, secondary: { base: "white", accent: "red" } };
    const jersey = jerseyColors[colorScheme] || jerseyColors.primary;

    const figureAttribute = figure.attributeDescription || figure.attribute;

    const poseBlock = generatePoseBlock(
      interaction,
      player.name,
      figure.name,
      figureAttribute
    );

    const figureClothing = figure.clothing || `${figure.visualStyle} robes and garments`;

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled after 1992-93 Stadium Club "Beam Team" insert set.

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
- Style: Stylized artistic rendering with dramatic lighting

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Wearing: ${figureClothing}
- Style: Classical artistic interpretation, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

=== CARD FRAME DESIGN (CRITICAL) ===
LEFT AND RIGHT BORDERS: Thick SILVER HOLOGRAPHIC LASER BEAM borders running vertically along BOTH sides of the card. These borders are:
- Angled/diagonal silver metallic beams layered on top of each other
- Light-refracting PRISMATIC RAINBOW shimmer effect within the silver
- Multiple parallel laser lines creating a geometric pattern
- The beams should look like shiny silver foil with holographic rainbow reflections
- Approximately 15% of card width on each side

CENTER: The two figures occupy the center of the card against a PURE BLACK arena background with subtle floor reflection.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "BEAM TEAM" in bold CHROME/SILVER metallic font with light reflection. Centered at top, above the figures.

LOGO: Below the title, render the provided "Court & Covenant" logo image in gold. Smaller than the title.

BOTTOM: A BURNT ORANGE horizontal bar with a basketball icon. Write "${player.name} & ${figure.displayName}" in white text on the orange bar.

=== FINISH ===
High-gloss premium card finish. The silver laser borders should shimmer like real holographic foil cards from the early 90s.
`.trim();

    return prompt;
  }
};

export default beamTeamATemplate;
