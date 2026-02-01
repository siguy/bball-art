/**
 * Court & Covenant Card Generator
 * Interactive UI for generating cards with pose control
 * Supports both pairing mode and solo character mode
 */

const API_BASE = '';

// State
let mode = 'pairing'; // 'pairing' or 'solo'
let pairings = {};
let pairingsFull = {};
let templatesMeta = {};
let currentPlayerPoses = null;
let currentFigurePoses = null;
let lastGeneratedCard = null;
let isGenerating = false;
let currentHints = null;
let currentSeries = 'court-covenant'; // Will be set from SeriesSelector

// Solo mode state
let players = [];
let figures = [];
let currentCharacterType = null;
let currentCharacterId = null;
let currentSoloPoses = null;

// Helper: Detect figure-figure mode (Torah Titans)
function isFigureFigureMode(pairing) {
  if (!pairing) return false;
  return pairing.cardMode?.includes('figure-figure') ||
         pairing.player?.characterType === 'figure';
}

// Helper: Determine if dark mode should auto-enable based on type
function shouldAutoDarkMode(type) {
  const darkTypes = ['villain', 'rivalry', 'trial', 'plague'];
  return darkTypes.includes(type);
}

// DOM Elements
const pairingSelect = document.getElementById('pairing-select');
const templateSelect = document.getElementById('template-select');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const autoBadge = document.getElementById('auto-badge');
const playerPoseSelect = document.getElementById('player-pose-select');
const figurePoseSelect = document.getElementById('figure-pose-select');
const hairColorGroup = document.getElementById('hair-color-group');
const hairColorSelect = document.getElementById('hair-color-select');
const generateBtn = document.getElementById('generate-btn');
const regenerateBtn = document.getElementById('regenerate-btn');
const resultPlaceholder = document.getElementById('result-placeholder');
const resultCard = document.getElementById('result-card');
const resultImage = document.getElementById('result-image');
const resultViewLink = document.getElementById('result-view-link');
const generationLog = document.getElementById('generation-log');
const logOutput = document.getElementById('log-output');

// Info displays
const pairingInfo = document.getElementById('pairing-info');
const templateInfo = document.getElementById('template-info');
const playerPosePreview = document.getElementById('player-pose-preview');
const figurePosePreview = document.getElementById('figure-pose-preview');

// Pose labels (for dynamic updating)
const playerPoseLabel = document.getElementById('player-pose-label');
const figurePoseLabel = document.getElementById('figure-pose-label');

// Solo mode DOM elements
const characterTypeSelect = document.getElementById('character-type-select');
const characterSelect = document.getElementById('character-select');
const characterInfo = document.getElementById('character-info');

// Initialize
async function init() {
  // Initialize series selector
  if (window.SeriesSelector) {
    window.SeriesSelector.initSeriesSelector();
    currentSeries = window.SeriesSelector.getSelectedSeries();
  }

  await Promise.all([
    fetchPairings(),
    fetchPairingsFull(),
    fetchTemplates(),
    fetchPlayers(),
    fetchFigures()
  ]);

  populatePairings();
  populateTemplates();
  setupEventListeners();

  // Hide NBA Player option in solo mode for Torah Titans (figure-only series)
  if (currentSeries === 'torah-titans') {
    const playerOption = characterTypeSelect.querySelector('option[value="player"]');
    if (playerOption) {
      playerOption.style.display = 'none';
    }
  }

  // Check for URL parameters (e.g., from Characters page redirect)
  handleUrlParams();
}

// Handle URL parameters for pre-selection
function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);

  const urlMode = params.get('mode');
  const urlType = params.get('type');
  const urlCharacter = params.get('character');

  if (urlMode === 'solo' && urlType && urlCharacter) {
    // Switch to solo mode
    document.querySelector('input[name="mode"][value="solo"]').checked = true;
    onModeChange({ target: { value: 'solo' } });

    // Set character type
    characterTypeSelect.value = urlType;
    onCharacterTypeChange();

    // Wait for character list to populate, then select character
    setTimeout(() => {
      characterSelect.value = urlCharacter;
      onCharacterChange();
    }, 100);

    // Clear URL params
    window.history.replaceState({}, '', '/generator.html');
  }
}

// API Calls
async function fetchPairings() {
  try {
    const res = await fetch(`${API_BASE}/api/pairings?series=${currentSeries}`);
    pairings = await res.json();
  } catch (err) {
    console.error('Failed to fetch pairings:', err);
  }
}

async function fetchPairingsFull() {
  try {
    const res = await fetch(`${API_BASE}/api/pairings-full?series=${currentSeries}`);
    pairingsFull = await res.json();
  } catch (err) {
    console.error('Failed to fetch full pairings:', err);
  }
}

async function fetchTemplates() {
  try {
    const res = await fetch(`${API_BASE}/api/templates`);
    templatesMeta = await res.json();
  } catch (err) {
    console.error('Failed to fetch templates:', err);
  }
}

async function fetchPlayers() {
  try {
    const res = await fetch(`${API_BASE}/api/characters/players`);
    players = await res.json();
  } catch (err) {
    console.error('Failed to fetch players:', err);
    players = [];
  }
}

async function fetchFigures() {
  try {
    const res = await fetch(`${API_BASE}/api/characters/figures`);
    figures = await res.json();
  } catch (err) {
    console.error('Failed to fetch figures:', err);
    figures = [];
  }
}

