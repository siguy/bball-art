/**
 * Anchor Card Template
 * Parasha Pack - Weekly summary "big idea" card
 *
 * The first card in every deck, introducing the parasha's theme.
 * Sets the emotional tone for the week's learning.
 */

import { buildStyleBlock, STYLE, THEMATIC_BORDERS } from './common/style-guide.js';

export const anchorCardTemplate = {
  id: 'anchor-card',
  name: 'Anchor Card',
  series: 'parasha-pack',
  cardType: 'anchor',

  /**
   * Generate the full prompt for an Anchor Card
   * @param {object} deckData - Full deck data (from yitro.json, etc.)
   * @param {object} cardData - Specific card data from deck.cards[]
   * @param {object} options - Additional options
   * @returns {string} Complete prompt for image generation
   */
  generate(deckData, cardData, options = {}) {
    const borderColor = THEMATIC_BORDERS[cardData.border?.color] || '#FFD700';

    return `
A vertical children's educational card in 5:7 aspect ratio (1500x2100 pixels).

${buildStyleBlock('anchor')}

=== CARD TYPE: ANCHOR (Weekly Summary) ===
This is the "big idea" card introducing Parashat ${deckData.parasha}.
It should capture the entire parasha's main theme in one inviting image.

=== CONTENT ===
Title: "${cardData.title}"
${cardData.subtitle ? `Subtitle: "${cardData.subtitle}"` : ''}
Hebrew name: ${deckData.parashaHebrew}
Emotional tone: ${cardData.emotionalTone || deckData.bigIdea.emotionalTone || 'excitement, wonder'}

=== VISUAL DESCRIPTION ===
${cardData.visualPrompt}

=== COMPOSITION ===
Layout (top to bottom):
1. TITLE ZONE (top 15%): Large, friendly title "${cardData.title}" in bold rounded font
2. HEBREW NAME: Parasha name in Hebrew with nikud: ${deckData.parashaHebrew}
3. MAIN ILLUSTRATION (center 65%): ${cardData.visualPrompt}
4. TEXT ZONE (bottom 15%): Simple summary text area

Visual priorities:
- Panoramic scene capturing the parasha's essence
- Bright, welcoming colors that invite children to explore
- Simple, uncluttered composition (5-7 elements max)
- Characters (if present) show the emotional tone

=== FRAME ===
- Rounded corners (8-10px radius)
- Border: ${borderColor} (8px width)
- Star icon in top-left corner (anchor card indicator)
- Gentle gradient or soft edge treatment

=== MOOD ===
This card should feel: Exciting, inviting, like the opening page of a wonderful story.
Children should WANT to see what comes next!
    `.trim();
  },

  /**
   * Generate a simplified prompt for testing
   */
  generateSimple(deckData, cardData) {
    return `
Children's educational flashcard, 5x7 inches, vivid cartoon style.

Parashat ${deckData.parasha}: ${cardData.title}
Hebrew: ${deckData.parashaHebrew}

Scene: ${cardData.visualPrompt}

Style: Rounded friendly characters, bold primary colors, soft pastel background,
thick clean outlines, large expressive features, simple shapes.

NO realistic style, NO scary elements, NO God depicted as human.
    `.trim();
  }
};

export default anchorCardTemplate;
