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

### In Progress
- [ ] Adding pose files for remaining characters (heroes)
- [ ] Merging villain-template-refactor branch

### Up Next
- Phase 3: Social Media Strategy
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
├── series/{series-name}/pairings/  # Player-figure pairings (with poseFileId)
├── poses/
│   ├── players/                    # Character-specific player poses
│   └── figures/                    # Character-specific figure poses
├── quotes/
│   └── figures/                    # Biblical quotes by character
├── eras/                           # 1970s-2020s definitions
├── card-brands/                    # Fleer, Topps, Panini, etc.
└── card-types/                     # Thunder & Lightning, Prizm, etc.

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

### Structure
```
data/poses/
├── players/
│   ├── rodman.json      # diving-loose-ball, tipping-rebound, etc.
│   ├── shaq.json        # backboard-breaking, dudley-poster, etc.
│   ├── isiah-thomas.json
│   ├── laimbeer.json
│   ├── draymond.json
│   └── bird.json
└── figures/
    ├── esau.json        # drawing-bow, chugging-soup, etc.
    ├── goliath.json     # champion-challenge, spear-thrust, etc.
    ├── pharaoh.json
    ├── haman.json
    ├── joab.json
    └── jacob.json
```

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

### Structure
```
data/quotes/figures/
├── esau.json     # birthright-sold, red-stew, blessing-stolen, etc.
├── goliath.json  # choose-a-man, am-i-a-dog, give-flesh-to-birds, etc.
├── pharaoh.json
├── haman.json
├── joab.json
└── jacob.json
```

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

A local web app for reviewing generated cards and providing feedback.

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

**API Endpoints:**
- `GET /api/manifest` - Rebuilds and returns card index
- `GET /api/feedback` - All feedback data
- `POST /api/feedback/:cardId` - Save feedback for a card
- `GET /api/pairings` - Pairing metadata

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
