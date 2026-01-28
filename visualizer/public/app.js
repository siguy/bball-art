/**
 * Court & Covenant Card Visualizer
 * Frontend JavaScript
 */

const API_BASE = '';

// State
let manifest = { cards: [], pairings: [], templates: [], interactions: [] };
let feedback = {};
let pairingData = {};
let pairingsFull = {};
let filteredCards = [];
let currentCardIndex = 0;
let currentPlatformTab = 'instagram';
let captions = { instagram: '', twitter: '' };

// DOM Elements
const gallery = document.getElementById('gallery');
const stats = document.getElementById('stats');
const modal = document.getElementById('card-modal');
const filterPairing = document.getElementById('filter-pairing');
const filterTemplate = document.getElementById('filter-template');
const filterInteraction = document.getElementById('filter-interaction');
const filterFeedback = document.getElementById('filter-feedback');

// Initialize
async function init() {
  await Promise.all([
    fetchManifest(),
    fetchFeedback(),
    fetchPairings(),
    fetchPairingsFull()
  ]);

  populateFilters();

  // Check for URL parameters
  const params = new URLSearchParams(window.location.search);
  const pairingParam = params.get('pairing');
  const cardParam = params.get('card');

  // Apply pairing filter if specified
  if (pairingParam) {
    filterPairing.value = pairingParam;
  }

  renderGallery();
  setupEventListeners();

  // Open card modal if card parameter specified
  if (cardParam) {
    const cardIndex = filteredCards.findIndex(c => c.id === cardParam);
    if (cardIndex !== -1) {
      openModal(cardIndex);
    }
  }
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

async function fetchPairingsFull() {
  try {
    const res = await fetch(`${API_BASE}/api/pairings-full`);
    pairingsFull = await res.json();
  } catch (err) {
    console.error('Failed to fetch full pairings:', err);
  }
}

// Export Functions
function getSelectedDestinations() {
  const destinations = [];
  if (document.getElementById('export-website')?.checked) destinations.push('website');
  if (document.getElementById('export-instagram')?.checked) destinations.push('instagram');
  if (document.getElementById('export-twitter')?.checked) destinations.push('twitter');
  return destinations;
}

function updateExportUI() {
  const destinations = getSelectedDestinations();
  const hasSocial = destinations.includes('instagram') || destinations.includes('twitter');

  const captionEditor = document.getElementById('caption-editor');
  const addToQueueBtn = document.getElementById('add-to-queue-btn');
  const exportNowBtn = document.getElementById('export-now-btn');

  // Show caption editor if social platforms selected
  if (captionEditor) {
    captionEditor.classList.toggle('hidden', !hasSocial);
  }

  // Enable/disable buttons
  if (addToQueueBtn) addToQueueBtn.disabled = destinations.length === 0;
  if (exportNowBtn) exportNowBtn.disabled = destinations.length === 0;
}

async function generateCaption(templateId, platform) {
  const card = filteredCards[currentCardIndex];
  if (!card) return '';

  try {
    const res = await fetch(`${API_BASE}/api/caption/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId,
        platform,
        pairingId: card.pairingId
      })
    });
    const result = await res.json();
    return result.caption || '';
  } catch (err) {
    console.error('Failed to generate caption:', err);
    return '';
  }
}

async function handleGenerateCaption() {
  const templateSelect = document.getElementById('caption-template');
  const templateId = templateSelect?.value || 'standard';

  // Generate for both platforms
  const [instagramCaption, twitterCaption] = await Promise.all([
    generateCaption(templateId, 'instagram'),
    generateCaption(templateId, 'twitter')
  ]);

  captions.instagram = instagramCaption;
  captions.twitter = twitterCaption;

  // Update textareas
  document.getElementById('caption-instagram').value = instagramCaption;
  document.getElementById('caption-twitter').value = twitterCaption;

  updateCharCount();
}

async function handleTrimCard() {
  const card = filteredCards[currentCardIndex];
  if (!card) return;

  const trimBtn = document.getElementById('trim-card-btn');
  const trimStatus = document.getElementById('trim-status');

  // Extract the card path from the full URL path
  // card.path is like "/cards/solo-player-iverson/thunder-lightning-2026-01-28T16-19-48.jpeg"
  const cardPath = card.path;

  trimBtn.disabled = true;
  trimBtn.textContent = 'Blending...';
  trimStatus.textContent = '';

  try {
    const res = await fetch(`${API_BASE}/api/cards/trim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardPath })
    });

    const result = await res.json();

    if (result.success) {
      if (result.trimmed) {
        trimStatus.textContent = `✓ ${result.message}`;
        trimStatus.className = 'trim-status success';

        // Refresh the image by adding cache-busting timestamp
        const img = document.getElementById('modal-card-image');
        img.src = card.path + '?t=' + Date.now();

        // Also refresh the gallery thumbnail
        const galleryCard = gallery.querySelector(`[data-index="${currentCardIndex}"] img`);
        if (galleryCard) {
          galleryCard.src = card.path + '?t=' + Date.now();
        }
      } else {
        trimStatus.textContent = 'No border detected';
        trimStatus.className = 'trim-status';
      }
    } else {
      trimStatus.textContent = `Error: ${result.error}`;
      trimStatus.className = 'trim-status error';
    }
  } catch (err) {
    trimStatus.textContent = `Error: ${err.message}`;
    trimStatus.className = 'trim-status error';
  }

  trimBtn.disabled = false;
  trimBtn.textContent = 'Blend Border';
}

