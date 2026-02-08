/**
 * Action Card Template
 * Parasha Pack - Key plot moment card
 *
 * Shows a key story moment with emotional reactions.
 * Designed for physical sequencing activities.
 */

import { buildStyleBlock, STYLE, THEMATIC_BORDERS, RESTRICTIONS } from './common/style-guide.js';
import { buildCharacterBlock, buildGroupCharacterBlock, loadCharacter } from './common/character-continuity.js';

export const actionCardTemplate = {
  id: 'action-card',
  name: 'Action Card',
  series: 'parasha-pack',
  cardType: 'action',

  /**
   * Generate the full prompt for an Action Card
   * @param {object} deckData - Full deck data
   * @param {object} cardData - Specific card data from deck.cards[]
   * @param {object} options - Additional options
   * @returns {string} Complete prompt for image generation
   */
  generate(deckData, cardData, options = {}) {
    const borderColor = THEMATIC_BORDERS[cardData.border?.color] || '#FF4136';

    // Build character blocks for all characters in the scene
    const characterBlocks = [];
    if (cardData.characters && cardData.characters.length > 0) {
      for (const charId of cardData.characters) {
        const character = loadCharacter(charId);
        const emotion = cardData.emotions?.[charId] || 'engaged';

        if (character?.characterType === 'group') {
          characterBlocks.push(buildGroupCharacterBlock(charId, { emotion }));
        } else {
          characterBlocks.push(buildCharacterBlock(charId, { emotion }));
        }
      }
    }

    // Check if this involves divine presence
    const hasDivinePresence = cardData.visualPrompt?.toLowerCase().includes('god') ||
                              cardData.moment?.includes('commandments') ||
                              cardData.moment?.includes('sinai') ||
                              cardData.moment?.includes('revelation');

    const divineGuidelines = hasDivinePresence ? `
=== DIVINE PRESENCE ===
This scene involves God's presence. IMPORTANT:
${RESTRICTIONS.divinePresence.approved.map(a => `- Use: ${a}`).join('\n')}

NEVER:
${RESTRICTIONS.divinePresence.forbidden.map(f => `- ${f}`).join('\n')}
    ` : '';

    return `
A vertical children's educational card in 5:7 aspect ratio (1500x2100 pixels).

${buildStyleBlock('action')}

=== CARD TYPE: ACTION (Key Plot Moment) ===
Story moment: ${cardData.moment || cardData.title}
This card shows SOMETHING HAPPENING - characters reacting to an event.

=== CONTENT ===
Title: "${cardData.title}"
Text: "${cardData.text}"

=== CHARACTERS IN SCENE ===
${characterBlocks.length > 0 ? characterBlocks.join('\n\n') : 'No specific characters - focus on the event/setting'}

Character emotions:
${cardData.emotions ? Object.entries(cardData.emotions).map(([char, emotion]) =>
  `- ${char}: ${emotion}`
).join('\n') : '- Show appropriate emotional reactions to the event'}

=== VISUAL DESCRIPTION ===
${cardData.visualPrompt}

${divineGuidelines}

=== COMPOSITION ===
Layout (top to bottom):
1. TITLE ZONE (top 10%): "${cardData.title}" in dynamic, action-oriented font
2. ACTION SCENE (center 70%): The main event happening
   - Characters REACTING emotionally (not just standing there)
   - Clear focal point - what's happening?
   - Movement and energy appropriate to the moment
3. TEXT ZONE (bottom 15%): Short action description

Action priorities:
- DYNAMIC - something is clearly happening
- EMOTIONAL - we see how characters FEEL about what's happening
- SEQUENTIAL - this card fits in a story order
- CLEAR - children understand the moment at a glance

=== FRAME ===
- Rounded corners (8-10px radius)
- Border: ${borderColor} (8px width)
- Lightning bolt icon in top-left corner (action card indicator)

=== MOOD ===
This is a "something's happening!" moment. Children should feel the excitement, wonder,
or emotion of this story beat.
    `.trim();
  },

  /**
   * Generate a simplified prompt for testing
   */
  generateSimple(deckData, cardData) {
    return `
Children's educational action scene card, 5x7 inches, vivid cartoon style.

Scene: ${cardData.title}
${cardData.text}

${cardData.visualPrompt}

Show characters REACTING with emotion - not just standing still.
Dynamic composition with clear focal point.
Bold primary colors, soft pastel background, thick outlines.

If showing divine presence: use light rays and clouds only, NO human figure for God.
NO scary imagery. Child-friendly ages 4-6.
    `.trim();
  }
};

export default actionCardTemplate;
