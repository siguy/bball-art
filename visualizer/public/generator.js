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

// Solo mode state
let players = [];
let figures = [];
let currentCharacterType = null;
let currentCharacterId = null;
let currentSoloPoses = null;

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

// Solo mode DOM elements
const characterTypeSelect = document.getElementById('character-type-select');
const characterSelect = document.getElementById('character-select');
const characterInfo = document.getElementById('character-info');

// Initialize
async function init() {
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
    const res = await fetch(`${API_BASE}/api/pairings`);
    pairings = await res.json();
  } catch (err) {
    console.error('Failed to fetch pairings:', err);
  }
}

async function fetchPairingsFull() {
  try {
    const res = await fetch(`${API_BASE}/api/pairings-full`);
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

// Populate Controls
function populatePairings() {
  // Sort pairings by priority
  const sortedPairings = Object.entries(pairingsFull)
    .sort((a, b) => (a[1].priority || 99) - (b[1].priority || 99));

  // Group by type
  const heroes = sortedPairings.filter(([_, p]) => p.type === 'hero' || !p.type);
  const villains = sortedPairings.filter(([_, p]) => p.type === 'villain');

  let html = '<option value="">Select a pairing...</option>';

  if (heroes.length > 0) {
    html += '<optgroup label="Heroes">';
    heroes.forEach(([id, pairing]) => {
      const label = `${pairing.player.name} & ${pairing.figure.name}`;
      html += `<option value="${id}">${label}</option>`;
    });
    html += '</optgroup>';
  }

  if (villains.length > 0) {
    html += '<optgroup label="Villains">';
    villains.forEach(([id, pairing]) => {
      const label = `${pairing.player.name} & ${pairing.figure.name}`;
      html += `<option value="${id}">${label}</option>`;
    });
    html += '</optgroup>';
  }

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
  const poses = type === 'player' ? currentPlayerPoses : currentFigurePoses;

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
    let text = pose.description || pose.prompt;
    if (pose.energy) {
      text += ` <span class="pose-energy">[${pose.energy}]</span>`;
    }
    preview.innerHTML = text;
  } else {
    preview.textContent = '';
  }
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

  // Hide figure pose select, show player pose select for players
  if (type === 'player') {
    document.querySelector('.control-group:has(#player-pose-select) label').textContent = 'Pose';
    document.querySelector('.control-group:has(#figure-pose-select)').style.display = 'none';
  } else {
    document.querySelector('.control-group:has(#player-pose-select) label').textContent = 'Pose';
    document.querySelector('.control-group:has(#figure-pose-select)').style.display = 'none';
  }

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
function onPairingChange() {
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
    updateGenerateButton();
    return;
  }

  const pairing = pairingsFull[pairingId];
  if (!pairing) return;

  // Update info display
  pairingInfo.innerHTML = `
    <strong>${pairing.connection.thematic}</strong><br>
    <em>"${pairing.connection.narrative}"</em>
  `;

  // Auto-set dark mode based on type
  const isVillain = pairing.type === 'villain';
  darkModeToggle.checked = isVillain;
  if (isVillain) {
    autoBadge.classList.remove('hidden');
  } else {
    autoBadge.classList.add('hidden');
  }

  // Load poses
  const playerPoseFileId = pairing.player.poseFileId;
  const figurePoseFileId = pairing.figure.poseFileId;

  populatePlayerPoses(playerPoseFileId);
  populateFigurePoses(figurePoseFileId);

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
        hairColor
      })
    });

    const result = await res.json();

    if (result.success) {
      // Update log
      logOutput.textContent += result.output || 'Generation complete!\n';

      // Show result
      const imagePath = `/cards/${pairingId}/${result.filename}`;
      resultImage.src = imagePath + '?t=' + Date.now(); // Cache bust
      resultViewLink.href = `/?pairing=${pairingId}&card=${result.cardId}`;

      resultPlaceholder.classList.add('hidden');
      resultCard.classList.remove('hidden');
      regenerateBtn.classList.remove('hidden');

      // Store last generated settings
      lastGeneratedCard = {
        mode: 'pairing',
        pairingId,
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
        hairColor
      })
    });

    const result = await res.json();

    if (result.success) {
      logOutput.textContent += result.output || 'Generation complete!\n';

      // Build the image path based on solo structure
      const imagePath = `/cards/solo-${currentCharacterType}-${currentCharacterId}/${result.filename}`;
      resultImage.src = imagePath + '?t=' + Date.now();
      resultViewLink.href = `/?card=${result.cardId}`;

      resultPlaceholder.classList.add('hidden');
      resultCard.classList.remove('hidden');
      regenerateBtn.classList.remove('hidden');

      // Store last generated settings
      lastGeneratedCard = {
        mode: 'solo',
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

  if (!rating && !notes) return;

  const saveBtn = document.getElementById('save-result-feedback');
  saveBtn.textContent = 'Saving...';

  try {
    const res = await fetch(`${API_BASE}/api/feedback/${encodeURIComponent(lastGeneratedCard.cardId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, notes })
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
