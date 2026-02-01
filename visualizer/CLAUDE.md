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
- Stored in localStorage
- Persists across sessions
- All pages filter by selected series

Series are auto-discovered from `data/series/` on startup.
