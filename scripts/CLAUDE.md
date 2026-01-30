# Script Development

Card generation scripts and shared libraries.

## Environment Variables

```bash
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
BUFFER_ACCESS_TOKEN=your-buffer-api-token  # For social scheduling
```

## Shared Libraries (`scripts/lib/`)

| Module | Purpose |
|--------|---------|
| `config.js` | Centralized paths, defaults, series auto-discovery |
| `data-loader.js` | Load pairings, characters, poses, quotes across series |
| `template-loader.js` | Load templates with series-specific fallback |
| `filename-builder.js` | Generate standardized output filenames |

### Key Functions

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

## CLI Commands

### Card Generation

```bash
# Basic generation (auto-detects series)
node scripts/generate-card.js jordan-moses thunder-lightning

# Explicit series
node scripts/generate-card.js jordan-moses thunder-lightning --series court-covenant

# With specific interaction
node scripts/generate-card.js curry-elijah thunder-lightning --interaction fire-rain

# Pose-controlled (recommended for villains)
node scripts/generate-with-poses.js rodman-esau thunder-lightning-dark \
  --player-pose diving-loose-ball --figure-pose drawing-bow

# List available poses
node scripts/generate-with-poses.js isiah-pharaoh --list-poses

# Dry run (show prompt only)
node scripts/generate-with-poses.js shaq-goliath beam-team-shadow \
  --player-pose backboard-breaking --figure-pose champion-challenge --dry-run

# Hair color override (Rodman)
node scripts/generate-with-poses.js rodman-esau thunder-lightning-dark \
  --player-pose diving-loose-ball --figure-pose drawing-bow --hair green
```

### Torah Titans (Figure-Figure)

```bash
# Spouse pairing
node scripts/generate-card.js abraham-sarah spouse-blessing --series torah-titans

# Plague card
node scripts/generate-card.js moses-pharaoh plague-card --series torah-titans
```

### Solo Characters

```bash
# Solo player
node scripts/generate-solo.js player jordan thunder-lightning --pose tongue-out-dunk

# Solo figure
node scripts/generate-solo.js figure moses beam-team --pose parting-sea

# Solo figure for Torah Titans
node scripts/generate-solo.js figure abraham trial-card --pose binding-isaac --series torah-titans

# List poses
node scripts/generate-solo.js player curry --list-poses
node scripts/generate-solo.js figure elijah --list-poses

# Dry run
node scripts/generate-solo.js figure david kaboom --pose slinging-stone --dry-run
```

### Validation & Testing

```bash
# Validate all JSON data
node scripts/validate-data.js

# Verbose output
node scripts/validate-data.js --verbose

# Specific type only
node scripts/validate-data.js --type pairings   # pairings, poses, quotes, series

# Test solo characters (CLI only)
node scripts/test-solo-characters.js --cli

# All tests (requires server)
node scripts/test-solo-characters.js
```

## Common Flags

| Flag | Description |
|------|-------------|
| `--dry-run` | Show prompt without generating image |
| `--list-poses` | Show available poses for pairing/character |
| `--series X` | Explicit series (court-covenant, torah-titans) |
| `--hair X` | Hair color override (Rodman only) |
| `--interaction X` | Generic interaction pose |
| `--player-pose X` | Specific player pose ID |
| `--figure-pose X` | Specific figure pose ID |

## Script Files

| Script | Purpose |
|--------|---------|
| `generate-card.js` | Main card generation |
| `generate-with-poses.js` | Pose-controlled generation |
| `generate-solo.js` | Solo character cards |
| `validate-data.js` | JSON schema validation |
| `migrate-to-series.js` | Migration utility |
| `test-solo-characters.js` | Solo character tests |

## Adding a New Script

1. Import shared libraries:
```javascript
const { CONFIG, getOutputPath } = require('./lib/config');
const { loadPairing, findCharacterData } = require('./lib/data-loader');
const { loadTemplate } = require('./lib/template-loader');
```

2. Use CONFIG for paths:
```javascript
const posesDir = CONFIG.paths.poses;
const outputDir = getOutputPath(series, pairingId);
```

3. Handle series auto-discovery:
```javascript
const pairing = loadPairing(pairingId); // Auto-finds series
const series = pairing._series;
```
