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

---

# Knicks 2026 champions: fusion cards

Starting five, Fillmore Revelation template (1960s psychedelic poster), SOLO cards.
Direction change (Simon): no explicit pairings on the card. Each player stays in his
signature basketball pose but takes on traits of a biblical figure via a `fusion`
block on the pairing's player object (wardrobe, accents, aura, background motifs).
"Can These Bones Live?" theme dropped.

| Player | Figure | Status |
|---|---|---|
| Karl-Anthony Towns | Joseph | [x] fusion solo v2 generated (coat of colors, gold collar, sun/moon/11 stars, wheat) |
| Jalen Brunson | Joshua | [x] fusion card done (walls, 7 shofars, scarlet cord, sun+moon, 12 stones, Jordan). Lefty fix: mirror the card, then Gemini edit pass to re-letter title + logo (2 edit calls) |
| Josh Hart | Caleb | [ ] pose file + pairing + generate |
| Mikal Bridges | Priests at the Jordan (Eleazar) | [ ] pose files (player + figure) + pairing |
| OG Anunoby | Shamgar | [ ] pose files (player + figure) + pairing |

- [x] `fillmore-revelation` template + registered (`fr`) in filename-builder, config, server, templates-meta
- [ ] Simon's feedback on KAT fusion card before doing the other four
- `generate-solo.js --pairing <id>` picks which pairing's player data (and fusion block) to use
- Command: `node scripts/generate-solo.js player karl-anthony-towns fillmore-revelation --pose three-point-release`
- Note: `--draft` (FLUX) ignores this style badly (no psychedelia, put Joseph in a jersey) - use full Nano Banana for this template
- Lesson: image models default to right-handed shooters. For lefties, generate normally, mirror (`sips -f horizontal`), then a Gemini edit pass to fix the mirrored text/logo.
