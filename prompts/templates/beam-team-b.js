#!/usr/bin/env node
/**
 * Beam Team Card Template - Option B: Enhanced Laser Frame
 *
 * Modernized with bright neon laser beams (cyan, magenta, white)
 * framing both sides. Dynamic, glowing, energetic.
 */

import { generatePoseBlock } from '../components/poses.js';

export const beamTeamBTemplate = {
  id: "beam-team-b",
  name: "Beam Team (Neon)",
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
A vertical premium basketball card in 3:4 aspect ratio, styled after 1992-93 Stadium Club "Beam Team" insert set with NEON enhancement.

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
- Style: Stylized artistic rendering with neon lighting accents

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Wearing: ${figureClothing}
- Style: Classical artistic interpretation, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

=== CARD FRAME DESIGN (CRITICAL) ===
LEFT AND RIGHT BORDERS: Bright NEON LASER BEAM borders running vertically along BOTH sides of the card:
- GLOWING neon beams in CYAN, MAGENTA, and WHITE colors
- Multiple parallel laser lines pulsing with energy
- Beams appear to glow and radiate light into the dark center
- Slight geometric angles - beams curve or angle dynamically
- Electric, energetic feel like a laser light show
- Approximately 15% of card width on each side

CENTER: The two figures occupy the center against a DARK BLACK background with subtle laser grid pattern on the floor.

LASER GRID: Faint cyan/magenta grid lines on the ground, like a Tron-style digital floor.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "BEAM TEAM" in NEON GLOWING font - cyan or magenta with bright glow effect. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in neon gold with glow. Smaller than the title.

BOTTOM: Write "${player.name} & ${figure.displayName}" in bright white text with subtle neon glow. Clean modern typography.

=== FINISH ===
High-gloss premium card finish. The neon borders should appear to glow and pulse with energy. Early 90s laser show meets modern neon aesthetic.
`.trim();

    return prompt;
  }
};

export default beamTeamBTemplate;
