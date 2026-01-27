#!/usr/bin/env node
/**
 * Thunder & Lightning Card Template (v2)
 * Based on 1993-94 Fleer Ultra insert set
 *
 * Prompt structure optimized based on Nano Banana Pro best practices:
 * - Critical requirements at TOP
 * - Clear subject descriptions
 * - Explicit text rendering instructions
 * - Anatomy guidance
 */

import { getBackground } from '../components/backgrounds.js';
import { getFinish } from '../components/finishes.js';
import { getPose } from '../components/poses.js';

export const thunderLightningTemplate = {
  id: "thunder-lightning",
  name: "Thunder & Lightning",
  era: "1990s",

  /**
   * Generate the full prompt for a Thunder & Lightning card
   * @param {Object} pairing - The pairing data from pairings/*.json
   * @param {Object} options - Optional overrides (colors, pose, etc.)
   * @returns {string} - Complete prompt ready for image generation
   */
  generate(pairing, options = {}) {
    const player = pairing.player;
    const figure = pairing.figure;
    const interaction = options.interaction || pairing.defaultInteraction || "back-to-back";
    const pose = getPose(interaction);

    const colors = options.colors || {
      primary: "deep purple",
      secondary: "electric blue"
    };

    // Build clothing description for player - emphasizing NO LOGOS with positive description
    const playerClothing = `a PLAIN SOLID COLOR basketball tank top and shorts in ${player.teamColors.join(" and ")} colors. The jersey is COMPLETELY BLANK - solid color fabric only, like a practice jersey. NO WORDS, NO LETTERS, NO NUMBERS, NO LOGOS, NO SYMBOLS of any kind printed on the clothing`;

    // Get biblical figure's clothing
    const figureClothing = figure.clothing || `${figure.visualStyle} robes and garments`;

    const prompt = `
=== CRITICAL REQUIREMENTS - VIOLATIONS WILL RUIN THE IMAGE ===
1. The basketball player's jersey MUST BE COMPLETELY BLANK - solid color only, like an unlabeled practice uniform
2. DO NOT write any team names like "BULLS", "LAKERS", "WARRIORS" anywhere
3. DO NOT add any NBA logo, Nike swoosh, Jordan logo, or any brand marks
4. DO NOT add any numbers, letters, or symbols to the jersey
5. All figures must have exactly TWO ARMS - check anatomy carefully
6. This is STYLIZED ART for a collectible card, not a photograph

=== IMAGE DESCRIPTION ===
A vertical premium basketball card in the style of the 1993-94 Fleer Ultra "Thunder & Lightning" insert set.

SUBJECTS: Two figures standing ${pose.description}

FIGURE 1 - ${player.name}:
- ${player.physicalDescription}
- Wearing ${playerClothing}
- Pose: ${pose.playerPose}
- Style: Stylized artistic rendering, recognizable likeness but NOT photorealistic

FIGURE 2 - ${figure.name}:
- ${figure.physicalDescription}
- Wearing: ${figureClothing}
- Holding: ${figure.attributeDescription}
- Pose: ${pose.figurePose}
- Style: Classical artistic interpretation, biblical period accurate
${figure.anatomyNote ? `- IMPORTANT: ${figure.anatomyNote}` : ''}

INTERACTION: ${pose.energy}. The two figures are connected by the composition, energy flowing between them.

BACKGROUND: Vibrant electric gradient of ${colors.primary} and ${colors.secondary}, filled with glowing nebulae, cosmic dust particles, and white-hot electric lightning bolts arcing dramatically across the scene. Intense rim lighting on both subjects.

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "THUNDER & LIGHTNING" in bold, white, 1990s-style sans-serif font with metallic sheen and subtle drop shadow. Centered at top.

LOGO: Below the title, render "Court & Covenant" in elegant gold script font with slight glow effect. Smaller than the title.

BOTTOM: Write "${player.name} & ${figure.displayName}" in chrome/silver gradient text with bold, flashy 90s sports card style font. The names should have a metallic shine effect.

=== FINISH ===
High-gloss refractor finish with holographic light-bending effect. The entire card should have that premium 1990s insert card feel.
`.trim();

    return prompt;
  }
};

export default thunderLightningTemplate;
