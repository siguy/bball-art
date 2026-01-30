# Sefaria Enrichment Workflow

How to create midrash-enriched pairings using Sefaria for deep biblical research.

## When to Use Sefaria Enrichment

Sefaria enrichment is **not automatic** — it's a deliberate enhancement for specific scenarios.

### Use It When:

**1. Figure-vs-Figure Rivalries**
When both characters are biblical figures with a documented relationship in Jewish texts.
- Jacob vs Esau ✓ (done)
- David vs Saul (potential)
- Moses vs Pharaoh (potential)
- Cain vs Abel (potential)

**2. User Explicitly Requests It**
Triggers like:
- "Enrich this pairing with midrashim"
- "Add Sefaria sources to [pairing]"
- "I want the deep Jewish sources for this one"
- "Make this one midrash-powered"

**3. Creating New Pairings with Narrative-Rich Figures**
Figures with extensive rabbinic commentary benefit most:
- **Rich midrash:** Moses, David, Jacob, Joseph, Elijah, Abraham, Solomon
- **Less midrash:** Bezalel, Caleb, Enoch, Balaam

**4. When Standard Poses Feel Generic**
If default poses like "side-by-side" or "back-to-back" don't capture the pairing's essence, Sefaria enrichment creates **scene-specific poses** drawn from actual narrative moments.

### Skip It When:

- Standard player-figure pairings where the connection is thematic, not narrative
- Quick test generations
- The figure lacks significant midrashic literature
- Time-sensitive work where research overhead isn't justified

## What Makes Midrash-Enriched Cards Special

Standard pairings have:
- A connection narrative
- Default poses
- Basic quotes

Midrash-enriched pairings add:
- **rivalryResearch** - Deep narrative from rabbinic sources
- **rivalryScenes** - Multiple custom scenes based on midrashic moments
- **scriptureReferences** - Hebrew + English quotes with source citations

The result: Cards that tell specific stories from Jewish tradition, not just generic "hero vs villain" poses.

## The Jacob-Esau Template

The `jacob-esau.json` pairing is the gold standard for midrash-enriched cards. Use it as a template.

### Key Structure

```json
{
  "id": "jacob-esau",
  "type": "rivalry",
  "cardMode": "rivalry-figure-figure",

  "rivalryResearch": {
    "relationship": "Narrative summary with midrash citations...",
    "keyMoments": [...],
    "rivalryScenes": [...],
    "scriptureReferences": [...]
  }
}
```

## Step-by-Step Workflow

### 1. Research on Sefaria

