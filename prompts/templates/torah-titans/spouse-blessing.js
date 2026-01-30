#!/usr/bin/env node
/**
 * Spouse Blessing Card Template
 * Torah Titans specific template for biblical spouse pairings
 *
 * Designed for partnership cards like Abraham & Sarah, Jacob & Rachel, etc.
 * Warm, harmonious aesthetic emphasizing unity and blessing.
 */

import { generatePoseBlock } from '../../components/poses.js';

export const spouseBlessingTemplate = {
  id: "spouse-blessing",
  name: "Spouse Blessing",
  series: "torah-titans",
  era: "Biblical",

  /**
   * Generate the full prompt for a Spouse Blessing card
   * @param {object} pairing - The pairing data with both characters as figures
   * @param {object} options - Generation options
   */
  generate(pairing, options = {}) {
    // For spouse cards, both characters are biblical figures
    // Use char1/char2 naming to support figure-figure pairings
    const char1 = pairing.player || pairing.char1 || pairing.characters?.[0];
    const char2 = pairing.figure || pairing.char2 || pairing.characters?.[1];

    const interaction = options.interaction || pairing.defaultInteraction || "side-by-side";

    // Get character attributes
    const char1Attribute = char1.attributeDescription || char1.attribute || "patriarch";
    const char2Attribute = char2.attributeDescription || char2.attribute || "matriarch";

    // Check for custom actions
    const customActions = (options.customPlayerAction && options.customFigureAction)
      ? { playerAction: options.customPlayerAction, figureAction: options.customFigureAction }
      : null;

    // Generate the interaction block
    const poseBlock = generatePoseBlock(
      interaction,
      char1.name,
      char2.name,
      char2Attribute,
      customActions
    );

    // Character clothing
    const char1Clothing = char1.clothing || `${char1.visualStyle || 'ancient'} robes and garments`;
    const char2Clothing = char2.clothing || `${char2.visualStyle || 'ancient'} robes and garments`;

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "Spouse Blessing" card for the Torah Titans series.

=== CRITICAL REQUIREMENTS ===
1. TWO BIBLICAL FIGURES in harmonious partnership pose
2. Warm, golden lighting suggesting divine blessing
3. Classical artistic interpretation, period accurate
4. All figures must have exactly TWO ARMS
5. This is STYLIZED ART for a collectible card, not a photograph

${poseBlock}

=== FIGURE DESCRIPTIONS ===

${char1.name.toUpperCase()} (LEFT SIDE):
- Physical: ${char1.physicalDescription}
- Wearing: ${char1Clothing}
- Style: Classical artistic interpretation, biblical period accurate
- Anatomy: Exactly two arms${char1.anatomyNote ? ` - ${char1.anatomyNote}` : ''}

${char2.name.toUpperCase()} (RIGHT SIDE):
- Physical: ${char2.physicalDescription}
- Wearing: ${char2Clothing}
- Style: Classical artistic interpretation, biblical period accurate
- Anatomy: Exactly two arms${char2.anatomyNote ? ` - ${char2.anatomyNote}` : ''}

=== COMPOSITION ===
IMPORTANT: ${char1.name} must be on the LEFT side of the card. ${char2.name} must be on the RIGHT side of the card.

The two figures should be LARGE and PROMINENT, filling most of the card's vertical space. Show them from approximately knee-level up, making them the dominant visual element.

Their poses should suggest PARTNERSHIP and BLESSING - hands may be touching, one blessing the other, or standing in unity. The composition should feel harmonious and warm.

=== BACKGROUND ===
Warm sunset gradient of golden amber, rose pink, and soft purple. Stars beginning to appear in the upper sky, suggesting the promise of descendants like stars. Gentle desert landscape in the far distance - tents, hills, palm trees. Subtle divine light rays emanating from above.

The background must stay BEHIND the figures - no effects overlapping or obscuring them.

=== BORDER & FRAME ===
Ornate gold border with subtle Hebrew patterns. Delicate vine or olive branch motifs along the edges. The border should feel ancient yet elegant, like an illuminated manuscript.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "TORAH TITANS" in elegant gold serif font with subtle metallic sheen. Centered at top, smaller and refined.

SUBTITLE: Below the title, write "Spouse Blessing" in smaller, elegant script.

BOTTOM: Write "${char1.displayName || char1.name} & ${char2.displayName || char2.name}" in gold text with subtle glow. Clean, elegant typography centered at bottom.

=== FINISH ===
Soft golden shimmer finish. Premium collectible card feel with warm, inviting aesthetic. Subtle sparkle effects suggesting divine blessing.
`.trim();

    return prompt;
  },

  /**
   * Generate a solo character card (for this template, a single blessed figure)
   * @param {object} character - Character data
   * @param {object} options - Generation options
   */
  generateSolo(character, options = {}) {
    const pose = character.pose;
    const clothing = character.clothing || `${character.visualStyle || 'ancient'} robes and garments`;

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "Spouse Blessing" card for the Torah Titans series.

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER CARD - Only ONE figure on this card
2. Warm, golden lighting suggesting divine blessing
3. Classical artistic interpretation, period accurate
4. The figure must have exactly TWO ARMS
5. This is STYLIZED ART for a collectible card, not a photograph

=== SINGLE FIGURE POSE ===
${character.name} is shown in a ${pose.name || 'blessing'} pose:
${pose.prompt || `${character.name} stands in a pose of blessing and grace`}
Energy: ${pose.energy || 'Blessed, peaceful, faithful'}

=== CHARACTER DESCRIPTION ===

${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${clothing}
- Style: Classical artistic interpretation, biblical period accurate
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}

=== COMPOSITION ===
SOLO CARD: ${character.name} is the ONLY figure on this card.
- Character should be CENTERED and DOMINANT
- Show FULL BODY from head to feet - character fills 70-80% of card height
- Dynamic but graceful pose
- Warm, inviting presence

=== BACKGROUND ===
Warm sunset gradient of golden amber, rose pink, and soft purple. Stars beginning to appear in the upper sky. Gentle desert landscape in the far distance - tents, hills, palm trees. Subtle divine light rays emanating from above.

=== BORDER & FRAME ===
Ornate gold border with subtle Hebrew patterns. Delicate vine or olive branch motifs along the edges.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "TORAH TITANS" in elegant gold serif font with subtle metallic sheen. Centered at top.

SUBTITLE: Below the title, write "Spouse Blessing" in smaller, elegant script.

BOTTOM: Write "${character.displayName || character.name}" in gold text with subtle glow. Centered at bottom.

=== FINISH ===
Soft golden shimmer finish. Premium collectible card feel with warm, inviting aesthetic.
`.trim();

    return prompt;
  }
};

export default spouseBlessingTemplate;
