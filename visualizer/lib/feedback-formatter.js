/**
 * Feedback Formatter
 * Formats card feedback for copying to Claude Code
 */

/**
 * Format scope for display
 * @param {string} scope - The scope value
 * @returns {string} Human-readable scope
 */
function formatScope(scope) {
  const scopeLabels = {
    'card': 'This card only',
    'template': 'Template-wide',
    'pairing': 'Pairing-wide',
    'global': 'Global (all future cards)'
  };
  return scopeLabels[scope] || scope;
}

/**
 * Format categories for display
 * @param {string[]} categories - Array of category values
 * @returns {string} Comma-separated categories
 */
function formatCategories(categories) {
  if (!categories || categories.length === 0) return 'None specified';
  return categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
}

/**
 * Format rating for display
 * @param {string} rating - The rating value
 * @returns {string} Human-readable rating
 */
function formatRating(rating) {
  const ratingLabels = {
    'loved': 'Loved',
    'liked': 'Liked',
    'issues': 'Issues'
  };
  return ratingLabels[rating] || rating || 'None';
}

/**
 * Generate regeneration command
 * @param {Object} card - Card data
 * @param {Object} pairingData - Pairing metadata
 * @returns {string} CLI command to regenerate
 */
function generateRegenerateCommand(card, pairingData) {
  if (card.mode === 'solo') {
    const type = card.characterType === 'player' ? 'player' : 'figure';
    let cmd = `node scripts/generate-solo.js ${type} ${card.characterId} ${card.template}`;
    if (card.poses?.pose1) {
      cmd += ` --pose ${card.poses.pose1}`;
    }
    return cmd;
  }

  // Pairing card
  let cmd = `node scripts/generate-with-poses.js ${card.pairingId} ${card.template}`;

  // Add pose flags if available
  if (card.poses) {
    if (card.poses.pose1) cmd += ` \\\n  --player-pose ${card.poses.pose1}`;
    if (card.poses.pose2) cmd += ` \\\n  --figure-pose ${card.poses.pose2}`;
  }

  return cmd;
}

/**
 * Format feedback for Claude Code
 * @param {Object} options - Formatting options
 * @param {Object} options.card - Card data from manifest
 * @param {Object} options.feedback - Feedback data (rating, notes, scope, categories)
 * @param {Object} options.pairingData - Pairing metadata
 * @param {Object} options.pairingsFull - Full pairing data with connection info
 * @returns {string} Formatted markdown text for Claude
 */
export function formatFeedbackForClaude({ card, feedback, pairingData, pairingsFull }) {
  const pairing = pairingData?.[card.pairingId];
  const fullPairing = pairingsFull?.[card.pairingId];

  // Build title
  let title;
  if (card.mode === 'solo') {
    const charType = card.characterType === 'player' ? 'Player' : 'Figure';
    title = `Solo ${charType}: ${card.characterId}`;
  } else {
    title = pairing
      ? `${pairing.playerName} & ${pairing.figureName}`
      : card.pairingId;
  }

  // Build the formatted output
  const lines = [];

  lines.push(`## Card Feedback: ${card.pairingId || card.characterId} (${card.template})`);
  lines.push('');
  lines.push(`**Rating:** ${formatRating(feedback?.rating)}`);
  lines.push(`**Scope:** ${formatScope(feedback?.scope)}`);
  lines.push(`**Categories:** ${formatCategories(feedback?.categories)}`);
  lines.push('');

  if (feedback?.notes) {
    lines.push(`**Feedback:** "${feedback.notes}"`);
    lines.push('');
  }

  // Parameters section
  lines.push('**Parameters:**');
  if (card.mode === 'solo') {
    lines.push(`- Mode: Solo`);
    lines.push(`- Character Type: ${card.characterType}`);
    lines.push(`- Character: ${card.characterId}`);
  } else {
    lines.push(`- Pairing: ${title}`);
  }
  lines.push(`- Template: ${card.template}`);

  if (card.poses) {
    if (card.poses.pose1) lines.push(`- Player pose: ${card.poses.pose1}`);
    if (card.poses.pose2) lines.push(`- Figure pose: ${card.poses.pose2}`);
  }

  if (card.interaction && card.interaction !== 'unknown') {
    lines.push(`- Interaction: ${card.interaction}`);
  }
  lines.push('');

  // Connection context if available
  if (fullPairing?.connection) {
    lines.push('**Connection:**');
    if (fullPairing.connection.thematic) {
      lines.push(`${fullPairing.connection.thematic}`);
    } else if (fullPairing.connection.narrative) {
      lines.push(`${fullPairing.connection.narrative}`);
    }
    lines.push('');
  }

  // Prompt section
  if (card.prompt) {
    lines.push('**Prompt:**');
    lines.push('```');
    lines.push(card.prompt);
    lines.push('```');
    lines.push('');
  }

  // Regenerate command
  lines.push('**Regenerate:**');
  lines.push('```bash');
  lines.push(generateRegenerateCommand(card, pairingData));
  lines.push('```');

  return lines.join('\n');
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type ('success', 'error', 'info')
 * @param {number} duration - Duration in ms
 */
export function showToast(message, type = 'success', duration = 3000) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto-remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export default {
  formatFeedbackForClaude,
  showToast
};
