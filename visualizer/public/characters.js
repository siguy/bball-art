/**
 * Court & Covenant - Characters Page
 * Manage standalone characters for solo card generation
 */

const API_BASE = '';

// State
let allCharacters = [];
let currentView = 'grid'; // 'grid', 'create', 'edit'
let currentCharacterType = 'player';
let currentCharacterId = null;
let editingCharacter = null;
let editingPoses = [];
let editingQuotes = null;

// DOM Elements
const gridView = document.getElementById('grid-view');
const formView = document.getElementById('form-view');
const stepResearch = document.getElementById('step-research');
const stepEdit = document.getElementById('step-edit');
const charactersGrid = document.getElementById('characters-grid');
const emptyState = document.getElementById('empty-state');
const typeFilter = document.getElementById('type-filter');
const searchInput = document.getElementById('search-input');
const posesContainer = document.getElementById('poses-container');
const poseCardTemplate = document.getElementById('pose-card-template');

// Initialize
async function init() {
  // Initialize series selector
  if (typeof initSeriesSelector === 'function') {
    initSeriesSelector();
  }

  updateTypeFilterForSeries();
  await loadCharacters();
  renderGrid();
  setupEventListeners();
}

// Update type filter dropdown based on series
function updateTypeFilterForSeries() {
  const currentSeries = getCurrentSeries();
  const playerOption = typeFilter.querySelector('option[value="player"]');
  const allOption = typeFilter.querySelector('option[value="all"]');

  if (!seriesSupportsPlayers(currentSeries)) {
    // Hide player and "all" options for figure-only series
    if (playerOption) playerOption.style.display = 'none';
    if (allOption) allOption.style.display = 'none';
    // Force to figures
    typeFilter.value = 'figure';
  } else {
    // Show all options for series that support players
    if (playerOption) playerOption.style.display = '';
    if (allOption) allOption.style.display = '';
  }
}

// API Calls
async function loadCharacters() {
  try {
    const [playersRes, figuresRes] = await Promise.all([
      fetch(`${API_BASE}/api/characters/players`),
      fetch(`${API_BASE}/api/characters/figures`)
    ]);

    const players = await playersRes.json();
    const figures = await figuresRes.json();

    allCharacters = [
      ...players.map(p => ({ ...p, type: 'player' })),
      ...figures.map(f => ({ ...f, type: 'figure' }))
    ];
  } catch (err) {
    console.error('Failed to load characters:', err);
    allCharacters = [];
  }
}

async function researchCharacter(type, name) {
  const res = await fetch(`${API_BASE}/api/characters/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, name })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Research failed');
  }

  return await res.json();
}

async function saveCharacter(type, character, poses, quotes = null) {
  const body = { type, character, poses };
  if (quotes) body.quotes = quotes;

  const res = await fetch(`${API_BASE}/api/characters/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Save failed');
  }

  return await res.json();
}

async function loadCharacterDetails(type, id) {
  const res = await fetch(`${API_BASE}/api/characters/${type}/${id}`);

  if (!res.ok) {
    throw new Error('Failed to load character');
  }

  return await res.json();
}

