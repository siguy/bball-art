#!/usr/bin/env node
/**
 * Prizm Silver Card Template
 * Based on Panini Prizm "Silver" parallel
 *
 * Signature look: Clean geometric patterns, silver shimmer,
 * modern minimalist design, prismatic light effects.
 */

import { generatePoseBlock, generateSoloPoseBlock } from '../components/poses.js';

export const prizmSilverTemplate = {
  id: "prizm-silver",
  name: "Prizm Silver",
  era: "2010s",

  /**
   * Generate the full prompt for a Prizm Silver card
   */
  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const interaction = options.interaction || pairing.defaultInteraction || "side-by-side";
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
A vertical premium basketball card in 3:4 aspect ratio, styled after Panini Prizm "Silver" parallel cards.

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
- Style: Clean modern rendering with silver/prismatic highlights

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Wearing: ${figureClothing}
- Style: Classical artistic interpretation with modern silver accents, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

INTERACTION: Modern legends with timeless connection, clean and powerful.

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card. This ensures names at bottom align with their figures.

=== BACKGROUND ===
Clean geometric Prizm pattern with:
- Silver and white gradient base
- Subtle geometric diamond/prizm patterns
- Prismatic light refraction effects (rainbow shimmer)
- Clean lines and modern minimalist aesthetic
- Soft silver glow around figures
- The signature Prizm "shattered glass" light effect

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "PRIZM" in clean modern sans-serif font - silver/chrome with prismatic rainbow edge effect. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in silver with subtle prismatic shimmer. Smaller than the title.

BOTTOM: Write "${player.name} & ${figure.displayName}" in clean silver text with subtle prismatic effect. Modern minimalist typography.

=== FINISH ===
Silver prizm finish with rainbow light refraction. Clean, modern, premium parallel card aesthetic. The card should shimmer like a real Prizm Silver parallel.
`.trim();

    return prompt;
  },

  /**
   * Generate a solo character card (single player or figure)
   */
  generateSolo(character, options = {}) {
    const isPlayer = character.type === 'player';
    const pose = character.pose;
    const jersey = options.jersey || { base: 'red', accent: 'white' };

    const poseBlock = generateSoloPoseBlock(character.name, pose, character.type);

    let characterDescription;
    if (isPlayer) {
      characterDescription = `
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: PLAIN SOLID ${jersey.base.toUpperCase()} basketball tank top and shorts with ${jersey.accent} trim. COMPLETELY BLANK uniform.
- Style: Clean modern rendering with silver/prismatic highlights
`.trim();
    } else {
      const figureClothing = character.clothing || `${character.visualStyle} robes and garments`;
      characterDescription = `
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${figureClothing}
- Style: Classical artistic interpretation with modern silver accents, biblical period accurate
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}
`.trim();
    }

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled after Panini Prizm "Silver" parallel cards.

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER CARD - Only ONE figure on this card
2. ${isPlayer ? `The basketball player's jersey AND SHORTS must be COMPLETELY BLANK - solid ${jersey.base} color only with ${jersey.accent} trim` : 'Biblical figure in period-accurate attire'}
3. DO NOT add any team names, NBA logos, or brand marks
4. The figure must have exactly TWO ARMS
5. This is STYLIZED ART for a collectible card, not a photograph

${poseBlock}

=== CHARACTER DESCRIPTION ===

${characterDescription}

=== COMPOSITION ===
SOLO CARD: ${character.name} is the ONLY figure on this card.
- Character should be CENTERED and DOMINANT
- Show FULL BODY from head to feet - character fills 70-80% of card height
- Leave space around the figure so the action pose has room to breathe
- DO NOT crop at the knees or waist - we need to see the full athletic form
- Clean, modern pose - a legend with timeless presence

=== BACKGROUND ===
Clean geometric Prizm pattern with:
- Silver and white gradient base
- Subtle geometric diamond/prizm patterns
- Prismatic light refraction effects (rainbow shimmer)
- Clean lines and modern minimalist aesthetic
- Soft silver glow around figure
- The signature Prizm "shattered glass" light effect

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "PRIZM" in clean modern sans-serif font - silver/chrome with prismatic rainbow edge effect. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in silver with subtle prismatic shimmer.

BOTTOM: Write "${character.displayName || character.name}" in clean silver text with subtle prismatic effect. Centered at bottom.

=== FINISH ===
Silver prizm finish with rainbow light refraction. Clean, modern, premium parallel card aesthetic. The card should shimmer like a real Prizm Silver parallel.
`.trim();

    return prompt;
  }
};

export default prizmSilverTemplate;
