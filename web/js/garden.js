// Court & Covenant - The Garden Edition (New York's 2026 champions)
// Builds the hero fan, ticker, and the five "fusion" panels with Easter-egg pins.
//
// Text comes from the pairing files in data/series/court-covenant/pairings/
// (*-joshua, *-eleazar, *-shamgar, *-caleb, *-joseph). Verses are from the
// local Sefaria export (JPS 1917). Pin positions are percentages of the card image.

const STARTERS = [
  {
    id: 'brunson',
    number: '11',
    position: 'Point Guard',
    player: 'Jalen Brunson',
    last: 'Brunson',
    figure: 'Joshua',
    hebrewName: 'יְהוֹשֻׁעַ',
    accent: '#d8343f',
    image: 'cards/garden/brunson-joshua.jpeg',
    hook: 'Moses led the wilderness years but never crossed. Joshua finished the journey. After 53 years, Brunson led New York across.',
    move: 'Left-handed floater',
    verse: {
      ref: 'Joshua 1:9',
      hebrew: 'הֲלוֹא צִוִּיתִיךָ חֲזַק וֶאֱמָץ אַל־תַּעֲרֹץ וְאַל־תֵּחָת כִּי עִמְּךָ יְהוָה אֱלֹהֶיךָ בְּכֹל אֲשֶׁר תֵּלֵךְ׃',
      english: 'Have not I commanded thee? Be strong and of good courage; be not affrighted, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.',
    },
    receipt: '2026 Finals MVP. 45 points in the clinching Game 5.',
    eggs: [
      { x: 7, y: 47, title: 'Seven ram’s horns', text: 'Seven priests blew seven shofars around Jericho. Here the psychedelic rings are their sound waves.' },
      { x: 26, y: 41, title: 'The scarlet cord', text: 'Rahab hung a scarlet cord from her window in the wall. Her house was the one that stood (Joshua 2:18).' },
      { x: 70, y: 30, title: 'Sun and moon stand still', text: '“So the sun stood still, and the moon stayed” (Joshua 10:13). Joshua stopped the clock to finish the fight. So does Brunson.' },
      { x: 50, y: 79, title: 'Twelve stones', text: 'Twelve stones were carried out of the Jordan as a memorial of the crossing (Joshua 4).' },
      { x: 9, y: 86, title: 'The river stands up', text: 'The Jordan’s waters stopped and stood in a heap so the people could cross on dry ground.' },
    ],
  },
  {
    id: 'bridges',
    number: '25',
    position: 'Shooting Guard',
    player: 'Mikal Bridges',
    last: 'Bridges',
    figure: 'Eleazar',
    hebrewName: 'אֶלְעָזָר',
    accent: '#2fb7c9',
    image: 'cards/garden/bridges-eleazar.jpeg',
    hook: 'The priests stood in the middle of the river and didn’t move until everyone had crossed. Bridges has never missed a game.',
    move: 'Smooth pull-up',
    verse: {
      ref: 'Joshua 3:17',
      hebrew: 'וַיַּעַמְדוּ הַכֹּהֲנִים נֹשְׂאֵי הָאָרוֹן בְּרִית־יְהוָה בֶּחָרָבָה בְּתוֹךְ הַיַּרְדֵּן הָכֵן וְכָל־יִשְׂרָאֵל עֹבְרִים בֶּחָרָבָה עַד אֲשֶׁר־תַּמּוּ כָּל־הַגּוֹי לַעֲבֹר אֶת־הַיַּרְדֵּן׃',
      english: 'And the priests that bore the ark of the covenant of the LORD stood firm on dry ground in the midst of the Jordan, while all Israel passed over on dry ground, until all the nation were passed clean over the Jordan.',
    },
    receipt: 'Has never missed a game. Acquired for five first-round picks.',
    eggs: [
      { x: 50, y: 37, title: 'Breastplate of twelve stones', text: 'The high priest wore twelve gems, one for each tribe of Israel (Exodus 28).' },
      { x: 50, y: 57, title: 'Bells and pomegranates', text: 'Golden bells alternating with pomegranates on the hem of the priest’s robe (Exodus 28:33).' },
      { x: 32, y: 73, title: 'The Ark of the Covenant', text: 'The priests carried the Ark into the Jordan, and the river stopped.' },
      { x: 13, y: 26, title: 'A bridge', text: 'The rings arch over him like a bridge. We couldn’t help it.' },
      { x: 74, y: 87, title: 'Five gold coins', text: 'Five first-round picks. Worth it.' },
      { x: 3.5, y: 52, title: 'Unbroken chain', text: 'The border is one unbroken chain: the iron-man streak.' },
    ],
  },
  {
    id: 'anunoby',
    number: '8',
    position: 'Small Forward',
    player: 'OG Anunoby',
    last: 'Anunoby',
    figure: 'Shamgar',
    hebrewName: 'שַׁמְגַּר',
    accent: '#e0a83a',
    image: 'cards/garden/anunoby-shamgar.jpeg',
    hook: 'Shamgar gets one verse in the entire Bible, and in it he saves Israel. OG barely says a word, then wins Game 4 with 1.2 seconds left.',
    move: 'The 1.2-second tip-in',
    verse: {
      ref: 'Judges 3:31',
      hebrew: 'וְאַחֲרָיו הָיָה שַׁמְגַּר בֶּן־עֲנָת וַיַּךְ אֶת־פְּלִשְׁתִּים שֵׁשׁ־מֵאוֹת אִישׁ בְּמַלְמַד הַבָּקָר וַיֹּשַׁע גַּם־הוּא אֶת־יִשְׂרָאֵל׃',
      english: 'And after him was Shamgar the son of Anath, who smote of the Philistines six hundred men with an ox-goad; and he also saved Israel.',
    },
    receipt: 'Game 4 winner with 1.2 seconds left. Second career title.',
    eggs: [
      { x: 33, y: 60, title: 'The ox-goad', text: 'A farmer’s cattle prod. Shamgar’s only weapon.' },
      { x: 17, y: 80, title: 'Six hundred helmets', text: 'Empty Philistine helmets scattered in the furrows. Six hundred, according to the verse.' },
      { x: 75, y: 67, title: 'Yoked oxen', text: 'The rings became plowed furrows. Shamgar was a farmer first.' },
      { x: 14, y: 66, title: 'Empty roads', text: '“In the days of Shamgar… the highways ceased” (Judges 5:6).' },
      { x: 90, y: 85, title: 'The hourglass', text: 'Almost out of sand. 1.2 seconds.' },
      { x: 8, y: 86, title: 'Two crowns', text: '“He also saved Israel.” Toronto 2019. New York 2026.' },
    ],
  },
  {
    id: 'hart',
    number: '3',
    position: 'Power Forward',
    player: 'Josh Hart',
    last: 'Hart',
    figure: 'Caleb',
    hebrewName: 'כָּלֵב',
    accent: '#9b4dff',
    image: 'cards/garden/hart-caleb.jpeg',
    hook: 'Ten scouts saw giants and felt like grasshoppers. Caleb saw grapes. Hart sees seven-footers and sees rebounds.',
    move: 'Rebound in traffic',
    verse: {
      ref: 'Numbers 14:24',
      hebrew: 'וְעַבְדִּי כָלֵב עֵקֶב הָיְתָה רוּחַ אַחֶרֶת עִמּוֹ וַיְמַלֵּא אַחֲרָי וַהֲבִיאֹתִיו אֶל־הָאָרֶץ אֲשֶׁר־בָּא שָׁמָּה וְזַרְעוֹ יוֹרִשֶׁנָּה׃',
      english: 'But My servant Caleb, because he had another spirit with him, and hath followed Me fully, him will I bring into the land whereinto he went; and his seed shall possess it.',
    },
    receipt: '+200 in the 2026 playoffs, third-best in the league.',
    eggs: [
      { x: 13, y: 42, title: 'The giants', text: 'The scouts saw the Nephilim, giants of Canaan (Numbers 13:33). Here they’re made of stone and storm cloud.' },
      { x: 84, y: 90, title: 'Grasshoppers', text: '“We were in our own sight as grasshoppers.” Everyone except Caleb.' },
      { x: 14, y: 14, title: 'The grapes of Eshcol', text: 'A cluster so big two men carried it on a pole, with pomegranates and figs (Numbers 13:23).' },
      { x: 88, y: 70, title: 'Milk and honey', text: 'The skyline drips milk and honey: the land the scouts came back to describe.' },
      { x: 39, y: 25, title: '“Give me this mountain”', text: 'At 85, Caleb asked for the hill country where the giants lived (Joshua 14:12).' },
      { x: 67, y: 22, title: 'The dog star', text: 'Caleb sounds like kelev, Hebrew for dog. In basketball, that’s the highest compliment.' },
    ],
  },
  {
    id: 'towns',
    number: '32',
    position: 'Center',
    player: 'Karl-Anthony Towns',
    last: 'Towns',
    figure: 'Joseph',
    hebrewName: 'יוֹסֵף',
    accent: '#ff3fa4',
    image: 'cards/garden/towns-joseph.jpeg',
    hook: 'Sent away by his own, Joseph rose to glory in a new land. Traded away, Towns became a champion in New York. Neither ever hid his heart.',
    move: 'Seven-foot three',
    verse: {
      ref: 'Genesis 50:20',
      hebrew: 'וְאַתֶּם חֲשַׁבְתֶּם עָלַי רָעָה אֱלֹהִים חֲשָׁבָהּ לְטֹבָה לְמַעַן עֲשֹׂה כַּיּוֹם הַזֶּה לְהַחֲיֹת עַם־רָב׃',
      english: 'And as for you, ye meant evil against me; but God meant it for good, to bring to pass, as it is this day, to save much people alive.',
    },
    receipt: '+258 in the 2026 playoffs, the best single postseason in league history.',
    eggs: [
      { x: 33, y: 62, title: 'The coat of many colors', text: 'The gift from his father that started everything (Genesis 37:3).' },
      { x: 50, y: 35, title: 'Gold collar of Egypt', text: 'Pharaoh put a gold chain around Joseph’s neck when he made him second in command (Genesis 41:42).' },
      { x: 22, y: 21, title: 'Sun, moon, and eleven stars', text: 'Joseph dreamed the sun, the moon, and eleven stars bowed to him (Genesis 37:9).' },
      { x: 10, y: 74, title: 'Bowing sheaves', text: 'His first dream: his brothers’ sheaves of wheat bowing to his (Genesis 37:7).' },
    ],
  },
];

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

