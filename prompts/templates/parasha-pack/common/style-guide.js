/**
 * Parasha Pack Style Guide
 *
 * Visual constants and style rules for all Parasha Pack cards.
 * Designed for preschool/kindergarten children (ages 4-6).
 *
 * Card size: 5" x 7" (1500 x 2100 px at 300 DPI)
 */

// Visual style constants
export const STYLE = {
  // Overall aesthetic
  aesthetic: `
    Vivid, high-contrast cartoon style suitable for ages 4-6.
    Think: Colorful children's book illustration meets educational flashcard.
    - Characters: Rounded, friendly shapes. Large expressive eyes (20% of face).
    - Forms: Simple shapes, no fine details or complex patterns.
    - Lines: Thick, clean black outlines (2-3px equivalent).
    - Contrast: High contrast between foreground and background.
    - Emotion: Big, clear facial expressions visible from across a classroom.
    - Complexity: Maximum 5-7 distinct visual elements per scene.
  `,

  // Color palette
  colors: {
    foreground: {
      red: '#FF4136',
      blue: '#0074D9',
      yellow: '#FFDC00',
      green: '#2ECC40',
      description: 'Bold primary colors for characters and main actions'
    },
    background: {
      pink: '#FFE5E5',
      lightBlue: '#E5F0FF',
      cream: '#FFFBE5',
      mint: '#E5FFE5',
      description: 'Soft pastels to ensure characters "pop" and avoid overstimulation'
    },
    thematic: {
      desert: '#F5DEB3',    // Sandy yellow for wilderness stories
      water: '#87CEEB',     // Deep water blue for sea/flood stories
      garden: '#90EE90',    // Lush green for Garden of Eden
      mountain: '#DEB887',  // Rocky tan for Sinai
      fire: '#FFD700',      // Golden for divine presence
      night: '#2C3E50'      // Deep blue for evening scenes
    }
  },

  // Card format
  format: {
    size: '5x7 inches',
    ratio: '5:7',
    pixels: { width: 1500, height: 2100 },
    dpi: 300,
    corners: 'rounded (8-10px radius)'
  },

  // Character styling
  characters: {
    bodyShape: 'rounded, soft, non-threatening',
    eyes: 'large and expressive (20% of face height)',
    lineWeight: 'thick, clean outlines',
    proportions: 'slightly simplified/cartoony (larger head ratio for children)',
    skinTones: 'diverse range of warm browns',
    expressions: 'clear, exaggerated, readable from distance'
  },

  // Text styling for cards that include text
  text: {
    title: {
      size: 'large (fill ~15% of card width)',
      weight: 'bold',
      font: 'rounded, friendly sans-serif',
      maxWords: 5
    },
    body: {
      size: 'medium (readable at print size)',
      maxWords: 20,
      sentenceStructure: 'simple subject-verb-object',
      readingLevel: 'pre-K to K'
    },
    hebrew: {
      size: 'large, clear',
      vowels: 'always include nikud (vowel points)',
      style: 'block letters, not cursive'
    }
  }
};

// Safety restrictions - NEVER include these
export const RESTRICTIONS = {
  neverDepict: [
    'God in any human or physical form',
    'Graphic violence, blood, or injury',
    'Death shown explicitly (no bodies, graves visible)',
    'Scary monsters, demons, or frightening creatures',
    'Weapons striking or causing harm',
    'Complex scenes with many small details',
    'Dark, shadowy, or threatening environments',
    'Realistic styles that might be too intense'
  ],

  divinePresence: {
    description: 'When representing God or divine presence, use ONLY:',
    approved: [
      'Warm golden/white light rays from above',
      'Glowing, soft clouds with radiance',
      'Environmental effects (gentle wind, soft fire)',
      'Stylized Hebrew text with gentle glow',
      'Hands reaching down from clouds (no body visible)',
      'A soft, welcoming light source'
    ],
    forbidden: [
      'Any humanoid figure for God',
      'A face or body representing God',
      'Harsh, frightening light (lightning OK for Sinai but not scary)'
    ]
  }
};

