/**
 * Court & Covenant Pairing Dashboard
 */

const API_BASE = '';

// State
let pairingsData = {};
let manifest = { cards: [] };
let currentPairingId = null;

// Categories for pairings
const PAIRING_CATEGORIES = {
  'jordan-moses': 'heroes',
  'lebron-david': 'heroes',
  'pippen-aaron': 'heroes',
  'kobe-joshua': 'heroes',
  'curry-elijah': 'heroes',
  'magic-joseph': 'heroes',
  'shaq-goliath': 'heroes',
  'wilt-samson': 'heroes',
  'kareem-solomon': 'heroes',
  'stockton-elisha': 'heroes',
  'dirk-judah': 'heroes',
  'durant-jonathan': 'heroes',
  'jokic-isaac': 'heroes',
  'sga-daniel': 'heroes',
  'isiah-pharaoh': 'villains',
  'laimbeer-haman': 'villains',
  'rodman-esau': 'villains',
  'draymond-joab': 'villains',
  'bird-jacob': 'villains'
};

// Standard interactions
const STANDARD_INTERACTIONS = [
  { id: 'back-to-back', name: 'Back to Back' },
  { id: 'side-by-side', name: 'Side by Side' },
  { id: 'high-five', name: 'High Five' },
  { id: 'dap-up', name: 'Dap Up' },
  { id: 'simultaneous-action', name: 'Simultaneous Action' },
  { id: 'fire-rain', name: 'Fire Rain' }
];

// Initialize
async function init() {
  await Promise.all([
    fetchPairingsData(),
    fetchManifest()
  ]);

  renderPairings();
  setupEventListeners();
}

// Fetch full pairing data
async function fetchPairingsData() {
  try {
    const res = await fetch(`${API_BASE}/api/pairings-full`);
    pairingsData = await res.json();
  } catch (err) {
    console.error('Failed to fetch pairings:', err);
  }
}

async function fetchManifest() {
  try {
    const res = await fetch(`${API_BASE}/api/manifest`);
    manifest = await res.json();
  } catch (err) {
    console.error('Failed to fetch manifest:', err);
  }
}

// Generate pairing-specific interaction suggestions
function generateSuggestedInteractions(pairing) {
  const suggestions = [];
  const player = pairing.player;
  const figure = pairing.figure;

  // Get signature moves
  const moves = player.signatureMoves || [];
  const attribute = figure.attribute || '';
  const figureAction = getFigureAction(figure);

  // Generate suggestions based on combinations
  moves.forEach(move => {
    const suggestion = {
      id: `${move.replace(/\s+/g, '-').toLowerCase()}-${figureAction.id}`,
      name: `${formatMoveName(move)} + ${figureAction.name}`,
      playerAction: getDetailedPlayerAction(move, player),
      figureAction: getDetailedFigureAction(figure),
      suggested: true
    };
    suggestions.push(suggestion);
  });

  return suggestions.slice(0, 3); // Limit to 3 suggestions
}