const escapeHtml = (text = '') =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Hero fan ----------
function buildFan() {
  const fan = document.getElementById('fan');
  const mid = (STARTERS.length - 1) / 2;
  fan.innerHTML = STARTERS.map((s, i) => `
    <a class="fan-card" href="#${s.id}" style="--i:${i}; --offset:${i - mid}" aria-label="${escapeHtml(`${s.player} as ${s.figure}`)}">
      <img src="${s.image.replace('garden/', 'garden/thumbs/')}" alt="" decoding="async">
    </a>`).join('');
  void fan.offsetWidth;
  setTimeout(() => fan.classList.add('is-dealt'), reducedMotion ? 0 : 300);
}

// ---------- Ticker ----------
function buildTicker() {
  const names = STARTERS
    .map((s) => `<span>${escapeHtml(s.last)} <b>→</b> ${escapeHtml(s.figure)}</span><i>✺</i>`)
    .join('');
  const hooks = ['The wilderness is over', '1973 → 2026', 'Fifty-three years', 'Be strong and of good courage', 'All the nation passed clean over']
    .map((h) => `<span>${escapeHtml(h)}</span><i>✦</i>`)
    .join('');
  document.getElementById('tickerNames').innerHTML = names + names;
  document.getElementById('tickerHooks').innerHTML = hooks + hooks;
}

