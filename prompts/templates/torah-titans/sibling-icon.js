#!/usr/bin/env node
/**
 * Sibling Icon Template (Byzantine Diptych)
 * Torah Titans specific template for sibling rivalry pairings
 *
 * Inspired by Byzantine mosaics, illuminated manuscripts, and religious icons.
 * Features side-by-side panels like a hinged altar diptych with gold leaf,
 * mosaic texture, and formal icon poses. Halos can indicate the righteous.
 */

export const siblingIconTemplate = {
  id: "sibling-icon",
  name: "Sibling Icon",
  series: "torah-titans",
  era: "Biblical",

  /**
   * Generate the full prompt for a Byzantine Diptych Sibling Card
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

    // Determine if either figure gets a halo (the righteous one in the rivalry)
    // This can be set in pairing data or determined by character type
    const char1Halo = char1.righteous !== false && (char1.righteous || pairing.type === 'hero' || char1.characterType === 'hero');
    const char2Halo = char2.righteous !== false && (char2.righteous || char2.characterType === 'hero');

    // For complex cases like Jacob/Esau, check if one is specifically marked
    const char1IsRighteous = pairing.seriesSpecificData?.righteousFigure === char1.name || char1.righteous === true;
    const char2IsRighteous = pairing.seriesSpecificData?.righteousFigure === char2.name || char2.righteous === true;

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

=== RIVALRY CONTEXT ===
${rivalryContext}

=== DIPTYCH COMPOSITION ===
The card is divided into TWO PANELS like a hinged religious diptych:

LEFT PANEL: ${char1.name.toUpperCase()}
- Standing or seated in formal Byzantine icon pose
- Facing slightly toward center (three-quarter view) or directly at viewer
- ${char1Attribute ? `Holding: ${char1Attribute} as a sacred symbol` : 'Hands in blessing or characteristic gesture'}
${char1IsRighteous ? '- GOLDEN HALO behind head (circular, Byzantine style)' : '- No halo'}

RIGHT PANEL: ${char2.name.toUpperCase()}
- Standing or seated in formal Byzantine icon pose
- Facing slightly toward center (three-quarter view) or directly at viewer
- ${char2Attribute ? `Holding: ${char2Attribute} as a sacred symbol` : 'Hands in gesture or at sides'}
${char2IsRighteous ? '- GOLDEN HALO behind head (circular, Byzantine style)' : '- No halo'}

=== FIGURE DESCRIPTIONS ===

${char1.name.toUpperCase()} (LEFT PANEL):
- Physical: ${char1.physicalDescription}
- Wearing: ${char1Clothing} - rendered in Byzantine style with gold trim and geometric folds
- Style: Byzantine icon - formal, dignified, stylized rather than realistic
- Expression: Solemn, timeless, characteristic of the figure
- Anatomy: Exactly two arms${char1.anatomyNote ? ` - ${char1.anatomyNote}` : ''}

${char2.name.toUpperCase()} (RIGHT PANEL):
- Physical: ${char2.physicalDescription}
- Wearing: ${char2Clothing} - rendered in Byzantine style with rich colors and gold details
- Style: Byzantine icon - formal, dignified, stylized rather than realistic
- Expression: Solemn, timeless, characteristic of the figure
- Anatomy: Exactly two arms${char2.anatomyNote ? ` - ${char2.anatomyNote}` : ''}

=== CENTER DIVIDER (HINGE) ===
An ornate DECORATIVE HINGE or BORDER runs vertically between the two panels:
- Style: Jeweled metalwork like an icon frame
- Features: Geometric patterns, gemstones (ruby, sapphire, emerald)
- Width: Thin but prominent, suggesting the hinge of a real diptych
- May contain small Hebrew letters or biblical symbols

=== BACKGROUND ===
Byzantine GOLD LEAF background for both panels:
- Rich, burnished gold leaf covering the background
- Subtle MOSAIC TESSERAE TEXTURE (small tile pattern visible)
- May include subtle geometric or floral patterns in the gold
- Each panel has its own gold ground
- NO realistic landscape - pure gold icon background

The gold creates a sense of divine, timeless space.

=== BORDER & FRAME ===
Ornate JEWELED ICON FRAME surrounding the entire card:
- Deep blue, crimson, or purple base
- Gold filigree patterns
- Corner medallions with gemstones
- Inner beaded border (like Byzantine metalwork)
- Frame suggests a precious reliquary or icon cover

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: "TORAH TITANS" in Byzantine-style lettering (like Greek uncials or manuscript text)
- Gold letters on dark band
- Formal, sacred typography

SUBTITLE: "Sibling Icon" in smaller elegant script below

LEFT PANEL: "${char1.displayName || char1.name}" in gold lettering at bottom of panel
- Byzantine manuscript style lettering
- May include Hebrew characters

RIGHT PANEL: "${char2.displayName || char2.name}" in gold lettering at bottom of panel
- Matching style to left panel
- May include Hebrew characters

=== ADDITIONAL BYZANTINE ELEMENTS ===
- Greek-style drapery folds (geometric, stylized)
- Gold highlights on clothing and objects
- Possible small religious symbols (stars, crosses, menorahs) in background
- Craquelure or aged patina texture suggesting ancient icon
- Deep, rich colors: crimson, royal blue, purple, forest green, gold

=== FINISH ===
Aged gold leaf with mosaic texture:
- Warm, burnished gold appearance
- Visible tesserae (mosaic tile) pattern
- Subtle craquelure (fine cracks like old paintings)
- Jewel-toned accents catch light
- Premium collectible card feel with sacred gravitas
- Mood: "Divine judgment rendered", "Sacred, timeless, eternal"
`.trim();

    return prompt;
  },

  /**
   * Generate a solo character card in Byzantine icon style
   */
  generateSolo(character, options = {}) {
    const pose = character.pose;
    const clothing = character.clothing || `${character.visualStyle || 'ancient'} robes and garments`;
    const attribute = character.attributeDescription || character.attribute || "";
    const hasHalo = character.righteous !== false;

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "SIBLING ICON" solo variant for the Torah Titans series.

=== DESIGN INSPIRATION ===
BYZANTINE RELIGIOUS ICONS - single saint or prophet depicted in gold-ground mosaic style.

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER in formal Byzantine icon pose
2. Byzantine mosaic aesthetic with gold leaf background
3. Classical religious icon style - formal, frontal pose
4. The figure must have exactly TWO ARMS
5. This is STYLIZED ART for a collectible card, not a photograph

=== COMPOSITION ===
${character.name} depicted as a BYZANTINE ICON:
- Centered in the frame, formal frontal or three-quarter pose
- Full or three-quarter length figure
- ${hasHalo ? 'GOLDEN HALO behind head (circular, Byzantine style)' : 'No halo'}
- ${attribute ? `Holding: ${attribute} as a sacred symbol` : 'Hands in blessing gesture'}

=== CHARACTER DESCRIPTION ===

${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${clothing} - rendered in Byzantine style with gold trim
- Pose: ${pose.name || 'formal stance'} - ${pose.prompt || 'dignified, icon-like pose'}
- Style: Byzantine icon - formal, dignified, stylized
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}

=== BACKGROUND ===
Rich GOLD LEAF background with mosaic tesserae texture.
No landscape - pure sacred gold ground.

=== BORDER & FRAME ===
Ornate JEWELED ICON FRAME:
- Deep blue or crimson base
- Gold filigree patterns
- Corner medallions with gemstones

=== TEXT ELEMENTS ===
TOP: "TORAH TITANS" in Byzantine-style lettering
BOTTOM: "${character.displayName || character.name}" in gold manuscript lettering

=== FINISH ===
Aged gold leaf with mosaic texture, craquelure, and jewel-toned accents.
Sacred, timeless aesthetic.
`.trim();

    return prompt;
  }
};

export default siblingIconTemplate;
