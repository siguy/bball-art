#!/usr/bin/env node
/**
 * Trial Card Template
 * Torah Titans specific template for characters facing tests/challenges
 *
 * Designed for Abraham's 10 Trials, tests of faith, pivotal moments.
 * Dramatic, intense aesthetic emphasizing the weight of the challenge.
 */

import { generateSoloPoseBlock } from '../../components/poses.js';

export const trialCardTemplate = {
  id: "trial-card",
  name: "Trial Card",
  series: "torah-titans",
  era: "Biblical",

  /**
   * Generate the full prompt for a Trial Card
   * This is primarily a solo character template showing one figure facing a trial
   * @param {object} pairing - The pairing/trial data
   * @param {object} options - Generation options including trial info
   */
  generate(pairing, options = {}) {
    // For trial cards, we focus on one character facing a challenge
    const character = pairing.player || pairing.char1 || pairing.characters?.[0];
    const trial = pairing.seriesSpecificData || options.trial || {};

    const trialName = trial.trialName || pairing.connection?.thematic || "The Trial";
    const trialNumber = trial.trialNumber || null;

    const clothing = character.clothing || `${character.visualStyle || 'ancient'} robes and garments`;

    // Get pose from options or default
    const pose = options.pose || character.defaultPose || {
      name: "facing trial",
      prompt: `${character.name} stands resolute, facing an immense challenge with unwavering faith`,
      energy: "Determined, faithful, tested"
    };

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "Trial Card" for the Torah Titans series.

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER facing a TRIAL or TEST
2. Dramatic lighting with divine tension - light breaking through darkness
3. Classical artistic interpretation, biblical period accurate
4. The figure must have exactly TWO ARMS
5. This is STYLIZED ART for a collectible card, not a photograph

=== TRIAL CONTEXT ===
${trialNumber ? `Trial ${trialNumber}: ` : ''}${trialName}
${pairing.connection?.narrative || 'A moment of profound testing and faith.'}

=== SINGLE FIGURE POSE ===
${character.name} is shown facing the trial:
${pose.prompt || `${character.name} stands in a pose of determination and faith`}
Energy: ${pose.energy || 'Tested, faithful, resolute'}

=== CHARACTER DESCRIPTION ===

${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${clothing}
- Style: Classical artistic interpretation, biblical period accurate
- Expression: Shows the weight of the trial - determined but tested
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}

=== COMPOSITION ===
TRIAL CARD: ${character.name} is the CENTRAL figure, facing the challenge.
- Character should be PROMINENT, filling 60-70% of card height
- Position slightly left of center, facing the challenge (symbolic space on right)
- Show from approximately ankle-level up
- Body language conveys the tension of the moment

=== BACKGROUND ===
Split atmosphere representing the trial:
- Upper area: Dark, turbulent clouds suggesting divine testing
- Light breaking through: Golden rays piercing the darkness, suggesting hope and God's presence
- Lower area: The specific trial setting (mount, desert, fire, etc.)
- Dramatic chiaroscuro lighting - strong contrast between light and shadow

The background should enhance the dramatic weight of the trial without overwhelming the figure.

=== VISUAL ELEMENTS OF THE TRIAL ===
Subtle visual hints of the specific trial:
${trialName.toLowerCase().includes('binding') || trialName.toLowerCase().includes('akeidah') ? '- Mount Moriah, altar stones, wood bundle' : ''}
${trialName.toLowerCase().includes('famine') ? '- Barren landscape, distant Egypt' : ''}
${trialName.toLowerCase().includes('covenant') || trialName.toLowerCase().includes('pieces') ? '- Divided animals, torch of fire, stars above' : ''}
${trialName.toLowerCase().includes('circumcision') ? '- Tent of Abraham, family gathering, covenant symbol' : ''}
- General trial imagery: Flames of faith, divine light, weight of decision

=== BORDER & FRAME ===
Dark bronze border with fiery accents. Subtle flame or smoke motifs along edges. Ancient manuscript feel with weathered texture suggesting the weight of history.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "TORAH TITANS" in bronze metallic font. Centered at top.

SUBTITLE: Below the title, write "TRIAL${trialNumber ? ` ${trialNumber}` : ''}" in smaller caps with ember glow effect.

TRIAL NAME: Write "${trialName}" in elegant script below subtitle.

BOTTOM: Write "${character.displayName || character.name}" in warm bronze text. Centered at bottom.

=== FINISH ===
Antiqued bronze finish with subtle ember glow effects. Premium collectible card feel with dramatic, weighty aesthetic.
`.trim();

    return prompt;
  },

  /**
   * Generate a solo character card
   * Same as generate() for trial cards since they're inherently solo
   */
  generateSolo(character, options = {}) {
    const pose = character.pose || options.pose || {
      name: "facing trial",
      prompt: `${character.name} stands resolute, facing an immense challenge`,
      energy: "Determined, faithful, tested"
    };

    const clothing = character.clothing || `${character.visualStyle || 'ancient'} robes and garments`;
    const trialName = options.trialName || "The Trial";
    const trialNumber = options.trialNumber || null;

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "Trial Card" for the Torah Titans series.

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER facing a TRIAL or TEST
2. Dramatic lighting with divine tension
3. Classical artistic interpretation, biblical period accurate
4. The figure must have exactly TWO ARMS
5. This is STYLIZED ART for a collectible card, not a photograph

=== SINGLE FIGURE POSE ===
${character.name} is shown facing the trial:
${pose.prompt || `${character.name} stands resolute, facing the challenge`}
Energy: ${pose.energy || 'Tested, faithful, resolute'}

=== CHARACTER DESCRIPTION ===

${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${clothing}
- Style: Classical artistic interpretation, biblical period accurate
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}

=== COMPOSITION ===
SOLO TRIAL CARD: ${character.name} is the ONLY figure on this card.
- Character should be CENTERED and DOMINANT
- Show FULL BODY from head to feet - character fills 60-70% of card height
- Body language conveys the weight of the trial

=== BACKGROUND ===
Split atmosphere representing the trial:
- Upper area: Dark, turbulent clouds
- Light breaking through: Golden rays piercing the darkness
- Dramatic chiaroscuro lighting

=== BORDER & FRAME ===
Dark bronze border with fiery accents. Ancient manuscript feel.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "TORAH TITANS" in bronze metallic font. Centered at top.

SUBTITLE: Below the title, write "TRIAL${trialNumber ? ` ${trialNumber}` : ''}" in smaller caps.

TRIAL NAME: Write "${trialName}" in elegant script.

BOTTOM: Write "${character.displayName || character.name}" in warm bronze text. Centered at bottom.

=== FINISH ===
Antiqued bronze finish with subtle ember glow effects.
`.trim();

    return prompt;
  }
};

export default trialCardTemplate;
