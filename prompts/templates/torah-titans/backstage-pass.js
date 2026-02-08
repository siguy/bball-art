#!/usr/bin/env node
/**
 * Backstage Pass Template
 * Torah Titans series - Key confrontation moments as collectible passes
 *
 * Special moments from the Moses vs Pharaoh story reimagined as VIP/backstage passes.
 * Laminate badge aesthetic with holographic security strip.
 *
 * Variants:
 * - "WHO IS THE LORD?" - First confrontation / reintroduction moment
 * - "LET MY PEOPLE GO" - The repeated demand
 * - "HARDENED HEART" - Pharaoh's stubborn refusal
 * - "RISE AND GO" - Final night release
 */

import { generatePoseBlock } from '../../components/poses.js';

// Backstage pass moment definitions
const PASS_MOMENTS = {
  'who-is-the-lord': {
    id: 'who-is-the-lord',
    name: 'Who Is The Lord?',
    passType: 'VIP ACCESS',
    accessLevel: 'BACKSTAGE',
    scene: 'The first confrontation - Moses demands freedom, Pharaoh mocks the God of Israel',
    mosesAction: 'Standing boldly with staff, speaking for God',
    pharaohAction: 'Seated on throne, dismissive and arrogant',
    primaryCharacter: 'pharaoh',
    quote: {
      hebrew: 'מִי יְהוָה אֲשֶׁר אֶשְׁמַע בְּקֹלוֹ',
      english: 'Who is the LORD that I should heed Him?',
      source: 'Exodus 5:2'
    },
    colors: { primary: 'Egyptian gold', secondary: 'throne room bronze', accent: 'arrogant purple' }
  },
  'let-my-people-go': {
    id: 'let-my-people-go',
    name: 'Let My People Go',
    passType: 'ALL ACCESS',
    accessLevel: 'MAIN STAGE',
    scene: 'The repeated demand that echoes through history',
    mosesAction: 'Staff raised, prophetic authority radiating',
    pharaohAction: 'Hardened heart, refusing to yield',
    primaryCharacter: 'moses',
    quote: {
      hebrew: 'שַׁלַּח אֶת עַמִּי',
      english: 'Let my people go!',
      source: 'Exodus 5:1'
    },
    colors: { primary: 'divine gold', secondary: 'freedom blue', accent: 'prophetic white' }
  },
  'hardened-heart': {
    id: 'hardened-heart',
    name: 'Hardened Heart',
    passType: 'CREW',
    accessLevel: 'ALL AREAS',
    scene: 'Pharaoh doubles down after each plague - his heart hardens',
    mosesAction: 'Warning of coming judgment',
    pharaohAction: 'Fist to chest, stubborn defiance',
    primaryCharacter: 'pharaoh',
    quote: {
      hebrew: 'וַיְחַזֵּק יְהוָה אֶת לֵב פַּרְעֹה',
      english: 'The LORD hardened the heart of Pharaoh',
      source: 'Exodus 9:12'
    },
    colors: { primary: 'stone grey', secondary: 'blood red', accent: 'stubborn black' }
  },
  'rise-and-go': {
    id: 'rise-and-go',
    name: 'Rise and Go',
    passType: 'FAREWELL',
    accessLevel: 'FINAL SHOW',
    scene: 'The final night - Pharaoh broken, commanding Israel to leave',
    mosesAction: 'Leading the people out at midnight',
    pharaohAction: 'Grief-stricken, defeated, empty',
    primaryCharacter: 'moses',
    quote: {
      hebrew: 'קוּמוּ צְּאוּ מִתּוֹךְ עַמִּי',
      english: 'Rise up, go out from among my people!',
      source: 'Exodus 12:31'
    },
    colors: { primary: 'midnight blue', secondary: 'blood-on-doorpost red', accent: 'dawn gold' }
  }
};

