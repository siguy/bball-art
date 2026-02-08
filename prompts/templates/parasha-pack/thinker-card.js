/**
 * Thinker Card Template
 * Parasha Pack - Discussion and emotional literacy card
 *
 * Contains 3 perspective-taking questions for circle time discussion.
 * Core emotional literacy framework.
 */

import { buildStyleBlock, STYLE, THEMATIC_BORDERS, EMOTIONS } from './common/style-guide.js';

export const thinkerCardTemplate = {
  id: 'thinker-card',
  name: 'Thinker Card',
  series: 'parasha-pack',
  cardType: 'thinker',

  /**
   * Generate the full prompt for a Thinker Card
   * @param {object} deckData - Full deck data
   * @param {object} cardData - Specific card data from deck.cards[]
   * @param {object} options - Additional options
   * @returns {string} Complete prompt for image generation
   */
  generate(deckData, cardData, options = {}) {
    const borderColor = THEMATIC_BORDERS[cardData.border?.color] || '#9B59B6';

    // Extract the three question types
    const questions = cardData.questions || {};
    const emotionalQ = questions.emotional?.text || '';
    const cognitiveQ = questions.cognitive?.text || '';
    const connectionQ = questions.connection?.text || '';

    return `
A vertical children's educational card in 5:7 aspect ratio (1500x2100 pixels).

${buildStyleBlock('thinker')}

=== CARD TYPE: THINKER (Discussion/Emotional Literacy) ===
This card prompts discussion with 3 perspective-taking questions.
The visual should support emotional reflection and connection.

=== CONTENT ===
Title: "${cardData.title}"

Three Questions (for reference - not shown on card image):
1. EMOTIONAL EMPATHY: "${emotionalQ}"
2. COGNITIVE EMPATHY: "${cognitiveQ}"
3. CONNECTION: "${connectionQ}"

=== VISUAL DESCRIPTION ===
${cardData.visualPrompt}

=== EMOTIONAL LITERACY FOCUS ===
This image should help children:
- Notice and name emotions in the characters
- Practice perspective-taking ("How might they feel?")
- Connect the story to their own experiences

Show characters with CLEAR, READABLE emotions that invite discussion.
Multiple emotions visible if multiple characters.

=== COMPOSITION ===
Layout (top to bottom):
1. TITLE ZONE (top 10%): "${cardData.title}" with question mark motif
2. DISCUSSION SCENE (center 55%): Visual that prompts emotional thinking
   - Characters showing emotions clearly
   - Inviting, open composition that invites questions
   - Room for imagination ("What might happen next?")
3. QUESTION ZONE (bottom 30%): Space for question text overlay
   - This area can be slightly muted/lighter for text readability

Visual priorities:
- EMOTIONAL CLARITY - children can name what characters are feeling
- THOUGHT-PROVOKING - the scene raises questions
- RELATABLE - connects to children's own experiences
- OPEN - doesn't answer everything, invites discussion

=== FRAME ===
- Rounded corners (8-10px radius)
- Border: ${borderColor} (8px width) - purple for thinking
- Question mark icon in top-left corner (thinker card indicator)
- Gentle thought-bubble or cloud motif optional

=== MOOD ===
This card says: "Let's think together about feelings!"
It should feel warm, curious, and safe for sharing thoughts.

=== EMOTION WORD BANK (for reference) ===
Positive: ${EMOTIONS.wordBank.positive.join(', ')}
Challenging: ${EMOTIONS.wordBank.challenging.join(', ')}
Complex: ${EMOTIONS.wordBank.complex.join(', ')}
    `.trim();
  },

  /**
   * Generate a simplified prompt for testing
   */
  generateSimple(deckData, cardData) {
    return `
Children's discussion card, 5x7 inches, vivid cartoon style.

Scene: ${cardData.title}
${cardData.visualPrompt}

Show characters with CLEAR, OBVIOUS emotions that children can identify and discuss.
Warm, inviting composition that prompts questions like "How do they feel?"

Purple border with question mark. Bottom area lighter for question text.
Bold colors, thick outlines, large expressive faces.

Child-friendly ages 4-6. NO scary elements.
    `.trim();
  },

  /**
   * Generate just the questions formatted for teacher use
   */
  generateTeacherQuestions(cardData) {
    const questions = cardData.questions || {};

    return `
=== DISCUSSION QUESTIONS FOR: ${cardData.title} ===

1. EMOTIONAL EMPATHY (Sharing the feeling):
   Q: ${questions.emotional?.text || '[Question not provided]'}
   Follow-up: ${questions.emotional?.followUp || ''}

2. COGNITIVE EMPATHY (Understanding perspective):
   Q: ${questions.cognitive?.text || '[Question not provided]'}
   Follow-up: ${questions.cognitive?.followUp || ''}

3. CONNECTION (Relating to own life):
   Q: ${questions.connection?.text || '[Question not provided]'}
   Follow-up: ${questions.connection?.followUp || ''}

=== TEACHER TIPS ===
Before asking: "${cardData.teacherScript?.setup || 'Look at the picture together.'}"
Transition: "${cardData.teacherScript?.transition || 'What do you notice?'}"
After: "${cardData.teacherScript?.afterQuestions || 'Great thinking!'}"
    `.trim();
  }
};

export default thinkerCardTemplate;
