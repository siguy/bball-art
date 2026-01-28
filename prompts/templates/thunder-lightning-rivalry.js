#!/usr/bin/env node
/**
 * Thunder & Lightning: Rivalry Template
 * Hero vs Villain split card with VS divider.
 *
 * Visual: Purple/blue hero side vs black/crimson villain side,
 * electric VS divider down the center, lightning splitting the scene.
 */

import { buildCharacterDescription, buildRivalryPoseBlock } from '../components/rivalry-helpers.js';

export const thunderLightningRivalryTemplate = {
  id: "thunder-lightning-rivalry",
  name: "Thunder & Lightning: Rivalry",
  era: "1990s",

  /**
   * Generate the full prompt for a rivalry Thunder & Lightning card
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
A vertical premium basketball card in 3:4 aspect ratio, styled after 1993-94 Fleer Ultra "Thunder & Lightning" insert set - RIVALRY EDITION.

=== CRITICAL REQUIREMENTS ===
1. SPLIT CARD - Hero on LEFT, Villain on RIGHT, VS DIVIDER in center
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
- LEFT HALF: ${hero.name} (HERO) occupying the left side of the card
- RIGHT HALF: ${villain.name} (VILLAIN) occupying the right side of the card
- CENTER: A dramatic VS DIVIDER - a jagged lightning bolt or energy crack splitting the card vertically
- Both figures are LARGE and PROMINENT, shown from approximately knee-level up
- The two halves should feel like separate worlds colliding at the divider

=== BACKGROUND ===
LEFT SIDE (HERO): Deep purple and electric blue cosmic gradient with white-hot lightning bolts. Noble, powerful energy.
RIGHT SIDE (VILLAIN): Black and blood-red ominous gradient with crimson lightning. Sinister, threatening energy.
CENTER DIVIDER: A jagged line of pure white-hot electricity splitting the two worlds. "VS" may appear subtly in the energy.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "THUNDER & LIGHTNING" in bold, white, 1990s-style sans-serif font with metallic sheen. Add "RIVALRY" in smaller crimson text below. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image SMALL in BRIGHT SHINY GOLD with glow effect.

BOTTOM LEFT: Write "${hero.displayName || hero.name}" in silver text.
BOTTOM RIGHT: Write "${villain.displayName || villain.name}" in crimson text.
BOTTOM CENTER: "VS" in bold gold text between the names.

=== FINISH ===
High-gloss refractor finish with holographic light-bending effect. Left side shimmers purple/blue, right side shimmers red/black. Premium 1990s rivalry card feel.
`.trim();

    return prompt;
  }
};

export default thunderLightningRivalryTemplate;
