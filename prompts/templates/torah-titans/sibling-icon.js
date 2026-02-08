#!/usr/bin/env node
/**
 * Sibling Icon Template (Byzantine Diptych)
 * Torah Titans specific template for sibling rivalry pairings
 *
 * Inspired by Byzantine mosaics, illuminated manuscripts, and religious icons.
 * Features side-by-side panels like a hinged altar diptych with gold leaf,
 * mosaic texture, and formal icon poses. Halos can indicate the righteous.
 *
 * TEMPLATE defines STRUCTURE:
 * - Side-by-side diptych panels
 * - Byzantine icon aesthetic
 * - Gold leaf backgrounds
 * - Jeweled frame border with Hebrew scripture
 *
 * PAIRING DATA provides CONTENT (via seriesSpecificData.siblingIcon):
 * - Which figure gets a halo
 * - Panel-specific imagery
 * - Scripture for the border
 */

export const siblingIconTemplate = {
  id: "sibling-icon",
  name: "Sibling Icon",
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

    // Get pairing-specific config
    const iconConfig = pairing.seriesSpecificData?.siblingIcon || {};
    const char1Halo = iconConfig.char1Halo ?? (char1.righteous !== false);
    const char2Halo = iconConfig.char2Halo ?? false;

    // Get scripture from iconConfig or fallback
    const scripture = iconConfig.scripture || null;

    // Hebrew names with vowels
    const char1Hebrew = char1.hebrewName || null;
    const char2Hebrew = char2.hebrewName || null;

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "SIBLING ICON" for the Torah Titans series.

=== DESIGN INSPIRATION ===
BYZANTINE RELIGIOUS ART: Gold-ground mosaics, illuminated manuscripts, hinged altar diptychs, Orthodox icons. Sacred, timeless, divine judgment rendered in art.

=== CRITICAL REQUIREMENTS ===
1. TWO BIBLICAL FIGURES in formal icon poses, side by side like a diptych
2. Byzantine mosaic aesthetic with gold leaf and tesserae texture
3. Classical religious icon style - formal, frontal or three-quarter poses
4. Each figure must have exactly TWO ARMS
5. This is STYLIZED ART for a collectible card, not a photograph
6. ALL TEXT IS GOLD - names, scripture, everything in burnished gold

=== RIVALRY CONTEXT ===
${rivalryContext}

=== DIPTYCH COMPOSITION ===
The card is divided into TWO PANELS like a hinged religious diptych:

LEFT PANEL: ${char1.name.toUpperCase()}
- Standing or seated in formal Byzantine icon pose
- Facing slightly toward center or directly at viewer
- ${char1Attribute ? `Holding: ${char1Attribute} as a sacred symbol` : 'Hands in blessing or characteristic gesture'}
${char1Halo ? '- GOLDEN HALO behind head (circular, Byzantine style with rays or concentric circles)' : '- No halo'}

RIGHT PANEL: ${char2.name.toUpperCase()}
- Standing or seated in formal Byzantine icon pose
- Facing slightly toward center or directly at viewer
- ${char2Attribute ? `Holding: ${char2Attribute} as a sacred symbol` : 'Hands in gesture or at sides'}
${char2Halo ? '- GOLDEN HALO behind head (circular, Byzantine style with rays or concentric circles)' : '- No halo'}

=== FIGURE DESCRIPTIONS ===

${char1.name.toUpperCase()} (LEFT PANEL):
- Physical: ${char1.physicalDescription}
- Wearing: ${char1Clothing} - rendered in Byzantine style with gold trim
- Style: Byzantine icon - formal, dignified, stylized
- Anatomy: Exactly two arms${char1.anatomyNote ? ` - ${char1.anatomyNote}` : ''}

${char2.name.toUpperCase()} (RIGHT PANEL):
- Physical: ${char2.physicalDescription}
- Wearing: ${char2Clothing} - rendered in Byzantine style with rich colors
- Style: Byzantine icon - formal, dignified, stylized
- Anatomy: Exactly two arms${char2.anatomyNote ? ` - ${char2.anatomyNote}` : ''}

=== CENTER DIVIDER (HINGE) ===
An ornate vertical border between the two panels:
- Style: Jeweled metalwork like an icon frame
- Features: Geometric patterns, gemstones in deep blue and crimson
- Suggests the hinge of a real diptych
- GOLD filigree patterns throughout

=== BACKGROUND ===
Byzantine GOLD LEAF background for both panels:
- Rich, burnished gold leaf
- Subtle MOSAIC TESSERAE TEXTURE (small tile pattern)
- NO realistic landscape - pure gold icon background

=== BORDER & FRAME WITH HEBREW SCRIPTURE ===
Ornate JEWELED ICON FRAME with HEBREW SCRIPTURE:
- Deep blue, crimson, or purple base for the frame
- GOLD filigree patterns throughout
- Corner medallions with gemstones
${scripture ? `
SCRIPTURE IN GOLD around the frame border:

TOP BORDER (horizontal, reading right to left):
Hebrew text in BURNISHED GOLD: "${scripture.hebrew}"
- Must include all vowel marks (nikud/נִקּוּד)
- Elegant Hebrew typography, gold embossed into the frame
- Text runs along the top edge of the jeweled border

BOTTOM BORDER:
English translation in GOLD: "${scripture.english}"
- Clean serif typography in gold
- Below the main panels

SOURCE CITATION:
"${scripture.source}" in small gold text at the very bottom
` : `
The frame may contain subtle Hebrew letterforms or decorative patterns in gold.
`}
=== CHARACTER NAMES IN HEBREW (GOLD) ===
${char1Hebrew ? `
LEFT PANEL - HEBREW NAME above or beside the figure:
"${char1Hebrew}" in elegant GOLD Hebrew lettering
- Positioned near the top of the left panel or beside the figure
- Large enough to be prominent
- Byzantine-style Hebrew letterforms in burnished gold
` : ''}
${char2Hebrew ? `
RIGHT PANEL - HEBREW NAME above or beside the figure:
"${char2Hebrew}" in elegant GOLD Hebrew lettering
- Positioned near the top of the right panel or beside the figure
- Large enough to be prominent
- Byzantine-style Hebrew letterforms in burnished gold
` : ''}

=== TEXT ELEMENTS (ALL GOLD) ===
TOP: "TORAH TITANS" in GOLD Byzantine-style lettering
SUBTITLE: "Sibling Icon" in gold below
${char1Hebrew && char2Hebrew ? `
HEBREW NAMES prominently displayed:
- "${char1Hebrew}" on left panel in GOLD
- "${char2Hebrew}" on right panel in GOLD
` : `
LEFT PANEL BOTTOM: "${char1.displayName || char1.name}" in gold
RIGHT PANEL BOTTOM: "${char2.displayName || char2.name}" in gold
`}

=== FINISH ===
Aged gold leaf with mosaic texture, subtle craquelure, jewel-toned accents.
All text elements in burnished, luminous GOLD.
Mood: "Divine judgment rendered", "Sacred, timeless, eternal"
`.trim();

    return prompt;
  },

  generateSolo(character, options = {}) {
    const clothing = character.clothing || `${character.visualStyle || 'ancient'} robes and garments`;
    const attribute = character.attributeDescription || character.attribute || "";
    const hasHalo = character.righteous !== false;
    const hebrewName = character.hebrewName || null;

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "SIBLING ICON" solo variant.

=== DESIGN ===
Byzantine religious icon - single saint/prophet in gold-ground mosaic style.
ALL TEXT IN GOLD.

=== CHARACTER ===
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${clothing} - Byzantine style with gold trim
- Pose: Formal frontal or three-quarter pose
- ${hasHalo ? 'GOLDEN HALO behind head' : 'No halo'}
- ${attribute ? `Holding: ${attribute}` : 'Hands in blessing gesture'}
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}

=== BACKGROUND ===
Rich GOLD LEAF with mosaic tesserae texture.

=== BORDER ===
Ornate jeweled icon frame in deep blue or crimson with gold filigree.

=== TEXT (ALL GOLD) ===
TOP: "TORAH TITANS" in gold Byzantine lettering
${hebrewName ? `HEBREW NAME: "${hebrewName}" prominently in GOLD` : ''}
BOTTOM: "${character.displayName || character.name}" in gold
`.trim();

    return prompt;
  }
};

export default siblingIconTemplate;
