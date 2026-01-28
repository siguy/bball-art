#!/usr/bin/env node
/**
 * Beam Team: Rivalry Template
 * Hero vs Villain split card with prismatic VS divider.
 *
 * Visual: Light prism hero side vs corrupted dark spectrum villain side,
 * prismatic fracture line splitting the card.
 */

import { buildCharacterDescription, buildRivalryPoseBlock } from '../components/rivalry-helpers.js';

export const beamTeamRivalryTemplate = {
  id: "beam-team-rivalry",
  name: "Beam Team: Rivalry",
  era: "1990s",

  /**
   * Generate the full prompt for a rivalry Beam Team card
   */
  generate(pairing, options = {}) {
    const hero = pairing.player;
    const villain = pairing.figure;
    const heroType = pairing.player.characterType || 'player';
    const villainType = pairing.figure.characterType || 'figure';

    const interaction = options.interaction || 'face-off';

    const customActions = (options.customPlayerAction && options.customFigureAction)
      ? {
          heroAction: options.customPlayerAction,
          villainAction: options.customFigureAction,
          energy: options.customEnergy || null
        }
      : null;

    const poseBlock = buildRivalryPoseBlock(pairing, interaction, customActions);
    const heroDescription = buildCharacterDescription(hero, heroType, 'hero', options);
    const villainDescription = buildCharacterDescription(villain, villainType, 'villain', options);

    const prompt = `
A vertical premium basketball card in 3:4 aspect ratio, styled after 1992-93 Stadium Club "Beam Team" insert - RIVALRY EDITION with split holographic prism design.

=== CRITICAL REQUIREMENTS ===
1. SPLIT CARD - Hero on LEFT, Villain on RIGHT, prismatic VS DIVIDER in center
2. All basketball players wear COMPLETELY BLANK uniforms - NO logos, NO numbers, NO team names, NO brand marks
3. All figures must have exactly TWO ARMS
4. This is STYLIZED ART for a collectible card, not a photograph
5. RIVALRY CARD - two opposing characters in confrontation

${poseBlock}

=== CHARACTER DESCRIPTIONS ===

${heroDescription}

${villainDescription}

=== COMPOSITION (SPLIT CARD) ===
CRITICAL SPLIT LAYOUT:
- LEFT HALF: ${hero.name} (HERO) occupying the left side against prismatic light
- RIGHT HALF: ${villain.name} (VILLAIN) occupying the right side against corrupted spectrum
- CENTER: A shattered prism fracture line splitting the card - light refracting on the hero side, darkening into shadow on the villain side
- Both figures are LARGE and PROMINENT, shown from approximately knee-level up
- The two halves represent light vs corruption of the same prism

=== CARD FRAME DESIGN (CRITICAL) ===
LEFT BORDER: HOLOGRAPHIC PRISM border - rainbow spectrum, crystalline light refraction, pure and brilliant
RIGHT BORDER: CORRUPTED PRISM border - purple/red spectrum, cracked crystal effect, shadow and smoke within
CENTER DIVIDER: A jagged prismatic fracture where pure light meets corrupted shadow. The crack refracts light into broken rainbow shards.

LEFT BACKGROUND: Deep black arena with brilliant rainbow prismatic reflections. Pure, radiant energy.
RIGHT BACKGROUND: Dark arena with corrupted purple/red prism effects. Cracked, smoky, ominous.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "BEAM TEAM" in HOLOGRAPHIC CHROME font - left half rainbow shimmer, right half darkened crimson. Add "RIVALRY" in smaller silver text below. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in iridescent gold with prismatic shimmer.

BOTTOM LEFT: Write "${hero.displayName || hero.name}" in silver holographic text.
BOTTOM RIGHT: Write "${villain.displayName || villain.name}" in crimson holographic text.
BOTTOM CENTER: "VS" in bold gold text between the names.

=== FINISH ===
Ultra-premium holographic card finish. Left side shimmers with pure rainbow refraction, right side with corrupted dark spectrum. Rivalry edition collectible.
`.trim();

    return prompt;
  }
};

export default beamTeamRivalryTemplate;
