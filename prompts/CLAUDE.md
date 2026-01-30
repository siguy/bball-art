# Prompt System

Image generation prompt templates and components.

## Directory Structure

```
prompts/
├── components/           # Modular pieces
│   ├── backgrounds.js    # Background styles by template
│   ├── poses.js          # Generic pose descriptions
│   └── finishes.js       # Card finish effects
├── templates/            # Full card templates
│   ├── thunder-lightning.js
│   ├── beam-team.js
│   ├── downtown.js
│   ├── kaboom.js
│   ├── metal-universe.js
│   ├── prizm-silver.js
│   └── torah-titans/     # Series-specific templates
│       ├── spouse-blessing.js
│       ├── trial-card.js
│       ├── plague-card.js
│       └── three-way.js
└── generated/            # Ready-to-use prompts (output)
```

## Template Loading

Uses `scripts/lib/template-loader.js` with series fallback:
1. First checks series-specific: `prompts/templates/{series}/{template}.js`
2. Falls back to common: `prompts/templates/{template}.js`

```javascript
const { loadTemplate } = require('./lib/template-loader');
const template = loadTemplate('thunder-lightning', 'court-covenant');
```

## Available Templates

### Hero Templates (6)
| Template | Style | Key Elements |
|----------|-------|--------------|
| `thunder-lightning` | 90s Fleer Ultra | Electric gradient, lightning bolts |
| `beam-team` | 90s Stadium Club | Holographic prism, rainbow refraction |
| `downtown` | 2010s Panini Optic | Neon city skyline, urban night |
| `kaboom` | 2010s Panini | Comic book/pop art, bold outlines |
| `metal-universe` | 90s Fleer Metal | Chrome, industrial, metallic |
| `prizm-silver` | 2010s Panini Prizm | Clean geometric, silver shimmer |

### Villain Templates (3)
| Template | Style | Key Elements |
|----------|-------|--------------|
| `thunder-lightning-dark` | Dark variant | Black/crimson, blood-red lightning |
| `beam-team-shadow` | Shadow variant | Purple/red prism, corruption effects |
| `metal-universe-dark` | Dark variant | Black chrome, rust red |

### Torah Titans Templates
| Template | Best For |
|----------|----------|
| `spouse-blessing` | Husband & wife partnerships |
| `trial-card` | Character facing tests |
| `plague-card` | 10 Plagues of Egypt |
| `three-way` | Multi-character (3+) |

## Adding a New Template

1. Create template file: `prompts/templates/{template-name}.js`

```javascript
module.exports = {
  id: 'template-name',
  name: 'Template Name',
  era: '90s',
  style: 'Retro card style',

  buildPrompt(options) {
    const { player, figure, playerPose, figurePose, interaction } = options;
    return `
      A stylized basketball card featuring ${player.name} and ${figure.name}...
      ${playerPose.prompt}
      ${figurePose.prompt}
      Background: ${this.background}
      Style: ${this.style}
    `;
  },

  background: 'Electric gradient with lightning bolts',
  colors: ['#FF6B00', '#FFD700'],
  finish: 'holographic shimmer'
};
```

2. Add metadata to `data/templates-meta.json`:
```json
{
  "template-name": {
    "name": "Template Name",
    "era": "90s",
    "isDark": false,
    "supportsSolo": true
  }
}
```

3. For villain variant: copy hero template, modify colors/expressions

4. For series-specific: place in `prompts/templates/{series}/`

## Template Interface

Templates must export:
- `id`: Template identifier
- `name`: Display name
- `buildPrompt(options)`: Function returning prompt string

Options passed to buildPrompt:
- `player`: Player data with name, poses
- `figure`: Figure data with name, poses
- `playerPose`: Selected player pose object
- `figurePose`: Selected figure pose object
- `interaction`: Generic interaction type (optional)
- `quote`: Biblical quote object (optional)

## Prompt Best Practices

1. **Be specific about style**: "90s Fleer Ultra basketball card aesthetic"
2. **Describe poses precisely**: Include body position, gesture, expression
3. **Layer the composition**: Background, middle ground, foreground
4. **Include finish effects**: "holographic shimmer", "chrome reflections"
5. **Avoid**: NBA logos, team names, real photographs
