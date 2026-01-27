// Court & Covenant - Homepage JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Card preview rotation animation
  const preview = document.getElementById('cardPreview');
  if (!preview) return;

  const cards = preview.querySelectorAll('.preview-card');
  let currentIndex = 2; // Start with the top card

  // Auto-rotate preview cards every 4 seconds
  setInterval(() => {
    // Move current top card to back
    const topCard = cards[currentIndex];
    topCard.style.zIndex = 1;
    topCard.style.transform = 'rotate(-6deg) translateX(-10px)';

    // Rotate indices
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;

    // Update z-indices and transforms
    cards.forEach((card, i) => {
      const offset = (i - currentIndex + cards.length) % cards.length;
      if (offset === 0) {
        // New top card
        card.style.zIndex = 3;
        card.style.transform = 'rotate(0deg)';
        card.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5), 0 0 30px rgba(212,175,55,0.3)';
      } else if (offset === 1) {
        card.style.zIndex = 2;
        card.style.transform = 'rotate(3deg) translateX(10px)';
        card.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
      } else {
        card.style.zIndex = 1;
        card.style.transform = 'rotate(-6deg) translateX(-10px)';
        card.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
      }
    });
  }, 4000);
});
