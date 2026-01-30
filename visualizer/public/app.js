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
let selects = { cards: [] };
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
    fetchPairingsFull(),
    fetchSelects()
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

async function fetchSelects() {
  try {
    const res = await fetch(`${API_BASE}/api/selects`);
    selects = await res.json();
  } catch (err) {
    console.error('Failed to fetch selects:', err);
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

  // Show undo button if blend was successful
  if (trimStatus.classList.contains('success')) {
    const undoBtn = document.getElementById('undo-trim-btn');
    if (undoBtn) undoBtn.style.display = '';
  }
}

async function checkTrimUndoAvailable(cardPath) {
  const undoBtn = document.getElementById('undo-trim-btn');
  if (!undoBtn) return;

  try {
    const res = await fetch(`${API_BASE}/api/cards/trim/status?cardPath=${encodeURIComponent(cardPath)}`);
    const result = await res.json();
    undoBtn.style.display = result.hasBackup ? '' : 'none';
  } catch {
    undoBtn.style.display = 'none';
  }
}

async function handleUndoTrim() {
  const card = filteredCards[currentCardIndex];
  if (!card) return;

  const undoBtn = document.getElementById('undo-trim-btn');
  const trimStatus = document.getElementById('trim-status');

  undoBtn.disabled = true;
  undoBtn.textContent = 'Restoring...';
  trimStatus.textContent = '';

  try {
    const res = await fetch(`${API_BASE}/api/cards/trim/undo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardPath: card.path })
    });

    const result = await res.json();

    if (result.success) {
      trimStatus.textContent = 'Original restored';
      trimStatus.className = 'trim-status success';

      // Refresh images with cache-bust
      const img = document.getElementById('modal-card-image');
      img.src = card.path + '?t=' + Date.now();

      const galleryCard = gallery.querySelector(`[data-index="${currentCardIndex}"] img`);
      if (galleryCard) {
        galleryCard.src = card.path + '?t=' + Date.now();
      }

      undoBtn.style.display = 'none';
    } else {
      trimStatus.textContent = `Error: ${result.error}`;
      trimStatus.className = 'trim-status error';
    }
  } catch (err) {
    trimStatus.textContent = `Error: ${err.message}`;
    trimStatus.className = 'trim-status error';
  }

  undoBtn.disabled = false;
  undoBtn.textContent = 'Undo Blend';
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
    const hasIssues = cardFeedback?.rating === 'issues';
    const isLiked = cardFeedback?.rating === 'liked';

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

    // Heart button for quick-love
    const heartClass = isLoved ? 'heart-btn loved' : 'heart-btn';
    const heartIcon = isLoved ? '♥' : '♡';

    // Check if card is selected for website
    const isWebSelected = selects.cards.some(c => c.cardId === card.id);

    // Small badge for liked/issues (non-loved ratings)
    let smallBadge = '';
    if (isLiked) {
      smallBadge = '<span class="card-badge liked">LIKED</span>';
    } else if (hasIssues) {
      smallBadge = '<span class="card-badge issues">ISSUES</span>';
    }

    // Web selected badge (bottom right)
    const webBadge = isWebSelected ? '<span class="card-badge web-selected">WEB</span>' : '';

    return `
      <div class="card ${isLoved ? 'card-loved' : ''}" data-index="${index}" data-card-id="${card.id}">
        <button class="${heartClass}" data-card-id="${card.id}" title="${isLoved ? 'Remove from loved' : 'Love this card'}">${heartIcon}</button>
        ${smallBadge}
        ${webBadge}
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
async function openModal(index) {
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
  document.getElementById('detail-filename').textContent = card.filename || '';
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

  // Reset trim status and check for undo availability
  const trimStatus = document.getElementById('trim-status');
  if (trimStatus) {
    trimStatus.textContent = '';
    trimStatus.className = 'trim-status';
  }
  checkTrimUndoAvailable(card.path);

  // Reset export UI
  ['export-website', 'export-instagram', 'export-twitter'].forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) checkbox.checked = false;
  });
  document.getElementById('caption-instagram').value = '';
  document.getElementById('caption-twitter').value = '';
  captions = { instagram: '', twitter: '' };
  updateExportUI();

  // Fetch and render rich context
  await fetchAndRenderCardContext(card);

  // Update website selection button
  updateWebsiteSelectionUI(card.id);

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Update the website selection button state
 */
function updateWebsiteSelectionUI(cardId) {
  const btn = document.getElementById('add-to-website-btn');
  const hint = document.getElementById('web-selection-hint');
  if (!btn) return;

  const isSelected = selects.cards.some(c => c.cardId === cardId);
  const selectItem = selects.cards.find(c => c.cardId === cardId);

  if (isSelected) {
    btn.classList.add('selected');
    btn.innerHTML = '<span class="icon">&#10003;</span><span class="text">On Website</span>';
    hint.textContent = `Position: #${selectItem.position}`;
  } else {
    btn.classList.remove('selected');
    btn.innerHTML = '<span class="icon">&#128279;</span><span class="text">Add to Website</span>';
    hint.textContent = selects.cards.length >= 25 ? 'Maximum 25 cards reached' : '';
  }

  btn.disabled = !isSelected && selects.cards.length >= 25;
}

/**
 * Toggle website selection for current card
 */
async function toggleWebsiteSelection() {
  const card = filteredCards[currentCardIndex];
  if (!card) return;

  const isSelected = selects.cards.some(c => c.cardId === card.id);

  try {
    if (isSelected) {
      // Remove from selects
      const res = await fetch(`${API_BASE}/api/selects/${encodeURIComponent(card.id)}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        selects = result.selects;
      }
    } else {
      // Add to selects
      const res = await fetch(`${API_BASE}/api/selects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id })
      });
      const result = await res.json();
      if (result.success) {
        selects = result.selects;
      } else if (result.error) {
        alert(result.error);
        return;
      }
    }

    updateWebsiteSelectionUI(card.id);
    renderGallery(); // Update gallery to show selection indicator
  } catch (err) {
    console.error('Toggle website selection error:', err);
  }
}

