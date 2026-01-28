#!/usr/bin/env node
/**
 * Metal Universe: Rivalry Template
 * Hero vs Villain split card with industrial VS divider.
 *
 * Visual: Polished chrome hero side vs rusted black industrial villain side,
 * molten metal crack splitting the card.
 */

import { buildCharacterDescription, buildRivalryPoseBlock } from '../components/rivalry-helpers.js';

export const metalUniverseRivalryTemplate = {
  id: "metal-universe-rivalry",
  name: "Metal Universe: Rivalry",
  era: "1990s",

  /**
   * Generate the full prompt for a rivalry Metal Universe card
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
A vertical premium basketball card in 3:4 aspect ratio, styled after 1997-98 Fleer Metal Universe insert set - RIVALRY EDITION with industrial split design.

=== CRITICAL REQUIREMENTS ===
1. SPLIT CARD - Hero on LEFT, Villain on RIGHT, molten metal VS DIVIDER in center
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
- LEFT HALF: ${hero.name} (HERO) occupying the left side against polished chrome
- RIGHT HALF: ${villain.name} (VILLAIN) occupying the right side against rusted industrial decay
- CENTER: A jagged crack of molten metal splitting the card - polished on one side, corroded on the other
- Both figures are LARGE and PROMINENT, shown from approximately knee-level up
- The two halves contrast pristine industry vs industrial decay

=== BACKGROUND ===
LEFT SIDE (HERO): Polished chrome and steel environment. Clean geometric rivets and panels. Deep blue and silver metallic sheen. Pristine industrial power. Chrome pipes gleaming.
RIGHT SIDE (VILLAIN): Rusted black chrome, corroded metal, industrial decay. Rust red and dark iron. Hellscape of broken machinery and molten cracks. Menacing industrial ruin.
CENTER DIVIDER: A jagged vertical crack of glowing MOLTEN METAL - orange-white hot liquid metal seeping between the two worlds. Sparks and embers flying from the fracture.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "METAL UNIVERSE" in bold 3D metallic font - left half polished chrome, right half rusted iron. Add "RIVALRY" in smaller crimson metallic text below. Centered at top.

LOGO: Below the title, render the provided "Court & Covenant" logo image in SHINY GOLD metallic finish with rich reflective quality.

BOTTOM LEFT: Write "${hero.displayName || hero.name}" in chrome gradient text.
BOTTOM RIGHT: Write "${villain.displayName || villain.name}" in rust-red metallic text.
BOTTOM CENTER: "VS" in bold molten gold text between the names.

=== FINISH ===
Highly reflective chrome card finish. Left side pristine mirror chrome, right side darkened corroded metal. Premium rivalry Metal Universe collectible.
`.trim();

    return prompt;
  }
};

export default metalUniverseRivalryTemplate;
