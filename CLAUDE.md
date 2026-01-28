# Court & Covenant - Project Guide

## What is This?

A **contemporary art project** creating collectible basketball cards that pair NBA legends with biblical/Jewish historical figures. Think "Thunder & Lightning" meets Torah.

**Series 1**: Court & Covenant (Basketball + Biblical figures)
**Future**: Founding Fathers series for America's 250th (July 4, 2026)

## Project Status

**Current Phase**: Phase 2 (Content Generation Active)

### Completed
- [x] Directory structure created
- [x] CLAUDE.md written
- [x] Git/GitHub initialized (https://github.com/siguy/bball-art)
- [x] **19 pairings created** (5 original + 9 heroes + 5 villains)
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

### In Progress
- [ ] Merging villain-template-refactor branch
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

## Directory Structure

```
data/
├── series/{series-name}/pairings/  # Player-figure pairings (with poseFileId and type)
├── poses/
│   ├── players/                    # Character-specific player poses
│   └── figures/                    # Character-specific figure poses
├── quotes/
│   └── figures/                    # Biblical quotes by character
├── eras/                           # 1970s-2020s definitions
├── card-brands/                    # Fleer, Topps, Panini, etc.
├── card-types/                     # Thunder & Lightning, Prizm, etc.
└── templates-meta.json             # Template metadata for Generator UI

docs/
└── generator-ui.md                 # Generator UI documentation

prompts/
├── components/    # Modular pieces (backgrounds, poses, finishes)
├── templates/     # Full card templates (hero + villain variants)
└── generated/     # Ready-to-use prompts

output/
├── cards/         # Generated images (organized by pairing)
├── motion/        # Video files
├── test-runs/     # Style testing & generation log
└── social/        # Platform-ready assets

visualizer/        # Card review & feedback system
├── server.js      # Express API server
├── public/        # Frontend (HTML/CSS/JS)
└── data/          # Manifest & feedback JSON
```

## All 19 Pairings

### Original 5 (Priority)
| Player | Figure | Era | Connection |
|--------|--------|-----|------------|
| Michael Jordan | Moses | 90s | Led people through wilderness to promised land |
| LeBron James | King David | 2010s | From humble beginnings to greatest king |
| Scottie Pippen | Aaron | 90s | Moses's essential partner, underrated |
| Kobe Bryant | Joshua | 2000s | Succeeded Moses, conquered the land |
| Stephen Curry | Elijah | 2010s | Brought fire from heaven, changed everything |

### Heroes (9)
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

### Villains/Antagonists (5)
| Player | Figure | Era | Connection |
|--------|--------|-----|------------|
| Isiah Thomas | Pharaoh | 80s | Ruled with iron fist |
| Bill Laimbeer | Haman | 80s | Schemer, villain everyone loved to hate |
| Dennis Rodman | Esau | 90s | Wild, impulsive, lived by his own rules |
| Draymond Green | Joab | 2010s | Did the dirty work |
| Larry Bird | Jacob | 80s | Strategic, wrestled his way to greatness |

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

### Complete Inventory (19 players, 19 figures)

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

### Complete Inventory (19 figures)

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
- **Pairing Selection** - Grouped by Heroes/Villains, sorted by priority
- **Template Selection** - All 6 templates with era badges and dark mode indicators
- **Dark Mode Toggle** - Auto-detects villain pairings (shows "AUTO" badge), can override
- **Pose Selection** - Player and figure poses loaded from pose database
- **Hair Color** - Shows for Rodman only, override default hair color
- **Regenerate** - Create new card with same settings
- **Quick Pose Swap** - Try different poses without changing other settings

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Generate card |
| `Escape` | Close modals |

### Pairing Type Field
All pairing JSON files now include a `type` field:
- `"type": "hero"` - 14 hero pairings
- `"type": "villain"` - 5 villain pairings

This enables grouped dropdowns and automatic dark mode detection.

**Full documentation:** `docs/generator-ui.md`

## Quick Commands

```bash
# Start the card visualizer
cd visualizer && npm start

# Generate a card (basic)
node scripts/generate-card.js jordan-moses thunder-lightning

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

# Validate JSON data
node -e "require('./data/series/court-covenant/pairings/jordan-moses.json')"
```

## Environment Variables Needed

```
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
INSTAGRAM_ACCESS_TOKEN=your-long-lived-token
BUFFER_ACCESS_TOKEN=your-buffer-api-token  # For social scheduling
```

## Common Tasks

### Adding a New Pairing
1. Create `data/series/court-covenant/pairings/{player}-{figure}.json`
2. Add `poseFileId` to both player and figure objects
3. Run prompt generator
4. Test generate one card
5. Rate output, iterate if needed
6. Generate variants

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