/**
 * Fetch enriched context for a card and render it
 */
async function fetchAndRenderCardContext(card) {
  // Reset all context sections to default/empty state
  resetContextSections();

  try {
    const res = await fetch(`${API_BASE}/api/cards/${encodeURIComponent(card.id)}/context`);
    if (!res.ok) {
      console.warn('Failed to fetch card context:', res.status);
      return;
    }

    const context = await res.json();
    renderCardContext(context, card);
  } catch (err) {
    console.error('Error fetching card context:', err);
  }
}

/**
 * Reset all context sections to empty/default state
 */
function resetContextSections() {
  // Narrative
  document.getElementById('modal-narrative').textContent = '';

  // Badges
  document.getElementById('badge-era').textContent = '';
  document.getElementById('badge-type').textContent = '';
  document.getElementById('badge-type').className = 'badge type';

  // Connection section
  document.getElementById('connection-thematic').textContent = '';
  document.querySelector('#player-archetype .archetype-value').textContent = '';
  document.querySelector('#figure-archetype .archetype-value').textContent = '';

  // Rivalry section
  document.getElementById('section-rivalry').hidden = true;
  document.getElementById('rivalry-relationship').textContent = '';

  // Poses section
  document.getElementById('player-pose-name').textContent = 'Unknown Pose';
  document.getElementById('player-pose-description').textContent = '';
  document.getElementById('player-pose-expression').textContent = '';
  document.getElementById('player-pose-energy').textContent = '';
  document.getElementById('figure-pose-name').textContent = 'Unknown Pose';
  document.getElementById('figure-pose-description').textContent = '';
  document.getElementById('figure-pose-expression').textContent = '';
  document.getElementById('figure-pose-energy').textContent = '';

  // Scripture section
  document.getElementById('section-scripture').hidden = true;
  document.getElementById('quote-english').textContent = '';
  document.getElementById('quote-hebrew').textContent = '';
  document.getElementById('quote-source').textContent = '';
  document.getElementById('quote-context').textContent = '';
  document.getElementById('quote-mood').textContent = '';

  // Sources section is now part of the scripture section, reset handled there
}

/**
 * Render the card context data into the modal
 */