async function fetchPlayerPoses(poseFileId) {
  try {
    const res = await fetch(`${API_BASE}/api/poses/players/${poseFileId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch player poses:', err);
    return null;
  }
}

async function fetchFigurePoses(poseFileId) {
  try {
    const res = await fetch(`${API_BASE}/api/poses/figures/${poseFileId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch figure poses:', err);
    return null;
  }
}

async function fetchHints(pairingId) {
  try {
    const res = await fetch(`${API_BASE}/api/generation-hints?pairingId=${encodeURIComponent(pairingId)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch hints:', err);
    return null;
  }
}

// Populate Controls
function populatePairings() {
  // Sort pairings by priority
  const sortedPairings = Object.entries(pairingsFull)
    .sort((a, b) => (a[1].priority || 99) - (b[1].priority || 99));

  // Group by type - handle Court & Covenant types and Torah Titans types
  const typeGroups = {
    hero: { label: 'Heroes', items: [] },
    villain: { label: 'Villains', items: [] },
    spouse: { label: 'Spouses', items: [] },
    rivalry: { label: 'Rivalries', items: [] },
    trial: { label: 'Trials', items: [] },
    multi: { label: 'Multi-Character', items: [] },
    plague: { label: 'Plagues', items: [] },
    other: { label: 'Other', items: [] }
  };

  sortedPairings.forEach(([id, pairing]) => {
    const type = pairing.type || 'hero'; // default to hero for Court & Covenant
    const group = typeGroups[type] || typeGroups.other;
    group.items.push([id, pairing]);
  });

  let html = '<option value="">Select a pairing...</option>';

  // Render each non-empty group
  Object.entries(typeGroups).forEach(([type, group]) => {
    if (group.items.length > 0) {
      html += `<optgroup label="${group.label}">`;
      group.items.forEach(([id, pairing]) => {
        const label = `${pairing.player.name} & ${pairing.figure.name}`;
        html += `<option value="${id}">${label}</option>`;
      });
      html += '</optgroup>';
    }
  });

  pairingSelect.innerHTML = html;
}

function populateTemplates() {
  let html = '<option value="">Select a template...</option>';

  Object.values(templatesMeta.templates || {}).forEach(template => {
    const darkBadge = template.hasDarkMode ? ' [+Dark]' : '';
    html += `<option value="${template.id}">${template.name} (${template.era})${darkBadge}</option>`;
  });

  templateSelect.innerHTML = html;
}

async function populatePlayerPoses(poseFileId) {
  currentPlayerPoses = await fetchPlayerPoses(poseFileId);

  if (!currentPlayerPoses || !currentPlayerPoses.poses) {
    playerPoseSelect.innerHTML = '<option value="default">Default (no poses defined)</option>';
    playerPoseSelect.disabled = true;
    playerPosePreview.textContent = '';
    return;
  }

  const poses = currentPlayerPoses.poses;
  const defaultPose = currentPlayerPoses.defaultPose;

  let html = `<option value="default">Default (${defaultPose})</option>`;
  Object.values(poses).forEach(pose => {
    const isDefault = pose.id === defaultPose ? ' *' : '';
    html += `<option value="${pose.id}">${pose.name}${isDefault}</option>`;
  });

  playerPoseSelect.innerHTML = html;
  playerPoseSelect.disabled = false;

  // Update hair color options if available
  updateHairColorOptions();

  // Show description for default pose
  updatePosePreview('player');
}

async function populateFigurePoses(poseFileId) {
  currentFigurePoses = await fetchFigurePoses(poseFileId);

  if (!currentFigurePoses || !currentFigurePoses.poses) {
    figurePoseSelect.innerHTML = '<option value="default">Default (no poses defined)</option>';
    figurePoseSelect.disabled = true;
    figurePosePreview.textContent = '';
    return;
  }

  const poses = currentFigurePoses.poses;
  const defaultPose = currentFigurePoses.defaultPose;

  let html = `<option value="default">Default (${defaultPose})</option>`;
  Object.values(poses).forEach(pose => {
    const isDefault = pose.id === defaultPose ? ' *' : '';
    html += `<option value="${pose.id}">${pose.name}${isDefault}</option>`;
  });

  figurePoseSelect.innerHTML = html;
  figurePoseSelect.disabled = false;

  // Show description for default pose
  updatePosePreview('figure');
}

/**
 * Load figure poses into either the player or figure pose select
 * Used for Torah Titans figure-figure pairings
 */
async function populateFigurePosesAs(targetSlot, poseFileId) {
  const posesData = await fetchFigurePoses(poseFileId);

  const select = targetSlot === 'player' ? playerPoseSelect : figurePoseSelect;
  const preview = targetSlot === 'player' ? playerPosePreview : figurePosePreview;

  // Store in the appropriate state variable
  if (targetSlot === 'player') {
    currentPlayerPoses = posesData;
  } else {
    currentFigurePoses = posesData;
  }

  if (!posesData || !posesData.poses) {
    select.innerHTML = '<option value="default">Default (no poses defined)</option>';
    select.disabled = true;
    preview.textContent = '';
    return;
  }

  const poses = posesData.poses;
  const defaultPose = posesData.defaultPose;

  let html = `<option value="default">Default (${defaultPose})</option>`;
  Object.values(poses).forEach(pose => {
    const isDefault = pose.id === defaultPose ? ' *' : '';
    html += `<option value="${pose.id}">${pose.name}${isDefault}</option>`;
  });

  select.innerHTML = html;
  select.disabled = false;

  // Show description for default pose
  updatePosePreview(targetSlot);
}

function updateHairColorOptions() {
  if (!currentPlayerPoses || !currentPlayerPoses.hairColors) {
    hairColorGroup.classList.add('hidden');
    return;
  }

  const hairColors = currentPlayerPoses.hairColors;
  if (Object.keys(hairColors).length === 0) {
    hairColorGroup.classList.add('hidden');
    return;
  }

  let html = '<option value="">Default (from pose)</option>';
  Object.entries(hairColors).forEach(([id, description]) => {
    html += `<option value="${id}">${id} - ${description}</option>`;
  });

  hairColorSelect.innerHTML = html;
  hairColorGroup.classList.remove('hidden');
}

function updatePosePreview(type) {
  const select = type === 'player' ? playerPoseSelect : figurePoseSelect;
  const preview = type === 'player' ? playerPosePreview : figurePosePreview;

  // In solo mode, use currentSoloPoses for the player slot
  let poses;
  if (mode === 'solo' && type === 'player') {
    poses = currentSoloPoses;
  } else {
    poses = type === 'player' ? currentPlayerPoses : currentFigurePoses;
  }

  if (!poses || !poses.poses) {
    preview.textContent = '';
    return;
  }

  const selectedId = select.value;
  let pose;

  if (selectedId === 'default') {
    pose = poses.poses[poses.defaultPose];
  } else {
    pose = poses.poses[selectedId];
  }

  if (pose) {
    let text = pose.description || '';
    if (!text && pose.prompt) {
      // Use first sentence of prompt if no description
      text = pose.prompt.split('.')[0];
    }
    if (pose.energy) {
      text += ` <span class="pose-energy">[${pose.energy}]</span>`;
    }
    preview.innerHTML = text;
  } else {
    preview.textContent = '';
  }
}

/**
 * Display generation hints for the current pairing
 */
function displayHints(hints) {
  const panel = document.getElementById('hints-panel');
  const content = document.getElementById('hints-content');

  if (!hints || (!hints.pairing && (!hints.global || hints.global.topTemplates.length === 0))) {
    panel.classList.add('hidden');
    return;
  }

  let html = '';

  // Show recommended templates
  const recommended = hints.pairing?.recommendedTemplates || hints.global?.topTemplates || [];
  if (recommended.length > 0) {
    html += `
      <div class="hints-section">
        <span class="hints-label">Recommended:</span>
        <span class="hints-templates">
          ${recommended.map(t => `<span class="hint-template recommended">${formatTemplateName(t)}</span>`).join('')}
        </span>
      </div>
    `;
  }

  // Show templates to avoid
  const avoid = hints.pairing?.avoidTemplates || hints.global?.avoidTemplates || [];
  if (avoid.length > 0) {
    html += `
      <div class="hints-section">
        <span class="hints-label">Avoid:</span>
        <span class="hints-templates">
          ${avoid.map(t => `<span class="hint-template avoid">${formatTemplateName(t)}</span>`).join('')}
        </span>
      </div>
    `;
  }

  // Show issue notes
  const notes = hints.pairing?.issueNotes || [];
  if (notes.length > 0) {
    html += `
      <div class="hints-warning">
        <span class="hints-warning-icon">&#9888;</span>
        Previous issues: ${notes[0]}
      </div>
    `;
  }

  if (html) {
    content.innerHTML = html;
    panel.classList.remove('hidden');
  } else {
    panel.classList.add('hidden');
  }
}

/**
 * Check if current template selection conflicts with hints
 */
function checkTemplateWarning() {
  if (!currentHints || !currentHints.pairing) return;

  const selectedTemplate = templateSelect.value;
  const avoidTemplates = currentHints.pairing.avoidTemplates || [];

  if (avoidTemplates.includes(selectedTemplate)) {
    // Template is in avoid list - show a warning
    const panel = document.getElementById('hints-panel');
    const existingWarning = panel.querySelector('.hints-warning');

    if (!existingWarning) {
      const warning = document.createElement('div');
      warning.className = 'hints-warning';
      warning.innerHTML = `<span class="hints-warning-icon">&#9888;</span> This template had issues with this pairing previously.`;
      panel.appendChild(warning);
    }
  }
}

function formatTemplateName(template) {
  if (!template) return '';
  return template.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Mode Toggle Handler
function onModeChange(e) {
  mode = e.target.value;

  // Toggle visibility of pairing vs solo controls
  document.querySelectorAll('.pairing-only').forEach(el => {
    el.classList.toggle('hidden', mode === 'solo');
  });
  document.querySelectorAll('.solo-only').forEach(el => {
    el.classList.toggle('visible', mode === 'solo');
    el.classList.toggle('hidden', mode === 'pairing');
  });

  // Handle pose group visibility
  const figurePoseGroup = document.getElementById('figure-pose-group');
  if (mode === 'solo') {
    // Solo mode: hide figure pose group, show player pose group (relabeled as "Pose")
    figurePoseGroup.style.display = 'none';
    if (playerPoseLabel) playerPoseLabel.textContent = 'Pose';
  } else {
    // Pairing mode: show both pose groups with proper labels
    figurePoseGroup.style.display = '';
    if (playerPoseLabel) playerPoseLabel.textContent = 'Player Pose';
    if (figurePoseLabel) figurePoseLabel.textContent = 'Figure Pose';
  }

  // Reset selections
  if (mode === 'solo') {
    pairingSelect.value = '';
    pairingInfo.textContent = '';
    characterTypeSelect.value = '';
    characterSelect.value = '';
    characterSelect.disabled = true;
    characterInfo.textContent = '';
    currentCharacterType = null;
    currentCharacterId = null;
    currentSoloPoses = null;
  } else {
    characterTypeSelect.value = '';
    characterSelect.value = '';
  }

  // Reset pose selects
  playerPoseSelect.innerHTML = '<option value="default">Default</option>';
  playerPoseSelect.disabled = true;
  figurePoseSelect.innerHTML = '<option value="default">Default</option>';
  figurePoseSelect.disabled = true;
  hairColorGroup.classList.add('hidden');

  updateGenerateButton();
}

// Character Type Change Handler (solo mode)
function onCharacterTypeChange() {
  const type = characterTypeSelect.value;
  currentCharacterType = type;
  currentCharacterId = null;
  currentSoloPoses = null;

  if (!type) {
    characterSelect.innerHTML = '<option value="">Select a character...</option>';
    characterSelect.disabled = true;
    characterInfo.textContent = '';
    playerPoseSelect.innerHTML = '<option value="default">Default</option>';
    playerPoseSelect.disabled = true;
    hairColorGroup.classList.add('hidden');
    updateGenerateButton();
    return;
  }

  // Populate character dropdown
  const characterList = type === 'player' ? players : figures;
  let html = '<option value="">Select a character...</option>';

  characterList.forEach(char => {
    const poseInfo = char.poseCount > 0 ? ` (${char.poseCount} poses)` : ' (no poses)';
    html += `<option value="${char.id}">${char.name}${poseInfo}</option>`;
  });

  characterSelect.innerHTML = html;
  characterSelect.disabled = false;
  characterInfo.textContent = '';

  updateGenerateButton();
}

// Character Selection Change Handler (solo mode)
async function onCharacterChange() {
  const characterId = characterSelect.value;
  currentCharacterId = characterId;

  if (!characterId || !currentCharacterType) {
    characterInfo.textContent = '';
    playerPoseSelect.innerHTML = '<option value="default">Default</option>';
    playerPoseSelect.disabled = true;
    hairColorGroup.classList.add('hidden');
    updateGenerateButton();
    return;
  }

  // Find character data
  const characterList = currentCharacterType === 'player' ? players : figures;
  const character = characterList.find(c => c.id === characterId);

  if (character) {
    characterInfo.innerHTML = character.physicalDescription || '';
  }

  // Load poses for this character
  const poseFileId = characterId;
  const endpoint = currentCharacterType === 'player'
    ? `/api/poses/players/${poseFileId}`
    : `/api/poses/figures/${poseFileId}`;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) {
      currentSoloPoses = null;
      playerPoseSelect.innerHTML = '<option value="default">Default (no poses defined)</option>';
      playerPoseSelect.disabled = true;
      hairColorGroup.classList.add('hidden');
      updateGenerateButton();
      return;
    }

    currentSoloPoses = await res.json();

    // Populate pose dropdown (using playerPoseSelect for solo mode)
    const poses = currentSoloPoses.poses || {};
    const defaultPose = currentSoloPoses.defaultPose;

    let html = `<option value="default">Default (${defaultPose})</option>`;
    Object.values(poses).forEach(pose => {
      const isDefault = pose.id === defaultPose ? ' *' : '';
      html += `<option value="${pose.id}">${pose.name}${isDefault}</option>`;
    });

    playerPoseSelect.innerHTML = html;
    playerPoseSelect.disabled = false;

    // Show description for default pose
    updatePosePreview('player');

    // Show hair colors if available (for players like Rodman)
    if (currentCharacterType === 'player' && currentSoloPoses.hairColors) {
      const hairColors = currentSoloPoses.hairColors;
      if (Object.keys(hairColors).length > 0) {
        let hairHtml = '<option value="">Default (from pose)</option>';
        Object.entries(hairColors).forEach(([id, description]) => {
          hairHtml += `<option value="${id}">${id} - ${description}</option>`;
        });
        hairColorSelect.innerHTML = hairHtml;
        hairColorGroup.classList.remove('hidden');
      } else {
        hairColorGroup.classList.add('hidden');
      }
    } else {
      hairColorGroup.classList.add('hidden');
    }

  } catch (err) {
    console.error('Failed to fetch poses:', err);
    currentSoloPoses = null;
  }

  updateGenerateButton();
}

// Event Handlers
async function onPairingChange() {
  const pairingId = pairingSelect.value;

  if (!pairingId) {
    pairingInfo.textContent = '';
    playerPoseSelect.innerHTML = '<option value="default">Default</option>';
    playerPoseSelect.disabled = true;
    figurePoseSelect.innerHTML = '<option value="default">Default</option>';
    figurePoseSelect.disabled = true;
    hairColorGroup.classList.add('hidden');
    darkModeToggle.checked = false;
    autoBadge.classList.add('hidden');
    currentHints = null;
    displayHints(null);
    // Reset labels to defaults
    if (playerPoseLabel) playerPoseLabel.textContent = 'Player Pose';
    if (figurePoseLabel) figurePoseLabel.textContent = 'Figure Pose';
    updateGenerateButton();
    return;
  }

  const pairing = pairingsFull[pairingId];
  if (!pairing) return;

  // Check if this is a figure-figure pairing (Torah Titans)
  const figureMode = isFigureFigureMode(pairing);

  // Update pose labels based on mode
  if (figureMode) {
    // Use character names for Torah Titans
    if (playerPoseLabel) playerPoseLabel.textContent = `${pairing.player.name} Pose`;
    if (figurePoseLabel) figurePoseLabel.textContent = `${pairing.figure.name} Pose`;
  } else {
    // Standard Court & Covenant labels
    if (playerPoseLabel) playerPoseLabel.textContent = 'Player Pose';
    if (figurePoseLabel) figurePoseLabel.textContent = 'Figure Pose';
  }

  // Update info display
  pairingInfo.innerHTML = `
    <strong>${pairing.connection.thematic}</strong><br>
    <em>"${pairing.connection.narrative}"</em>
  `;

  // Auto-set dark mode based on type (handles both C&C and Torah Titans types)
  const shouldDark = shouldAutoDarkMode(pairing.type);
  darkModeToggle.checked = shouldDark;
  if (shouldDark) {
    autoBadge.classList.remove('hidden');
  } else {
    autoBadge.classList.add('hidden');
  }

  // Load poses - for figure-figure mode, both come from figures endpoint
  const playerPoseFileId = pairing.player.poseFileId;
  const figurePoseFileId = pairing.figure.poseFileId;

  if (figureMode) {
    // Both are figures - load both from figures endpoint
    await populateFigurePosesAs('player', playerPoseFileId);
    await populateFigurePosesAs('figure', figurePoseFileId);
  } else {
    // Standard: player from players, figure from figures
    await populatePlayerPoses(playerPoseFileId);
    await populateFigurePoses(figurePoseFileId);
  }

  // Fetch and display hints
  currentHints = await fetchHints(pairingId);
  displayHints(currentHints);

  updateGenerateButton();
}

function onTemplateChange() {
  const templateId = templateSelect.value;

  if (!templateId) {
    templateInfo.textContent = '';
    updateGenerateButton();
    return;
  }

  const template = templatesMeta.templates[templateId];
  if (!template) return;

  templateInfo.innerHTML = `
    <strong>${template.style}</strong><br>
    ${template.description}
    ${template.hasDarkMode ? '<br><em>Dark mode available</em>' : ''}
  `;

  // Check for template warnings based on hints
  checkTemplateWarning();

  updateGenerateButton();
}

function onDarkModeChange() {
  // Remove auto badge when user manually toggles
  autoBadge.classList.add('hidden');
}

function updateGenerateButton() {
  let canGenerate = false;

  if (mode === 'pairing') {
    canGenerate = pairingSelect.value && templateSelect.value && !isGenerating;
  } else {
    // Solo mode
    canGenerate = currentCharacterType && currentCharacterId && templateSelect.value && !isGenerating;
  }

  generateBtn.disabled = !canGenerate;
}

async function onGenerate() {
  if (isGenerating) return;

  if (mode === 'solo') {
    await onGenerateSolo();
    return;
  }

  const pairingId = pairingSelect.value;
  const template = templateSelect.value;
  const darkMode = darkModeToggle.checked;
  const playerPose = playerPoseSelect.value;
  const figurePose = figurePoseSelect.value;
  const hairColor = hairColorSelect.value || null;

  if (!pairingId || !template) return;

  // Get pairing data for cardMode
  const pairing = pairingsFull[pairingId];
  const cardMode = pairing?.cardMode || 'player-figure';

  isGenerating = true;
  generateBtn.classList.add('generating');
  generateBtn.disabled = true;
  regenerateBtn.classList.add('hidden');

  // Show generation log
  generationLog.classList.remove('hidden');
  logOutput.textContent = 'Starting generation...\n';

  try {
    const res = await fetch(`${API_BASE}/api/generate-with-poses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pairingId,
        template,
        darkMode,
        playerPose,
        figurePose,
        hairColor,
        cardMode,
        series: currentSeries
      })
    });

    const result = await res.json();

    if (result.success) {
      // Update log
      logOutput.textContent += result.output || 'Generation complete!\n';

      // Show result - use series-aware path
      const seriesPath = result.series || currentSeries;
      const imagePath = `/cards/${seriesPath}/${pairingId}/${result.filename}`;
      resultImage.src = imagePath + '?t=' + Date.now(); // Cache bust
      resultViewLink.href = `/?pairing=${pairingId}&card=${result.cardId}`;

      resultPlaceholder.classList.add('hidden');
      resultCard.classList.remove('hidden');
      regenerateBtn.classList.remove('hidden');

      // Store last generated settings
      lastGeneratedCard = {
        mode: 'pairing',
        pairingId,
        series: seriesPath,
        cardMode,
        template,
        darkMode,
        playerPose,
        figurePose,
        hairColor,
        cardId: result.cardId,
        filename: result.filename,
        prompt: result.prompt
      };

      // Reset feedback UI
      resetFeedbackUI();

      // Store and display prompt
      if (result.prompt) {
        document.getElementById('prompt-text').value = result.prompt;
      } else {
        document.getElementById('prompt-text').value = 'Prompt not available';
      }
      document.getElementById('prompt-content').classList.add('hidden');

    } else {
      logOutput.textContent += `\nError: ${result.error}\n`;
      if (result.output) {
        logOutput.textContent += result.output;
      }
    }

  } catch (err) {
    logOutput.textContent += `\nFetch error: ${err.message}\n`;
  } finally {
    isGenerating = false;
    generateBtn.classList.remove('generating');
    updateGenerateButton();
  }
}

async function onGenerateSolo() {
  const template = templateSelect.value;
  const pose = playerPoseSelect.value;
  const hairColor = hairColorSelect.value || null;

  if (!currentCharacterType || !currentCharacterId || !template) return;

  isGenerating = true;
  generateBtn.classList.add('generating');
  generateBtn.disabled = true;
  regenerateBtn.classList.add('hidden');

  // Show generation log
  generationLog.classList.remove('hidden');
  logOutput.textContent = `Starting solo generation...\nType: ${currentCharacterType}\nCharacter: ${currentCharacterId}\n`;

  try {
    const res = await fetch(`${API_BASE}/api/generate-solo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: currentCharacterType,
        characterId: currentCharacterId,
        template,
        pose,
        hairColor,
        series: currentSeries
      })
    });

    const result = await res.json();

    if (result.success) {
      logOutput.textContent += result.output || 'Generation complete!\n';

      // Build the image path based on solo structure (series-aware)
      const seriesPath = result.series || currentSeries;
      const imagePath = `/cards/${seriesPath}/solo-${currentCharacterType}-${currentCharacterId}/${result.filename}`;
      resultImage.src = imagePath + '?t=' + Date.now();
      resultViewLink.href = `/?card=${result.cardId}`;

      resultPlaceholder.classList.add('hidden');
      resultCard.classList.remove('hidden');
      regenerateBtn.classList.remove('hidden');

      // Store last generated settings
      lastGeneratedCard = {
        mode: 'solo',
        series: seriesPath,
        characterType: currentCharacterType,
        characterId: currentCharacterId,
        template,
        pose,
        hairColor,
        cardId: result.cardId,
        filename: result.filename
      };

      // Reset feedback UI
      resetFeedbackUI();

      // Prompt not returned from solo generation currently
      document.getElementById('prompt-text').value = 'Prompt not available (check output directory)';
      document.getElementById('prompt-content').classList.add('hidden');

    } else {
      logOutput.textContent += `\nError: ${result.error}\n`;
      if (result.output) {
        logOutput.textContent += result.output;
      }
    }

  } catch (err) {
    logOutput.textContent += `\nFetch error: ${err.message}\n`;
  } finally {
    isGenerating = false;
    generateBtn.classList.remove('generating');
    updateGenerateButton();
  }
}