function updateCharCount() {
  const textarea = document.getElementById(`caption-${currentPlatformTab}`);
  const countEl = document.getElementById('char-count-value');
  const maxEl = document.getElementById('char-count-max');
  const container = document.querySelector('.char-count');

  if (!textarea || !countEl) return;

  const count = textarea.value.length;
  const max = currentPlatformTab === 'twitter' ? 280 : 2200;

  countEl.textContent = count;
  maxEl.textContent = max;

  if (container) {
    container.classList.toggle('over-limit', count > max);
  }
}

function switchCaptionTab(platform) {
  currentPlatformTab = platform;

  // Update tab active state
  document.querySelectorAll('.caption-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.platform === platform);
  });

  // Show/hide textareas
  document.getElementById('caption-instagram').classList.toggle('hidden', platform !== 'instagram');
  document.getElementById('caption-twitter').classList.toggle('hidden', platform !== 'twitter');

  updateCharCount();
}

async function addToQueue() {
  const card = filteredCards[currentCardIndex];
  if (!card) return;

  const destinations = getSelectedDestinations();
  if (destinations.length === 0) return;

  // Get current captions from textareas
  const captionData = {
    instagram: document.getElementById('caption-instagram')?.value || '',
    twitter: document.getElementById('caption-twitter')?.value || ''
  };

  try {
    const res = await fetch(`${API_BASE}/api/export/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: card.id,
        destinations,
        captions: captionData
      })
    });
    const result = await res.json();

    if (result.success) {
      const btn = document.getElementById('add-to-queue-btn');
      btn.textContent = 'Added!';
      setTimeout(() => { btn.textContent = 'Add to Queue'; }, 1500);
    }
  } catch (err) {
    console.error('Failed to add to queue:', err);
  }
}

async function exportNow() {
  const card = filteredCards[currentCardIndex];
  if (!card) return;

  const destinations = getSelectedDestinations();
  if (destinations.length === 0) return;

  const captionData = {
    instagram: document.getElementById('caption-instagram')?.value || '',
    twitter: document.getElementById('caption-twitter')?.value || ''
  };

  const btn = document.getElementById('export-now-btn');
  btn.textContent = 'Exporting...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/export/single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: card.id,
        destinations,
        captions: captionData
      })
    });
    const result = await res.json();

    if (result.success) {
      btn.textContent = 'Exported!';
      setTimeout(() => {
        btn.textContent = 'Export Now';
        btn.disabled = false;
      }, 2000);
    } else {
      btn.textContent = 'Export Failed';
      setTimeout(() => {
        btn.textContent = 'Export Now';
        btn.disabled = false;
      }, 2000);
    }
  } catch (err) {
    console.error('Export failed:', err);
    btn.textContent = 'Export Failed';
    setTimeout(() => {
      btn.textContent = 'Export Now';
      btn.disabled = false;
    }, 2000);
  }
}

async function saveFeedback(cardId, data) {
  try {
    const res = await fetch(`${API_BASE}/api/feedback/${encodeURIComponent(cardId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    feedback[cardId] = result.feedback;
    return true;
  } catch (err) {
    console.error('Failed to save feedback:', err);
    return false;
  }
}

// Filters
function populateFilters() {
  // Pairings
  filterPairing.innerHTML = '<option value="">All Pairings</option>';
  manifest.pairings.forEach(p => {
    const pairing = pairingData[p];
    const label = pairing ? `${pairing.playerName} & ${pairing.figureName}` : p;
    filterPairing.innerHTML += `<option value="${p}">${label}</option>`;
  });

  // Templates
  filterTemplate.innerHTML = '<option value="">All Templates</option>';
  manifest.templates.forEach(t => {
    filterTemplate.innerHTML += `<option value="${t}">${formatTemplateName(t)}</option>`;
  });

  // Interactions
  filterInteraction.innerHTML = '<option value="">All Interactions</option>';
  (manifest.interactions || []).forEach(i => {
    filterInteraction.innerHTML += `<option value="${i}">${formatInteractionName(i)}</option>`;
  });
}

function formatTemplateName(template) {
  return template.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatInteractionName(interaction) {
  if (!interaction) return 'N/A';
  return interaction.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatCharacterName(characterId) {
  if (!characterId) return 'Unknown';
  return characterId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function applyFilters() {
  const pairing = filterPairing.value;
  const template = filterTemplate.value;
  const interaction = filterInteraction.value;
  const feedbackFilter = filterFeedback.value;

  filteredCards = manifest.cards.filter(card => {
    if (pairing && card.pairingId !== pairing) return false;
    if (template && card.template !== template) return false;
    if (interaction && card.interaction !== interaction) return false;

    const cardFeedback = feedback[card.id];
    if (feedbackFilter === 'loved' && (!cardFeedback || cardFeedback.rating !== 'loved')) return false;
    if (feedbackFilter === 'liked' && (!cardFeedback || cardFeedback.rating !== 'liked')) return false;
    if (feedbackFilter === 'issues' && (!cardFeedback || cardFeedback.rating !== 'issues')) return false;
    if (feedbackFilter === 'none' && cardFeedback && cardFeedback.rating) return false;

    return true;
  });

  renderGallery();
}

// Gallery
function renderGallery() {
  if (filteredCards.length === 0) {
    filteredCards = manifest.cards;
  }

  stats.textContent = `${filteredCards.length} of ${manifest.totalCards} cards`;

  if (filteredCards.length === 0) {
    gallery.innerHTML = `
      <div class="empty-state">
        <h2>No cards found</h2>
        <p>Generate some cards or adjust your filters</p>
      </div>
    `;
    return;
  }

  gallery.innerHTML = filteredCards.map((card, index) => {
    const cardFeedback = feedback[card.id];
    const isLoved = cardFeedback?.rating === 'loved';
    const badgeClass = cardFeedback?.rating ? `card-badge ${cardFeedback.rating}` : '';
    const badgeText = cardFeedback?.rating ? (isLoved ? 'EXPORT' : cardFeedback.rating) : '';

    // Handle both pairing cards and solo cards
    let title;
    if (card.mode === 'solo') {
      // Solo card - use character info
      const charType = card.characterType === 'player' ? '🏀' : '📜';
      title = `${charType} ${formatCharacterName(card.characterId)} (Solo)`;
    } else {
      // Pairing card
      const pairing = pairingData[card.pairingId];
      title = pairing ? `${pairing.playerName} & ${pairing.figureName}` : card.pairingId;
    }

    return `
      <div class="card ${isLoved ? 'card-loved' : ''}" data-index="${index}">
        ${badgeText ? `<span class="${badgeClass}">${badgeText}</span>` : ''}
        <img class="card-image" src="${card.path}" alt="${title}" loading="lazy">
        <div class="card-info">
          <div class="card-title">${title}</div>
          <div class="card-meta">
            <span>${formatTemplateName(card.template)}</span>
            <span>${card.timestamp.split(' ')[0]}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Modal
function openModal(index) {
  currentCardIndex = index;
  const card = filteredCards[index];
  if (!card) return;

  // Handle both pairing cards and solo cards
  let title;
  let pairingLabel;
  let interactionLabel;

  if (card.mode === 'solo') {
    // Solo card
    const charType = card.characterType === 'player' ? 'Player' : 'Figure';
    title = `${formatCharacterName(card.characterId)} (Solo)`;
    pairingLabel = `Solo ${charType}: ${formatCharacterName(card.characterId)}`;
    interactionLabel = 'Solo Card';
  } else {
    // Pairing card
    const pairing = pairingData[card.pairingId];
    title = pairing ? `${pairing.playerName} & ${pairing.figureName}` : card.pairingId;
    pairingLabel = title;
    interactionLabel = formatInteractionName(card.interaction);
  }

  document.getElementById('modal-card-image').src = card.path;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('detail-pairing').textContent = pairingLabel;
  document.getElementById('detail-template').textContent = formatTemplateName(card.template);
  document.getElementById('detail-interaction').textContent = interactionLabel;
  document.getElementById('detail-timestamp').textContent = card.timestamp;
  document.getElementById('detail-prompt').textContent = card.prompt || 'No prompt saved';

  // Load feedback
  const cardFeedback = feedback[card.id] || {};
  document.getElementById('feedback-notes').value = cardFeedback.notes || '';

  // Update feedback buttons
  document.querySelectorAll('.feedback-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.rating === cardFeedback.rating) {
      btn.classList.add('active');
    }
  });

  // Reset export UI
  ['export-website', 'export-instagram', 'export-twitter'].forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) checkbox.checked = false;
  });
  document.getElementById('caption-instagram').value = '';
  document.getElementById('caption-twitter').value = '';
  captions = { instagram: '', twitter: '' };
  updateExportUI();

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function navigateCard(direction) {
  const newIndex = currentCardIndex + direction;
  if (newIndex >= 0 && newIndex < filteredCards.length) {
    openModal(newIndex);
  }
}

// Event Listeners
function setupEventListeners() {
  // Filter changes
  filterPairing.addEventListener('change', applyFilters);
  filterTemplate.addEventListener('change', applyFilters);
  filterInteraction.addEventListener('change', applyFilters);
  filterFeedback.addEventListener('change', applyFilters);

  // Refresh button
  document.getElementById('refresh-btn').addEventListener('click', async () => {
    await fetchManifest();
    await fetchFeedback();
    populateFilters();
    applyFilters();
  });

  // Export destination checkboxes
  ['export-website', 'export-instagram', 'export-twitter'].forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.addEventListener('change', updateExportUI);
    }
  });

  // Caption template generation
  const generateCaptionBtn = document.getElementById('generate-caption-btn');
  if (generateCaptionBtn) {
    generateCaptionBtn.addEventListener('click', handleGenerateCaption);
  }

  // Caption tab switching
  document.querySelectorAll('.caption-tab').forEach(tab => {
    tab.addEventListener('click', () => switchCaptionTab(tab.dataset.platform));
  });

  // Caption textarea char count
  ['caption-instagram', 'caption-twitter'].forEach(id => {
    const textarea = document.getElementById(id);
    if (textarea) {
      textarea.addEventListener('input', () => {
        captions[id.replace('caption-', '')] = textarea.value;
        updateCharCount();
      });
    }
  });

  // Export buttons
  const addToQueueBtn = document.getElementById('add-to-queue-btn');
  if (addToQueueBtn) {
    addToQueueBtn.addEventListener('click', addToQueue);
  }

  const exportNowBtn = document.getElementById('export-now-btn');
  if (exportNowBtn) {
    exportNowBtn.addEventListener('click', exportNow);
  }

  // Trim card button
  const trimCardBtn = document.getElementById('trim-card-btn');
  if (trimCardBtn) {
    trimCardBtn.addEventListener('click', handleTrimCard);
  }

  // Card clicks
  gallery.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card) {
      openModal(parseInt(card.dataset.index, 10));
    }
  });

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Modal navigation
  document.getElementById('prev-card').addEventListener('click', () => navigateCard(-1));
  document.getElementById('next-card').addEventListener('click', () => navigateCard(1));

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;

    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') navigateCard(-1);
    if (e.key === 'ArrowRight') navigateCard(1);
  });

  // Feedback buttons - auto-save on click
  document.querySelectorAll('.feedback-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.feedback-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      autoSaveFeedback();
    });
  });

  // Notes textarea - auto-save on blur and debounced typing
  let notesTimeout = null;
  const notesField = document.getElementById('feedback-notes');

  notesField.addEventListener('blur', () => {
    autoSaveFeedback();
  });

  notesField.addEventListener('input', () => {
    clearTimeout(notesTimeout);
    notesTimeout = setTimeout(() => {
      autoSaveFeedback();
    }, 1000); // Auto-save 1 second after typing stops
  });

  // Manual save button still works
  document.getElementById('save-feedback').addEventListener('click', async () => {
    await autoSaveFeedback();
  });
}

// Auto-save helper
async function autoSaveFeedback() {
  const card = filteredCards[currentCardIndex];
  if (!card) return;

  const activeBtn = document.querySelector('.feedback-btn.active');
  const rating = activeBtn?.dataset.rating || null;
  const notes = document.getElementById('feedback-notes').value;

  // Only save if there's something to save
  if (!rating && !notes) return;

  const saveBtn = document.getElementById('save-feedback');
  saveBtn.textContent = 'Saving...';

  const success = await saveFeedback(card.id, { rating, notes });
  if (success) {
    renderGallery();
    saveBtn.textContent = 'Auto-saved';
    setTimeout(() => { saveBtn.textContent = 'Save Feedback'; }, 1500);
  } else {
    saveBtn.textContent = 'Save Failed';
    setTimeout(() => { saveBtn.textContent = 'Save Feedback'; }, 2000);
  }
}

// Start
init();