// Get the primary action for a biblical figure
function getFigureAction(figure) {
  const figureActions = {
    'Moses': { id: 'parting-seas', name: 'Parting the Waters', action: 'raising his staff high, parting the waters with divine authority' },
    'King David': { id: 'slaying-giant', name: 'Slaying the Giant', action: 'winding up his sling, aiming with deadly precision at the giant' },
    'Aaron': { id: 'priestly-blessing', name: 'Priestly Blessing', action: 'raising both hands in the priestly blessing, breastplate gleaming' },
    'Joshua': { id: 'walls-falling', name: 'Conquering Walls', action: 'blowing the shofar as walls crumble, sword raised in triumph' },
    'Elijah': { id: 'calling-fire', name: 'Calling Fire', action: 'arms raised to heaven, fire descending from above in response' },
    'Joseph': { id: 'interpreting-dreams', name: 'Revealing Visions', action: 'gesturing dramatically as he reveals a prophetic vision' },
    'Goliath': { id: 'giant-challenge', name: 'Giant Challenge', action: 'thrusting his massive spear forward, roaring a challenge' },
    'Samson': { id: 'pillars-falling', name: 'Bringing Down Pillars', action: 'pushing against pillars with supernatural strength, muscles straining' },
    'King Solomon': { id: 'wise-judgment', name: 'Wise Judgment', action: 'seated in wisdom, scroll in one hand, scepter raised in judgment' },
    'Elisha': { id: 'double-portion', name: 'Double Portion', action: 'catching the falling mantle, inheriting double the power' },
    'Judah Maccabee': { id: 'hammer-strike', name: 'Hammer Strike', action: 'swinging his war hammer down with devastating force' },
    'Jonathan': { id: 'loyal-archer', name: 'Loyal Archer', action: 'drawing his bow with precision, eyes locked on target' },
    'Isaac': { id: 'patient-blessing', name: 'Patient Blessing', action: 'hands raised in blessing, patient and trusting' },
    'Daniel': { id: 'lions-den', name: 'Lion\'s Den', action: 'standing calmly among lions, supernatural peace radiating' },
    'Pharaoh': { id: 'iron-rule', name: 'Iron Rule', action: 'crook and flail crossed over chest, commanding absolute authority' },
    'Haman': { id: 'scheming', name: 'Scheming', action: 'holding the signet ring, plotting with a sinister smile' },
    'Esau': { id: 'wild-hunt', name: 'Wild Hunt', action: 'bow drawn, hunting with primal instinct' },
    'Joab': { id: 'ruthless-strike', name: 'Ruthless Strike', action: 'sword mid-swing, executing without hesitation' },
    'Jacob': { id: 'wrestling', name: 'Wrestling', action: 'locked in a wrestling stance, clever and determined' }
  };

  return figureActions[figure.name] || { id: 'powerful-stance', name: 'Powerful Stance', action: 'in a powerful commanding stance' };
}

// Get detailed player action based on move
function getDetailedPlayerAction(move, player) {
  const moveActions = {
    'fadeaway jumper': `leaping backward in his iconic fadeaway, ball releasing at the peak with perfect form`,
    'flying dunk': `soaring through the air for a thunderous one-handed dunk, tongue out, defying gravity`,
    'tongue out drive': `driving hard to the basket, tongue wagging, unstoppable determination`,
    'chase-down block': `flying from behind for a legendary chase-down block, ball pinned against the glass`,
    'tomahawk dunk': `rising for a powerful tomahawk dunk, arm cocked back with devastating power`,
    'no-look pass': `threading a no-look pass through defenders, eyes looking away, ball finding its target`,
    'deep three-pointer': `releasing a deep three from the logo, perfect shooting form, ball arcing toward the net`,
    'behind-the-back dribble': `executing a lightning-quick behind-the-back crossover, defender frozen`,
    'shimmy celebration': `hitting the shot and doing his signature shimmy, pure confidence`,
    'one-legged fadeaway': `rising on one leg for his signature fadeaway, impossible to guard`,
    'coast-to-coast fast break': `racing coast-to-coast, ball in hand, finishing with authority`,
    'perimeter defense': `locked in defensive stance, arms wide, suffocating his opponent`,
    'footwork in the post': `spinning with precise footwork in the post, creating space`,
    'clutch dagger': `pulling up for a dagger three, ice in his veins, game on the line`,
    'skyhook': `releasing the unstoppable skyhook, arm fully extended, ball floating to the rim`,
    'baby hook': `flipping in a soft baby hook over the defender`,
    'fast break orchestration': `pushing the fast break, seeing the whole court, setting up teammates`,
    'powerful dunk': `rising for an earth-shaking two-handed power dunk`,
    'drop step': `executing a devastating drop step, spinning to the basket`,
    'backboard-shattering slam': `throwing down a rim-rocking dunk that threatens the backboard`,
    'finger roll': `gliding to the basket for a delicate finger roll`,
    'dominant rebounding': `snatching a rebound with both hands, dominating the glass`,
    'pinpoint assist': `delivering a pinpoint bounce pass for an easy bucket`,
    'pick and roll': `executing a perfect pick and roll, reading the defense`,
    'steal': `poking the ball away with quick hands, starting the fast break`,
    'pull-up jumper': `stopping on a dime for a silky pull-up jumper`,
    'unstoppable scoring': `rising for an unguardable bucket, pure scoring machine`,
    'crafty floater': `floating a crafty shot over the big man`,
    'change of pace': `changing speeds, freezing the defender, then exploding past`,
    'mid-range mastery': `pulling up from mid-range, automatic`,
    'killer crossover': `breaking ankles with a devastating crossover`,
    'floater': `floating a teardrop over the defender`,
    'hard foul': `setting a hard screen, enforcing his will`,
    'three-point shooting': `catching and shooting a three with textbook form`,
    'relentless rebounding': `crashing the boards with relentless energy`,
    'lockdown defense': `smothering defense, not giving an inch`,
    'chaotic energy': `bringing chaotic energy, disrupting everything`,
    'defensive intensity': `screaming and pointing, quarterbacking the defense`,
    'trash talk': `jawing at his opponent while hitting the shot`,
    'hockey assist': `making the extra pass for the hockey assist`,
    'clutch shooting': `draining a clutch shot when it matters most`,
    'basketball IQ': `making the smart play, always one step ahead`
  };

  // Find matching action or return generic
  const moveLower = move.toLowerCase();
  for (const [key, action] of Object.entries(moveActions)) {
    if (moveLower.includes(key) || key.includes(moveLower)) {
      return action;
    }
  }

  return `performing his signature ${move} with skill and power`;
}