async function onRegenerate() {
  // Just run generate again with same settings
  await onGenerate();
}

// Pose Swap Modal
function openPoseSwapModal() {
  if (!lastGeneratedCard) return;

  // Populate swap selects with current poses
  const swapPlayerPose = document.getElementById('swap-player-pose');
  const swapFigurePose = document.getElementById('swap-figure-pose');

  swapPlayerPose.innerHTML = playerPoseSelect.innerHTML;
  swapPlayerPose.value = lastGeneratedCard.playerPose;

  swapFigurePose.innerHTML = figurePoseSelect.innerHTML;
  swapFigurePose.value = lastGeneratedCard.figurePose;

  document.getElementById('pose-swap-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePoseSwapModal() {
  document.getElementById('pose-swap-modal').classList.remove('active');
  document.body.style.overflow = '';
}

async function onSwapGenerate() {
  const swapPlayerPose = document.getElementById('swap-player-pose').value;
  const swapFigurePose = document.getElementById('swap-figure-pose').value;

  // Update main selects
  playerPoseSelect.value = swapPlayerPose;
  figurePoseSelect.value = swapFigurePose;
  updatePosePreview('player');
  updatePosePreview('figure');

  closePoseSwapModal();

  // Generate with new poses
  await onGenerate();
}

// Feedback Functions
function resetFeedbackUI() {
  // Clear rating buttons
  document.querySelectorAll('.result-feedback .feedback-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  // Clear notes
  document.getElementById('result-feedback-notes').value = '';
  // Reset scope to default
  const scopeSelect = document.getElementById('result-feedback-scope');
  if (scopeSelect) scopeSelect.value = 'card';
  // Clear category checkboxes
  document.querySelectorAll('input[name="result-category"]').forEach(cb => {
    cb.checked = false;
  });
}

function onRatingClick(e) {
  const btn = e.currentTarget;
  const rating = btn.dataset.rating;

  // Update active state
  document.querySelectorAll('.result-feedback .feedback-btn').forEach(b => {
    b.classList.remove('active');
  });
  btn.classList.add('active');

  // If "issues" or "liked", focus the notes field
  if (rating === 'issues' || rating === 'liked') {
    document.getElementById('result-feedback-notes').focus();
  }
}

async function saveResultFeedback() {
  if (!lastGeneratedCard || !lastGeneratedCard.cardId) return;

  const activeBtn = document.querySelector('.result-feedback .feedback-btn.active');
  const rating = activeBtn?.dataset.rating || null;
  const notes = document.getElementById('result-feedback-notes').value;
  const scope = document.getElementById('result-feedback-scope')?.value || 'card';

  // Get selected categories
  const categories = [];
  document.querySelectorAll('input[name="result-category"]:checked').forEach(cb => {
    categories.push(cb.value);
  });

  if (!rating && !notes) return;

  const saveBtn = document.getElementById('save-result-feedback');
  saveBtn.textContent = 'Saving...';

  try {
    const res = await fetch(`${API_BASE}/api/feedback/${encodeURIComponent(lastGeneratedCard.cardId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, notes, scope, categories })
    });

    if (res.ok) {
      saveBtn.textContent = 'Saved!';
      setTimeout(() => { saveBtn.textContent = 'Save Feedback'; }, 1500);
    } else {
      saveBtn.textContent = 'Failed';
      setTimeout(() => { saveBtn.textContent = 'Save Feedback'; }, 2000);
    }
  } catch (err) {
    console.error('Failed to save feedback:', err);
    saveBtn.textContent = 'Failed';
    setTimeout(() => { saveBtn.textContent = 'Save Feedback'; }, 2000);
  }
}

function togglePromptDisplay() {
  const content = document.getElementById('prompt-content');
  const btn = document.getElementById('toggle-prompt');

  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    btn.textContent = 'Hide Prompt';
  } else {
    content.classList.add('hidden');
    btn.textContent = 'View Prompt';
  }
}

function copyPrompt() {
  const promptText = document.getElementById('prompt-text').value;
  navigator.clipboard.writeText(promptText).then(() => {
    const btn = document.getElementById('copy-prompt');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy Prompt'; }, 1500);
  });
}

async function regenerateFromPrompt() {
  if (!lastGeneratedCard) return;

  const editedPrompt = document.getElementById('prompt-text').value;
  if (!editedPrompt.trim()) {
    alert('Prompt is empty');
    return;
  }

  const btn = document.getElementById('regenerate-from-prompt');
  btn.textContent = 'Generating...';
  btn.disabled = true;

  // Show generation log
  generationLog.classList.remove('hidden');
  logOutput.textContent = 'Regenerating with edited prompt...\n';

  try {
    const res = await fetch(`${API_BASE}/api/generate-from-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: editedPrompt,
        pairingId: lastGeneratedCard.pairingId
      })
    });

    const result = await res.json();

    if (result.success) {
      logOutput.textContent += 'Generation complete!\n';

      // Show result
      const imagePath = `/cards/${result.pairingId}/${result.filename}`;
      resultImage.src = imagePath + '?t=' + Date.now();
      resultViewLink.href = `/?pairing=${result.pairingId}&card=${result.cardId}`;

      // Update last generated card
      lastGeneratedCard = {
        ...lastGeneratedCard,
        cardId: result.cardId,
        filename: result.filename,
        prompt: editedPrompt
      };

      // Reset feedback UI for new card
      resetFeedbackUI();

      btn.textContent = 'Regenerate with Edited Prompt';
      btn.disabled = false;
    } else {
      logOutput.textContent += `\nError: ${result.error}\n`;
      if (result.message) {
        logOutput.textContent += `Message: ${result.message}\n`;
      }
      btn.textContent = 'Failed - Try Again';
      setTimeout(() => {
        btn.textContent = 'Regenerate with Edited Prompt';
        btn.disabled = false;
      }, 2000);
    }
  } catch (err) {
    logOutput.textContent += `\nFetch error: ${err.message}\n`;
    btn.textContent = 'Failed - Try Again';
    setTimeout(() => {
      btn.textContent = 'Regenerate with Edited Prompt';
      btn.disabled = false;
    }, 2000);
  }
}

