#!/usr/bin/env node
/**
 * Downtown Dark Card Template
 * Villain variant of the Downtown card
 *
 * Key differences from standard:
 * - Green and purple neon color palette
 * - Sinister expressions
 * - Subtle smoke/haze for urban corruption vibe
 * - Neon green title with purple "DARK" subtitle
 * - Sinister green crescent moon in sky
 * - Maintains vibrant urban energy with villain twist
 */

import { generatePoseBlock, generateSoloPoseBlock } from '../components/poses.js';

/**
 * Generate villain-specific pose block
 * Uses customActions when provided (for pose database integration)
 */
function generateVillainPoseBlock(poseId, playerName, figureName, figureAttribute, customActions = null) {
  // IF CUSTOM ACTIONS PROVIDED, USE THEM (pose database integration)
  if (customActions && customActions.playerAction && customActions.figureAction) {
    return `
=== INTERACTION: CUSTOM POSE (DOWNTOWN DARK) ===
Overall: ${playerName} and ${figureName} in signature poses
Energy/Mood: ${customActions.energy || 'menacing urban legends, rulers of the night city'}

${playerName.toUpperCase()} POSE:
${customActions.playerAction}

${figureName.toUpperCase()} POSE:
${customActions.figureAction}
`.trim();
  }

  // Default villain poses (fallback when no custom actions)
  const poses = {
    "side-by-side": {
      name: "Side by Side",
      description: "Standing together as dark rulers of the urban night",
      playerPose: "powerful stance with arms crossed or fists clenched, intimidating glare directed at viewer",
      figurePoseWithAttribute: "commanding stance, weapon held ready, cold calculating expression surveying the city",
      figurePoseNoAttribute: "commanding stance with arms crossed, menacing presence dominating the scene",
      energy: "urban overlords, dark city legends, rulers of the night"
    },
    "back-to-back": {
      name: "Back to Back",
      description: "Standing back-to-back against the neon skyline, facing outward with menacing confidence",
      playerPose: "standing tall with arms crossed over chest, looking over shoulder with sinister smirk",
      figurePoseWithAttribute: "standing tall with back to partner, one hand gripping their weapon raised threateningly",
      figurePoseNoAttribute: "standing tall with arms crossed, facing opposite direction with cold expression",
      energy: "dangerous alliance, villains united against the city"
    },
    "simultaneous-action": {
      name: "Simultaneous Action",
      description: "Both figures performing devastating moves against the urban backdrop",
      playerPose: "mid-action basketball move - powerful dunk or aggressive drive, fierce intensity, arms in dominant motion",
      figurePoseWithAttribute: "performing devastating action with weapon raised, lethal intent visible",
      figurePoseNoAttribute: "arms raised in powerful gesture of destruction",
      energy: "urban destruction, night terrors unleashed, city under siege"
    }
  };

  const pose = poses[poseId] || poses["side-by-side"];
  const hasAttribute = !!figureAttribute;

  return `
=== INTERACTION: ${pose.name.toUpperCase()} (DOWNTOWN DARK) ===
Overall: ${pose.description}
Energy/Mood: ${pose.energy}

${playerName.toUpperCase()} POSE:
${pose.playerPose}

${figureName.toUpperCase()} POSE:
${hasAttribute ? pose.figurePoseWithAttribute.replace('their weapon', figureAttribute) : pose.figurePoseNoAttribute}
`.trim();
}