// Emotional expression guidelines
export const EMOTIONS = {
  // Emotion word bank - what characters can display
  wordBank: {
    positive: ['Happy', 'Proud', 'Excited', 'Loved', 'Safe', 'Grateful', 'Brave', 'Kind'],
    challenging: ['Scared', 'Worried', 'Sad', 'Angry', 'Confused', 'Lonely', 'Nervous'],
    complex: ['Nervous-but-excited', 'Sad-but-hopeful', 'Scared-but-brave']
  },

  // Visual cues for each emotion
  visualCues: {
    happy: 'big smile, eyes slightly closed/crinkled, relaxed posture',
    proud: 'chest slightly forward, smile, confident stance',
    excited: 'wide eyes, open mouth smile, arms up or animated',
    scared: 'wide eyes, hands up defensively, shoulders hunched',
    worried: 'furrowed brow, hand to chin/chest, downturned mouth',
    sad: 'downturned mouth, droopy eyes, slumped shoulders',
    angry: 'furrowed brow, frown, hands on hips or crossed arms',
    awe: 'wide eyes, mouth slightly open, looking up, hands together',
    loving: 'soft smile, gentle eyes, open arms or hands on heart'
  },

  // For spotlight cards - one clear emotion
  spotlightRule: 'Each spotlight card shows ONE clear emotion. Label it.',

  // For action cards - show reactions
  actionRule: 'Characters react emotionally to events. Show the feeling, not just the action.'
};

// Card border styles by type
export const BORDERS = {
  anchor: {
    color: '#FFD700',       // Gold
    width: '8px',
    icon: 'star',
    iconPosition: 'top-left'
  },
  spotlight: {
    color: '#FF9500',       // Orange
    width: '8px',
    icon: 'person-circle',
    iconPosition: 'top-left'
  },
  action: {
    color: '#FF4136',       // Red
    width: '8px',
    icon: 'lightning-bolt',
    iconPosition: 'top-left'
  },
  thinker: {
    color: '#9B59B6',       // Purple
    width: '8px',
    icon: 'question-mark',
    iconPosition: 'top-left'
  },
  powerWord: {
    color: '#0074D9',       // Blue
    width: '8px',
    icon: 'aleph-bet',
    iconPosition: 'top-left'
  }
};

// Thematic border colors based on story setting
export const THEMATIC_BORDERS = {
  desert: '#F5DEB3',
  garden: '#90EE90',
  water: '#87CEEB',
  mountain: '#DEB887',
  egypt: '#CD853F',
  fire: '#FFD700',
  night: '#2C3E50'
};

/**
 * Build the base style block for any Parasha Pack card
 * @param {string} cardType - Type of card (anchor, spotlight, action, thinker, power-word)
 * @returns {string} Style instructions for the prompt
 */
export function buildStyleBlock(cardType) {
  const border = BORDERS[cardType] || BORDERS.action;

  return `
=== STYLE ===
${STYLE.aesthetic}

Card Format: ${STYLE.format.size} (${STYLE.format.pixels.width}x${STYLE.format.pixels.height}px)
Corners: ${STYLE.format.corners}

Colors:
- Characters and main elements: Bold primary colors (${Object.values(STYLE.colors.foreground).filter(v => typeof v === 'string').join(', ')})
- Backgrounds: Soft pastels (${Object.values(STYLE.colors.background).filter(v => typeof v === 'string').join(', ')})

Border: ${border.color} (${border.width}) with ${border.icon} icon in ${border.iconPosition}

=== RESTRICTIONS ===
NEVER depict:
${RESTRICTIONS.neverDepict.map(r => `- ${r}`).join('\n')}

If depicting divine presence:
${RESTRICTIONS.divinePresence.approved.map(a => `- ${a}`).join('\n')}
  `.trim();
}

/**
 * Build emotional expression instructions
 * @param {string} emotion - Primary emotion to display
 * @returns {string} Emotion instructions for the prompt
 */
export function buildEmotionBlock(emotion) {
  const cue = EMOTIONS.visualCues[emotion?.toLowerCase()] || EMOTIONS.visualCues.happy;

  return `
=== EMOTION ===
Primary emotion: ${emotion || 'happy'}
Visual cues: ${cue}
Expression should be: Clear, exaggerated, readable from across a classroom.
  `.trim();
}

export default {
  STYLE,
  RESTRICTIONS,
  EMOTIONS,
  BORDERS,
  THEMATIC_BORDERS,
  buildStyleBlock,
  buildEmotionBlock
};
