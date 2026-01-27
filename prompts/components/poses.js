/**
 * Interaction poses for player-figure pairings
 * These describe how the two figures interact on the card
 */

export const poses = {
  "back-to-back": {
    name: "Back to Back",
    description: "Standing back-to-back with arms crossed, looking outward with confidence and intensity",
    playerPose: "standing tall with arms crossed, looking over shoulder",
    figurePose: "standing tall with arms crossed, facing opposite direction",
    energy: "confident, united, powerful allies"
  },

  "high-five": {
    name: "High Five",
    description: "Dynamic high-five mid-air with energy crackling between their hands",
    playerPose: "leaping with arm extended for high-five",
    figurePose: "reaching up with divine energy emanating from hand",
    energy: "celebratory, explosive, connected"
  },

  "side-by-side": {
    name: "Side by Side",
    description: "Standing side by side, both in ready stance, facing forward",
    playerPose: "athletic stance, ready for action",
    figurePose: "commanding stance with attribute visible",
    energy: "united, ready, formidable"
  },

  "action-parallel": {
    name: "Action Parallel",
    description: "Both figures in their signature action poses, mirroring each other",
    playerPose: "signature basketball move in full motion",
    figurePose: "signature biblical action pose",
    energy: "dynamic, powerful, parallel legends"
  },

  "mentor-stance": {
    name: "Mentor Stance",
    description: "Biblical figure standing behind player in guiding/protective pose",
    playerPose: "focused, determined, looking forward",
    figurePose: "standing behind with hand on shoulder or staff raised",
    energy: "guidance, legacy, blessing"
  },

  "dual-power": {
    name: "Dual Power",
    description: "Both figures channeling their power, energy flowing between them",
    playerPose: "in motion with trail of energy",
    figurePose: "channeling divine power through attribute",
    energy: "raw power, supernatural, unstoppable"
  }
};

export function getPose(poseId) {
  return poses[poseId] || poses["back-to-back"];
}

export function generatePosePrompt(poseId, playerName, figureName) {
  const pose = getPose(poseId);
  return `
INTERACTION: ${pose.description}
LEFT FIGURE (${playerName}): ${pose.playerPose}
RIGHT FIGURE (${figureName}): ${pose.figurePose}
ENERGY: ${pose.energy}
`.trim();
}
