# Template Creation Guide

A lightweight, iterative process for creating new card templates from diverse inspirations.

**Core principle: Iteration is everything.** The first version won't be perfect. Generate, review, adjust, repeat.

---

## The Process

### Step 1: Share Inspiration

Provide:
- **Source** - card set, art movement, artist, architecture, anything visual
- **Series target** - Court & Covenant or Torah Titans (or shared)
- **Mood/feel** (optional) - words that capture the vibe

Examples of valid inspiration:
- "1996-97 Flair Showcase Hot Shots insert set"
- "Art Deco poster style, like 1920s travel ads"
- "Byzantine mosaic iconography"
- "Brutalist architecture, raw concrete"

### Step 2: Quick Translation

Claude researches and drafts a brief:

| Element | What to Define |
|---------|----------------|
| **Reference** | What this is "styled after" |
| **Background** | The visual signature (THE differentiator) |
| **Colors** | Primary gradient + accents |
| **Typography** | Title + name styling |
| **Finish** | Surface treatment |
| **Mood** | Tone-setting phrases |

Discuss before coding. The background is the most important element—it's what makes the template recognizable.

### Step 3: Build & Test Loop

```
Create template → Generate test card
        ↓
Review in visualizer
        ↓
Identify what's off
        ↓
Adjust prompt language
        ↓
Re-generate → Review again
        ↓
(Repeat until satisfied)
```

Use the visualizer's feedback system to track iterations and compare versions.

### Step 4: Finalize

- Commit when happy
- Optionally create dark variant
- Update docs (add to main CLAUDE.md template list)

---

## Template Brief Format

When starting a new template, capture these essentials:

```markdown
## [Template Name] Brief

| Element | Value |
|---------|-------|
| **Reference** | [Original card/art style] |
| **Background** | [The visual signature] |
| **Colors** | [Primary gradient, accents] |
| **Typography** | [Title and name styling] |
| **Finish** | [Surface treatment] |
| **Mood** | [Tone-setting phrases] |

**Series**: [Shared / Court & Covenant only / Torah Titans only]
**Thematic fit**: [What biblical themes this supports]
```

---

## Series Considerations

| Series | Composition | Sport Element |
|--------|-------------|---------------|
| **Court & Covenant** | Player LEFT, Figure RIGHT | Usually keep basketball |
| **Torah Titans** | Two figures, flexible | Decide per template |

**Default**: Create shared templates in `prompts/templates/`. Only make series-specific if there's a strong reason (like plague cards which are Torah Titans-exclusive).

### Questions for Each Template

1. **Keep or replace the sport element?** Some templates (like Hot Shots) use basketball as a visual anchor. Others might not need it.
2. **What biblical themes does this support?** Fire templates work for Elijah, burning bush, fiery furnace. Water templates for Noah, Moses parting sea.
3. **Need a dark variant?** Villain pairings often benefit from a darker color palette.

---

## Technical Implementation

Once the brief is finalized, implementation follows the pattern in `prompts/CLAUDE.md`:

1. **Create template file**: `prompts/templates/{template-name}.js`
   - Use an existing template (like `thunder-lightning.js`) as reference
   - Export both `generate()` (pair cards) and `generateSolo()` (single character)
   - Import pose helpers from `../components/poses.js`

2. **Add to metadata**: `data/templates-meta.json`
   - Add entry under `templates` object
   - Set `hasDarkMode` and `darkVariantId` if applicable

3. **Test thoroughly**: Generate multiple cards, review in visualizer, iterate

---

## Example: Hot Shots Template

Here's how the Hot Shots template was created:

### Inspiration
1996-97 Flair Showcase "Hot Shots" die-cut insert set

### Brief

| Element | Value |
|---------|-------|
| **Reference** | 1996-97 Flair Showcase Hot Shots die-cut insert |
| **Background** | Basketball + flames radiating outward, black void simulating die-cut edges |
| **Colors** | Fire gradient (red → orange → yellow → white-hot), orange basketball |
| **Typography** | "HOT SHOTS" in fiery gradient; names in bold white with orange glow |
| **Finish** | High-gloss 90s premium |
| **Mood** | "Legends on fire", "scorching intensity" |

**Series**: Shared template (basketball as stylistic anchor for both)
**Thematic fit**: Elijah calling fire, burning bush, fiery furnace pairings

### Key Prompt Decisions

- **Background focus**: "ORANGE BASKETBALL at the center with FLAMES radiating outward" - the basketball grounds it as a sports card
- **Die-cut simulation**: "card edges fade to BLACK VOID" - mimics the physical cut-out effect of the original
- **No cosmic elements**: Explicitly excluded stars/nebulae to keep it pure fire
- **Fire typography**: Letters with "FIRE GRADIENT (red at bottom, orange in middle, yellow at top)"

---

## Tips for Success

1. **Start with the background**. It's the visual signature that makes templates recognizable.

2. **Be explicit about what NOT to include**. "NO cosmic elements, NO stars" prevents the AI from defaulting to generic space backgrounds.

3. **Use reference language**. "styled after 1996-97 Flair Showcase" helps the AI understand the era and feel.

4. **Describe typography precisely**. Include gradient direction, effects, and placement.

5. **Test with different pairings**. A template that works great for Jordan-Moses might not work for Rodman-Esau.

6. **Iterate on language, not structure**. If flames aren't intense enough, adjust the descriptive words before restructuring the prompt.
