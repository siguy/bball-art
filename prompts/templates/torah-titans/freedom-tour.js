#!/usr/bin/env node
/**
 * Freedom Tour Template
 * Torah Titans series - Moses vs Pharaoh Stadium Rock Tour aesthetic
 *
 * "EXODUS: THE FREEDOM TOUR" - Stadium rock meets ancient Egypt.
 * Moses as headliner, Pharaoh as the venue/obstacle.
 * Egyptian + Jewish iconography mashup (hieroglyphics -> Hebrew, ankh + Star of David).
 * 1990s insert card fun factor.
 *
 * Tone: Playfully irreverent - winking at the audience, puns allowed, fun but respectful.
 */

import { generatePoseBlock } from '../../components/poses.js';

export const freedomTourTemplate = {
  id: "freedom-tour",
  name: "Freedom Tour",
  series: "torah-titans",
  era: "Biblical meets Stadium Rock",

  /**
   * Generate the full prompt for a Freedom Tour confrontation card
   * @param {object} pairing - Moses vs Pharaoh pairing data
   * @param {object} options - Generation options
   */
  generate(pairing, options = {}) {
    const moses = pairing.player || pairing.char1;
    const pharaoh = pairing.figure || pairing.char2;

    const tourData = pairing.seriesSpecificData?.freedomTour || {};
    const tourName = tourData.tourName || "EXODUS: THE FREEDOM TOUR";
    const tourTagline = tourData.tourTagline || "10 Plagues. 10 Stops. One Epic Journey to Freedom.";

    const interaction = options.interaction || "confrontation";

    // Check for custom actions
    const customActions = (options.customPlayerAction && options.customFigureAction)
      ? { playerAction: options.customPlayerAction, figureAction: options.customFigureAction }
      : null;

    // Generate the interaction block
    const poseBlock = generatePoseBlock(
      interaction,
      moses.name,
      pharaoh.name,
      pharaoh.attributeDescription || "ruler of Egypt",
      customActions
    );

    const mosesClothing = moses.clothing || "humble shepherd's robes, wooden staff in hand";
    const pharaohClothing = pharaoh.clothing || "royal Egyptian regalia, crown and golden jewelry";

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "FREEDOM TOUR" card for the Torah Titans series.

=== DESIGN CONCEPT ===
STADIUM ROCK TOUR meets ancient Egypt. Think 1990s premium insert card with a rock concert aesthetic.
The Exodus story reimagined as an epic arena tour, playfully irreverent but respectful to the narrative.
"${tourName}" - ${tourTagline}

=== CRITICAL REQUIREMENTS ===
1. RIVALRY CARD: Moses (headliner) vs Pharaoh (venue/obstacle)
2. Stadium stage aesthetic with ancient Egyptian/Hebrew iconography mashup
3. Split composition - Moses on LEFT (spotlight side), Pharaoh on RIGHT (shadows/venue side)
4. Concert poster energy meets biblical epic
5. All figures must have exactly TWO ARMS
6. This is STYLIZED ART for a collectible card, not a photograph

${poseBlock}

=== FIGURE DESCRIPTIONS ===

MOSES (LEFT SIDE - THE HEADLINER):
- Physical: ${moses.physicalDescription}
- Wearing: ${mosesClothing} - reimagined with subtle rock star energy (flowing robes like stage costume)
- Expression: Commanding presence, the performer who speaks truth to power
- Pose: Staff raised like a microphone or guitar, spotlight illuminating
- Energy: Rock star authority, humble prophet with stage presence
- Anatomy: Exactly two arms${moses.anatomyNote ? ` - ${moses.anatomyNote}` : ''}

PHARAOH (RIGHT SIDE - THE VENUE/OBSTACLE):
- Physical: ${pharaoh.physicalDescription}
- Wearing: ${pharaohClothing} - Egyptian regalia as rock venue owner aesthetic
- Expression: Defiant venue owner, the obstacle that must be overcome
- Pose: Arms crossed or gesturing dismissively, the gatekeeper
- Energy: Corporate resistance, earthly power vs divine headliner
- Anatomy: Exactly two arms${pharaoh.anatomyNote ? ` - ${pharaoh.anatomyNote}` : ''}

=== STAGE COMPOSITION ===
STADIUM ROCK AESTHETIC:
- Stage scaffolding with HEBREW LETTERS as rigging (instead of band logos)
- Spotlights piercing through smoke, lighting Moses as headliner
- Pyrotechnic blasts in background (hinting at plagues to come)
- Marshall amps with hieroglyphic panels (Egyptian + Jewish mashup)
- Split stage: Moses in the lights, Pharaoh in the shadows

MOSES SIDE (LEFT):
- Bathed in divine spotlight (golden-white stage lights)
- Staff casting dramatic shadow
- Smoke and pyrotechnics enhancing drama
- Crowd energy implied (Israelites as the audience)

PHARAOH SIDE (RIGHT):
- Darker, venue-owner territory
- Egyptian throne reimagined as backstage control booth
- Pyramids as venue architecture in background
- His guards as security/roadies

=== ICONOGRAPHY MASHUP ===
Blend Egyptian and Jewish imagery with rock aesthetics:
- Ankh symbols where crossbar becomes Star of David
- Hieroglyphic cartouches containing Hebrew names
- Scarab beetles on guitar picks
- Eye of Horus as spotlight beam shape
- Pharaoh's crook and flail as mic stand and guitar
- Moses' staff styled as electric guitar or mic stand

=== BORDER & FRAME ===
1990s premium insert card style with concert elements:
- Concert merchandise motifs (wristbands, ticket stubs, laminates)
- Stage rigging forming the border frame
- Hebrew letters integrated as "band logo" in corners
- Holographic-style finish on edges
- "TOUR DATES" style plague list could appear as subtle background element

LEFT BORDER (Moses): Golden stage lights, Hebrew text, "HEADLINER" energy
RIGHT BORDER (Pharaoh): Darker Egyptian motifs, hieroglyphics, "VENUE" energy
CENTER: VS divider styled as concert versus poster

=== TEXT ELEMENTS (render exactly as specified) ===
TOP CENTER: "${tourName}" in dramatic stadium rock typography, lit by stage lights.
- Hebrew-inspired lettering with rock poster styling
- Split lighting: gold on Moses side, bronze on Pharaoh side

SUBTITLE: "${tourTagline}" in smaller tour poster font

BOTTOM LEFT: "MOSES" in headliner font with Hebrew "מֹשֶׁה" below
BOTTOM RIGHT: "PHARAOH" in darker font with Hebrew "פַּרְעֹה" below
CENTER BOTTOM: "VS" in dramatic concert poster styling

=== FINISH ===
1990s premium insert card aesthetic:
- Holographic shimmer on borders (Beam Team energy)
- Chrome reflections on metallic elements
- Stage smoke diffusing the light
- Premium collectible feel with rock concert energy

Mood: "The greatest show in history" meets "Let my people go"
Energy: Epic confrontation, playfully irreverent, stadium rock gravitas
`.trim();

    return prompt;
  },

  /**
   * Generate a solo character card for Freedom Tour
   */
  generateSolo(character, options = {}) {
    const isMoses = character.name.toLowerCase().includes('moses');
    const clothing = character.clothing || (isMoses ? "shepherd's robes as stage costume" : "royal Egyptian regalia");
    const hebrewName = character.hebrewName || null;

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "FREEDOM TOUR" solo card.

=== DESIGN CONCEPT ===
STADIUM ROCK TOUR solo performer card. ${isMoses ? 'The headliner in the spotlight.' : 'The venue owner, the obstacle.'}
"EXODUS: THE FREEDOM TOUR" aesthetic.

=== CRITICAL REQUIREMENTS ===
1. SINGLE CHARACTER CARD - ${isMoses ? 'rock star prophet' : 'venue owner villain'} aesthetic
2. Stadium stage composition
3. The figure must have exactly TWO ARMS

=== SINGLE FIGURE POSE ===
${character.name} as ${isMoses ? 'stadium rock headliner:' : 'venue owner/obstacle:'}
${options.pose?.prompt || (isMoses ? 'Staff raised like a mic stand, spotlight illuminating, commanding stage presence' : 'Arms crossed, dismissive, the gatekeeper in the shadows')}
Energy: ${options.pose?.energy || (isMoses ? 'Rock star authority, prophet with presence' : 'Corporate resistance, earthly power')}

=== CHARACTER DESCRIPTION ===
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Wearing: ${clothing}
- Expression: ${isMoses ? 'Commanding performer energy' : 'Defiant venue owner'}
- Style: Biblical figure reimagined with rock concert aesthetic
- Anatomy: Exactly two arms

=== COMPOSITION ===
SOLO CARD: ${character.name} is the ONLY figure.
- Character CENTERED and DOMINANT, 60-70% of card height
- ${isMoses ? 'Bathed in golden spotlight, stage smoke' : 'Lit from below, shadowy venue aesthetic'}
- Stadium stage elements (rigging, amps, pyro) visible

=== BACKGROUND ===
Stadium rock stage with Egyptian/Hebrew iconography:
- ${isMoses ? 'Divine spotlights, Hebrew letters as rigging' : 'Dark venue, hieroglyphic panels, pyramids as architecture'}
- Smoke and atmosphere
- Concert poster energy

=== BORDER & FRAME ===
1990s premium insert card with tour merchandise motifs
${isMoses ? 'Golden stage light border, Hebrew text, "HEADLINER" energy' : 'Darker Egyptian border, hieroglyphics, "VENUE" energy'}

=== TEXT ELEMENTS ===
TOP: "EXODUS: THE FREEDOM TOUR"
SUBTITLE: "${isMoses ? 'THE HEADLINER' : 'THE VENUE'}"
BOTTOM: "${character.displayName || character.name}"${hebrewName ? ` with Hebrew "${hebrewName}"` : ''}

=== FINISH ===
Holographic premium insert card aesthetic with stadium lighting.
`.trim();

    return prompt;
  }
};

export default freedomTourTemplate;
