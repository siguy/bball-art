/**
 * Court & Covenant - Website Selects
 * Manage cards selected for courtandcovenant.com
 */

const API_BASE = '';

// State
let manifest = { cards: [] };
let feedback = {};
let pairingData = {};
let selects = { cards: [] };
let selectedSortable = null;

// DOM Elements
const selectedCardsGrid = document.getElementById('selected-cards');
const availableCardsGrid = document.getElementById('available-cards');
const selectCounter = document.getElementById('select-counter');
const exportBtn = document.getElementById('export-web-btn');
const statsEl = document.getElementById('stats');

// Initialize
async function init() {
  await Promise.all([
    fetchManifest(),
    fetchFeedback(),
    fetchPairings(),
    fetchSelects()
  ]);

  renderCards();
  setupSortable();
  setupEventListeners();
  updateStats();
}

// API Calls
async function fetchManifest() {
  try {
    const res = await fetch(`${API_BASE}/api/manifest`);
    manifest = await res.json();
  } catch (err) {
    console.error('Failed to fetch manifest:', err);
  }
}

async function fetchFeedback() {
  try {
    const res = await fetch(`${API_BASE}/api/feedback`);
    feedback = await res.json();
  } catch (err) {
    console.error('Failed to fetch feedback:', err);
  }
}

async function fetchPairings() {
  try {
    const res = await fetch(`${API_BASE}/api/pairings`);
    pairingData = await res.json();
  } catch (err) {
    console.error('Failed to fetch pairings:', err);
  }
}

async function fetchSelects() {
  try {
    const res = await fetch(`${API_BASE}/api/selects`);
    selects = await res.json();
  } catch (err) {
    console.error('Failed to fetch selects:', err);
  }
}

// Render Functions
function renderCards() {
  renderSelectedCards();
  renderAvailableCards();
  updateCounter();
}

function renderSelectedCards() {
  const selectedCardIds = new Set(selects.cards.map(c => c.cardId));

  if (selects.cards.length === 0) {
    selectedCardsGrid.innerHTML = `
      <div class="empty-state" id="selected-empty">
        <p>No cards selected yet</p>
        <p class="hint">Add cards from the "Available" section below</p>
      </div>
    `;
    return;
  }

  selectedCardsGrid.innerHTML = selects.cards.map((select, index) => {
    const card = manifest.cards.find(c => c.id === select.cardId);
    if (!card) return '';

    const title = getCardTitle(card);
    const template = formatTemplateName(card.template);

    return `
      <div class="select-card" data-card-id="${select.cardId}" data-position="${select.position}">
        <span class="position-badge">${index + 1}</span>
        <button class="card-action-btn remove-btn" data-card-id="${select.cardId}" title="Remove from website">&times;</button>
        <img class="select-card-image" src="${card.path}" alt="${title}" loading="lazy">
        <div class="select-card-info">
          <div class="select-card-title">${title}</div>
          <div class="select-card-meta">${template}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderAvailableCards() {
  const selectedCardIds = new Set(selects.cards.map(c => c.cardId));

  // Get loved cards that aren't selected
  const lovedCards = manifest.cards.filter(card => {
    const fb = feedback[card.id];
    return fb?.rating === 'loved' && !selectedCardIds.has(card.id);
  });

  if (lovedCards.length === 0) {
    availableCardsGrid.innerHTML = `
      <div class="empty-state" id="available-empty">
        <p>No loved cards available</p>
        <p class="hint">Love cards from the <a href="/">gallery</a> to add them here</p>
      </div>
    `;
    return;
  }

  availableCardsGrid.innerHTML = lovedCards.map(card => {
    const title = getCardTitle(card);
    const template = formatTemplateName(card.template);

    return `
      <div class="select-card" data-card-id="${card.id}">
        <button class="card-action-btn add-btn" data-card-id="${card.id}" title="Add to website">+</button>
        <img class="select-card-image" src="${card.path}" alt="${title}" loading="lazy">
        <div class="select-card-info">
          <div class="select-card-title">${title}</div>
          <div class="select-card-meta">${template}</div>
        </div>
      </div>
    `;
  }).join('');
}

function getCardTitle(card) {
  if (card.mode === 'solo') {
    const charType = card.characterType === 'player' ? 'Player' : 'Figure';
    return formatCharacterName(card.characterId);
  } else {
    const pairing = pairingData[card.pairingId];
    return pairing ? `${pairing.playerName} & ${pairing.figureName}` : card.pairingId;
  }
}

function formatTemplateName(template) {
  return template.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatCharacterName(characterId) {
  if (!characterId) return 'Unknown';
  return characterId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function updateCounter() {
  selectCounter.textContent = `(${selects.cards.length}/25)`;
  exportBtn.disabled = selects.cards.length === 0;
}

function updateStats() {
  const lovedCount = Object.values(feedback).filter(f => f.rating === 'loved').length;
  statsEl.textContent = `${selects.cards.length} selected, ${lovedCount} loved`;
}

// Setup Sortable for drag-drop reordering
function setupSortable() {
  selectedSortable = new Sortable(selectedCardsGrid, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    filter: '.empty-state',
    onEnd: async function(evt) {
      // Get new order
      const cards = selectedCardsGrid.querySelectorAll('.select-card');
      const cardIds = Array.from(cards).map(c => c.dataset.cardId);

      // Update positions
      await reorderSelects(cardIds);
      renderSelectedCards();
    }
  });
}

// API Actions
async function addToSelects(cardId) {
  try {
    const res = await fetch(`${API_BASE}/api/selects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId })
    });
    const result = await res.json();

    if (result.success) {
      selects = result.selects;
      renderCards();
      updateStats();
    } else {
      alert(result.error || 'Failed to add card');
    }
  } catch (err) {
    console.error('Add to selects error:', err);
  }
}