function renderCardContext(context, card) {
  // Narrative
  if (context.pairing?.connection?.narrative) {
    document.getElementById('modal-narrative').textContent = context.pairing.connection.narrative;
  }

  // Badges
  const fullPairing = pairingsFull[card.pairingId];
  if (context.player?.era) {
    document.getElementById('badge-era').textContent = context.player.era;
  }
  if (context.pairing?.type) {
    const typeEl = document.getElementById('badge-type');
    typeEl.textContent = context.pairing.type;
    typeEl.className = `badge type ${context.pairing.type}`;
  }
  document.getElementById('badge-template').textContent = formatTemplateName(card.template);
  document.getElementById('badge-interaction').textContent = formatInteractionName(card.interaction);

  // Connection section
  if (context.pairing?.connection?.thematic) {
    document.getElementById('connection-thematic').textContent = context.pairing.connection.thematic;
  } else if (context.pairing?.connection?.relationship) {
    // For rivalries, show the relationship as thematic
    document.getElementById('connection-thematic').textContent = context.pairing.connection.relationship || context.pairing.connection;
  } else if (typeof context.pairing?.connection === 'string') {
    document.getElementById('connection-thematic').textContent = context.pairing.connection;
  }

  if (context.player?.archetype) {
    document.querySelector('#player-archetype .archetype-value').textContent = context.player.archetype;
  }
  if (context.figure?.archetype) {
    document.querySelector('#figure-archetype .archetype-value').textContent = context.figure.archetype;
  }

  // Rivalry section (only for rivalry pairings)
  if (context.rivalry) {
    document.getElementById('section-rivalry').hidden = false;
    if (context.rivalry.relationship) {
      document.getElementById('rivalry-relationship').textContent = context.rivalry.relationship;
    }
  }

  // For rivalry cards with scripture references, show them in the scripture section
  if (context.rivalry?.scriptureReferences && context.rivalry.scriptureReferences.length > 0 && !context.quote) {
    // Use the first relevant scripture reference as the quote
    const ref = context.rivalry.scriptureReferences[0];
    document.getElementById('section-scripture').hidden = false;
    document.getElementById('quote-english').textContent = ref.english || '';
    document.getElementById('quote-hebrew').textContent = ref.hebrew || '';
    document.getElementById('quote-source').textContent = ref.source || '';
    document.getElementById('quote-context').textContent = ref.context || '';
    document.getElementById('quote-mood').textContent = ref.mood || '';
  }

  // Poses section
  if (context.poses?.player) {
    const p = context.poses.player;
    document.getElementById('player-pose-name').textContent = p.name || 'Unknown Pose';
    document.getElementById('player-pose-description').textContent = p.description || '';
    document.getElementById('player-pose-expression').textContent = p.expression || '';
    document.getElementById('player-pose-energy').textContent = p.energy || '';
  }
  if (context.poses?.figure) {
    const f = context.poses.figure;
    document.getElementById('figure-pose-name').textContent = f.name || 'Unknown Pose';
    document.getElementById('figure-pose-description').textContent = f.description || '';
    document.getElementById('figure-pose-expression').textContent = f.expression || '';
    document.getElementById('figure-pose-energy').textContent = f.energy || '';
  }

  // Scripture section
  if (context.quote) {
    document.getElementById('section-scripture').hidden = false;
    document.getElementById('quote-english').textContent = context.quote.english || '';
    document.getElementById('quote-hebrew').textContent = context.quote.hebrew || '';
    document.getElementById('quote-source').textContent = context.quote.source || '';
    document.getElementById('quote-context').textContent = context.quote.context || '';
    document.getElementById('quote-mood').textContent = context.quote.mood || '';
  }

  // For solo cards, adjust labels
  if (card.mode === 'solo') {
    // Hide connection section for solo cards
    document.getElementById('section-connection').hidden = true;

    // Adjust pose cards - only show one
    if (card.characterType === 'player') {
      document.getElementById('figure-pose-card').hidden = true;
      document.getElementById('player-pose-card').hidden = false;
    } else {
      document.getElementById('player-pose-card').hidden = true;
      document.getElementById('figure-pose-card').hidden = false;
    }
  } else {
    document.getElementById('section-connection').hidden = false;
    document.getElementById('player-pose-card').hidden = false;
    document.getElementById('figure-pose-card').hidden = false;
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

async function navigateCard(direction) {
  const newIndex = currentCardIndex + direction;
  if (newIndex >= 0 && newIndex < filteredCards.length) {
    await openModal(newIndex);
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

  // Undo trim button
  const undoTrimBtn = document.getElementById('undo-trim-btn');
  if (undoTrimBtn) {
    undoTrimBtn.addEventListener('click', handleUndoTrim);
  }

  // Website selection button
  const addToWebsiteBtn = document.getElementById('add-to-website-btn');
  if (addToWebsiteBtn) {
    addToWebsiteBtn.addEventListener('click', toggleWebsiteSelection);
  }

  // Heart button clicks (quick-love)
  gallery.addEventListener('click', async (e) => {
    const heartBtn = e.target.closest('.heart-btn');
    if (heartBtn) {
      e.stopPropagation(); // Don't open modal
      const cardId = heartBtn.dataset.cardId;
      const isLoved = heartBtn.classList.contains('loved');

      // Toggle love status
      if (isLoved) {
        // Remove love - set rating to null
        await saveFeedback(cardId, { rating: null, notes: feedback[cardId]?.notes || '' });
      } else {
        // Add love
        await saveFeedback(cardId, { rating: 'loved', notes: feedback[cardId]?.notes || '' });
      }

      renderGallery();
      return;
    }

    // Card clicks (open modal)
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

// ========================================
// FEEDBACK EXPORT & ANALYSIS
// ========================================

const analysisModal = document.getElementById('analysis-modal');
const downloadModal = document.getElementById('download-modal');

/**
 * Open the download modal
 */
function openDownloadModal() {
  downloadModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Close the download modal
 */
function closeDownloadModal() {
  downloadModal.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * Download feedback with selected options
 */
async function doDownload() {
  const rating = document.getElementById('download-rating').value;
  const format = document.getElementById('download-format').value;

  let url;
  let filename;

  if (format === 'json-raw') {
    url = `/api/feedback/export${rating ? `?rating=${rating}` : ''}`;
    filename = `feedback-raw-${rating || 'all'}.json`;
  } else if (format === 'csv') {
    url = `/api/feedback/export/enriched?format=csv${rating ? `&rating=${rating}` : ''}`;
    filename = `feedback-enriched-${rating || 'all'}.csv`;
  } else {
    // json-enriched (default)
    url = `/api/feedback/export/enriched?format=json${rating ? `&rating=${rating}` : ''}`;
    filename = `feedback-enriched-${rating || 'all'}.json`;
  }

  try {
    const res = await fetch(url);
    const blob = await res.blob();

    // Create download link
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    closeDownloadModal();
  } catch (err) {
    console.error('Download failed:', err);
    alert('Download failed: ' + err.message);
  }
}

/**
 * Open the analysis modal and load data
 */
async function openAnalysisModal() {
  analysisModal.classList.add('active');
  document.body.style.overflow = 'hidden';

  const content = document.getElementById('analysis-content');
  content.innerHTML = '<div class="analysis-loading">Loading analysis...</div>';

  try {
    const res = await fetch('/api/feedback/analysis');
    const analysis = await res.json();
    renderAnalysis(analysis, content);
  } catch (err) {
    content.innerHTML = `<div class="analysis-error">Failed to load analysis: ${err.message}</div>`;
  }
}

/**
 * Close the analysis modal
 */
function closeAnalysisModal() {
  analysisModal.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * Render analysis data in the modal
 */
function renderAnalysis(analysis, container) {
  const scoreToPercent = (score) => Math.round(score * 100);
  const scoreClass = (score) => {
    if (score >= 0.8) return 'score-high';
    if (score >= 0.5) return 'score-medium';
    return 'score-low';
  };

  let html = `
    <div class="analysis-summary">
      <h3>Summary</h3>
      <div class="summary-stats">
        <div class="stat">
          <span class="stat-value">${analysis.totalCards}</span>
          <span class="stat-label">Total Cards</span>
        </div>
        <div class="stat loved">
          <span class="stat-value">${analysis.summary.loved}</span>
          <span class="stat-label">Loved</span>
        </div>
        <div class="stat liked">
          <span class="stat-value">${analysis.summary.liked}</span>
          <span class="stat-label">Liked</span>
        </div>
        <div class="stat issues">
          <span class="stat-value">${analysis.summary.issues}</span>
          <span class="stat-label">Has Issues</span>
        </div>
      </div>
    </div>

    <div class="analysis-section">
      <h3>Top Performing Templates</h3>
      <div class="performance-list">
        ${analysis.topTemplates.map(t => `
          <div class="performance-item">
            <span class="perf-name">${formatTemplateName(t.name)}</span>
            <span class="perf-score ${scoreClass(t.score)}">${scoreToPercent(t.score)}%</span>
            <span class="perf-counts">
              <span class="count loved">${t.loved}L</span>
              <span class="count liked">${t.liked}l</span>
              <span class="count issues">${t.issues}i</span>
              <span class="count total">${t.total} total</span>
            </span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="analysis-section">
      <h3>Top Performing Pairings</h3>
      <div class="performance-list">
        ${analysis.topPairings.map(p => {
          const pairing = pairingData[p.name];
          const label = pairing ? `${pairing.playerName} & ${pairing.figureName}` : p.name;
          return `
            <div class="performance-item">
              <span class="perf-name">${label}</span>
              <span class="perf-score ${scoreClass(p.score)}">${scoreToPercent(p.score)}%</span>
              <span class="perf-counts">
                <span class="count loved">${p.loved}L</span>
                <span class="count liked">${p.liked}l</span>
                <span class="count issues">${p.issues}i</span>
                <span class="count total">${p.total} total</span>
              </span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    ${analysis.problemCombinations.length > 0 ? `
      <div class="analysis-section">
        <h3>Problem Combinations</h3>
        <div class="problem-list">
          ${analysis.problemCombinations.slice(0, 5).map(p => {
            const pairing = pairingData[p.pairingId];
            const label = pairing ? `${pairing.playerName} & ${pairing.figureName}` : p.pairingId;
            return `
              <div class="problem-item">
                <span class="problem-pairing">${label}</span>
                <span class="problem-template">${formatTemplateName(p.template)}</span>
                <span class="problem-count">${p.issues} issue${p.issues > 1 ? 's' : ''}</span>
                ${p.notes.length > 0 ? `
                  <div class="problem-notes">
                    ${p.notes.slice(0, 2).map(n => `<div class="note">"${n}"</div>`).join('')}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <div class="analysis-actions">
      <button id="regenerate-hints-btn" class="btn btn-primary">Regenerate Hints</button>
    </div>
  `;

  container.innerHTML = html;

  // Add event listener for regenerate hints button
  document.getElementById('regenerate-hints-btn').addEventListener('click', regenerateHints);
}

/**
 * Regenerate generation hints
 */
async function regenerateHints() {
  const btn = document.getElementById('regenerate-hints-btn');
  btn.textContent = 'Regenerating...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/generation-hints/regenerate', { method: 'POST' });
    const result = await res.json();

    if (result.success) {
      btn.textContent = 'Hints Updated!';
      setTimeout(() => {
        btn.textContent = 'Regenerate Hints';
        btn.disabled = false;
      }, 2000);
    } else {
      btn.textContent = 'Failed';
      setTimeout(() => {
        btn.textContent = 'Regenerate Hints';
        btn.disabled = false;
      }, 2000);
    }
  } catch (err) {
    console.error('Regenerate hints failed:', err);
    btn.textContent = 'Failed';
    setTimeout(() => {
      btn.textContent = 'Regenerate Hints';
      btn.disabled = false;
    }, 2000);
  }
}

// Setup export/analysis event listeners
function setupExportListeners() {
  // Download button
  const downloadBtn = document.getElementById('download-feedback-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', openDownloadModal);
  }

  // Download modal close
  const downloadCloseBtn = document.getElementById('download-modal-close');
  if (downloadCloseBtn) {
    downloadCloseBtn.addEventListener('click', closeDownloadModal);
  }

  // Download modal background click
  if (downloadModal) {
    downloadModal.addEventListener('click', (e) => {
      if (e.target === downloadModal) closeDownloadModal();
    });
  }

  // Do download button
  const doDownloadBtn = document.getElementById('do-download-btn');
  if (doDownloadBtn) {
    doDownloadBtn.addEventListener('click', doDownload);
  }

  // Analysis button
  const analysisBtn = document.getElementById('view-analysis-btn');
  if (analysisBtn) {
    analysisBtn.addEventListener('click', openAnalysisModal);
  }

  // Analysis modal close
  const analysisCloseBtn = document.getElementById('analysis-modal-close');
  if (analysisCloseBtn) {
    analysisCloseBtn.addEventListener('click', closeAnalysisModal);
  }

  // Analysis modal background click
  if (analysisModal) {
    analysisModal.addEventListener('click', (e) => {
      if (e.target === analysisModal) closeAnalysisModal();
    });
  }
}

// Start
init();
setupExportListeners();
