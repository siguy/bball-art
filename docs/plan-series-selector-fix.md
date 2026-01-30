# Plan: Fix Global Series Selector Across All Pages

## Problem

The series selector is implemented using localStorage for persistence, but two pages are missing the integration:
- `characters.html` / `characters.js`
- `export-queue.html` (inline JS)

When navigating to these pages, the series selector dropdown doesn't appear, and data isn't filtered by the selected series.

## Goal

The series selector should appear on ALL pages and honor the global selection stored in localStorage.

---

## Changes Required

### 1. characters.html

**Add script include in `<head>`:**
```html
<script src="series-selector.js"></script>
```

### 2. characters.js

**Add to init() function:**
```javascript
// Initialize series selector
if (typeof initSeriesSelector === 'function') {
  initSeriesSelector();
}
const currentSeries = typeof getSelectedSeries === 'function' ? getSelectedSeries() : 'court-covenant';
```

**Update API calls to use series:**
- `/api/characters/players` → Filter client-side or pass series
- `/api/characters/figures` → Filter client-side or pass series

**Series-aware character filtering:**
- Torah Titans: Hide the "NBA Players" option in type filter (only figures)
- Court & Covenant: Show both players and figures

### 3. export-queue.html

**Add script include in `<head>`:**
```html
<script src="series-selector.js"></script>
```

**Add to inline init() function:**
```javascript
// Initialize series selector
if (typeof initSeriesSelector === 'function') {
  initSeriesSelector();
}
const currentSeries = typeof getSelectedSeries === 'function' ? getSelectedSeries() : 'court-covenant';
```

**Update API calls:**
- `/api/pairings` → `/api/pairings?series=${currentSeries}`
- `/api/manifest` → Filter cards client-side by `card.series === currentSeries`

---

## Files to Modify

| File | Changes |
|------|---------|
| `visualizer/public/characters.html` | Add series-selector.js script tag |
| `visualizer/public/characters.js` | Add initSeriesSelector(), filter by series |
| `visualizer/public/export-queue.html` | Add series-selector.js script tag, update inline JS |

---

## Testing Checklist

### Series Selector (All Pages)
- [ ] Select "Torah Titans" on Gallery page
- [ ] Navigate to Characters → should show series selector with "Torah Titans" selected
- [ ] Characters page should only show Biblical Figures (no NBA Players option)
- [ ] Navigate to Export Queue → should show series selector with "Torah Titans" selected
- [ ] Export Queue should filter cards/pairings by Torah Titans
- [ ] Switch to "Court & Covenant" on Export Queue
- [ ] Navigate back to Gallery → should show "Court & Covenant" selected
- [ ] All pages should maintain the same series selection

### Generator - Torah Titans Support
- [ ] Select Torah Titans series
- [ ] Navigate to Generator
- [ ] Select a Torah Titans pairing (e.g., Abraham & Sarah)
- [ ] Verify pose labels show character names ("Abraham Pose", "Sarah Pose")
- [ ] Verify poses load correctly for both characters
- [ ] Verify pose descriptions appear when poses are selected
- [ ] Select a rivalry pairing (e.g., Jacob & Esau) - verify dark mode auto-enables
- [ ] Generate a card - verify it saves to correct series directory

### Generator - Solo Mode
- [ ] Switch to Solo mode
- [ ] For Torah Titans: verify "NBA Player" option is hidden
- [ ] Select "Biblical Figure"
- [ ] Select a character
- [ ] Verify poses load and descriptions appear
- [ ] Generate a solo card

### Generator - Court & Covenant (Regression)
- [ ] Switch back to Court & Covenant series
- [ ] Verify pairings show Heroes/Villains grouping
- [ ] Verify pose labels show "Player Pose" / "Figure Pose"
- [ ] Verify villain pairings auto-enable dark mode
- [ ] Generate a card - verify it works as before

---

## Implementation Status

- [x] Update `characters.html` - add script tag
- [x] Update `characters.js` - add init and filtering logic
- [x] Update `export-queue.html` - add script tag and update inline JS
- [x] Update `generator.js` - add Torah Titans figure-figure support
- [x] Update `generator.html` - dynamic pose labels
- [x] Update `server.js` - series parameter in API endpoints
- [x] Test all pages with series switching
- [x] Commit changes
