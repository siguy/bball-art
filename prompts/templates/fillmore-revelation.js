#!/usr/bin/env node
/**
 * Fillmore Revelation Card Template
 * Based on 1960s San Francisco concert posters (Wes Wilson, Victor Moscoso).
 *
 * Signature look: melting hand-lettered type, vibrating op-art rings,
 * clashing saturated color, paisley and art-nouveau curves.
 *
 * Solo mode supports "fusion": if the player has a `fusion` block (in the
 * pairing's player object), he stays in his basketball pose but takes on
 * the biblical figure's traits - wardrobe, accents, aura, background motifs.
 * The figure himself never appears and is never named on the card.
 */

import { generatePoseBlock, generateSoloPoseBlock } from '../components/poses.js';

// Shared psychedelic poster backdrop. `extra` adds card-specific motifs.
function posterBackground(extra = null) {
  return `
- Vibrating op-art concentric rings radiating out from behind the figure, pulsing and shimmering
- Color palette: deep electric orange and royal blue as the base, clashing with hot magenta, acid green, and violet - saturated, vibrating, 1960s ink-on-paper
- A melting, wavy silhouette of a city skyline at the horizon line, dripping into the color bands
- Paisley swirls and flowing art-nouveau curves fill the margins${extra ? `\n- ${extra}` : ''}
`.trim();
}

// The model sometimes writes the brand name as plain text instead of copying the
// reference logo image - spell out that it must reproduce the image itself.
const LOGO_RULE = 'reproduce the provided "Court & Covenant" logo reference image EXACTLY - its flowing script lettering, the large swash C, and the small ampersand - in metallic gold, legible against the background. Do NOT write the words in a plain or poster font; copy the logo image itself.';

const POSTER_FINISH = 'Screen-printed concert poster texture - slight ink misregistration, flat saturated inks, faint paper grain, a subtle iridescent sheen. The card should look like a collectible gig poster from the Summer of Love.';

