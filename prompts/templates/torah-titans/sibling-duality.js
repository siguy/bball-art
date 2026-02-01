#!/usr/bin/env node
/**
 * Sibling Duality Template (Yin-Yang)
 * Torah Titans specific template for sibling rivalry pairings
 *
 * TEMPLATE defines STRUCTURE:
 * - Yin-yang circular composition with S-curve divider
 * - Gold ring border with embossed scripture text
 * - Text placement: Hebrew upper arc, English lower arc, source at 6 o'clock outside
 * - "Seed" dots concept
 * - High contrast color zones
 * - Symbolic imagery zones (content from pairing data)
 *
 * PAIRING DATA provides CONTENT (via seriesSpecificData.siblingDuality):
 * - Which scripture to use
 * - Which symbolic imagery for each side
 * - Which colors for each side
 * - Duality descriptors
 */

export const siblingDualityTemplate = {
  id: "sibling-duality",
  name: "Sibling Duality",
  series: "torah-titans",
  era: "Biblical",

  /**
   * Generate the full prompt for a Yin-Yang Duality Sibling Card
   * @param {object} pairing - The pairing data with both characters as figures
   * @param {object} options - Generation options (including options.act for triptych)
   */
  generate(pairing, options = {}) {
    // For sibling cards, both characters are biblical figures
    const char1 = pairing.player || pairing.char1 || pairing.characters?.[0];
    const char2 = pairing.figure || pairing.char2 || pairing.characters?.[1];

    // Get sibling duality config from pairing data (or use generic fallbacks)
    const siblingData = pairing.seriesSpecificData?.siblingDuality || {};

    // Check if this is a triptych card with acts
    const isTriptych = siblingData.isTriptych && siblingData.acts;
    const actNumber = options.act || null;
    const actData = isTriptych && actNumber ? siblingData.acts[actNumber] : null;

    // Scripture for the gold ring (act-specific or default)
    const scripture = actData?.scripture || siblingData.scripture || options.circleScripture || null;

    // Colors and imagery for each side
    const char1Config = siblingData.char1 || {
      color: "warm gold and amber",
      element: "light",
      imagery: "Celestial imagery appropriate to this figure's nature",
      traits: "the righteous qualities of this figure"
    };

    const char2Config = siblingData.char2 || {
      color: "deep crimson and shadow",
      element: "darkness",
      imagery: "Contrasting imagery appropriate to this figure's nature",
      traits: "the opposing qualities of this figure"
    };

    const connection = siblingData.connection ||
      `Born of the same source, destined to define each other. ${char1.name} and ${char2.name} cannot exist without the other.`;

    // Get rivalry/connection context
    const rivalryContext = pairing.connection?.narrative ||
      pairing.rivalryResearch?.relationship ||
      `The rivalry between ${char1.name} and ${char2.name}`;

    // Character clothing
    const char1Clothing = char1.clothing || `${char1.visualStyle || 'ancient'} robes and garments`;
    const char2Clothing = char2.clothing || `${char2.visualStyle || 'ancient'} robes and garments`;

    // Progression symbol (e.g., mandrakes)
    const progressionSymbol = siblingData.progressionSymbol || null;

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "SIBLING DUALITY" card for the Torah Titans series.
${actData ? `
=== TRIPTYCH CARD: ACT ${actNumber} ===
CHAPTER MARKER: Hebrew letter "${actData.chapterMarker}" displayed prominently in top-left corner
TITLE: "${actData.title}"
This is card ${actNumber} of 3 in a progression series.
` : ''}
=== DESIGN INSPIRATION ===
YIN-YANG SYMBOL and COSMIC DUALITY: Two interlocking forces that define each other. The idea that opposites are interconnected and contain seeds of each other.

=== CRITICAL REQUIREMENTS ===
1. TWO BIBLICAL FIGURES in interlocking CIRCULAR composition (yin-yang inspired)
2. ${actData ? actData.colorTemperature : 'High contrast design: one half warm/light, one half dark'}
3. Each figure CURVED around the other, creating the flowing S-curve
4. GOLD RING border with EMBOSSED scripture text${actData ? ` - ${actData.ringState}` : ''}
5. Each figure must have exactly TWO ARMS
6. This is STYLIZED ART for a collectible card, not a photograph
${actData ? `7. YIN-YANG RATIO: ${actData.yinYangRatio}` : ''}
${progressionSymbol && actData ? `
=== PROGRESSION SYMBOL: ${progressionSymbol.name.toUpperCase()} ===
${progressionSymbol.placement}
STATE: ${actData.mandrakeState}
The ${progressionSymbol.name} appears OUTSIDE the gold ring, in the margin or corner of the card.
This symbol shows the progression across the triptych.
` : ''}
=== RIVALRY CONTEXT ===
${rivalryContext}
${actData ? `\nMOOD FOR THIS ACT: ${actData.mood}` : ''}

=== YIN-YANG COMPOSITION ===
The card features a LARGE CIRCULAR design divided by a flowing S-CURVE:
${actData ? `YIN-YANG BALANCE: ${actData.yinYangRatio}` : ''}

${char1.name.toUpperCase()} DOMAIN (upper-left sweeping to lower-right):
- Background: ${char1Config.color} tones
- Symbolic imagery: ${char1Config.imagery}
- Figure curved along the S-divider
- Contains a small "seed" dot of ${char2.name}'s colors

${char2.name.toUpperCase()} DOMAIN (lower-right sweeping to upper-left):
- Background: ${char2Config.color} tones
- Symbolic imagery: ${char2Config.imagery}
- Figure curved along the S-divider, mirroring the other
- Contains a small "seed" dot of ${char1.name}'s colors

The S-CURVE where they meet is the point of tension and connection.

=== FIGURE DESCRIPTIONS ===
${actData ? `LIFE STAGE: ${actData.figureState}` : ''}

${char1.name.toUpperCase()} (${char1Config.element.toUpperCase()} SIDE):
- Physical: ${char1.physicalDescription}
- Wearing: ${char1Clothing} in ${char1Config.color} tones
${actData?.char1Pose ? `- POSE FOR THIS ACT: ${actData.char1Pose}` : '- Pose: Curved, flowing position following the circular composition'}
- Traits: ${char1Config.traits}
- Anatomy: Exactly two arms${char1.anatomyNote ? ` - ${char1.anatomyNote}` : ''}

${char2.name.toUpperCase()} (${char2Config.element.toUpperCase()} SIDE):
- Physical: ${char2.physicalDescription}
- Wearing: ${char2Clothing} in ${char2Config.color} tones
${actData?.char2Pose ? `- POSE FOR THIS ACT: ${actData.char2Pose}` : '- Pose: Curved, flowing position following the circular composition'}
- Traits: ${char2Config.traits}
- Anatomy: Exactly two arms${char2.anatomyNote ? ` - ${char2.anatomyNote}` : ''}

=== THE "SEEDS" (YIN-YANG DOTS) ===
CRITICAL ELEMENT: Like a true yin-yang, each half contains a small circular "seed" of the OTHER sibling's essence. Each dot contains a MEANINGFUL SYMBOL from the opposing sibling's world.

In ${char1.name}'s domain (the ${char1Config.color} half):
- A small circle filled with ${char2Config.color}
- Inside this dot: ${char2Config.seedSymbol || `A symbol of ${char2.name} - their weapon, terrain, or defining object`}
- This represents ${char2.name}'s presence even within ${char1.name}'s realm

In ${char2.name}'s domain (the ${char2Config.color} half):
- A small circle filled with ${char1Config.color}
- Inside this dot: ${char1Config.seedSymbol || `A symbol of ${char1.name} - their dwelling, sacred object, or defining trait`}
- This represents ${char1.name}'s presence even within ${char2.name}'s realm

The seeds show: "${connection}"
Each sibling carries a piece of the other - they cannot be fully separated.

=== GOLD RING BORDER WITH SCRIPTURE ===
The yin-yang composition is set within a PROMINENT GOLD RING:
- Wide, elegant gold metallic ring surrounding the circular design
- The ring has depth and dimension - raised, sculptural quality
${scripture ? `
EMBOSSED SCRIPTURE TEXT on the gold ring:

UPPER ARC (curving along top half of ring, from 9 o'clock to 3 o'clock):
Hebrew text EMBOSSED into the gold: "${scripture.hebrew}"
- Text is raised/embossed into the gold ring
- DARK BRONZE or DEEP BROWN colored text for readability against gold
- Elegant Hebrew typography with full vowel marks (nikud)
- Text follows the curve of the ring

LOWER ARC (curving along bottom half of ring, from 3 o'clock to 9 o'clock):
English text EMBOSSED into the gold: "${scripture.english}"
- Matching embossed treatment
- DARK BRONZE or DEEP BROWN colored text for readability
- Clean serif typography following the curve

SOURCE CITATION (outside the ring, below at 6 o'clock position):
"${scripture.source}" in small elegant text BELOW the gold ring
- Dark text, not on the ring itself, just underneath it
- Subtle, scholarly attribution
` : `
The gold ring may contain subtle decorative patterns or Hebrew letterforms.
`}
=== OUTER BACKGROUND ===
- Dark cosmic background (deep blue, purple, or black) outside the gold ring
- Subtle starfield or gradient effect
- The gold ring and its contents are the hero of the composition

=== CARD BORDER & PREMIUM FINISH ===
DELICATE GOLDEN BORDER: A thin, elegant gold line runs along the entire edge of the card, defining its boundaries with refined simplicity.

SUBTLE FOIL ACCENT: A gentle golden semi-circular glow or soft holographic arc sits beneath the scripture source citation at the bottom:
- Soft, subtle iridescent shimmer - NOT aggressive or overwhelming
- A delicate arc or crescent shape framing the source text from below
- Like a gentle halo of light beneath the citation
- Premium but understated - enhances without dominating

=== TEXT ELEMENTS ===
TOP (above the gold ring): "TORAH TITANS" in clean, modern serif font with metallic sheen

SUBTITLE: "Sibling Duality" in elegant script below the title

BOTTOM (below the source citation): "${char1.displayName || char1.name} & ${char2.displayName || char2.name}"

=== FINISH ===
- Smooth cosmic gradients in the yin-yang interior
- Rich, sculptural gold ring with embossed text catching light
- Premium collectible card with philosophical depth
- Mood: "Opposites define each other", "Two halves of one whole"
`.trim();

    return prompt;
  },

  /**
   * Generate a solo character card in duality style
   * Shows one character with their dual nature
   */
  generateSolo(character, options = {}) {
    const pose = character.pose;
    const clothing = character.clothing || `${character.visualStyle || 'ancient'} robes and garments`;

    const duality = options.duality || {
      light: "their righteous side, moments of virtue",
      dark: "their flaws, moments of weakness or struggle"
    };

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "SIBLING DUALITY" solo variant for the Torah Titans series.

=== DESIGN INSPIRATION ===
YIN-YANG SYMBOL - showing the INTERNAL DUALITY of a single character.

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER shown with internal duality (two aspects in yin-yang composition)
2. High contrast design: light and dark aspects of the same person
3. Circular yin-yang composition within a gold ring border
4. The figure must have exactly TWO ARMS in each depiction
5. This is STYLIZED ART for a collectible card, not a photograph

=== COMPOSITION ===
${character.name}'s INTERNAL DUALITY in yin-yang style:

LIGHT HALF:
- ${character.name} in their virtuous, righteous aspect
- ${duality.light}
- Warm gold/amber tones

DARK HALF:
- ${character.name} in their conflicted, struggling aspect
- ${duality.dark}
- Deep shadow tones

The two halves flow together in the classic S-curve within a gold ring border.

=== CHARACTER DESCRIPTION ===

${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${clothing}
- Pose: ${pose.name || 'contemplative'} - ${pose.prompt || 'curved, flowing, introspective'}
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}

=== GOLD RING BORDER ===
Wide gold metallic ring surrounding the composition.
May contain embossed Hebrew text or decorative patterns.

=== OUTER BACKGROUND ===
Dark cosmic background outside the gold ring.

=== TEXT ELEMENTS ===
TOP: "TORAH TITANS"
SUBTITLE: "Sibling Duality"
BOTTOM: "${character.displayName || character.name}"

=== FINISH ===
Smooth cosmic gradients, sculptural gold ring, philosophical aesthetic.
`.trim();

    return prompt;
  }
};

export default siblingDualityTemplate;
