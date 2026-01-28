# Solo Characters Guide

A comprehensive guide for researching, creating, and testing standalone solo characters for Court & Covenant.

---

## Table of Contents

1. [Overview](#overview)
2. [When to Use Solo vs Pairing](#when-to-use-solo-vs-pairing)
3. [Two Paths to Solo Characters](#two-paths-to-solo-characters)
4. [Research Process](#research-process)
5. [File Templates](#file-templates)
6. [Testing Your Character](#testing-your-character)
7. [Resources](#resources)

---

## Overview

Solo cards feature a **single character** (NBA player OR biblical figure) centered on the card, taking up approximately 80% of the vertical space. Unlike pairings, there's no interaction between two characters - just one character in their signature moment.

**Use cases:**
- Character study cards focusing on one iconic figure
- Standalone promotional cards
- Template testing with simpler composition
- Characters that don't have a natural pairing yet

---

## When to Use Solo vs Pairing

| Use Solo When... | Use Pairing When... |
|------------------|---------------------|
| Showcasing a single iconic moment | Two characters have a clear thematic connection |
| The character has no natural biblical counterpart | The narrative works better with interaction |
| Testing new poses or templates | You want conversation/contrast between characters |
| Creating character study series | The connection enhances both figures |

---

## Two Paths to Solo Characters

Solo characters can come from two sources:

### Path 1: Characters from Existing Pairings

If the character already exists in a pairing file, you only need:
1. A pose file (`data/poses/players/{id}.json` or `data/poses/figures/{id}.json`)
2. For figures: a quotes file (`data/quotes/figures/{id}.json`)

The system will automatically pull character metadata (physicalDescription, etc.) from the pairing.

**Example:** Jordan already exists in `jordan-moses.json`, so you can generate solo Jordan cards without creating any new files.

### Path 2: Standalone Character Files

For characters that don't exist in any pairing, create a standalone character file:
- Players: `data/characters/players/{id}.json`
- Figures: `data/characters/figures/{id}.json`

Plus the standard pose file (and quotes file for figures).

---

## Research Process

### Step 1: Player Research

Gather the following for each NBA player:

```
[ ] Full name and common nicknames
[ ] Position and jersey number(s)
[ ] Era (decade they were dominant)
[ ] Team(s) associated with
[ ] Physical description (height, build, distinguishing features)
[ ] 4-6 signature moves/poses
[ ] Playing style archetype
[ ] Key career moments
[ ] Championships/major awards
[ ] Jersey colors (primary and secondary)
```

**Sources:**
- Basketball Reference (stats, accolades)
- YouTube (signature moves, celebrations)
- Wikipedia (career narrative)
- Sports Illustrated / ESPN articles (personality, style)

### Step 2: Figure Research

Gather the following for each biblical figure:

```
[ ] Primary biblical source (book/chapter)
[ ] Key story moments
[ ] Physical description (if available)
[ ] Attribute/item associated with them
[ ] Clothing/visual style
[ ] Archetype (leader, warrior, prophet, etc.)
[ ] 5-8 quotable verses (Hebrew + English)
[ ] Emotional range (moods across their story)
```

**Sources:**
- Sefaria.org (primary texts, translations)
- Jewish Encyclopedia
- Torah.org commentaries
- Wikipedia (overview)

### Step 3: Pose Selection

For solo cards, choose poses that:
- Work well as a standalone centerpiece
- Show the character's most iconic moment
- Have strong visual composition
- Convey clear energy/mood

---

## File Templates

### Standalone Player File

Create at: `data/characters/players/{id}.json`

```json
{
  "id": "{id}",
  "name": "Full Player Name",
  "displayName": "Nickname",
  "poseFileId": "{id}",
  "era": "1990s",
  "jerseyColors": {
    "primary": { "base": "color", "accent": "color" },
    "secondary": { "base": "color", "accent": "color" }
  },
  "signatureMoves": ["move1", "move2", "move3"],
  "physicalDescription": "height, build, distinguishing features",
  "archetype": "One-line description of their basketball identity"
}
```

### Standalone Figure File

Create at: `data/characters/figures/{id}.json`

```json
{
  "id": "{id}",
  "name": "Figure Name",
  "displayName": "Figure Name",
  "poseFileId": "{id}",
  "attribute": "key item they carry",
  "attributeDescription": "detailed description of the item",
  "visualStyle": "overall aesthetic",
  "clothing": "what they wear",
  "physicalDescription": "detailed physical appearance",
  "anatomyNote": "important: two arms, etc.",
  "archetype": "One-line description of their biblical role"
}
```

### Player Pose File

Create at: `data/poses/players/{poseFileId}.json`

```json
{
  "id": "{poseFileId}",
  "name": "Full Player Name",
  "defaultPose": "signature-pose-id",
  "description": "Height, position, key stats, personality traits",
  "poses": {
    "signature-pose-id": {
      "id": "signature-pose-id",
      "name": "Pose Display Name",
      "description": "When/what this pose represents",
      "expression": "facial expression and emotion",
      "prompt": "detailed visual description for image generation - body position, movement, energy, specific details",
      "energy": "two-word mood description"
    }
  },
  "hairColors": {
    "red": "bright red wild hair",
    "green": "neon green wild hair"
  }
}
```

Note: `hairColors` is optional, used only for characters like Rodman with signature hair color variations.

### Figure Pose File

Create at: `data/poses/figures/{poseFileId}.json`

```json
{
  "id": "{poseFileId}",
  "name": "Figure Name",
  "defaultPose": "signature-pose-id",
  "description": "Who they are, their role in the story",
  "poses": {
    "signature-pose-id": {
      "id": "signature-pose-id",
      "name": "Pose Display Name",
      "description": "The moment this represents",
      "expression": "facial expression and emotion",
      "prompt": "detailed visual description - body position, clothing, attribute, specific details",
      "energy": "two-word mood description",
      "quoteId": "linked-quote-id"
    }
  }
}
```

### Figure Quotes File

Create at: `data/quotes/figures/{figureId}.json`

```json
{
  "id": "{figureId}",
  "name": "Figure Name",
  "aliases": ["Other names they're known by"],
  "quotes": {
    "quote-id": {
      "source": "Book Chapter:Verse",
      "context": "When/why this was said",
      "hebrew": "Hebrew text",
      "english": "English translation",
      "mood": "emotional tone of the quote"
    }
  }
}
```

---

## Testing Your Character

### Step 1: Validate JSON

```bash
# For standalone character files
node -e "require('./data/characters/players/{id}.json')"
node -e "require('./data/characters/figures/{id}.json')"

# For pose files
node -e "require('./data/poses/players/{id}.json')"
node -e "require('./data/poses/figures/{id}.json')"

# For quote files (figures only)
node -e "require('./data/quotes/figures/{id}.json')"
```

### Step 2: List Available Poses

```bash
node scripts/generate-solo.js player {id} --list-poses
node scripts/generate-solo.js figure {id} --list-poses
```

This should show all poses for the character.

### Step 3: Dry Run

```bash
# Player solo card
node scripts/generate-solo.js player {id} thunder-lightning --pose {pose-id} --dry-run

# Figure solo card
node scripts/generate-solo.js figure {id} beam-team --pose {pose-id} --dry-run
```

Review the generated prompt for issues.

### Step 4: Generate Test Card

**CLI:**
```bash
# Player solo card
node scripts/generate-solo.js player jordan thunder-lightning --pose tongue-out-dunk

# Figure solo card
node scripts/generate-solo.js figure moses beam-team --pose parting-sea

# With hair color (Rodman)
node scripts/generate-solo.js player rodman metal-universe-dark --pose diving-loose-ball --hair green
```

**Generator UI:**
1. Start visualizer: `cd visualizer && npm start`
2. Go to http://localhost:3333/generator.html
3. Toggle to "Solo Character" mode
4. Select character type (Player or Figure)
5. Select character
6. Choose template and pose
7. Generate and review

### Step 5: Iterate

Common issues to fix:
- **Pose doesn't fill frame well**: Adjust prompt for more dynamic composition
- **Template doesn't fit character**: Try different template that matches era/energy
- **Details missing**: Add more specific prompts for clothing, attributes, expression

---

## Resources

### Basketball Research

- [Basketball Reference](https://www.basketball-reference.com/) - Stats and accolades
- [NBA.com History](https://www.nba.com/history) - Career narratives
- [YouTube](https://www.youtube.com/) - Search "[Player] highlights" for signature moves
- [Sports Illustrated 100](https://www.si.com/nba/2025-si-nba-100-rankings-nos-10-to-1-digital-cover) - Rankings and analysis

### Biblical Research

- [Sefaria](https://www.sefaria.org/) - Primary texts with translations
  - Use: `https://www.sefaria.org/[Book].[Chapter].[Verse]`
  - Topics: `https://www.sefaria.org/topics/[topic-slug]`
- [Jewish Encyclopedia](https://jewishencyclopedia.com/) - Historical context
- [Torah.org](https://torah.org/) - Commentary and analysis
- [Bible Gateway](https://www.biblegateway.com/) - Multiple translations

### Sefaria API (via Claude)

Claude has access to Sefaria MCP tools:
- `get_text` - Get text of a specific reference
- `text_search` - Search for terms across library
- `get_topic_details` - Get information about a topic
- `get_links_between_texts` - Find cross-references

Example: Ask Claude to "Look up Moses on Sefaria and find key quotes"

---

## Contribution Checklist

Before submitting a new solo character:

```
[ ] Standalone character file created (if not in a pairing)
[ ] Pose file created with at least 4 poses
[ ] For figures: quotes file with at least 5 quotes
[ ] All JSON validates without errors
[ ] --list-poses shows all poses correctly
[ ] --dry-run produces reasonable prompt
[ ] Test card generated and reviewed
[ ] At least one good result with each relevant template
```

---

## Quick Reference

### File Locations

| File Type | Path |
|-----------|------|
| Standalone players | `data/characters/players/{id}.json` |
| Standalone figures | `data/characters/figures/{id}.json` |
| Player poses | `data/poses/players/{id}.json` |
| Figure poses | `data/poses/figures/{id}.json` |
| Figure quotes | `data/quotes/figures/{id}.json` |

### Output Location

Solo cards are saved alongside pairing cards:
```
output/cards/
├── jordan-moses/                    # Pairing cards
├── lebron-david/                    # Pairing cards
├── solo-player-jordan/              # Solo player cards
│   └── {template}-{timestamp}.jpeg
├── solo-player-rodman/              # Solo player cards
│   └── {template}-{timestamp}.jpeg
└── solo-figure-moses/               # Solo figure cards
    └── {template}-{timestamp}.jpeg
```

### Templates Available

| Template | Style | Best For |
|----------|-------|----------|
| thunder-lightning | 90s Fleer Ultra | Dynamic action poses |
| thunder-lightning-dark | Dark variant | Villains, intensity |
| beam-team | 90s Stadium Club | Holographic, celebratory |
| beam-team-shadow | Shadow variant | Complex/ambiguous characters |
| metal-universe | 90s Fleer Metal | Chrome, industrial |
| metal-universe-dark | Dark variant | Villains, dominance |
| downtown | 2010s Panini Optic | Urban, modern |
| kaboom | 2010s Panini | Pop art, bold |
| prizm-silver | 2010s Panini Prizm | Clean, geometric |
