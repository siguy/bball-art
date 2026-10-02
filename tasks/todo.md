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
- [x] Hero: one featured matchup, hook line as headline
- [x] The Roster: grid, one card per pairing, Heroes / Villains filter
- [x] Matchup view: all connection fields visible
- [x] About section + working footer links, fix OG image + favicon
- [x] Swipe deck kept as phone browsing mode
- [x] Verify desktop + mobile

## Phase 1b: Scripture verses
- [x] `connection.scripture` = `{ ref, hebrew, english }` from local Sefaria export (Tanach with Nikkud + JPS 1917)
- [x] Card panel shows verse in Hebrew + English

## Review
- Phase 1 + 1b done on `fix/pairing-connections`; validate-data passes, panel verified in browser.
- Phase 2 homepage: "Rip the Pack" design (dealt fan, jumbotron ticker, flip-card matchups with Heroes/Villains filter, phone swipe rail). Verified at 1440x900 and 375x812, no console errors.
- Not deployed yet. Vercel project `web` deploys from `web/`.
