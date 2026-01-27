/**
 * Background component templates for card generation
 * Each background maps to a card-type and provides the environment description
 */

export const backgrounds = {
  "thunder-lightning": {
    description: "vibrant, electric gradient filled with glowing nebulae, cosmic dust, and white-hot electric lightning bolts arcing across the scene",
    primaryGradient: ["deep purple", "electric blue"],
    effects: ["lightning bolts", "cosmic dust", "nebula glow", "star particles"],
    lighting: "dramatic rim lighting with electric highlights"
  },

  "beam-team": {
    description: "dark arena background with converging holographic light beams, laser effects, and neon geometric shapes",
    primaryGradient: ["deep black", "dark blue"],
    effects: ["laser beams", "holographic light", "neon triangles", "spotlight rays"],
    lighting: "stadium spotlights with beam intersection"
  },

  "metal-universe": {
    description: "etched metal background with futuristic industrial patterns, chrome surfaces, and neon accent lines",
    primaryGradient: ["chrome silver", "gunmetal"],
    effects: ["metal etchings", "circuit patterns", "neon accents", "reflective surfaces"],
    lighting: "harsh industrial lighting with chrome reflections"
  },

  "prizm-silver": {
    description: "clean geometric pattern with silver shimmer, minimal design elements, and refractor light effects",
    primaryGradient: ["silver", "white"],
    effects: ["geometric lines", "light refraction", "subtle shimmer"],
    lighting: "clean, even lighting with holographic highlights"
  },

  "downtown": {
    description: "stylized city skyline background with neon lights, urban atmosphere, and geometric building shapes",
    primaryGradient: ["deep navy", "sunset orange"],
    effects: ["city lights", "neon signs", "geometric buildings"],
    lighting: "dramatic sunset backlighting with neon glow"
  },

  "kaboom": {
    description: "comic book style explosion background with bold colors, action lines, and pop art elements",
    primaryGradient: ["bright red", "yellow"],
    effects: ["explosion burst", "action lines", "halftone dots", "starburst"],
    lighting: "flat comic book lighting with bold shadows"
  }
};

/**
 * Get background template by card type ID
 */
export function getBackground(cardTypeId) {
  return backgrounds[cardTypeId] || null;
}

/**
 * Generate background prompt segment
 */
export function generateBackgroundPrompt(cardTypeId, customColors = null) {
  const bg = backgrounds[cardTypeId];
  if (!bg) return "";

  const colors = customColors || bg.primaryGradient;
  const effects = bg.effects.join(", ");

  return `BACKGROUND: ${bg.description.replace(
    /deep purple.*electric blue/,
    colors.join(" and ")
  )}. ${bg.lighting}.`;
}
