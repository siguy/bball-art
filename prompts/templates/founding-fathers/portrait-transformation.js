#!/usr/bin/env node
/**
 * Portrait Transformation Template
 *
 * Transforms canonical Founding Father portraits through 7 artistic layers
 * spanning 250 years of American visual history.
 *
 * Layers:
 * 1. Colonial Foundation (pre-1776) - Georgian, formal English portraiture
 * 2. Revolutionary Spirit (1776) - Eagles, rattlesnakes, propaganda
 * 3. Classical Republic (Federal) - Roman references, neoclassical
 * 4. American Landscape (1830s-1870s) - Hudson River School grandeur
 * 5. Industrial Monument (Gilded Age) - Currency, bronze, marble
 * 6. Democratic Mural (WPA) - Social realism, heroic murals
 * 7. Contemporary Echo (Modern) - Pop art, remix, reinterpretation
 */

export const portraitTransformationTemplate = {
  id: "portrait-transformation",
  name: "Portrait Transformation",
  era: "Multi-era",
  series: "founding-fathers",

  /**
   * Layer definitions with visual style guides
   */
  layers: {
    colonial: {
      id: "colonial",
      name: "Colonial Foundation",
      era: "pre-1776",
      styleGuide: `
        Georgian-era visual culture:
        - Formal English portraiture style (Reynolds, Gainsborough influence)
        - Muted, dignified color palette: deep browns, forest greens, cream, burgundy
        - Candlelit warmth, soft chiaroscuro
        - Colonial craftsmanship: silver tankards, mahogany furniture, brick townhouses
        - Powdered wigs, formal dress, aspirational English taste
        - Constrained composition, classical poses
      `,
      finish: "Oil painting finish with visible brushwork, varnished warmth"
    },
    revolutionary: {
      id: "revolutionary",
      name: "Revolutionary Spirit",
      era: "1776",
      styleGuide: `
        Revolutionary iconography:
        - Bold propaganda style, political broadside aesthetic
        - Eagles, Gadsden rattlesnakes, liberty caps, Sons of Liberty imagery
        - Red, white, blue with strong black outlines
        - Engraving and woodcut influence
        - Defiant, symbolic, propagandistic
        - Declaration aesthetics, parchment textures
      `,
      finish: "Hand-colored engraving effect, paper texture, patriotic intensity"
    },
    classical: {
      id: "classical",
      name: "Classical Republic",
      era: "Federal period",
      styleGuide: `
        Neoclassical references the founders deliberately used:
        - Roman and Greek allusions: togas, columns, laurel wreaths
        - Great Seal imagery, early coinage aesthetic
        - Federal architecture: Capitol dome, classical porticos
        - White marble and bronze tones
        - Latin inscriptions, civic virtue symbolism
        - Dignified, aspirational, referencing ancient republics
      `,
      finish: "Marble and bronze effect, coin-like relief, classical dignity"
    },
    landscape: {
      id: "landscape",
      name: "American Landscape",
      era: "1830s-1870s",
      styleGuide: `
        Hudson River School grandeur:
        - Thomas Cole, Albert Bierstadt, Frederic Church influence
        - Dramatic natural sublimity: mountains, rivers, golden light
        - Expansive westward vistas, frontier imagery
        - Figure dwarfed by magnificent nature, or integrated into landscape
        - Romantic, luminous, nature as divine destiny
        - Maps and exploration motifs
      `,
      finish: "Luminous oil painting, dramatic light, romantic grandeur"
    },
    monument: {
      id: "monument",
      name: "Industrial Monument",
      era: "Gilded Age",
      styleGuide: `
        How the industrial age memorialized them:
        - Currency portrait style: engraved, formal, authoritative
        - Bronze statue and marble memorial aesthetic
        - Beaux-arts grandeur: civic monuments, commemorative medals
        - Gilded frames, ornate borders, official seals
        - Monumental, permanent, institutional
        - Washington Monument obelisk, Lincoln Memorial style
      `,
      finish: "Engraved currency effect, bronze patina, marble solidity"
    },
    mural: {
      id: "mural",
      name: "Democratic Mural",
      era: "WPA/Depression",
      styleGuide: `
        New Deal reinterpretation:
        - Thomas Hart Benton, Grant Wood, social realist influence
        - Post office mural aesthetic, heroic narrative style
        - Muscular, populist, accessible
        - Inclusive democracy themes, wartime patriotism
        - Earth tones with bold accents, simplified forms
        - Workers and farmers alongside founders
      `,
      finish: "Fresco texture, mural scale, heroic populism"
    },
    contemporary: {
      id: "contemporary",
      name: "Contemporary Echo",
      era: "Modern",
      styleGuide: `
        Modern artistic reinterpretation:
        - Pop art influence: Warhol's flat colors, Lichtenstein's dots
        - Street art and stencil aesthetic, Banksy-style commentary
        - Digital remix, glitch art, layered imagery
        - Currency as art (Beeple, JSG Boggs influence)
        - Monument debates, revisionist perspectives
        - Ironic, questioning, self-aware, layered meanings
      `,
      finish: "Screen print effect, digital layers, contemporary edge"
    }
  },

  /**
   * Generate prompt for a single layer transformation
   */
  generateLayer(founder, layerId, options = {}) {
    const layer = this.layers[layerId];
    if (!layer) {
      throw new Error(`Unknown layer: ${layerId}`);
    }

    const pose = options.pose || founder.poses?.[founder.defaultPose] || {};
    const layerSelection = founder.selectedLayers?.[layerId] || {};
    const customDirection = layerSelection.direction || options.customDirection || '';

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, transforming ${founder.name}'s canonical portrait through the "${layer.name}" artistic layer.

=== CRITICAL REQUIREMENTS ===
1. The subject must be clearly recognizable as ${founder.name}
2. This is STYLIZED ART for a collectible card, not a photograph
3. The figure must have exactly TWO ARMS
4. Maintain key identifying features from the basis portrait:
   ${founder.basisPortrait?.keyFeatures ? Object.entries(founder.basisPortrait.keyFeatures).map(([k, v]) => `- ${k}: ${v}`).join('\n   ') : '- Canonical portrait features'}

=== LAYER: ${layer.name.toUpperCase()} (${layer.era}) ===

${layer.styleGuide}

${customDirection ? `=== SPECIFIC DIRECTION ===\n${customDirection}\n` : ''}

=== FOUNDER DESCRIPTION ===

${founder.name.toUpperCase()}:
- Physical: ${founder.physicalDescription}
- Role: ${founder.role}
${founder.layerConnections?.[layerId] ? `- Layer Connection: ${founder.layerConnections[layerId].connection}
- Visual Hook: ${founder.layerConnections[layerId].visualHook}` : ''}

=== POSE ===
${pose.prompt || 'Standing portrait, dignified three-quarter view, canonical pose from basis portrait'}

=== COMPOSITION ===
SOLO PORTRAIT CARD: ${founder.name} is the ONLY figure on this card.
- Figure should be CENTERED and DOMINANT
- Show from approximately waist up, or full body depending on pose
- Leave space for the artistic layer treatment to breathe
- Integrate layer-specific elements into background and framing

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "FOUNDING FATHERS" in period-appropriate typography for the ${layer.era} era. Style matches the layer aesthetic.

LAYER BADGE: Small badge or cartouche indicating "${layer.name}" - styled appropriately for the era.

BOTTOM: Write "${founder.displayName || founder.name}" in complementary typography. Include "1776-2026 | 250 Years" as subtitle.

=== FINISH ===
${layer.finish}
Premium collectible card feel with layer-appropriate texture and effects.
`.trim();

    return prompt;
  },

  /**
   * Generate prompt for combined layers (2-3 layers blended)
   */
  generateCombined(founder, layerIds, options = {}) {
    if (!Array.isArray(layerIds) || layerIds.length < 2) {
      throw new Error('Combined generation requires 2+ layer IDs');
    }

    const layers = layerIds.map(id => {
      const layer = this.layers[id];
      if (!layer) throw new Error(`Unknown layer: ${id}`);
      return layer;
    });

    const pose = options.pose || founder.poses?.[founder.defaultPose] || {};
    const blendInstructions = options.blendInstructions || '';

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio, transforming ${founder.name}'s canonical portrait through COMBINED artistic layers.

=== CRITICAL REQUIREMENTS ===
1. The subject must be clearly recognizable as ${founder.name}
2. This is STYLIZED ART for a collectible card, not a photograph
3. The figure must have exactly TWO ARMS
4. BLEND the following ${layers.length} layers seamlessly

=== LAYERS TO COMBINE ===

${layers.map((layer, i) => `
LAYER ${i + 1}: ${layer.name.toUpperCase()} (${layer.era})
${layer.styleGuide}
`).join('\n')}

${blendInstructions ? `=== BLEND INSTRUCTIONS ===\n${blendInstructions}\n` : `
=== BLEND APPROACH ===
Layer elements thoughtfully - perhaps ${layers[0].name} in the figure treatment, ${layers[1].name} in the background,
${layers[2] ? `and ${layers[2].name} in the framing/finish.` : 'with harmonious visual synthesis.'}
`}

=== FOUNDER DESCRIPTION ===

${founder.name.toUpperCase()}:
- Physical: ${founder.physicalDescription}
- Role: ${founder.role}

=== POSE ===
${pose.prompt || 'Standing portrait, dignified three-quarter view, canonical pose from basis portrait'}

=== COMPOSITION ===
SOLO PORTRAIT CARD: ${founder.name} is the ONLY figure on this card.
- Figure should be CENTERED and DOMINANT
- Integrate elements from all ${layers.length} layers harmoniously
- Create visual dialogue between different historical aesthetics

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: Write "FOUNDING FATHERS" in typography that bridges the combined eras.

LAYER BADGE: Compound badge showing layer combination (e.g., "${layers.map(l => l.name).join(' + ')}").

BOTTOM: Write "${founder.displayName || founder.name}" with "1776-2026 | 250 Years" subtitle.

=== FINISH ===
Synthesis of: ${layers.map(l => l.finish).join(' | ')}
Premium collectible card with layered historical depth.
`.trim();

    return prompt;
  },

  /**
   * Generate prompt for full 7-layer synthesis
   */
  generateSynthesis(founder, options = {}) {
    const pose = options.pose || founder.poses?.[founder.defaultPose] || {};
    const allLayers = Object.values(this.layers);

    // Collect all selected layer directions
    const selectedDirections = allLayers
      .filter(layer => founder.selectedLayers?.[layer.id]?.direction)
      .map(layer => `${layer.name}: ${founder.selectedLayers[layer.id].direction}`)
      .join('\n');

    const prompt = `
A vertical premium collectible card in 3:4 aspect ratio - the ULTIMATE SYNTHESIS of ${founder.name}'s portrait through ALL SEVEN artistic layers spanning 250 years of American visual history.

=== CRITICAL REQUIREMENTS ===
1. The subject must be clearly recognizable as ${founder.name}
2. This is STYLIZED ART for a collectible card, not a photograph
3. The figure must have exactly TWO ARMS
4. Weave together ALL 7 layers into one coherent, powerful image

=== THE SEVEN LAYERS ===

${allLayers.map(layer => `${layer.name} (${layer.era}): ${layer.styleGuide.split('\n')[1]?.trim() || layer.styleGuide.trim().split('\n')[0]}`).join('\n')}

${selectedDirections ? `\n=== SPECIFIC LAYER DIRECTIONS ===\n${selectedDirections}\n` : ''}

=== SYNTHESIS APPROACH ===
This is not a collage but a SYNTHESIS. Elements from each era should:
- Flow naturally into each other
- Create visual archaeology - layers visible like strata
- Tell the story of how ${founder.name} has been seen across 250 years
- Feel like a palimpsest of American visual memory

Consider:
- Colonial formality in the core portrait
- Revolutionary symbols in the aura/energy
- Classical references in the pose and framing
- Landscape grandeur in the background vista
- Monument permanence in the material texture
- Mural heroism in the scale and accessibility
- Contemporary questioning in subtle details or framing

=== FOUNDER DESCRIPTION ===

${founder.name.toUpperCase()}:
- Physical: ${founder.physicalDescription}
- Role: ${founder.role}
- Title: ${founder.title}

=== POSE ===
${pose.prompt || 'Standing portrait, dignified three-quarter view, canonical pose from basis portrait'}

=== COMPOSITION ===
ULTIMATE SOLO PORTRAIT: ${founder.name} as visual palimpsest of American memory.
- Figure CENTERED and TRANSCENDENT
- Background should shift/morph through historical layers
- Frame should reference multiple eras
- Overall effect: 250 years condensed into one powerful image

=== TEXT ELEMENTS (render exactly as specified) ===
TOP: "FOUNDING FATHERS" in typography that transcends any single era - perhaps layered or evolving.

BADGE: "7 LAYERS | 250 YEARS" premium badge with multi-era design elements.

BOTTOM: "${founder.displayName || founder.name}" with "1776-2026 | SYNTHESIS" subtitle.

=== FINISH ===
Ultimate premium finish combining:
- Oil painting depth
- Engraving precision
- Bronze permanence
- Contemporary edge
The definitive collectible card finish.
`.trim();

    return prompt;
  },

  /**
   * Main generate function - routes to appropriate generator
   */
  generate(founder, options = {}) {
    const mode = options.mode || 'layer';

    switch (mode) {
      case 'layer':
        return this.generateLayer(founder, options.layer || 'colonial', options);
      case 'combined':
        return this.generateCombined(founder, options.layers || ['colonial', 'revolutionary'], options);
      case 'synthesis':
        return this.generateSynthesis(founder, options);
      default:
        throw new Error(`Unknown generation mode: ${mode}`);
    }
  },

  /**
   * Generate solo card (alias for layer generation with defaults)
   */
  generateSolo(founder, options = {}) {
    return this.generateLayer(founder, options.layer || 'colonial', options);
  }
};

export default portraitTransformationTemplate;
