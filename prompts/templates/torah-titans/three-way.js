#!/usr/bin/env node
/**
 * Three-Way Card Template
 * Torah Titans specific template for multi-character dynamics
 *
 * Designed for love triangles (Jacob-Rachel-Leah) and other 3+ character cards.
 * Complex compositions showing relationships and tensions.
 */

export const threeWayTemplate = {
  id: "three-way",
  name: "Three-Way",
  series: "torah-titans",
  era: "Biblical",

  /**
   * Generate the full prompt for a Three-Way card
   * @param {object} pairing - The pairing data with 3 characters
   * @param {object} options - Generation options
   */
  generate(pairing, options = {}) {
    // Get all three characters
    const characters = pairing.characters || [
      pairing.char1 || pairing.player,
      pairing.char2 || pairing.figure,
      pairing.char3
    ].filter(Boolean);

    if (characters.length < 3) {
      throw new Error('Three-way template requires at least 3 characters');
    }

    const [char1, char2, char3] = characters;

    // Determine the relationship type
    const relationshipType = pairing.seriesSpecificData?.relationshipType || options.relationshipType || 'love-triangle';

    // Character clothing
    const getClothing = (char) => char.clothing || `${char.visualStyle || 'ancient'} robes and garments`;

    // Build character descriptions
    const charDescriptions = characters.map((char, i) => {
      const position = i === 0 ? 'LEFT' : i === 1 ? 'CENTER' : 'RIGHT';
      return `
${char.name.toUpperCase()} (${position}):
- Physical: ${char.physicalDescription}
- Wearing: ${getClothing(char)}
- Style: Classical artistic interpretation, biblical period accurate
- Anatomy: Exactly two arms${char.anatomyNote ? ` - ${char.anatomyNote}` : ''}`;
    }).join('\n');

    // Build relationship-specific composition
    let compositionNotes;
    let relationshipVisual;

    if (relationshipType === 'love-triangle') {
      compositionNotes = `
LOVE TRIANGLE COMPOSITION:
- ${char1.name} (left): The object of desire, or the one choosing
- ${char2.name} (center, slightly forward): The favored one, radiating connection
- ${char3.name} (right, slightly back): The overlooked one, showing longing or pain
- Visual tension lines between all three
- Eye directions tell the story: who looks at whom`;

      relationshipVisual = `
Subtle visual storytelling:
- A thread of connection between ${char1.name} and ${char2.name} (golden light, reaching hands, eye contact)
- ${char3.name} slightly separated, looking toward them with complex emotion
- The space between figures tells the story`;
    } else if (relationshipType === 'siblings') {
      compositionNotes = `
SIBLING COMPOSITION:
- All three at similar visual prominence
- Family resemblance in features
- Shared history visible in their postures
- Dynamic of rivalry or support`;

      relationshipVisual = `
Family dynamics:
- Similar clothing styles suggesting shared background
- Postures showing their relationships (protective, competitive, united)
- Subtle visual elements connecting them as family`;
    } else {
      compositionNotes = `
THREE-WAY DYNAMIC COMPOSITION:
- ${char1.name} on the left
- ${char2.name} in the center
- ${char3.name} on the right
- Complex interplay of relationships visible`;

      relationshipVisual = `
Visual storytelling through positioning and body language.
The relationships between all three should be readable.`;
    }

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "Three-Way" card for the Torah Titans series.

=== CRITICAL REQUIREMENTS ===
1. THREE BIBLICAL FIGURES in dynamic composition
2. Complex relationship dynamics visible in their positioning
3. Classical artistic interpretation, biblical period accurate
4. All figures must have exactly TWO ARMS each (6 arms total)
5. This is STYLIZED ART for a collectible card, not a photograph
6. Each character must be clearly distinguishable

=== RELATIONSHIP: ${pairing.connection?.thematic || 'Complex Dynamics'} ===
${pairing.connection?.narrative || 'A story of intertwined fates.'}

=== FIGURE DESCRIPTIONS ===
${charDescriptions}

${compositionNotes}

=== COMPOSITION ===
THREE-FIGURE CARD:
- All three figures should be visible from approximately waist up
- Staggered depth: one slightly forward, others slightly back
- Clear visual hierarchy but all three important
- Total figures fill 70-80% of the card's width
- Leave room for background storytelling

${relationshipVisual}

=== BACKGROUND ===
Warm desert sunset with ancient Hebrew tent encampment.
Stars beginning to appear in the twilight sky, suggesting destiny and promises.
Gentle rolling hills of Canaan in the distance.
The lighting should be romantic yet melancholic - golden hour with hints of coming night.

The background enhances the emotional story without distracting from the figures.

=== BORDER & FRAME ===
Elegant bronze border with intertwined vine patterns.
Three subtle sections in the border design, one for each character.
Ancient manuscript aesthetic with delicate ornamentation.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "TORAH TITANS" in elegant bronze serif font with subtle metallic sheen. Centered at top.

SUBTITLE: Below the title, write "Three-Way" in smaller, elegant script.

BOTTOM: Write "${char1.displayName || char1.name}, ${char2.displayName || char2.name} & ${char3.displayName || char3.name}" in bronze text. Centered at bottom, sized to fit.

=== FINISH ===
Warm bronze shimmer finish with romantic sunset glow. Premium collectible card feel that captures the emotional complexity of the story.
`.trim();

    return prompt;
  },

  /**
   * Generate info about supported relationship types
   */
  getRelationshipTypes() {
    return [
      { id: 'love-triangle', name: 'Love Triangle', description: 'Romantic tension between three people' },
      { id: 'siblings', name: 'Siblings', description: 'Brothers or sisters with complex dynamics' },
      { id: 'conflict', name: 'Three-Way Conflict', description: 'Three parties in opposition' },
      { id: 'alliance', name: 'Alliance', description: 'Three parties working together' }
    ];
  }
};

export default threeWayTemplate;