// ========================================
// SEND TO CLAUDE
// ========================================

/**
 * Format scope for display
 */
function formatScopeLabel(scope) {
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
 */
function formatCategoriesLabel(categories) {
  if (!categories || categories.length === 0) return 'None specified';
  return categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
}

/**
 * Format rating for display
 */
function formatRatingLabel(rating) {
  const ratingLabels = {
    'loved': 'Loved',
    'liked': 'Liked',
    'issues': 'Issues'
  };
  return ratingLabels[rating] || rating || 'None';
}

/**
 * Generate regeneration command
 */
function generateRegenerateCommand(card) {
  if (card.mode === 'solo') {
    let cmd = `node scripts/generate-solo.js ${card.characterType} ${card.characterId} ${card.template}`;
    if (card.pose && card.pose !== 'default') {
      cmd += ` --pose ${card.pose}`;
    }
    return cmd;
  }

  // Pairing card
  let cmd = `node scripts/generate-with-poses.js ${card.pairingId} ${card.template}`;

  if (card.playerPose && card.playerPose !== 'default') {
    cmd += ` \\\n  --player-pose ${card.playerPose}`;
  }
  if (card.figurePose && card.figurePose !== 'default') {
    cmd += ` \\\n  --figure-pose ${card.figurePose}`;
  }

  return cmd;
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'success', duration = 3000) {
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

/**
 * Handle Send to Claude button click
 */
async function handleSendToClaudeGenerator() {
  if (!lastGeneratedCard || !lastGeneratedCard.cardId) {
    showToast('No card generated yet', 'error');
    return;
  }

  // Get current feedback from UI
  const activeBtn = document.querySelector('.result-feedback .feedback-btn.active');
  const rating = activeBtn?.dataset.rating || null;
  const notes = document.getElementById('result-feedback-notes').value;
  const scope = document.getElementById('result-feedback-scope')?.value || 'card';

  // Get selected categories
  const categories = [];
  document.querySelectorAll('input[name="result-category"]:checked').forEach(cb => {
    categories.push(cb.value);
  });

  // Build title
  let title;
  if (lastGeneratedCard.mode === 'solo') {
    title = `Solo ${lastGeneratedCard.characterType}: ${lastGeneratedCard.characterId}`;
  } else {
    const pairing = pairingsFull[lastGeneratedCard.pairingId];
    title = pairing
      ? `${pairing.player.name} & ${pairing.figure.name}`
      : lastGeneratedCard.pairingId;
  }

  // Build the formatted output
  const lines = [];

  const cardIdentifier = lastGeneratedCard.mode === 'solo'
    ? `solo-${lastGeneratedCard.characterType}-${lastGeneratedCard.characterId}`
    : lastGeneratedCard.pairingId;

  lines.push(`## Card Feedback: ${cardIdentifier} (${lastGeneratedCard.template})`);
  lines.push('');
  lines.push(`**Rating:** ${formatRatingLabel(rating)}`);
  lines.push(`**Scope:** ${formatScopeLabel(scope)}`);
  lines.push(`**Categories:** ${formatCategoriesLabel(categories)}`);
  lines.push('');

  if (notes) {
    lines.push(`**Feedback:** "${notes}"`);
    lines.push('');
  }

  // Parameters section
  lines.push('**Parameters:**');
  if (lastGeneratedCard.mode === 'solo') {
    lines.push(`- Mode: Solo`);
    lines.push(`- Character Type: ${lastGeneratedCard.characterType}`);
    lines.push(`- Character: ${lastGeneratedCard.characterId}`);
  } else {
    lines.push(`- Pairing: ${title}`);
  }
  lines.push(`- Template: ${lastGeneratedCard.template}`);

  if (lastGeneratedCard.mode === 'pairing') {
    if (lastGeneratedCard.playerPose) lines.push(`- Player pose: ${lastGeneratedCard.playerPose}`);
    if (lastGeneratedCard.figurePose) lines.push(`- Figure pose: ${lastGeneratedCard.figurePose}`);
  } else if (lastGeneratedCard.pose) {
    lines.push(`- Pose: ${lastGeneratedCard.pose}`);
  }
  lines.push('');

  // Prompt file reference (not full text - Claude can read it)
  if (lastGeneratedCard.filename) {
    const promptFilename = lastGeneratedCard.filename.replace(/\.(png|jpe?g)$/, '-prompt.txt');
    let promptPath;
    if (lastGeneratedCard.mode === 'solo') {
      promptPath = `output/cards/${lastGeneratedCard.series}/solo-${lastGeneratedCard.characterType}-${lastGeneratedCard.characterId}/${promptFilename}`;
    } else {
      promptPath = `output/cards/${lastGeneratedCard.series}/${lastGeneratedCard.pairingId}/${promptFilename}`;
    }
    lines.push(`**Prompt file:** \`${promptPath}\``);
    lines.push('');
  }

  // Regenerate command
  lines.push('**Regenerate:**');
  lines.push('```bash');
  lines.push(generateRegenerateCommand(lastGeneratedCard));
  lines.push('```');

  const formatted = lines.join('\n');

  // Copy to clipboard
  try {
    await navigator.clipboard.writeText(formatted);
    showToast('Copied to clipboard - paste into Claude Code', 'success');
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    showToast('Failed to copy to clipboard', 'error');
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Mode toggle
  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', onModeChange);
  });

  // Pairing mode
  pairingSelect.addEventListener('change', onPairingChange);
  templateSelect.addEventListener('change', onTemplateChange);
  darkModeToggle.addEventListener('change', onDarkModeChange);

  // Solo mode
  characterTypeSelect.addEventListener('change', onCharacterTypeChange);
  characterSelect.addEventListener('change', onCharacterChange);

  playerPoseSelect.addEventListener('change', () => updatePosePreview('player'));
  figurePoseSelect.addEventListener('change', () => updatePosePreview('figure'));

  generateBtn.addEventListener('click', onGenerate);
  regenerateBtn.addEventListener('click', onRegenerate);

  // Pose swap modal
  document.getElementById('result-quick-swap').addEventListener('click', openPoseSwapModal);
  document.getElementById('swap-modal-close').addEventListener('click', closePoseSwapModal);
  document.getElementById('swap-generate-btn').addEventListener('click', onSwapGenerate);

  document.getElementById('pose-swap-modal').addEventListener('click', (e) => {
    if (e.target.id === 'pose-swap-modal') closePoseSwapModal();
  });

  // Feedback buttons
  document.querySelectorAll('.result-feedback .feedback-btn').forEach(btn => {
    btn.addEventListener('click', onRatingClick);
  });
  document.getElementById('save-result-feedback').addEventListener('click', saveResultFeedback);

  // Send to Claude button
  const sendToClaudeBtn = document.getElementById('send-to-claude-gen');
  if (sendToClaudeBtn) {
    sendToClaudeBtn.addEventListener('click', handleSendToClaudeGenerator);
  }

  // Prompt display and edit
  document.getElementById('toggle-prompt').addEventListener('click', togglePromptDisplay);
  document.getElementById('copy-prompt').addEventListener('click', copyPrompt);
  document.getElementById('regenerate-from-prompt').addEventListener('click', regenerateFromPrompt);

  // Keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePoseSwapModal();
    }
    // Ctrl/Cmd + Enter to generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (!generateBtn.disabled) {
        onGenerate();
      }
    }
  });
}

// Start
init();
