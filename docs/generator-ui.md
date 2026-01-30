# Card Generator UI

**Feature Branch:** `feature/generator-ui`
**Added:** January 2026

## Overview

The Card Generator UI is an interactive control panel for creating Court & Covenant cards. It provides a visual interface for selecting pairings, templates, poses, and generating cards without using the command line.

## Accessing the Generator

Start the visualizer and navigate to the Generator page:

```bash
cd visualizer && npm start
# Open http://localhost:3333/generator.html
```

Or click "Generator" in the navigation bar from any visualizer page.

## Features

### Series Selector
The generator respects the global series selector in the header:
- **Court & Covenant**: NBA players + Biblical figures (player-figure mode)
- **Torah Titans**: Biblical figure vs figure (figure-figure mode)

Switching series:
- Reloads pairings for the selected series
- Adjusts available options (e.g., hides NBA Players in solo mode for Torah Titans)
- Persists selection across pages via localStorage

### Mode Toggle
The generator supports two modes:
- **Pairing Mode**: Generate cards with two characters
- **Solo Mode**: Generate cards with a single character

Switch between modes using the toggle at the top of the control panel.

### Pairing Selection (Pairing Mode)
- Pairings grouped by type:
  - **Court & Covenant**: Heroes / Villains
  - **Torah Titans**: Spouses / Rivalries / Trials / Plagues / Multi-Character
- Sorted by priority
- Shows connection info and narrative when selected

### Figure-Figure Mode (Torah Titans)
When a Torah Titans pairing is selected:
- **Dynamic pose labels**: Shows character names (e.g., "Abraham Pose", "Sarah Pose") instead of "Player Pose" / "Figure Pose"
- **Both poses from figures**: Loads both character poses from `data/poses/figures/`
- **Dark mode auto-detection**: Enables for `rivalry`, `trial`, and `plague` types

### Solo Character Selection (Solo Mode)
1. **Character Type**: Choose between NBA Player or Biblical Figure
2. **Character**: Select from the list of available characters
3. **Pose**: Select from character-specific poses

**Character sources:**
- Characters from existing pairings (automatically available)
- Standalone character files in `data/characters/{players|figures}/`
- See `docs/solo-characters.md` for creating standalone characters

Solo cards feature:
- Single character centered on the card (~80% vertical space)
- All templates support solo mode with appropriate adjustments
- Same pose database as pairing mode
- Hair colors available for applicable characters (e.g., Rodman)

### Template Selection
- All 6 templates available with era badges
- Shows template description and style info
- Indicates which templates have dark mode variants

### Dark Mode Toggle
- **Auto-detection**: Automatically enables dark mode for villain pairings
- Shows "AUTO" badge when auto-detected
- Can be manually overridden for any pairing
- When enabled, uses the dark variant of the selected template (if available)

### Pose Selection
- **Player Poses**: Populated from `data/poses/players/{poseFileId}.json`
- **Figure Poses**: Populated from `data/poses/figures/{poseFileId}.json`
- Shows pose descriptions and energy when selected
- Default pose used if none selected

### Hair Color (Rodman only)
- Appears automatically when Rodman is selected
- Options loaded from his pose file's `hairColors` property
- Can override the default hair color from the selected pose

### Generation
- **Generate Card**: Creates a new card with current settings
- **Regenerate**: Creates another card with the same settings (new roll)
- Shows generation log with output
- Displays result immediately after generation

### Quick Pose Swap
- After generating, click "Quick Pose Swap" to try different poses
- Keeps all other settings the same
- Fast iteration on pose combinations

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Generate card |
| `Escape` | Close modals |

## API Endpoints

The generator uses these new API endpoints:

### GET /api/poses/players
Lists all players with pose files.

**Response:**
```json
[
  {
    "id": "jordan",
    "name": "Michael Jordan",
    "defaultPose": "tongue-out-dunk",
    "poseCount": 6,
    "hasHairColors": false
  }
]
```

### GET /api/poses/figures
Lists all figures with pose files.

**Response:**
```json
[
  {
    "id": "moses",
    "name": "Moses",
    "defaultPose": "parting-sea",
    "poseCount": 6
  }
]
```

### GET /api/poses/players/:id
Get all poses for a specific player.

**Response:** Full pose file JSON including all poses and hair colors (if applicable).

### GET /api/poses/figures/:id
Get all poses for a specific figure.

**Response:** Full pose file JSON including all poses.

### GET /api/templates
Get template metadata.

**Response:**
```json
{
  "templates": {
    "thunder-lightning": {
      "id": "thunder-lightning",
      "name": "Thunder & Lightning",
      "description": "...",
      "era": "1990s",
      "hasDarkMode": true,
      "darkVariantId": "thunder-lightning-dark"
    }
  },
  "darkVariants": {...}
}
```

### POST /api/generate-with-poses
Generate a pairing card with full pose control.

