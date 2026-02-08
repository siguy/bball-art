# Visualizer Development

Local web app for reviewing generated cards, providing feedback, and exporting to platforms.

## Start Server

```bash
cd visualizer && npm start
# Opens at http://localhost:3333
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Card gallery with feedback & export |
| `/generator.html` | Card Generator UI (interactive control panel) |
| `/pairings.html` | Pairing management |
| `/export-queue.html` | Export queue management |
| `/characters.html` | Character browser |

## Key Files

```
visualizer/
├── server.js                 # Express API with series support
├── public/
│   ├── series-selector.js    # Global series selector component
│   ├── index.html            # Card gallery
│   ├── generator.html        # Generator UI
│   └── *.js                  # Frontend modules
├── lib/
│   ├── image-processor.js    # Sharp-based resize/format
│   ├── caption-generator.js  # Template-based captions
│   ├── buffer-client.js      # Buffer API wrapper
│   ├── feedback-formatter.js # Format feedback for Claude Code
│   └── history-manager.js    # Version tracking for card iterations
└── data/
    ├── manifest.json         # Auto-generated card index
    ├── feedback.json         # User feedback (auto-saved)
    ├── card-history.json     # Version history for iterations
    ├── export-queue.json     # Export queue storage
    ├── export-config.json    # Platform configs
    └── caption-templates.json # Caption templates + hashtags
```

## API Endpoints

### Core
- `GET /api/manifest` - Rebuilds and returns card index
- `GET /api/feedback` - All feedback data
- `POST /api/feedback/:cardId` - Save feedback for a card
- `GET /api/pairings` - Pairing metadata
- `GET /api/pairings-full` - Full pairing data with poses

### Series
- `GET /api/series` - List all available series
- `GET /api/series/:seriesId` - Get specific series config

All endpoints support `?series=` parameter for filtering.

### Caption
- `GET /api/caption/templates` - Available caption templates
- `POST /api/caption/generate` - Generate caption from template
- `GET /api/caption/quotes/:figureId` - Quotes for a figure
- `GET /api/caption/poses/:type/:poseFileId` - Poses for a character

### Export
- `GET /api/export/queue` - Get export queue
- `POST /api/export/queue` - Add to queue
- `PUT /api/export/queue/:id` - Update queue item
- `DELETE /api/export/queue/:id` - Remove from queue
- `POST /api/export/process` - Process all pending
- `POST /api/export/single` - Export single card immediately
- `GET /api/export/config` - Export configuration

### Buffer (Social Scheduling)
- `GET /api/buffer/status` - Check Buffer configuration
- `GET /api/buffer/profiles` - Get connected profiles
- `POST /api/buffer/post` - Schedule post to Buffer

### Generator (Pose-Controlled)
- `GET /api/poses/players` - List all players with pose files
- `GET /api/poses/figures` - List all figures with pose files
- `GET /api/poses/players/:id` - Get player poses by poseFileId
- `GET /api/poses/figures/:id` - Get figure poses by poseFileId
- `GET /api/templates` - List available templates with metadata
- `POST /api/generate-with-poses` - Full pose-controlled generation

### Version History
- `GET /api/cards/:cardId/version` - Get version info for a card
- `GET /api/cards/:cardId/versions` - Get all versions for a card grouping
- `POST /api/cards/:cardId/versions` - Add a card to version history
- `GET /api/cards/compare` - Compare two versions (`?baseId=X&v1=1&v2=2`)
- `POST /api/cards/history/populate` - Populate history from existing manifest

## Real-Time Feedback System

Send feedback directly to Claude Code for prompt adjustments.

### Feedback Fields

| Field | Description |
|-------|-------------|
| `rating` | loved, liked, issues |
| `notes` | Free-text feedback |
| `scope` | card, template, pairing, global |
| `categories` | composition, colors, poses, style, characters, text |

### Scope Options

| Scope | Meaning |
|-------|---------|
| `card` | This specific card only |
| `template` | All cards using this template |
| `pairing` | All cards with this pairing |
| `global` | All future card generations |

### Send to Claude

Click "Send to Claude" button to copy formatted feedback to clipboard. Paste into Claude Code to get prompt adjustments.

**Output format:**
```markdown
## Card Feedback: jordan-moses (thunder-lightning)

**Rating:** Issues
**Scope:** Template-wide
**Categories:** Style, Composition

**Feedback:** "Lightning needs to be more dramatic"

