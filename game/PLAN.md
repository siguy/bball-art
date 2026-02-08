# Holy Hoops MVP - Development Plan

## Decisions Made
- **Name**: Holy Hoops (Court & Covenant: Holy Hoops)
- **Teams**: 2 (Jordan/Moses vs LeBron/David)
- **Perspective**: Top-down (classic NBA Jam)
- **Art Style**: Pixel art (placeholder rectangles for MVP)
- **Mode**: Single player vs AI
- **Fire Mechanic**: "BLESSED!" mode (golden aura)
- **Primary Platform**: iPad/tablet (touch-first, dev on desktop)
- **Directory**: `/game/`
- **Build Tool**: Vite
- **Timeline**: TODAY - playable prototype

---

## What "Playable Today" Means

A working game loop with:
- [ ] Court visible
- [ ] 2 characters per team (4 total)
- [ ] Movement controls (keyboard + touch)
- [ ] Ball possession and passing
- [ ] Shooting with basic physics
- [ ] Scoring and scoreboard
- [ ] Simple AI (move toward ball/basket)

### Stretch Goals (Phase 2 - today if time)
- [ ] "BLESSED!" mode (golden aura on scoring streak)
- [ ] Basic sound effects
- [ ] Character name callouts

### NOT Today
- Polished pixel art sprites
- Announcer voice lines
- Team select screen
- Multiple courts
- Online multiplayer

---

## File Structure

```
/game/
├── package.json
├── vite.config.js
├── index.html
├── CLAUDE.md
├── PLAN.md (this file)
└── src/
    ├── main.js           # Entry point, Phaser config
    ├── scenes/
    │   ├── BootScene.js      # Load assets
    │   ├── MenuScene.js      # Title screen
    │   ├── GameScene.js      # Main gameplay
    │   └── GameOverScene.js  # Winner display
    ├── entities/
    │   ├── Player.js         # Character class
    │   ├── Ball.js           # Ball physics
    │   └── Hoop.js           # Basket/scoring zone
    ├── systems/
    │   ├── AIController.js   # Simple AI logic
    │   └── InputManager.js   # Keyboard + touch
    └── config/
        └── teams.js          # Team data
```

---

## Team Data

**Team 1: Jordan + Moses**
- Colors: Red (#e63946)
- Jordan: Speed 280, Accuracy 85%
- Moses: Speed 240, Accuracy 75%

**Team 2: LeBron + David**
- Colors: Purple (#7b2cbf)
- LeBron: Speed 270, Accuracy 80%
- David: Speed 260, Accuracy 78%

---

## Controls

### Desktop
- WASD / Arrow Keys: Move
- Space: Shoot
- Shift: Pass
- Tab: Switch player

### Touch (iPad)
- Left side: Virtual joystick
- Right side: Shoot button (large), Pass button (smaller)
- Tap teammate: Switch control

---

## Success Criteria

1. Game loads in browser
2. Can move a player with keyboard
3. Can move a player with touch
4. Ball follows player
5. Can shoot at basket
6. Ball goes in sometimes (scoring works)
7. AI moves and tries to play
8. Score displays and updates
9. Game feels like basketball (even if rough)

---

## Run Commands

```bash
# Development
cd game && npm run dev

# Access on iPad (same network)
# Find your IP: ifconfig | grep inet
# Visit: http://YOUR_IP:5173
```

---

## Milestones

1. **Setup Complete** - npm install, structure ready
2. **Core Gameplay** - Movement and shooting work
3. **AI Functional** - Playable game against opponent
4. **Touch Ready** - iPad testing ready
5. **BLESSED Mode** - Streak mechanic working (stretch)
