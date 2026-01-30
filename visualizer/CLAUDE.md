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
│   └── buffer-client.js      # Buffer API wrapper
└── data/
    ├── manifest.json         # Auto-generated card index
    ├── feedback.json         # User feedback (auto-saved)
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
