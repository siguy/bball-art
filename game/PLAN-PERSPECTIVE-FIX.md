# Holy Hoops - Perspective Fix + Control Guide

## Problem
The current implementation uses **top-down** perspective, but NBA Jam uses **side-scrolling with pseudo-3D depth**.

## NBA Jam Perspective (What We Need)

```
     ┌─────────────────────────────────────────────────┐
     │  SCORE: 12 - 8              TIME: 1:23          │
     ├─────────────────────────────────────────────────┤
     │                                                 │
     │  [HOOP]                              [HOOP]     │  ← Far from camera (small sprites)
     │     │                                   │       │
     │     │      o  o        o  o             │       │  ← Players (scaled by Y)
     │     │                                   │       │
     │  ═══╧═══════════════════════════════════╧═══    │  ← Court floor (angled)
     │                                                 │  ← Close to camera (large sprites)
     └─────────────────────────────────────────────────┘
```

**Key Differences from Current:**
| Aspect | Current (Wrong) | NBA Jam (Correct) |
|--------|-----------------|-------------------|
| View | Top-down (bird's eye) | Side view (camera at court level) |
| X-axis | Left/Right on court | Left/Right on court ✓ |
| Y-axis | Up/Down on court | DEPTH (near/far from camera) |
| Hoops | Top and bottom of screen | Left and right ends of screen |
| Jumping | None | Essential (dunks, blocks) |
| Gravity | None | Yes (players fall after jumping) |
| Sprite scaling | None | Yes (bigger = closer to camera) |

---

## Changes Required

### 1. Physics Configuration
**File: `src/main.js`**
- Add gravity: `gravity: { y: 800 }` (players need to fall after jumping)

### 2. Court Rendering
**File: `src/scenes/GameScene.js`**
- Redraw court as side-view trapezoid (wider at bottom = closer to camera)
- Move hoops to LEFT and RIGHT edges of screen
- Court floor is a platform players stand on

### 3. Player Entity
**File: `src/entities/Player.js`**
- Add `jump()` method with upward velocity
- Add `isGrounded` check (can only jump when on ground)
- Add sprite scaling based on Y position (depth)
- Add `turbo` state for speed boost
- Ground level varies by Y position (depth perspective)

### 4. Hoop Entity
**File: `src/entities/Hoop.js`**
- Reposition to left/right edges
- Render as side-view (backboard visible, rim facing inward)
- Adjust scoring zone for new perspective

### 5. Ball Physics
**File: `src/entities/Ball.js`**
- Arc trajectory still works, but needs gravity
- Shot goes UP and toward hoop (not just horizontally)

### 6. Controls
**File: `src/systems/InputManager.js`**
- Add TURBO button (Shift on keyboard, dedicated touch button)
- Shoot = Space (context: shoot on offense, block/jump on defense)
- Pass = E key (context: pass on offense, steal on defense)

### 7. Control Guide Overlay (NEW)
**File: `src/ui/ControlGuide.js`** (new file)
- Toggle with `?` key or touch button
- Shows current controls based on platform (keyboard vs touch)
- Semi-transparent overlay, doesn't pause game

### 8. AI Controller
**File: `src/systems/AIController.js`**
- Update movement to work with new perspective
- Add jumping behavior for blocks/dunks

---

## Implementation Order

### Step 1: Core Perspective Change (GameScene + Player)
1. Update physics config to add gravity
2. Rewrite court rendering as side-view
3. Move hoops to left/right
4. Add ground collision for players
5. Add jump() to Player with grounded check
6. Test: Players should stand on court floor and be able to jump

### Step 2: Depth System
1. Add Y-axis as depth (up = far, down = close)
2. Implement sprite scaling based on Y position
3. Add depth-based ground level (court floor angle)
4. Test: Moving up/down should scale player sprites

### Step 3: Shooting & Ball
1. Update ball trajectory for side-view
2. Ball arcs UP toward hoop
3. Gravity affects ball flight
4. Test: Shots should arc properly toward hoops

### Step 4: Controls Update
1. Add turbo to InputManager
2. Update touch controls layout
3. Add control guide overlay
4. Test: All controls work on keyboard and touch

### Step 5: AI Update
1. Update AI for new movement system
2. Add jumping behavior
3. Test: AI plays reasonably in new perspective

---

## Control Guide Content

### Desktop Controls
```
┌─────────────────────────────┐
│      CONTROLS (Desktop)     │
├─────────────────────────────┤
│  WASD / Arrows  = Move      │
│  Space          = Shoot     │
│  E              = Pass      │
│  Shift (hold)   = Turbo     │
│  Tab            = Switch    │
│  ?              = This help │
└─────────────────────────────┘
```

### Touch Controls
```
┌─────────────────────────────┐
│       CONTROLS (Touch)      │
├─────────────────────────────┤
│  Left Joystick  = Move      │
│  SHOOT button   = Shoot     │
│  PASS button    = Pass      │
│  TURBO button   = Turbo     │
│  Tap teammate   = Switch    │
│  ? button       = This help │
└─────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/main.js` | Add gravity to physics config |
| `src/scenes/GameScene.js` | Rewrite court rendering, hoop positions, ground physics |
| `src/entities/Player.js` | Add jump(), turbo, sprite scaling, grounded check |
| `src/entities/Hoop.js` | Reposition, side-view rendering |
| `src/entities/Ball.js` | Update trajectory for gravity |
| `src/systems/InputManager.js` | Add turbo button, update touch layout |
| `src/systems/AIController.js` | Update for new movement, add jumping |

## New Files

| File | Purpose |
|------|---------|
| `src/ui/ControlGuide.js` | Toggleable control overlay |

---

## Verification

1. `npm run dev` - game loads
2. Players stand on court floor (gravity works)
3. Space makes player jump
4. Hoops visible on left and right
5. Shooting arcs toward hoops
6. `?` key shows control guide
7. Touch controls work on iPad
8. AI jumps and plays in new perspective

---

## Invoke Command

To implement this plan in a fresh Claude Code session:

```
Implement the plan in /Users/simonbrief/bball-art/game/PLAN-PERSPECTIVE-FIX.md

Work autonomously through all 5 steps. Check in after:
1. Step 1 complete (perspective working)
2. All steps complete (ready to test)

Use parallel agents where possible. Accept all file edits.
```
