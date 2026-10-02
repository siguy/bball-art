// Court & Covenant - The Collection
// A native scroll-snap track (smooth swiping on phones, no custom drag code),
// with a details sheet on phones and a details column + filmstrip on desktop.

import { curatedCards, pairings } from './data.js';

const cards = curatedCards;
const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const track = $('track');
const filmstrip = $('filmstrip');
const details = $('details');
let current = -1;
let ambientFront = $('ambientA');
let ambientBack = $('ambientB');

// "Version 2 of 3" for pairings with several cards
const versionOf = cards.map((card, i) => {
  const siblings = cards.filter((c) => c.pairingId === card.pairingId);
  return { n: siblings.indexOf(card) + 1, of: siblings.length, i };
});

const lastName = (name) => name.replace(/^King /, '').split(' ').slice(-1)[0];
const thumbOf = (card) => card.image.replace('cards/', 'cards/thumbs/');

// ---------- Build ----------
function build() {
  track.innerHTML = cards
    .map((card, i) => `
      <figure class="slide" data-index="${i}">
        <img src="${card.image}" alt="${card.player} and ${card.figure}, ${card.template} card"
             ${i < 2 ? '' : 'loading="lazy"'} decoding="async">
      </figure>`)
    .join('');

  filmstrip.innerHTML = cards
    .map((card, i) => `
      <button class="film" data-index="${i}" aria-label="Card ${i + 1}: ${card.player} and ${card.figure}">
        <img src="${thumbOf(card)}" alt="" loading="lazy" decoding="async">
      </button>`)
    .join('');

  $('total').textContent = String(cards.length).padStart(2, '0');
}

// ---------- Navigation ----------
function goTo(index, smooth = true) {
  const i = Math.max(0, Math.min(cards.length - 1, index));
  track.scrollTo({ left: i * track.clientWidth, behavior: smooth && !reducedMotion ? 'smooth' : 'auto' });
}

// Active card follows the scroll position (works for swipes, buttons and keys alike)
function onScroll() {
  const i = Math.round(track.scrollLeft / track.clientWidth);
  if (i !== current) show(i);
  if (track.scrollLeft > 20) $('swipeHint').classList.add('is-hidden');
}

function setText(id, text) {
  $(id).textContent = text || '';
}

function setRow(rowId, valueId, text) {
  setText(valueId, text);
  $(rowId).hidden = !text;
}

function show(i) {
  current = i;
  const card = cards[i];
  const p = pairings[card.pairingId] || {};
  const version = versionOf[i];

  // Counter, caption, filmstrip
  setText('count', String(i + 1).padStart(2, '0'));
  setText('capNames', `${lastName(card.player)} × ${lastName(card.figure)}`);
  setText('capHook', p.hook);
  filmstrip.querySelectorAll('.film').forEach((f, n) => f.classList.toggle('is-active', n === i));
  filmstrip.children[i]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
  $('btnPrev').disabled = i === 0;
  $('btnNext').disabled = i === cards.length - 1;

  // Details
  setText('dType', p.type === 'villain' ? 'Villain' : 'Hero');
  details.dataset.type = p.type || 'hero';
  setText('dTemplate', card.template);
  setText('dVersion', version.of > 1 ? `Version ${version.n} of ${version.of}` : '');
  $('dVersion').hidden = version.of < 2;
  setText('dPlayer', card.player);
  setText('dFigure', card.figure);
  setText('dHook', p.hook);
  setRow('rowParallel', 'dParallel', p.parallel);
  setRow('rowBond', 'dBond', p.bond);
  setRow('rowReceipt', 'dReceipt', p.receipt);
  $('rowVerse').hidden = !p.scripture;
  if (p.scripture) {
    setText('dRef', p.scripture.ref);
    setText('dHebrew', p.scripture.hebrew);
    setText('dEnglish', p.scripture.english);
  }
  details.scrollTop = 0;

  // Crossfade the ambient glow to this card's art
  ambientBack.style.backgroundImage = `url('${thumbOf(card)}')`;
  ambientBack.classList.add('is-visible');
  ambientFront.classList.remove('is-visible');
  [ambientFront, ambientBack] = [ambientBack, ambientFront];

  history.replaceState(null, '', `#${card.pairingId}`);
}

// ---------- Details sheet (phones) ----------
function openSheet() {
  document.body.classList.add('sheet-open');
  $('btnDetails').setAttribute('aria-expanded', 'true');
}

function closeSheet() {
  document.body.classList.remove('sheet-open');
  $('btnDetails').setAttribute('aria-expanded', 'false');
}

// ---------- Events ----------
function bind() {
  let ticking = false;
  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });

  $('btnPrev').addEventListener('click', () => goTo(current - 1));
  $('btnNext').addEventListener('click', () => goTo(current + 1));
  filmstrip.addEventListener('click', (e) => {
    const film = e.target.closest('.film');
    if (film) goTo(Number(film.dataset.index));
  });

  // Tapping the card opens details on phones
  track.addEventListener('click', (e) => {
    if (e.target.closest('.slide') && window.matchMedia('(max-width: 959px)').matches) openSheet();
  });
  $('btnDetails').addEventListener('click', openSheet);
  $('btnClose').addEventListener('click', closeSheet);
  $('backdrop').addEventListener('click', closeSheet);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goTo(current + 1);
    else if (e.key === 'ArrowLeft') goTo(current - 1);
    else if (e.key === 'Escape') closeSheet();
  });

  // Typing or following a #pairing link on an open page jumps to it
  window.addEventListener('hashchange', () => {
    const i = cards.findIndex((c) => c.pairingId === location.hash.slice(1));
    if (i >= 0 && cards[current]?.pairingId !== cards[i].pairingId) goTo(i);
  });

  // Keep the current card centered when the window resizes or rotates
  window.addEventListener('resize', () => goTo(current, false));
}

// ---------- Start ----------
build();
bind();

// Deep link from the homepage: cards.html#jordan-moses opens on that pairing
const linked = cards.findIndex((c) => c.pairingId === location.hash.slice(1));
const start = linked >= 0 ? linked : 0;
show(start);
requestAnimationFrame(() => goTo(start, false));
setTimeout(() => $('swipeHint').classList.add('is-hidden'), 3500);
