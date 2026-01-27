/**
 * Interaction poses for player-figure pairings (v2)
 *
 * ARCHITECTURE: Interaction-First
 * - Each pose defines COMPLETE arm positions for both figures
 * - Biblical figure's attribute is incorporated into their arm position
 * - No separate "holding" instruction needed
 * - This prevents the "three arms" problem
 */

export const poses = {
  "back-to-back": {
    name: "Back to Back",
    description: "Standing back-to-back, facing outward with confidence",

    // Player arm instructions (no attribute)
    playerPose: "standing tall with arms crossed confidently over chest, looking over shoulder toward viewer",

    // Figure arm instructions (WITH attribute integrated)
    figurePoseWithAttribute: "standing tall with back to partner, one hand gripping their sacred attribute raised slightly, other hand resting confidently at side",
    figurePoseNoAttribute: "standing tall with arms crossed confidently, facing opposite direction",

    energy: "united, confident, powerful allies standing together"
  },

  "high-five": {
    name: "High Five",
    description: "Dynamic celebration with hands meeting",

    playerPose: "leaping with right arm extended upward for high-five, left arm down for balance",

    figurePoseWithAttribute: "reaching up with right hand to meet high-five, left hand holding their sacred attribute at side",
    figurePoseNoAttribute: "reaching up with right hand for high-five, left arm down",

    energy: "celebratory, explosive, triumphant connection"
  },

  "side-by-side": {
    name: "Side by Side",
    description: "Standing together facing forward as equals",

    playerPose: "athletic ready stance, both hands on hips or one hand raised in confidence",

    figurePoseWithAttribute: "commanding stance, one hand holding their sacred attribute upright, other hand at side or raised",
    figurePoseNoAttribute: "commanding stance, hands at sides or on hips",

    energy: "united front, ready for anything, formidable pair"
  },

  "simultaneous-action": {
    name: "Simultaneous Action",
    description: "Both figures performing their signature moves in parallel",

    playerPose: "mid-action basketball move - shooting, dunking, or driving, arms in athletic motion",

    figurePoseWithAttribute: "performing their biblical action - Moses parting seas with staff raised, David aiming sling, Elijah calling fire with arms raised",
    figurePoseNoAttribute: "arms raised in powerful gesture of their signature act",

    energy: "dynamic parallel power, legends in action, mirror of greatness"
  },

  "dap-up": {
    name: "Dap Up",
    description: "Casual friendly greeting, fist bump or handshake",

    playerPose: "relaxed confident stance, one arm extended forward for fist bump or dap, other arm relaxed at side",

    figurePoseWithAttribute: "dignified stance, one arm extended to meet player's greeting, other hand holding their sacred attribute",
    figurePoseNoAttribute: "dignified stance, one arm extended for greeting, other arm at side",

    energy: "mutual respect, casual yet meaningful connection, equals meeting"
  },

  "fire-rain": {
    name: "Fire Rain",
    description: "Fire and power descending - perfect for Curry/Elijah",

    playerPose: "shooting form with ball releasing from hands, follow-through pose, looking up at trajectory",

    figurePoseWithAttribute: "arms raised toward sky calling down fire, sacred attribute held high or worn, divine flames responding",
    figurePoseNoAttribute: "arms raised toward sky in prophetic gesture, calling down power",

    energy: "rain of fire, divine accuracy, heaven responding to earth"
  }
};

/**
 * Get pose configuration
 */
export function getPose(poseId) {
  return poses[poseId] || poses["back-to-back"];
}

/**
 * Get the appropriate figure pose based on whether they have an attribute
 */
export function getFigurePose(poseId, hasAttribute = true) {
  const pose = getPose(poseId);
  return hasAttribute ? pose.figurePoseWithAttribute : pose.figurePoseNoAttribute;
}

/**
 * Generate complete pose description for prompt
 * This is the SINGLE SOURCE OF TRUTH for how figures are positioned
 *
 * @param {string} poseId - The pose ID or 'custom' for custom actions
 * @param {string} playerName - Player name
 * @param {string} figureName - Figure name
 * @param {string} figureAttribute - Figure's attribute description
 * @param {object} customActions - Optional custom actions { playerAction, figureAction, energy }
 */
export function generatePoseBlock(poseId, playerName, figureName, figureAttribute, customActions = null) {
  // If custom actions provided, use those instead
  if (customActions && customActions.playerAction && customActions.figureAction) {
    const energy = customActions.energy || 'powerful, legendary, parallel greatness';
    return `
=== INTERACTION: CUSTOM ACTION ===
Overall: ${playerName} and ${figureName} performing their signature moves in parallel
Energy/Mood: ${energy}

${playerName.toUpperCase()} POSE:
${customActions.playerAction}

${figureName.toUpperCase()} POSE:
${customActions.figureAction}
`.trim();
  }

  // Standard pose handling
  const pose = getPose(poseId);
  const hasAttribute = !!figureAttribute;

  return `
=== INTERACTION: ${pose.name.toUpperCase()} ===
Overall: ${pose.description}
Energy/Mood: ${pose.energy}

${playerName.toUpperCase()} POSE:
${pose.playerPose}

${figureName.toUpperCase()} POSE:
${hasAttribute ? pose.figurePoseWithAttribute.replace('their sacred attribute', figureAttribute) : pose.figurePoseNoAttribute}
`.trim();
}
