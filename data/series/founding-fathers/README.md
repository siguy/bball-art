# Founding Fathers Series

Collectible portrait cards for America's 250th anniversary (July 4, 2026), transforming canonical Founding Father portraits through seven artistic layers spanning 250 years of American visual history.

## The 7-Layer System

Each founder's canonical portrait is transformed through seven artistic layers:

| # | Layer | Era | Description |
|---|-------|-----|-------------|
| 1 | Colonial Foundation | pre-1776 | Georgian, formal English portraiture, colonial craftsmanship |
| 2 | Revolutionary Spirit | 1776 | Eagles, rattlesnakes, liberty caps, propaganda broadsides |
| 3 | Classical Republic | Federal | Roman references, neoclassical columns, civic virtue |
| 4 | American Landscape | 1830s-1870s | Hudson River School grandeur, westward vistas |
| 5 | Industrial Monument | Gilded Age | Currency portraits, bronze statues, marble memorials |
| 6 | Democratic Mural | WPA/Depression | Social realism, post office murals, heroic populism |
| 7 | Contemporary Echo | Modern | Pop art, street art, digital remix, monument debates |

## The Big 6 Roster

| Founder | Role | Basis Portrait |
|---------|------|----------------|
| George Washington | Commander-in-Chief, First President | Trumbull's "General Washington at Trenton" (1792) |
| Thomas Jefferson | Declaration author, Third President | Rembrandt Peale (1800) |
| Benjamin Franklin | Diplomat, scientist, printer | Duplessis "Fur Collar" (1778) |
| John Adams | Independence champion, Second President | Gilbert Stuart (1800-1826) |
| Alexander Hamilton | Treasury architect, Federalist Papers | John Trumbull (1792) |
| James Madison | Constitution architect, Bill of Rights | Gilbert Stuart (1804) |

## Expansion Phases

- **Phase 1**: Washington (proof of concept)
- **Phase 2**: Jefferson, Franklin (complete the traditional "Big 3")
- **Phase 3**: Adams, Hamilton, Madison (complete the "Big 6")

## Current Status

### Washington Layer Progress

| Layer | Status | Direction Selected |
|-------|--------|-------------------|
| Colonial | Pending | - |
| Revolutionary | Pending | - |
| Classical | Pending | - |
| Landscape | Pending | - |
| Monument | Pending | - |
| Mural | Pending | - |
| Contemporary | Pending | - |

## File Structure

```
data/series/founding-fathers/
├── README.md              # This file
├── series-config.json     # Series configuration
└── founders/
    └── george-washington.json

data/poses/founders/
└── washington.json

prompts/templates/founding-fathers/
├── portrait-transformation.js
└── index.js
```

## Generation Commands

```bash
# Single layer generation
node scripts/generate-founder.js washington --layer colonial

# Combined layers (2-3 blended)
node scripts/generate-founder.js washington --layers colonial,revolutionary

# Full 7-layer synthesis
node scripts/generate-founder.js washington --synthesis

# With specific pose
node scripts/generate-founder.js washington --layer monument --pose cincinnatus-returning
```

## Layer Discovery Process

For each layer:
1. Research visual examples and artistic precedents
2. Present options with conceptual rationale
3. User selects direction
4. Try multiple unconventional applications
5. Select final approach
6. Document in founder's `selectedLayers` field