async function deleteCharacter(type, id) {
  const res = await fetch(`${API_BASE}/api/characters/${type}/${id}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Delete failed');
  }

  return await res.json();
}

// Get current series
function getCurrentSeries() {
  return typeof getSelectedSeries === 'function' ? getSelectedSeries() : 'court-covenant';
}

// Check if series supports players
function seriesSupportsPlayers(series) {
  return series !== 'torah-titans';
}

// Render Functions
function renderGrid() {
  const filtered = getFilteredCharacters();

  if (filtered.length === 0) {
    charactersGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  charactersGrid.innerHTML = filtered.map(char => `
    <div class="character-card" data-type="${char.type}" data-id="${char.id}">
      <div class="char-icon">${char.type === 'player' ? '🏀' : '📜'}</div>
      <div class="char-name">${char.name}</div>
      ${char.displayName ? `<div class="char-display-name">"${char.displayName}"</div>` : ''}
      <div class="char-meta">
        <span class="char-badge">${char.type === 'player' ? 'Player' : 'Figure'}</span>
        ${char.standalone ? '<span class="char-badge standalone">Standalone</span>' : ''}
        ${char.era ? `<span class="char-badge">${char.era}</span>` : ''}
      </div>
      <div class="char-poses">${char.poseCount || 0} poses</div>
      <div class="char-actions">
        <button class="btn btn-edit">View / Edit</button>
      </div>
    </div>
  `).join('');

  // Add click handlers
  charactersGrid.querySelectorAll('.character-card').forEach(card => {
    card.querySelector('.btn-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      const type = card.dataset.type;
      const id = card.dataset.id;
      openEditForm(type, id);
    });
  });
}

function getFilteredCharacters() {
  let filtered = [...allCharacters];
  const currentSeries = getCurrentSeries();

  // For Torah Titans, exclude players entirely
  if (!seriesSupportsPlayers(currentSeries)) {
    filtered = filtered.filter(c => c.type === 'figure');
  }

  // Filter by type
  const typeValue = typeFilter.value;
  if (typeValue !== 'all') {
    filtered = filtered.filter(c => c.type === typeValue);
  }

  // Filter by search
  const search = searchInput.value.toLowerCase().trim();
  if (search) {
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(search) ||
      (c.displayName && c.displayName.toLowerCase().includes(search))
    );
  }

  // Sort: standalone first, then by name
  filtered.sort((a, b) => {
    if (a.standalone && !b.standalone) return -1;
    if (!a.standalone && b.standalone) return 1;
    return a.name.localeCompare(b.name);
  });

  return filtered;
}

// View Navigation
function showGridView() {
  currentView = 'grid';
  gridView.classList.remove('hidden');
  formView.classList.add('hidden');
}

function showCreateForm() {
  currentView = 'create';
  currentCharacterId = null;
  editingCharacter = null;
  editingPoses = [];
  editingQuotes = null;

  gridView.classList.add('hidden');
  formView.classList.remove('hidden');
  stepResearch.classList.remove('hidden');
  stepEdit.classList.add('hidden');

  // Reset form
  document.getElementById('research-name').value = '';
  document.getElementById('research-error').classList.add('hidden');

  const currentSeries = getCurrentSeries();
  const playerRadio = document.querySelector('input[name="char-type"][value="player"]');
  const figureRadio = document.querySelector('input[name="char-type"][value="figure"]');
  const playerLabel = playerRadio?.closest('label');

  if (!seriesSupportsPlayers(currentSeries)) {
    // Hide player option for figure-only series
    if (playerLabel) playerLabel.style.display = 'none';
    figureRadio.checked = true;
    currentCharacterType = 'figure';
  } else {
    if (playerLabel) playerLabel.style.display = '';
    playerRadio.checked = true;
    currentCharacterType = 'player';
  }

  window.scrollTo(0, 0);
}

function showEditStep() {
  stepResearch.classList.add('hidden');
  stepEdit.classList.remove('hidden');

  // Update form based on type
  const isPlayer = currentCharacterType === 'player';
  document.getElementById('jersey-section').classList.toggle('hidden', !isPlayer);
  document.getElementById('clothing-section').classList.toggle('hidden', isPlayer);

  // Show/hide delete button (only for existing characters)
  document.getElementById('delete-character-btn').classList.toggle('hidden', !currentCharacterId);
}

async function openEditForm(type, id) {
  currentView = 'edit';
  currentCharacterType = type;
  currentCharacterId = id;

  try {
    const data = await loadCharacterDetails(type, id);
    editingCharacter = data.character;
    editingPoses = Object.values(data.poses || {});

    populateEditForm(editingCharacter, editingPoses);

    gridView.classList.add('hidden');
    formView.classList.remove('hidden');
    stepResearch.classList.add('hidden');
    stepEdit.classList.remove('hidden');

    document.getElementById('edit-title').textContent = editingCharacter.name;
    showEditStep();

    window.scrollTo(0, 0);
  } catch (err) {
    console.error('Failed to load character:', err);
    alert('Failed to load character: ' + err.message);
  }
}

// Form Population
function populateEditForm(character, poses) {
  document.getElementById('edit-id').value = character.id || '';
  document.getElementById('edit-name').value = character.name || '';
  document.getElementById('edit-display-name').value = character.displayName || '';
  document.getElementById('edit-era').value = character.era || '1990s';
  document.getElementById('edit-physical').value = character.physicalDescription || '';
  document.getElementById('edit-archetype').value = character.archetype || '';

  // Jersey colors (players)
  if (character.jerseyColors) {
    document.getElementById('jersey-primary-base').value = character.jerseyColors.primary?.base || '';
    document.getElementById('jersey-primary-accent').value = character.jerseyColors.primary?.accent || '';
    document.getElementById('jersey-secondary-base').value = character.jerseyColors.secondary?.base || '';
    document.getElementById('jersey-secondary-accent').value = character.jerseyColors.secondary?.accent || '';
  } else {
    document.getElementById('jersey-primary-base').value = '';
    document.getElementById('jersey-primary-accent').value = '';
    document.getElementById('jersey-secondary-base').value = '';
    document.getElementById('jersey-secondary-accent').value = '';
  }

  // Clothing (figures)
  document.getElementById('edit-clothing').value = character.clothing || '';

  // Render poses
  renderPoses(poses);
}

function renderPoses(poses) {
  posesContainer.innerHTML = '';

  poses.forEach((pose, index) => {
    const card = createPoseCard(pose, index === 0);
    posesContainer.appendChild(card);
  });
}

function createPoseCard(pose, isDefault = false) {
  const template = poseCardTemplate.content.cloneNode(true);
  const card = template.querySelector('.pose-card');

  card.dataset.poseId = pose.id || '';

  card.querySelector('.pose-name').value = pose.name || '';
  card.querySelector('.pose-id').value = pose.id || '';
  card.querySelector('.pose-description').value = pose.description || '';
  card.querySelector('.pose-expression').value = pose.expression || '';
  card.querySelector('.pose-prompt').value = pose.prompt || '';
  card.querySelector('.pose-energy').value = pose.energy || '';

  // Update ID when name changes
  const nameInput = card.querySelector('.pose-name');
  const idInput = card.querySelector('.pose-id');

  nameInput.addEventListener('input', () => {
    if (!card.dataset.poseId) {
      idInput.value = toKebabCase(nameInput.value);
    }
  });

  // Remove button
  card.querySelector('.btn-remove-pose').addEventListener('click', () => {
    card.remove();
  });

  return card;
}

function addNewPose() {
  const card = createPoseCard({
    id: '',
    name: '',
    description: '',
    expression: '',
    prompt: '',
    energy: ''
  });
  posesContainer.appendChild(card);
  card.querySelector('.pose-name').focus();
}

// Form Collection
function collectFormData() {
  const character = {
    id: document.getElementById('edit-id').value.trim(),
    name: document.getElementById('edit-name').value.trim(),
    displayName: document.getElementById('edit-display-name').value.trim() || undefined,
    poseFileId: document.getElementById('edit-id').value.trim(),
    era: document.getElementById('edit-era').value,
    physicalDescription: document.getElementById('edit-physical').value.trim(),
    archetype: document.getElementById('edit-archetype').value.trim() || undefined
  };

  if (currentCharacterType === 'player') {
    character.jerseyColors = {
      primary: {
        base: document.getElementById('jersey-primary-base').value.trim() || 'red',
        accent: document.getElementById('jersey-primary-accent').value.trim() || 'white'
      },
      secondary: {
        base: document.getElementById('jersey-secondary-base').value.trim() || 'white',
        accent: document.getElementById('jersey-secondary-accent').value.trim() || 'red'
      }
    };
  } else {
    character.clothing = document.getElementById('edit-clothing').value.trim() || undefined;
  }

  // Collect poses
  const poses = {};
  let defaultPose = null;

  posesContainer.querySelectorAll('.pose-card').forEach((card, index) => {
    const id = card.querySelector('.pose-id').value.trim() || toKebabCase(card.querySelector('.pose-name').value);
    if (!id) return;

    const pose = {
      id,
      name: card.querySelector('.pose-name').value.trim(),
      description: card.querySelector('.pose-description').value.trim(),
      expression: card.querySelector('.pose-expression').value.trim(),
      prompt: card.querySelector('.pose-prompt').value.trim(),
      energy: card.querySelector('.pose-energy').value.trim()
    };

    poses[id] = pose;

    if (index === 0) {
      defaultPose = id;
    }
  });

  return { character, poses, defaultPose };
}

function validateForm() {
  const { character, poses } = collectFormData();

  const errors = [];

  if (!character.id) errors.push('Character ID is required');
  if (!character.name) errors.push('Character name is required');
  if (!character.physicalDescription) errors.push('Physical description is required');
  if (Object.keys(poses).length === 0) errors.push('At least one pose is required');

  // Check poses have required fields
  Object.values(poses).forEach((pose, i) => {
    if (!pose.name) errors.push(`Pose ${i + 1}: Name is required`);
    if (!pose.prompt) errors.push(`Pose ${i + 1}: Prompt is required`);
  });

  return errors;
}

// Event Handlers
async function onResearchClick() {
  const name = document.getElementById('research-name').value.trim();
  const type = document.querySelector('input[name="char-type"]:checked').value;

  if (!name) {
    showResearchError('Please enter a character name');
    return;
  }

  currentCharacterType = type;

  const btn = document.getElementById('research-btn');
  btn.classList.add('loading');
  hideResearchError();

  try {
    const data = await researchCharacter(type, name);

    editingCharacter = data.character;
    editingPoses = Object.values(data.poses || {});
    editingQuotes = data.quotes || null;

    populateEditForm(editingCharacter, editingPoses);
    document.getElementById('edit-title').textContent = `Review: ${editingCharacter.name}`;
    showEditStep();

  } catch (err) {
    console.error('Research failed:', err);
    showResearchError(err.message || 'Research failed. Please try again.');
  } finally {
    btn.classList.remove('loading');
  }
}

async function onSaveClick() {
  const errors = validateForm();
  if (errors.length > 0) {
    alert('Please fix the following errors:\n\n' + errors.join('\n'));
    return;
  }

  const { character, poses, defaultPose } = collectFormData();

  const saveBtn = document.getElementById('save-character-btn');
  const saveBtnBottom = document.getElementById('save-character-btn-bottom');
  saveBtn.textContent = 'Saving...';
  saveBtnBottom.textContent = 'Saving...';
  saveBtn.disabled = true;
  saveBtnBottom.disabled = true;

  try {
    await saveCharacter(currentCharacterType, character, { poses, defaultPose }, editingQuotes);

    // Refresh character list
    await loadCharacters();
    renderGrid();

    // Offer to generate a card
    const generateNow = confirm(`Character "${character.name}" saved successfully!\n\nWould you like to generate a solo card with this character?`);

    if (generateNow) {
      // Redirect to generator with character pre-selected
      window.location.href = `/generator.html?mode=solo&type=${currentCharacterType}&character=${character.id}`;
    } else {
      showGridView();
    }

  } catch (err) {
    console.error('Save failed:', err);
    alert('Failed to save character: ' + err.message);
  } finally {
    saveBtn.textContent = 'Save Character';
    saveBtnBottom.textContent = 'Save Character';
    saveBtn.disabled = false;
    saveBtnBottom.disabled = false;
  }
}

async function onDeleteClick() {
  if (!currentCharacterId || !currentCharacterType) return;

  const confirmed = confirm(`Are you sure you want to delete this character?\n\nThis will remove the character and pose files. This cannot be undone.`);
  if (!confirmed) return;

  const btn = document.getElementById('delete-character-btn');
  btn.textContent = 'Deleting...';
  btn.disabled = true;

  try {
    await deleteCharacter(currentCharacterType, currentCharacterId);

    // Refresh and go back to grid
    await loadCharacters();
    renderGrid();

    alert('Character deleted successfully');
    showGridView();

  } catch (err) {
    console.error('Delete failed:', err);
    alert('Failed to delete character: ' + err.message);
    btn.textContent = 'Delete Character';
    btn.disabled = false;
  }
}

// Helpers
function toKebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function showResearchError(message) {
  const errorEl = document.getElementById('research-error');
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function hideResearchError() {
  document.getElementById('research-error').classList.add('hidden');
}

// Event Listeners Setup
function setupEventListeners() {
  // Grid filters
  typeFilter.addEventListener('change', renderGrid);
  searchInput.addEventListener('input', renderGrid);

  // New character button
  document.getElementById('new-character-btn').addEventListener('click', showCreateForm);

  // Back buttons
  document.getElementById('back-to-grid').addEventListener('click', showGridView);
  document.getElementById('back-to-research').addEventListener('click', () => {
    stepEdit.classList.add('hidden');
    stepResearch.classList.remove('hidden');
  });

  // Research button
  document.getElementById('research-btn').addEventListener('click', onResearchClick);

  // Research on Enter
  document.getElementById('research-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      onResearchClick();
    }
  });

  // Character type change
  document.querySelectorAll('input[name="char-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentCharacterType = e.target.value;
    });
  });

  // Add pose button
  document.getElementById('add-pose-btn').addEventListener('click', addNewPose);

  // Save buttons
  document.getElementById('save-character-btn').addEventListener('click', onSaveClick);
  document.getElementById('save-character-btn-bottom').addEventListener('click', onSaveClick);

  // Delete button
  document.getElementById('delete-character-btn').addEventListener('click', onDeleteClick);
}

// Start
init();
