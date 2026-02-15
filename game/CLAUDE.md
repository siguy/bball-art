# Holy Hoops - Game Development Guide

Part of **Court & Covenant** - NBA Jam-style basketball game pairing NBA legends with biblical figures.

## Progress Tracking

**Active plan:** `~/.claude/plans/holy-hoops-experimental.md` (100% complete)
**Branch:** `feat/experimental-gameplay`
**Worktree:** `/Users/simonbrief/bball-art-experimental/`

| Phase | Status |
|-------|--------|
| Phase 1: Ball State Machine | ✅ Complete |
| Phase 2: Stun Timer + Loose Ball Physics | ✅ Complete |
| Phase 3: Turbo System | ✅ Complete |
| Phase 4: Blocking + Defensive Pressure | ✅ Complete |
| Phase 5: Game Juice | ✅ Complete |
| Phase 6: Integration + Polish | ✅ Complete |
| Phase 7: Touch Controls (Mobile/iPad) | ✅ Complete |

## Quick Start

```bash
cd game
npm run dev                    # Dev server (keyboard only)
npx vite --port 5174 --host   # Dev server accessible on local network (for phone/iPad testing)
npm test                       # Run Playwright tests
```

**Mobile testing:** Open `http://<your-mac-ip>:5174/` on your phone/iPad (same WiFi network).

## Architecture

```
src/
├── main.js              # Phaser config (1280x720, gravity 800, 3 touch pointers)
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

### Keyboard

| Key | Action |
|-----|--------|
| WASD / Arrows | Move left/right |
| Space (tap) | Jump |
| Space (hold + release at apex) | Shoot (timing matters) |
| Space (in dunk range + turbo) | Auto-dunk |
| Shift (hold) | Turbo (drains meter, boosts speed/jump/accuracy) |
| Tab | Switch active player |
| E | Pass to teammate |
| Down | Steal (30% chance, no turbo) |
| Down (with turbo) | Shove (always works, knocks back) |
| I | Toggle debug mode |

### Touch (Mobile/iPad)

| Input | Action |
|-------|--------|
| Left half: touch + drag | Floating joystick (movement) |
| Joystick pushed far (past threshold) | Turbo (replaces Shift) |
| Button A (offense, has ball) | SHOOT — jumps + auto-releases at apex |
| Button A (offense, near hoop + turbo) | DUNK — auto-triggers |
| Button A (defense, close to carrier) | STEAL (or SHOVE with turbo) |
| Button A (defense, not close) | BLOCK — jumps to intercept shots |
| Button B (offense) | PASS to teammate |
| Button B (defense) | SWITCH active player |

**Touch design research:** Based on NBA Jam mobile (EA, 2011) slide-between-buttons pattern, Brawl Stars floating joystick, and Call of Duty Mobile joystick-threshold-for-sprint. Key sources:
- [NBA Jam iOS Review - Retro Sports Gamer](https://retrosportsgamer.wordpress.com/2012/03/17/ios-mini-review-nba-jam/)
- [Microsoft Touch Layout Designer's Guide](https://learn.microsoft.com/en-us/gaming/gdk/docs/features/common/game-streaming/building-touch-layouts/game-streaming-tak-designers-guide)
- [Mobile Touch Control Design - Less Is More](https://mobilefreetoplay.com/touch-control-design-less-is-more/)

## Core Systems

### Ball State Machine

Single source of truth for ball ownership (replaces scattered booleans):

```javascript
this.ballState = 'CARRIED' | 'IN_FLIGHT' | 'LOOSE';
this.ballOwner = entity | null;    // Any player or opponent
this.lastThrower = entity | null;  // Who last shot/passed
```

All transitions go through unified methods:
- `pickupBall(entity)` — any entity picks up the ball (with precondition checks)
- `shootBall(player, targetHoopX)` — sets IN_FLIGHT + lastThrower
- `makeBallLoose(fromEntity)` — sets LOOSE + adds drag
- `passBall(fromPlayer)` — sets IN_FLIGHT toward teammate

### Stun System

Per-entity `stunTimer` prevents all actions while active:
- **Shove stun**: 60 frames (1 second), visual flash
- **Steal stun**: 15 frames (0.25 seconds)
- Stunned entities: can't move, shoot, steal, pick up ball, or run AI

### Per-Entity Pickup Cooldown

`entity.pickupCooldown` prevents instant re-grabs:
- After shooting: 30 frames
- After being stolen from: 45 frames
- After being shoved: 60 frames

### Turbo System

Hold Shift (keyboard) or push joystick far (touch) to activate:
- **Meter**: 0-100, drains at 0.5/frame, recharges at 0.15/frame (~11s full recharge)
- **Speed boost**: 250→375 (player), 200→300 (AI)
- **Jump boost**: -550→-700 velocity
- **Dunk**: Requires turbo to be active
- **Shot accuracy**: +15% bonus while turbo active
- **Shove**: Requires turbo (Turbo+Down replaces old Shift+Down)
- **AI turbo**: Opponents use turbo when attacking/chasing (meter > 30)
- **Visual**: Yellow bar under each entity (yellow when active, gray when charging)

### Blocking

Jump-timed blocks that swat the ball away:
- **Detection**: Airborne defender within 40px of IN_FLIGHT ball, opposing team only
- **Minimum flight time**: 10 frames (prevents false blocks on just-released ball)
- **Legal block**: Ball swatted away (300px/s), "REJECTED!" popup, screen shake
- **Goaltending**: Blocking on downward arc near hoop = basket counts for shooter
- **AI blocking**: Defenders jump to intercept nearby shots (within 120px, ball velocity < 100)

### Defensive Pressure

Nearby defenders reduce shot accuracy:
- **< 60px**: accuracy × 0.6 (heavily contested, "CONTESTED!" popup)
- **60-120px**: accuracy × 0.85 (lightly contested)
- **> 120px**: no penalty (open shot)
- Applied to both player and AI shots

### Game Juice

- **Screen shake**: Dunk (200ms, 0.01), Block (100ms, 0.008), Shove (80ms, 0.005)
- **Hit-stop**: Dunk (100ms at 0.3x speed), Block (80ms at 0.5x speed)
- **Flash**: White flash on red score, purple flash on opponent score
- **Ball trail**: 8-position fading orange trail when ball is IN_FLIGHT

### Teammate AI

Inactive red player plays autonomously:
- **ATTACK**: Has ball → drives to right hoop, shoots/dunks
- **DEFEND**: Opponent has ball → guards assigned opponent, attempts steals (25% chance)
- **CHASE_BALL**: Ball loose + closer than active player → chases ball
- **SUPPORT**: Active player has ball → runs ahead to get open for passes

### Opponent AI

Two purple opponents with independent state machines:
- **ATTACK**: Has ball → drives to left hoop, shoots (70% accuracy) or dunks
- **DEFEND**: Red team has ball → guards assigned player, attempts steals, jumps to block shots
- **CHASE_BALL**: Ball loose → closest opponent chases (prevents stacking)
- **SUPPORT**: Other opponent has ball → stays open
- **Turbo**: Uses turbo when attacking/chasing (meter > 30), saves on defense

### Dribbling

- Ball bounces to floor while carrier moves on ground (1 bounce/sec)
- Works for all entities (players and opponents)
- Ball positioned on side carrier is moving (left/right)
- NBA Jam rules: no double dribble (can dribble, jump, continue dribbling)

## Key Methods (GameScene.js)

| Method | Purpose |
|--------|---------|
| `update()` | Main game loop — input, physics, state |
| `updateTeammateAI()` | Inactive red player AI |
| `updateAI()` | Both opponent AIs |
| `pickupBall(entity)` | Unified ball pickup with precondition checks |
| `shootBall(player, targetHoopX)` | Shoot with accuracy + defensive pressure |
| `aiShoot(opponent)` | AI shooting toward left hoop |
| `performDunk(player)` / `aiDunk(opponent)` | Launch dunk trajectory |
| `completeDunk()` / `completeAIDunk()` | Score on dunk completion |
| `performSteal()` / `performShove()` | Player defensive actions |
| `aiAttemptSteal(opponent)` / `teammateAttemptSteal()` | AI steal attempts |
| `checkForBlocks()` | Block detection + goaltending |
| `passBall(fromPlayer)` | Pass to teammate |
| `makeBallLoose(fromEntity)` | Set ball LOOSE with drag |
| `setupTouchControls()` | Initialize touch UI |
| `showFeedback(text, color)` | Popup near active player |
| `showCenterFeedback(text, color)` | Center-screen popup |

## Testing

```bash
npm test                                            # Run all tests
npx playwright test test/visual-playtest.spec.js    # 60-second automated gameplay
./test/run-visual-test.sh                           # Full visual test with dev server
./test/run-visual-test.sh --headed                  # Watch the browser
```

Visual playtest outputs:
- Screenshots every ~5 seconds in `test-results/visual-playtest/`
- `gameplay-summary.json` with scores, action counts, final state

## Tuning

```javascript
// Player
speed = 250;                  // Normal movement speed
turboSpeed = 375;             // With turbo (1.5x)
jumpVelocity = -550;          // Normal jump
turboJumpVelocity = -700;     // Turbo jump (also dunk height)
dunkRange = 200;              // Distance to trigger dunk

