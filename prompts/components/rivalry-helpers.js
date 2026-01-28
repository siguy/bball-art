/**
 * Rivalry Helpers
 *
 * Shared functions used by all rivalry card templates.
 * Builds character descriptions and pose blocks that work for
 * any combination of character types (player/figure).
 */

/**
 * Build a character description block for a rivalry card.
 * Handles both player and figure character types.
 *
 * @param {object} character - Character data from the pairing slot (player or figure)
 * @param {string} characterType - 'player' or 'figure'
 * @param {'hero'|'villain'} side - Which side of the rivalry
 * @param {object} options - { jerseyColors }
 */
export function buildCharacterDescription(character, characterType, side, options = {}) {
  const expression = side === 'hero'
    ? 'FIERCE DETERMINATION - competitive fire, focused intensity, righteous confidence'
    : 'SINISTER MENACE - intimidating stare, cruel confidence, cold ruthless gaze';

  if (characterType === 'player') {
    // Both hero and villain wear their iconic team-color jersey (primary)
    // Hero-villain distinction comes from expression, composition, and background — not jersey color
    const jersey = options.jerseyColors || character.jerseyColors?.primary || { base: 'white', accent: 'blue' };
    const jerseyBase = jersey.base;
    const jerseyAccent = jersey.accent;

    return `
${character.name.toUpperCase()} (${side.toUpperCase()} - NBA PLAYER):
- Physical: ${character.physicalDescription || 'athletic build, professional basketball player'}
- Expression: ${expression}
- Wearing: PLAIN SOLID ${jerseyBase.toUpperCase()} basketball tank top and shorts with ${jerseyAccent} trim. COMPLETELY BLANK uniform - NO logos, NO numbers, NO symbols.
- Style: Stylized artistic rendering, recognizable likeness but NOT photorealistic`.trim();
  }

  // Figure type
  const clothing = character.clothing || `${character.visualStyle || 'biblical'} robes and garments`;
  return `
${character.name.toUpperCase()} (${side.toUpperCase()} - BIBLICAL FIGURE):
- Physical: ${character.physicalDescription || 'dignified bearing, period-accurate appearance'}
- Expression: ${expression}
- Wearing: ${clothing}
- Style: Classical artistic interpretation, biblical period accurate
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}`.trim();
}

/**
 * Rivalry interaction types.
 */
const RIVALRY_INTERACTIONS = {
  'face-off': {
    name: 'Face-Off',
    description: 'Intense stare-down across the divide',
    heroAction: 'standing tall with fierce determination, jaw set, eyes locked on opponent across the divide',
    villainAction: 'standing with menacing confidence, arms crossed or weapon ready, cold stare back',
    energy: 'tension, rivalry, pre-battle intensity'
  },
  'clash': {
    name: 'Clash',
    description: 'Mid-action collision at the center divide',
    heroAction: 'mid-action signature move, full power unleashed toward the center',
    villainAction: 'mid-action counter-move, meeting force with force at the divide',
    energy: 'explosive collision, unstoppable force vs immovable object'
  },
  'judgment': {
    name: 'Judgment',
    description: 'Hero victorious, villain acknowledging defeat',
    heroAction: 'triumphant stance, fist raised or celebrating victory, looking across at fallen rival',
    villainAction: 'forced respect or bitter defeat, head slightly bowed but eyes still defiant',
    energy: 'triumph and bitter defeat, decisive moment, legacy defined'
  }
};

/**
 * Build a rivalry-specific pose block for the prompt.
 *
 * @param {object} pairing - Full pairing data
 * @param {string} interactionId - 'face-off', 'clash', 'judgment', or custom action ID
 * @param {object} customActions - Optional { heroAction, villainAction, energy }
 */
export function buildRivalryPoseBlock(pairing, interactionId = 'face-off', customActions = null) {
  const heroName = pairing.player.name;
  const villainName = pairing.figure.name;

  if (customActions && customActions.heroAction && customActions.villainAction) {
    return `
=== RIVALRY INTERACTION: CUSTOM ===
Overall: ${heroName} vs ${villainName} in direct confrontation
Energy/Mood: ${customActions.energy || 'intense rivalry, legendary confrontation'}

LEFT SIDE - ${heroName.toUpperCase()} (HERO):
${customActions.heroAction}

RIGHT SIDE - ${villainName.toUpperCase()} (VILLAIN):
${customActions.villainAction}
`.trim();
  }

  const interaction = RIVALRY_INTERACTIONS[interactionId] || RIVALRY_INTERACTIONS['face-off'];

  return `
=== RIVALRY INTERACTION: ${interaction.name.toUpperCase()} ===
Overall: ${interaction.description}
Energy/Mood: ${interaction.energy}

LEFT SIDE - ${heroName.toUpperCase()} (HERO):
${interaction.heroAction}

RIGHT SIDE - ${villainName.toUpperCase()} (VILLAIN):
${interaction.villainAction}
`.trim();
}

export default {
  buildCharacterDescription,
  buildRivalryPoseBlock
};
