/**
 * Card finish effects for different styles
 * These describe the surface treatment and light effects
 */

export const finishes = {
  "refractor": {
    name: "Refractor",
    description: "high-gloss refractor finish with intense rim lighting and light-bending holographic effect",
    characteristics: ["glossy surface", "rainbow light refraction", "sharp highlights"],
    era: "1990s-2000s"
  },

  "chrome": {
    name: "Chrome",
    description: "polished chrome coating with mirror shine and reflective surface",
    characteristics: ["mirror finish", "metallic sheen", "sharp reflections"],
    era: "1990s-2000s"
  },

  "etched-foil": {
    name: "Etched Foil",
    description: "metallic foil with etched pattern details and dimensional texture",
    characteristics: ["textured surface", "foil shimmer", "etched designs"],
    era: "1990s"
  },

  "laser-hologram": {
    name: "Laser Hologram",
    description: "holographic laser effect with shifting rainbow colors and 3D depth",
    characteristics: ["rainbow shift", "holographic depth", "laser pattern"],
    era: "1990s"
  },

  "prizm": {
    name: "Prizm",
    description: "signature prizm pattern with geometric light refraction and silver shimmer",
    characteristics: ["geometric pattern", "silver shimmer", "clean refraction"],
    era: "2010s-2020s"
  },

  "matte": {
    name: "Matte",
    description: "premium matte finish with subtle texture and soft lighting",
    characteristics: ["soft surface", "no glare", "subtle texture"],
    era: "2010s-2020s"
  },

  "gold-vinyl": {
    name: "Gold Vinyl",
    description: "textured gold finish with vinyl-like surface and premium feel",
    characteristics: ["gold metallic", "textured surface", "luxury feel"],
    era: "2020s"
  }
};

export function getFinish(finishId) {
  return finishes[finishId] || finishes["refractor"];
}

export function generateFinishPrompt(finishId) {
  const finish = getFinish(finishId);
  return `FINISH: The entire card has a ${finish.description}.`;
}