**Request:**
```json
{
  "pairingId": "jordan-moses",
  "template": "thunder-lightning",
  "darkMode": false,
  "playerPose": "tongue-out-dunk",
  "figurePose": "parting-sea",
  "hairColor": null,
  "cardMode": "player-figure",
  "series": "court-covenant"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| pairingId | Yes | Pairing ID |
| template | Yes | Template ID |
| darkMode | No | Use dark variant if available |
| playerPose | No | Player/Figure1 pose ID (default: "default") |
| figurePose | No | Figure/Figure2 pose ID (default: "default") |
| hairColor | No | Hair color override (e.g., Rodman) |
| cardMode | No | Card mode from pairing (e.g., "player-figure", "figure-figure") |
| series | No | Series ID (default: "court-covenant") |

**Response:**
```json
{
  "success": true,
  "filename": "thunder-lightning-2026-01-27T10-30-00.jpeg",
  "cardId": "jordan-moses-thunder-lightning-2026-01-27T10-30-00",
  "pairingId": "jordan-moses",
  "series": "court-covenant",
  "template": "thunder-lightning",
  "playerPose": "tongue-out-dunk",
  "figurePose": "parting-sea"
}
```

### GET /api/characters/players
Lists all unique players with metadata.

**Response:**
```json
[
  {
    "id": "jordan",
    "name": "Michael Jordan",
    "displayName": "MJ",
    "era": "1990s",
    "poseCount": 6,
    "hasHairColors": false
  }
]
```

### GET /api/characters/figures
Lists all unique figures with metadata.

**Response:**
```json
[
  {
    "id": "moses",
    "name": "Moses",
    "displayName": "Moses",
    "poseCount": 6
  }
]
```

### POST /api/generate-solo
Generate a solo character card.

**Request:**
```json
{
  "type": "player",
  "characterId": "jordan",
  "template": "thunder-lightning",
  "pose": "tongue-out-dunk",
  "hairColor": null,
  "series": "court-covenant"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| type | Yes | "player" or "figure" |
| characterId | Yes | Character ID |
| template | Yes | Template ID |
| pose | No | Pose ID (default: "default") |
| hairColor | No | Hair color override |
| series | No | Series ID (default: "court-covenant") |

**Response:**
```json
{
  "success": true,
  "filename": "thunder-lightning-2026-01-27T10-30-00.jpeg",
  "cardId": "solo-player-jordan-thunder-lightning-2026-01-27T10-30-00",
  "series": "court-covenant",
  "type": "player",
  "characterId": "jordan",
  "template": "thunder-lightning",
  "pose": "tongue-out-dunk"
}
```

## Data Changes

### Pairing Type Field
All pairing JSON files now include a `type` field:
- `"type": "hero"` - For 14 hero pairings
- `"type": "villain"` - For 5 villain pairings

This enables:
- Grouped dropdown options
- Auto-detection of dark mode
- Future filtering and categorization

### Templates Metadata
New file: `data/templates-meta.json`

Contains metadata for all templates including:
- Name and description
- Era classification
- Dark mode availability
- Color schemes for hero/villain variants
- Recommended use cases

## Files Created/Modified

### Created
- `visualizer/public/generator.html` - Generator page HTML
- `visualizer/public/generator.css` - Generator styles
- `visualizer/public/generator.js` - Generator logic
- `data/templates-meta.json` - Template metadata
- `docs/generator-ui.md` - This documentation

### Modified
- `visualizer/server.js` - Added new API endpoints
- `visualizer/public/index.html` - Added Generator nav link
- `visualizer/public/pairings.html` - Added Generator nav link
- `visualizer/public/export-queue.html` - Added Generator nav link
- All 19 pairing JSON files - Added `type` field

## Solo Cards Output Structure

Solo cards are saved alongside pairing cards in the same directory:

```
output/cards/
├── jordan-moses/                                  # Pairing cards
│   └── thunder-lightning-2026-01-27T10-30-00.jpeg
├── solo-player-jordan/                            # Solo player cards
│   └── thunder-lightning-2026-01-27T10-30-00.jpeg
├── solo-player-rodman/
│   └── metal-universe-dark-2026-01-27T10-35-00.jpeg
├── solo-figure-moses/                             # Solo figure cards
│   └── beam-team-2026-01-27T10-40-00.jpeg
└── solo-figure-elijah/
    └── kaboom-2026-01-27T10-45-00.jpeg
```

## CLI Script for Solo Cards

```bash
# Generate player solo card
node scripts/generate-solo.js player jordan thunder-lightning --pose tongue-out-dunk

# Generate figure solo card
node scripts/generate-solo.js figure moses beam-team --pose parting-sea

# With hair color (Rodman)
node scripts/generate-solo.js player rodman metal-universe-dark --pose diving-loose-ball --hair green

# List available poses
node scripts/generate-solo.js player curry --list-poses

# Dry run (show prompt only)
node scripts/generate-solo.js figure elijah kaboom --pose calling-fire --dry-run
```

## Future Enhancements

### Villain Filter System (Planned)
- Consolidate dark templates into filter approach
- Any template can work with dark mode toggle
- Reduce code duplication

### Regeneration from Gallery (Planned)
- Regenerate cards directly from gallery modal
- Quick pose swap from feedback view
- Track generation settings in card metadata