// ---------- The five panels ----------
function panel(s, i) {
  const pins = s.eggs.map((e, n) => `
    <button class="pin" style="--x:${e.x}%; --y:${e.y}%" data-egg="${n}" aria-label="Easter egg ${n + 1}: ${escapeHtml(e.title)}">${n + 1}</button>`).join('');
  const eggList = s.eggs.map((e, n) => `
    <li><button class="egg" data-egg="${n}"><b>${n + 1}</b><span><strong>${escapeHtml(e.title)}</strong>${escapeHtml(e.text)}</span></button></li>`).join('');

  return `
    <article class="starter${i % 2 ? ' is-flipped' : ''}" id="${s.id}" style="--accent:${s.accent}">
      <div class="starter-card">
        <div class="tilt">
          <img src="${s.image}" alt="${escapeHtml(`${s.player} card, in the style of a 1960s concert poster, with traits of ${s.figure}`)}" loading="lazy" decoding="async">
          <span class="foil" aria-hidden="true"></span>
          ${pins}
        </div>
        <p class="pin-hint">Tap the numbers to find the Easter eggs</p>
      </div>

      <div class="starter-text">
        <p class="announcer"><span class="num">#${s.number}</span> Starting at ${escapeHtml(s.position.toLowerCase())}</p>
        <h3 class="names">
          <span class="player">${escapeHtml(s.player)}</span>
          <span class="becomes">takes on the mantle of</span>
          <span class="figure">${escapeHtml(s.figure)} <span class="he" lang="he" dir="rtl">${s.hebrewName}</span></span>
        </h3>
        <p class="hook">${escapeHtml(s.hook)}</p>

        <blockquote class="verse">
          <p class="he" lang="he" dir="rtl">${s.verse.hebrew}</p>
          <p class="en">${escapeHtml(s.verse.english)}</p>
          <cite>${escapeHtml(s.verse.ref)}</cite>
        </blockquote>

        <dl class="stats">
          <div><dt>Signature move</dt><dd>${escapeHtml(s.move)}</dd></div>
          <div><dt>Receipt</dt><dd>${escapeHtml(s.receipt)}</dd></div>
        </dl>

        <div class="eggs">
          <h4>Easter eggs <span>${s.eggs.length}</span></h4>
          <ol>${eggList}</ol>
        </div>
      </div>
    </article>`;
}

