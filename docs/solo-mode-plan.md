# Solo Character Mode - Implementation Plan

**Status**: Planned (Phase 2)

## Overview

Add single-character card generation to the existing Generator UI, allowing players OR biblical figures to be featured alone rather than as pairings.

---

## UI Changes

### Mode Toggle
- Add toggle in Generator: "Pairing Mode" vs "Solo Character"
- When Solo is selected:
  - Hide pairing dropdown
  - Show character type selector (Player / Figure)
  - Show single character dropdown populated based on type

### Shared Controls
- Same template selection (6 templates)
- Same pose selection (from character's pose file)
- Same Dark Mode toggle
- Same hair color option (for Rodman)

---

## New Script

Create `scripts/generate-solo.js` for command-line solo card generation:

```bash
# Generate solo player card
node scripts/generate-solo.js player jordan thunder-lightning --pose tongue-out-dunk

# Generate solo figure card
node scripts/generate-solo.js figure moses beam-team --pose parting-sea

# List poses for a character
node scripts/generate-solo.js player curry --list-poses
```

---

## Template Updates

Add `generateSolo(character, options)` method to each template in `prompts/templates/`:

| Template | File |
|----------|------|
| Thunder & Lightning | `thunder-lightning.js` |
| Beam Team | `beam-team.js` |
| Metal Universe | `metal-universe.js` |
| Downtown | `downtown.js` |
| Kaboom | `kaboom.js` |
| Prizm Silver | `prizm-silver.js` |

### Method Signature
```javascript
generateSolo(character, options = {}) {
  // character: { type: 'player'|'figure', data: {...}, pose: {...} }
  // options: { darkMode: boolean, hairColor: string }
  return promptString;
}
```

---

## API Endpoints

Add to `visualizer/server.js`:

```
GET  /api/characters/players    - List all players (id, name, poseFileId)
GET  /api/characters/figures    - List all figures (id, name, poseFileId)
POST /api/generate-solo         - Generate single character card
```

---

## Style Discovery (Pre-Implementation)

Before building the full feature, test different visual approaches:

### Option 1: Existing Templates
Use current templates with single character. May feel empty or unbalanced without the second figure.

### Option 2: Portrait/Icon Style
Tighter crop, more focus on the character. Think sports card headshots or icon-style illustrations.

### Option 3: Storybook Illustration
Full scene with character in action, more environmental storytelling. Character is the sole focus but context fills the frame.

### Evaluation Criteria
- Does the composition feel complete?
- Does it maintain the series aesthetic?
- Does it work for both players and figures?

---

## Output Organization

Solo cards saved to:
```
output/cards/solo/
├── players/
│   ├── jordan/
│   ├── lebron/
│   └── ...
└── figures/
    ├── moses/
    ├── david/
    └── ...
```

---

## Implementation Steps

1. **Style Testing** - Generate test cards manually with modified prompts
2. **User Evaluation** - Pick preferred visual direction
3. **Script Creation** - Build `generate-solo.js`
4. **Template Methods** - Add `generateSolo()` to all 6 templates
5. **API Endpoints** - Add solo generation endpoints
6. **UI Integration** - Add mode toggle and character selection to Generator
7. **Documentation** - Update CLAUDE.md and generator-ui.md

---

## Dependencies

- Existing pose database (`data/poses/players/`, `data/poses/figures/`)
- Existing template system (`prompts/templates/`)
- Generator UI (completed in Phase 1)
