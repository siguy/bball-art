/**
 * Spotlight Card Template
 * Parasha Pack - Character introduction card
 *
 * Introduces a character with their trait and emotion.
 * Children learn to recognize recurring characters.
 */

import { buildStyleBlock, buildEmotionBlock, STYLE, THEMATIC_BORDERS } from './common/style-guide.js';
import { buildCharacterBlock, loadCharacter } from './common/character-continuity.js';

export const spotlightCardTemplate = {
  id: 'spotlight-card',
  name: 'Spotlight Card',
  series: 'parasha-pack',
  cardType: 'spotlight',

  /**
   * Generate the full prompt for a Spotlight Card
   * @param {object} deckData - Full deck data
   * @param {object} cardData - Specific card data from deck.cards[]
   * @param {object} options - Additional options
   * @returns {string} Complete prompt for image generation
   */
  generate(deckData, cardData, options = {}) {
    const characterId = cardData.characterId;
    const character = loadCharacter(characterId);
    const borderColor = THEMATIC_BORDERS[cardData.border?.color] || '#FF9500';

    // Build character block with emotion
    const characterBlock = buildCharacterBlock(characterId, {
      emotion: cardData.emotion,
      props: cardData.props || [],
      action: ''
    });

    return `
A vertical children's educational card in 5:7 aspect ratio (1500x2100 pixels).

${buildStyleBlock('spotlight')}

=== CARD TYPE: SPOTLIGHT (Character Introduction) ===
Introducing: ${character?.name || cardData.title}
Trait: ${cardData.trait}
Emotion: ${cardData.emotion} (${cardData.emotionLabel})

${characterBlock}

=== CONTENT ===
Title: "${cardData.title}"
Text: "${cardData.text}"
Trait badge: "${cardData.trait}"
Emotion label: "${cardData.emotionLabel}"

=== VISUAL DESCRIPTION ===
${cardData.visualPrompt}

=== COMPOSITION ===
Layout (top to bottom):
1. TITLE ZONE (top 12%): Character name "${cardData.title}" in bold friendly font
2. CHARACTER (center 60%): ${character?.name || 'Character'} as the CENTRAL figure
   - Takes up 50-60% of card width
   - Full body or 3/4 view
   - Facing slightly toward viewer (engaging)
   - Expression clearly shows: ${cardData.emotion}
3. TRAIT BADGE (corner): "${cardData.trait}" in a fun badge/ribbon shape
4. EMOTION LABEL: Small label showing the emotion word
5. TEXT ZONE (bottom 15%): Short description text

${buildEmotionBlock(cardData.emotion)}

Character priorities:
- LARGE - the character should dominate the card
- EXPRESSIVE - emotion is clear from across the room
- FRIENDLY - approachable, someone children want to learn about
- CONSISTENT - matches established character design exactly

=== FRAME ===
- Rounded corners (8-10px radius)
- Border: ${borderColor} (8px width)
- Person icon in top-left corner (spotlight card indicator)
- Trait badge in decorative frame (top-right or bottom area)

=== MOOD ===
This card introduces a friend. The child should feel: "I want to know more about this person!"
    `.trim();
  },

  /**
   * Generate a simplified prompt for testing
   */
  generateSimple(deckData, cardData) {
    const character = loadCharacter(cardData.characterId);

    return `
Children's educational character card, 5x7 inches, vivid cartoon style.

Character: ${cardData.title}
Trait: ${cardData.trait}
Emotion: ${cardData.emotionLabel}

${character?.appearance?.description || cardData.visualPrompt}

The character is the main focus, taking up most of the card.
Expression shows: ${cardData.emotion}
Simple background, bold colors, thick outlines.
Large friendly eyes, rounded shapes.

NO scary elements, child-friendly only.
    `.trim();
  }
};

export default spotlightCardTemplate;