function buildStarters() {
  const root = document.getElementById('starters');
  root.innerHTML = STARTERS.map(panel).join('');

  // Pins and list items are linked: activating either lights up both
  root.addEventListener('click', (e) => {
    const trigger = e.target.closest('.pin, .egg');
    if (!trigger) return;
    const starter = trigger.closest('.starter');
    const n = trigger.dataset.egg;
    const wasActive = trigger.classList.contains('is-active');
    starter.querySelectorAll('.pin, .egg').forEach((el) => el.classList.toggle('is-active', !wasActive && el.dataset.egg === n));
    // On phones the card and list are stacked, so bring the matching item into view
    if (!wasActive && trigger.classList.contains('pin')) {
      const item = starter.querySelector(`.egg[data-egg="${n}"]`);
      if (window.innerWidth < 900) item.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    }
  });

  // Holo foil + tilt that follows the pointer (desktop only)
  if (finePointer && !reducedMotion) {
    root.querySelectorAll('.tilt').forEach((tilt) => {
      tilt.addEventListener('pointermove', (e) => {
        const r = tilt.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        tilt.style.setProperty('--mx', `${x * 100}%`);
        tilt.style.setProperty('--my', `${y * 100}%`);
        tilt.style.setProperty('--ry', `${(x - 0.5) * 10}deg`);
        tilt.style.setProperty('--rx', `${(0.5 - y) * 10}deg`);
      });
      tilt.addEventListener('pointerleave', () => {
        ['--mx', '--my', '--rx', '--ry'].forEach((p) => tilt.style.removeProperty(p));
      });
    });
  }

  // Panels rise in as they scroll into view
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  root.querySelectorAll('.starter').forEach((el) => io.observe(el));
}

buildFan();
buildTicker();
buildStarters();
