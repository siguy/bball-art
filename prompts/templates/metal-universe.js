#!/usr/bin/env node
/**
 * Metal Universe Card Template
 * Based on 1997-98 Fleer Metal Universe insert set
 *
 * Signature look: Chrome/metallic finish, industrial aesthetic,
 * futuristic sci-fi elements, highly reflective surfaces.
 */

import { generatePoseBlock, generateSoloPoseBlock } from '../components/poses.js';

export const metalUniverseTemplate = {
  id: "metal-universe",
  name: "Metal Universe",
  era: "1990s",

  /**
   * Generate the full prompt for a Metal Universe card
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
A vertical premium basketball card in 3:4 aspect ratio, styled after 1997-98 Fleer Metal Universe insert set.

=== CRITICAL REQUIREMENTS ===
1. **CHROME FIGURES**: ALL characters must be rendered as LIVING CHROME SCULPTURES - polished liquid metal skin, gleaming like chrome statues. This is the signature Metal Universe aesthetic. NOT normal human skin - METALLIC CHROME throughout.
2. The basketball player's jersey AND SHORTS must be COMPLETELY BLANK - solid ${jersey.base} color only with ${jersey.accent} trim, like an unlabeled practice uniform
3. The shorts are PLAIN SOLID ${jersey.base.toUpperCase()} FABRIC - NO diamond shape, NO logo, NO emblem, NO symbol, NO design whatsoever
4. DO NOT add any team names, NBA logos, Nike swoosh, Jordan logo, or any brand marks
5. DO NOT add any numbers, letters, or symbols to the jersey or shorts
6. All figures must have exactly TWO ARMS
7. ART STYLE: ILLUSTRATED trading card art - bold lines, stylized features, NOT photorealistic. Think 1990s premium insert card illustration style with dramatic lighting and comic book influence. Avoid photographic realism.

${poseBlock}

=== FIGURE DESCRIPTIONS ===

${player.name.toUpperCase()}:
- Physical: ${player.physicalDescription}
- Wearing: PLAIN SOLID ${jersey.base.toUpperCase()} basketball tank top and shorts with ${jersey.accent} trim. The uniform is COMPLETELY BLANK - solid color fabric only. NO logos, NO diamonds, NO symbols of any kind.
- CRITICAL STYLE: Render as LIVING CHROME SCULPTURE - skin has polished liquid metal sheen, muscles gleam like burnished steel, entire body reflects light like a chrome statue come to life. NOT normal human skin tones - METALLIC CHROME finish throughout.

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Wearing: ${figureClothing}
- CRITICAL STYLE: Render with CHROME METALLIC SKIN only - face, hands, and arms gleam like polished silver. BUT clothing should remain NATURAL period-accurate fabric with subtle metallic highlights/reflections from the environment. Skin = chrome, clothing = natural.
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card. This ensures names at bottom align with their figures.

=== BACKGROUND ===
Industrial chrome and steel environment. Polished metal surfaces with reflections. Geometric patterns of rivets and panels. Deep blue and silver color scheme with metallic sheen throughout. Sci-fi futuristic aesthetic. Chrome pipes and machinery silhouettes. The entire scene has a liquid metal quality.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "METAL UNIVERSE" in bold chrome/silver 3D metallic font - clean polished steel letters with strong reflections, industrial feel, premium 90s insert card typography. No dripping or melting effects. Centered at top.

LOGO: Below the title, render the "Court & Covenant" logo in SHINY GOLD metallic finish. IMPORTANT: Keep the logo SMALL - approximately 15-20% of the card width, subtle and elegant, NOT dominant. It should accent the title, not compete with it.

BOTTOM: Write "${player.name} & ${figure.displayName}" in chrome gradient text with 3D metallic effect. Industrial premium typography.

=== FINISH ===
Highly reflective chrome card finish. Everything has a polished metal quality. Premium 1990s Metal Universe insert card aesthetic.
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
- Style: Stylized artistic rendering with chrome/metallic highlights on skin and uniform
`.trim();
    } else {
      const figureClothing = character.clothing || `${character.visualStyle} robes and garments`;
      characterDescription = `
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${figureClothing}
- Style: Classical figure rendered with metallic/chrome accents, biblical period accurate
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}
`.trim();
    }

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled after 1997-98 Fleer Metal Universe insert set.

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

=== BACKGROUND ===
Industrial chrome and steel environment. Polished metal surfaces with reflections. Geometric patterns of rivets and panels. Deep blue and silver color scheme with metallic sheen throughout. Sci-fi futuristic aesthetic. Chrome pipes and machinery silhouettes. The entire scene has a liquid metal quality.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "METAL UNIVERSE" in bold chrome/silver 3D metallic font with strong reflections. Centered at top.

LOGO: Below the title, render the "Court & Covenant" logo in SHINY GOLD metallic finish. IMPORTANT: Keep the logo SMALL - approximately 15-20% of the card width, subtle and elegant, NOT dominant.

BOTTOM: Write "${character.displayName || character.name}" in chrome gradient text with 3D metallic effect. Centered at bottom.

=== FINISH ===
Highly reflective chrome card finish. Everything has a polished metal quality. Premium 1990s Metal Universe insert card aesthetic.
`.trim();

    return prompt;
  }
};

export default metalUniverseTemplate;