export const fillmoreRevelationTemplate = {
  id: "fillmore-revelation",
  name: "Fillmore Revelation",
  era: "1960s",

  /**
   * Generate the full prompt for a Fillmore Revelation card
   */
  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const interaction = options.interaction || pairing.defaultInteraction || "simultaneous-action";
    const colorScheme = options.colorScheme || "primary";

    const jerseyColors = player.jerseyColors || { primary: { base: "royal blue", accent: "orange" } };
    const jersey = jerseyColors[colorScheme] || jerseyColors.primary;

    const figureAttribute = figure.attributeDescription || figure.attribute;

    const customActions = (options.customPlayerAction && options.customFigureAction)
      ? { playerAction: options.customPlayerAction, figureAction: options.customFigureAction }
      : null;

    const poseBlock = generatePoseBlock(
      interaction,
      player.name,
      figure.name,
      figureAttribute,
      customActions
    );

    const figureClothing = figure.clothing || `${figure.visualStyle} robes and garments`;

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled as a 1967 San Francisco psychedelic concert poster - FILLMORE POSTER ART meets biblical prophecy.

=== CRITICAL REQUIREMENTS ===
1. PSYCHEDELIC POSTER ILLUSTRATION - hand-drawn, flat saturated inks, flowing organic linework. NOT a photograph, NOT realistic 3D rendering
2. The basketball player's jersey AND SHORTS must be COMPLETELY BLANK - solid ${jersey.base} color only with ${jersey.accent} trim
3. The shorts are PLAIN SOLID ${jersey.base.toUpperCase()} FABRIC - NO logo, NO emblem, NO number, NO symbol
4. DO NOT add any team names, NBA logos, or brand marks
5. All figures must have exactly TWO ARMS
6. Faces and bodies stay clear and readable - the psychedelia lives in the background, the light, and the edges, never melting the faces

${poseBlock}

=== FIGURE DESCRIPTIONS ===

${player.name.toUpperCase()}:
- Physical: ${player.physicalDescription}
- Wearing: PLAIN SOLID ${jersey.base.toUpperCase()} basketball tank top and shorts with ${jersey.accent} trim. COMPLETELY BLANK uniform.
- Style: poster-art illustration with bold flowing contour lines, rim-lit by glowing magenta and acid-green light

${figure.name.toUpperCase()}:
- Physical: ${figure.physicalDescription}
- Wearing: ${figureClothing}
- Attribute: ${figureAttribute}
- Style: poster-art illustration with bold flowing contour lines, biblical period accurate
- Anatomy: Exactly two arms${figure.anatomyNote ? ` - ${figure.anatomyNote}` : ''}

INTERACTION: Two legends sharing one cosmic vision - the energy between them ripples outward into the background like sound waves.

=== COMPOSITION ===
IMPORTANT: ${player.name} (basketball player) must be on the LEFT side of the card. ${figure.name} (biblical figure) must be on the RIGHT side of the card. This ensures names at bottom align with their figures.
Both figures shown full body or three-quarter body, large and dominant, filling most of the card height.

=== BACKGROUND ===
${posterBackground()}

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "${player.name}" in classic 1960s Fillmore poster lettering - swelling, melting, warped letterforms that stretch to fill the space, bright orange letters with a vibrating blue outline. Centered at top. Spell it exactly.

LOGO: Below the title, small: ${LOGO_RULE}

BOTTOM: Write "${player.name} & ${figure.displayName}" in flowing psychedelic hand-lettering, legible, centered at the bottom.

=== FINISH ===
${POSTER_FINISH}
`.trim();

    return prompt;
  },

  /**
   * Generate a solo card. Players with a `fusion` block take on a biblical
   * figure's traits while staying in their basketball pose.
   */
  generateSolo(character, options = {}) {
    const isPlayer = character.type === 'player';
    const jersey = options.jersey || { base: 'royal blue', accent: 'orange' };
    const fusion = isPlayer ? character.fusion : null;

    const poseBlock = generateSoloPoseBlock(character.name, character.pose, character.type);

    const wearing = isPlayer
      ? `PLAIN SOLID ${jersey.base.toUpperCase()} basketball tank top and shorts with ${jersey.accent} trim. COMPLETELY BLANK uniform.${fusion?.wardrobe ? ` Over it: ${fusion.wardrobe}` : ''}`
      : (character.clothing || `${character.visualStyle} robes and garments`);

    const fusionLines = fusion ? [
      fusion.accents && `- Accents: ${fusion.accents}`,
      fusion.aura && `- Aura: ${fusion.aura}`,
    ].filter(Boolean).join('\n') : '';

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled as a 1967 San Francisco psychedelic concert poster - FILLMORE POSTER ART.

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER CARD - only ONE person on this card, no other human figures
2. PSYCHEDELIC POSTER ILLUSTRATION - hand-drawn, flat saturated inks, flowing organic linework. NOT a photograph, NOT realistic 3D rendering
3. ${isPlayer ? `The jersey AND SHORTS must be COMPLETELY BLANK - solid ${jersey.base} with ${jersey.accent} trim - NO logo, NO number, NO symbol` : 'Biblical figure in period-accurate attire'}
4. DO NOT add any team names, NBA logos, or brand marks
5. Exactly TWO ARMS
6. The face and body stay clear and readable - the psychedelia lives in the background, the light, and the edges, never melting the face
${fusion ? '7. The basketball pose is the HERO of the card - the added wardrobe and motifs decorate the pose, they never change it' : ''}

${poseBlock}

=== CHARACTER DESCRIPTION ===
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${wearing}
${fusionLines}
- Style: poster-art illustration with bold flowing contour lines, rim-lit by glowing magenta and acid-green light${!isPlayer && character.anatomyNote ? `\n- Anatomy: ${character.anatomyNote}` : ''}

=== COMPOSITION ===
- ${character.name} is CENTERED and DOMINANT, full body head to feet, filling 70-80% of the card height
- Leave room around the figure so the pose breathes

=== BACKGROUND ===
${posterBackground(fusion?.background)}

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "${character.displayName || character.name}" in classic 1960s Fillmore poster lettering - swelling, melting, warped letterforms that stretch to fill the space, bright orange letters with a vibrating blue outline. Centered at top. Spell it exactly.

LOGO: Near the bottom center, modest size: ${LOGO_RULE}

No other text on the card.

=== FINISH ===
${POSTER_FINISH}
`.trim();

    return prompt;
  }
};

export default fillmoreRevelationTemplate;