// Get detailed figure action
function getDetailedFigureAction(figure) {
  const action = getFigureAction(figure);
  return action.action;
}

function formatMoveName(move) {
  return move.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Render all pairings
function renderPairings() {
  const grid = document.getElementById('pairings-grid');
  const filter = document.getElementById('filter-category').value;

  const pairingIds = Object.keys(pairingsData);

  const filtered = filter
    ? pairingIds.filter(id => PAIRING_CATEGORIES[id] === filter)
    : pairingIds;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state"><h2>No pairings found</h2></div>';
    return;
  }

  grid.innerHTML = filtered.map(id => renderPairingCard(id, pairingsData[id])).join('');
}

function renderPairingCard(id, pairing) {
  const category = PAIRING_CATEGORIES[id] || 'heroes';
  const cardCount = manifest.cards.filter(c => c.pairingId === id).length;
  const suggestions = generateSuggestedInteractions(pairing);

  // Get existing custom interactions from pairing
  const customInteractions = pairing.customInteractions || [];

  return `
    <div class="pairing-card" data-id="${id}">
      <div class="pairing-header" onclick="togglePairing('${id}')">
        <div class="pairing-title">
          <h2>${pairing.player.name} / ${pairing.figure.name}</h2>
          <span class="pairing-era">${pairing.player.era}</span>
          <span class="pairing-category ${category}">${category}</span>
        </div>
        <div class="pairing-meta">
          <span class="card-count">${cardCount} cards</span>
          <span class="expand-icon">▼</span>
        </div>
      </div>

      <div class="pairing-body">
        <div class="pairing-content">
          <!-- Player Details -->
          <div class="figure-details">
            <h3><span class="icon">🏀</span> ${pairing.player.name}</h3>
            <ul class="detail-list">
              <li><strong>Era:</strong> ${pairing.player.era}</li>
              <li><strong>Archetype:</strong> ${pairing.player.archetype || 'N/A'}</li>
              <li><strong>Signature Moves:</strong> ${(pairing.player.signatureMoves || []).join(', ')}</li>
              <li><strong>Physical:</strong> ${pairing.player.physicalDescription}</li>
            </ul>
          </div>

          <!-- Figure Details -->
          <div class="figure-details">
            <h3><span class="icon">📜</span> ${pairing.figure.name}</h3>
            <ul class="detail-list">
              <li><strong>Attribute:</strong> ${pairing.figure.attribute || 'N/A'}</li>
              <li><strong>Archetype:</strong> ${pairing.figure.archetype || 'N/A'}</li>
              <li><strong>Clothing:</strong> ${pairing.figure.clothing || 'N/A'}</li>
              <li><strong>Physical:</strong> ${pairing.figure.physicalDescription}</li>
            </ul>
          </div>

          <!-- Connection -->
          <div class="connection-box">
            <h4>Connection</h4>
            <p>"${pairing.connection?.narrative || pairing.connection?.thematic || 'N/A'}"</p>
          </div>

          <!-- Suggested Interactions -->
          <div class="interactions-section">
            <h4>Pairing-Specific Actions</h4>
            <div class="interactions-list">
              ${suggestions.map(s => `
                <div class="interaction-item suggested">
                  <div class="interaction-name">✨ ${s.name}</div>
                  <div class="interaction-desc">
                    <strong>${pairing.player.name}:</strong> ${s.playerAction}<br>
                    <strong>${pairing.figure.name}:</strong> ${s.figureAction}
                  </div>
                </div>
              `).join('')}

              ${customInteractions.map(c => `
                <div class="interaction-item">
                  <div class="interaction-name">${c.name}</div>
                  <div class="interaction-desc">
                    <strong>${pairing.player.name}:</strong> ${c.playerAction}<br>
                    <strong>${pairing.figure.name}:</strong> ${c.figureAction}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Actions -->
          <div class="actions-bar">
            <button class="btn btn-primary" onclick="openGenerateModal('${id}')">
              🎨 Generate Card
            </button>
            <button class="btn" onclick="openInteractionModal('${id}')">
              + Add Custom Interaction
            </button>
            <a href="/?pairing=${id}" class="btn">
              View Cards →
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function togglePairing(id) {
  const card = document.querySelector(`.pairing-card[data-id="${id}"]`);
  card.classList.toggle('expanded');
}

// Generate Modal
function openGenerateModal(pairingId) {
  currentPairingId = pairingId;
  const pairing = pairingsData[pairingId];

  document.getElementById('generate-pairing-name').textContent =
    `${pairing.player.name} & ${pairing.figure.name}`;

  // Populate interactions dropdown
  const select = document.getElementById('select-interaction');
  const suggestions = generateSuggestedInteractions(pairing);
  const customInteractions = pairing.customInteractions || [];

  select.innerHTML = `
    <optgroup label="Standard Interactions">
      ${STANDARD_INTERACTIONS.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
    </optgroup>
    <optgroup label="Pairing-Specific (Suggested)">
      ${suggestions.map(s => `<option value="custom:${s.id}" data-player="${s.playerAction}" data-figure="${s.figureAction}">${s.name}</option>`).join('')}
    </optgroup>
    ${customInteractions.length ? `
      <optgroup label="Custom">
        ${customInteractions.map(c => `<option value="custom:${c.id}" data-player="${c.playerAction}" data-figure="${c.figureAction}">${c.name}</option>`).join('')}
      </optgroup>
    ` : ''}
  `;

  // Clear custom action fields
  document.getElementById('custom-player-action').value = '';
  document.getElementById('custom-figure-action').value = '';

  // Reset status
  document.getElementById('generate-status').className = 'generate-status';
  document.getElementById('generate-status').textContent = '';

  document.getElementById('generate-modal').classList.add('active');
}

function closeGenerateModal() {
  document.getElementById('generate-modal').classList.remove('active');
  currentPairingId = null;
}

// Interaction Modal
function openInteractionModal(pairingId) {
  currentPairingId = pairingId;
  const pairing = pairingsData[pairingId];

  document.getElementById('interaction-pairing-name').textContent =
    `${pairing.player.name} & ${pairing.figure.name}`;

  // Clear fields
  document.getElementById('new-interaction-id').value = '';
  document.getElementById('new-interaction-name').value = '';
  document.getElementById('new-player-action').value = '';
  document.getElementById('new-figure-action').value = '';
  document.getElementById('new-interaction-energy').value = '';

  document.getElementById('interaction-modal').classList.add('active');
}

function closeInteractionModal() {
  document.getElementById('interaction-modal').classList.remove('active');
}

// Generate card
async function generateCard() {
  if (!currentPairingId) return;

  const template = document.getElementById('select-template').value;
  const interactionSelect = document.getElementById('select-interaction');
  const interactionValue = interactionSelect.value;

  const customPlayerAction = document.getElementById('custom-player-action').value.trim();
  const customFigureAction = document.getElementById('custom-figure-action').value.trim();

  const status = document.getElementById('generate-status');
  status.className = 'generate-status loading';
  status.textContent = 'Generating card... This may take 20-30 seconds.';

  document.getElementById('btn-generate').disabled = true;

  try {
    // Build the request
    const body = {
      pairingId: currentPairingId,
      template: template
    };

    // Check if using custom actions or a preset
    if (customPlayerAction && customFigureAction) {
      body.customPlayerAction = customPlayerAction;
      body.customFigureAction = customFigureAction;
    } else if (interactionValue.startsWith('custom:')) {
      // Get the custom action from the select option
      const option = interactionSelect.options[interactionSelect.selectedIndex];
      body.customPlayerAction = option.dataset.player;
      body.customFigureAction = option.dataset.figure;
    } else {
      body.interaction = interactionValue;
    }

    const res = await fetch(`${API_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await res.json();

    if (result.success) {
      status.className = 'generate-status success';
      status.innerHTML = `✓ Card generated! <a href="/?card=${result.cardId}" class="view-card-link">View Card →</a>`;

      // Refresh manifest
      await fetchManifest();
      renderPairings();
    } else {
      status.className = 'generate-status error';
      status.textContent = `✗ Error: ${result.error}`;
    }
  } catch (err) {
    status.className = 'generate-status error';
    status.textContent = `✗ Error: ${err.message}`;
  }

  document.getElementById('btn-generate').disabled = false;
}

// Save custom interaction
async function saveInteraction() {
  if (!currentPairingId) return;

  const interaction = {
    id: document.getElementById('new-interaction-id').value.trim(),
    name: document.getElementById('new-interaction-name').value.trim(),
    playerAction: document.getElementById('new-player-action').value.trim(),
    figureAction: document.getElementById('new-figure-action').value.trim(),
    energy: document.getElementById('new-interaction-energy').value.trim()
  };

  if (!interaction.id || !interaction.name || !interaction.playerAction || !interaction.figureAction) {
    alert('Please fill in all required fields');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/pairings/${currentPairingId}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interaction)
    });

    const result = await res.json();

    if (result.success) {
      // Refresh data
      await fetchPairingsData();
      renderPairings();
      closeInteractionModal();
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

// Event Listeners
function setupEventListeners() {
  document.getElementById('filter-category').addEventListener('change', renderPairings);

  document.getElementById('refresh-btn').addEventListener('click', async () => {
    await Promise.all([fetchPairingsData(), fetchManifest()]);
    renderPairings();
  });

  // Generate modal
  document.getElementById('modal-close').addEventListener('click', closeGenerateModal);
  document.getElementById('generate-modal').addEventListener('click', (e) => {
    if (e.target.id === 'generate-modal') closeGenerateModal();
  });
  document.getElementById('btn-generate').addEventListener('click', generateCard);

  // Interaction modal
  document.getElementById('interaction-modal-close').addEventListener('click', closeInteractionModal);
  document.getElementById('interaction-modal').addEventListener('click', (e) => {
    if (e.target.id === 'interaction-modal') closeInteractionModal();
  });
  document.getElementById('btn-save-interaction').addEventListener('click', saveInteraction);

  // Update custom fields when selecting a suggested interaction
  document.getElementById('select-interaction').addEventListener('change', (e) => {
    const option = e.target.options[e.target.selectedIndex];
    if (option.dataset.player) {
      document.getElementById('custom-player-action').value = option.dataset.player;
      document.getElementById('custom-figure-action').value = option.dataset.figure;
    } else {
      document.getElementById('custom-player-action').value = '';
      document.getElementById('custom-figure-action').value = '';
    }
  });
}

// Start
init();