export const downtownDarkTemplate = {
  id: "downtown-dark",
  name: "Downtown Dark",
  era: "2010s",

  /**
   * Generate the full prompt for a Downtown Dark card
   */
  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const interaction = options.interaction || pairing.defaultInteraction || "side-by-side";

    // Villain color scheme - green and purple
    const villainColors = {
      base: "deep purple",
      accent: "neon green"
    };

    // Get the figure's attribute for the pose system
    const figureAttribute = figure.attributeDescription || figure.attribute;

    // Check for custom actions
    const customActions = (options.customPlayerAction && options.customFigureAction)
      ? {
          playerAction: options.customPlayerAction,
          figureAction: options.customFigureAction,
          energy: options.customEnergy || null
        }
      : null;

    // Generate the villain interaction block
    const poseBlock = generateVillainPoseBlock(
      interaction,
      player.name,
      figure.name,
      figureAttribute,
      customActions
    );

    // Biblical figure clothing
    const figureClothing = figure.clothing || `${figure.visualStyle} robes and garments`;

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled after Panini Donruss Optic "Downtown" insert set - DARK VILLAIN EDITION.

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
- Expression: SINISTER - intimidating stare, menacing smirk, or cold ruthless gaze
- Wearing: PLAIN SOLID ${villainColors.base.toUpperCase()} basketball tank top and shorts with ${villainColors.accent.toUpperCase()} trim. The uniform is COMPLETELY BLANK - solid color fabric only. NO logos, NO symbols of any kind.
- Style: Stylized artistic rendering with neon green and purple lighting effects

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Expression: MENACING - fierce intensity, cruel confidence, or cold calculating stare
- Wearing: ${figureClothing}
- Style: Classical artistic interpretation with urban neon aesthetic, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

INTERACTION: Dark urban legends ruling the night city.

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card. This ensures names at bottom align with their figures.

=== BACKGROUND ===
Nighttime city skyline with DARK VILLAIN ATMOSPHERE:
- Stylized skyscrapers and buildings in dark silhouette
- Neon lights primarily in VIBRANT GREEN and DEEP PURPLE (with accents of black)
- City lights twinkling in windows - greens and purples dominating
- Gradient sky from deep black to dark purple
- SINISTER GREEN CRESCENT MOON in the sky - glowing eerie green, adding to the ominous villain atmosphere
- SUBTLE SMOKE/HAZE drifting through the scene - urban corruption vibe
- The city feels like it's under the figures' dark control
- Maintain the VIBRANT urban energy despite the villain theme

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "DOWNTOWN" in bold neon-style font - glowing letters in VIBRANT GREEN with neon tube effect, casting green light. Add "DARK" in smaller text below in BRIGHT PURPLE neon glow. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in BRIGHT SHINY GOLD with subtle glow effect. Smaller than the title.

BOTTOM: Write "${player.name} & ${figure.displayName}" in clean white text with subtle green/purple neon glow. Modern premium villain typography.

=== FINISH ===
Glossy modern card finish with holographic elements in green/purple spectrum. Urban premium collectible aesthetic with sinister edge.
`.trim();

    return prompt;
  },

  /**
   * Generate a solo character card (single player or figure) - DARK VILLAIN EDITION
   */
  generateSolo(character, options = {}) {
    const isPlayer = character.type === 'player';
    const pose = character.pose;

    // Villain color scheme
    const villainColors = { base: "deep purple", accent: "neon green" };

    const poseBlock = `
=== ${isPlayer ? 'BASKETBALL LEGEND' : 'BIBLICAL FIGURE'} POSE (DOWNTOWN DARK) ===
${character.name.toUpperCase()}:
${pose.prompt}

Energy/Mood: ${pose.energy}
`.trim();

    let characterDescription;
    if (isPlayer) {
      characterDescription = `
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Expression: SINISTER - intimidating stare, menacing smirk, or cold ruthless gaze
- Wearing: PLAIN SOLID ${villainColors.base.toUpperCase()} basketball tank top and shorts with ${villainColors.accent.toUpperCase()} trim. COMPLETELY BLANK uniform.
- Style: Stylized artistic rendering with neon green and purple lighting effects
`.trim();
    } else {
      const figureClothing = character.clothing || `${character.visualStyle} robes and garments`;
      characterDescription = `
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Expression: MENACING - fierce intensity, cruel confidence, or cold calculating stare
- Wearing: ${figureClothing}
- Style: Classical artistic interpretation with urban neon aesthetic, biblical period accurate
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}
`.trim();
    }

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled after Panini Donruss Optic "Downtown" insert set - DARK VILLAIN EDITION.

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER CARD - Only ONE figure on this card
2. ${isPlayer ? `The basketball player's jersey AND SHORTS must be COMPLETELY BLANK - solid ${villainColors.base} color only with ${villainColors.accent} trim` : 'Biblical figure in period-accurate attire'}
3. DO NOT add any team names, NBA logos, or brand marks
4. The figure must have exactly TWO ARMS
5. This is STYLIZED ART for a collectible card, not a photograph
6. VILLAIN CARD - expression should be SINISTER, MENACING, or INTIMIDATING

${poseBlock}

=== CHARACTER DESCRIPTION ===

${characterDescription}

=== COMPOSITION ===
SOLO CARD: ${character.name} is the ONLY figure on this card.
- Character should be CENTERED and DOMINANT
- Show FULL BODY from head to feet - character fills 70-80% of card height
- Leave space around the figure so the action pose has room to breathe
- DO NOT crop at the knees or waist - we need to see the full athletic form
- Dark urban legend commanding the night city

=== BACKGROUND ===
Nighttime city skyline with DARK VILLAIN ATMOSPHERE:
- Stylized skyscrapers and buildings in dark silhouette
- Neon lights primarily in VIBRANT GREEN and DEEP PURPLE
- City lights twinkling in windows - greens and purples dominating
- Gradient sky from deep black to dark purple
- SINISTER GREEN CRESCENT MOON in the sky - glowing eerie green, adding to the ominous villain atmosphere
- SUBTLE SMOKE/HAZE drifting through the scene
- Maintain VIBRANT urban energy despite the villain theme

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "DOWNTOWN" in bold neon-style font - glowing letters in VIBRANT GREEN with neon tube effect. Add "DARK" in smaller BRIGHT PURPLE neon glow below. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in BRIGHT SHINY GOLD with subtle glow effect.

BOTTOM: Write "${character.displayName || character.name}" in clean white text with subtle green/purple neon glow. Centered at bottom.

=== FINISH ===
Glossy modern card finish with holographic elements in green/purple spectrum. Urban premium collectible aesthetic with sinister edge.
`.trim();

    return prompt;
  }
};

export default downtownDarkTemplate;
