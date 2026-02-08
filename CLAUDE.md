# Court & Covenant - Project Guide

A **contemporary art project** creating collectible basketball cards that pair NBA legends with biblical/Jewish historical figures. Think "Thunder & Lightning" meets Torah.

**Series:**
- **Court & Covenant** (Active) - NBA players + Biblical figures
- **Torah Titans** (Active) - Biblical figure-vs-figure cards (rivalries, spouses, plagues)
- **Future**: Founding Fathers for America's 250th (July 4, 2026)

## Core Principles

1. **This is Art** - Stylized, transformative interpretations. No photos, no logos, no licensed materials.
2. **Build for Reuse** - Everything should work for future series.
3. **Document Everything** - Code explains "why", not just "what".
4. **Keep Docs in Sync** - ALWAYS update relevant CLAUDE.md files as changes are made.
5. **Discovery Before Modification** - Before changing any pattern, search the entire codebase to find ALL instances. Don't trust plans or assumptions to be complete. Use `grep` to find all files containing the pattern you're modifying.

## Key Decisions

| Decision | Choice |
|----------|--------|
| Repo name | `bball-art` |
| Image generation | Nano Banana (Gemini API) |
| Social platform | Instagram first |
| Website stack | Next.js + Tailwind + Vercel |
| Game engine | Phaser.js |

## Directory Structure

```
data/           # Pairings, poses, quotes, schemas (see data/CLAUDE.md)
docs/           # Detailed guides (generator-ui.md, solo-characters.md, etc.)
game/           # Holy Hoops - NBA Jam-style game (see game/CLAUDE.md)
prompts/        # Template system, components (see prompts/CLAUDE.md)
scripts/        # CLI commands, shared libs (see scripts/CLAUDE.md)
visualizer/     # Card review & feedback app (see visualizer/CLAUDE.md)
output/         # Generated images (organized by series)
```

## Essential Commands

```bash
# Start the visualizer
cd visualizer && npm start

# Start the game
cd game && npm run dev

# Generate a card
node scripts/generate-card.js jordan-moses thunder-lightning

# Generate with pose control
node scripts/generate-with-poses.js rodman-esau thunder-lightning-dark \
  --player-pose diving-loose-ball --figure-pose drawing-bow

# Generate solo character
node scripts/generate-solo.js player jordan thunder-lightning --pose tongue-out-dunk

# Validate JSON data
node scripts/validate-data.js
```

## Available Templates

**Hero:** `thunder-lightning`, `beam-team`, `downtown`, `kaboom`, `metal-universe`, `prizm-silver`, `hot-shots`

**Villain:** `thunder-lightning-dark`, `beam-team-shadow`, `metal-universe-dark`

**Torah Titans:** `spouse-blessing`, `trial-card`, `plague-card`, `three-way`

## Detailed Documentation

Context-specific docs load automatically when working in subdirectories:

| Location | CLAUDE.md covers |
|----------|------------------|
| `game/` | Holy Hoops game: controls, mechanics, testing, build phases |
| `visualizer/` | API endpoints, export system, Generator UI, feedback system |
| `data/` | Data formats, multi-series, validation, schemas |
| `scripts/` | CLI reference, shared libraries, environment vars |
| `prompts/` | Template system, adding new templates |

Additional guides in `docs/`:
- `generator-ui.md` - Full Generator UI documentation
- `solo-characters.md` - Solo character creation guide
- `pairing-creator.md` - AI-powered pairing creation
- `sefaria-enrichment.md` - Midrash-enriched cards workflow

## Feedback-to-Claude Workflow

The visualizer includes a real-time feedback system for iterating on card prompts:

1. **Rate card** in visualizer (loved/liked/issues)
2. **Set scope** - card only, template-wide, pairing-wide, or global
3. **Tag categories** - composition, colors, poses, style, characters, text
4. **Click "Send to Claude"** - copies formatted feedback to clipboard
5. **Paste into Claude Code** - get prompt adjustments based on feedback
6. **Regenerate** - new version is tracked in version history
7. **Compare versions** - side-by-side view in visualizer

See `visualizer/CLAUDE.md` for full documentation.

## Adding New Content

**New Pairing:** See `data/series/court-covenant/pairings/NEW-PAIRINGS.md`

**New Character:** See `docs/solo-characters.md`

**New Template:** See `docs/template-creation.md` (creative process) and `prompts/CLAUDE.md` (technical)

## Design Before Building

For new templates, series, or significant features:

1. **Explore first** - Review similar existing work
2. **2-3 approaches** - Consider alternatives before settling
3. **Simplest version** - What's the minimum that captures the idea?
4. **Test early** - One card/feature before batch work

Skip this for small fixes or iterations on existing work.

## What NOT to Do

- Don't add NBA logos or team names
- Don't use real player photographs
- Don't over-engineer (keep it simple until needed)
- Don't batch generate before style testing
- Don't skip the rating/validation phase

## When You're Stuck

### Red Flags (Stop and Reconsider)
- **3+ attempts didn't help** → Step back, understand WHY before trying again
- **Copying code/prompts without understanding** → Read it first
- **Feature creep** → Is this needed now? YAGNI.
- **Changing patterns without searching** → Discovery Before Modification

### For Art (Prompts/Templates)
- Read the prompt file that was actually sent
- Compare to a working card - what's different?
- Make ONE change at a time

### For Software (Bugs/Features)
- Reproduce it consistently before fixing
- Form a hypothesis, test minimally
- If fix doesn't work, re-investigate (don't stack fixes)
