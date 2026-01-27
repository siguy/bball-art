#!/usr/bin/env node
/**
 * Metal Universe: Dark Template
 * Villain variant of the Metal Universe card
 *
 * Key differences from standard:
 * - Black chrome, burnt metal, rust red accents
 * - Sinister expressions and menacing energy
 * - Dark industrial hellscape aesthetic
 * - Same premium metallic quality, villain energy
 */

import { generatePoseBlock } from '../components/poses.js';

/**
 * Generate villain-specific pose block with sinister expressions
 */
function generateVillainPoseBlock(poseId, playerName, figureName, figureAttribute, customActions = null) {
  const poses = {
    "back-to-back": {
      name: "Back to Back",
      description: "Standing back-to-back, chrome titans of destruction",
      playerPose: "standing tall with arms crossed confidently over chest, looking over shoulder with cold menacing stare",
      figurePoseWithAttribute: "standing tall with back to partner, one hand gripping their weapon raised threateningly, other hand clenched",
      figurePoseNoAttribute: "standing tall with arms crossed, facing opposite direction with ruthless expression",
      energy: "chrome villains, industrial menace, unstoppable metal titans"
    },
    "simultaneous-action": {
      name: "Simultaneous Action",
      description: "Both figures performing devastating attacks in chrome glory",
      playerPose: "mid-powerful dunk with explosive force, arms in dominant athletic motion, fierce intensity on face, muscles gleaming like chrome",
      figurePoseWithAttribute: "performing devastating attack - thrusting weapon with lethal intent, battle cry on face",
      figurePoseNoAttribute: "arms raised in powerful gesture of destruction",
      energy: "chrome devastation, metallic fury, twin engines of destruction"
    },
    "side-by-side": {
      name: "Side by Side",
      description: "Standing together as chrome overlords",
      playerPose: "powerful stance, arms crossed or fists clenched, intimidating glare",
      figurePoseWithAttribute: "commanding stance, weapon held ready, cold calculating expression",
      figurePoseNoAttribute: "commanding stance, arms at sides, menacing presence",
      energy: "chrome warlords, industrial dominance, metal overlords"
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

export const metalUniverseDarkTemplate = {
  id: "metal-universe-dark",
  name: "Metal Universe: Dark",
  era: "1990s",

  /**
   * Generate the full prompt for a villain Metal Universe card
   */
  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const interaction = options.interaction || "simultaneous-action";

    // Villain color scheme - dark chrome
    const villainColors = {
      base: "black",
      accent: "dark crimson"
    };

    // Get the figure's attribute for the pose system
    const figureAttribute = figure.attributeDescription || figure.attribute;

    // Generate the villain interaction block
    const poseBlock = generateVillainPoseBlock(
      interaction,
      player.name,
      figure.name,
      figureAttribute
    );

    // Biblical figure clothing
    const figureClothing = figure.clothing || `${figure.visualStyle} robes and garments`;

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled after 1997-98 Fleer Metal Universe insert set - DARK VILLAIN EDITION.

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
- Expression: MENACING - cold ruthless stare, fierce battle intensity, or intimidating glare
- Wearing: PLAIN SOLID ${villainColors.base.toUpperCase()} basketball tank top and shorts with ${villainColors.accent.toUpperCase()} trim. The uniform is COMPLETELY BLANK - solid color fabric only. NO logos, NO diamonds, NO symbols of any kind.
- Style: Stylized artistic rendering with DARK chrome/gunmetal metallic highlights, skin gleaming like blackened steel

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Expression: FIERCE - battle rage, cruel determination, terrifying war face
- Wearing: ${figureClothing}
- Style: Classical figure rendered with dark metallic/black chrome accents, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

INTERACTION: Chrome titans of destruction, dark metal gods, industrial nightmares made flesh.

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card. This ensures names at bottom align with their figures.

The two figures should be LARGE and PROMINENT, filling most of the card's vertical space. Dynamic action pose with explosive energy.

=== BACKGROUND ===
DARK industrial hellscape. Black chrome and burnt steel environment. Gunmetal surfaces with blood-red reflections. Rust, sparks, and molten metal dripping. Deep BLACK and CRIMSON color scheme with dark metallic sheen throughout. Apocalyptic forge aesthetic. Dark smoke and ember particles. The entire scene has a DARK liquid metal quality - like chrome dipped in shadow.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "METAL UNIVERSE" in bold BLACK CHROME 3D metallic font with blood-red reflections and industrial feel. Looks like blackened steel. Add "DARK" in smaller crimson text below. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in BRIGHT SHINY GOLD with subtle glow effect. Smaller than the title.

BOTTOM: Write "${player.name} & ${figure.displayName}" in dark chrome gradient text with crimson highlights. Industrial premium typography.

=== FINISH ===
Dark reflective gunmetal chrome card finish. Everything has a blackened polished metal quality with red reflections. Premium villain Metal Universe aesthetic.
`.trim();

    return prompt;
  }
};

export default metalUniverseDarkTemplate;
