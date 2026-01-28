#!/usr/bin/env node
/**
 * Thunder & Lightning: Dark Side Template
 * Villain variant of the classic Thunder & Lightning card
 *
 * Key differences from standard:
 * - Crimson, black, and blood-red color palette
 * - Sinister expressions and menacing energy
 * - Darker cosmic background with ominous elements
 * - Same premium quality, villain energy
 *
 * FIXED: Now properly uses custom poses from pose database
 */

/**
 * Generate villain-specific pose block
 * CRITICAL: Uses customActions when provided (for pose database integration)
 */
function generateVillainPoseBlock(poseId, playerName, figureName, figureAttribute, customActions = null) {
  // IF CUSTOM ACTIONS PROVIDED, USE THEM (pose database integration)
  if (customActions && customActions.playerAction && customActions.figureAction) {
    return `
=== INTERACTION: CUSTOM POSE (VILLAIN VARIANT) ===
Overall: ${playerName} and ${figureName} in signature poses
Energy/Mood: ${customActions.energy || 'overwhelming villain energy, dark power unleashed'}

${playerName.toUpperCase()} POSE:
${customActions.playerAction}

${figureName.toUpperCase()} POSE:
${customActions.figureAction}
`.trim();
  }

  // Default villain poses (fallback when no custom actions)
  const poses = {
    "back-to-back": {
      name: "Back to Back",
      description: "Standing back-to-back, facing outward with menacing confidence",
      playerPose: "standing tall with arms crossed confidently over chest, looking over shoulder with a sinister smirk",
      figurePoseWithAttribute: "standing tall with back to partner, one hand gripping their weapon raised threateningly, other hand clenched in a fist",
      figurePoseNoAttribute: "standing tall with arms crossed, facing opposite direction with cold, calculating expression",
      energy: "menacing alliance, dangerous partnership, villains united"
    },
    "simultaneous-action": {
      name: "Simultaneous Action",
      description: "Both figures performing their signature moves with devastating force",
      playerPose: "mid-action basketball move - powerful dunk or aggressive drive, arms in dominant athletic motion, face showing fierce intensity",
      figurePoseWithAttribute: "performing devastating action with weapon raised, lethal intent visible",
      figurePoseNoAttribute: "arms raised in powerful gesture of destruction",
      energy: "overwhelming force, unstoppable destruction, twin terrors unleashed"
    }
  };

  const pose = poses[poseId] || poses["back-to-back"];
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

export const thunderLightningDarkTemplate = {
  id: "thunder-lightning-dark",
  name: "Thunder & Lightning: Dark Side",
  era: "1990s",

  /**
   * Generate the full prompt for a villain Thunder & Lightning card
   */
  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const interaction = options.interaction || pairing.defaultInteraction || "back-to-back";

    // Villain color scheme - override any player colors
    const villainColors = {
      base: "black",
      accent: "crimson red"
    };

    // Get the figure's attribute for the pose system
    const figureAttribute = figure.attributeDescription || figure.attribute;

    // Build custom actions from options (CRITICAL FIX: actually pass these!)
    const customActions = (options.customPlayerAction && options.customFigureAction)
      ? {
          playerAction: options.customPlayerAction,
          figureAction: options.customFigureAction,
          energy: options.customEnergy || null
        }
      : null;

    // Generate the villain interaction block WITH custom actions
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
A vertical premium basketball card in 3:4 aspect ratio, styled after 1993-94 Fleer Ultra "Thunder & Lightning" insert set - VILLAIN EDITION.

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
- Wearing: PLAIN SOLID ${villainColors.base.toUpperCase()} basketball tank top and shorts with ${villainColors.accent.toUpperCase()} trim. The uniform is COMPLETELY BLANK - solid color fabric only. NO logos, NO diamonds, NO symbols of any kind.
- Style: Stylized artistic rendering, recognizable likeness but NOT photorealistic

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Expression: MENACING - fierce battle rage, cruel confidence, or terrifying intensity
- Wearing: ${figureClothing}
- Style: Classical artistic interpretation, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card. This ensures names at bottom align with their figures.

The two figures should be LARGE and PROMINENT, filling most of the card's vertical space. Show them from approximately knee-level up, making them the dominant visual element.

=== BACKGROUND ===
DARK ominous gradient of deep BLACK and BLOOD RED, with sinister crimson nebulae and dark cosmic dust. BLOOD-RED lightning bolts crackling ominously across the scene. Hints of dark purple in the shadows. The background should feel THREATENING but not overpower the figures.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "THUNDER & LIGHTNING" in bold, CRIMSON RED, 1990s-style sans-serif font with dark metallic sheen and black drop shadow. Add subtle text: "DARK SIDE" in smaller silver text below. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image SMALL (about 1/3 the width of the title) in BRIGHT SHINY GOLD with subtle glow effect.

BOTTOM: Write "${player.name} & ${figure.displayName}" in silver text with subtle metallic shine. Clean 90s sports card typography.

=== FINISH ===
High-gloss refractor finish with holographic light-bending effect in red/black spectrum. Premium 1990s insert card feel with sinister edge.
`.trim();

    return prompt;
  },

  /**
   * Generate a solo character card (single player or figure) - VILLAIN EDITION
   * @param {object} character - Character data { type, name, physicalDescription, pose, ... }
   * @param {object} options - { hairColor, jersey }
   */
  generateSolo(character, options = {}) {
    const isPlayer = character.type === 'player';
    const pose = character.pose;

    // Villain color scheme
    const villainColors = { base: "black", accent: "crimson red" };

    // Generate the pose block
    const poseBlock = `
=== ${isPlayer ? 'BASKETBALL LEGEND' : 'BIBLICAL FIGURE'} POSE (VILLAIN) ===
${character.name.toUpperCase()}:
${pose.prompt}

Energy/Mood: ${pose.energy}
`.trim();

    // Character description section
    let characterDescription;
    if (isPlayer) {
      characterDescription = `
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Expression: SINISTER - intimidating stare, menacing smirk, or cold ruthless gaze
- Wearing: PLAIN SOLID ${villainColors.base.toUpperCase()} basketball tank top and shorts with ${villainColors.accent.toUpperCase()} trim. The uniform is COMPLETELY BLANK - solid color fabric only. NO logos, NO diamonds, NO symbols of any kind.
- Style: Stylized artistic rendering, recognizable likeness but NOT photorealistic
`.trim();
    } else {
      const figureClothing = character.clothing || `${character.visualStyle} robes and garments`;
      characterDescription = `
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Expression: MENACING - fierce battle rage, cruel confidence, or terrifying intensity
- Wearing: ${figureClothing}
- Style: Classical artistic interpretation, biblical period accurate
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}
`.trim();
    }

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled after 1993-94 Fleer Ultra "Thunder & Lightning" insert set - VILLAIN EDITION.

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER CARD - Only ONE figure on this card
2. ${isPlayer ? `The basketball player's jersey AND SHORTS must be COMPLETELY BLANK - solid ${villainColors.base} color only with ${villainColors.accent} trim` : 'Biblical figure in period-accurate attire'}
3. ${isPlayer ? 'The shorts are PLAIN SOLID FABRIC - NO diamond shape, NO logo, NO emblem, NO symbol, NO design whatsoever' : 'Classical artistic interpretation'}
4. DO NOT add any team names, NBA logos, Nike swoosh, Jordan logo, or any brand marks
5. The figure must have exactly TWO ARMS
6. This is STYLIZED ART for a collectible card, not a photograph
7. VILLAIN CARD - expression should be SINISTER, MENACING, or INTIMIDATING

${poseBlock}

=== CHARACTER DESCRIPTION ===

${characterDescription}

=== COMPOSITION ===
SOLO CARD: ${character.name} is the ONLY figure on this card.
- Character should be CENTERED and DOMINANT
- Show FULL BODY from head to feet - character fills 70-80% of card height
- Leave space around the figure so the action pose has room to breathe
- DO NOT crop at the knees or waist - we need to see the full athletic form
- Dynamic pose showcasing their villainous presence

=== BACKGROUND ===
DARK ominous gradient of deep BLACK and BLOOD RED, with sinister crimson nebulae and dark cosmic dust. BLOOD-RED lightning bolts crackling ominously across the scene. Hints of dark purple in the shadows. The background should feel THREATENING but not overpower the figure.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "THUNDER & LIGHTNING" in bold, CRIMSON RED, 1990s-style sans-serif font with dark metallic sheen and black drop shadow. Add subtle text: "DARK SIDE" in smaller silver text below. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image SMALL (about 1/3 the width of the title) in BRIGHT SHINY GOLD with subtle glow effect.

BOTTOM: Write "${character.displayName || character.name}" in silver text with subtle metallic shine. Clean 90s sports card typography, centered at bottom.

=== FINISH ===
High-gloss refractor finish with holographic light-bending effect in red/black spectrum. Premium 1990s insert card feel with sinister edge.
`.trim();

    return prompt;
  }
};

export default thunderLightningDarkTemplate;