// Turbo
turboMax = 100;
turboDrainRate = 0.5;         // Per frame while held
turboRechargeRate = 0.15;     // Per frame while released
turboAccuracyBonus = 0.15;    // +15% shot accuracy

// Stun
shoveStunFrames = 60;         // 1 second
stealStunFrames = 15;         // 0.25 seconds

// Per-Entity Pickup Cooldown
shooterCooldown = 30;         // After shooting
stolenFromCooldown = 45;      // After being stolen from
shovedCooldown = 60;          // After being shoved

// Blocking
blockRange = 40;              // Distance from entity top to ball
ballFlightTimeMin = 10;       // Frames before blocks can trigger
aiBlockRange = 120;           // AI jumps to block within this range

// Defensive Pressure
heavyContestRange = 60;       // accuracy × 0.6
lightContestRange = 120;      // accuracy × 0.85

// Loose Ball
ballBounce = 0.6;
ballDrag = 50;                // Applied only when LOOSE

// AI
aiSpeed = 200;                // Normal (turbo = 300)
aiAccuracy = 0.7;             // 70% base shooting accuracy
aiShootChance = 0.03;         // ~3% per frame in range
aiDunkChance = 0.03;          // ~3% per frame in dunk zone
aiStealChance = 0.25;         // 25% per attempt
aiStealCooldown = 90;         // Frames between steal attempts

// Camera
worldWidth = 1470;
cameraLerp = 0.08;

// Touch Controls
joystickTurboThreshold = 40;  // px from center to activate turbo
joystickMaxDist = 60;         // px max joystick travel
buttonARadius = 45;           // SHOOT/STEAL/BLOCK button
buttonBRadius = 35;           // PASS/SWITCH button
touchAutoShootDelay = 400;    // ms — auto-release at apex
```
