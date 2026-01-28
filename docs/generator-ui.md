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

### Pairing Selection
- Pairings are grouped by type (Heroes / Villains)
- Sorted by priority
- Shows connection info and narrative when selected

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
Generate a card with full pose control.

**Request:**
```json
{
  "pairingId": "jordan-moses",
  "template": "thunder-lightning",
  "darkMode": false,
  "playerPose": "tongue-out-dunk",
  "figurePose": "parting-sea",
  "hairColor": null
}
```

**Response:**
```json
{
  "success": true,
  "filename": "thunder-lightning-2026-01-27T10-30-00.jpeg",
  "cardId": "jordan-moses-thunder-lightning-2026-01-27T10-30-00",
  "pairingId": "jordan-moses",
  "template": "thunder-lightning",
  "playerPose": "tongue-out-dunk",
  "figurePose": "parting-sea"
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

## Future Enhancements

### Solo Character Mode (Planned)
- Toggle between "Pairing Mode" and "Solo Character"
- Generate single-character cards
- Same template and pose selection

### Villain Filter System (Planned)
- Consolidate dark templates into filter approach
- Any template can work with dark mode toggle
- Reduce code duplication

### Regeneration from Gallery (Planned)
- Regenerate cards directly from gallery modal
- Quick pose swap from feedback view
- Track generation settings in card metadata
