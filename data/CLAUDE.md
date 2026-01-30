# Data Structure

All card data lives here: pairings, poses, quotes, characters, and schemas.

## Directory Layout

```
data/
├── series/                    # Multi-series support
│   ├── court-covenant/        # NBA + Biblical pairings
│   │   ├── series-config.json
│   │   └── pairings/*.json
│   └── torah-titans/          # Bible-only (Jewish focus)
│       ├── series-config.json
│       ├── pairings/*.json
│       └── sub-series/        # Themed groupings
├── poses/
│   ├── players/               # Player pose files
│   └── figures/               # Figure pose files
├── characters/                # Standalone characters (not in pairings)
│   ├── players/
│   └── figures/
├── quotes/
│   └── figures/               # Biblical quotes by character
├── schemas/                   # JSON Schema validation
└── templates-meta.json        # Template metadata
```

## Multi-Series Support

Series are auto-discovered from `data/series/`. A directory is recognized as a series if it contains:
- A `pairings/` subdirectory, OR
- A `series-config.json` file

### Available Series

| Series | ID | Card Modes |
|--------|-----|------------|
| Court & Covenant | `court-covenant` | player-figure, solo |
| Torah Titans | `torah-titans` | figure-figure, solo-figure, multi-figure |

### Adding a New Series

1. Create directory: `data/series/{series-id}/`
2. Add `series-config.json` with series metadata
3. Add `pairings/` subdirectory with pairing JSON files
4. Add series abbreviation to `SERIES_ABBREV_REVERSE` in `visualizer/server.js`
5. Restart visualizer - new series is auto-discovered

## Pairing JSON Format

Required fields (see `data/schemas/pairing.schema.json`):

```json
{
  "id": "jordan-moses",
  "series": "court-covenant",
  "type": "hero",
  "cardMode": "player-figure",
  "player": {
    "name": "Michael Jordan",
    "poseFileId": "jordan",
    "characterType": "player"
  },
  "figure": {
    "name": "Moses",
    "poseFileId": "moses",
    "characterType": "figure",
    "era": "Biblical"
  }
}
```

**Key fields:**
- `type`: `"hero"` or `"villain"` - determines template suggestions
- `cardMode`: `"player-figure"`, `"figure-figure"`, `"solo"`, etc.
- `poseFileId`: Links to pose file (e.g., `"jordan"` -> `data/poses/players/jordan.json`)

## Pose File Format

```json
{
  "id": "jordan",
  "name": "Michael Jordan",
  "defaultPose": "tongue-out-dunk",
  "poses": {
    "tongue-out-dunk": {
      "id": "tongue-out-dunk",
      "name": "Tongue Out Dunk",
      "description": "Iconic flying dunk with tongue out",
      "prompt": "mid-air dunk, tongue extended, one hand on ball...",
      "energy": "legendary, unstoppable"
    }
  },
  "hairColors": {
    "red": "bright red wild hair"
  }
}
```

**For figures**, poses can link to quotes:
```json
{
  "parting-sea": {
    "prompt": "arms raised, staff extended over parting waters...",
    "quoteId": "parting-the-sea"
  }
}
```

## Quote File Format

Located in `data/quotes/figures/{figureId}.json`:

```json
{
  "parting-the-sea": {
    "source": "Exodus 14:21",
    "context": "Moses parts the Red Sea",
    "hebrew": "וַיֵּט מֹשֶׁה אֶת יָדוֹ עַל הַיָּם",
    "english": "And Moses stretched out his hand over the sea",
    "mood": "triumphant, miraculous"
  }
}
```

## Torah Titans Specifics

For figure-vs-figure pairings (Torah Titans series):

**Important:**
- Both `player` and `figure` objects must have `characterType: "figure"`
- Both must have `era: "Biblical"` for correct badge display
- Both must have `poseFileId` pointing to files in `data/poses/figures/`

### Card Types

| Type | Description | Example |
|------|-------------|---------|
| `rivalry` | Hero vs Villain confrontation | David vs Goliath |
| `spouse` | Husband & wife partnership | Abraham & Sarah |
| `trial` | Character facing a test | Abraham's 10 Trials |
| `multi` | 3+ characters | Jacob-Rachel-Leah |
| `plague` | Moses vs Pharaoh + plague | Blood, Frogs, etc. |

## File Naming Convention

Generated cards use this format:
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
| | | | beam-team | bt |
| | | | beam-team-shadow | bts |
| | | | metal-universe | mu |

## Validation

```bash
# Validate all data
node scripts/validate-data.js

# Verbose output
node scripts/validate-data.js --verbose

# Specific type only
node scripts/validate-data.js --type pairings
```

Schemas enforce:
- Required fields (`id`, `series`, `type` for pairings)
- Valid enums (`cardMode`, `characterType`)
- Pattern matching (kebab-case IDs)
- Reference integrity (warns about missing pose files)

## Adding New Content

### New Pairing
Full guide: `data/series/court-covenant/pairings/NEW-PAIRINGS.md`

1. Create pairing JSON in appropriate series folder
2. Create player pose file (if new player)
3. Create figure pose file (if new figure)
4. Create figure quotes file (if new figure)
5. Validate: `node scripts/validate-data.js`

### New Poses
1. Add to existing pose file or create new one
2. Include `id`, `name`, `description`, `prompt`, `energy`
3. For figures, add `quoteId` to link to quotes

### New Quotes
1. Create or edit `data/quotes/figures/{figureId}.json`
2. Include `source`, `context`, `hebrew`, `english`, `mood`

### Standalone Character
For characters not in any pairing:

1. Create `data/characters/{players|figures}/{id}.json`
2. Create corresponding pose file
3. For figures: create quotes file

Full guide: `docs/solo-characters.md`
