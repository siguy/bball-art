/**
 * Thunder & Lightning Card Template
 * Based on 1993-94 Fleer Ultra insert set
 */

import { generateBackgroundPrompt } from '../components/backgrounds.js';
import { generateFinishPrompt } from '../components/finishes.js';
import { generatePosePrompt } from '../components/poses.js';

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
    const colors = options.colors || {
      primary: "deep purple",
      secondary: "electric blue"
    };

    const prompt = `
A vertical 1990s premium basketball card in the style of the "Thunder & Lightning" insert set from 1993-94 Fleer Ultra.

COMPOSITION: The card features two figures emerging from a cosmic, high-energy background.

LEFT FIGURE: ${player.name} in a dynamic ${player.signatureMoves[0]} pose, wearing a generic pro basketball jersey in ${player.teamColors.join(", ")} with no logos or team names. ${player.physicalDescription}. Stylized but recognizable artistic rendering, NOT a photograph.

RIGHT FIGURE: ${figure.name} in a ${figure.visualStyle} artistic style, holding ${figure.attributeDescription}. ${figure.physicalDescription}. Classical artistic interpretation.

${generatePosePrompt(interaction, player.name, figure.name)}

${generateBackgroundPrompt("thunder-lightning", [colors.primary, colors.secondary])}

TOP SECTION: The title "THUNDER & LIGHTNING" written in a clean, bold, white 1990s sans-serif font with a subtle drop shadow. Below or overlapping the figures at the top center is the "COURT & COVENANT" brand logo in a smaller, sophisticated gold script.

BOTTOM SECTION: A simple, elegant bar with the names "${player.name} & ${figure.name}" in clean white text.

${generateFinishPrompt("refractor")}

CRITICAL REQUIREMENTS:
- NO NBA logos anywhere on the card
- NO official team branding or team names
- NO real brand marks or trademarks
- This is stylized ART, not a photograph
- Both figures should be recognizable but artistically interpreted
- The overall feel should be premium, collectible, and high-energy
`.trim();

    return prompt;
  }
};

export default thunderLightningTemplate;