**Parameters:**
- Pairing: Michael Jordan & Moses
- Template: thunder-lightning
- Player pose: tongue-out-dunk
- Figure pose: parting-sea

**Prompt file:** `output/cards/court-covenant/jordan-moses/thunder-lightning-2026-01-30T12-00-00-prompt.txt`

**Regenerate:**
node scripts/generate-with-poses.js jordan-moses thunder-lightning \
  --player-pose tongue-out-dunk --figure-pose parting-sea
```

### Version History

Cards are grouped by pairing+template. When regenerating after feedback:
1. New card is automatically tracked as next version
2. Version navigator shows "v2 of 3" with prev/next buttons
3. Compare button shows side-by-side view of versions
4. Feedback notes from previous version shown in comparison

**Populating history for existing cards:**
```bash
curl -X POST http://localhost:3333/api/cards/history/populate
```

## Multi-Platform Export

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
| `minimal` | Just "Player x Figure" |

### Export Flow

1. Open card in visualizer modal
2. Select destinations (Website / Instagram / Twitter)
3. Choose caption template and generate
4. Edit caption as needed
5. "Export Now" for immediate export, or "Add to Queue"
6. Process queue from Export Queue page

## Generator UI

Full documentation: `docs/generator-ui.md`

### Features
- Mode toggle (Pairing / Solo Character)
- Pairing selection grouped by Heroes/Villains
- Template selection with era badges
- Dark mode auto-detection for villains
- Pose selection from database
- Hair color override (Rodman only)

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Generate card |
| `Escape` | Close modals |

## Series Selector

Global series selector in header:
- **Dynamically populated** from `/api/series` endpoint
- Falls back to hardcoded `SERIES_CONFIG` if API unavailable
- Stored in localStorage, persists across sessions
- All pages filter by selected series

Series are auto-discovered from `data/series/` on startup.

**Adding a new series:** Just create the series in `data/series/`. The dropdown will automatically include it on next page load.

## Card Modes

The visualizer supports three card modes, determined by `card.mode`:

| Mode | `characterType` | Description | Regenerate Script |
|------|-----------------|-------------|-------------------|
| `pairing` | N/A | Two characters (player+figure or figure+figure) | `generate-with-poses.js` |
| `solo` | `player` | Single NBA player | `generate-solo.js` |
| `solo` | `figure` | Single biblical figure | `generate-solo.js` |
| `solo` | `founder` | Single founding father portrait | `generate-founder.js` |

### Founder Cards (Founding Fathers Series)

Founder cards are treated as solo cards with `characterType: 'founder'`:
- Detected by `series === 'founding-fathers'` or `parsed.format === 'founder'`
- Display shows: 🏛️ icon, founder name, artistic layer
- Feedback shows: "Mode: Founder Portrait", "Layer: colonial", etc.
- Regenerate command uses `generate-founder.js` with `--custom` flag

**Filename format:** `ff_george-washington_pt_colonial_default_2026-02-01T0533.jpeg`
- `ff` = series (founding-fathers)
- `george-washington` = founder ID
- `pt` = template (portrait-transformation)
- `colonial` = layer (artistic style)
- `default` = pose

## Development Guidelines

### Dynamic Over Hardcoded

**Rule:** When building UI components that display enumerated options (series, templates, card types), always fetch dynamically from the API rather than hardcoding.

**Why:** Hardcoded lists cause "I added X to the backend but it doesn't show in the UI" bugs. The series selector was originally hardcoded with just Court & Covenant and Torah Titans - adding Founding Fathers to the backend didn't make it appear until we made the dropdown dynamic.

**Pattern:**
```javascript
// BAD: Hardcoded options
const options = ['court-covenant', 'torah-titans'];

// GOOD: Fetch from API with fallback
let options = FALLBACK_CONFIG;
try {
  const response = await fetch('/api/series');
  if (response.ok) options = await response.json();
} catch (e) {
  console.warn('Using fallback config');
}
```

### Adding New Card Types

When adding a new card type (like founders), check these locations:
1. `server.js` → `parseCardFilename()` - filename pattern
2. `server.js` → `scanCardDirectory()` - mode/type detection
3. `app.js` → `renderGallery()` - display title/icon
4. `app.js` → `openModal()` - modal labels
5. `app.js` → `generateRegenerateCommand()` - correct CLI command
6. `app.js` → `formatFeedbackForClaude()` - feedback parameters
7. `lib/feedback-formatter.js` - server-side feedback (same changes)