async function removeFromSelects(cardId) {
  try {
    const res = await fetch(`${API_BASE}/api/selects/${encodeURIComponent(cardId)}`, {
      method: 'DELETE'
    });
    const result = await res.json();

    if (result.success) {
      selects = result.selects;
      renderCards();
      updateStats();
    } else {
      alert(result.error || 'Failed to remove card');
    }
  } catch (err) {
    console.error('Remove from selects error:', err);
  }
}

async function reorderSelects(cardIds) {
  try {
    const res = await fetch(`${API_BASE}/api/selects/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardIds })
    });
    const result = await res.json();

    if (result.success) {
      selects = result.selects;
    }
  } catch (err) {
    console.error('Reorder selects error:', err);
  }
}

async function exportToWebsite() {
  exportBtn.disabled = true;
  exportBtn.textContent = 'Exporting...';

  try {
    const res = await fetch(`${API_BASE}/api/selects/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await res.json();

    if (result.success) {
      showExportSuccess(result.cardCount);
    } else {
      alert(result.error || 'Export failed');
    }
  } catch (err) {
    console.error('Export error:', err);
    alert('Export failed: ' + err.message);
  }

  exportBtn.disabled = selects.cards.length === 0;
  exportBtn.textContent = 'Export to Website';
}

function showExportSuccess(cardCount) {
  const modal = document.getElementById('export-modal');
  const message = document.getElementById('export-message');
  message.textContent = `${cardCount} cards exported to web/js/data.js`;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Event Listeners
function setupEventListeners() {
  // Add button clicks
  availableCardsGrid.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-btn');
    if (addBtn) {
      e.stopPropagation();
      const cardId = addBtn.dataset.cardId;
      addToSelects(cardId);
    }
  });

  // Remove button clicks
  selectedCardsGrid.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.remove-btn');
    if (removeBtn) {
      e.stopPropagation();
      const cardId = removeBtn.dataset.cardId;
      removeFromSelects(cardId);
    }
  });

  // Export button
  exportBtn.addEventListener('click', exportToWebsite);

  // Modal close buttons
  document.getElementById('modal-close')?.addEventListener('click', () => {
    document.getElementById('preview-modal').classList.remove('active');
    document.body.style.overflow = '';
  });

  document.getElementById('export-modal-close')?.addEventListener('click', () => {
    document.getElementById('export-modal').classList.remove('active');
    document.body.style.overflow = '';
  });

  // Modal background clicks
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
      });
      document.body.style.overflow = '';
    }
  });
}

// Start
init();
