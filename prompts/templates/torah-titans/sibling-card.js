#!/usr/bin/env node
/**
 * Sibling Card Template (Double-Headed)
 * Torah Titans specific template for sibling rivalry pairings
 *
 * Inspired by 18th-century reversible court cards (Kings, Queens, Jacks).
 * Features rotational symmetry - two figures mirrored and rotated 180° from each other.
 * Neither sibling is "above" the other - true equality in composition.
 */

export const siblingCardTemplate = {
  id: "sibling-card",
  name: "Sibling Card",
  series: "torah-titans",
  era: "Biblical",

  /**
   * Generate the full prompt for a Double-Headed Sibling Card
   * @param {object} pairing - The pairing data with both characters as figures
   * @param {object} options - Generation options
   */
  generate(pairing, options = {}) {
    // For sibling cards, both characters are biblical figures
    const char1 = pairing.player || pairing.char1 || pairing.characters?.[0];
    const char2 = pairing.figure || pairing.char2 || pairing.characters?.[1];

    // Get character attributes
    const char1Attribute = char1.attributeDescription || char1.attribute || "";
    const char2Attribute = char2.attributeDescription || char2.attribute || "";

    // Get rivalry/connection context
    const rivalryContext = pairing.connection?.narrative ||
      pairing.rivalryResearch?.keyMoment ||
      `The rivalry between ${char1.name} and ${char2.name}`;

    // Character clothing
    const char1Clothing = char1.clothing || `${char1.visualStyle || 'ancient'} robes and garments`;
    const char2Clothing = char2.clothing || `${char2.visualStyle || 'ancient'} robes and garments`;

    // Center symbol (Hebrew letter or key symbol from the pairing)
    const centerSymbol = pairing.connection?.symbol ||
      pairing.seriesSpecificData?.centerSymbol ||
      "Hebrew letter ש (shin)";

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "SIBLING CARD" for the Torah Titans series.

=== DESIGN INSPIRATION ===
18th-century REVERSIBLE PLAYING CARDS (court cards like Kings, Queens, Jacks) where the figure is mirrored and ROTATED 180 DEGREES, so the card looks the same upside-down.

=== CRITICAL REQUIREMENTS ===
1. TWO BIBLICAL FIGURES in ROTATIONAL SYMMETRY - one upright, one inverted
2. The card should look nearly identical when rotated 180 degrees
3. Ornate playing card aesthetic with warm parchment and gold tones
4. Classical artistic interpretation, period accurate
5. Each figure must have exactly TWO ARMS
6. This is STYLIZED ART for a collectible card, not a photograph

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

The two figures are MIRROR IMAGES of each other, meeting at the center of the card where their bodies merge into the decorative band.

=== FIGURE DESCRIPTIONS ===

${char1.name.toUpperCase()} (TOP, UPRIGHT):
- Physical: ${char1.physicalDescription}
- Wearing: ${char1Clothing}
- Style: Playing card court figure aesthetic - stylized, formal, symmetrical pose
- Expression: Dignified, regal, characteristic of the figure
- Anatomy: Exactly two arms${char1.anatomyNote ? ` - ${char1.anatomyNote}` : ''}

${char2.name.toUpperCase()} (BOTTOM, INVERTED):
- Physical: ${char2.physicalDescription}
- Wearing: ${char2Clothing}
- Style: Playing card court figure aesthetic - stylized, formal, symmetrical pose
- Expression: Dignified, regal, characteristic of the figure
- Anatomy: Exactly two arms${char2.anatomyNote ? ` - ${char2.anatomyNote}` : ''}

=== CENTER DIVIDER ===
An ORNATE DECORATIVE BAND runs horizontally across the center of the card where the two figures meet.
- Features: ${centerSymbol} or other meaningful Hebrew/biblical symbol
- Style: Intricate scrollwork, gold filigree, playing card flourishes
- Width: Approximately 10-15% of card height
- The figures' bodies fade into and emerge from this decorative band

=== BACKGROUND ===
Classic playing card background pattern:
- Warm parchment base with subtle aged texture
- Ornate geometric or floral patterns (like court card backgrounds)
- Rich playing card palette: gold, crimson, royal blue, ivory
- Pattern is SYMMETRICAL when rotated 180 degrees

The background must stay BEHIND the figures - no patterns overlapping faces or key details.

=== BORDER & FRAME ===
Playing card style border:
- Thin gold inner line
- Wider ornate border with corner flourishes
- Corner decorations that mirror when rotated (like court card corners)
- Elegant, gilded playing card frame aesthetic

=== TEXT ELEMENTS (render exactly as specified) ===
TOP EDGE (upright orientation):
- "${char1.displayName || char1.name}" in elegant gold serif font

BOTTOM EDGE (appears at top when card is flipped):
- "${char2.displayName || char2.name}" in elegant gold serif font (inverted, readable when card is rotated)

CENTER BAND:
- "TORAH TITANS" in small decorative text integrated into the ornamental band
- "Sibling Card" or relevant subtitle below in elegant script

=== CORNER ELEMENTS ===
Like playing cards, include small corner indices:
- Top-left and bottom-right corners: Symbol or initial for ${char1.name}
- Top-right and bottom-left corners: Symbol or initial for ${char2.name}
(Rotational symmetry maintained)

=== FINISH ===
Gilded playing card aesthetic:
- Aged card texture with subtle wear
- Gold metallic accents catch light
- Warm, rich color palette
- Premium collectible card feel with antique elegance
- Mood: "Two sides of the same coin", "Bound by blood"
`.trim();

    return prompt;
  },

  /**
   * Generate a solo character card
   * For sibling cards, solo doesn't quite fit the concept, but we can show
   * one figure in the reversible style with themselves as the mirror
   */
  generateSolo(character, options = {}) {
    const pose = character.pose;
    const clothing = character.clothing || `${character.visualStyle || 'ancient'} robes and garments`;
    const attribute = character.attributeDescription || character.attribute || "";

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "SIBLING CARD" solo variant for the Torah Titans series.

=== DESIGN INSPIRATION ===
18th-century REVERSIBLE PLAYING CARDS - single character mirrored against themselves.

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER shown TWICE in rotational symmetry
2. The card should look identical when rotated 180 degrees
3. Ornate playing card aesthetic
4. Classical artistic interpretation, biblical period accurate
5. The figure must have exactly TWO ARMS in each depiction
6. This is STYLIZED ART for a collectible card, not a photograph

=== COMPOSITION ===
TOP HALF: ${character.name} shown from chest up, RIGHT-SIDE UP
BOTTOM HALF: ${character.name} shown from chest up, UPSIDE DOWN (mirror of top)

The two depictions meet at an ornate center band with Hebrew lettering or symbolic decoration.

=== CHARACTER DESCRIPTION ===

${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${clothing}
- Pose: ${pose.name || 'dignified stance'} - ${pose.prompt || 'formal, symmetrical pose'}
- Style: Playing card court figure aesthetic
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}
${attribute ? `- Holding/displaying: ${attribute}` : ''}

=== BACKGROUND ===
Classic playing card pattern with warm parchment and gold tones.
Ornate geometric patterns, rotationally symmetrical.

=== BORDER & FRAME ===
Gilded playing card border with corner flourishes.

=== TEXT ELEMENTS ===
TOP: "${character.displayName || character.name}" in elegant gold serif
BOTTOM: Same name, inverted (readable when rotated)
CENTER: "TORAH TITANS" integrated into ornamental band

=== FINISH ===
Gilded playing card aesthetic with aged texture and metallic accents.
`.trim();

    return prompt;
  }
};

export default siblingCardTemplate;
