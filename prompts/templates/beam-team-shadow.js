#!/usr/bin/env node
/**
 * Beam Team: Shadow Spectrum Template
 * Villain variant of the Beam Team card
 *
 * Key differences from standard:
 * - Purple & red dark prism spectrum (no rainbow)
 * - Sinister expressions
 * - Corruption elements: cracks, smoke, embers
 * - Dark crystalline corruption aesthetic
 */

import { generatePoseBlock } from '../components/poses.js';

function generateVillainPoseBlock(poseId, playerName, figureName, figureAttribute) {
  const poses = {
    "back-to-back": {
      name: "Back to Back",
      description: "Standing back-to-back, facing outward with menacing confidence",
      playerPose: "standing tall with arms crossed confidently over chest, looking over shoulder with sinister smirk",
      figurePoseWithAttribute: "standing tall with back to partner, one hand gripping their weapon raised threateningly, other hand clenched",
      figurePoseNoAttribute: "standing tall with arms crossed, facing opposite direction with cold expression",
      energy: "corrupted alliance, dark partnership, villains united in shadow"
    },
    "simultaneous-action": {
      name: "Simultaneous Action",
      description: "Both figures performing devastating attacks surrounded by corrupted light",
      playerPose: "mid-powerful dunk or drive with explosive force, fierce intensity on face, body surrounded by dark energy",
      figurePoseWithAttribute: "performing devastating attack - weapon raised with lethal intent, battle fury on face",
      figurePoseNoAttribute: "arms raised in powerful gesture of destruction",
      energy: "corrupted power unleashed, shadow spectrum fury, dark prism devastation"
    },
    "side-by-side": {
      name: "Side by Side",
      description: "Standing together as dark overlords",
      playerPose: "powerful stance, arms crossed or fists clenched, intimidating glare",
      figurePoseWithAttribute: "commanding stance, weapon held ready, cold calculating expression",
      figurePoseNoAttribute: "commanding stance, menacing presence",
      energy: "shadow lords, corrupted champions, dark spectrum rulers"
    }
  };

  const pose = poses[poseId] || poses["simultaneous-action"];
  const hasAttribute = !!figureAttribute;

  return `
=== INTERACTION: ${pose.name.toUpperCase()} (SHADOW SPECTRUM) ===
Overall: ${pose.description}
Energy/Mood: ${pose.energy}

${playerName.toUpperCase()} POSE:
${pose.playerPose}

${figureName.toUpperCase()} POSE:
${hasAttribute ? pose.figurePoseWithAttribute.replace('their weapon', figureAttribute) : pose.figurePoseNoAttribute}
`.trim();
}

export const beamTeamShadowTemplate = {
  id: "beam-team-shadow",
  name: "Beam Team: Shadow Spectrum",
  era: "1990s",

  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const interaction = options.interaction || "simultaneous-action";

    // Villain color scheme - purple & red
    const villainColors = {
      base: "deep purple",
      accent: "blood red"
    };

    const figureAttribute = figure.attributeDescription || figure.attribute;
    const poseBlock = generateVillainPoseBlock(interaction, player.name, figure.name, figureAttribute);
    const figureClothing = figure.clothing || `${figure.visualStyle} robes and garments`;

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled after 1992-93 Stadium Club "Beam Team" insert - SHADOW SPECTRUM VILLAIN EDITION.

=== CRITICAL REQUIREMENTS ===
1. The basketball player's jersey AND SHORTS must be COMPLETELY BLANK - solid ${villainColors.base} color only with ${villainColors.accent} trim, like an unlabeled practice uniform
2. The shorts are PLAIN SOLID ${villainColors.base.toUpperCase()} FABRIC - NO diamond shape, NO logo, NO emblem, NO symbol, NO design whatsoever
3. DO NOT add any team names, NBA logos, Nike swoosh, Jordan logo, or any brand marks
4. DO NOT add any numbers, letters, or symbols to the jersey or shorts
5. All figures must have exactly TWO ARMS
6. This is STYLIZED ART for a collectible card, not a photograph
7. VILLAIN CARD - expressions should be SINISTER, MENACING, or INTIMIDATING

${poseBlock}

=== FIGURE DESCRIPTIONS ===

${player.name.toUpperCase()}:
- Physical: ${player.physicalDescription}
- Expression: SINISTER - menacing smirk, cold ruthless stare, or fierce intimidating glare
- Wearing: PLAIN SOLID ${villainColors.base.toUpperCase()} basketball tank top and shorts with ${villainColors.accent.toUpperCase()} trim. The uniform is COMPLETELY BLANK - solid color fabric only. NO logos, NO symbols of any kind.
- Style: Stylized artistic rendering with DARK prismatic light reflections in purple and red

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Expression: MENACING - battle rage, cruel confidence, terrifying intensity
- Wearing: ${figureClothing}
- Style: Classical artistic interpretation with corrupted dark energy, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card.

=== CARD FRAME DESIGN (SHADOW SPECTRUM) ===
LEFT AND RIGHT BORDERS: Wide CORRUPTED PRISM borders on BOTH sides of the card:
- DARK SPECTRUM only: DEEP PURPLE, BLOOD RED, BLACK, DARK CRIMSON
- NO rainbow colors - only the sinister purple-red-black spectrum
- "Shattered dark crystal" effect - like looking through a corrupted prism
- Geometric crystalline facets catching DARK light
- The borders shimmer with OMINOUS holographic effect
- Approximately 18% of card width on each side - PROMINENT borders

=== CORRUPTION ELEMENTS (CRITICAL) ===
Add these visual corruption effects throughout the card:
- CRACKS: Fine fracture lines spreading across the card surface like shattered glass or corrupted crystal
- SMOKE: Wisps of dark smoke or shadow curling around the figures and rising from below
- EMBERS: Floating ember particles and small sparks of red/orange drifting upward
- The corruption elements should feel like the card itself is being consumed by dark energy

CENTER: The two figures occupy the center against a DEEP BLACK corrupted arena with cracked floor, subtle smoke rising, and floating embers.

=== LIGHTING (CRITICAL) ===
LIGHT PURPLE SPOTLIGHT: The figures are illuminated by a bright LIGHT PURPLE/LAVENDER spotlight from above. This spotlight:
- Brightly lights the figures so they POP against the dark background
- Creates dramatic rim lighting on their edges
- Gives skin and clothing a luminous quality
- Keeps the scene dark overall but makes the FIGURES clearly visible and vibrant
- The purple light should feel like arena spotlights hitting the subjects

DARK LIGHT REFRACTION: Sinister purple and red prismatic rays extend from the corrupted borders, adding to the purple lighting on the figures.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "BEAM TEAM" in BRIGHT CHROME font - highly reflective silver/white chrome that POPS against the dark background, with purple and red prismatic reflections. Very bright and eye-catching. Add "SHADOW SPECTRUM" in smaller crimson text below. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in BRIGHT SHINY GOLD with subtle glow effect. Smaller than the title.

BOTTOM: Write "${player.name} & ${figure.displayName}" in BRIGHT CHROME text - highly reflective silver/white that stands out boldly. Premium villain typography with strong visibility.

=== FINISH ===
Ultra-premium DARK holographic card finish. The corrupted prismatic borders should shimmer with sinister purple-red-black spectrum. Cracks, smoke, and embers add to the corrupted villain aesthetic.
`.trim();

    return prompt;
  }
};

export default beamTeamShadowTemplate;
