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
 * - Ornate center divider band with Hebrew scripture
 * - Playing card aesthetic with gold text
 *
 * PAIRING DATA provides CONTENT (via seriesSpecificData.siblingCard):
 * - Center symbol
 * - Scripture for the divider
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
    const centerSymbol = cardConfig.centerDividerElement || cardConfig.centerSymbol || "Hebrew letter or meaningful biblical symbol";
    const scripture = cardConfig.scripture || null;

    // Get character-specific items for sibling-card (no hands/blessing imagery)
    const char1Item = cardConfig.char1?.holdingItem || char1Attribute;
    const char2Item = cardConfig.char2?.holdingItem || char2Attribute;

    // Hebrew names
    const char1Hebrew = char1.hebrewName || null;
    const char2Hebrew = char2.hebrewName || null;

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "SIBLING CARD" for the Torah Titans series.

=== DESIGN INSPIRATION ===
18th-century REVERSIBLE PLAYING CARDS (court cards like Kings, Queens, Jacks) where the figure is mirrored and ROTATED 180 DEGREES, so the card looks the same upside-down.

=== CRITICAL REQUIREMENTS ===
1. TWO BIBLICAL FIGURES in ROTATIONAL SYMMETRY - one upright, one inverted
2. The card should look nearly identical when rotated 180 degrees
3. Ornate playing card aesthetic with warm parchment and GOLD tones
4. Each figure must have exactly TWO ARMS
5. This is STYLIZED ART for a collectible card, not a photograph
6. ALL TEXT IN GOLD - Hebrew names, scripture, everything

=== RIVALRY CONTEXT ===
${rivalryContext}

=== ROTATIONAL COMPOSITION ===
CRITICAL: This is a REVERSIBLE CARD design like classic court cards.

TOP HALF (normal orientation):
${char1.name.toUpperCase()} - shown from chest/waist up, RIGHT-SIDE UP
- Head at top of card
- Upper body visible, lower body fades into the center divider
- Hands in dignified gesture (NO external hands touching them)

BOTTOM HALF (inverted orientation):
${char2.name.toUpperCase()} - shown from chest/waist up, UPSIDE DOWN (rotated 180°)
- Head at bottom of card (appears at top when card is flipped)
- Upper body visible, lower body fades into the center divider
- Hands in dignified gesture (NO external hands touching them)

The two figures are MIRROR IMAGES meeting at the center.

=== FIGURE DESCRIPTIONS ===

${char1.name.toUpperCase()} (TOP, UPRIGHT):
- Physical: ${cardConfig.char1?.physicalDescription || char1.physicalDescription}
- Wearing: ${char1Clothing}
- Style: Playing card court figure aesthetic - stylized, formal
- Anatomy: Exactly two arms${char1.anatomyNote ? ` - ${char1.anatomyNote}` : ''}, NO external hands touching this figure

${char2.name.toUpperCase()} (BOTTOM, INVERTED):
- Physical: ${cardConfig.char2?.physicalDescription || char2.physicalDescription}
- Wearing: ${char2Clothing}
- Style: Playing card court figure aesthetic - stylized, formal
- Anatomy: Exactly two arms${char2.anatomyNote ? ` - ${char2.anatomyNote}` : ''}, NO external hands touching this figure

=== CENTER DIVIDER WITH HEBREW SCRIPTURE ===
An ORNATE DECORATIVE BAND runs horizontally across the center:
- Features: ${centerSymbol}
- Style: Intricate scrollwork, GOLD filigree, playing card flourishes
- Width: Approximately 10-15% of card height
${scripture ? `
HEBREW SCRIPTURE IN GOLD across the center band:
"${scripture.hebrew}"
- Hebrew text with full vowel marks (nikud/נִקּוּד)
- Elegant GOLD typography, embossed or inlaid into the decorative band
- Reading right to left across the center

Below the Hebrew (or integrated into the band):
"${scripture.english}"
- English translation in smaller GOLD text
- INVERTED/UPSIDE DOWN (rotated 180°) so it reads correctly when viewing from the bottom figure's perspective
- Clean serif typography

SOURCE: "${scripture.source}" in small gold text within or near the band
` : `
The center band contains "TORAH TITANS" in GOLD Hebrew-inspired lettering.
`}

=== BACKGROUND ===
Classic playing card pattern:
- Warm parchment base with subtle aged texture
- Ornate geometric or floral patterns
- Rich palette: GOLD, crimson, royal blue, ivory
- Pattern is SYMMETRICAL when rotated 180 degrees

=== BORDER & FRAME ===
Playing card style border with corner flourishes that mirror when rotated.
- GOLD trim and filigree throughout
- Corner medallions in gold

=== TEXT ELEMENTS (ALL GOLD) ===
TOP EDGE: "${char1Hebrew || char1.displayName || char1.name}" - Hebrew name with FULL VOWEL MARKS (nikud) in elegant GOLD, positioned near ${char1.name}, readable when card is upright. ONLY ONE instance of this name.
BOTTOM EDGE: "${char2Hebrew || char2.displayName || char2.name}" - Hebrew name with FULL VOWEL MARKS (nikud) in elegant GOLD, UPSIDE DOWN/INVERTED (rotated 180°) so it reads correctly when the card is flipped, positioned near ${char2.name}. ONLY ONE instance of this name.
CENTER BAND: "TORAH TITANS" integrated into the ornamental band in GOLD

CRITICAL: Each name appears exactly ONCE on the card. Do not duplicate names. The bottom name MUST be rendered upside down.

=== FINISH ===
Gilded playing card aesthetic with aged texture and GOLD metallic accents.
All text in burnished, luminous GOLD.
Mood: "Two sides of the same coin", "Bound by blood"
`.trim();

    return prompt;
  },

  generateSolo(character, options = {}) {
    const clothing = character.clothing || `${character.visualStyle || 'ancient'} robes and garments`;
    const attribute = character.attributeDescription || character.attribute || "";
    const hebrewName = character.hebrewName || null;

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "SIBLING CARD" solo variant.

=== DESIGN ===
Reversible playing card style - single character mirrored against themselves.
The card looks identical when rotated 180 degrees.
ALL TEXT IN GOLD.

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
- Ornate center divider band with Hebrew lettering in GOLD
- Warm parchment and GOLD tones
- Playing card border with corner flourishes in GOLD

=== TEXT (ALL GOLD) ===
TOP: "${hebrewName || character.displayName || character.name}" in GOLD
BOTTOM: Same name, inverted, in GOLD
CENTER: "TORAH TITANS" in GOLD
`.trim();

    return prompt;
  }
};

export default siblingCardTemplate;
