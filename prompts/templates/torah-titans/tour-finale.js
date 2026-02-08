#!/usr/bin/env node
/**
 * Tour Finale Template
 * Torah Titans series - Red Sea Crossing as the Ultimate Encore
 *
 * "FAREWELL EGYPT" - The tour's final show.
 * Parted waters as giant stage curtains or speaker stacks.
 * Israelites as the crowd, Moses conducting.
 * Pharaoh's army as failed security/roadies.
 * Classic Arena Rock finale energy (Queen, Journey).
 */

import { generatePoseBlock } from '../../components/poses.js';

export const tourFinaleTemplate = {
  id: "tour-finale",
  name: "Tour Finale",
  series: "torah-titans",
  era: "Biblical meets Arena Rock Finale",

  /**
   * Generate the full prompt for a Tour Finale card
   * @param {object} pairing - Moses vs Pharaoh pairing data
   * @param {object} options - Generation options
   */
  generate(pairing, options = {}) {
    const moses = pairing.player || pairing.char1;
    const pharaoh = pairing.figure || pairing.char2;

    const tourData = pairing.seriesSpecificData?.freedomTour || {};
    const tourName = tourData.tourName || "EXODUS: THE FREEDOM TOUR";

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "TOUR FINALE" card for the Torah Titans series.

=== DESIGN CONCEPT ===
THE ULTIMATE ENCORE: CROSSING THE RED SEA
"${tourName}" - "FAREWELL EGYPT"
Final show. Sold out. Never to be repeated.

Classic Arena Rock finale energy - Queen at Wembley, Journey at the stadium.
Lighters in the air. Emotional climax. The greatest show in history.
Gold, white, and flame orange. Dawn after the longest night.

=== CRITICAL REQUIREMENTS ===
1. PANORAMIC FINALE COMPOSITION - the Red Sea crossing as rock finale
2. Parted waters reimagined as GIANT STAGE CURTAINS or SPEAKER STACKS
3. Moses conducting/headlining from center stage
4. Israelites as the CROWD - lighters (blood on doorposts), hands raised
5. Pharaoh's army visible as FAILED SECURITY in the distance
6. All figures must have exactly TWO ARMS
7. This is STYLIZED ART for a collectible card, not a photograph

=== CENTRAL FIGURE: MOSES THE HEADLINER ===
MOSES AT CENTER STAGE:
- Physical: ${moses.physicalDescription}
- Wearing: ${moses.clothing || "shepherd's robes flowing like stage costume, staff raised like conductor's baton"}
- Expression: Triumphant, exhausted, emotional - the greatest performance of his life
- Pose: Staff raised high, arms extended, conducting the waters and leading the crowd
- Energy: Arena rock frontman at the peak - Think Freddie Mercury at Live Aid
- Position: CENTER of card, the focal point of everything
- Anatomy: Exactly two arms${moses.anatomyNote ? ` - ${moses.anatomyNote}` : ''}

=== THE STAGE: PARTED RED SEA ===
The Red Sea parted as STAGE ARCHITECTURE:

LEFT WALL OF WATER:
- Massive wall of water styled as towering speaker stacks
- Stage lighting embedded in the waves
- Hieroglyphic patterns visible in the water (turning to Hebrew)
- Pyrotechnic effects - fire pillar as stage lighting

RIGHT WALL OF WATER:
- Mirror image speaker stack aesthetic
- Holographic shimmer on the water surface
- Divine light piercing through
- Concert rigging visible in the water structure

THE PATH:
- Dry seabed as the stage/runway
- Moses walking (or standing) on this stage
- Stadium lights illuminating the path
- "SOLD OUT" energy - no going back

=== THE CROWD: ISRAELITES ===
The Israelite multitude as CONCERT AUDIENCE:
- Masses of people with hands raised
- LIGHTERS IN THE AIR (reimagined as blood on the doorposts - small flames, torches)
- Faces lit by the divine light
- Emotional energy - freedom, awe, gratitude
- "Final encore" crowd behavior - crying, singing, hands up
- Spanning the background behind Moses

=== THE OPPOSITION: PHARAOH'S ARMY ===
Pharaoh and his army as FAILED SECURITY/ROADIES:
- Visible in the DISTANCE, behind the water walls
- Chariots as failed security vehicles
- Pharaoh's face visible - rage turning to terror
- About to be swallowed by the closing stage
- The venue owner who lost the show

=== THE PILLAR OF FIRE ===
The pillar of fire/cloud as ULTIMATE STAGE LIGHTING:
- Massive divine light source
- Part cloud, part fire, part concert pyrotechnics
- Illuminating Moses from behind
- Separating Israel from Egypt
- Godlike spotlight effect

=== COLOR PALETTE ===
Classic Arena Rock Finale:
- Primary: GOLD (triumph, dawn, divine favor)
- Secondary: PURE WHITE (freedom, light, hope)
- Accent: FLAME ORANGE (lighter flames, pyrotechnics, passion)
- Background: Deep blue (sea, night sky, infinity)

Dawn breaking after the longest night.
The gold of sunrise meeting the darkness of Egypt.

=== COMPOSITION ===
PANORAMIC FINALE LAYOUT:
- Moses at CENTER, dominant figure (30-40% of card height)
- Water walls framing left and right (like stage curtains)
- Israelites filling the middle ground
- Pharaoh's army small in the distance
- Sky/fire pillar at top
- Emotional, epic, grand scale

=== BORDER & FRAME ===
FINALE TOUR POSTER AESTHETIC:
- Stadium architecture border (arches, seating, lights)
- Gold foil trim throughout
- "FINAL SHOW" / "FAREWELL EGYPT" energy
- Crowd silhouettes along the bottom edge
- Lighter flames as decorative elements

TOUR ELEMENTS:
- "FINAL TOUR DATE" badge
- "SOLD OUT FOREVER" stamp
- "THANK YOU EGYPT" (ironic)
- Concert poster layout

=== TEXT ELEMENTS ===
TOP: "${tourName}" in grand arena rock typography, gold on gradient

SUBTITLE: "FAREWELL EGYPT - THE FINAL SHOW"

DRAMATIC TEXT: "SOLD OUT FOREVER" as stamp or badge

HEBREW QUOTE:
"וַיֵּט מֹשֶׁה אֶת יָדוֹ עַל הַיָּם"
"Moses stretched out his hand over the sea"
- Exodus 14:21

BOTTOM: "MOSES" in triumphant gold
With "מֹשֶׁה" in Hebrew

Optional: "THIS TOUR WILL NEVER BE REPEATED"

=== FINISH ===
GOLD FOIL PREMIUM FINISH:
- Gold foil on text and border elements
- Warm glow effect (stadium lights, fire, dawn)
- Holographic water shimmer
- Premium collectible gravitas

The emotional weight of the finale.
The greatest show in history - the night freedom was won.

Mood: "Thank you and goodnight" meets "The LORD fights for you"
Energy: Cathartic, triumphant, exhausted, glorious, eternal
`.trim();

    return prompt;
  },

  /**
   * Generate a solo Moses card for the Tour Finale
   * (Pharaoh solo doesn't make sense for the finale - he lost)
   */
  generateSolo(character, options = {}) {
    const isMoses = character.name.toLowerCase().includes('moses');

    if (!isMoses) {
      // Pharaoh solo finale would be his defeat
      return this.generatePharaohDefeat(character, options);
    }

    const tourName = options.tourName || "EXODUS: THE FREEDOM TOUR";

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a solo "TOUR FINALE" card.

=== DESIGN CONCEPT ===
"${tourName}" - "FAREWELL EGYPT"
SOLO HEADLINER FINALE: Moses at the Red Sea
Arena Rock finale energy. The conductor of freedom.

=== CRITICAL REQUIREMENTS ===
1. SOLO MOSES as triumphant headliner
2. Red Sea parted behind him as stage curtains
3. Arena rock finale aesthetic
4. The figure must have exactly TWO ARMS

=== SOLO FIGURE ===
MOSES THE HEADLINER:
- Physical: ${character.physicalDescription}
- Wearing: ${character.clothing || "shepherd's robes flowing like stage costume"}
- Expression: Triumphant exhaustion, emotional peak
- Pose: Staff raised, conducting the waters, arms extended
- Style: Arena rock frontman at the peak of the show
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}

=== BACKGROUND ===
PARTED RED SEA AS STAGE:
- Water walls as speaker stacks/curtains on either side
- Pillar of fire as stage lighting behind
- Crowd of Israelites in silhouette below
- Golden dawn light breaking through
- Stadium/arena architecture elements

=== COLORS ===
Arena Rock Finale palette:
- Gold (triumph)
- Pure white (freedom)
- Flame orange (lighters, pyro)
- Deep blue (sea, night)

=== TEXT ===
TOP: "${tourName}"
SUBTITLE: "FAREWELL EGYPT - THE FINAL SHOW"
BOTTOM: "MOSES" with "מֹשֶׁה"
BADGE: "SOLD OUT FOREVER"

=== FINISH ===
Gold foil with stadium light glow.
Emotional arena rock finale energy.
`.trim();

    return prompt;
  },

  /**
   * Generate Pharaoh's defeat at the Red Sea
   */
  generatePharaohDefeat(character, options = {}) {
    const tourName = options.tourName || "EXODUS: THE FREEDOM TOUR";

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "TOUR FINALE" defeat card.

=== DESIGN CONCEPT ===
"${tourName}" - "THE VENUE FALLS"
PHARAOH'S DEFEAT: The army swallowed by the sea
The venue owner who lost everything.

=== CRITICAL REQUIREMENTS ===
1. PHARAOH facing defeat at the Red Sea
2. Waters closing in around him
3. Arena rock tragedy aesthetic
4. The figure must have exactly TWO ARMS

=== SOLO FIGURE ===
PHARAOH THE FALLEN:
- Physical: ${character.physicalDescription}
- Wearing: ${character.clothing || "royal Egyptian regalia, now disheveled"}
- Expression: Terror, realization, doom
- Pose: Arms raised against the waves, or in chariot as waters close
- Style: The villain's final moment - tragic, operatic
- Anatomy: Exactly two arms${character.anatomyNote ? ` - ${character.anatomyNote}` : ''}

=== BACKGROUND ===
THE CLOSING SEA:
- Massive walls of water collapsing inward
- Chariots and soldiers being swallowed
- The dry path now flooding
- Divine wrath as stage collapse
- Israel's salvation visible in the distance

=== COLORS ===
Tragic finale palette:
- Deep sea blue/black (doom)
- Blood red accents (judgment)
- Pale grey (death)
- Distant gold (Israel's salvation, unreachable)

=== TEXT ===
TOP: "${tourName}"
SUBTITLE: "THE VENUE FALLS"
BOTTOM: "PHARAOH" with "פַּרְעֹה"
QUOTE: "Let us flee from Israel, for the LORD fights for them"

=== FINISH ===
Dark, tragic finish with distant gold.
The price of hardened hearts.
`.trim();

    return prompt;
  }
};

export default tourFinaleTemplate;