Go to [sefaria.org](https://www.sefaria.org) and research:

1. **Primary biblical text** - The main narrative (Genesis, Exodus, etc.)
2. **Midrash Rabbah** - Rabbinic elaborations (Genesis Rabbah, Exodus Rabbah, etc.)
3. **Talmudic references** - If the figures appear in Talmud
4. **Prophetic connections** - Later prophets commenting on the figures

**Search tips:**
- Search figure names in Hebrew for more results
- Check "Connections" sidebar on any verse
- Look for aggadic (narrative) midrashim, not just halachic ones

### 2. Identify Key Moments

Look for moments that are:
- **Visually striking** - Can be rendered as a card scene
- **Emotionally charged** - Conflict, triumph, despair, revelation
- **Thematically rich** - Connect to the pairing's core dynamic

For Jacob-Esau, the key moments were:
1. The War in the Womb (Genesis Rabbah 63:6)
2. The Birthright Bargain (Genesis 25)
3. The Stolen Blessing (Genesis 27)
4. Voice vs Hands (Genesis 27:22 + midrash)
5. Fire vs Straw (Obadiah 1:18)
6. The Reunion (Genesis 33)

### 3. Create rivalryScenes

Each scene needs:

```json
{
  "id": "scene-id-kebab-case",
  "heroAction": "Visual description of hero's pose, expression, items held. Written for image generation.",
  "villainAction": "Visual description of villain's pose, expression, items held. Written for image generation.",
  "scene": "Setting/atmosphere description (location, lighting, mood).",
  "energy": "2-5 words describing the vibe"
}
```

**Writing tips for heroAction/villainAction:**
- Be SPECIFIC and VISUAL
- Describe body position, facial expression, clothing, items held
- Include physical details (hair color, skin texture for Esau)
- These become the actual prompts, so write them like prompts

### 4. Collect scriptureReferences

For each key verse:

```json
{
  "source": "Genesis 25:22-23",
  "context": "What was happening when this was said",
  "hebrew": "הַקֹּל קוֹל יַעֲקֹב וְהַיָּדַיִם יְדֵי עֵשָׂו",
  "english": "The voice is the voice of Jacob, but the hands are the hands of Esau.",
  "mood": "Prophetic, Defining"
}
```

**Include:**
- Biblical verses (Torah, Prophets, Writings)
- Midrashic quotes (cite the midrash: "Genesis Rabbah 65:15")
- Mix of perspectives (hero's view, villain's view, narrator's view)

### 5. Add Poses to Pose Files

After creating rivalryScenes, add them to the pose files:

**For hero (`data/poses/figures/{hero}.json`):**
```json
{
  "rivalry-{scene-id}": {
    "id": "rivalry-{scene-id}",
    "name": "Rivalry: {Scene Title}",
    "description": "{Hero} in rivalry scene: {scene}",
    "prompt": "{heroAction from rivalryScene}",
    "energy": "{energy from rivalryScene}",
    "isRivalryPose": true
  }
}
```

**For villain (`data/poses/figures/{villain}.json`):**
Same structure but use `villainAction`.

### 6. Generate Cards

```bash
# List available rivalry poses
node scripts/generate-with-poses.js {pairing} --list-poses

# Generate a specific scene
node scripts/generate-with-poses.js {pairing} {template} \
  --player-pose rivalry-{scene-id} \
  --figure-pose rivalry-{scene-id}

# Example: Jacob-Esau womb battle
node scripts/generate-with-poses.js jacob-esau beam-team \
  --player-pose rivalry-womb-battle \
  --figure-pose rivalry-womb-battle
```

## Candidate Pairings for Enrichment

Pairings that would benefit most from Sefaria enrichment:

### Figure-Figure Rivalries
| Pairing | Midrashic Potential |
|---------|---------------------|
| David vs Saul | Extensive midrashim on their conflict |
| Moses vs Pharaoh | Rich Exodus Rabbah material |
| Elijah vs Jezebel | Prophetic confrontation narratives |
| Joseph vs Brothers | Forgiveness arc with midrashic elaboration |

### Player-Figure Pairings with Biblical Depth
| Pairing | Research Focus |
|---------|----------------|
| Jordan-Moses | Exodus narratives, leadership midrashim |
| LeBron-David | Kingship midrashim, Psalms |
| Curry-Elijah | Fire miracles, prophetic authority |
| Shaq-Goliath | Giant narratives, 1 Samuel midrashim |

## Sefaria API (Optional)

The project includes a Sefaria client for programmatic access:

```javascript
import { SefariaClient } from '../visualizer/lib/sefaria-client.js';

const client = new SefariaClient();

// Get a specific text
const text = await client.getText('Genesis.25.22-23');

// Search for related texts
const results = await client.search('Jacob Esau womb');
```

See `visualizer/lib/sefaria-client.js` for full API.

## Quality Checklist

Before considering a midrash-enriched pairing complete:

- [ ] At least 4-6 rivalryScenes defined
- [ ] Each scene has specific, visual heroAction and villainAction
- [ ] At least 5 scriptureReferences with accurate Hebrew
- [ ] Poses added to both hero and villain pose files
- [ ] Test generation with at least 2 templates
- [ ] Review cards for visual accuracy to the midrashic source

## Example: Full Scene Breakdown

**Scene: Voice vs Hands (Jacob-Esau)**

**Midrash source:** Genesis 27:22 + Genesis Rabbah 65:20

**Key insight:** "When Jacob's voice fills the study halls, Esau's hands have no power."

**heroAction:**
```
Jacob stands with mouth open, voice pouring forth as visible energy —
scrolls of Torah text and Hebrew letters spiraling from his lips upward
into light. His smooth face radiates wisdom and divine connection.
One hand raised in teaching or prayer. His voice IS his weapon.
```

**villainAction:**
```
Esau stands with massive hairy fists clenched, gripping a sword and a bow —
his HANDS are his power. Muscles tense, ruddy red complexion, covered in
red hair. His mouth is shut, silent — he has no voice, only brute force.
The hands of violence.
```

**scene:**
```
A mythic confrontation between two cosmic principles — the voice of Torah
study vs the hands of worldly power. Not a literal scene but an archetypal clash.
```

**Result:** A card that visualizes a rabbinic principle, not just two figures fighting.
