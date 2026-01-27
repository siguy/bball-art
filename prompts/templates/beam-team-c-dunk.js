#!/usr/bin/env node
/**
 * Beam Team Card Template - Option C with Power Dunk
 *
 * Holographic Prism borders with specific rim-rocking dunk action
 */

import { generatePoseBlock } from '../components/poses.js';

export const beamTeamCDunkTemplate = {
  id: "beam-team-c-dunk",
  name: "Beam Team (Prism Dunk)",
  era: "1990s",

  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const colorScheme = options.colorScheme || "primary";

    const jerseyColors = player.jerseyColors || { primary: { base: "red", accent: "white" }, secondary: { base: "white", accent: "red" } };
    const jersey = jerseyColors[colorScheme] || jerseyColors.primary;

    const figureAttribute = figure.attributeDescription || figure.attribute;
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

=== INTERACTION: POWER DUNK ===
Overall: Explosive parallel displays of overwhelming physical dominance
Energy/Mood: Raw power, unstoppable force, earth-shaking impact

${player.name.toUpperCase()} POSE:
MID-AIR RIM-ROCKING DUNK - Both hands gripping the basketball above the rim, body elevated and powerful, about to SLAM the ball through the hoop with devastating force. Muscles tensed, face intense with effort, the moment of maximum power before the dunk rocks the rim. This is a THUNDEROUS two-handed power dunk.

${figure.name.toUpperCase()} POSE:
${figureAttribute ? `Thrusting ${figureAttribute} forward with tremendous force, muscles straining, in a parallel display of overwhelming power` : 'Arms raised in powerful gesture of dominance'}

=== FIGURE DESCRIPTIONS ===

${player.name.toUpperCase()}:
- Physical: ${player.physicalDescription}
- Wearing: PLAIN SOLID ${jersey.base.toUpperCase()} basketball tank top and shorts with ${jersey.accent} trim. The uniform is COMPLETELY BLANK - solid color fabric only. NO logos, NO symbols of any kind.
- Style: Stylized artistic rendering with prismatic light reflections
- ACTION: Explosive rim-rocking two-handed dunk, at the peak of the slam

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Wearing: ${figureClothing}
- Style: Classical artistic interpretation, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card.

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
TOP: Write "BEAM TEAM" in HOLOGRAPHIC CHROME font - silver base with rainbow prismatic reflection. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in iridescent gold with prismatic shimmer. Smaller than the title.

BOTTOM: Write "${player.name} & ${figure.displayName}" in silver holographic text with rainbow edge effect. Premium typography.

=== FINISH ===
Ultra-premium holographic card finish. The prismatic borders should look like real holographic/refractor cards - shimmering rainbow light through crystal. Most collectible, premium aesthetic.
`.trim();

    return prompt;
  }
};

export default beamTeamCDunkTemplate;
