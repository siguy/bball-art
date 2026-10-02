# Court & Covenant website: relationships + layout

## Phase 1: Relationships fix (branch `fix/pairing-connections`)
- [x] Exporter (`visualizer/server.js`) passes full connection (thematic / narrative / relationship) + scripture + receipt to the site
- [x] Normalize the 4 rivalry pairings to object-style `connection`
- [x] Add `scripture` + `receipt` fields to every Court & Covenant pairing (schema + data)
- [x] Fix Garnett–Cain placeholder + rewrite to raw intensity (not murder)
- [x] Rewrite Durant–Jonathan so the parallel lands
- [x] Re-pair Brunson → Ehud (left-handed deliverer, Judges 3); archive Brunson–Avraham (keeps existing generated cards)
- [x] Resolve hero/villain conflicts (Shaq–Goliath, Bird–Jacob) in series-config + pairing files
- [x] Regenerate `web/js/data.js` with the richer fields (no image changes)
- [x] Card page info panel shows Hook / The Parallel / The Bond / Scripture / Receipt
- [x] `node scripts/validate-data.js` passes; verify panel in browser

## Phase 2: Layout rebuild (keep dark + gold look)
- [ ] Hero: one featured matchup, hook line as headline
- [ ] The Roster: grid, one card per pairing, Heroes / Villains filter
- [ ] Matchup view: all connection fields visible
- [ ] About section + working footer links, fix OG image + favicon
- [ ] Swipe deck kept as phone browsing mode
- [ ] Verify desktop + mobile
