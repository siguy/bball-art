# Holy Hoops - Game Development Guide

Part of **Court & Covenant** - NBA Jam-style basketball game pairing NBA legends with biblical figures.

## Progress Tracking

**Active plan:** `~/.claude/plans/holy-hoops-game.md` (55% complete)

| Build | Status |
|-------|--------|
| BUILD 1: One Player Scores | ✅ Steps 1-8 complete (ready for family playtest) |
| BUILD 2: Full 2v2 Game | 🔲 Not started |
| BUILD 3: Polish & iPad | 🔲 Not started |

**Reference docs:**
- `PLAN-ORIGINAL.md` - Family dev plan with parallel agent prompts
- `../docs/covenant-jam-game-plan.md` - Full game design (roster, art, audio specs)

## Quick Start

```bash
cd game
npm run dev          # Development server at http://localhost:5176
npm run preview      # Production preview (use for iPad testing)
npm test             # Run Playwright tests
```

## Current State: BUILD 1 Complete

Single player scoring mechanics are working:
- Movement, jumping, shooting, dunking
- Score tracking with visual feedback
- Ball physics with gravity

## Architecture

```
src/
├── main.js              # Phaser config (1280x720, gravity 800)
├── scenes/
│   ├── BootScene.js     # Asset loading (minimal)
│   ├── MenuScene.js     # Title screen, Space/tap to start
│   ├── GameScene.js     # Core gameplay (ALL game logic here)
│   └── GameOverScene.js # Results display (not used yet)
├── entities/            # (Not used - logic in GameScene)
├── systems/             # (Not used - logic in GameScene)
└── config/
    └── teams.js         # Team data (for future builds)
```

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrows | Move left/right |
| Space (tap) | Jump |
| Space (hold + release) | Shoot at apex for accuracy |
| Space (in dunk range) | Auto-dunk |
| Down | Steal (30% chance) |
| Shift+Down | Shove (always works) |
| I | Toggle debug mode |

## Game Mechanics

### Shooting
1. Hold Space to jump
2. Release at apex (low velocity) = PERFECT shot
3. Release early/late = less accurate
4. Long range (400+ px) requires tighter timing

### Dunking
1. Move close to hoop (player turns **gold**)
2. Press Space = player flies to rim with ball
3. "SLAM DUNK!" appears when ball goes through
4. Works from 200px before to 50px past the hoop

### Visual Feedback
- **Gold player**: In dunk range, ready to dunk
- **Red player**: Has ball, normal
- **Dark red player**: No ball
- **Debug mode (` key)**: Shows ground state, ball ownership, distances, cooldowns; also reveals scoring zones

### Ball Pickup
- Ball returns after scoring
- 30-frame cooldown after shots
- 60-frame cooldown after dunks

### Rim Physics
- **Backboard**: Ball bounces off (static physics body at x=1100)
- **Rim edges**: Two 8x8 colliders at x=1045/1095 (50px opening)
- **Scoring zones**: 40px wide, entry at y=325, exit at y=360 (hidden by default, visible in debug mode)
- **Two-zone detection**: Ball must pass through entry zone, then exit zone with downward velocity
- Shot trajectory targets entry zone (y=325) so ball arcs down through both zones
- Shots can bank off backboard and go in
- Shots can bounce off rim and miss

### Dribbling
- Ball bounces to floor while player moves on ground (1 bounce/sec)
- Ball positioned on side player is moving (left side when going left, right when going right)
- Smooth transition when changing direction (lerp 0.8)
- Stops bouncing when jumping, stationary, or dunking

### Defense
- **Opponent**: Purple rectangle at x=700, stationary dummy (AI in BUILD 2), starts with ball
- **Steal (Down)**: 30% chance when close (<70px), 80-frame cooldown on fail
- **Shove (Shift+Down)**: 100% success, knocks opponent back 100px, 60-frame cooldown
- **Loose ball**: Drops with gravity, first to touch picks up

## Key Files

**GameScene.js** - All gameplay logic:
- `update()` - Main game loop (jump, shoot, move, dunk checks)
- `performDunk()` - Calculate trajectory to rim
- `completeDunk()` - Score + "SLAM DUNK!" text
- `shootBall()` - Release with accuracy-based trajectory
- `onScore()` - Regular shot scoring
- `onBallPickup()` - Ball collection with cooldown

## Testing

```bash
npm test                              # Run all tests
npm run test:headed                   # See browser
npx playwright test test/dunk-debug.spec.js  # Dunk-specific tests
```

Tests verify:
- Dunk triggers in range, scores 2 points
- Shot releases ball with velocity toward hoop
- Movement works during jumps

## BUILD 2 (Next)

- [ ] Second player (teammate)
- [ ] Two opponents (purple team with AI)
- [ ] Passing (E key)
- [ ] Player switching (Tab)
- [ ] Second hoop on left
- [ ] Scoreboard: RED vs PURPLE
- [ ] 2-minute timer

## BUILD 3 (After)

- [ ] Teammate AI (helps you)
- [ ] BLESSED! mode (3 consecutive = power up)
- [ ] Touch controls for iPad
- [ ] Help screen (? key)

## Tuning

```javascript
// In GameScene.js - Player
speed = 250;              // Player movement speed
jumpVelocity = -550;      // Normal jump height
dunkJumpVelocity = -700;  // Dunk jump height (higher)
dunkRange = 200;          // Distance to trigger dunk
ballPickupCooldown = 30;  // Frames after shot
dunkPickupCooldown = 60;  // Frames after dunk

// In GameScene.js - Rim/Scoring (adjust difficulty)
rimLeft.x = 1045;         // Left rim edge (decrease = harder)
rimRight.x = 1095;        // Right rim edge (increase = harder)
scoreZoneWidth = 40;      // Scoring zone width (decrease = harder)
shotTargetY = 325;        // Where shots aim (matches entry zone)
```
