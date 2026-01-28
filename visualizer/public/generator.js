/**
 * Court & Covenant Card Generator
 * Interactive UI for generating cards with pose control
 */

const API_BASE = '';

// State
let pairings = {};
let pairingsFull = {};
let templatesMeta = {};
let currentPlayerPoses = null;
let currentFigurePoses = null;
let lastGeneratedCard = null;
let isGenerating = false;

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

// Initialize
async function init() {
  await Promise.all([
    fetchPairings(),
    fetchPairingsFull(),
    fetchTemplates()
  ]);

  populatePairings();
  populateTemplates();
  setupEventListeners();
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
  const canGenerate = pairingSelect.value && templateSelect.value && !isGenerating;
  generateBtn.disabled = !canGenerate;
}

async function onGenerate() {
  if (isGenerating) return;

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
        document.getElementById('prompt-text').textContent = result.prompt;
      } else {
        document.getElementById('prompt-text').textContent = 'Prompt not available';
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
  const promptText = document.getElementById('prompt-text').textContent;
  navigator.clipboard.writeText(promptText).then(() => {
    const btn = document.getElementById('copy-prompt');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy Prompt'; }, 1500);
  });
}

// Event Listeners Setup
function setupEventListeners() {
  pairingSelect.addEventListener('change', onPairingChange);
  templateSelect.addEventListener('change', onTemplateChange);
  darkModeToggle.addEventListener('change', onDarkModeChange);

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

  // Prompt display
  document.getElementById('toggle-prompt').addEventListener('click', togglePromptDisplay);
  document.getElementById('copy-prompt').addEventListener('click', copyPrompt);

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
