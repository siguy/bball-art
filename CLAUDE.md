# Court & Covenant - Project Guide

## What is This?

A **contemporary art project** creating collectible basketball cards that pair NBA legends with biblical/Jewish historical figures. Think "Thunder & Lightning" meets Torah.

**Series:**
- **Court & Covenant** (Active) - NBA players + Biblical figures
- **Torah Titans** (Active) - Biblical figure-vs-figure cards (rivalries, spouses, plagues)
- **Future**: Founding Fathers for America's 250th (July 4, 2026)

## Project Status

**Current Phase**: Phase 2 (Content Generation Active)

### Completed
- [x] Directory structure created
- [x] CLAUDE.md written
- [x] Git/GitHub initialized (https://github.com/siguy/bball-art)
- [x] **28 pairings created** (5 original + 16 heroes + 7 villains)
- [x] **9 card templates working** (6 hero + 3 villain variants)
- [x] Nano Banana Pro client working (`gemini-3-pro-image-preview`)
- [x] Logo concepts generated (gold + dark versions)
- [x] All era definitions (1970s-2020s)
- [x] Pose/interaction system (6 interactions)
- [x] **Character pose database** (per-character signature poses)
- [x] **Quotes database** (Hebrew + English biblical quotes)
- [x] **80+ cards generated!**
- [x] **Card Visualizer built** (local web app for review & feedback)
- [x] **Multi-Platform Export System** (Website, Instagram, Twitter)
- [x] **Card Generator UI** (interactive control panel for card generation)
- [x] **Solo Character Mode** (generate single-character cards)
- [x] **Feedback Export & Analysis** (download feedback, view stats, generation hints)
- [x] **Sefaria Enrichment System** (midrash-powered rivalryScenes, scriptureReferences)
- [x] **Multi-Series Support** (Court & Covenant + Torah Titans with series selector)
- [x] **Shared Libraries** (config, data-loader, template-loader for DRY code)
- [x] **Data Validation** (JSON schemas + validate-data.js script)

### In Progress
- [ ] **Pairing Creation Assistant** (AI-powered pairing suggestions)
- [ ] Testing pose system with all pairings
- [ ] Buffer API integration for social scheduling

### Up Next
- Phase 3: Social Media Strategy (export system ready!)
- Phase 4: Website
- Phase 5: NBA Jam-Style Arcade Game

## Core Principles

1. **This is Art** - Stylized, transformative interpretations. No photos, no logos, no licensed materials.
2. **Build for Reuse** - Everything should work for future series.
3. **Document Everything** - Code explains "why", not just "what".
4. **Keep Docs in Sync** - ALWAYS update CLAUDE.md and relevant documentation as changes are made. Commit documentation updates alongside code changes.

## Key Decisions Made

| Decision | Choice |
|----------|--------|
| Repo name | `bball-art` |
| Image generation | Nano Banana (Gemini API) |
| Social platform | Instagram first |
| Social automation | n8n |
| Website stack | Next.js + Tailwind + Vercel |
| Game engine | Phaser.js |

## Multi-Series Support

The project supports multiple card series with shared infrastructure.

### Available Series

| Series | ID | Description | Card Modes |
|--------|-----|-------------|------------|
| Court & Covenant | `court-covenant` | NBA players + Biblical figures | player-figure, solo |
| Torah Titans | `torah-titans` | Biblical figure-vs-figure | figure-figure, solo-figure, multi-figure |
| Scripture Titans | `scripture-titans` | (Future) Christian variant | - |
| Founding Fathers | `founding-fathers` | (Future) America's 250th | - |

### Series Selection

The visualizer includes a **global series selector** in the header. Selected series is stored in localStorage and persists across sessions. All pages filter data by the selected series.

### Series Auto-Discovery

The visualizer server **automatically discovers** available series from the `data/series/` directory on startup. A directory is recognized as a series if it contains either:
- A `pairings/` subdirectory, OR
- A `series-config.json` file

This means **new series can be added without code changes** - just create the directory structure.

### Adding a New Series

1. Create directory: `data/series/{series-id}/`
2. Add `series-config.json` with series metadata
3. Add `pairings/` subdirectory with pairing JSON files
4. Optionally add `sub-series/` for themed groupings
5. Add series abbreviation to `SERIES_ABBREV_REVERSE` in `visualizer/server.js` (for filename parsing)
6. Restart the visualizer - the new series will be auto-discovered

**Required fields for pairings** (see `data/schemas/pairing.schema.json`):
- `id`, `series`, `type`, `cardMode`
- `player` and `figure` objects with `name`, `poseFileId`, `characterType`
- For biblical figures: `era: "Biblical"` for correct badge display

### File Naming Convention

**New format:**
```
{series}_{pairing}_{template}_{pose1}_{pose2}_{timestamp}.jpeg
```

**Example:**
```
cc_jordan-moses_tl_tongue-dunk_part-sea_20260127T023406.jpeg
```

**Abbreviations:**

| Series | Abbrev | | Template | Abbrev |
|--------|--------|-|----------|--------|
| court-covenant | cc | | thunder-lightning | tl |
| torah-titans | tt | | thunder-lightning-dark | tld |
| scripture-titans | st | | beam-team | bt |
| founding-fathers | ff | | beam-team-shadow | bts |
| | | | metal-universe | mu |
| | | | downtown | dt |
| | | | kaboom | kb |
| | | | prizm-silver | ps |
| | | | spouse-blessing | sb |
| | | | trial-card | tc |
| | | | plague-card | pc |
| | | | three-way | tw |

### Torah Titans Card Types

| Type | Description | Example |
|------|-------------|---------|
| `rivalry` | Hero vs Villain confrontation | David vs Goliath |
| `spouse` | Husband & wife partnership | Abraham & Sarah |
| `trial` | Character facing a test | Abraham's 10 Trials |
| `multi` | 3+ characters | Jacob-Rachel-Leah |
| `plague` | Moses vs Pharaoh + plague | Blood, Frogs, etc. |

### Torah Titans Templates

| Template | Description | Best For |
|----------|-------------|----------|
| `spouse-blessing` | Warm golden partnership aesthetic | Spouse pairings |
| `trial-card` | Dramatic light/darkness tension | Abraham's trials |
| `plague-card` | Epic rivalry with plague imagery | 10 Plagues of Egypt |
| `three-way` | Multi-character composition | Love triangles |

### Generating for Different Series

```bash
# Court & Covenant (default)
node scripts/generate-card.js jordan-moses thunder-lightning

# Explicit series flag
node scripts/generate-card.js jordan-moses thunder-lightning --series court-covenant

# Torah Titans
node scripts/generate-card.js david-goliath plague-card --series torah-titans

# Auto-detection (finds pairing in any series)
node scripts/generate-card.js abraham-sarah spouse-blessing
```

### API Endpoints with Series

All visualizer API endpoints support `?series=` parameter:
- `GET /api/pairings?series=torah-titans`
- `GET /api/pairings-full?series=court-covenant`
- `GET /api/series` - List all available series
- `GET /api/series/:seriesId` - Get specific series config

## Directory Structure

```
data/
├── series/                         # Multi-series support
│   ├── court-covenant/             # NBA + Biblical pairings
│   │   ├── series-config.json
│   │   └── pairings/*.json
│   └── torah-titans/               # Bible-only (Jewish focus)
│       ├── series-config.json
│       ├── pairings/*.json
│       └── sub-series/             # Themed groupings
│           ├── spouses/
│           ├── abrahams-trials/
│           ├── plagues/
│           └── triangles/
├── poses/
│   ├── players/                    # Character-specific player poses
│   └── figures/                    # Character-specific figure poses
├── characters/                     # Standalone characters (not in pairings)
│   ├── players/                    # Solo player definitions
│   └── figures/                    # Solo figure definitions
├── quotes/
│   └── figures/                    # Biblical quotes by character
├── schemas/                        # JSON Schema validation
│   ├── pairing.schema.json
│   ├── pose.schema.json
│   ├── quote.schema.json
│   └── series-config.schema.json
├── eras/                           # 1970s-2020s definitions
├── card-brands/                    # Fleer, Topps, Panini, etc.
├── card-types/                     # Thunder & Lightning, Prizm, etc.
└── templates-meta.json             # Template metadata for Generator UI

docs/
├── generator-ui.md                 # Generator UI documentation
├── solo-characters.md              # Solo character creation guide
├── pairing-creator.md              # AI-powered pairing creation assistant
└── sefaria-enrichment.md           # Midrash-enriched cards workflow

prompts/
├── components/        # Modular pieces (backgrounds, poses, finishes)
├── templates/         # Full card templates (hero + villain variants)
│   └── torah-titans/  # Series-specific templates
└── generated/         # Ready-to-use prompts

output/
├── cards/                           # Generated images (organized by series)
│   ├── court-covenant/              # NBA + Biblical cards
│   │   ├── {pairing-id}/
│   │   └── solo-player-{id}/
│   └── torah-titans/                # Bible-only cards
│       ├── {pairing-id}/
│       └── solo-figure-{id}/
├── motion/                          # Video files
├── test-runs/                       # Style testing & generation log
└── social/                          # Platform-ready assets

scripts/
├── lib/
│   ├── config.js                    # Centralized configuration
│   ├── data-loader.js               # Pairing/character/pose loading
│   ├── template-loader.js           # Series-aware template loading
│   └── filename-builder.js          # File naming convention
├── generate-card.js                 # Main card generation
├── generate-with-poses.js           # Pose-controlled generation
├── generate-solo.js                 # Solo character cards
├── validate-data.js                 # JSON schema validation
└── migrate-to-series.js             # Migration utility

visualizer/        # Card review & feedback system
├── server.js      # Express API server with series support
├── public/
│   ├── series-selector.js          # Global series selector component
│   └── ...                          # Frontend (HTML/CSS/JS)
└── data/          # Manifest & feedback JSON
```

## All 28 Pairings

### Original 5 (Priority)
| Player | Figure | Era | Connection |
|--------|--------|-----|------------|
| Michael Jordan | Moses | 90s | Led people through wilderness to promised land |
| LeBron James | King David | 2010s | From humble beginnings to greatest king |
| Scottie Pippen | Aaron | 90s | Moses's essential partner, underrated |
| Kobe Bryant | Joshua | 2000s | Succeeded Moses, conquered the land |
| Stephen Curry | Elijah | 2010s | Brought fire from heaven, changed everything |

### Heroes (16)
| Player | Figure | Era | Connection |
|--------|--------|-----|------------|
| Magic Johnson | Joseph | 80s | Visionary, dreamer, elevated everyone |
| Shaquille O'Neal | Goliath | 90s | Dominant physical presence |
| Wilt Chamberlain | Samson | 70s | Legendary strength, unbelievable feats |
| Kareem Abdul-Jabbar | Solomon | 70s | Wisdom, longevity, unmatched skill |
| John Stockton | Elisha | 90s | Faithful servant, miracles in assists |
| Dirk Nowitzki | Judah Maccabee | 2010s | Outsider defeated powerful enemy |
| Kevin Durant | Jonathan | 2010s | Elite talent, complicated loyalties |
| Nikola Jokic | Isaac | 2020s | Patient, underestimated, blessed |
| Shai Gilgeous-Alexander | Daniel | 2020s | Young, composed under pressure |
| Tim Duncan | Bezalel | 2000s | Master craftsmen - fundamentals over flash |
| Hakeem Olajuwon | Abraham | 90s | Called from other lands, fathers of dynasties |
| Bill Russell | Nehemiah | 60s | Built/rebuilt under oppression, ultimate winners |
| Giannis Antetokounmpo | Ruth | 2020s | Immigrants who became royalty through loyalty |
| Charles Barkley | Caleb | 90s | Undersized warriors who saw victory where others saw defeat |
| Victor Wembanyama | Enoch | 2020s | Transcendent beings on a different plane |
| Allen Iverson | Gideon | 2000s | Unconventional warriors who defeated overwhelming odds |

### Villains/Antagonists (7)
| Player | Figure | Era | Connection |
|--------|--------|-----|------------|
| Isiah Thomas | Pharaoh | 80s | Ruled with iron fist |
| Bill Laimbeer | Haman | 80s | Schemer, villain everyone loved to hate |
| Dennis Rodman | Esau | 90s | Wild, impulsive, lived by his own rules |
| Draymond Green | Joab | 2010s | Did the dirty work |
| Larry Bird | Jacob | 80s | Strategic, wrestled his way to greatness |
| Karl Malone | Balaam | 90s | Couldn't deliver when it mattered most |
| Patrick Ewing | Saul | 90s | Wore the crown, watched someone else take it |

### Adding New Pairings

See `data/series/court-covenant/pairings/NEW-PAIRINGS.md` for the full guide on researching, creating, and testing new pairings.

## Card Templates (9)

### Hero Templates (6)
| Template | Style | Key Visual Elements |
|----------|-------|---------------------|
| `thunder-lightning` | 90s Fleer Ultra | Electric gradient, lightning bolts, cosmic |
| `beam-team` | 90s Stadium Club | Holographic prism borders, rainbow refraction |
| `downtown` | 2010s Panini Optic | Neon city skyline, urban night scene |
| `kaboom` | 2010s Panini | Comic book/pop art, bold outlines |
| `metal-universe` | 90s Fleer Metal | Chrome, industrial, metallic |
| `prizm-silver` | 2010s Panini Prizm | Clean geometric, silver shimmer |

### Villain Templates (3)
| Template | Style | Key Visual Elements |
|----------|-------|---------------------|
| `thunder-lightning-dark` | Dark Side variant | Black/crimson, blood-red lightning, sinister |
| `beam-team-shadow` | Shadow Spectrum variant | Purple/red prism, corruption effects (cracks, smoke, embers) |
| `metal-universe-dark` | Dark variant | Black chrome, rust red, industrial hellscape |

## Interactions/Poses (6 generic)

| Interaction | Description | Best For |
|-------------|-------------|----------|
| `back-to-back` | Standing back-to-back, facing outward | Warriors, rivals |
| `side-by-side` | Standing together as equals | Kings, partners |
| `high-five` | Dynamic celebration | Visionaries, joy |
| `dap-up` | Casual fist bump/greeting | Humble legends |
| `simultaneous-action` | Both performing signature moves | Action cards |
| `fire-rain` | Curry shooting, Elijah calling fire | Curry/Elijah only |

## Character Pose System

Per-character signature poses that can be swapped into any template. Each character has their own JSON file with multiple iconic poses.

### Complete Inventory (28 players, 28 figures)

**Players** (`data/poses/players/`):
| File | Player | Poses |
|------|--------|-------|
| jordan.json | Michael Jordan | tongue-out-dunk, fadeaway, flying-layup, fist-pump, playoff-shrug, defensive-stance |
| lebron.json | LeBron James | chase-down-block, tomahawk-dunk, powder-toss, king-celebration, no-look-pass, defensive-anchor |
| pippen.json | Scottie Pippen | coast-to-coast, lockdown-defense, outlet-pass, dunk-point, two-way-star, championship-carry |
| kobe.json | Kobe Bryant | fadeaway-jumper, mamba-mentality, post-footwork, clutch-dagger, fist-pump-celebration, defensive-intensity |
| curry.json | Stephen Curry | deep-three, shimmy-celebration, behind-back-dribble, tunnel-shot, prayer-hands, logo-three |
| magic.json | Magic Johnson | no-look-pass, baby-hook, fast-break-leader, megawatt-smile, showtime-assist, championship-celebration |
| shaq.json | Shaquille O'Neal | backboard-breaking, drop-step-dunk, finger-wave, dudley-poster, dominant-block, celebration-roar |
| wilt.json | Wilt Chamberlain | finger-roll, fadeaway-bank, hundred-point-night, dominant-rebound, blocking-shot, strength-display |
| kareem.json | Kareem Abdul-Jabbar | skyhook, post-moves, goggles-adjustment, blocking-shot, meditation-focus, championship-celebration |
| stockton.json | John Stockton | pinpoint-assist, pick-and-roll, steal-anticipation, short-shorts-classic, no-look-feed, franchise-leader |
| dirk.json | Dirk Nowitzki | one-leg-fadeaway, championship-trophy, goofy-celebration, mid-range-master, playoff-dirk, fist-pump |
| durant.json | Kevin Durant | pull-up-jumper, silky-smooth, easy-bucket, reaper-celebration, crossover-three, length-block |
| jokic.json | Nikola Jokic | no-look-pass, sombor-shuffle, casual-triple-double, unbothered-mvp, post-playmaking, fast-break-outlet |
| sga.json | Shai Gilgeous-Alexander | crafty-floater, mid-range-master, cool-customer, change-of-pace, iso-killer, defensive-pest |
| isiah-thomas.json | Isiah Thomas | no-look-dish, tough-driving-layup, smile-through-pain, jordan-freeze-out, championship-kiss, bad-boy-stare |
| laimbeer.json | Bill Laimbeer | hard-foul, flagrant-elbow, getting-under-skin, strategic-flop, celebrating-chaos, villain-smile |
| draymond.json | Draymond Green | and-one-scream, defensive-anchor, technical-argument, dirty-work-dive, emotional-leader, triple-single-impact |
| bird.json | Larry Bird | trash-talk-three, left-hand-game, clutch-shot, cold-stare, no-look-pass, championship-celebration |
| rodman.json | Dennis Rodman | diving-loose-ball, tipping-rebound, defensive-clamp, wild-celebration, headbutt-ref, championship-rings |
| duncan.json | Tim Duncan | bank-shot, post-defense, stone-face, championship-stoic, fundamental-footwork, high-five-teammates |
| hakeem.json | Hakeem Olajuwon | dream-shake, block-swat, up-and-under, championship-embrace, prayer-focus, fadeaway-touch |
| russell.json | Bill Russell | championship-banners, block-rejection, outlet-pass, player-coach, civil-rights-stance, defensive-positioning |
| malone.json | Karl Malone | elbow-jumper, pick-and-roll, power-dunk, missed-free-throw, muscular-pose, finals-frustration |
| ewing.json | Patrick Ewing | fadeaway-baseline, finger-roll, intimidation-stare, blocked-layup, sweat-warrior, watching-jordan |
| giannis.json | Giannis Antetokounmpo | eurostep-dunk, championship-trophy, monster-block, humble-beginning, free-throw-routine, screaming-and-one |
| barkley.json | Charles Barkley | power-rebound, coast-to-coast, turnaround-jumper, celebration |
| wembanyama.json | Victor Wembanyama | rim-protection, three-point-stroke, handle-moves, humble-prodigy, chase-down, finger-roll |
| iverson.json | Allen Iverson | crossover, step-over, practice-rant, heart-over-height, arm-sleeve-swag, playing-hurt |

**Figures** (`data/poses/figures/`):
| File | Figure | Poses |
|------|--------|-------|
| moses.json | Moses | parting-sea, receiving-tablets, staff-raised, burning-bush, leading-exodus, striking-rock |
| david.json | King David | slinging-stone, dancing-before-ark, playing-harp, crowned-king, writing-psalms, warrior-stance |
| aaron.json | Aaron | high-priest-blessing, holding-staff, golden-calf-moment, incense-offering, speaking-for-moses, priestly-garments |
| joshua.json | Joshua | walls-falling, sword-raised, sun-stand-still, crossing-jordan, spy-report, leading-charge |
| elijah.json | Elijah | calling-fire, chariot-ascending, confronting-prophets, ravens-feeding, still-small-voice, mantle-passing |
| joseph.json | Joseph | revealing-identity, coat-of-colors, interpreting-pharaoh, ruling-egypt, resisting-temptation, forgiving-brothers |
| samson.json | Samson | pushing-pillars, killing-lion, jawbone-warrior, carrying-gates, blind-in-chains, long-hair-glory |
| solomon.json | Solomon | throne-wisdom, baby-judgment, dedicating-temple, asking-wisdom, writing-proverbs, vanity-reflection |
| elisha.json | Elisha | receiving-mantle, healing-naaman, multiplying-oil, raising-dead, seeing-armies, striking-waters |
| judah.json | Judah Maccabee | hammer-raised, lighting-menorah, guerrilla-commander, victory-over-elephants, rallying-brothers, entering-temple |
| jonathan.json | Jonathan | covenant-with-david, warrior-prince, warning-david, weeping-farewell, defying-saul, fallen-on-gilboa |
| isaac.json | Isaac | bound-on-altar, digging-wells, blessing-jacob, meeting-rebekah, meditating-field, reconciling-esau |
| daniel.json | Daniel | lions-den, interpreting-dream, reading-wall, refusing-food, praying-toward-jerusalem, receiving-vision |
| goliath.json | Goliath | champion-challenge, spear-thrust, mocking-israel, armor-display, intimidation-stance, final-fall |
| esau.json | Esau | drawing-bow, chugging-soup, blessing-stolen, hunting-return, reconciling-jacob, wild-man-glory |
| pharaoh.json | Pharaoh | throne-of-power, refusing-moses, chariot-pursuit, firstborn-grief, hardened-heart, drowning-army |
| haman.json | Haman | plotting-destruction, dice-casting, gallows-building, parade-humiliation, begging-esther, final-hanging |
| joab.json | Joab | battlefield-commander, dirty-deed, whispering-counsel, loyal-soldier, ruthless-strike, army-general |
| jacob.json | Jacob | wrestling-angel, stealing-blessing, ladder-dream, stone-pillow, reunion-with-esau, deceiving-father |
| ruth.json | Ruth | gleaning-fields, declaration-to-naomi, meeting-boaz, at-threshing-floor, mother-of-dynasty, leaving-moab |
| caleb.json | Caleb | silencing-crowd, returning-with-grapes, different-spirit, claiming-hebron, facing-giants, old-warrior |
| enoch.json | Enoch | walking-with-god, ascending, between-worlds, three-hundred-years, teaching-methuselah, heavenly-vision |
| gideon.json | Gideon | three-hundred, torch-and-horn, threshing-wheat, refusing-crown, testing-fleece, surprise-attack |
| bezalel.json | Bezalel | crafting-ark, measuring-precisely, hands-on-materials, teaching-apprentice, divine-inspiration, examining-work |
| abraham.json | Abraham | journeying-forth, covenant-stars, welcoming-visitors, here-i-am, father-patriarch, binding-isaac |
| nehemiah.json | Nehemiah | building-wall, sword-and-trowel, rallying-workers, refusing-to-descend, wall-complete, surveying-ruins |
| balaam.json | Balaam | failed-curse, donkey-confrontation, overlooking-israel, receiving-payment, forced-blessing, seeing-angel |
| saul.json | Saul | tormented-throne, throwing-spear, crowned-king, consulting-witch, fallen-gilboa, watching-david |

### Pose File Format
```json
{
  "id": "rodman",
  "name": "Dennis Rodman",
  "defaultPose": "diving-loose-ball",
  "poses": {
    "diving-loose-ball": {
      "id": "diving-loose-ball",
      "name": "Diving for Loose Ball",
      "description": "Horizontal dive, body parallel to ground",
      "prompt": "horizontal dive for loose ball - body completely parallel...",
      "energy": "chaos incarnate, hustle personified"
    }
  },
  "hairColors": {
    "red": "bright red wild hair",
    "green": "neon green wild hair"
  }
}
```

### Pairing poseFileId
Each pairing JSON includes explicit `poseFileId` fields to link to pose files:
```json
{
  "player": {
    "name": "Isiah Thomas",
    "poseFileId": "isiah-thomas"  // → data/poses/players/isiah-thomas.json
  },
  "figure": {
    "name": "Pharaoh",
    "poseFileId": "pharaoh"       // → data/poses/figures/pharaoh.json
  }
}
```

This prevents ambiguity with similar names (multiple Chrises, Mikes, etc.).

## Quotes Database

Biblical quotes (Hebrew + English) organized by character, linked to poses via `quoteId`.

### Complete Inventory (28 figures)

| File | Figure | Key Quotes |
|------|--------|------------|
| moses.json | Moses | let-my-people-go, parting-the-sea, ten-commandments, burning-bush, striking-rock |
| david.json | King David | smooth-stones, dancing-before-lord, shepherd-psalm, against-goliath, bathsheba-sin |
| aaron.json | Aaron | priestly-blessing, golden-calf, speak-to-pharaoh, budding-staff, consecration |
| joshua.json | Joshua | be-strong-courageous, sun-stand-still, choose-this-day, walls-of-jericho, crossing-jordan |
| elijah.json | Elijah | still-small-voice, fire-from-heaven, how-long-halt, chariot-of-fire, ravens-fed-me |
| joseph.json | Joseph | reveal-to-brothers, god-meant-for-good, coat-of-colors, interpreting-dreams, resist-temptation |
| samson.json | Samson | lion-bare-hands, jawbone-thousand, strength-in-hair, die-with-philistines, gates-of-gaza |
| solomon.json | Solomon | ask-for-wisdom, divide-the-baby, temple-dedication, vanity-of-vanities, fear-of-lord |
| elisha.json | Elisha | double-portion, god-of-elijah, wash-seven-times, open-his-eyes, more-with-us |
| judah.json | Judah Maccabee | who-like-you, many-or-few, better-to-die, arm-yourselves, restore-sanctuary |
| jonathan.json | Jonathan | soul-knit, nothing-hinders, go-in-peace, why-should-he-die, how-mighty-fallen |
| isaac.json | Isaac | where-is-lamb, god-will-provide, room-for-us, voice-is-jacob, two-nations |
| daniel.json | Daniel | shut-lions-mouths, god-reveals-mysteries, mene-mene, not-defile-himself, three-times-daily |
| goliath.json | Goliath | choose-a-man, am-i-a-dog, give-flesh-to-birds, curse-by-gods, forty-days-defiance |
| esau.json | Esau | birthright-sold, red-stew, blessing-stolen, live-by-sword, reconciliation |
| pharaoh.json | Pharaoh | who-is-lord, heart-hardened, let-them-go, my-nile, firstborn-cry |
| haman.json | Haman | ten-thousand-talents, what-shall-be-done, gallows-prepared, fallen-before-jews, reverse-decree |
| joab.json | Joab | for-the-king, why-count-israel, blood-on-his-head, three-darts, the-horn-is-sounded |
| jacob.json | Jacob | i-am-esau, stairway-to-heaven, wrestled-with-god, give-me-blessing, smooth-man-hairy |
| bezalel.json | Bezalel | filled-with-spirit, wisdom-understanding, all-manner-of-work, willing-heart, skillful-hands |
| abraham.json | Abraham | lech-lecha, father-of-nations, hineni, count-the-stars, blessing-all-nations |
| nehemiah.json | Nehemiah | let-us-build, great-work, fifty-two-days, sword-and-trowel, why-sad-face |
| balaam.json | Balaam | cannot-curse, mah-tovu, donkey-speaks, what-god-speaks, star-from-jacob |
| saul.json | Saul | head-and-shoulders, thousands-tens-thousands, how-mighty-fallen, evil-spirit, spared-agag |
| ruth.json | Ruth | where-you-go, death-alone-parts, left-everything, under-his-wings, gleaning-fields |
| caleb.json | Caleb | we-can-take-them, different-spirit, still-strong, give-me-this-mountain, followed-fully |
| enoch.json | Enoch | walked-with-god, was-no-more, three-hundred-years, pleasing-to-god |
| gideon.json | Gideon | mighty-warrior, sword-of-the-lord, too-many-troops, three-hundred-men, the-lord-shall-rule |

### Quote Format
```json
{
  "birthright-sold": {
    "source": "Genesis 25:32",
    "context": "Esau sells his birthright for lentil stew",
    "hebrew": "הִנֵּה אָנֹכִי הוֹלֵךְ לָמוּת וְלָמָּה זֶּה לִי בְּכֹרָה",
    "english": "I am about to die; of what use is a birthright to me?",
    "mood": "desperate, impulsive"
  }
}
```

### Linking Poses to Quotes
Pose files reference quotes via `quoteId`:
```json
{
  "chugging-soup": {
    "prompt": "desperately chugging lentil soup...",
    "quoteId": "red-stew"  // → quotes/figures/esau.json["red-stew"]
  }
}
```

## Tone & Voice

**Edgy, funny, irreverent** - but respectful of both basketball and biblical history.

Good: "Moses parted the Red Sea. MJ parted defenders. Same energy."
Bad: Corporate speak, explaining jokes, being preachy.

## Key APIs & Tools

- **Nano Banana Pro**: `gemini-3-pro-image-preview` via Vertex AI
- **n8n**: Social media automation workflows
- **Meta Graph API**: Instagram posting (Business account required)

## Card Visualizer

A local web app for reviewing generated cards, providing feedback, and exporting to multiple platforms.

**Start the visualizer:**
```bash
cd visualizer && npm start
# Opens at http://localhost:3333
```

**Features:**
- Gallery view of all generated cards
- Filter by pairing, template, interaction, or feedback status
- Card detail view with full prompt
- Feedback system (Love It / Like It / Has Issues + notes)
- **Auto-saves** feedback to `visualizer/data/feedback.json`
- Keyboard navigation (arrow keys, Escape)
- **Multi-Platform Export** (Website, Instagram, Twitter)
- **Caption Editor** with templates and Hebrew quotes
- **Export Queue** for batch processing

**Pages:**
- `/` - Card gallery with feedback & export
- `/generator.html` - **Card Generator UI** (interactive control panel)
- `/pairings.html` - Pairing management
- `/export-queue.html` - Export queue management

**API Endpoints:**

*Core:*
- `GET /api/manifest` - Rebuilds and returns card index
- `GET /api/feedback` - All feedback data
- `POST /api/feedback/:cardId` - Save feedback for a card
- `GET /api/pairings` - Pairing metadata
- `GET /api/pairings-full` - Full pairing data with poses

*Caption:*
- `GET /api/caption/templates` - Available caption templates
- `POST /api/caption/generate` - Generate caption from template
- `GET /api/caption/quotes/:figureId` - Quotes for a figure
- `GET /api/caption/poses/:type/:poseFileId` - Poses for a character

*Export:*
- `GET /api/export/queue` - Get export queue
- `POST /api/export/queue` - Add to queue
- `PUT /api/export/queue/:id` - Update queue item
- `DELETE /api/export/queue/:id` - Remove from queue
- `POST /api/export/process` - Process all pending
- `POST /api/export/single` - Export single card immediately
- `GET /api/export/config` - Export configuration

*Buffer (Social Scheduling):*
- `GET /api/buffer/status` - Check Buffer configuration
- `GET /api/buffer/profiles` - Get connected profiles
- `POST /api/buffer/post` - Schedule post to Buffer

*Generator (Pose-Controlled Generation):*
- `GET /api/poses/players` - List all players with pose files
- `GET /api/poses/figures` - List all figures with pose files
- `GET /api/poses/players/:id` - Get player poses by poseFileId
- `GET /api/poses/figures/:id` - Get figure poses by poseFileId
- `GET /api/templates` - List available templates with metadata
- `POST /api/generate-with-poses` - Full pose-controlled generation

## Multi-Platform Export System

Export cards to Website, Instagram, and Twitter with auto-generated captions.

### Platform Configurations

| Platform | Max Width | Format | Quality | Caption Limit |
|----------|-----------|--------|---------|---------------|
| Website | 1200px | PNG | 100% | N/A |
| Instagram | 1080px | JPEG | 95% | 2200 chars |
| Twitter | 1200px | JPEG | 90% | 280 chars |

### Caption Templates

| Template | Description |
|----------|-------------|
| `standard` | Narrative + thematic + hashtags |
| `with-quote` | Biblical quote + narrative |
| `storytelling` | Player meets figure + pose energy |
| `hebrew` | Hebrew quote + English translation |
| `minimal` | Just "Player × Figure" |

### Export Flow

1. Open card in visualizer modal
2. Select destinations (Website / Instagram / Twitter)
3. Choose caption template and generate
4. Edit caption as needed
5. "Export Now" for immediate export, or "Add to Queue"
6. Process queue from Export Queue page

### Files

```
visualizer/
├── lib/
│   ├── image-processor.js    # Sharp-based resize/format
│   ├── caption-generator.js  # Template-based captions
│   └── buffer-client.js      # Buffer API wrapper
└── data/
    ├── export-queue.json     # Queue storage
    ├── export-config.json    # Platform configs
    └── caption-templates.json # Caption templates + hashtags
```

## Card Generator UI

Interactive control panel for generating cards with full pose control.

**Access:** `http://localhost:3333/generator.html` or click "Generator" in navigation.

### Features
- **Mode Toggle** - Switch between Pairing mode and Solo Character mode
- **Pairing Selection** - Grouped by Heroes/Villains, sorted by priority (pairing mode)
- **Character Selection** - Choose NBA Player or Biblical Figure (solo mode)
- **Template Selection** - All 9 templates with era badges and dark mode indicators
- **Dark Mode Toggle** - Auto-detects villain pairings (shows "AUTO" badge), can override
- **Pose Selection** - Player and figure poses loaded from pose database
- **Hair Color** - Shows for Rodman only, override default hair color
- **Regenerate** - Create new card with same settings
- **Quick Pose Swap** - Try different poses without changing other settings

### Solo Mode
- Generate single-character cards (NBA player OR biblical figure)
- Character centered at ~80% card height
- All 9 templates support solo mode
- Same pose database as pairing mode

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Generate card |
| `Escape` | Close modals |

### Pairing Type Field
All pairing JSON files now include a `type` field:
- `"type": "hero"` - 21 hero pairings (5 original + 16 heroes)
- `"type": "villain"` - 7 villain pairings

This enables grouped dropdowns and automatic dark mode detection.

**Full documentation:** `docs/generator-ui.md`

## Pairing Creation Assistant

AI-powered tool for creating new pairings, located on the Pairings page.

### Five Modes

| Mode | Input | AI Output |
|------|-------|-----------|
| **Full Pairing** | Player + Figure | Connection narrative (if not provided) |
| **Find a Figure** | Just player | Matching biblical figures with reasons |
| **Find a Player** | Just figure | Matching NBA players with reasons |
| **Discover Heroes** | Nothing | New hero pairings based on gaps |
| **Discover Opposites** | Nothing | Hero-villain opposing pairings |

### Key Features
- **AI-generated connections** - If user provides player + figure without a connection, AI suggests the narrative
- **Opposing pairings** - Discover mode finds villain pairings that naturally oppose existing heroes (e.g., Harden/Delilah vs Wilt/Samson)
- **Alternate pairings** - Characters can appear in multiple pairings (marked with `isAlternate: true`)
- **Auto-generation** - Creates all required JSON files (poses, quotes, pairing) on selection

### Data Model Additions

```json
{
  "id": "harden-delilah",
  "type": "villain",
  "isAlternate": false,
  "alternateOf": null,
  "opposingPairing": "wilt-samson"
}
```

**Full documentation:** `docs/pairing-creator.md`

## Quick Commands

```bash
# Start the card visualizer
cd visualizer && npm start

# Generate a card (basic - auto-detects series from pairing location)
node scripts/generate-card.js jordan-moses thunder-lightning

# Generate with explicit series
node scripts/generate-card.js jordan-moses thunder-lightning --series court-covenant

# Generate with specific interaction
node scripts/generate-card.js curry-elijah thunder-lightning --interaction fire-rain

# Generate with character poses (recommended for villains)
node scripts/generate-with-poses.js rodman-esau thunder-lightning-dark \
  --player-pose diving-loose-ball --figure-pose drawing-bow

# List available poses for a pairing
node scripts/generate-with-poses.js isiah-pharaoh --list-poses

# Dry run (show prompt without generating)
node scripts/generate-with-poses.js shaq-goliath beam-team-shadow \
  --player-pose backboard-breaking --figure-pose champion-challenge --dry-run

# Generate with hair color override (Rodman)
node scripts/generate-with-poses.js rodman-esau thunder-lightning-dark \
  --player-pose diving-loose-ball --figure-pose drawing-bow --hair green

# --- TORAH TITANS (FIGURE-FIGURE) ---

# Generate a spouse pairing card
node scripts/generate-card.js abraham-sarah spouse-blessing --series torah-titans

# Generate a plague card
node scripts/generate-card.js moses-pharaoh plague-card --series torah-titans

# --- SOLO MODE COMMANDS ---

# Generate solo player card
node scripts/generate-solo.js player jordan thunder-lightning --pose tongue-out-dunk

# Generate solo figure card
node scripts/generate-solo.js figure moses beam-team --pose parting-sea

# Generate solo figure for Torah Titans
node scripts/generate-solo.js figure abraham trial-card --pose binding-isaac --series torah-titans

# Solo card with hair color (Rodman)
node scripts/generate-solo.js player rodman metal-universe-dark --pose diving-loose-ball --hair green

# List poses for a character
node scripts/generate-solo.js player curry --list-poses
node scripts/generate-solo.js figure elijah --list-poses

# Dry run
node scripts/generate-solo.js figure david kaboom --pose slinging-stone --dry-run

# --- TESTING & VALIDATION ---

# Validate all JSON data against schemas
node scripts/validate-data.js

# Validate with verbose output
node scripts/validate-data.js --verbose

# Validate only specific type
node scripts/validate-data.js --type pairings

# Run solo character tests (CLI only)
node scripts/test-solo-characters.js --cli

# Run all tests (requires server running)
node scripts/test-solo-characters.js
```

## Environment Variables Needed

```
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
INSTAGRAM_ACCESS_TOKEN=your-long-lived-token
BUFFER_ACCESS_TOKEN=your-buffer-api-token  # For social scheduling
```

## Shared Libraries

Generation scripts use shared modules in `scripts/lib/`:

| Module | Purpose |
|--------|---------|
| `config.js` | Centralized paths, defaults, series auto-discovery |
| `data-loader.js` | Load pairings, characters, poses, quotes across series |
| `template-loader.js` | Load templates with series-specific fallback |
| `filename-builder.js` | Generate standardized output filenames |

**Key functions:**
```javascript
// config.js
CONFIG.series        // Auto-discovered from data/series/
CONFIG.paths.data    // Centralized path references
getOutputPath(series, pairingId)

// data-loader.js
loadPairing(id, seriesHint)       // Load pairing with series info
findCharacterData(type, id)       // Find character from pairings or standalone
extractPairingCharacters(pairing) // Get char IDs and types from pairing

// template-loader.js
loadTemplate(templateId, series)  // Load with series fallback
listTemplates(seriesId)           // List available templates
```

## Data Validation

JSON files are validated against schemas in `data/schemas/`:

```bash
# Validate all data
node scripts/validate-data.js

# Verbose output (shows all files checked)
node scripts/validate-data.js --verbose

# Validate specific type only
node scripts/validate-data.js --type pairings   # pairings, poses, quotes, series
```

Schemas enforce:
- Required fields (`id`, `series`, `type` for pairings)
- Valid enums (`cardMode`, `characterType`)
- Pattern matching (kebab-case IDs)
- Reference integrity (warns about missing pose files)

**Important for Torah Titans / figure-figure pairings:**
- Both `player` and `figure` must have `characterType: "figure"`
- Both must have `era: "Biblical"` for the era badge to display correctly
- Both must have `poseFileId` pointing to a file in `data/poses/figures/`

## Common Tasks

### Adding a New Pairing

**Full guide:** `data/series/court-covenant/pairings/NEW-PAIRINGS.md`

1. Research player (stats, moves, personality) and figure (story, quotes)
2. Create 4 files: pairing JSON, player poses, figure poses, figure quotes
3. Validate: `node scripts/validate-data.js --type pairings`
4. Test poses: `node scripts/generate-with-poses.js {pairing} --list-poses`
5. Dry run: `node scripts/generate-with-poses.js {pairing} {template} --dry-run`
6. Generate via Generator UI, review, iterate
7. Update CLAUDE.md inventory tables

### Adding Character Poses
1. Create `data/poses/players/{poseFileId}.json` or `data/poses/figures/{poseFileId}.json`
2. Define poses with `id`, `name`, `description`, `prompt`, `energy`
3. For figures, add `quoteId` to link to quotes database
4. Set `defaultPose` to the most common pose
5. Test with `--list-poses` flag

### Adding Biblical Quotes
1. Create or edit `data/quotes/figures/{figureId}.json`
2. Add quotes with `source`, `context`, `hebrew`, `english`, `mood`
3. Reference from poses via `quoteId`

### Adding a Standalone Solo Character

**Full guide:** `docs/solo-characters.md`

For characters that don't exist in any pairing:

1. Create standalone character file:
   - Players: `data/characters/players/{id}.json`
   - Figures: `data/characters/figures/{id}.json`
2. Create pose file: `data/poses/{players|figures}/{id}.json`
3. For figures: create quotes file: `data/quotes/figures/{id}.json`
4. Validate: `node -e "require('./data/characters/{type}s/{id}.json')"`
5. Test: `node scripts/generate-solo.js {type} {id} --list-poses`
6. Dry run: `node scripts/generate-solo.js {type} {id} {template} --dry-run`
7. Generate via Generator UI (Solo mode), review, iterate

Note: Characters already in pairings can use solo mode without a standalone file.

### Adding a New Card Style
1. Create `data/card-types/{style-name}.json`
2. Add background to `prompts/components/backgrounds.js`
3. Create template in `prompts/templates/{style-name}.js`
4. For villain variant: copy hero template, add villain colors/expressions
5. Test with existing pairing

## Plan File Location

Full project plan: `/Users/simonbrief/.claude/plans/unified-frolicking-adleman.md`

## What NOT to Do

- Don't add NBA logos or team names
- Don't use real player photographs
- Don't over-engineer (keep it simple until needed)
- Don't batch generate before style testing
- Don't skip the rating/validation phase
