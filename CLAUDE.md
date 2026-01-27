# Court & Covenant - Project Guide

## What is This?

A **contemporary art project** creating collectible basketball cards that pair NBA legends with biblical/Jewish historical figures. Think "Thunder & Lightning" meets Torah.

**Series 1**: Court & Covenant (Basketball + Biblical figures)
**Future**: Founding Fathers series for America's 250th (July 4, 2026)

## Project Status

**Current Phase**: Phase 1-2 (Foundation & Generation Ready)
- [x] Directory structure created
- [x] CLAUDE.md written
- [x] Git/GitHub initialized (https://github.com/siguy/bball-art)
- [x] First pairing data (Jordan/Moses)
- [x] First prompt template (Thunder & Lightning)
- [x] Prompt generator script working
- [ ] Logo concepts generated
- [ ] First test card generated with Nano Banana

## Core Principles

1. **This is Art** - Stylized, transformative interpretations. No photos, no logos, no licensed materials.
2. **Build for Reuse** - Everything should work for future series.
3. **Document Everything** - Code explains "why", not just "what".

## Key Decisions Made

| Decision | Choice |
|----------|--------|
| Repo name | `bball-art` |
| Image generation | Nano Banana (Gemini API) |
| Social platform | Instagram first |
| Social automation | n8n |
| Website stack | Next.js + Tailwind + Vercel |
| Game engine | Phaser.js |

## Directory Structure

```
data/
├── series/{series-name}/pairings/  # Player-figure pairings
├── eras/                           # 1970s-2020s definitions
├── card-brands/                    # Fleer, Topps, Panini, etc.
└── card-types/                     # Thunder & Lightning, Prizm, etc.

prompts/
├── components/    # Modular pieces (backgrounds, poses, finishes)
├── templates/     # Full card templates
└── generated/     # Ready-to-use prompts

output/
├── cards/         # Generated images
├── motion/        # Video files
├── test-runs/     # Style testing
└── social/        # Platform-ready assets
```

## Top 5 Priority Pairings

| Player | Figure | Era | Connection |
|--------|--------|-----|------------|
| Michael Jordan | Moses | 90s | Led people through wilderness to promised land |
| LeBron James | King David | 2010s | From humble beginnings to greatest king |
| Scottie Pippen | Aaron | 90s | Moses's essential partner, underrated |
| Kobe Bryant | Joshua | 2000s | Succeeded Moses, conquered the land |
| Stephen Curry | Elijah | 2010s | Brought fire from heaven, changed everything |

## Tone & Voice

**Edgy, funny, irreverent** - but respectful of both basketball and biblical history.

Good: "Moses parted the Red Sea. MJ parted defenders. Same energy."
Bad: Corporate speak, explaining jokes, being preachy.

## Key APIs & Tools

- **Nano Banana Pro**: `gemini-3-pro-image-preview` via Vertex AI
- **n8n**: Social media automation workflows
- **Meta Graph API**: Instagram posting (Business account required)

## Quick Commands

```bash
# Generate a prompt
node scripts/generate-prompt.js jordan-moses thunder-lightning

# Batch generate cards
node scripts/batch-generate.js court-covenant

# Validate JSON data
node -e "require('./data/series/court-covenant/pairings/jordan-moses.json')"
```

## Environment Variables Needed

```
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
INSTAGRAM_ACCESS_TOKEN=your-long-lived-token
```

## Common Tasks

### Adding a New Pairing
1. Create `data/series/court-covenant/pairings/{player}-{figure}.json`
2. Run prompt generator
3. Test generate one card
4. Rate output, iterate if needed
5. Generate variants

### Adding a New Card Style
1. Create `data/card-types/{style-name}.json`
2. Add background to `prompts/components/backgrounds.js`
3. Create template in `prompts/templates/{style-name}.js`
4. Test with existing pairing

## Plan File Location

Full project plan: `/Users/simonbrief/.claude/plans/unified-frolicking-adleman.md`

## What NOT to Do

- Don't add NBA logos or team names
- Don't use real player photographs
- Don't over-engineer (keep it simple until needed)
- Don't batch generate before style testing
- Don't skip the rating/validation phase
