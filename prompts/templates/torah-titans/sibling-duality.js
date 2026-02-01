#!/usr/bin/env node
/**
 * Sibling Duality Template (Yin-Yang)
 * Torah Titans specific template for sibling rivalry pairings
 *
 * Inspired by Taoist yin-yang symbol, twin mythology, and cosmic duality.
 * Features interlocking circular design showing how opposites define each other.
 * Each sibling contains a seed of the other - philosophical depth about interconnection.
 */

export const siblingDualityTemplate = {
  id: "sibling-duality",
  name: "Sibling Duality",
  series: "torah-titans",
  era: "Biblical",

  /**
   * Generate the full prompt for a Yin-Yang Duality Sibling Card
   * @param {object} pairing - The pairing data with both characters as figures
   * @param {object} options - Generation options
   */
  /**
   * Find the best scripture for the circle border
   * Prioritizes scriptures marked for duality or about contrast/opposition
   */
  findCircleScripture(pairing, options) {
    // Allow explicit override via options
    if (options.circleScripture) {
      return options.circleScripture;
    }

    // Look in pairing's scripture references
    const refs = pairing.rivalryResearch?.scriptureReferences ||
                 pairing.scriptureReferences ||
                 [];

    // First, look for scripture explicitly marked for duality circle
    for (const ref of refs) {
      if (ref.usageHint === 'sibling-duality-circle') {
        return {
          hebrew: ref.hebrew,
          english: ref.english,
          source: ref.source
        };
      }
    }

    // Second, look for duality-themed keywords
    const dualityKeywords = ['field', 'tent', 'man of', 'dwelling', 'hunter'];
    for (const ref of refs) {
      const text = (ref.english || '').toLowerCase();
      if (dualityKeywords.some(kw => text.includes(kw))) {
        return {
          hebrew: ref.hebrew,
          english: ref.english,
          source: ref.source
        };
      }
    }

    // Default for Jacob-Esau - the tent vs field verse
    if (pairing.id === 'jacob-esau') {
      return {
        hebrew: "עֵשָׂו אִישׁ יֹדֵעַ צַיִד אִישׁ שָׂדֶה וְיַעֲקֹב אִישׁ תָּם יֹשֵׁב אֹהָלִים",
        english: "Esau was a hunter, a man of the field; Jacob was a quiet man, dwelling in tents",
        source: "Genesis 25:27"
      };
    }

    // Generic fallback
    return null;
  },

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

    // Determine the duality colors for each character
    // Can be customized per pairing, defaults to classic opposites
    const duality = pairing.seriesSpecificData?.duality || {
      char1: { color: "warm gold/amber", element: "light/fire", position: "upper-left" },
      char2: { color: "deep black/indigo", element: "shadow/water", position: "lower-right" }
    };

    // Duality descriptors (what makes them opposite and what connects them)
    const dualityDescriptors = pairing.seriesSpecificData?.dualityDescriptors || {
      char1Traits: "smooth skin, voice of wisdom, quiet contemplation",
      char2Traits: "rough/hairy, physicality, action and instinct",
      connection: "born together, destined to struggle, cannot exist without the other"
    };

    // Get scripture for the circle border
    const circleScripture = this.findCircleScripture(pairing, options);

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "SIBLING DUALITY" card for the Torah Titans series.

=== DESIGN INSPIRATION ===
YIN-YANG SYMBOL and COSMIC DUALITY: Two interlocking forces that define each other. Taoist balance, Mesoamerican twin mythology, the idea that opposites are interconnected and contain seeds of each other.

=== CRITICAL REQUIREMENTS ===
1. TWO BIBLICAL FIGURES in interlocking CIRCULAR composition (yin-yang inspired)
2. High contrast design: one half light, one half dark
3. Each figure CURVED around the other, creating the flowing S-curve
4. Classical artistic interpretation with cosmic/philosophical undertones
5. Each figure must have exactly TWO ARMS
6. This is STYLIZED ART for a collectible card, not a photograph

=== RIVALRY CONTEXT ===
${rivalryContext}

=== DUALITY COMPOSITION ===
The card features a LARGE CIRCULAR YIN-YANG-INSPIRED design:

The central composition is a circle divided by a flowing S-CURVE:

${char1.name.toUpperCase()} DOMAIN (${duality.char1.position}):
- Background: ${duality.char1.color} tones, representing ${duality.char1.element}
- Figure: Curved/flowing pose that follows the S-curve border
- Contains a small circular "seed" of ${char2.name}'s color (yin-yang dot)
- ${dualityDescriptors.char1Traits}

${char2.name.toUpperCase()} DOMAIN (${duality.char2.position}):
- Background: ${duality.char2.color} tones, representing ${duality.char2.element}
- Figure: Curved/flowing pose that follows the S-curve border
- Contains a small circular "seed" of ${char1.name}'s color (yin-yang dot)
- ${dualityDescriptors.char2Traits}

The S-CURVE where they meet is the point of maximum tension and connection - their backs curved toward each other, or hands almost touching across the divide.

=== FIGURE DESCRIPTIONS ===

${char1.name.toUpperCase()} (${duality.char1.element.toUpperCase()} SIDE):
- Physical: ${char1.physicalDescription}
- Wearing: ${char1Clothing} in ${duality.char1.color} tones
- Pose: Curved, flowing position following the circular composition
- Body curves along the S-divider, like half of the yin-yang symbol
- ${char1Attribute ? `Displaying: ${char1Attribute}` : 'Hands in characteristic gesture'}
- Style: Elegant, cosmic, slightly ethereal
- Anatomy: Exactly two arms${char1.anatomyNote ? ` - ${char1.anatomyNote}` : ''}

${char2.name.toUpperCase()} (${duality.char2.element.toUpperCase()} SIDE):
- Physical: ${char2.physicalDescription}
- Wearing: ${char2Clothing} in ${duality.char2.color} tones
- Pose: Curved, flowing position following the circular composition
- Body curves along the S-divider, mirroring ${char1.name}'s curve
- ${char2Attribute ? `Displaying: ${char2Attribute}` : 'Hands in characteristic gesture'}
- Style: Powerful, cosmic, slightly ethereal
- Anatomy: Exactly two arms${char2.anatomyNote ? ` - ${char2.anatomyNote}` : ''}

=== THE "SEEDS" (YIN-YANG DOTS) ===
Critical element: Each half contains a small circle of the OPPOSITE color:
- In ${char1.name}'s domain: A small ${duality.char2.color} circle containing something of ${char2.name} (an eye, a hand, a symbol)
- In ${char2.name}'s domain: A small ${duality.char1.color} circle containing something of ${char1.name} (an eye, a hand, a symbol)

These "seeds" represent: "${dualityDescriptors.connection}"

=== BACKGROUND ===
COSMIC/ELEMENTAL contrast with SYMBOLIC IMAGERY:
- ${char1.name}'s half: Gradients of ${duality.char1.color}, smooth transitions
  * TENT silhouettes in the background - the dwelling place of the quiet scholar
  * Torah scrolls, study tables, domestic hearth imagery
  * Stars visible through tent opening (promise of descendants)
  * Peaceful, contemplative atmosphere

- ${char2.name}'s half: Gradients of ${duality.char2.color}, smooth transitions
  * Open FIELD stretching to horizon - the wild hunting grounds
  * Silhouettes of prey animals (deer, wild game)
  * Bow and arrows, hunting imagery
  * Untamed wilderness, rugged terrain

- The colors blend at the S-curve boundary where tent meets field
- Outer background: Deep cosmic space or subtle gradient vignette

=== CIRCULAR FRAME WITH SCRIPTURE ===
The yin-yang composition should be set within a PROMINENT CIRCLE:
- Clean, bold circular border containing the duality design
- The border ring is wide enough to contain TEXT
- The circle represents completeness - the two halves make a whole
${circleScripture ? `
CRITICAL - SCRIPTURE TEXT AROUND THE CIRCLE:
The circular border contains ACTUAL SCRIPTURE TEXT arcing around it:

UPPER ARC (above the yin-yang, curving with the circle):
Hebrew text: "${circleScripture.hebrew}"
- Gold or light-colored text on the border
- Elegant Hebrew typography, readable
- Arcs along the TOP half of the circle from left to right

LOWER ARC (below the yin-yang, curving with the circle):
English text: "${circleScripture.english}"
- Matching gold or light-colored text
- Clean serif typography
- Arcs along the BOTTOM half of the circle
- Source "${circleScripture.source}" may appear in small text

The scripture creates a frame of meaning around the cosmic duality.
` : `
AROUND THE CIRCLE:
Hebrew letters or words relating to the duality theme may arc around the circular border.
`}
=== BORDER & FRAME ===
Modern, clean border with cosmic undertones:
- Dark outer border (deep blue, purple, or black)
- Subtle starfield or gradient effect
- The central circle with its scripture border is the hero of the composition
- Minimal additional decoration to let the duality and scripture speak

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: "TORAH TITANS" in clean, modern serif font with subtle metallic sheen
- Centered above the circular composition
- Balanced, understated typography

SUBTITLE: "Sibling Duality" in elegant script or small caps below

BOTTOM: "${char1.displayName || char1.name} & ${char2.displayName || char2.name}" in balanced text
- Positioned below the circle
- May use " / " or "&" to connect the names

=== COLOR RELATIONSHIPS ===
Suggested color pairs (use what fits the specific pairing):
- Gold/Amber vs Black/Indigo (light vs dark)
- Fire orange/red vs Water blue/teal (fire vs water)
- Day gold/white vs Night blue/black (day vs night)
- Warm earth tones vs Cool sky tones (earth vs sky)

The key is HIGH CONTRAST while maintaining visual harmony.

=== FINISH ===
Smooth, cosmic aesthetic:
- Clean gradients without harsh edges
- Subtle metallic or iridescent sheen on the circular border
- Colors flow and blend beautifully
- Premium collectible card with philosophical depth
- Mood: "Opposites define each other", "Cannot exist without the other", "Two halves of one whole"
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
    const attribute = character.attributeDescription || character.attribute || "";

    // For solo, we show the character's internal duality
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
3. Circular yin-yang composition
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
- Deep indigo/shadow tones

The two halves flow together in the classic S-curve, each containing a "seed" of the other.

=== CHARACTER DESCRIPTION ===

${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${clothing} (colors shift between the two halves)
- Pose: ${pose.name || 'contemplative'} - ${pose.prompt || 'curved, flowing, introspective'}
- Style: Cosmic, philosophical, showing inner complexity
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}
${attribute ? `- Holding: ${attribute}` : ''}

=== BACKGROUND ===
Cosmic gradients - warm gold transitioning to deep indigo in S-curve.
Subtle starfield in outer areas.

=== BORDER & FRAME ===
Clean circular frame with dark cosmic border.

=== TEXT ELEMENTS ===
TOP: "TORAH TITANS" in clean modern font
SUBTITLE: "Sibling Duality"
BOTTOM: "${character.displayName || character.name}"

=== FINISH ===
Smooth cosmic gradients, clean and philosophical aesthetic.
`.trim();

    return prompt;
  }
};

export default siblingDualityTemplate;
