# Holy Hoops - Game Development Guide

Part of **Court & Covenant** - NBA Jam-style basketball game pairing NBA legends with biblical figures.

## Progress Tracking

**Active plan:** `~/.claude/plans/holy-hoops-game.md` (65% complete)

| Build | Status |
|-------|--------|
| BUILD 1: One Player Scores | ✅ Steps 1-8 complete |
| BUILD 2: Full 2v2 Game | 🟡 Step 10.4 complete (AI state machine) |
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

## Current State: BUILD 2 In Progress

Two-player team mechanics working:
- Teammate at x=350, Tab to switch control
- Yellow outline shows active player
- E to pass ball to teammate
- Both players can shoot/dunk when carrying ball

Camera scrolling (Step 10.1):
- World 1470px wide (extended court for two hoops)
- Camera follows ball carrier → loose ball → active player
- Smooth lerp (0.08) for natural panning
- Inactive teammate auto-moves to stay visible
- UI elements fixed to screen (scrollFactor 0)

Two hoops with scoring (Step 10.2):
- Right hoop at x=1270 (RED scores here)
- Left hoop at x=210 (PURPLE scores here)
- Both hoops have backboard, rim, rim edges, and white mesh nets
- Scoreboard: "RED: X" (left) and "PURPLE: X" (right)
- 0.5s delay after scoring shows ball falling through net
- Scored-on team takes ball out behind their basket

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
| Tab | Switch active player |
| E | Pass to teammate |
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
- **Debug mode (I key)**: Shows ground state, ball ownership, distances, cooldowns; also reveals scoring zones

### Ball Pickup
- Ball returns after scoring
- 30-frame cooldown after shots
- 60-frame cooldown after dunks

### Rim Physics (Both Hoops)
- **Right hoop**: Backboard x=1300, rim x=1270, rim edges x=1245/1295
- **Left hoop**: Backboard x=180, rim x=210, rim edges x=185/235
- **Nets**: White mesh graphics below each rim
- **Scoring zones**: 40px wide, entry at y=325, exit at y=360 (visible in debug mode)
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
- **Opponents**: Two purple rectangles at x=500 and x=700, with gravity
- **`this.opponents` array**: For iterating over both opponents
- **`this.opponentBallCarrier`**: Tracks which opponent has the ball
- **Steal (Down)**: 30% chance when close (<70px) to ball carrier, 80-frame cooldown on fail
- **Shove (Shift+Down)**: 100% success, knocks ball carrier back 100px, 60-frame cooldown
- **Loose ball**: Drops with gravity, first to touch picks up

### AI State Machine
- **States**: `CHASE_BALL`, `ATTACK`, `DEFEND`
- **`updateAI()`**: Called each frame, updates state for all opponents
- **State logic**:
  - Ball loose → `CHASE_BALL`
  - Has ball → `ATTACK`
  - Otherwise → `DEFEND`
- **Debug display**: Shows AI states as first letters (A/D/C)

### AI Behaviors
- **CHASE_BALL**: Closest opponent moves toward ball (speed 200)
- **ATTACK**: Ball carrier drives toward left hoop, stops in shoot/dunk range
- **DEFEND**: Shadow active player, stay 80px to the right
- AI only moves when on ground (no mid-air adjustments)

## Key Files

**GameScene.js** - All gameplay logic:
- `update()` - Main game loop (jump, shoot, move, dunk checks)
- `updateAI()` - AI state transitions and behaviors
- `performDunk()` - Calculate trajectory to rim
- `completeDunk()` - Score + "SLAM DUNK!" text
- `shootBall()` - Release with accuracy-based trajectory
- `onScore()` - Player scores at right hoop
- `onOpponentScore()` - Opponent scores at left hoop
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

- [x] Second player (teammate)
- [x] Two opponents (purple team)
- [ ] Opponent AI
- [x] Passing (E key)
- [x] Player switching (Tab)
- [x] Second hoop on left
- [x] Scoreboard: RED vs PURPLE
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

// In GameScene.js - Right Hoop (player scores here)
rightBackboard.x = 1300;  // Backboard position
rightRim.x = 1270;        // Rim center
rightRimEdges = 1245/1295;// 50px opening

// In GameScene.js - Left Hoop (opponent scores here)
leftBackboard.x = 180;    // Backboard position
leftRim.x = 210;          // Rim center
leftRimEdges = 185/235;   // 50px opening

// In GameScene.js - Camera
worldWidth = 1470;        // Court width (extended for two hoops)
cameraLerp = 0.08;        // Follow smoothness (lower = smoother)
screenMargin = 60;        // Min distance from camera edge for entities

// In GameScene.js - AI
aiSpeed = 200;            // Opponent movement speed (player = 250)
leftHoopX = 210;          // AI target hoop (opponents score here)
shootRange = 400;         // AI stops to shoot at this distance
dunkRange = 180;          // AI stops to dunk at this distance
guardDistance = 80;       // How far DEFEND stays from player
```
