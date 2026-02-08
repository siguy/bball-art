# Covenant Jam: Game Planning Document

## Project Context

We're building an arcade basketball video game inspired by NBA Jam, featuring pairs from the **Court & Covenant** card series. Each team consists of an NBA legend paired with their biblical counterpart. The game blends basketball mechanics with supernatural abilities.

---

## SECTION 1: STARTER ROSTER (Top 6 Pairs by Priority)

| Team | Player | Figure | Theme | Special Move Concepts |
|------|--------|--------|-------|----------------------|
| 1 | Michael Jordan | Moses | Liberation/Leadership | "Part the Defense" - opponents scatter; "Burning Bush Mode" - can't be guarded |
| 2 | LeBron James | King David | Royalty/Self-Made Kings | "Sling Shot" - full-court pass; "Crown Block" - chase-down blocks stun |
| 3 | Scottie Pippen | Aaron | Perfect Partnership | "Assist Buff" - boosts teammate; "Breastplate Shield" - steals increase |
| 4 | Kobe Bryant | Joshua | Conquerors/Succession | "Walls Fall" - shatters shot clock; "Mamba Strike" - unblockable fadeaway |
| 5 | Stephen Curry | Elijah | Fire from Above | "Fire Rain" - 3s are literally on fire; "Logo Strike" - shoots from anywhere |
| 6 | Magic Johnson | Joseph | Visionaries | "Dream Vision" - predicts opponent moves; "Rainbow Pass" - no-look alley-oop |

### Player Signature Moves (from data)

- **Jordan**: fadeaway jumper, flying dunk, tongue out drive
- **LeBron**: chase-down block, tomahawk dunk, no-look pass
- **Pippen**: coast-to-coast fast break, perimeter defense, outlet pass
- **Kobe**: fadeaway jumper, footwork in post, clutch dagger
- **Curry**: deep three-pointer, behind-the-back dribble, shimmy celebration
- **Magic**: no-look pass, baby hook, fast break orchestration

### Figure Attributes (from data)

