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
- [x] **6 card templates working** (Thunder & Lightning, Downtown, Beam Team, Kaboom, Metal Universe, Prizm Silver)
- [x] Nano Banana Pro client working (`gemini-3-pro-image-preview`)
- [x] Logo concepts generated (gold + dark versions)
- [x] All era definitions (1970s-2020s)
- [x] Pose/interaction system (6 interactions)
- [x] **80+ cards generated!**
- [x] **Card Visualizer built** (local web app for review & feedback)

### In Progress
- [ ] Template refinement based on feedback
- [ ] Beam Team cards with updated prism template

### Up Next
- Phase 3: Social Media Strategy
- Phase 4: Website
- Phase 5: NBA Jam-Style Arcade Game

## Core Principles

1. **This is Art** - Stylized, transformative interpretations. No photos, no logos, no licensed materials.
2. **Build for Reuse** - Everything should work for future series.
3. **Document Everything** - Code explains "why", not just "what".

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
├── series/{series-name}/pairings/  # Player-figure pairings
├── eras/                           # 1970s-2020s definitions
├── card-brands/                    # Fleer, Topps, Panini, etc.
└── card-types/                     # Thunder & Lightning, Prizm, etc.

prompts/
├── components/    # Modular pieces (backgrounds, poses, finishes)
├── templates/     # Full card templates
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

## Card Templates (6)

| Template | Style | Key Visual Elements |
|----------|-------|---------------------|
| `thunder-lightning` | 90s Fleer Ultra | Electric gradient, lightning bolts, cosmic |
| `beam-team` | 90s Stadium Club | Holographic prism borders, rainbow refraction |
| `downtown` | 2010s Panini Optic | Neon city skyline, urban night scene |
| `kaboom` | 2010s Panini | Comic book/pop art, bold outlines |
| `metal-universe` | 90s Fleer Metal | Chrome, industrial, metallic |
| `prizm-silver` | 2010s Panini Prizm | Clean geometric, silver shimmer |

## Interactions/Poses (6)

| Interaction | Description | Best For |
|-------------|-------------|----------|
| `back-to-back` | Standing back-to-back, facing outward | Warriors, rivals |
| `side-by-side` | Standing together as equals | Kings, partners |
| `high-five` | Dynamic celebration | Visionaries, joy |
| `dap-up` | Casual fist bump/greeting | Humble legends |
| `simultaneous-action` | Both performing signature moves | Action cards |
| `fire-rain` | Curry shooting, Elijah calling fire | Curry/Elijah only |

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

# Generate a card (end-to-end)
node scripts/generate-card.js jordan-moses thunder-lightning

# Generate a prompt only (no API call)
node scripts/generate-card.js jordan-moses thunder-lightning --dry-run

# Generate with specific interaction pose
node scripts/generate-card.js curry-elijah thunder-lightning --interaction fire-rain

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
2. Run prompt generator
3. Test generate one card
4. Rate output, iterate if needed
5. Generate variants

### Adding a New Card Style
1. Create `data/card-types/{style-name}.json`
2. Add background to `prompts/components/backgrounds.js`
3. Create template in `prompts/templates/{style-name}.js`
4. Test with existing pairing

## Plan File Location

Full project plan: `/Users/simonbrief/.claude/plans/unified-frolicking-adleman.md`

## What NOT to Do

- Don't add NBA logos or team names
- Don't use real player photographs
- Don't over-engineer (keep it simple until needed)
- Don't batch generate before style testing
- Don't skip the rating/validation phase
