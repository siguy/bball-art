#!/usr/bin/env node
/**
 * Sibling Card Template (Double-Headed)
 * Torah Titans specific template for sibling rivalry pairings
 *
 * Inspired by 18th-century reversible court cards (Kings, Queens, Jacks).
 * Features rotational symmetry - two figures mirrored and rotated 180° from each other.
 * Neither sibling is "above" the other - true equality in composition.
 *
 * TEMPLATE defines STRUCTURE:
 * - Reversible playing card layout
 * - Rotational symmetry (180°)
 * - Ornate center divider band
 * - Playing card aesthetic
 *
 * PAIRING DATA provides CONTENT (via seriesSpecificData.siblingCard):
 * - Center symbol
 * - Color preferences
 */

export const siblingCardTemplate = {
  id: "sibling-card",
  name: "Sibling Card",
  series: "torah-titans",
  era: "Biblical",

  generate(pairing, options = {}) {
    const char1 = pairing.player || pairing.char1 || pairing.characters?.[0];
    const char2 = pairing.figure || pairing.char2 || pairing.characters?.[1];

    const char1Attribute = char1.attributeDescription || char1.attribute || "";
    const char2Attribute = char2.attributeDescription || char2.attribute || "";

    const rivalryContext = pairing.connection?.narrative ||
      pairing.rivalryResearch?.relationship ||
      `The rivalry between ${char1.name} and ${char2.name}`;

    const char1Clothing = char1.clothing || `${char1.visualStyle || 'ancient'} robes and garments`;
    const char2Clothing = char2.clothing || `${char2.visualStyle || 'ancient'} robes and garments`;

    // Get pairing-specific config or use defaults
    const cardConfig = pairing.seriesSpecificData?.siblingCard || {};
    const centerSymbol = cardConfig.centerSymbol || "Hebrew letter or meaningful biblical symbol";

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "SIBLING CARD" for the Torah Titans series.

=== DESIGN INSPIRATION ===
18th-century REVERSIBLE PLAYING CARDS (court cards like Kings, Queens, Jacks) where the figure is mirrored and ROTATED 180 DEGREES, so the card looks the same upside-down.

=== CRITICAL REQUIREMENTS ===
1. TWO BIBLICAL FIGURES in ROTATIONAL SYMMETRY - one upright, one inverted
2. The card should look nearly identical when rotated 180 degrees
3. Ornate playing card aesthetic with warm parchment and gold tones
4. Each figure must have exactly TWO ARMS
5. This is STYLIZED ART for a collectible card, not a photograph

=== RIVALRY CONTEXT ===
${rivalryContext}

=== ROTATIONAL COMPOSITION ===
CRITICAL: This is a REVERSIBLE CARD design like classic court cards.

TOP HALF (normal orientation):
${char1.name.toUpperCase()} - shown from chest/waist up, RIGHT-SIDE UP
- Head at top of card
- Upper body visible, lower body fades into the center divider
- ${char1Attribute ? `Holding/displaying: ${char1Attribute}` : 'Hands in characteristic gesture'}

BOTTOM HALF (inverted orientation):
${char2.name.toUpperCase()} - shown from chest/waist up, UPSIDE DOWN (rotated 180°)
- Head at bottom of card (appears at top when card is flipped)
- Upper body visible, lower body fades into the center divider
- ${char2Attribute ? `Holding/displaying: ${char2Attribute}` : 'Hands in characteristic gesture'}

The two figures are MIRROR IMAGES meeting at the center.

=== FIGURE DESCRIPTIONS ===

${char1.name.toUpperCase()} (TOP, UPRIGHT):
- Physical: ${char1.physicalDescription}
- Wearing: ${char1Clothing}
- Style: Playing card court figure aesthetic - stylized, formal
- Anatomy: Exactly two arms${char1.anatomyNote ? ` - ${char1.anatomyNote}` : ''}

${char2.name.toUpperCase()} (BOTTOM, INVERTED):
- Physical: ${char2.physicalDescription}
- Wearing: ${char2Clothing}
- Style: Playing card court figure aesthetic - stylized, formal
- Anatomy: Exactly two arms${char2.anatomyNote ? ` - ${char2.anatomyNote}` : ''}

=== CENTER DIVIDER ===
An ORNATE DECORATIVE BAND runs horizontally across the center:
- Features: ${centerSymbol}
- Style: Intricate scrollwork, gold filigree, playing card flourishes
- Width: Approximately 10-15% of card height

=== BACKGROUND ===
Classic playing card pattern:
- Warm parchment base with subtle aged texture
- Ornate geometric or floral patterns
- Rich palette: gold, crimson, royal blue, ivory
- Pattern is SYMMETRICAL when rotated 180 degrees

=== BORDER & FRAME ===
Playing card style border with corner flourishes that mirror when rotated.

=== TEXT ELEMENTS ===
TOP EDGE: "${char1.displayName || char1.name}" in elegant gold serif
BOTTOM EDGE: "${char2.displayName || char2.name}" (inverted, readable when rotated)
CENTER BAND: "TORAH TITANS" integrated into the ornamental band

=== FINISH ===
Gilded playing card aesthetic with aged texture and metallic accents.
Mood: "Two sides of the same coin", "Bound by blood"
`.trim();

    return prompt;
  },

  generateSolo(character, options = {}) {
    const clothing = character.clothing || `${character.visualStyle || 'ancient'} robes and garments`;
    const attribute = character.attributeDescription || character.attribute || "";

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "SIBLING CARD" solo variant.

=== DESIGN ===
Reversible playing card style - single character mirrored against themselves.
The card looks identical when rotated 180 degrees.

TOP HALF: ${character.name} shown upright from chest up
BOTTOM HALF: ${character.name} shown inverted (rotated 180°)

=== CHARACTER ===
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${clothing}
- Style: Playing card court figure aesthetic
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}
${attribute ? `- Displaying: ${attribute}` : ''}

=== STYLING ===
- Ornate center divider band with Hebrew lettering
- Warm parchment and gold tones
- Playing card border with corner flourishes

=== TEXT ===
TOP: "${character.displayName || character.name}"
BOTTOM: Same name, inverted
CENTER: "TORAH TITANS"
`.trim();

    return prompt;
  }
};

export default siblingCardTemplate;