- **Moses**: staff of power (parted the Red Sea)
- **David**: golden crown + sling with river stones
- **Aaron**: high priest breastplate with 12 gems
- **Joshua**: bronze sword + shofar (ram's horn)
- **Elijah**: mantle of fire (called down fire from heaven)
- **Joseph**: coat of many colors (dreamer who saw the future)

---

## SECTION 2: GAME ENGINE DECISION

**Recommended: Phaser.js** (already in project key decisions)

| Factor | Phaser.js | Godot | Unity WebGL |
|--------|-----------|-------|-------------|
| Web-native | ✅ Native | Export only | Export only |
| Mobile support | ✅ Strong | Good | Heavy |
| 2D focus | ✅ Built for it | Great | Overkill |
| Learning curve | Low | Medium | High |
| File size | Light | Medium | Heavy |
| JS/TS ecosystem | ✅ Native | GDScript | C# |

### Questions to Answer

- [ ] Is Phaser 3 sufficient for the physics and animation we need?
- [ ] Do we need a physics engine (Matter.js) or can we fake it arcade-style?
- [ ] How will we handle sprite animations for 12+ unique characters?

---

## SECTION 3: GAME NAME OPTIONS

| Name | Vibe | Status |
|------|------|--------|
| **Court & Covenant: Holy Hoops** | On-brand, playful | ✅ Internal |
| **Prophets vs. Ballers** | Confrontational | TBD |
| **Divine Dunk** | Simple, catchy | TBD |
| **Legends & Leviticus** | Alliterative | TBD |
| **Testament Jam** | NBA Jam homage | TBD |
| **Sacred Hoops** | Double meaning | Probably taken |
| **The Promised Court** | Biblical + Basketball | TBD |
| **Covenant Clash** | Action-focused | TBD |

### Questions to Answer

- [ ] Should the name reference basketball, the biblical angle, or both?
- [ ] Do we want an NBA Jam-style name or something more unique?
- [ ] Does it need to work internationally?

---

## SECTION 4: GAMEPLAY MECHANICS

### Core Loop (NBA Jam Style)

```
2v2 basketball → Build "Fire" meter → Activate Special Powers → Spectacular dunks/plays
```

### Player Controls (cross-platform)

| Action | Keyboard | Touch | Gamepad |
|--------|----------|-------|---------|
| Move | WASD/Arrows | Virtual joystick | Left stick |
| Shoot/Block | Space/J | Tap right zone | A/X |
| Pass/Steal | Shift/K | Tap player | B/O |
| Special | E/L | Hold power button | Trigger |
| Turbo | Hold direction | Hold joystick | Hold stick |

### Special Ability System

- Each pair has 3 abilities: **Player Move**, **Figure Power**, **Team Ultimate**
- Fill the "Covenant Meter" by scoring, assists, and defensive plays
- When full, trigger Ultimate (e.g., "Parting the Defense" - all opponents pushed aside)

### NBA Jam Elements

- [x] "He's on fire!" mechanic (maybe "He's BLESSED!")
- [x] Ridiculous dunk heights and flips
- [x] Shoving/elbowing (but add "smiting")
- [x] No fouls in main mode
- [x] 4 quarters, fast-paced
- [ ] Big head mode (unlockable)
- [ ] Injury/fatigue? (probably skip for arcade feel)

---

## SECTION 5: ART ASSET REQUIREMENTS

### Per Character (12 total for 6 pairs)

| Asset Type | Description | Count/Char | Total |
|------------|-------------|------------|-------|
| Idle sprite | Standing/bouncing | 1 | 12 |
| Run cycle | 8-direction or 4-flip | 4-8 frames | 48-96 |
| Dribble | Running with ball | 4-8 frames | 48-96 |
| Shoot | Jump shot animation | 6 frames | 72 |
| Dunk | Signature dunk per player | 8 frames | 96 |
| Pass | Chest/bounce/special | 3 variants | 36 |
| Block | Jump block | 4 frames | 48 |
| Steal | Reach animation | 3 frames | 36 |
| Special move | Unique per character | 8-12 frames | 96-144 |
| On Fire/Blessed | Aura effect overlay | 1 | 12 |
| Victory/Loss | Celebration/disappointment | 2 | 24 |

### Environment Art

- Main court (top-down or isometric?)
- Court variants: Temple court? Ancient arena?
- Crowd/stands (stylized/minimal)
- UI elements (scoreboard, meters, buttons)

### UI/Branding

- Game logo (multiple formats)
- Team logos/icons for each pair
- Menu screens
- Character select portraits
- Power-up icons
- Button prompts (keyboard/touch/gamepad)

### Questions to Answer

- [ ] **Perspective**: Top-down (classic NBA Jam) or side-view (more expressive)?
- [ ] **Style**: Pixel art? Vector? Stylized card art adapted?
- [ ] **Resolution**: Target 1080p with downscale, or pixel-native?
- [ ] **Animation**: Full sprite sheets or skeletal animation (Spine)?

---

## SECTION 6: ANNOUNCER SYSTEM

### Voice Lines Categories

| Category | Example Lines | Trigger |
|----------|---------------|---------|
| **Game Start** | "From the Torah to the Hardwood... IT'S TIP-OFF TIME!" | Game begins |
| **On Fire** | "HE'S BLESSED!" / "THE SPIRIT IS UPON HIM!" | Fire mode active |
| **Big Dunk** | "FROM THE HEAVENS!" / "THOU SHALT NOT BLOCK THAT!" | Spectacular dunk |
| **Three-pointer** | "FIRE FROM ON HIGH!" / "ELIJAH'S FLAME!" | Deep 3 made |
| **Special Move** | "PART THE DEFENSE!" / "THE WALLS ARE FALLING!" | Ultimate used |
| **Steal** | "THEFT IN THE TEMPLE!" / "COMMANDMENT BROKEN!" | Steal |
| **Block** | "DENIED AT THE ALTAR!" / "REJECTED!" | Block |
| **And-One** | "AND THE BLESSING CONTINUES!" | Foul + make |
| **Comeback** | "EXODUS IS HAPPENING!" / "FROM THE WILDERNESS!" | Team rallying |
| **Blowout** | "THIS IS BIBLICAL PROPORTIONS!" | 20+ point lead |
| **Buzzer beater** | "MIRACLE AT THE HORN!" | Last-second make |
| **Character-specific** | "MOSES PARTS THE LANE!" / "JORDAN ASCENDING!" | Per character |

### Questions to Answer

- [ ] AI-generated voices or hire voice actor(s)?
- [ ] How many total lines needed for variety? (target: 200+)
- [ ] Text-to-speech for prototyping first?

---

## SECTION 7: UI/UX DESIGN

### Screens Needed

1. **Title/Splash** - Logo, "Press Start", mode select
2. **Team Select** - Show all pairs, highlight, confirm
3. **Pre-game** - Matchup display, special moves preview
4. **In-game HUD** - Score, time, meters, portraits
5. **Pause** - Resume, settings, quit
6. **Post-game** - Winner celebration, stats, rematch?
7. **Settings** - Sound, controls, difficulty

### HUD Layout Concept

```
┌──────────────────────────────────────────────────────┐
│ [P1 Portrait][🔥Meter]  2:45 Q3  [🔥Meter][P2 Portrait] │
│                     45 - 38                            │
│                                                        │
│                    [COURT VIEW]                        │
│                                                        │
│ [Special Ready!]                        [Special: 80%] │
└──────────────────────────────────────────────────────┘
```

### Logo/Branding Considerations

- Main logo should work on dark and light backgrounds
- Icon version for app stores (1024x1024)
- Loading screen variants
- Favicon for web version

---

## SECTION 8: PLATFORM STRATEGY

### Priority Order

1. **Web (Desktop)** - Fastest iteration, widest reach
2. **Web (Mobile)** - Same build, touch controls
3. **PWA Install** - Add to home screen
4. **App Store/Play Store** - If successful, wrap in Capacitor/Cordova

### Technical Considerations

| Platform | Input | Resolution | Performance |
|----------|-------|------------|-------------|
| Desktop Web | Keyboard/Gamepad | 1920x1080 | High |
| Tablet | Touch | 2048x1536 | Medium-High |
| Mobile | Touch | 1080x1920 (portrait?) | Medium |

### Questions to Answer

- [ ] Force landscape orientation or support portrait?
- [ ] How small can touch targets be?
- [ ] Gamepad support priority?

---

## SECTION 9: AUDIO

| Audio Type | Description | Priority |
|------------|-------------|----------|
| **Theme music** | Epic orchestral + hip-hop beat | High |
| **Menu music** | Chill instrumental | Medium |
| **Crowd sounds** | Cheers, gasps, chants | High |
| **Ball sounds** | Dribble, swish, rim, bounce | High |
| **Sneaker squeaks** | Court movement | Medium |
| **Special ability SFX** | Fire, thunder, shofar blast | High |
| **Victory fanfare** | Win celebration | Medium |

---

## SECTION 10: SCOPE DECISIONS

### MVP Scope

- [ ] 2 teams only (Jordan/Moses vs LeBron/David)?
- [ ] AI opponent or local multiplayer first?
- [ ] One court or multiple?

### Feature Depth

- [ ] Season/tournament mode or just exhibition?
- [ ] Unlockables/progression or everything available?
- [ ] Online multiplayer? (adds significant complexity)
- [ ] Leaderboards/stats tracking?

### Art Approach

- [ ] Commission sprites or generate with AI?
- [ ] How many animation frames per action?
- [ ] Consistent style with card art or new direction?

### Audio Approach

- [ ] Stock sounds + AI voice, or custom everything?
- [ ] Budget for voice actor(s)?

### Timeline

- [ ] Target launch date/event?
- [ ] Internal playtesting only or public beta?

---

## SECTION 11: SUCCESS METRICS

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Playability** | Fun within 30 seconds | User testing |
| **Session length** | 5+ minutes average | Analytics |
| **Return rate** | 30%+ come back | Analytics |
| **Shareability** | People screenshot/share | Social tracking |
| **Learning curve** | Pick up in <1 minute | Observation |
| **Performance** | 60fps on mid-tier devices | Testing |

---

## SECTION 12: RISKS & MITIGATIONS

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Scope creep** | High | Start with 2 teams, one mode |
| **Art bottleneck** | High | Use AI generation, simple style |
| **Announcer cringe** | Medium | Prototype with text, test lines |
| **Mobile controls bad** | Medium | Test early, iterate on touch zones |
| **Performance issues** | Medium | Profile early, limit particles |
| **Legal concerns** | Low | Stylized art, no real likenesses |

---

## IMPLEMENTATION PHASES

### Phase 1: Playable Prototype
- 2 teams (Jordan/Moses vs LeBron/David)
- Basic controls (move, shoot, pass)
- Simple court, no special moves
- Desktop web only

### Phase 2: Core Features
- Special abilities system
- Announcer system (text first, then audio)
- All 6 teams
- "Blessed" fire mechanic

### Phase 3: Polish
- Full art assets
- Audio (music, SFX, voice)
- UI/menus complete
- Mobile touch controls

### Phase 4: Platform Expansion
- Cross-platform testing
- Performance optimization
- PWA support

### Phase 5: Launch
- Soft launch for feedback
- Iterate based on playtesting
- Full release

---

## DECISIONS LOG

*Record key decisions here as they're made:*

| Date | Decision | Rationale |
|------|----------|-----------|
| | | |

