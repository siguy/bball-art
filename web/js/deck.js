// Court & Covenant - Card Deck (Tinder-style swipe)

import { curatedCards, pairings } from './data.js';

class CardDeck {
  constructor() {
    this.cards = curatedCards;
    this.currentIndex = 0;

    // Touch/drag state
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.isDragging = false;
    this.isShowingInfo = false;

    // DOM elements
    this.stack = document.getElementById('cardStack');
    this.progress = document.getElementById('progress');
    this.progressDots = document.getElementById('progressDots');
    this.btnPrev = document.getElementById('btnPrev');
    this.btnNext = document.getElementById('btnNext');
    this.swipeHint = document.getElementById('swipeHint');

    // Info panel elements
    this.infoPanel = document.getElementById('infoPanel');
    this.panelBackdrop = document.getElementById('panelBackdrop');
    this.panelTitle = document.getElementById('panelTitle');
    this.panelTemplate = document.getElementById('panelTemplate');
    this.panelNarrative = document.getElementById('panelNarrative');
    this.panelConnection = document.getElementById('panelConnection');

    this.init();
  }

  init() {
    // Create progress dots
    this.createProgressDots();

    // Render initial card
    this.renderCard();
    this.updateProgress();

    // Button controls
    this.btnPrev.addEventListener('click', () => this.prev());
    this.btnNext.addEventListener('click', () => this.next());

    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Panel backdrop click
    this.panelBackdrop.addEventListener('click', () => this.hideInfoPanel());

    // Hide swipe hint after first interaction
    this.hasInteracted = false;
  }

  createProgressDots() {
    this.progressDots.innerHTML = this.cards
      .map((_, i) => `<div class="progress-dot ${i === 0 ? 'active' : ''}"></div>`)
      .join('');
  }

  renderCard() {
    const card = this.cards[this.currentIndex];
    const pairing = pairings[card.pairingId];

    // Create card element
    const cardEl = document.createElement('div');
    cardEl.className = 'card entering';
    cardEl.style.backgroundImage = `url('${card.image}')`;

    // Info overlay
    cardEl.innerHTML = `
      <div class="card-info">
        <h2>${card.player} & ${card.figure}</h2>
        <p class="connection">"${card.narrative}"</p>
      </div>
    `;

    // Clear stack and add new card
    this.stack.innerHTML = '';
    this.stack.appendChild(cardEl);

    // Bind touch events
    this.bindTouchEvents(cardEl);

    // Remove entering class after animation
    setTimeout(() => cardEl.classList.remove('entering'), 300);
  }

  bindTouchEvents(cardEl) {
    // Touch events
    cardEl.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
    cardEl.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    cardEl.addEventListener('touchend', (e) => this.onTouchEnd(e));

    // Mouse events (for desktop)
    cardEl.addEventListener('mousedown', (e) => this.onMouseDown(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));

    // Click/tap for info
    cardEl.addEventListener('click', (e) => this.onCardTap(e));
  }

  onTouchStart(e) {
    this.startX = e.touches[0].clientX;
    this.startY = e.touches[0].clientY;
    this.isDragging = true;
    this.getCurrentCard()?.classList.add('dragging');
    this.hideSwipeHint();
  }

  onTouchMove(e) {
    if (!this.isDragging) return;

    this.currentX = e.touches[0].clientX - this.startX;
    const currentY = e.touches[0].clientY - this.startY;

    // If vertical swipe is dominant, let it scroll
    if (Math.abs(currentY) > Math.abs(this.currentX) && Math.abs(currentY) > 10) {
      // Check for upward swipe to show panel
      if (currentY < -50 && !this.isShowingInfo) {
        this.showInfoPanel();
        this.isDragging = false;
        this.resetPosition();
        return;
      }
      return;
    }

    // Prevent page scroll during horizontal swipe
    if (Math.abs(this.currentX) > 10) {
      e.preventDefault();
    }

    const rotation = this.currentX * 0.05; // Subtle tilt
    const card = this.getCurrentCard();
    if (card) {
      card.style.transform = `translateX(${this.currentX}px) rotate(${rotation}deg)`;
    }
  }

  onTouchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;

    const card = this.getCurrentCard();
    card?.classList.remove('dragging');

    const threshold = window.innerWidth * 0.25;

    if (this.currentX > threshold) {
      this.animateExit('right', () => this.prev());
    } else if (this.currentX < -threshold) {
      this.animateExit('left', () => this.next());
    } else {
      this.resetPosition();
    }

    this.currentX = 0;
  }

  // Mouse events for desktop
  onMouseDown(e) {
    this.startX = e.clientX;
    this.isDragging = true;
    this.getCurrentCard()?.classList.add('dragging');
    this.hideSwipeHint();
  }

  onMouseMove(e) {
    if (!this.isDragging) return;

    this.currentX = e.clientX - this.startX;
    const rotation = this.currentX * 0.05;
    const card = this.getCurrentCard();
    if (card) {
      card.style.transform = `translateX(${this.currentX}px) rotate(${rotation}deg)`;
    }
  }

  onMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;

    const card = this.getCurrentCard();
    card?.classList.remove('dragging');

    const threshold = window.innerWidth * 0.25;

    if (this.currentX > threshold) {
      this.animateExit('right', () => this.prev());
    } else if (this.currentX < -threshold) {
      this.animateExit('left', () => this.next());
    } else {
      this.resetPosition();
    }

    this.currentX = 0;
  }

  onCardTap(e) {
    // Ignore if we were dragging
    if (Math.abs(this.currentX) > 10) return;

    // Show full info panel on tap
    this.showInfoPanel();
  }

  getCurrentCard() {
    return this.stack.querySelector('.card');
  }

  resetPosition() {
    const card = this.getCurrentCard();
    if (card) {
      card.style.transform = 'translateX(0) rotate(0)';
    }
  }

  animateExit(direction, callback) {
    const card = this.getCurrentCard();
    if (!card) return;

    card.classList.add(direction === 'left' ? 'exiting-left' : 'exiting-right');

    setTimeout(() => {
      callback();
    }, 350);
  }

  next() {
    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
      this.renderCard();
      this.updateProgress();
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderCard();
      this.updateProgress();
    }
  }

  updateProgress() {
    this.progress.textContent = `${this.currentIndex + 1} / ${this.cards.length}`;

    // Update dots
    const dots = this.progressDots.querySelectorAll('.progress-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === this.currentIndex);
    });

    // Update button states
    this.btnPrev.disabled = this.currentIndex === 0;
    this.btnNext.disabled = this.currentIndex === this.cards.length - 1;
  }

  handleKeyboard(e) {
    if (this.isShowingInfo) {
      if (e.key === 'Escape') {
        this.hideInfoPanel();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
        this.animateExit('right', () => this.prev());
        break;
      case 'ArrowRight':
        this.animateExit('left', () => this.next());
        break;
      case 'ArrowUp':
      case ' ':
        this.showInfoPanel();
        break;
      case 'Escape':
        // Close info panel if open
        if (this.isShowingInfo) {
          this.hideInfoPanel();
        }
        break;
    }
  }

  showInfoPanel() {
    const card = this.cards[this.currentIndex];
    const pairing = pairings[card.pairingId];

    this.panelTitle.textContent = `${card.player} & ${card.figure}`;
    this.panelTemplate.textContent = card.template;
    this.panelNarrative.textContent = `"${card.narrative}"`;
    this.panelConnection.textContent = card.connection;

    this.infoPanel.classList.add('visible');
    this.panelBackdrop.classList.add('visible');
    this.isShowingInfo = true;
  }

  hideInfoPanel() {
    this.infoPanel.classList.remove('visible');
    this.panelBackdrop.classList.remove('visible');
    this.isShowingInfo = false;
  }

  hideSwipeHint() {
    if (!this.hasInteracted) {
      this.hasInteracted = true;
      this.swipeHint.classList.add('hidden');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new CardDeck();
});
