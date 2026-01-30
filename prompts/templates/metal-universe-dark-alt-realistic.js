#!/usr/bin/env node
/**
 * Metal Universe: Dark Alt Realistic Template (TEST)
 * Color test variant - Light Green & Purple
 * MORE REALISTIC figure rendering
 */

import { generatePoseBlock } from '../components/poses.js';

function generateVillainPoseBlock(poseId, playerName, figureName, figureAttribute) {
  const poses = {
    "simultaneous-action": {
      name: "Simultaneous Action",
      description: "Both figures performing devastating attacks in chrome glory",
      playerPose: "mid-powerful dunk with explosive force, arms in dominant athletic motion, fierce intensity on face, muscles gleaming like chrome",
      figurePoseWithAttribute: "performing devastating attack - thrusting weapon with lethal intent, battle cry on face",
      figurePoseNoAttribute: "arms raised in powerful gesture of destruction",
      energy: "chrome devastation, metallic fury, twin engines of destruction"
    }
  };

  const pose = poses[poseId] || poses["simultaneous-action"];
  const hasAttribute = !!figureAttribute;

  return `
=== INTERACTION: ${pose.name.toUpperCase()} (VILLAIN VARIANT) ===
Overall: ${pose.description}
Energy/Mood: ${pose.energy}

${playerName.toUpperCase()} POSE:
${pose.playerPose}

${figureName.toUpperCase()} POSE:
${hasAttribute ? pose.figurePoseWithAttribute.replace('their weapon', figureAttribute) : pose.figurePoseNoAttribute}
`.trim();
}

export const metalUniverseDarkAltRealisticTemplate = {
  id: "metal-universe-dark-alt-realistic",
  name: "Metal Universe: Dark Alt Realistic",
  era: "1990s",

  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const interaction = options.interaction || "simultaneous-action";

    // TEST COLOR SCHEME: Light green and purple
    const testColors = {
      base: "deep purple",
      accent: "light green"
    };

    const figureAttribute = figure.attributeDescription || figure.attribute;
    const poseBlock = generateVillainPoseBlock(interaction, player.name, figure.name, figureAttribute);
    const figureClothing = figure.clothing || `${figure.visualStyle} robes and garments`;

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled after 1997-98 Fleer Metal Universe insert set - DARK VILLAIN EDITION.

=== ART STYLE: REALISTIC ===
Render the figures in a REALISTIC, detailed style - NOT cartoonish or stylized. Think high-end digital painting with realistic proportions, detailed facial features, realistic skin textures, and accurate anatomy. Similar to premium sports card illustrations or concept art - grounded in realism but with dramatic lighting and atmosphere.

=== CRITICAL REQUIREMENTS ===
1. The basketball player's jersey AND SHORTS must be COMPLETELY BLANK - solid ${testColors.base} color only with ${testColors.accent} trim, like an unlabeled practice uniform
2. The shorts are PLAIN SOLID ${testColors.base.toUpperCase()} FABRIC - NO diamond shape, NO logo, NO emblem, NO symbol, NO design whatsoever
3. DO NOT add any team names, NBA logos, Nike swoosh, Jordan logo, or any brand marks
4. DO NOT add any numbers, letters, or symbols to the jersey or shorts
5. All figures must have exactly TWO ARMS
6. REALISTIC RENDERING - detailed, proportionate, NOT cartoonish
7. VILLAIN CARD - expressions should be SINISTER, MENACING, or INTIMIDATING

${poseBlock}

=== FIGURE DESCRIPTIONS ===

${player.name.toUpperCase()}:
- Physical: ${player.physicalDescription}
- Expression: MENACING - cold ruthless stare, fierce battle intensity, or intimidating glare
- Wearing: PLAIN SOLID ${testColors.base.toUpperCase()} basketball tank top and shorts with ${testColors.accent.toUpperCase()} trim. The uniform is COMPLETELY BLANK - solid color fabric only. NO logos, NO diamonds, NO symbols of any kind.
- Style: REALISTIC detailed rendering - accurate facial features, realistic muscle definition, natural skin texture with metallic lighting highlights in LIGHT GREEN and PURPLE tones

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Expression: FIERCE - battle rage, cruel determination, terrifying war face
- Wearing: ${figureClothing}
- Style: REALISTIC classical figure - detailed armor/clothing textures, realistic facial features, accurate anatomy, metallic accents in LIGHT GREEN and PURPLE
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

INTERACTION: Realistically rendered titans with an eerie green-purple glow. Dramatic but grounded.

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card.

The two figures should be LARGE and PROMINENT, filling most of the card's vertical space. Dynamic action pose with explosive energy.

=== BACKGROUND ===
DARK industrial environment with LIGHT GREEN and DEEP PURPLE as dominant colors. Chrome and steel surfaces reflecting neon green and purple light. Toxic/radioactive aesthetic - like a villain's lair. Green plasma and purple energy crackling. Dark smoke with green and purple highlights. The entire scene has a sinister sci-fi quality.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "METAL UNIVERSE" in bold chrome 3D metallic font with LIGHT GREEN and PURPLE reflections. Add "DARK" in smaller text below. Centered at top.

LOGO: Below the title, render the "Court & Covenant" logo in BRIGHT SHINY GOLD with subtle glow effect. IMPORTANT: Keep the logo SMALL - approximately 15-20% of the card width, subtle and elegant, NOT dominant.

BOTTOM: Write "${player.name} & ${figure.displayName}" in chrome gradient text with green-purple highlights. Industrial premium typography.

=== FINISH ===
Reflective chrome card finish with light green and purple color cast throughout. Premium villain Metal Universe aesthetic.
`.trim();

    return prompt;
  }
};

export default metalUniverseDarkAltRealisticTemplate;
