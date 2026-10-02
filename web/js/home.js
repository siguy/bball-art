// Court & Covenant - Homepage
// Builds the dealt fan, the jumbotron ticker, and the flip-card matchups
// from the same data.js the swipe deck uses.

import { curatedCards, pairings } from './data.js';

const FAN_SIZE = 7;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

// One representative card per pairing (the first one curated)
const matchups = [];
const seen = new Set();
for (const card of curatedCards) {
  if (seen.has(card.pairingId) || !pairings[card.pairingId]) continue;
  seen.add(card.pairingId);
  matchups.push({
    ...pairings[card.pairingId],
    id: card.pairingId,
    thumb: card.image.replace('cards/', 'cards/thumbs/'),
  });
}

const escapeHtml = (text = '') =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Short display names: "Michael Jordan" -> "Jordan", "King David" -> "David"
const lastName = (name) => name.replace(/^King /, '').split(' ').slice(-1)[0].replace(/'/g, '’');

// ---------- Hero fan ----------
function buildFan() {
  const fan = document.getElementById('fan');
  const hand = matchups.slice(0, FAN_SIZE);
  const mid = (hand.length - 1) / 2;

  fan.innerHTML = hand
    .map((m, i) => `
      <button class="fan-card${Math.abs(i - mid) > 2 ? ' fan-edge' : ''}" style="--i:${i}; --offset:${i - mid}" data-target="${m.id}"
              aria-label="${escapeHtml(`${m.player} and ${m.figure}`)}">
        <img src="${m.thumb}" alt="" decoding="async">
      </button>`)
    .join('');

  // Deal the hand once the first images have had a moment to load.
  // Reading offsetWidth commits the pre-deal position so the transition runs.
  void fan.offsetWidth;
  setTimeout(() => fan.classList.add('is-dealt'), reducedMotion ? 0 : 250);

  fan.addEventListener('click', (e) => {
    const card = e.target.closest('.fan-card');
    if (!card) return;
    const target = document.querySelector(`.flip[data-id="${card.dataset.target}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => target.classList.add('is-flipped'), reducedMotion ? 0 : 600);
  });
}

// ---------- Jumbotron ticker ----------
function buildTicker() {
  const hooks = matchups.map((m) => `<span>${escapeHtml(m.hook)}</span><i>✦</i>`).join('');
  const names = matchups
    .map((m) => `<span>${escapeHtml(lastName(m.player))} <b>×</b> ${escapeHtml(lastName(m.figure))}</span><i>●</i>`)
    .join('');
  // Content is doubled so the CSS loop (translate -50%) is seamless
  document.getElementById('tickerHooks').innerHTML = hooks + hooks;
  document.getElementById('tickerNames').innerHTML = names + names;
}

// ---------- Matchup flip cards ----------
function cardBack(m) {
  // Kept deliberately short: the full verse and details live in the collection view
  return `
    <div class="flip-back">
      <span class="back-type">${m.type === 'villain' ? 'Villain' : 'Hero'}</span>
      <h3>${escapeHtml(lastName(m.player))}<b>×</b>${escapeHtml(lastName(m.figure))}</h3>
      <p class="back-hook">${escapeHtml(m.hook)}</p>
      <dl class="back-facts">
        ${m.scripture ? `<div><dt>Verse</dt><dd>${escapeHtml(m.scripture.ref)}</dd></div>` : ''}
        ${m.receipt ? `<div><dt>Receipt</dt><dd>${escapeHtml(m.receipt)}</dd></div>` : ''}
      </dl>
      <a class="back-link" href="cards.html#${m.id}">Open the cards &rarr;</a>
    </div>`;
}

function buildTable() {
  const table = document.getElementById('table');
  table.innerHTML = matchups
    .map((m, i) => {
      // Deterministic "tossed on the table" scatter
      const tilt = ((i * 37) % 9) - 4;
      const drop = ((i * 53) % 5) * 6;
      return `
        <article class="flip" data-id="${m.id}" data-type="${m.type}" style="--tilt:${tilt}deg; --drop:${drop}px">
          <div class="flip-inner" tabindex="0" role="button"
               aria-label="${escapeHtml(`${m.player} and ${m.figure}. Flip for details`)}">
            <div class="flip-front">
              <img src="${m.thumb}" alt="${escapeHtml(`${m.player} and ${m.figure} card`)}" loading="lazy" decoding="async">
              <span class="foil" aria-hidden="true"></span>
            </div>
            ${cardBack(m)}
          </div>
        </article>`;
    })
    .join('');

  table.addEventListener('click', (e) => {
    if (e.target.closest('.back-link')) return; // let the link navigate
    const flip = e.target.closest('.flip');
    if (flip) flip.classList.toggle('is-flipped');
  });
  table.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('flip-inner')) {
      e.preventDefault();
      e.target.closest('.flip').classList.toggle('is-flipped');
    }
  });

  // Holo foil + tilt that follows the pointer (desktop only)
  if (finePointer && !reducedMotion) {
    table.addEventListener('pointermove', (e) => {
      const flip = e.target.closest('.flip');
      if (!flip) return;
      const r = flip.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      flip.style.setProperty('--mx', `${x * 100}%`);
      flip.style.setProperty('--my', `${y * 100}%`);
      flip.style.setProperty('--ry', `${(x - 0.5) * 16}deg`);
      flip.style.setProperty('--rx', `${(0.5 - y) * 16}deg`);
    });
    table.addEventListener('pointerout', (e) => {
      const flip = e.target.closest('.flip');
      if (flip && !flip.contains(e.relatedTarget)) {
        ['--mx', '--my', '--rx', '--ry'].forEach((p) => flip.style.removeProperty(p));
      }
    });
  }
}

// ---------- Hero / Villain filter ----------
function bindFilters() {
  const chips = document.querySelectorAll('.chip');
  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.toggle('is-active', c === chip));
      const filter = chip.dataset.filter;
      document.querySelectorAll('.flip').forEach((flip) => {
        flip.hidden = filter !== 'all' && flip.dataset.type !== filter;
      });
    })
  );
}

buildFan();
buildTicker();
buildTable();
bindFilters();
