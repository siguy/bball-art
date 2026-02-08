/**
 * Power Word Card Template
 * Parasha Pack - Hebrew vocabulary card
 *
 * Introduces a Hebrew word with visual association.
 * 2 power words per deck.
 */

import { buildStyleBlock, STYLE, THEMATIC_BORDERS } from './common/style-guide.js';

export const powerWordCardTemplate = {
  id: 'power-word-card',
  name: 'Power Word Card',
  series: 'parasha-pack',
  cardType: 'power-word',

  /**
   * Generate the full prompt for a Power Word Card
   * @param {object} deckData - Full deck data
   * @param {object} cardData - Specific card data from deck.cards[]
   * @param {object} options - Additional options
   * @returns {string} Complete prompt for image generation
   */
  generate(deckData, cardData, options = {}) {
    const borderColor = THEMATIC_BORDERS[cardData.border?.color] || '#0074D9';

    // Get power word data from deck or card
    let wordData = cardData;
    if (cardData.wordId && deckData.powerWords) {
      const foundWord = deckData.powerWords.find(w => w.id === cardData.wordId);
      if (foundWord) {
        wordData = { ...foundWord, ...cardData };
      }
    }

    return `
A vertical children's educational vocabulary card in 5:7 aspect ratio (1500x2100 pixels).

${buildStyleBlock('powerWord')}

=== CARD TYPE: POWER WORD (Hebrew Vocabulary) ===
Teaching the Hebrew word: ${wordData.hebrew}
Pronounced: ${wordData.pronunciation}
Meaning: ${wordData.english}

=== CONTENT ===
Title: "${cardData.title}"
Hebrew word: ${wordData.hebrew} (LARGE, with vowel points/nikud)
English meaning: ${wordData.english}
Pronunciation guide: ${wordData.pronunciation}
Simple definition: "${wordData.definition || wordData.simpleDefinition}"

=== VISUAL DESCRIPTION ===
${cardData.visualPrompt}

Visual association for the word: ${wordData.visualAssociation || cardData.visualPrompt}

=== COMPOSITION ===
Layout (top to bottom):
1. TITLE ZONE (top 15%): "${cardData.title}" in friendly font
2. HEBREW WORD (upper center 20%):
   - ${wordData.hebrew} in LARGE, clear Hebrew block letters
   - Include nikud (vowel points)
   - Slight glow or emphasis to make it special
3. VISUAL ASSOCIATION (center 40%):
   - Image that helps children remember the word's meaning
   - ${cardData.visualPrompt}
4. ENGLISH & PRONUNCIATION (lower 20%):
   - English translation: ${wordData.english}
   - Pronunciation: (${wordData.pronunciation})
   - Simple definition: "${wordData.definition || wordData.simpleDefinition}"

Typography priorities:
- Hebrew word is the STAR - large, clear, beautiful
- Nikud (vowels) clearly visible
- English supports the Hebrew, doesn't overshadow it
- Visual helps memory association

=== FRAME ===
- Rounded corners (8-10px radius)
- Border: ${borderColor} (8px width) - blue for learning
- Aleph-Bet (אב) icon in top-left corner (power word indicator)
- Optional: subtle sparkle or glow around Hebrew word

=== MOOD ===
This card says: "Let's learn a special Hebrew word!"
It should feel: Educational but fun, special and memorable.
    `.trim();
  },

  /**
   * Generate a simplified prompt for testing
   */
  generateSimple(deckData, cardData) {
    let wordData = cardData;
    if (cardData.wordId && deckData.powerWords) {
      const foundWord = deckData.powerWords.find(w => w.id === cardData.wordId);
      if (foundWord) wordData = { ...foundWord, ...cardData };
    }

    return `
Children's Hebrew vocabulary card, 5x7 inches, vivid cartoon style.

Hebrew Word: ${wordData.hebrew} (LARGE, with vowel points)
Meaning: ${wordData.english}
Pronunciation: ${wordData.pronunciation}

Visual to help remember: ${cardData.visualPrompt}

The Hebrew word should be the largest element, clearly readable.
Supporting illustration helps children associate word with meaning.
Blue border, bright cheerful colors, educational feel.

Child-friendly ages 4-6.
    `.trim();
  },

  /**
   * Generate the practice prompt for teacher use
   */
  generateTeacherPractice(deckData, cardData) {
    let wordData = cardData;
    if (cardData.wordId && deckData.powerWords) {
      const foundWord = deckData.powerWords.find(w => w.id === cardData.wordId);
      if (foundWord) wordData = { ...foundWord, ...cardData };
    }

    return `
=== POWER WORD: ${wordData.hebrew} (${wordData.english}) ===

INTRODUCE:
"${cardData.teacherScript?.intro || `Let's learn a special Hebrew word! Say it with me: ${wordData.pronunciation}!`}"

EXPLAIN:
"${cardData.teacherScript?.meaning || wordData.simpleDefinition}"

CONNECT TO STORY:
"${cardData.teacherScript?.connection || wordData.usageInStory || `This word appears in our parasha story.`}"

PRACTICE:
"${cardData.teacherScript?.practice || cardData.practice || `Can you say ${wordData.pronunciation} with me?`}"
    `.trim();
  }
};

export default powerWordCardTemplate;