export const backstagePassTemplate = {
  id: "backstage-pass",
  name: "Backstage Pass",
  series: "torah-titans",
  era: "Biblical meets Concert Credential",

  /**
   * Generate the full prompt for a Backstage Pass card
   * @param {object} pairing - Moses vs Pharaoh pairing data
   * @param {object} options - Generation options including momentId
   */
  generate(pairing, options = {}) {
    const moses = pairing.player || pairing.char1;
    const pharaoh = pairing.figure || pairing.char2;

    // Get moment data
    const momentId = options.momentId || options.moment || 'who-is-the-lord';
    const moment = PASS_MOMENTS[momentId] || PASS_MOMENTS['who-is-the-lord'];

    // Determine primary character for the pass
    const isPharaohPass = moment.primaryCharacter === 'pharaoh';
    const primaryChar = isPharaohPass ? pharaoh : moses;
    const secondaryChar = isPharaohPass ? moses : pharaoh;

    const tourData = pairing.seriesSpecificData?.freedomTour || {};
    const tourName = tourData.tourName || "EXODUS: THE FREEDOM TOUR";

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a "BACKSTAGE PASS" for the Torah Titans series.

=== DESIGN CONCEPT ===
CONCERT BACKSTAGE PASS / VIP LAMINATE
"${tourName}" - "${moment.name}"
Pass Type: ${moment.passType}
Access Level: ${moment.accessLevel}

A key confrontation moment designed as a collectible concert credential.
Photo ID style with holographic security elements.

=== CRITICAL REQUIREMENTS ===
1. LAMINATE BADGE AESTHETIC - like a real concert backstage pass
2. Photo ID style character portrait as main visual
3. Holographic security strip (Beam Team crossover energy)
4. Hebrew/hieroglyphic security patterns
5. All figures must have exactly TWO ARMS
6. This is STYLIZED ART for a collectible card, not a photograph

=== PASS LAYOUT ===
CONCERT CREDENTIAL DESIGN:
- Vertical laminate badge proportions
- Lanyard hole punch at top
- Security hologram strip across one edge
- "STAFF" / "VIP" / "ALL ACCESS" styling
- Barcode or QR-style element (using Hebrew letters)

TOP SECTION:
- "${tourName}" as event name header
- "${moment.passType}" badge prominently displayed
- "ACCESS: ${moment.accessLevel}" indicator

CENTER SECTION (PHOTO ID AREA):
Main "photo" of ${primaryChar.name}:
- ${primaryChar.name === 'Moses' ? moses.physicalDescription : pharaoh.physicalDescription}
- Expression capturing the moment: ${isPharaohPass ? moment.pharaohAction : moment.mosesAction}
- Styled as ID photo but with artistic drama
- ${isPharaohPass ? 'Egyptian regalia' : 'Prophet robes'} visible

ID PHOTO STYLING:
- Slightly cropped portrait, chest up
- Dramatic lighting (${isPharaohPass ? 'golden throne room' : 'divine spotlight'})
- The "moment" captured in the expression
- Border styled as photo frame with hieroglyphic/Hebrew patterns

=== SCENE CONTEXT ===
${moment.scene}
${primaryChar.name} action: ${isPharaohPass ? moment.pharaohAction : moment.mosesAction}
${secondaryChar.name} (referenced): ${isPharaohPass ? moment.mosesAction : moment.pharaohAction}

=== QUOTE ELEMENT ===
The defining quote for this moment:
HEBREW: "${moment.quote.hebrew}"
ENGLISH: "${moment.quote.english}"
SOURCE: "${moment.quote.source}"

Display as speech bubble, security watermark, or pass validation text.

=== HOLOGRAPHIC SECURITY ELEMENTS ===
Beam Team-inspired holographic strip featuring:
- Prismatic rainbow shimmer
- Hebrew letters as security pattern (שמע, יהוה, etc.)
- Hieroglyphic elements morphing into Hebrew
- Ankh + Star of David hybrid symbols
- "AUTHENTIC" / "VERIFIED" style watermarks in Hebrew

Security patterns should include:
- Fine-line Hebrew text as microprinting
- Hieroglyphic border transitioning to Hebrew
- Holographic foil effect

=== COLORS ===
Primary: ${moment.colors.primary}
Secondary: ${moment.colors.secondary}
Accent: ${moment.colors.accent}
Holographic: Rainbow prismatic shimmer

=== BORDER & FRAME ===
LAMINATE BADGE FRAME:
- Rounded corners like a real credential
- Plastic laminate sheen effect
- Lanyard attachment point at top
- Security hologram along one edge
- "STAFF ONLY" / "VIP" styling marks

MEZUZAH-INSPIRED ELEMENTS:
- Pass case styled subtly like a mezuzah holder
- Hebrew blessing as security pattern
- Sacred geometry in the background

=== TEXT ELEMENTS ===
TOP HEADER: "${tourName}" in concert credential typography
PASS TYPE: "${moment.passType}" - large, prominent badge
ACCESS LEVEL: "ACCESS: ${moment.accessLevel}"

ID SECTION:
- Name: "${primaryChar.displayName || primaryChar.name}"
- Hebrew name: "${primaryChar.hebrewName || ''}"
- Title: "${isPharaohPass ? 'King of Egypt' : 'Prophet of God'}"

QUOTE (as validation text or watermark):
"${moment.quote.english}"
"${moment.quote.hebrew}"

BOTTOM: "TORAH TITANS" with "VERIFIED" stamp

=== FINISH ===
Laminate sheen with holographic security strip.
Premium collectible credential aesthetic.
Should look like an actual concert pass you'd want to keep.

Mood: "${moment.name}" - the moment captured as a collectible
`.trim();

    return prompt;
  },

  /**
   * Generate a solo character pass (just one character)
   */
  generateSolo(character, options = {}) {
    const momentId = options.momentId || options.moment || 'who-is-the-lord';
    const moment = PASS_MOMENTS[momentId] || PASS_MOMENTS['who-is-the-lord'];
    const isMoses = character.name.toLowerCase().includes('moses');

    const tourName = options.tourName || "EXODUS: THE FREEDOM TOUR";

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, styled as a solo "BACKSTAGE PASS" credential.

=== DESIGN CONCEPT ===
CONCERT BACKSTAGE PASS / VIP LAMINATE
"${tourName}" - Solo ${isMoses ? 'Headliner' : 'Venue'} Pass
Pass Type: ${moment.passType}

=== CRITICAL REQUIREMENTS ===
1. LAMINATE BADGE AESTHETIC
2. Photo ID style portrait
3. Holographic security strip
4. The figure must have exactly TWO ARMS

=== PASS LAYOUT ===
TOP: "${tourName}"
PASS TYPE: "${moment.passType}"

CENTER (PHOTO ID):
${character.name.toUpperCase()}:
- Physical: ${character.physicalDescription}
- Expression: ${isMoses ? moment.mosesAction : moment.pharaohAction}
- Styled as dramatic ID photo

=== SECURITY ELEMENTS ===
- Holographic rainbow strip
- Hebrew/hieroglyphic patterns
- "VERIFIED" watermarks

=== QUOTE ===
"${moment.quote.english}"
"${moment.quote.hebrew}" - ${moment.quote.source}

=== COLORS ===
${moment.colors.primary}, ${moment.colors.secondary}, ${moment.colors.accent}

=== TEXT ===
Name: "${character.displayName || character.name}"
Title: "${isMoses ? 'Prophet of God' : 'King of Egypt'}"
Access: "${moment.accessLevel}"

=== FINISH ===
Laminate sheen with holographic security elements.
`.trim();

    return prompt;
  },

  // Export moment data for use by other scripts
  PASS_MOMENTS
};

export default backstagePassTemplate;
